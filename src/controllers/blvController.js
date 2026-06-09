const { BlvMaster, BlvDetail, Tiers, TiersClasse, TiersGouvernorat, TiersCategorie, TabSociete, sequelize } = require('../models');
const PDFService = require('../services/pdfService');
const { Op, TableHints, QueryTypes } = require('sequelize');

const mouvementService = require('../services/mouvementService'); // ✅ Service de traçabilité mouvements
const { randomUUID } = require('crypto');

// Les fonctions utilitaires de filtrage hard-codées (isCommercialRole, buildCommercialCodRepresFilter, etc.) 
// ont été supprimées car elles sont maintenant gérées de manière centralisée par 
// le service applyTableDrivenFilters via la table TabRoleFilterVisibility.

// ⚠️ Helpers nécessaires ici (sinon ReferenceError au runtime)
const normalizeRole = (role) => String(role || '').trim().toLowerCase();
const isCommercialRole = (role) => ['commercial', 'commerciale'].includes(normalizeRole(role));
const isAdminUser = (user = {}) => ['admin', 'administrateur'].includes(normalizeRole(user?.UserRole));
const resolveCommercialCodRepresValue = (user = {}) => String(user?.id || user?.UserID || '').trim();
const buildCommercialCodRepresFilter = (user = {}) => {
    const codRepres = resolveCommercialCodRepresValue(user);
    return codRepres ? { CodRepres: codRepres } : {};
};


/**
 * Helper function to parse dates for SQL Server through Sequelize
 */
const parseDateValue = (dateValue) => {
    if (!dateValue || dateValue === '' || dateValue === 'null' || dateValue === null || dateValue === undefined) {
        return null;
    }

    try {
        let date;
        if (dateValue instanceof Date) {
            date = dateValue;
        } else {
            const cleaned = String(dateValue).replace(/([+-]\d{2}:\d{2}|Z)$/, '').trim();
            date = new Date(cleaned);
        }

        if (isNaN(date.getTime())) return null;
        return date;
    } catch (e) {
        return null;
    }
};

/**
 * Helper function to sanitize blv master data
 */
const sanitizeMasterData = (masterData) => {
    const sanitized = { ...masterData };
    delete sanitized.NetHT;
    delete sanitized.Rest;
    delete sanitized.DatUser;
    delete sanitized.DatCreateUser;

    const dateFields = ['MDate', 'DatLiv'];
    dateFields.forEach(field => {
        const val = sanitized[field];
        if (!val || val === '' || val === 'null' || val === null) {
            sanitized[field] = null;
        } else {
            const parsed = parseDateValue(val);
            sanitized[field] = parsed || null;
        }
    });

    const numericFields = ['TotHT', 'TotTva', 'TotTTC', 'TotRem', 'Timbre'];
    numericFields.forEach(field => {
        if (sanitized.hasOwnProperty(field)) {
            const num = parseFloat(sanitized[field]);
            sanitized[field] = isNaN(num) ? 0 : num;
        }
    });

    const booleanFields = ['Valid', 'bTransf', 'bLivr'];
    booleanFields.forEach(field => {
        if (sanitized.hasOwnProperty(field)) {
            sanitized[field] = !!sanitized[field];
        }
    });

    return sanitized;
};

/**
 * Helper function to sanitize blv detail data
 */
const sanitizeBlvDetailData = (detail = {}) => {
    const sanitized = { ...detail };
    // Remove computed columns from TabBlvd
    delete sanitized.MntHT;
    delete sanitized.NoDetail;
    delete sanitized.Guid;
    return sanitized;
};

/**
 * Récupérer tous les bons de livraison (master)
 */
