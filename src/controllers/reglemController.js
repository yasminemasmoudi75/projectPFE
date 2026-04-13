const { TabReg, TabRegD, TabRegF, TabModReg, FavMaster, BlvMaster, Tiers, sequelize } = require('../models');
const { Op, QueryTypes } = require('sequelize');
const { randomUUID } = require('crypto');
const { resolveUserAccess } = require('../utils/userAccess');

// Determine payment status helper
const getPaymentStatus = (totalAmount, paidAmount) => {
    const remainingAmount = totalAmount - paidAmount;

    if (totalAmount === 0) return 'Aucun montant';
    if (remainingAmount <= 0) return 'Payé';
    if (paidAmount > 0 && remainingAmount < totalAmount * 0.25) return 'Presque payé';
    if (paidAmount > 0) return 'Partiellement payé';
    return 'Non payé';
};

const isIsoDateOnly = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));

const toSqlDateLiteral = (value, { endOfDay = false } = {}) => {
    if (!isIsoDateOnly(value)) return sequelize.literal('GETDATE()');
    const time = endOfDay ? '23:59:59' : '00:00:00';
    return sequelize.literal(`CONVERT(datetime, '${value} ${time}', 120)`);
};

// Build filter for clients - they only see their own payments
const buildClientFilter = async (user = {}) => {
    const userEmail = (user?.EmailPro || '').toLowerCase().trim();
    const userLogin = (user?.LoginName || '').toLowerCase().trim();
    const directCodTiers = user?.CodTiers || user?.codTiers || null;

    console.log(`🔍 buildClientFilter - email: ${userEmail}, login: ${userLogin}, CodTiers: ${directCodTiers}`);

    const orConditions = [];

    // Add CodTiers from user object if available (PRIMARY MATCH)
    if (directCodTiers) {
        console.log(`✅ Adding direct CodTiers: ${directCodTiers}`);
        orConditions.push({ CodTiers: directCodTiers });
    }

    // Lookup CodTiers by Email from Tiers table (SECONDARY MATCH)
    if (userEmail) {
        try {
            const tiers = await Tiers.findOne({
                where: sequelize.where(sequelize.fn('LOWER', sequelize.col('Email')), Op.eq, userEmail),
                attributes: ['CodTiers'],
            });

            if (tiers?.CodTiers) {
                console.log(`✅ Found Tiers CodTiers: ${tiers.CodTiers}`);
                // Only add if not already in conditions
                if (!orConditions.some(c => c.CodTiers === tiers.CodTiers)) {
                    orConditions.push({ CodTiers: tiers.CodTiers });
                }
            }
        } catch (err) {
            console.error('Error finding Tiers for client filter:', err.message);
        }
    }

    console.log(`📋 Final conditions count: ${orConditions.length}`);
    console.log(`📋 Conditions:`, JSON.stringify(orConditions));

    if (orConditions.length === 0) {
        console.warn('⚠️ NO conditions found - client will see no data');
        return { CodTiers: '__NO_MATCH__' };
    }

    // If only one condition, return it directly
    if (orConditions.length === 1) {
        console.log(`✅ Single condition (no OR needed):`, JSON.stringify(orConditions[0]));
        return orConditions[0];
    }

    // Multiple conditions - use OR
    const result = { [Op.or]: orConditions };
    console.log(`✅ Using OR operator with ${orConditions.length} conditions`);
    return result;
};

