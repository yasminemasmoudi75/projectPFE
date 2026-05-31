const { FavMaster, FavDetail, Tiers, TiersClasse, TiersGouvernorat, TiersCategorie, TabSociete, sequelize } = require('../models');
const PDFService = require('../services/pdfService');
const { Op, TableHints, QueryTypes } = require('sequelize');

const mouvementService = require('../services/mouvementService'); // ✅ Service de traçabilité mouvements
const { randomUUID } = require('crypto');

// Les fonctions utilitaires de filtrage hard-codées (isCommercialRole, buildCommercialCodRepresFilter, etc.) 
// ont été supprimées car elles sont maintenant gérées de manière centralisée par 
// le service applyTableDrivenFilters via la table TabRoleFilterVisibility.

const normalizeRole = (role) => String(role || '').trim().toLowerCase();

const isCommercialUser = (user = {}) => {
    return ['commercial', 'commerciale'].includes(normalizeRole(user?.UserRole));
};
const isAdminUser = (user = {}) => ['admin', 'administrateur'].includes(normalizeRole(user?.UserRole));

const buildFavSecurityWhere = async (guid, user, transaction) => {
    const filterHelper = require('../utils/filterHelper');
    const securityWhere = await filterHelper.applyTableDrivenFilters('7', {}, user, transaction);
    return { [Op.and]: [{ Guid: guid }, securityWhere] };
};