exports.getAllBlv = async (req, res, next) => {
    try {
        const filterHelper = require('../utils/filterHelper');
        
        // Module 6 = BLV (Table-driven filters from TabRoleFilterVisibility)
        const { where, limit, offset, page } = await filterHelper.applyTableDrivenFiltersWithPagination(
            '6',
            req.query,
            req.user
        );

        const { count, rows } = await BlvMaster.findAndCountAll({
            where,
            include: [{
                model: Tiers,
                as: 'client',
                attributes: ['Raisoc', 'CodTiers', 'Ville', 'MapsRegion', 'Gouvernorat', 'Classe', 'Categorie'],
                include: [
                    { model: TiersClasse, as: 'tiersClasse', attributes: ['id', 'libelle'], required: false },
                    { model: TiersGouvernorat, as: 'region', attributes: ['id', 'libelle'], required: false },
                    { model: TiersCategorie, as: 'tiersCategorieObj', attributes: ['id', 'libelle'], required: false }
                ]
            }],
            order: [['DatUser', 'DESC']],
            limit,
            offset,
            tableHint: TableHints.NOLOCK
        });


        return res.status(200).json(
            filterHelper.formatPaginatedResponse(rows, count, page, limit)
        );
    } catch (error) {
        console.error('❌ Error getAllBlv:', error);
        next(error);
    }
};

/**
 * Récupérer un bon de livraison par Guid
 */
exports.getBlvById = async (req, res, next) => {
    try {
        const { id } = req.params;

        let where;
        if (isAdminUser(req.user)) {
            where = { Guid: id };
        } else if (isCommercialRole(req.user?.UserRole)) {
            const userId = resolveCommercialCodRepresValue(req.user);
            const clientRows = await sequelize.query(
                `SELECT CodTiers FROM TabTiers WHERE CONVERT(VARCHAR, codRepresTiers) = :userId`,
                { replacements: { userId }, type: QueryTypes.SELECT }
            );
            const clientCodes = clientRows.map(r => r.CodTiers).filter(Boolean);
            const accessConditions = [];
            if (userId) accessConditions.push({ CodRepres: userId });
            if (clientCodes.length > 0) accessConditions.push({ CodTiers: { [Op.in]: clientCodes } });
            if (accessConditions.length === 0) {
                return res.status(403).json({ status: 'error', message: 'Accès refusé' });
            }
            const accessWhere = accessConditions.length === 1 ? accessConditions[0] : { [Op.or]: accessConditions };
            where = { [Op.and]: [{ Guid: id }, accessWhere] };
        } else {
            const filterHelper = require('../utils/filterHelper');
            const securityWhere = await filterHelper.applyTableDrivenFilters('6', {}, req.user);
            where = { [Op.and]: [{ Guid: id }, securityWhere] };
        }

        const blv = await BlvMaster.findOne({
            where,
            include: [
                { model: BlvDetail, as: 'details' },
                { model: Tiers, as: 'client' }
            ],
            tableHint: TableHints.NOLOCK
        });



        if (!blv) {
            return res.status(404).json({ status: 'error', message: 'Bon de livraison non trouvé' });
        }

        return res.status(200).json({ status: 'success', data: blv });
    } catch (error) {
        console.error('❌ Error getBlvById:', error);
        next(error);
    }
};

/**
 * Créer un nouveau bon de livraison
 */