// ─── CREATE REGLEMENT ───────────────────────────────────────────────────────────────────
exports.createReglement = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { codTiers, libTiers, mntReg, datReg, selectedDocs = [], payments = [] } = req.body;

        if (!codTiers || !mntReg) {
            return res.status(400).json({ status: 'error', message: 'Client et montant obligatoires' });
        }

        const reglementId = randomUUID();
        console.log(`🧾 createReglement - reglementId: ${reglementId}`);

        // 1. Create Master Record
        const newReglement = await TabReg.create({
            IDReg: reglementId,
            DatReg: toSqlDateLiteral(datReg),
            CodTiers: codTiers,
            LibTiers: libTiers || codTiers,
            MntReg: parseFloat(mntReg),
            Payed: true, // If detail lines are provided, we consider it processed
            CUser: req.user?.EmailPro || req.user?.LoginName || 'ADMIN',
            DatUser: sequelize.literal('GETDATE()'),
        }, {
            transaction,
            fields: ['IDReg', 'DatReg', 'CodTiers', 'LibTiers', 'MntReg', 'Payed', 'CUser', 'DatUser'],
        });

        // 2. Create Payment Pieces (TabRegD)
        for (const p of payments) {
            await TabRegD.create({
                IDReg: newReglement.IDReg,
                Echeance: toSqlDateLiteral(p.echeance, { endOfDay: true }),
                ModReg: p.modReg || 'ESPECE',
                Montant: parseFloat(p.montant),
                MntCredit: parseFloat(p.montant),
                MntDebit: 0,
                NumPieceReg: p.numPiece,
                Banque: p.banque,
                DetPieceReg: p.detail,
                Valid: true,
                DatValeur: toSqlDateLiteral(p.echeance, { endOfDay: true })
            }, { transaction });
        }

        // 3. Link to Documents (TabRegF)
        for (const docId of selectedDocs) {
            // Find doc to get details (Nf, Prfx, etc.)
            let doc = await FavMaster.findOne({ where: { Guid: docId } }) ||
                await BlvMaster.findOne({ where: { Guid: docId } });

            if (doc) {
                await TabRegF.create({
                    IDReg: newReglement.IDReg,
                    NumPiece: `${doc.Prfx || ''}${doc.Nf}`,
                    MDate: doc.DatUser || doc.Date,
                    MntPiece: doc.TotTTC,
                    MntReg: doc.TotTTC - (doc.MntCredit || 0), // Paying the full remaining balance
                    Solde: 0, // Fully paid in this simple logic
                    TypPiece: doc.constructor.name === 'FavMaster' ? 'FA' : 'BL'
                }, { transaction });

                // Update document credit/status
                await doc.update({
                    MntCredit: doc.TotTTC,
                    Valider: true
                }, { transaction });
            }
        }

        await transaction.commit();

        res.status(201).json({
            status: 'success',
            message: 'Réglement enregistré avec succès',
            data: {
                id: newReglement.IDReg,
                date: newReglement.DatReg,
                codTiers: newReglement.CodTiers,
                client: newReglement.LibTiers,
                totalAmount: newReglement.MntReg,
                paidAmount: newReglement.MntReg,
                remainingAmount: 0,
                isPayed: true,
                paymentStatus: 'Payé',
                paymentPercentage: 100
            }
        });

    } catch (err) {
        if (transaction && !transaction.finished) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('❌ rollback createReglement failed:', rollbackError);
            }
        }
        console.error('❌ createReglement:', err);
        return next(err);
    }
};
exports.getAllReglements = async (req, res, next) => {
    try {
        const { search = '', status = '', year = '', date = '', dateFrom = '', dateTo = '', page = 1, limit = 100 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Get user info
        const userId = req.user?.id || req.user?.UserID;
        const access = await resolveUserAccess(userId, req.user?.UserRole);
        const isClient = access?.normalizedRole === 'client';

        console.log(`📊 getAllReglements - User: ${req.user?.LoginName}, Role: ${access?.normalizedRole}, isClient: ${isClient}`);

        // Build where clause for filtering
        let where = {};

        // Apply client filter ONLY for clients - ADMIN sees EVERYTHING
        if (isClient === true) {
            console.log('🔐 CLIENT filtering enabled for user:', req.user?.LoginName);
            const clientFilter = await buildClientFilter(req.user);
            console.log(`📌 Client filter:`, JSON.stringify(clientFilter, null, 2));
            where = clientFilter;
        } else {
            console.log(`👨‍💼 NOT A CLIENT (${access?.normalizedRole}) - ADMIN sees all reglements`);
        }

        // Apply search filter
        if (search.trim()) {
            console.log(`🔍 Search applied: "${search}"`);
            const searchFilter = {
                [Op.or]: [
                    { LibTiers: { [Op.like]: `%${search}%` } },
                    { CodTiers: { [Op.like]: `%${search}%` } }
                ]
            };

            // For CLIENTS: Combine client filter AND search filter
            // For ADMIN: Search only (no client restriction)
            if (isClient === true && Object.keys(where).length > 0) {
                console.log(`🔀 CLIENT SEARCH - combining client filter + search with Op.and`);
                where = { [Op.and]: [where, searchFilter] };
            } else if (isClient === true) {
                console.log(`🔀 CLIENT SEARCH - but no client filter yet, using search only`);
                where = searchFilter;
            } else {
                console.log(`🔀 ADMIN SEARCH - applying search without client restriction`);
                where = searchFilter;
            }
        }

        const yearValue = String(year || '').trim();
        if (/^\d{4}$/.test(yearValue)) {
            where[Op.and] = [
                ...(where[Op.and] || []),
                sequelize.literal(`YEAR([DatReg]) = ${Number(yearValue)}`),
            ];
        }

        const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim());
        const exactDateValue = String(date || '').trim();
        const fromValue = String(dateFrom || '').trim();
        const toValue = String(dateTo || '').trim();

        if (isIsoDate(exactDateValue)) {
            where[Op.and] = [
                ...(where[Op.and] || []),
                sequelize.literal(`CONVERT(date, [DatReg]) = '${exactDateValue}'`),
            ];
        }

        if (isIsoDate(fromValue)) {
            where[Op.and] = [
                ...(where[Op.and] || []),
                sequelize.literal(`CONVERT(date, [DatReg]) >= '${fromValue}'`),
            ];
        }

        if (isIsoDate(toValue)) {
            where[Op.and] = [
                ...(where[Op.and] || []),
                sequelize.literal(`CONVERT(date, [DatReg]) <= '${toValue}'`),
            ];
        }

        // Fetch all reglements
        console.log(`🔎 Fetching reglements with WHERE:`, JSON.stringify(where));

        const reglements = await TabReg.findAll({
            where,
            attributes: ['IDReg', 'DatReg', 'CodTiers', 'LibTiers', 'MntReg', 'MntTotPieces', 'Payed', 'CUser', 'DatUser'],
            include: [{
                model: TabRegD,
                as: 'details',
                attributes: ['ID', 'Montant', 'MntDebit', 'MntCredit', 'ModReg', 'DatValeur'],
                required: false,  // LEFT JOIN - don't exclude records without details
            }],
            order: [['DatReg', 'DESC']],
            subQuery: false,  // Prevent Sequelize subquery issues
        });

        console.log(`✅ Query WHERE clause (final):`, JSON.stringify(where));
        console.log(`✅ Found ${reglements.length} reglements`);
        if (reglements.length === 0) {
            console.log('⚠️ NO REGLEMENTS FOUND - Checking if table has data...');
            const totalCount = await TabReg.count();
            const countWithoutInclude = await TabReg.count({ where });
            console.log(`📊 Total records in TabReg table: ${totalCount}`);
            console.log(`📊 Records matching WHERE clause: ${countWithoutInclude}`);

            // Try without include to debug
            const testReglements = await TabReg.findAll({
                where,
                limit: 3,
                attributes: ['IDReg', 'CodTiers', 'LibTiers'],
            });
            console.log(`🧪 Test query without include - Found ${testReglements.length} records:`, JSON.stringify(testReglements));
        }

        // Transform data
        const transformedReglements = reglements.map(reg => {
            // Calculate total paid and remaining
            const totalAmount = reg.MntReg || 0;
            const totalDetail = reg.details?.reduce((sum, d) => sum + (d.MntDebit || 0), 0) || 0;
            const actualTotal = totalDetail > 0 ? totalDetail : totalAmount;

            // Calculate paid amount
            const paidAmount = reg.details?.reduce((sum, d) => sum + (d.MntCredit || 0), 0) || 0;

            // Calculate remaining
            const remainingAmount = actualTotal - paidAmount;

            // Determine status
            let paymentStatus = 'Non payé';
            if (actualTotal === 0) paymentStatus = 'Aucun montant';
            else if (remainingAmount <= 0) paymentStatus = 'Payé';
            else if (paidAmount > 0 && remainingAmount < actualTotal * 0.25) paymentStatus = 'Presque payé';
            else if (paidAmount > 0) paymentStatus = 'Partiellement payé';

            return {
                id: reg.IDReg,
                date: reg.DatReg,
                codTiers: reg.CodTiers,
                client: reg.LibTiers,
                totalAmount: actualTotal,
                paidAmount,
                remainingAmount,
                paymentStatus,
                paymentPercentage: actualTotal > 0 ? Math.round((paidAmount / actualTotal) * 100) : 0,
                isPayed: reg.Payed,
                createdBy: reg.CUser,
                createdDate: reg.DatUser,
                details: reg.details || [],
            };
        });

        // Filter by status
        let filtered = transformedReglements;
        if (status) {
            filtered = transformedReglements.filter(r => r.paymentStatus === status);
        }

        // Paginate
        const total = filtered.length;
        const paginatedReglements = filtered.slice(offset, offset + parseInt(limit));

        res.json({
            status: 'success',
            data: paginatedReglements,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            },
        });
    } catch (err) {
        console.error('❌ getAllReglements:', err);
        next(err);
    }
};

