const { TabReg, TabRegD, TabRegF, TabModReg, FavMaster, BlvMaster, Tiers, sequelize } = require('../models');
const { Op, QueryTypes } = require('sequelize');
const { randomUUID } = require('crypto');
const { resolveUserAccess } = require('../utils/userAccess');
const ObjectifGestionService = require('../services/objectifGestionService');

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

const toSqlDateLiteral = (value, { endOfDay = false, exactTime = false } = {}) => {
    if (!isIsoDateOnly(value)) return sequelize.literal('GETDATE()');
    if (exactTime) return sequelize.literal('GETDATE()'); // Always return precise database time for precise operations
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
        const {
            codTiers,
            libTiers,
            mntReg,
            mntRegTarget,
            datReg,
            existingReglementId,
            selectedDocs = [],
            selectedPieces = [],
            payments = [],
        } = req.body;

        if (!codTiers) {
            return res.status(400).json({ status: 'error', message: 'Client obligatoire' });
        }

        if (!Array.isArray(payments) || payments.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Ajoutez au moins une modalité de paiement' });
        }

        const paymentTotal = payments.reduce((sum, payment) => sum + toMoney(payment?.montant), 0);
        if (paymentTotal <= 0) {
            return res.status(400).json({ status: 'error', message: 'Le montant du paiement doit être supérieur à zéro' });
        }

        const requestedPieces = Array.isArray(selectedPieces) && selectedPieces.length > 0
            ? selectedPieces
            : selectedDocs.map((docId) => ({ id: docId, type: null, allocatedAmount: null }));

        const normalizedPieces = requestedPieces.map((piece) => ({
            id: String(piece?.id || '').trim(),
            type: String(piece?.type || '').trim().toUpperCase(),
            allocatedAmount: toMoney(piece?.allocatedAmount),
        })).filter((piece) => piece.id);

        if (normalizedPieces.length === 0 && paymentTotal <= 0) {
            return res.status(400).json({ status: 'error', message: 'Sélectionnez au moins une pièce ou saisissez un montant' });
        }

        const unresolvedType = normalizedPieces.some((piece) => piece.type !== 'FA' && piece.type !== 'BL');
        if (unresolvedType) {
            return res.status(400).json({ status: 'error', message: 'Chaque pièce doit préciser un type FA ou BL' });
        }

        const existingReglementIdValue = String(existingReglementId || '').trim();

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

        // 4. FIFO Distribution Logic
        // Sort pieces by date (MDate) to apply payment to oldest documents first
        const piecesToApply = normalizedPieces.map((piece) => {
            const key = `${piece.type}:${piece.id}`;
            const found = documentsMap.get(key);
            if (!found) {
                throw Object.assign(new Error(`Pièce introuvable: ${piece.type} ${piece.id}`), { statusCode: 400 });
            }

            const documentTotal = toMoney(found.doc.TotTTC);
            const documentCredit = toMoney(found.doc.MntCredit);
            const remaining = Math.max(0, toMoney(documentTotal - documentCredit));

            return {
                key,
                type: found.type,
                doc: found.doc,
                totalAmount: documentTotal,
                previousCredit: documentCredit,
                remainingAmount: remaining,
                requestedAmount: piece.allocatedAmount, // Manual amount if provided
                allocatedAmount: 0 // Will be calculated
            };
        });

        // Sort by date (Oldest first)
        piecesToApply.sort((a, b) => {
            const dateA = new Date(a.doc.MDate || 0);
            const dateB = new Date(b.doc.MDate || 0);
            return dateA - dateB;
        });

        let remainingPayment = paymentTotal;

        // First pass: Respect manual allocations if any
        for (const piece of piecesToApply) {
            if (piece.requestedAmount > 0) {
                const amount = Math.min(remainingPayment, piece.requestedAmount, piece.remainingAmount);
                piece.allocatedAmount = toMoney(amount);
                remainingPayment = toMoney(remainingPayment - amount);
            }
        }

        // Second pass: Distribute remaining payment to unpaid pieces (FIFO)
        for (const piece of piecesToApply) {
            if (remainingPayment <= 0) break;
            
            const stillOwed = toMoney(piece.remainingAmount - piece.allocatedAmount);
            if (stillOwed > 0) {
                const amount = Math.min(remainingPayment, stillOwed);
                piece.allocatedAmount = toMoney(piece.allocatedAmount + amount);
                remainingPayment = toMoney(remainingPayment - amount);
            }
        }

        // Filter out pieces with zero allocation and validate
        const finalizedPieces = piecesToApply.filter(p => p.allocatedAmount > 0);

        if (finalizedPieces.length === 0 && paymentTotal > 0) {
            // It's a pure advance (no pieces paid)
            // We'll let it pass and the entire amount will be an advance.
        }

        const piecesToApplyFinal = finalizedPieces;
        const allocatedTotal = toMoney(piecesToApplyFinal.reduce((sum, piece) => sum + piece.allocatedAmount, 0));
        
        if (paymentTotal + 0.01 < allocatedTotal) {
            return res.status(400).json({
                status: 'error',
                message: `Le montant payé (${paymentTotal}) est insuffisant pour l'allocation demandée (${allocatedTotal})`,
            });
        }

        const advanceAmount = Math.max(0, toMoney(paymentTotal - allocatedTotal));

        const selectedPieceIds = [...new Set(piecesToApplyFinal.map((piece) => String(piece.doc?.Guid || '').trim()).filter(Boolean))];
        const selectedPieceTypes = [...new Set(piecesToApplyFinal.map((piece) => String(piece.type || '').trim().toUpperCase()).filter(Boolean))];

        const piecesOutstandingTotal = toMoney(piecesToApplyFinal.reduce((sum, piece) => sum + piece.remainingAmount, 0));

        // 1. Create Main Record for allocated pieces (if any)
        let mainReglement = null;
        if (allocatedTotal > 0) {
            mainReglement = await TabReg.create({
                IDReg: reglementId,
                DatReg: sequelize.literal('GETDATE()'), // Always use exact time for precise tracking
                CodTiers: codTiers,
                LibTiers: libTiers || codTiers,
                MntReg: allocatedTotal,
                MntTotPieces: piecesOutstandingTotal,
                Payed: true, // Fully settled against pieces
                CUser: req.user?.EmailPro || req.user?.LoginName || 'ADMIN',
                DatUser: sequelize.literal('GETDATE()'),
            }, {
                transaction,
                fields: ['IDReg', 'DatReg', 'CodTiers', 'LibTiers', 'MntReg', 'MntTotPieces', 'Payed', 'CUser', 'DatUser'],
            });

            // Distribute payments into TabRegD for the main reglement
            let remainingToAllocate = allocatedTotal;
            for (const p of payments) {
                if (remainingToAllocate <= 0) break;
                const paymentAmount = toMoney(p?.montant);
                const appliedAmount = Math.min(remainingToAllocate, paymentAmount);

                if (appliedAmount > 0) {
                    await TabRegD.create({
                        IDReg: mainReglement.IDReg,
                        Echeance: toSqlDateLiteral(p.echeance, { endOfDay: true }),
                        ModReg: p.modReg || 'ESPECE',
                        Montant: appliedAmount,
                        MntCredit: appliedAmount,
                        MntDebit: appliedAmount,
                        NumPieceReg: p.numPiece,
                        Banque: p.banque,
                        DetPieceReg: p.detail,
                        Valid: true,
                        DatValeur: toSqlDateLiteral(p.echeance, { endOfDay: true })
                    }, { transaction });

                    remainingToAllocate = toMoney(remainingToAllocate - appliedAmount);
                    p.montant = toMoney(paymentAmount - appliedAmount); // Leave remainder for advance
                }
            }

            // Link to Documents (TabRegF)
            for (const piece of piecesToApplyFinal) {
                const linkedPieceId = String(piece.doc?.Guid || '').trim();

                await TabRegF.create({
                    IDReg: mainReglement.IDReg,
                    IDPieces: linkedPieceId,
                    NumPiece: `${piece.doc.Prfx || ''}${piece.doc.Nf || ''}`,
                    MDate: sequelize.literal('GETDATE()'),
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
        }

        // 2. Create Advance Record (if there is unused money)
        let advanceReglement = null;
        if (advanceAmount > 0) {
            const advanceId = allocatedTotal > 0 ? randomUUID() : reglementId;
            advanceReglement = await TabReg.create({
                IDReg: advanceId,
                DatReg: sequelize.literal('GETDATE()'), // Always use exact time for precise tracking
                CodTiers: codTiers,
                LibTiers: libTiers || codTiers,
                MntReg: advanceAmount,
                MntTotPieces: 0,
                Payed: false, // Avance non affectée
                CUser: req.user?.EmailPro || req.user?.LoginName || 'ADMIN',
                DatUser: sequelize.literal('GETDATE()'),
            }, {
                transaction,
                fields: ['IDReg', 'DatReg', 'CodTiers', 'LibTiers', 'MntReg', 'MntTotPieces', 'Payed', 'CUser', 'DatUser'],
            });

            for (const p of payments) {
                const paymentAmount = toMoney(p?.montant);
                if (paymentAmount <= 0) continue;

                await TabRegD.create({
                    IDReg: advanceReglement.IDReg,
                    Echeance: toSqlDateLiteral(p.echeance, { endOfDay: true }),
                    ModReg: p.modReg || 'ESPECE',
                    Montant: paymentAmount,
                    MntCredit: paymentAmount,
                    MntDebit: paymentAmount,
                    NumPieceReg: p.numPiece,
                    Banque: p.banque,
                    DetPieceReg: p.detail ? `${p.detail} (Avance)` : 'Avance',
                    Valid: true,
                    DatValeur: toSqlDateLiteral(p.echeance, { endOfDay: true })
                }, { transaction });
            }
        }

        await transaction.commit();

        // 🎯 MISE À JOUR DES OBJECTIFS - Appeler le service objectif après commit
        try {
            const models = req.app?.locals?.models || require('../models');
            const objectifService = new ObjectifGestionService(models);
            
            // Pour chaque facture payée, mettre à jour l'objectif du commercial
            for (const piece of piecesToApplyFinal) {
                const facture = piece.doc;
                const commercialId = facture?.CodRepres || facture?.commercialId;
                
                if (commercialId && piece.allocatedAmount > 0) {
                    console.log(`🎯 Mise à jour objectif commercial: ${commercialId}, montant: ${piece.allocatedAmount}`);
                    
                    try {
                        const resultat = await objectifService.updateObjectifOnPayment({
                            ID_Facture: facture.Guid,
                            CodRepres: commercialId,
                            Montant: piece.allocatedAmount,
                            MoyenPaiement: 'Paiement facture',
                            Reference: `Facture ${facture.Prfx}${facture.Nf}`,
                            Observations: `Paiement enregistré via facture. Montant: ${piece.allocatedAmount} TND`,
                            ID_Utilisateur: req.user?.UserID,
                            DateReglement: datReg || new Date()
                        });
                        
                        console.log(`✅ Objectif mis à jour: ${resultat.message}`);
                    } catch (objError) {
                        console.warn(`⚠️  Erreur mise à jour objectif pour ${commercialId}:`, objError.message);
                        // Ne pas bloquer le processus si la mise à jour objectif échoue
                    }
                }
            }
        } catch (objectifError) {
            console.error('❌ Erreur initialisation service objectif:', objectifError.message);
            // Ne pas bloquer - le paiement est déjà enregistré en base
        }

        const responseReglement = mainReglement || advanceReglement;

        res.status(201).json({
            status: 'success',
            message: advanceAmount > 0 && allocatedTotal > 0 
                ? 'Règlement et avance créés avec succès' 
                : 'Règlement enregistré avec succès',
            data: {
                id: responseReglement.IDReg,
                date: responseReglement.DatReg,
                codTiers: responseReglement.CodTiers,
                client: responseReglement.LibTiers,
                totalAmount: allocatedTotal + advanceAmount,
                allocatedAmount: allocatedTotal,
                advanceAmount: advanceAmount,
                isPayed: responseReglement.Payed,
                paymentStatus: advanceAmount > 0 ? 'Avance générée' : 'Payé'
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
                required: false,
            }],
            order: [['DatReg', 'DESC'], ['DatUser', 'DESC']],
            subQuery: false,
        });

        // Transform data — MntTotPieces = total des factures AVANT ce paiement (déjà dans TabReg)
        const transformedReglements = reglements.map(reg => {
            const actualTotal   = toMoney(reg.MntReg       || 0);
            const mntTotPieces  = toMoney(reg.MntTotPieces || 0);
            const paidAmount    = actualTotal; // Le règlement est entièrement encaissé

            // Restant = ce qui reste à payer sur les factures après ce règlement
            const remainingAmount = mntTotPieces > 0
                ? Math.max(0, mntTotPieces - actualTotal)
                : 0;

            // Progression = % de la facture qui a été payé
            const paymentPercentage = mntTotPieces > 0
                ? Math.min(100, Math.round((actualTotal / mntTotPieces) * 100))
                : (reg.Payed ? 100 : 0);

            let paymentStatus = 'Non payé';
            if (remainingAmount <= 0 && (actualTotal > 0 || reg.Payed)) paymentStatus = 'Payé';
            else if (paymentPercentage >= 75) paymentStatus = 'Presque payé';
            else if (actualTotal > 0) paymentStatus = 'Partiellement payé';

            return {
                id: reg.IDReg,
                date: reg.DatReg,
                codTiers: reg.CodTiers,
                client: reg.LibTiers,
                totalAmount: actualTotal,
                paidAmount,
                remainingAmount,
                paymentStatus,
                paymentPercentage,
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
                attributes: ['ID', 'Montant', 'MntDebit', 'MntCredit', 'ModReg', 'NumPieceReg', 'DetPieceReg', 'DatValeur', 'Banque', 'NumCompte'],
                required: false,
            }, {
                model: TabRegF,
                as: 'pieces',
                attributes: ['ID', 'IDPieces', 'NumPiece', 'MDate', 'MntPiece', 'MntReg', 'Solde', 'TypPiece'],
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
        const pieces = reglement.pieces || [];
        const allocatedTotal = pieces.reduce((s, p) => s + toMoney(p.MntReg || 0), 0);
        const soldeTotal = pieces.reduce((s, p) => s + toMoney(p.Solde || 0), 0);
        const remainingAmount = pieces.length > 0 ? soldeTotal : Math.max(0, totalAmount - allocatedTotal);

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

        // ── CLIENT : calcul basé sur les factures (FAV) ──────────────────────
        if (isClient === true) {
            const clientFilter = await buildClientFilter(req.user);
            // Récupérer le CodTiers du client depuis le filtre
            const codTiersCondition = clientFilter?.CodTiers;

            const favWhere = codTiersCondition ? { CodTiers: codTiersCondition } : {};

            const factures = await FavMaster.findAll({
                where: favWhere,
                attributes: ['Nf', 'TotTTC', 'MntDebit', 'MntCredit'],
            });

            let totalAmount = 0;
            let totalPaid   = 0;

            factures.forEach(fav => {
                const ttc    = toMoney(fav.TotTTC);
                const credit = toMoney(fav.MntCredit); // montant payé sur cette facture
                totalAmount += ttc;
                totalPaid   += credit;
            });

            const totalRemaining = Math.max(0, totalAmount - totalPaid);
            const stats = {
                totalDocuments: factures.length,
                totalAmount,
                totalPaid,
                totalRemaining,
                paymentPercentage: totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0,
            };
            return res.json({ status: 'success', data: stats });
        }

        // ── ADMIN / COMMERCIAL : calcul basé sur les règlements ──────────────
        const reglements = await TabReg.findAll({
            attributes: ['IDReg', 'MntReg'],
            include: [{
                model: TabRegD,
                as: 'details',
                attributes: ['MntDebit', 'MntCredit'],
            }],
        });

        let totalAmount = 0;
        let totalPaid   = 0;

        reglements.forEach(reg => {
            totalAmount += toMoney(reg.MntReg);
            const paid = reg.details?.reduce((sum, d) => sum + toMoney(d.MntCredit), 0) || 0;
            totalPaid += paid;
        });

        const remainingAmount = Math.max(0, totalAmount - totalPaid);
        const stats = {
            totalDocuments: reglements.length,
            totalAmount,
            totalPaid,
            totalRemaining: remainingAmount,
            paymentPercentage: totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0,
        };

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
        const reglement = await TabReg.findByPk(id, {
            include: [
                {
                    model: TabRegD,
                    as: 'details',
                    required: false,
                },
                {
                    model: TabRegF,
                    as: 'pieces',
                    required: false,
                }
            ]
        });
        if (!reglement) {
            return res.status(404).json({ status: 'error', message: 'Réglement non trouvé' });
        }

        const previousPaidAmount = toMoney(
            reglement.details?.reduce((sum, detail) => sum + (detail.MntCredit || 0), 0) || 0
        );

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

        const updatedPaidAmount = mntCredit !== undefined && mntCredit !== null
            ? toMoney(mntCredit)
            : previousPaidAmount;

        const paymentDelta = toMoney(updatedPaidAmount - previousPaidAmount);

        // Synchroniser l'objectif uniquement sur une hausse du montant payé
        // pour éviter les doubles comptages lors des rééditions du même règlement.
        if (paymentDelta > 0) {
            try {
                const models = req.app?.locals?.models || require('../models');
                const objectifService = new ObjectifGestionService(models);
                const invoicePieces = (reglement.pieces || [])
                    .filter((piece) => String(piece.TypPiece || '').trim().toUpperCase() === 'FA');

                if (invoicePieces.length === 0) {
                    console.log(`ℹ️ Aucun lien facture trouvé pour le règlement ${id}, objectif non mis à jour`);
                } else {
                    const totalLinkedAmount = toMoney(
                        invoicePieces.reduce((sum, piece) => sum + (piece.MntReg || piece.MntPiece || 0), 0)
                    ) || invoicePieces.length;
                    let remainingDelta = paymentDelta;

                    for (let index = 0; index < invoicePieces.length; index += 1) {
                        const piece = invoicePieces[index];
                        const facture = await FavMaster.findByPk(piece.IDPieces);
                        const isLastPiece = index === invoicePieces.length - 1;
                        const allocatedAmount = isLastPiece
                            ? toMoney(remainingDelta)
                            : toMoney((paymentDelta * toMoney(piece.MntReg || piece.MntPiece || 0)) / totalLinkedAmount);

                        if (!facture || !facture.CodRepres || allocatedAmount <= 0) {
                            continue;
                        }

                        remainingDelta = toMoney(remainingDelta - allocatedAmount);

                        const resultat = await objectifService.updateObjectifOnPayment({
                            ID_Facture: facture.Guid,
                            CodRepres: facture.CodRepres,
                            Montant: allocatedAmount,
                            MoyenPaiement: 'Paiement règlement',
                            Reference: `Règlement ${id}`,
                            Observations: `Paiement ajouté via règlement legacy ${id}`,
                            ID_Utilisateur: req.user?.UserID,
                            DateReglement: new Date(),
                        });

                        console.log(`✅ Objectif synchronisé pour facture ${facture.Guid}: ${resultat.message}`);
                    }
                }
            } catch (objectifError) {
                console.warn('⚠️ Synchronisation objectif ignorée:', objectifError.message);
            }
        }

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

        const openedReglementLinks = await sequelize.query(`
            SELECT
                f.IDPieces,
                UPPER(ISNULL(f.TypPiece, '')) AS TypPiece,
                f.IDReg,
                r.DatReg,
                ISNULL(r.MntReg, 0) - ISNULL((SELECT SUM(ISNULL(d.MntCredit, 0)) FROM TabRegD d WHERE d.IDReg = r.IDReg), 0) AS RemainingAmount
            FROM TabRegF f
            INNER JOIN TabReg r ON r.IDReg = f.IDReg
            WHERE
                r.CodTiers = :codTiers
                AND r.Payed = 0
        `, {
            replacements: { codTiers },
            type: QueryTypes.SELECT,
        });

        const openedReglementByPiece = new Map();
        openedReglementLinks.forEach((row) => {
            const key = `${String(row.TypPiece || '').trim().toUpperCase()}:${String(row.IDPieces || '').trim()}`;
            if (!openedReglementByPiece.has(key) && toMoney(row.RemainingAmount) > 0.01) {
                openedReglementByPiece.set(key, {
                    id: row.IDReg,
                    date: row.DatReg,
                    remainingAmount: toMoney(row.RemainingAmount),
                });
            }
        });

        // Combine and format
        const documents = [
            ...invoices.map(i => {
                const debit = toMoney(i.TotTTC);
                const credit = toMoney(i.MntCredit);
                const key = `FA:${String(i.Guid || '').trim()}`;
                const openedReglement = openedReglementByPiece.get(key);
                return {
                    id: i.Guid,
                    type: 'FA',
                    num: `${i.Prfx || ''}${i.Nf || ''}`,
                    date: i.DatUser,
                    debit,
                    credit,
                    remaining: Math.max(0, toMoney(debit - credit)),
                    openReglementId: openedReglement?.id || null,
                    openReglementDate: openedReglement?.date || null,
                    openReglementRemaining: openedReglement?.remainingAmount || 0,
                };
            }),
            ...deliveryNotes.map(d => {
                const debit = toMoney(d.TotTTC);
                const credit = toMoney(d.MntCredit);
                const key = `BL:${String(d.Guid || '').trim()}`;
                const openedReglement = openedReglementByPiece.get(key);
                return {
                    id: d.Guid,
                    type: 'BL',
                    num: `${d.Prfx || ''}${d.Nf || ''}`,
                    date: d.DatUser,
                    debit,
                    credit,
                    remaining: Math.max(0, toMoney(debit - credit)),
                    openReglementId: openedReglement?.id || null,
                    openReglementDate: openedReglement?.date || null,
                    openReglementRemaining: openedReglement?.remainingAmount || 0,
                };
            })
        ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

        res.json({ status: 'success', data: documents });
    } catch (err) {
        console.error('❌ getUnpaidByClient:', err);
        next(err);
    }
};

// ─── GET OPEN REGLEMENTS BY CLIENT ────────────────────────────────────────────────────────
exports.getOpenReglementsByClient = async (req, res, next) => {
    try {
        const { codTiers } = req.params;
        const codTiersValue = String(codTiers || '').trim();

        if (!codTiersValue) {
            return res.status(400).json({ status: 'error', message: 'Client obligatoire' });
        }

        const reglements = await TabReg.findAll({
            where: { CodTiers: codTiersValue },
            attributes: ['IDReg', 'DatReg', 'CodTiers', 'LibTiers', 'MntReg', 'Payed'],
            include: [{
                model: TabRegD,
                as: 'details',
                attributes: ['ID', 'MntCredit', 'DatValeur', 'ModReg', 'Montant', 'NumPieceReg', 'Banque'],
                required: false,
            }, {
                model: TabRegF,
                as: 'pieces',
                attributes: ['ID', 'IDPieces', 'TypPiece', 'NumPiece', 'MntPiece', 'MntReg', 'MDate'],
                required: false,
            }],
            order: [['DatReg', 'DESC']],
        });

        const data = reglements.map((reg) => {
            const totalAmount = toMoney(reg.MntReg || 0);
            const paidAmount = toMoney((reg.details || []).reduce((sum, detail) => sum + toMoney(detail.MntCredit), 0));
            const remainingAmount = Math.max(0, toMoney(totalAmount - paidAmount));

            const pieceKeys = Array.from(new Set((reg.pieces || []).map((piece) => `${String(piece.TypPiece || '').trim().toUpperCase()}:${String(piece.IDPieces || '').trim()}`)));

            return {
                id: reg.IDReg,
                date: reg.DatReg,
                codTiers: reg.CodTiers,
                client: reg.LibTiers,
                totalAmount,
                paidAmount,
                remainingAmount,
                isPayed: remainingAmount <= 0.01,
                paymentStatus: getPaymentStatus(totalAmount, paidAmount),
                paymentPercentage: totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0,
                pieceKeys,
                piecesCount: reg.pieces?.length || 0,
                paymentsCount: reg.details?.length || 0,
            };
        }).filter((reg) => reg.remainingAmount > 0.01);

        return res.json({ status: 'success', data });
    } catch (err) {
        console.error('❌ getOpenReglementsByClient:', err);
        next(err);
    }
};

// ─── GET REGLEMENT HISTORY FOR A DOCUMENT (FA/BL) ─────────────────────────────────────────
exports.getReglementHistoryByDocument = async (req, res, next) => {
    try {
        const { type, id } = req.params;
        const normalizedType = String(type || '').trim().toUpperCase();
        const pieceId = String(id || '').trim();

        if (!['FA', 'BL'].includes(normalizedType) || !pieceId) {
            return res.status(400).json({ status: 'error', message: 'Paramètres document invalides' });
        }

        const links = await TabRegF.findAll({
            where: {
                IDPieces: pieceId,
                TypPiece: normalizedType,
            },
            attributes: ['ID', 'IDReg', 'IDPieces', 'NumPiece', 'MDate', 'MntPiece', 'MntReg', 'Solde', 'TypPiece'],
            include: [{
                model: TabReg,
                as: 'master',
                attributes: ['IDReg', 'DatReg', 'CodTiers', 'LibTiers', 'MntReg', 'Payed', 'CUser', 'DatUser'],
                include: [{
                    model: TabRegD,
                    as: 'details',
                    attributes: ['ID', 'DatValeur', 'MntCredit', 'MntDebit', 'Montant', 'ModReg', 'NumPieceReg', 'Banque', 'DetPieceReg'],
                    required: false,
                }],
                required: true,
            }],
            order: [['MDate', 'DESC']],
        });

        if (!links || links.length === 0) {
            return res.json({ status: 'success', hasReglement: false, data: [] });
        }

        const grouped = new Map();
        links.forEach((link) => {
            const reg = link.master;
            const regId = reg.IDReg;
            if (!grouped.has(regId)) {
                const totalAmount = toMoney(reg.MntReg || 0);
                const paidAmount = toMoney((reg.details || []).reduce((sum, d) => sum + toMoney(d.MntCredit), 0));
                const remainingAmount = Math.max(0, toMoney(totalAmount - paidAmount));

                grouped.set(regId, {
                    id: reg.IDReg,
                    date: reg.DatReg,
                    codTiers: reg.CodTiers,
                    client: reg.LibTiers,
                    createdBy: reg.CUser,
                    createdDate: reg.DatUser,
                    totalAmount,
                    paidAmount,
                    remainingAmount,
                    isPayed: remainingAmount <= 0.01,
                    paymentStatus: getPaymentStatus(totalAmount, paidAmount),
                    paymentPercentage: totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0,
                    payments: (reg.details || []).map((d) => ({
                        id: d.ID,
                        date: d.DatValeur,
                        mode: d.ModReg,
                        montant: toMoney(d.Montant || d.MntCredit || 0),
                        credit: toMoney(d.MntCredit || 0),
                        debit: toMoney(d.MntDebit || 0),
                        numPiece: d.NumPieceReg,
                        banque: d.Banque,
                        detail: d.DetPieceReg,
                    })),
                    tranches: [],
                });
            }

            grouped.get(regId).tranches.push({
                id: link.ID,
                reglementId: link.IDReg,
                pieceId: link.IDPieces,
                pieceType: link.TypPiece,
                pieceNum: link.NumPiece,
                date: link.MDate,
                montantPiece: toMoney(link.MntPiece),
                montantRegle: toMoney(link.MntReg),
                solde: toMoney(link.Solde),
            });
        });

        const data = Array.from(grouped.values())
            .map((reg) => ({
                ...reg,
                tranches: reg.tranches.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)),
                payments: reg.payments.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)),
            }))
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

        return res.json({ status: 'success', hasReglement: true, data });
    } catch (err) {
        console.error('❌ getReglementHistoryByDocument:', err);
        next(err);
    }
};