exports.createBlv = async (req, res, next) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const { master, details } = req.body;

        if (!master) {
            return res.status(400).json({ status: 'error', message: 'Master data is required' });
        }

        if (isCommercialRole(req.user?.UserRole)) {
            const codRepres = resolveCommercialCodRepresValue(req.user);
            if (!codRepres) {
                if (transaction && !transaction.finished) await transaction.rollback();
                return res.status(403).json({ status: 'error', message: 'Code représentant introuvable pour ce commercial' });
            }
            master.CodRepres = codRepres;
        }

        if (!master.Nf) {
            const lastBlv = await BlvMaster.findOne({
                order: [['Nf', 'DESC']],
                transaction
            });
            master.Nf = (lastBlv?.Nf || 0) + 1;
        }

        const masterData = sanitizeMasterData(master);
        masterData.Guid = randomUUID();
        masterData.bLivr = true;

        // Ajouter les dates avec GETDATE() SQL (bypass Sequelize timezone)
        masterData.DatUser = sequelize.literal('GETDATE()');
        masterData.MDate = sequelize.literal('GETDATE()');

        // Créer le master
        const newBlv = await BlvMaster.create(masterData, { transaction });

        if (details && Array.isArray(details) && details.length > 0) {
            const detailsWithNf = details.map((d) => ({
                ...sanitizeBlvDetailData(d),
                NF: newBlv.Nf,
                ID: 'BL',
                Guid: randomUUID()
            }));
            await BlvDetail.bulkCreate(detailsWithNf, { transaction });
        }

        // ── Décrémentation automatique du stock à la création ──
        if (details && details.length > 0) {
            const pathMod = require('path');
            const fsSync = require('fs').promises;
            const CFG = pathMod.join(__dirname, '../../data/stockConfig.json');
            let jsonCfg = { decrementationSur: { blv: true } };
            try { jsonCfg = { ...jsonCfg, ...JSON.parse(await fsSync.readFile(CFG, 'utf-8')) }; } catch {}

            if (jsonCfg.decrementationSur?.blv === false) {
                // Décrémentation BLV désactivée dans la config stock — skip
            } else {
            const { getStockControlForRole } = require('../services/stockConfigService');
            const ctrlStk = await getStockControlForRole(req.user?.UserRole, 6, transaction);
            const config = { autoriserVenteHorsStock: !ctrlStk };

            const stockUpdates = [];
            const insuffisants = [];

            for (const detail of details) {
                const codArt = detail.CodArt;
                const qteDemandee = parseFloat(detail.Qt) || 0;
                if (!codArt || qteDemandee <= 0) continue;

                const [stockRow] = await sequelize.query(
                    'SELECT Qte FROM TabStock WHERE CodArt = :codArt',
                    { replacements: { codArt }, type: QueryTypes.SELECT, transaction }
                );
                const qteActuelle = parseFloat(stockRow?.Qte) || 0;

                if (!config.autoriserVenteHorsStock && qteDemandee > qteActuelle) {
                    insuffisants.push({ codArt, libArt: detail.LibArt || codArt, stockActuel: qteActuelle, qteDemandee });
                } else {
                    stockUpdates.push({ codArt, qteApres: qteActuelle - qteDemandee });
                }
            }

            if (insuffisants.length > 0) {
                await transaction.rollback();
                return res.status(409).json({
                    status: 'error',
                    code: 'STOCK_INSUFFISANT',
                    message: 'Stock insuffisant pour créer ce bon de livraison.',
                    insuffisants,
                });
            }

            for (const upd of stockUpdates) {
                await sequelize.query(
                    'UPDATE TabStock SET Qte = :qteApres WHERE CodArt = :codArt',
                    { replacements: { qteApres: upd.qteApres, codArt: upd.codArt }, transaction }
                );
            }

            await sequelize.query(
                'UPDATE TabBlvm SET StockDecremente = 1 WHERE Guid = :guid',
                { replacements: { guid: newBlv.Guid }, transaction }
            );
            } // fin else decrementationSur.blv
        }

        await transaction.commit();

        // ✅ ENREGISTRER LA CRÉATION DANS MvtDocs
        try {
          const montants = {
            codTiers: masterData.CodTiers,
            libTiers: masterData.LibTiers,
            totalHT: masterData.TotHT,
            totalRem: masterData.TotRem,
            totalFodec: masterData.TotFodec || 0,
            totalTVA: masterData.TotTva,
            totalTTC: masterData.TotTTC
          };
          const userId = req.user?.id || req.user?.UserID;
          await mouvementService.enregistrerCreation('BLV', newBlv.Nf, montants, userId);
          console.log(`✅ Mouvement enregistré: Création BLV #${newBlv.Nf} par utilisateur ${userId}`);
        } catch (mouvementError) {
          console.error('⚠️ Erreur enregistrement mouvement (non bloquant):', mouvementError.message);
        }

        // 🔔 Notification client + admins
        try {
          const { notifyDocumentCreated } = require('../utils/notificationUtils');
          const { Tiers } = require('../models');
          const userId = req.user?.id || req.user?.UserID;
          const tiers = masterData.CodTiers
            ? await Tiers.findOne({ where: { CodTiers: masterData.CodTiers } })
            : null;
          if (tiers) {
            await notifyDocumentCreated('BLV', newBlv.Nf, tiers, userId, { totalTTC: masterData.TotTTC });
          }
        } catch (notifErr) {
          console.error('⚠️ Erreur notification BLV (non bloquant):', notifErr.message);
        }

        const result = await BlvMaster.findOne({
            where: { Guid: newBlv.Guid },
            include: [{ model: BlvDetail, as: 'details' }]
        });

        res.status(201).json({ status: 'success', data: result });
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('❌ Error createBlv:', error);
        next(error);
    }
};