// ─── GET REGLEMENT BY ID ───────────────────────────────────────────────────────────────────
exports.getReglemById = async (req, res, next) => {
    try {
        const { id } = req.params;

        console.log(`📋 getReglemById - ID: ${id}, User: ${req.user?.LoginName}`);

        const reglement = await TabReg.findByPk(id, {
            include: [{
                model: TabRegD,
                as: 'details',
                attributes: ['ID', 'Montant', 'MntDebit', 'MntCredit', 'ModReg', 'NumPieceReg', 'DatValeur', 'Banque', 'NumCompte'],
                required: false,
            }, {
                model: TabRegF,
                as: 'pieces',
                attributes: ['ID', 'NumPiece', 'MDate', 'MntPiece', 'Solde', 'TypPiece'],
                required: false,
            }],
        });

        console.log(`📦 Reglement found:`, reglement ? 'YES' : 'NO');
        console.log(`📦 Details count:`, reglement?.details?.length || 0);
        console.log(`📦 Pieces count:`, reglement?.pieces?.length || 0);

        if (!reglement) {
            console.warn(`⚠️ Réglement ${id} not found`);
            return res.status(404).json({ status: 'error', message: 'Réglement non trouvé' });
        }

        // Check client access
        const userId = req.user?.id || req.user?.UserID;
        const access = await resolveUserAccess(userId, req.user?.UserRole);
        const isClient = access?.normalizedRole === 'client';

        console.log(`🔑 isClient: ${isClient}, Reglement CodTiers: ${reglement.CodTiers}`);

        if (isClient) {
            const userEmail = String(req.user?.EmailPro || '').toLowerCase();
            const userLogin = String(req.user?.LoginName || '').toLowerCase();
            const userCodTiers = reglement.CodTiers || '';

            // Check if client owns this reglement
            const regCUser = String(reglement.CUser || '').toLowerCase();
            const matchesEmail = userEmail && regCUser === userEmail;
            const matchesLogin = userLogin && regCUser === userLogin;
            const matchesCodTiers = userCodTiers && userCodTiers === reglement.CodTiers;

            if (!matchesEmail && !matchesLogin && !matchesCodTiers) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Accès refusé à ce réglement'
                });
            }
        }

        // Calculate totals
        const totalAmount = reglement.MntReg || 0;
        const paidAmount = reglement.details?.reduce((sum, d) => sum + (d.MntCredit || 0), 0) || 0;
        const remainingAmount = totalAmount - paidAmount;

        const result = {
            id: reglement.IDReg,
            date: reglement.DatReg,
            codTiers: reglement.CodTiers,
            client: reglement.LibTiers,
            totalAmount,
            paidAmount,
            remainingAmount,
            isPayed: reglement.Payed,
            createdBy: reglement.CUser,
            createdDate: reglement.DatUser,
            details: reglement.details || [],
            pieces: reglement.pieces || [],
        };

        res.json({ status: 'success', data: result });
    } catch (err) {
        console.error('❌ getReglemById:', err);
        next(err);
    }
};