const sanitizeFavDetailData = (detail = {}) => {
    const sanitized = { ...detail };

    // DB-managed / computed columns should never be written from client payload.
    delete sanitized.MntHT;
    delete sanitized.MntTVA;
    delete sanitized.MntFodec;
    delete sanitized.NetHT;

    // Identity / generated fields.
    delete sanitized.NoDetail;
    delete sanitized.Guid;

    return sanitized;
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
 * Helper function to sanitize fav master data
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
 * Récupérer toutes les factures (master)
 */
exports.getAllFav = async (req, res, next) => {
    try {
        const filterHelper = require('../utils/filterHelper');
        
        // Module 7 = FAV (Table-driven filters from TabRoleFilterVisibility)
        const { where, limit, offset, page } = await filterHelper.applyTableDrivenFiltersWithPagination(
            '7',
            req.query,
            req.user
        );


        const { count, rows } = await FavMaster.findAndCountAll({
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
        console.error('❌ Error getAllFav:', error);
        next(error);
    }
};

/**
 * Récupérer une facture par Guid
 */
exports.getFavById = async (req, res, next) => {
    try {
        const { id } = req.params;

        let where;
        if (isAdminUser(req.user)) {
            where = { Guid: id };
        } else if (isCommercialUser(req.user)) {
            const userId = String(req.user?.UserID || req.user?.id || '').trim();
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
            const securityWhere = await filterHelper.applyTableDrivenFilters('7', {}, req.user);
            where = { [Op.and]: [{ Guid: id }, securityWhere] };
        }


        const fav = await FavMaster.findOne({
            where,
            include: [
                { model: FavDetail, as: 'details' },
                { model: Tiers, as: 'client' }
            ],
            tableHint: TableHints.NOLOCK
        });



        if (!fav) {
            return res.status(404).json({ status: 'error', message: 'Facture non trouvée' });
        }

        return res.status(200).json({ status: 'success', data: fav });
    } catch (error) {
        console.error('❌ Error getFavById:', error);
        next(error);
    }
};

/**
 * Créer une nouvelle facture
 */
exports.createFav = async (req, res, next) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const { master, details } = req.body;

        if (!master) {
            return res.status(400).json({ status: 'error', message: 'Master data is required' });
        }

        if (!master.CodTiers) {
            if (transaction && !transaction.finished) await transaction.rollback();
            return res.status(400).json({ status: 'error', message: 'Client (CodTiers) est obligatoire' });
        }

        const selectedTier = await Tiers.findOne({
            where: { CodTiers: master.CodTiers },
            attributes: ['IDTiers', 'CodTiers', 'Raisoc', 'Adresse', 'Ville', 'Email'],
            transaction
        });

        if (!selectedTier) {
            if (transaction && !transaction.finished) await transaction.rollback();
            return res.status(400).json({ status: 'error', message: 'Client sélectionné introuvable' });
        }

        // Keep textual client fields aligned with Tiers to avoid duplicated/stale data in documents.
        master.CodTiers = selectedTier.CodTiers;
        master.LibTiers = selectedTier.Raisoc || master.LibTiers || '';
        master.Adresse = selectedTier.Adresse || master.Adresse || '';
        master.Ville = selectedTier.Ville || master.Ville || '';

        if (isCommercialUser(req.user)) {
            const codRepres = String(req.user?.id || req.user?.UserID || '').trim();
            if (codRepres) master.CodRepres = codRepres;
        }


        if (!master.Nf) {
            const lastFav = await FavMaster.findOne({
                order: [['Nf', 'DESC']],
                transaction
            });
            master.Nf = (lastFav?.Nf || 0) + 1;
        }

        const masterData = sanitizeMasterData(master);
        masterData.Guid = randomUUID();

        // Ajouter les dates avec GETDATE() SQL (bypass Sequelize timezone)
        masterData.DatCreateUser = sequelize.literal('GETDATE()');
        masterData.DatUser = sequelize.literal('GETDATE()');
        masterData.MDate = sequelize.literal('GETDATE()');

        // Créer le master
        const newFav = await FavMaster.create(masterData, { transaction });

        if (details && Array.isArray(details) && details.length > 0) {
            const detailsWithNf = details.map((d) => ({
                ...sanitizeFavDetailData(d),
                NF: newFav.Nf,
                ID: 'FA',
                Guid: randomUUID()
            }));
            await FavDetail.bulkCreate(detailsWithNf, { transaction });
        }

        // ── Décrémentation automatique du stock à la création ──
        const sourceBlvGuid = master.SourceBlvGuid || null;
        let shouldDecrementStock = true;

        if (sourceBlvGuid) {
            const { BlvMaster } = require('../models');
            const blvSource = await BlvMaster.findOne({ where: { Guid: sourceBlvGuid }, transaction });
            if (blvSource && blvSource.StockDecremente) {
                shouldDecrementStock = false;
            }
        }

        if (shouldDecrementStock && details && details.length > 0) {
            const pathMod = require('path');
            const fs = require('fs').promises;
            const CONFIG_FILE = pathMod.join(__dirname, '../../data/stockConfig.json');
            let config = { autoriserVenteHorsStock: false };
            try {
                const raw = await fs.readFile(CONFIG_FILE, 'utf-8');
                config = { ...config, ...JSON.parse(raw) };
            } catch { /* use defaults */ }

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
                    message: 'Stock insuffisant pour créer cette facture.',
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
                'UPDATE TabFavm SET StockDecremente = 1 WHERE Guid = :guid',
                { replacements: { guid: newFav.Guid }, transaction }
            );
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
          await mouvementService.enregistrerCreation('FAV', newFav.Nf, montants, userId);
          console.log(`✅ Mouvement enregistré: Création FAV #${newFav.Nf} par utilisateur ${userId}`);

          // 🔔 NOTIFICATION SITE & EMAIL CLIENT
          const { notifyDocumentCreated } = require('../utils/notificationUtils');
          const emailService = require('../utils/emailService');

          // Notif site
          await notifyDocumentCreated('FAV', newFav.Nf, selectedTier, userId, { totalTTC: masterData.TotTTC });

          // Email client
          if (selectedTier.Email) {
            await emailService.sendDocumentNotification(selectedTier.Email, selectedTier.Raisoc, {
              type: 'FAV',
              numero: `FA-${newFav.Nf}`,
              montant: masterData.TotTTC,
              id: newFav.Guid
            });
          }
        } catch (mouvementError) {
          console.error('⚠️ Erreur notifications creation (non bloquant):', mouvementError.message);
        }

        const result = await FavMaster.findOne({
            where: { Guid: newFav.Guid },
            include: [{ model: FavDetail, as: 'details' }]
        });

        res.status(201).json({ status: 'success', data: result });
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('❌ Error createFav:', error);
        next(error);
    }
};