/**
 * Mettre à jour un bon de livraison
 */
exports.updateBlv = async (req, res, next) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const { id } = req.params;
        const { master, details } = req.body;

        const blvWhere = isCommercialRole(req.user?.UserRole)
            ? { [Op.and]: [{ Guid: id }, buildCommercialCodRepresFilter(req.user)] }
            : { Guid: id };
        const blv = await BlvMaster.findOne({ where: blvWhere, transaction });
        if (!blv) {
            if (transaction && !transaction.finished) await transaction.rollback();
            return res.status(404).json({ status: 'error', message: 'Bon de livraison non trouvé' });
        }

        const masterData = sanitizeMasterData(master);

        if (isCommercialRole(req.user?.UserRole)) {
            const codRepres = resolveCommercialCodRepresValue(req.user);
            if (!codRepres) {
                if (transaction && !transaction.finished) await transaction.rollback();
                return res.status(403).json({ status: 'error', message: 'Code représentant introuvable pour ce commercial' });
            }
            masterData.CodRepres = codRepres;
        }

        masterData.DatUser = sequelize.literal('GETDATE()');
        await blv.update(masterData, { transaction });

        if (details && Array.isArray(details)) {
            // ── Ajustement stock si déjà décrémenté ──
            if (blv.StockDecremente) {
                const { getStockControlForRole } = require('../services/stockConfigService');
                const ctrlStk = await getStockControlForRole(req.user?.UserRole, 6, transaction);
                const config = { autoriserVenteHorsStock: !ctrlStk };

                // 1. Restaurer l'ancien stock (ajouter les anciennes quantités dans TabStock)
                const oldDetails = await BlvDetail.findAll({ where: { NF: blv.Nf }, transaction });
                for (const old of oldDetails) {
                    const qteOld = parseFloat(old.Qt) || 0;
                    if (!old.CodArt || qteOld <= 0) continue;
                    await sequelize.query(
                        'UPDATE TabStock SET Qte = Qte + :qte WHERE CodArt = :codArt',
                        { replacements: { qte: qteOld, codArt: old.CodArt }, transaction }
                    );
                }

                // 2. Vérifier et appliquer les nouvelles quantités
                const insuffisants = [];
                const stockUpdates = [];
                for (const detail of details) {
                    const codArt = detail.CodArt;
                    const qteDemandee = parseFloat(detail.Qt) || 0;
                    if (!codArt || qteDemandee <= 0) continue;
                    const [stockRow] = await sequelize.query(
                        'SELECT Qte FROM TabStock WHERE CodArt = :codArt',
                        { replacements: { codArt }, type: QueryTypes.SELECT, transaction }
                    );
                    const qteActuelle = parseFloat(stockRow?.Qte) || 0;
                    if (!config.autoriserVenteHorsStock && qteDemandee > qteActuelle) {
                        insuffisants.push({ codArt, libArt: detail.LibArt || codArt, stockActuel: qteActuelle, qteDemandee });
                    } else {
                        stockUpdates.push({ codArt, qteApres: qteActuelle - qteDemandee });
                    }
                }

                if (insuffisants.length > 0) {
                    await transaction.rollback();
                    return res.status(409).json({
                        status: 'error',
                        code: 'STOCK_INSUFFISANT',
                        message: 'Stock insuffisant pour mettre à jour ce bon de livraison.',
                        insuffisants,
                    });
                }

                for (const upd of stockUpdates) {
                    await sequelize.query(
                        'UPDATE TabStock SET Qte = :qteApres WHERE CodArt = :codArt',
                        { replacements: { qteApres: upd.qteApres, codArt: upd.codArt }, transaction }
                    );
                }
            }

            await BlvDetail.destroy({ where: { NF: blv.Nf }, transaction });
            if (details.length > 0) {
                const detailsWithNf = details.map((d) => ({
                    ...sanitizeBlvDetailData(d),
                    NF: blv.Nf,
                    ID: 'BL',
                    Guid: randomUUID()
                }));
                await BlvDetail.bulkCreate(detailsWithNf, { transaction });
            }
        }

        await transaction.commit();

        const result = await BlvMaster.findOne({
            where: { Guid: id },
            include: [{ model: BlvDetail, as: 'details' }]
        });

        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('❌ Error updateBlv:', error);
        next(error);
    }
};