// ─── GET REGLEMENT STATISTICS ───────────────────────────────────────────────────────────────────
exports.getReglemStats = async (req, res, next) => {
    try {
        const userId = req.user?.id || req.user?.UserID;
        const access = await resolveUserAccess(userId, req.user?.UserRole);
        const isClient = access?.normalizedRole === 'client';

        console.log(`📊 getReglemStats - User: ${req.user?.LoginName}, Role: ${access?.normalizedRole}, isClient: ${isClient}`);

        let where = {};
        if (isClient === true) {
            console.log('🔐 CLIENT filtering for stats');
            const clientFilter = await buildClientFilter(req.user);
            console.log(`📌 Client filter for stats:`, JSON.stringify(clientFilter, null, 2));
            where = clientFilter;
        } else {
            console.log(`👨‍💼 NOT A CLIENT - ADMIN sees all stats`);
        }

        const reglements = await TabReg.findAll({
            where,
            attributes: ['IDReg', 'MntReg'],
            include: [{
                model: TabRegD,
                as: 'details',
                attributes: ['MntDebit', 'MntCredit'],
            }],
        });

        console.log(`✅ Found ${reglements.length} reglements for stats`);

        // Calculate stats
        let totalAmount = 0;
        let totalPaid = 0;

        reglements.forEach(reg => {
            const amount = reg.MntReg || 0;
            totalAmount += amount;

            const paid = reg.details?.reduce((sum, d) => sum + (d.MntCredit || 0), 0) || 0;
            totalPaid += paid;
        });

        const remainingAmount = totalAmount - totalPaid;

        const stats = {
            totalDocuments: reglements.length,
            totalAmount,
            totalPaid,
            totalRemaining: remainingAmount,
            paymentPercentage: totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0,
        };

        console.log(`💾 Stats calculated:`, JSON.stringify(stats));
        res.json({ status: 'success', data: stats });
    } catch (err) {
        console.error('❌ getReglemStats:', err);
        next(err);
    }
};