/**
 * Mettre à jour une facture
 */
exports.updateFav = async (req, res, next) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const { id } = req.params;
        const { master, details } = req.body;

        if (!master) {
            if (transaction && !transaction.finished) await transaction.rollback();
            return res.status(400).json({ status: 'error', message: 'Master data is required' });
        }

        const favWhere = await buildFavSecurityWhere(id, req.user, transaction);
        const fav = await FavMaster.findOne({ where: favWhere, transaction });
        if (!fav) {
            if (transaction && !transaction.finished) await transaction.rollback();
            return res.status(404).json({ status: 'error', message: 'Facture non trouvée' });
        }

        const targetCodTiers = master.CodTiers || fav.CodTiers;
        if (!targetCodTiers) {
            if (transaction && !transaction.finished) await transaction.rollback();
            return res.status(400).json({ status: 'error', message: 'Client (CodTiers) est obligatoire' });
        }

        const selectedTier = await Tiers.findOne({
            where: { CodTiers: targetCodTiers },
            attributes: ['IDTiers', 'CodTiers', 'Raisoc', 'Adresse', 'Ville', 'Email'],
            transaction
        });

        if (!selectedTier) {
            if (transaction && !transaction.finished) await transaction.rollback();
            return res.status(400).json({ status: 'error', message: 'Client sélectionné introuvable' });
        }

        master.CodTiers = selectedTier.CodTiers;
        master.LibTiers = selectedTier.Raisoc || master.LibTiers || '';
        master.Adresse = selectedTier.Adresse || master.Adresse || '';
        master.Ville = selectedTier.Ville || master.Ville || '';

        if (isCommercialUser(req.user)) {
            const codRepres = String(req.user?.id || req.user?.UserID || '').trim();
            if (!codRepres) {
                if (transaction && !transaction.finished) await transaction.rollback();
                return res.status(403).json({ status: 'error', message: 'Code représentant introuvable pour ce commercial' });
            }
            master.CodRepres = codRepres;
        }

        const masterData = sanitizeMasterData(master);

        // Mettre à jour le master avec date
        masterData.DatUser = sequelize.literal('GETDATE()');
        await fav.update(masterData, { transaction });

        if (details && Array.isArray(details)) {
            await FavDetail.destroy({ where: { NF: fav.Nf }, transaction });
            if (details.length > 0) {
                const detailsWithNf = details.map((d) => ({
                    ...sanitizeFavDetailData(d),
                    NF: fav.Nf,
                    ID: 'FA',
                    Guid: randomUUID()
                }));
                await FavDetail.bulkCreate(detailsWithNf, { transaction });
            }
        }

        await transaction.commit();

        const result = await FavMaster.findOne({
            where: { Guid: id },
            include: [{ model: FavDetail, as: 'details' }]
        });

        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('❌ Error updateFav:', error);
        next(error);
    }
};

/**
 * Supprimer une facture
 */
exports.deleteFav = async (req, res, next) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const { id } = req.params;
        const favWhere = await buildFavSecurityWhere(id, req.user, transaction);
        const fav = await FavMaster.findOne({ where: favWhere, transaction });

        if (!fav) {
            await transaction.rollback();
            return res.status(404).json({ status: 'error', message: 'Facture non trouvée' });
        }

        await FavDetail.destroy({ where: { NF: fav.Nf }, transaction });
        await fav.destroy({ transaction });

        await transaction.commit();

        res.status(200).json({ status: 'success', message: 'Facture supprimée avec succès' });
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('❌ Error deleteFav:', error);
        next(error);
    }
};

/**
 * Valider une FAV :
 *  - Si issue d'un BLV (SourceBlvGuid) dont StockDecremente=true → pas de 2e décrémentation
 *  - Si facture directe (sans BLV) → vérifie stock et décrémente
 * PATCH /fav/:id/validate
 */