/**
 * Supprimer un bon de livraison
 */
exports.deleteBlv = async (req, res, next) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const { id } = req.params;
        const blvWhere = isCommercialRole(req.user?.UserRole)
            ? { [Op.and]: [{ Guid: id }, buildCommercialCodRepresFilter(req.user)] }
            : { Guid: id };
        const blv = await BlvMaster.findOne({
            where: blvWhere,
            include: [{ model: BlvDetail, as: 'details' }],
            transaction
        });

        if (!blv) {
            await transaction.rollback();
            return res.status(404).json({ status: 'error', message: 'Bon de livraison non trouvé' });
        }

        // ── Restaurer le stock si déjà décrémenté (TabStock.Qte + quantités livrées)
        if (blv.StockDecremente) {
            const details = blv.details || [];
            for (const detail of details) {
                const qte = parseFloat(detail.Qt) || 0;
                if (!detail.CodArt || qte <= 0) continue;
                await sequelize.query(
                    'UPDATE TabStock SET Qte = Qte + :qte WHERE CodArt = :codArt',
                    { replacements: { qte, codArt: detail.CodArt }, transaction }
                );
            }
        }

        await BlvDetail.destroy({ where: { NF: blv.Nf }, transaction });
        await blv.destroy({ transaction });

        await transaction.commit();

        res.status(200).json({ status: 'success', message: 'Bon de livraison supprimé avec succès' });
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('❌ Error deleteBlv:', error);
        next(error);
    }
};

/**
 * Valider un BLV : vérifie le stock, décrémente si autorisé, marque StockDecremente = true
 * PATCH /blv/:id/validate
 */
exports.validateBlv = async (req, res, next) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const { id } = req.params;

        const blv = await BlvMaster.findOne({
            where: { Guid: id },
            include: [{ model: BlvDetail, as: 'details' }],
            transaction,
        });
        if (!blv) {
            await transaction.rollback();
            return res.status(404).json({ status: 'error', message: 'BLV non trouvé' });
        }
        if (blv.Valid) {
            await transaction.rollback();
            return res.status(400).json({ status: 'error', message: 'Ce BLV est déjà validé' });
        }
        if (blv.StockDecremente) {
            await transaction.rollback();
            return res.status(400).json({ status: 'error', message: 'Le stock a déjà été décrémenté pour ce BLV' });
        }

        const { getStockControlForRole } = require('../services/stockConfigService');
        const ctrlStk = await getStockControlForRole(req.user?.UserRole, 6, transaction);
        const config = { autoriserVenteHorsStock: !ctrlStk };

        const details = blv.details || [];
        const stockUpdates = [];
        const insuffisants = [];

        // Vérification de chaque article
        for (const detail of details) {
            const codArt = detail.CodArt;
            const qteDemandee = parseFloat(detail.Qt) || 0;
            if (!codArt || qteDemandee <= 0) continue;

            const [stockRow] = await sequelize.query(
                'SELECT IDArt, Qte FROM TabStock WHERE CodArt = :codArt',
                { replacements: { codArt }, type: QueryTypes.SELECT, transaction }
            );

            const qteActuelle = parseFloat(stockRow?.Qte) || 0;
            const qteApres = qteActuelle - qteDemandee;

            if (!config.autoriserVenteHorsStock && qteDemandee > qteActuelle) {
                insuffisants.push({
                    codArt,
                    libArt: detail.LibArt || codArt,
                    stockActuel: qteActuelle,
                    qteDemandee,
                });
            } else {
                stockUpdates.push({ codArt, qteApres, qteActuelle, qteDemandee, idArt: stockRow?.IDArt });
            }
        }

        if (insuffisants.length > 0) {
            await transaction.rollback();
            return res.status(409).json({
                status: 'error',
                code: 'STOCK_INSUFFISANT',
                message: 'Impossible de valider : quantité insuffisante en stock.',
                insuffisants,
            });
        }

        // Appliquer les décrémentations
        for (const upd of stockUpdates) {
            await sequelize.query(
                'UPDATE TabStock SET Qte = :qteApres WHERE CodArt = :codArt',
                { replacements: { qteApres: upd.qteApres, codArt: upd.codArt }, transaction }
            );
        }

        await sequelize.query(
            `UPDATE TabBlvm SET Valid = 1, DatUser = GETDATE(), StockDecremente = 1 WHERE Guid = :guid`,
            { replacements: { guid: id }, transaction }
        );

        await transaction.commit();

        const result = await BlvMaster.findOne({
            where: { Guid: id },
            include: [{ model: BlvDetail, as: 'details' }],
        });

        return res.status(200).json({
            status: 'success',
            message: insuffisants.length === 0
                ? 'BLV validé. Stock décrémenté avec succès.'
                : 'BLV validé avec stock négatif (hors stock autorisé).',
            data: result,
            stockUpdates: stockUpdates.map(u => ({
                codArt: u.codArt,
                avant: u.qteActuelle,
                apres: u.qteApres,
                quantite: u.qteDemandee,
            })),
        });
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('❌ Error validateBlv:', error);
        next(error);
    }
};