// ─── UPDATE REGLEMENT PAYMENT STATUS ───────────────────────────────────────────────────────────────────
// Admin peut marquer un réglement comme payé ou en modifier le montant
exports.updateReglemPaymentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { mntCredit, payed } = req.body;

        // Verify user is admin
        const userId = req.user?.id || req.user?.UserID;
        const access = await resolveUserAccess(userId, req.user?.UserRole);

        if (access?.normalizedRole !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'Seul un administrateur peut modifier les paiements'
            });
        }

        // Find reglement
        const reglement = await TabReg.findByPk(id);
        if (!reglement) {
            return res.status(404).json({ status: 'error', message: 'Réglement non trouvé' });
        }

        // Update payment status
        // Option 1: Mark entire reglement as paid
        if (payed !== undefined) {
            reglement.Payed = payed === true || payed === 1 || payed === '1';
            console.log(`💰 Admin marking reglement ${id} as ${reglement.Payed ? 'Payé' : 'Non payé'}`);
        }

        // Option 2: Update the MntCredit in details to reflect payment
        if (mntCredit !== undefined && mntCredit !== null) {
            // Find first detail record and update it
            const detail = await TabRegD.findOne({
                where: { IDReg: id }
            });

            if (detail) {
                const oldCredit = detail.MntCredit || 0;
                detail.MntCredit = parseFloat(mntCredit);
                await detail.save();
                console.log(`💳 Payment detail updated: ${oldCredit} → ${detail.MntCredit}`);
            }
        }

        // Save reglement
        await reglement.save();

        // Recalculate stats
        const totalAmount = reglement.MntReg || 0;
        const paid = reglement.details?.reduce((sum, d) => sum + (d.MntCredit || 0), 0) || 0;
        const remaining = totalAmount - paid;

        const result = {
            id: reglement.IDReg,
            date: reglement.DatReg,
            client: reglement.LibTiers,
            totalAmount,
            paidAmount: paid,
            remainingAmount: remaining,
            isPayed: reglement.Payed,
            paymentStatus: getPaymentStatus(totalAmount, paid),
            paymentPercentage: totalAmount > 0 ? Math.round((paid / totalAmount) * 100) : 0,
        };

        res.json({ status: 'success', message: 'Paiement mis à jour', data: result });
    } catch (err) {
        console.error('❌ updateReglemPaymentStatus:', err);
        next(err);
    }
};