exports.validateFav = async (req, res, next) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const { id } = req.params;

        const fav = await FavMaster.findOne({
            where: { Guid: id },
            include: [{ model: FavDetail, as: 'details' }],
            transaction,
        });
        if (!fav) {
            await transaction.rollback();
            return res.status(404).json({ status: 'error', message: 'Facture non trouvée' });
        }
        if (fav.Valid) {
            await transaction.rollback();
            return res.status(400).json({ status: 'error', message: 'Cette facture est déjà validée' });
        }

        let stockDecrement = false;
        let skipStockMsg = null;

        // Cas : FAV générée depuis un BLV déjà décrémenté → pas de 2e décrémentation
        if (fav.SourceBlvGuid) {
            const { BlvMaster } = require('../models');
            const blvSource = await BlvMaster.findOne({ where: { Guid: fav.SourceBlvGuid }, transaction });
            if (blvSource && blvSource.StockDecremente) {
                skipStockMsg = `Stock non décrémenté (déjà effectué par BLV ${blvSource.Nf || fav.SourceBlvGuid})`;
            } else {
                stockDecrement = true;
            }
        } else {
            stockDecrement = true; // Facture directe : décrémente le stock
        }

        if (stockDecrement) {
            // Charger la configuration stock
            const path = require('path');
            const fs = require('fs').promises;
            const CONFIG_FILE = path.join(__dirname, '../../data/stockConfig.json');
            let config = { autoriserVenteHorsStock: false };
            try {
                const raw = await fs.readFile(CONFIG_FILE, 'utf-8');
                config = { ...config, ...JSON.parse(raw) };
            } catch { /* utilise les défauts */ }

            const details = fav.details || [];
            const stockUpdates = [];
            const insuffisants = [];

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
                    insuffisants.push({ codArt, libArt: detail.LibArt || codArt, stockActuel: qteActuelle, qteDemandee });
                } else {
                    stockUpdates.push({ codArt, qteApres, qteActuelle, qteDemandee });
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

            for (const upd of stockUpdates) {
                await sequelize.query(
                    'UPDATE TabStock SET Qte = :qteApres WHERE CodArt = :codArt',
                    { replacements: { qteApres: upd.qteApres, codArt: upd.codArt }, transaction }
                );
            }

            await sequelize.query(
                `UPDATE TabFavm SET Valid = 1, DatUser = GETDATE(), StockDecremente = 1 WHERE Guid = :guid`,
                { replacements: { guid: id }, transaction }
            );
        } else {
            await sequelize.query(
                `UPDATE TabFavm SET Valid = 1, DatUser = GETDATE() WHERE Guid = :guid`,
                { replacements: { guid: id }, transaction }
            );
        }

        await transaction.commit();

        const result = await FavMaster.findOne({
            where: { Guid: id },
            include: [{ model: FavDetail, as: 'details' }],
        });

        return res.status(200).json({
            status: 'success',
            message: skipStockMsg || 'Facture validée. Stock décrémenté.',
            doubleDecrementEvite: !!skipStockMsg,
            data: result,
        });
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('❌ Error validateFav:', error);
        next(error);
    }
};

/**
 * Récupérer les factures de l'utilisateur connecté (Client Portal)
 */
exports.getMyFav = async (req, res, next) => {
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
            ({ where, limit, offset, page } = await filterHelper.applyTableDrivenFiltersWithPagination('7', req.query, req.user));
        }

        const { count, rows } = await FavMaster.findAndCountAll({
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
        console.error('❌ Error getMyFav:', error);
        next(error);
    }
};


/**
 * Générer le PDF d'une facture
 */
exports.generateFavPDF = async (req, res, next) => {
    try {
        const { id } = req.params;
        const fav = await FavMaster.findOne({
            where: { Guid: id },
            include: [
                { model: FavDetail, as: 'details' },
                { model: Tiers, as: 'client' }
            ]
        });
        if (!fav) return res.status(404).json({ status: 'error', message: 'Facture non trouvée' });
        const docData = fav.toJSON();
        const soc = await TabSociete.findOne();
        const pdfBuffer = await PDFService.generateCommercialPDF(docData, soc, 'FACTURE');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=fac_${docData.Prfx || 'FAC'}${docData.Nf}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('❌ Error generateFavPDF:', error);
        next(error);
    }
};