/**
 * Récupérer les bons de livraison de l'utilisateur connecté (Client Portal)
 */
exports.getMyBlv = async (req, res, next) => {
    try {
        const filterHelper = require('../utils/filterHelper');

        // Clients: filtrage direct par CodTiers sans passer par TabAWProfileAccess
        const userRole = (req.user?.UserRole || '').toLowerCase().trim();
        const isClient = ['client'].includes(userRole);

        let where = {};
        let limit = null;
        let offset = 0;
        let page = 1;

        if (isClient) {
            let codTiers = req.user.getDataValue('CodTiers');
            if (!codTiers) {
                const email = (req.user.EmailPro || '').toLowerCase().trim();
                if (!email) return res.json(filterHelper.formatPaginatedResponse([], 0, 1, null));
                const rows = await sequelize.query(
                    `SELECT TOP 1 CodTiers FROM TabTiers WHERE LOWER(LTRIM(RTRIM(COALESCE(Email, '')))) = LOWER(LTRIM(RTRIM(:email)))`,
                    { replacements: { email }, type: QueryTypes.SELECT }
                );
                codTiers = rows[0]?.CodTiers;
            }
            if (!codTiers) return res.json(filterHelper.formatPaginatedResponse([], 0, 1, null));
            where = { CodTiers: codTiers };
        } else {
            ({ where, limit, offset, page } = await filterHelper.applyTableDrivenFiltersWithPagination('6', req.query, req.user));
        }

        const { count, rows } = await BlvMaster.findAndCountAll({
            where,
            include: [{
                model: Tiers,
                as: 'client',
                attributes: ['Raisoc', 'CodTiers', 'Ville', 'MapsRegion', 'Gouvernorat', 'Classe', 'Categorie'],
                include: [
                    { model: TiersClasse, as: 'tiersClasse', attributes: ['id', 'libelle'], required: false },
                    { model: TiersGouvernorat, as: 'region', attributes: ['id', 'libelle'], required: false },
                    { model: TiersCategorie, as: 'tiersCategorieObj', attributes: ['id', 'libelle'], required: false }
                ]
            }],
            order: [['DatUser', 'DESC']],
            ...(limit !== null && { limit, offset }),
            tableHint: TableHints.NOLOCK
        });

        res.json(filterHelper.formatPaginatedResponse(rows, count, page, limit));
    } catch (error) {
        console.error('❌ Error getMyBlv:', error);
        next(error);
    }
};


/**
 * Générer le PDF d'un bon de livraison
 */
exports.generateBlvPDF = async (req, res, next) => {
    try {
        const { id } = req.params;
        const blv = await BlvMaster.findOne({
            where: { Guid: id },
            include: [
                { model: BlvDetail, as: 'details' },
                { model: Tiers, as: 'client' }
            ]
        });
        if (!blv) return res.status(404).json({ status: 'error', message: 'Bon de livraison non trouvé' });
        const docData = blv.toJSON();
        const soc = await TabSociete.findOne();
        const pdfBuffer = await PDFService.generateCommercialPDF(docData, soc, 'BON DE LIVRAISON');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=bl_${docData.Prfx || 'BL'}${docData.Nf}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('❌ Error generateBlvPDF:', error);
        next(error);
    }
};