// ─── BATCH UPDATE MULTIPLE PAYMENTS ───────────────────────────────────────────────────────────────────
// Admin peut marquer plusieurs réglement comme payés en une seule requête
exports.batchUpdatePayments = async (req, res, next) => {
    try {
        const { reglemIds, markAsPayedTotal } = req.body;

        // Verify user is admin
        const userId = req.user?.id || req.user?.UserID;
        const access = await resolveUserAccess(userId, req.user?.UserRole);

        if (access?.normalizedRole !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'Seul un administrateur peut modifier les paiements'
            });
        }

        if (!Array.isArray(reglemIds) || reglemIds.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Fournir une liste de IDs à mettre à jour'
            });
        }

        console.log(`💰 Batch updating ${reglemIds.length} payments...`);

        // Update each reglement
        const updated = [];
        for (const reglemId of reglemIds) {
            const reglement = await TabReg.findByPk(reglemId);
            if (reglement) {
                if (markAsPayedTotal === true) {
                    reglement.Payed = true;

                    // Also update MntCredit to match total amount
                    const detail = await TabRegD.findOne({ where: { IDReg: reglemId } });
                    if (detail) {
                        detail.MntCredit = reglement.MntReg || 0;
                        await detail.save();
                    }
                }

                await reglement.save();
                updated.push(reglemId);
            }
        }

        res.json({
            status: 'success',
            message: `${updated.length} paiements mis à jour`,
            data: { updatedCount: updated.length, reglemIds: updated }
        });
    } catch (err) {
        console.error('❌ batchUpdatePayments:', err);
        next(err);
    }
};

// ─── GET PAYMENT MODES ───────────────────────────────────────────────────────────────────
exports.getPaymentModes = async (req, res, next) => {
    try {
        const modes = await sequelize.query(
            `SELECT ModReg AS label, IDReg FROM TabModReg ORDER BY ModReg ASC`,
            { type: QueryTypes.SELECT }
        );
        res.json({ status: 'success', data: modes });
    } catch (err) {
        console.error('❌ getPaymentModes:', err);
        next(err);
    }
};

// ─── GET UNPAID DOCUMENTS BY CLIENT ────────────────────────────────────────────────────────
exports.getUnpaidByClient = async (req, res, next) => {
    try {
        const { codTiers } = req.params;

        // Fetch unpaid Invoices (FA)
        const invoices = await FavMaster.findAll({
            where: {
                CodTiers: codTiers,
                [Op.or]: [
                    { Valider: true },
                    { Valid: true }
                ],
                // Simple logic: total > credit
                [Op.and]: sequelize.literal('TotTTC > ISNULL(MntCredit, 0)')
            },
            attributes: ['Guid', 'Nf', 'Prfx', 'DatUser', 'TotTTC', 'MntCredit']
        });

        // Fetch unpaid Delivery Notes (BL)
        const deliveryNotes = await BlvMaster.findAll({
            where: {
                CodTiers: codTiers,
                // Add your project's logic for "unpaid" BLs here
                // In some systems, BLs are not "paid" directly but transformed to FA
                // If the user wants to pay BLs directly:
                [Op.and]: sequelize.literal('TotTTC > ISNULL(MntCredit, 0)')
            },
            attributes: ['Guid', 'Nf', 'Prfx', 'DatUser', 'TotTTC', 'MntCredit']
        });

        // Combine and format
        const documents = [
            ...invoices.map(i => ({ id: i.Guid, type: 'FA', num: `${i.Prfx}${i.Nf}`, date: i.DatUser, debit: i.TotTTC, credit: i.MntCredit })),
            ...deliveryNotes.map(d => ({ id: d.Guid, type: 'BL', num: `${d.Prfx}${d.Nf}`, date: d.DatUser, debit: d.TotTTC, credit: d.MntCredit }))
        ];

        res.json({ status: 'success', data: documents });
    } catch (err) {
        console.error('❌ getUnpaidByClient:', err);
        next(err);
    }
};
