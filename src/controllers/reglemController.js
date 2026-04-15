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

const toMoney = (value) => {
    const parsed = Number.parseFloat(String(value ?? '').replace(',', '.'));
    if (!Number.isFinite(parsed)) return 0;
    return Math.round(parsed * 1000) / 1000;
};

const nearlyEqual = (a, b, epsilon = 0.01) => Math.abs(Number(a || 0) - Number(b || 0)) <= epsilon;

const appendAndClause = (where, clause) => {
    if (clause === null || clause === undefined) return where;
    if (typeof clause === 'object' && !Array.isArray(clause) && clause.constructor === Object && Object.keys(clause).length === 0) {
        return where;
    }
    if (!where || Object.keys(where).length === 0) return clause;
    return { [Op.and]: [where, clause] };
};

const isIsoDateOnly = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));

const toSqlDateLiteral = (value, { endOfDay = false } = {}) => {
    if (!isIsoDateOnly(value)) return sequelize.literal('GETDATE()');
    const time = endOfDay ? '23:59:59' : '00:00:00';
    return sequelize.literal(`CONVERT(datetime, '${value} ${time}', 120)`);
};

const toSqlDateTimeValue = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 19).replace('T', ' ');
};

const safeRollback = async (transaction) => {
    if (!transaction || transaction.finished) return;
    try {
        await transaction.rollback();
    } catch (rollbackError) {
        const message = String(rollbackError?.message || '').toLowerCase();
        if (!message.includes('no corresponding begin transaction')) {
            console.error('❌ rollback createReglement failed:', rollbackError);
        }
    }
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
        const { codTiers, libTiers, mntReg, datReg, selectedDocs = [], selectedPieces = [], payments = [] } = req.body;

        if (!codTiers) {
            return res.status(400).json({ status: 'error', message: 'Client obligatoire' });
        }

        const requestedPieces = Array.isArray(selectedPieces) && selectedPieces.length > 0
            ? selectedPieces
            : selectedDocs.map((docId) => ({ id: docId, type: null, allocatedAmount: null }));

        if (!Array.isArray(requestedPieces) || requestedPieces.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Sélectionnez au moins une pièce à régler' });
        }

        if (!Array.isArray(payments) || payments.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Ajoutez au moins une modalité de paiement' });
        }

        const normalizedPieces = requestedPieces.map((piece) => ({
            id: String(piece?.id || '').trim(),
            type: String(piece?.type || '').trim().toUpperCase(),
            allocatedAmount: toMoney(piece?.allocatedAmount),
        })).filter((piece) => piece.id);

        if (normalizedPieces.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Pièces invalides' });
        }

        const unresolvedType = normalizedPieces.some((piece) => piece.type !== 'FA' && piece.type !== 'BL');
        if (unresolvedType) {
            return res.status(400).json({ status: 'error', message: 'Chaque pièce doit préciser un type FA ou BL' });
        }

        const paymentTotal = payments.reduce((sum, payment) => sum + toMoney(payment?.montant), 0);
        if (paymentTotal <= 0) {
            return res.status(400).json({ status: 'error', message: 'Le montant du paiement doit être supérieur à zéro' });
        }

        const expectedTotal = toMoney(mntReg) > 0 ? toMoney(mntReg) : paymentTotal;

        const reglementId = randomUUID();
        console.log(`🧾 createReglement - reglementId: ${reglementId}`);

        const piecesByType = normalizedPieces.reduce((acc, piece) => {
            if (!acc[piece.type]) acc[piece.type] = [];
            acc[piece.type].push(piece.id);
            return acc;
        }, {});

        const [invoiceDocs, deliveryDocs] = await Promise.all([
            piecesByType.FA?.length
                ? FavMaster.findAll({
                    where: {
                        Guid: { [Op.in]: piecesByType.FA },
                        CodTiers: codTiers,
                    },
                    transaction,
                })
                : Promise.resolve([]),
            piecesByType.BL?.length
                ? BlvMaster.findAll({
                    where: {
                        Guid: { [Op.in]: piecesByType.BL },
                        CodTiers: codTiers,
                    },
                    transaction,
                })
                : Promise.resolve([]),
        ]);

        const documentsMap = new Map();
        invoiceDocs.forEach((doc) => documentsMap.set(`FA:${doc.Guid}`, { doc, type: 'FA' }));
        deliveryDocs.forEach((doc) => documentsMap.set(`BL:${doc.Guid}`, { doc, type: 'BL' }));

        const piecesToApply = normalizedPieces.map((piece) => {
            const key = `${piece.type}:${piece.id}`;
            const found = documentsMap.get(key);
            if (!found) {
                throw Object.assign(new Error(`Pièce introuvable: ${piece.type} ${piece.id}`), { statusCode: 400 });
            }

            const documentTotal = toMoney(found.doc.TotTTC);
            const documentCredit = toMoney(found.doc.MntCredit);
            const remaining = Math.max(0, toMoney(documentTotal - documentCredit));
            const allocated = piece.allocatedAmount > 0 ? piece.allocatedAmount : remaining;

            if (allocated <= 0) {
                throw Object.assign(new Error(`Montant alloué invalide pour la pièce ${found.type} ${piece.id}`), { statusCode: 400 });
            }

            if (allocated > remaining + 0.01) {
                throw Object.assign(new Error(`Montant alloué dépasse le solde de la pièce ${found.type} ${piece.id}`), { statusCode: 400 });
            }

            return {
                key,
                type: found.type,
                doc: found.doc,
                totalAmount: documentTotal,
                previousCredit: documentCredit,
                remainingAmount: remaining,
                allocatedAmount: toMoney(allocated),
                isPartial: allocated < (remaining - 0.01),
            };
        });

        const allocatedTotal = toMoney(piecesToApply.reduce((sum, piece) => sum + piece.allocatedAmount, 0));

        if (!nearlyEqual(allocatedTotal, expectedTotal)) {
            return res.status(400).json({
                status: 'error',
                message: `Le total alloué (${allocatedTotal}) doit correspondre au montant du règlement (${expectedTotal})`,
            });
        }

        if (!nearlyEqual(paymentTotal, expectedTotal)) {
            return res.status(400).json({
                status: 'error',
                message: `Le total des paiements (${paymentTotal}) doit correspondre au montant du règlement (${expectedTotal})`,
            });
        }

        const isFullySettled = piecesToApply.every((piece) => nearlyEqual(piece.allocatedAmount, piece.remainingAmount));

        // 1. Create Master Record
        const newReglement = await TabReg.create({
            IDReg: reglementId,
            DatReg: toSqlDateLiteral(datReg),
            CodTiers: codTiers,
            LibTiers: libTiers || codTiers,
            MntReg: expectedTotal,
            MntTotPieces: allocatedTotal,
            Payed: isFullySettled,
            CUser: req.user?.EmailPro || req.user?.LoginName || 'ADMIN',
            DatUser: sequelize.literal('GETDATE()'),
        }, {
            transaction,
            fields: ['IDReg', 'DatReg', 'CodTiers', 'LibTiers', 'MntReg', 'MntTotPieces', 'Payed', 'CUser', 'DatUser'],
        });

        // 2. Create Payment Pieces (TabRegD)
        for (const p of payments) {
            const paymentAmount = toMoney(p?.montant);
            if (paymentAmount <= 0) continue;
            await TabRegD.create({
                IDReg: newReglement.IDReg,
                Echeance: toSqlDateLiteral(p.echeance, { endOfDay: true }),
                ModReg: p.modReg || 'ESPECE',
                Montant: paymentAmount,
                MntCredit: paymentAmount,
                MntDebit: paymentAmount,
                NumPieceReg: p.numPiece,
                Banque: p.banque,
                DetPieceReg: p.detail,
                Valid: true,
                DatValeur: toSqlDateLiteral(p.echeance, { endOfDay: true })
            }, { transaction });
        }

        // 3. Link to Documents (TabRegF)
        for (const piece of piecesToApply) {
            const linkedPieceId = String(piece.doc?.Guid || '').trim();
            if (!linkedPieceId) {
                throw Object.assign(new Error(`Identifiant de pièce manquant pour ${piece.type}`), { statusCode: 400 });
            }

            await TabRegF.create({
                IDReg: newReglement.IDReg,
                IDPieces: linkedPieceId,
                NumPiece: `${piece.doc.Prfx || ''}${piece.doc.Nf || ''}`,
                MDate: sequelize.literal('GETDATE()'),
                // TabRegF.Solde is derived from MntPiece vs MntReg in this schema.
                // Use remaining-at-payment-time so a fully settled piece gets Solde = 0.
                MntPiece: piece.remainingAmount,
                MntReg: piece.allocatedAmount,
                TypPiece: piece.type,
            }, {
                transaction,
                fields: ['IDReg', 'IDPieces', 'NumPiece', 'MDate', 'MntPiece', 'MntReg', 'TypPiece']
            });

            await piece.doc.update({
                MntCredit: toMoney(piece.previousCredit + piece.allocatedAmount),
            }, { transaction });
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
                paidAmount: paymentTotal,
                remainingAmount: 0,
                isPayed: newReglement.Payed,
                paymentStatus: getPaymentStatus(newReglement.MntReg, paymentTotal),
                paymentPercentage: newReglement.MntReg > 0 ? Math.round((paymentTotal / newReglement.MntReg) * 100) : 0
            }
        });

    } catch (err) {
        if (err?.statusCode) {
            await safeRollback(transaction);
            return res.status(err.statusCode).json({ status: 'error', message: err.message });
        }
        await safeRollback(transaction);
        console.error('❌ createReglement:', err);
        return next(err);
    }
};
exports.getAllReglements = async (req, res, next) => {
    try {
        const {
            search = '',
            status = '',
            year = '',
            date = '',
            dateFrom = '',
            dateTo = '',
            codTiers = '',
            codRepres = '',
            page = 1,
            limit = 100,
        } = req.query;
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
            where = appendAndClause(where, clientFilter);
        } else {
            console.log(`👨‍💼 NOT A CLIENT (${access?.normalizedRole}) - ADMIN sees all reglements`);
        }

        if (String(search || '').trim()) {
            where = appendAndClause(where, {
                [Op.or]: [
                    { LibTiers: { [Op.like]: `%${search}%` } },
                    { CodTiers: { [Op.like]: `%${search}%` } }
                ]
            });
        }

        const codTiersFilter = String(codTiers || '').trim();
        if (codTiersFilter) {
            where = appendAndClause(where, { CodTiers: codTiersFilter });
        }

        const codRepresFilter = String(codRepres || '').trim();
        if (codRepresFilter) {
            const matchingClients = await sequelize.query(`
                SELECT CodTiers
                FROM TabTiers
                WHERE
                    LOWER(LTRIM(RTRIM(CONVERT(NVARCHAR(100), codRepresTiers)))) = LOWER(LTRIM(RTRIM(:codRepresFilter)))
                    OR (
                        TRY_CONVERT(INT, codRepresTiers) IS NOT NULL
                        AND TRY_CONVERT(INT, :codRepresFilter) IS NOT NULL
                        AND TRY_CONVERT(INT, codRepresTiers) = TRY_CONVERT(INT, :codRepresFilter)
                    )
            `, {
                replacements: { codRepresFilter },
                type: QueryTypes.SELECT,
            });

            const codTiersList = matchingClients
                .map((client) => String(client.CodTiers || '').trim())
                .filter(Boolean);

            if (codTiersList.length === 0) {
                where = appendAndClause(where, { CodTiers: '__NO_MATCH__' });
            } else {
                where = appendAndClause(where, { CodTiers: { [Op.in]: codTiersList } });
            }
        }

        const yearValue = String(year || '').trim();
        if (/^\d{4}$/.test(yearValue)) {
            where = appendAndClause(where, sequelize.literal(`YEAR([DatReg]) = ${Number(yearValue)}`));
        }

        const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim());
        const exactDateValue = String(date || '').trim();
        const fromValue = String(dateFrom || '').trim();
        const toValue = String(dateTo || '').trim();

        if (isIsoDate(exactDateValue)) {
            where = appendAndClause(where, sequelize.literal(`CONVERT(date, [DatReg]) = '${exactDateValue}'`));
        }

        if (isIsoDate(fromValue)) {
            where = appendAndClause(where, sequelize.literal(`CONVERT(date, [DatReg]) >= '${fromValue}'`));
        }

        if (isIsoDate(toValue)) {
            where = appendAndClause(where, sequelize.literal(`CONVERT(date, [DatReg]) <= '${toValue}'`));
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
        const { dateFrom = '', dateTo = '' } = req.query;
        const fromValue = String(dateFrom || '').trim();
        const toValue = String(dateTo || '').trim();
        const hasFrom = isIsoDateOnly(fromValue);
        const hasTo = isIsoDateOnly(toValue);

        const dateClauses = [];
        if (hasFrom) {
            dateClauses.push(sequelize.literal(`CONVERT(date, [DatUser]) >= '${fromValue}'`));
        }
        if (hasTo) {
            dateClauses.push(sequelize.literal(`CONVERT(date, [DatUser]) <= '${toValue}'`));
        }

        // Fetch unpaid Invoices (FA)
        const invoices = await FavMaster.findAll({
            where: {
                CodTiers: codTiers,
                // Simple logic: total > credit
                [Op.and]: [
                    sequelize.literal('TotTTC > ISNULL(MntCredit, 0)'),
                    ...dateClauses,
                ],
            },
            attributes: ['Guid', 'Nf', 'Prfx', 'DatUser', 'TotTTC', 'MntCredit']
        });

        // Fetch unpaid Delivery Notes (BL)
        const deliveryNotes = await BlvMaster.findAll({
            where: {
                CodTiers: codTiers,
                [Op.and]: [
                    sequelize.literal('TotTTC > ISNULL(MntCredit, 0)'),
                    ...dateClauses,
                ],
            },
            attributes: ['Guid', 'Nf', 'Prfx', 'DatUser', 'TotTTC', 'MntCredit']
        });

        // Combine and format
        const documents = [
            ...invoices.map(i => {
                const debit = toMoney(i.TotTTC);
                const credit = toMoney(i.MntCredit);
                return {
                    id: i.Guid,
                    type: 'FA',
                    num: `${i.Prfx || ''}${i.Nf || ''}`,
                    date: i.DatUser,
                    debit,
                    credit,
                    remaining: Math.max(0, toMoney(debit - credit)),
                };
            }),
            ...deliveryNotes.map(d => {
                const debit = toMoney(d.TotTTC);
                const credit = toMoney(d.MntCredit);
                return {
                    id: d.Guid,
                    type: 'BL',
                    num: `${d.Prfx || ''}${d.Nf || ''}`,
                    date: d.DatUser,
                    debit,
                    credit,
                    remaining: Math.max(0, toMoney(debit - credit)),
                };
            })
        ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

        res.json({ status: 'success', data: documents });
    } catch (err) {
        console.error('❌ getUnpaidByClient:', err);
        next(err);
    }
};