// ─── SIGNATURE BLV ────────────────────────────────────────────────────────────
exports.saveSignatureBlv = async (req, res, next) => {
    try {
        const { signatureData } = req.body;
        if (!signatureData || !String(signatureData).startsWith('data:image/'))
            return res.status(400).json({ status: 'error', message: 'Données de signature invalides' });

        await sequelize.query(`
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='TabBlvm' AND COLUMN_NAME='SignatureData')
            ALTER TABLE TabBlvm ADD SignatureData NVARCHAR(MAX) NULL
        `, { type: QueryTypes.RAW });

        const blv = await BlvMaster.findOne({ where: { Guid: req.params.id } });
        if (!blv) return res.status(404).json({ status: 'error', message: 'Bon de livraison introuvable' });

        await sequelize.query(`UPDATE TabBlvm SET SignatureData=:sig WHERE Guid=:guid`,
            { replacements: { sig: signatureData, guid: req.params.id }, type: QueryTypes.UPDATE });

        res.json({ status: 'success', message: 'Signature enregistrée' });
    } catch (error) { console.error('❌ saveSignatureBlv:', error); next(error); }
};

exports.deleteSignatureBlv = async (req, res, next) => {
    try {
        const blv = await BlvMaster.findOne({ where: { Guid: req.params.id } });
        if (!blv) return res.status(404).json({ status: 'error', message: 'Bon de livraison introuvable' });

        await sequelize.query(`UPDATE TabBlvm SET SignatureData=NULL WHERE Guid=:guid`,
            { replacements: { guid: req.params.id }, type: QueryTypes.UPDATE });

        res.json({ status: 'success', message: 'Signature supprimée' });
    } catch (error) { console.error('❌ deleteSignatureBlv:', error); next(error); }
};

// ─── SIGNATURE CLIENT BLV ─────────────────────────────────────────────────────
exports.saveClientSignatureBlv = async (req, res, next) => {
    try {
        const { signatureData } = req.body;
        if (!signatureData || !String(signatureData).startsWith('data:image/'))
            return res.status(400).json({ status: 'error', message: 'Données de signature invalides' });

        await sequelize.query(`
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='TabBlvm' AND COLUMN_NAME='ClientSignatureData')
            ALTER TABLE TabBlvm ADD ClientSignatureData NVARCHAR(MAX) NULL
        `, { type: QueryTypes.RAW });

        const normalizedRole = String(req.user?.UserRole || '').trim().toLowerCase();
        const isClient = normalizedRole === 'client';
        const where = { Guid: req.params.id };
        if (isClient && req.user?.CodTiers) {
            where.CodTiers = req.user.CodTiers;
        }

        const blv = await BlvMaster.findOne({ where });
        if (!blv) return res.status(404).json({ status: 'error', message: 'Bon de livraison introuvable ou accès refusé' });

        await sequelize.query(`UPDATE TabBlvm SET ClientSignatureData=:sig WHERE Guid=:guid`,
            { replacements: { sig: signatureData, guid: req.params.id }, type: QueryTypes.UPDATE });

        res.json({ status: 'success', message: 'Signature client enregistrée' });
    } catch (error) { console.error('❌ saveClientSignatureBlv:', error); next(error); }
};

exports.deleteClientSignatureBlv = async (req, res, next) => {
    try {
        const normalizedRole = String(req.user?.UserRole || '').trim().toLowerCase();
        const isClient = normalizedRole === 'client';
        const where = { Guid: req.params.id };
        if (isClient && req.user?.CodTiers) {
            where.CodTiers = req.user.CodTiers;
        }

        const blv = await BlvMaster.findOne({ where });
        if (!blv) return res.status(404).json({ status: 'error', message: 'Bon de livraison introuvable ou accès refusé' });

        await sequelize.query(`UPDATE TabBlvm SET ClientSignatureData=NULL WHERE Guid=:guid`,
            { replacements: { guid: req.params.id }, type: QueryTypes.UPDATE });

        res.json({ status: 'success', message: 'Signature client supprimée' });
    } catch (error) { console.error('❌ deleteClientSignatureBlv:', error); next(error); }
};
