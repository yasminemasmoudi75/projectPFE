const { FavMaster, FavDetail, Tiers, BlvMaster, BlvDetail, sequelize } = require('../models');
const { Op, TableHints } = require('sequelize');

const mouvementService = require('../services/mouvementService'); // ✅ Service de traçabilité mouvements
const { randomUUID } = require('crypto');

// Les fonctions utilitaires de filtrage hard-codées (isCommercialRole, buildCommercialCodRepresFilter, etc.) 
// ont été supprimées car elles sont maintenant gérées de manière centralisée par 
// le service applyTableDrivenFilters via la table TabRoleFilterVisibility.


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
            include: [{ model: Tiers, as: 'client' }],
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
        const filterHelper = require('../utils/filterHelper');

        // Sécurité mandataire pour les factures (Module 7)
        const securityWhere = await filterHelper.applyTableDrivenFilters('7', {}, req.user);
        const where = { [Op.and]: [{ Guid: id }, securityWhere] };


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

        if (req.user?.UserRole && req.user.UserRole.toLowerCase().includes('commercial')) {
            const codRepres = req.user.id || req.user.UserID;
            master.CodRepres = String(codRepres);
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
                ...d,
                NF: newFav.Nf,
                ID: 'FA',
                Guid: randomUUID()
            }));
            await FavDetail.bulkCreate(detailsWithNf, { transaction });
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
        } catch (mouvementError) {
          console.error('⚠️ Erreur enregistrement mouvement (non bloquant):', mouvementError.message);
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

        const favWhere = isCommercialRole(req.user?.UserRole)
            ? { [Op.and]: [{ Guid: id }, buildCommercialCodRepresFilter(req.user)] }
            : { Guid: id };

        const fav = await FavMaster.findOne({ where: favWhere, transaction });
        if (!fav) {
            if (transaction && !transaction.finished) await transaction.rollback();
            return res.status(404).json({ status: 'error', message: 'Facture non trouvée' });
        }

        if (isCommercialRole(req.user?.UserRole)) {
            const codRepres = resolveCommercialCodRepresValue(req.user);
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
                    ...d,
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
        const favWhere = isCommercialRole(req.user?.UserRole)
            ? { [Op.and]: [{ Guid: id }, buildCommercialCodRepresFilter(req.user)] }
            : { Guid: id };
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
 * Transférer une facture vers un Bon de Livraison (BLV)
 */
exports.transferFav = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { targetType } = req.body; // 'BL' attendu

        if (targetType !== 'BL') {
            return res.status(400).json({ status: 'error', message: 'Type de transfert invalide. Les Factures ne peuvent être transférées qu\'en Bons de Livraison (BL).' });
        }

        // 1. Chercher la Facture (FAV) dans TabFavm
        const sourceData = await FavMaster.findOne({
            where: { Guid: id },
            include: [{ model: FavDetail, as: 'details' }]
        });

        if (!sourceData) {
            await t.rollback();
            return res.status(404).json({ status: 'error', message: 'Facture source non trouvée' });
        }

        if (sourceData.bTransf) {
            await t.rollback();
            return res.status(400).json({ status: 'error', message: 'Cette facture a déjà été transférée' });
        }

        const data = sourceData.toJSON();
        const details = data.details || [];

        // 2. Préparer les nouveaux objets
        const newGuid = randomUUID();

        // Trouver le prochain numéro (Nf)
        const maxNf = await BlvMaster.max('Nf', { transaction: t }) || 0;
        const nextNf = maxNf + 1;

        const masterData = {
            Guid: newGuid,
            Prfx: 'BL',
            Nf: nextNf,
            CodTiers: data.CodTiers,
            LibTiers: data.LibTiers,
            IDContact: data.IDContact,
            Adresse: data.Adresse,
            Remarq: data.Remarq,
            AssujTiers: data.AssujTiers,
            TotHT: data.TotHT,
            TotTva: data.TotTva,
            TotTTC: data.TotTTC,
            TotRem: data.TotRem,
            Timbre: data.Timbre,
            TotFodec: data.TotFodec,
            Avance: data.Avance,
            MntDebit: data.MntDebit,
            MntCredit: data.MntCredit,
            CodMag: data.CodMag,
            CodRepres: data.CodRepres,
            CodDev: data.CodDev,
            Valid: false,
            bTransf: false,
            bLivr: true,
            MDate: sequelize.literal('GETDATE()'),
            DatUser: sequelize.literal('GETDATE()')
        };

        // 3. Créer le Master (BLV)
        await BlvMaster.create(masterData, { transaction: t });

        // 4. Créer les Détails
        const newDetails = details.map((d) => ({
            Guid: randomUUID(),
            NF: nextNf,
            CodArt: d.CodArt,
            LibArt: d.LibArt,
            Qt: d.Qt,
            PuHT: d.PuHT,
            PuTTC: d.PuTTC,
            MntRem: d.MntRem,
            Codabar: d.Codabar,
            IDArt: d.IDArt,
            ID: 'BL'
        }));

        await BlvDetail.bulkCreate(newDetails, { transaction: t });

        // 5. Marquer la facture source comme transférée
        await FavMaster.update(
            { bTransf: true },
            { where: { Guid: id }, transaction: t }
        );

        await t.commit();

        // ✅ ENREGISTRER LA TRANSFORMATION DANS MvtDocs
        try {
          const montants = {
            codTiers: sourceData.CodTiers,
            libTiers: sourceData.LibTiers,
            totalHT: sourceData.TotHT,
            totalRem: sourceData.TotRem,
            totalFodec: sourceData.TotFodec || 0,
            totalTVA: sourceData.TotTva,
            totalTTC: sourceData.TotTTC
          };
          const userId = req.user?.id || req.user?.UserID;
          await mouvementService.enregistrerTransformation('FAV', sourceData.Nf, 'BLV', nextNf, montants, userId);
        } catch (mouvementError) {
          console.error('⚠️ Erreur enregistrement mouvement (non bloquant):', mouvementError.message);
        }

        return res.status(201).json({
            status: 'success',
            message: 'Facture transférée vers Bon de Livraison avec succès',
            data: {
                Guid: newGuid,
                Nf: nextNf,
                type: 'BL'
            }
        });

    } catch (error) {
        if (t) await t.rollback();
        console.error('❌ Error transferFav:', error);
        next(error);
    }
};

/**
 * Récupérer les factures de l'utilisateur connecté (Client Portal)
 */
exports.getMyFav = async (req, res, next) => {
    try {
        const filterHelper = require('../utils/filterHelper');
        
        // Système de filtrage centralisé (Module 5)
        const { where, limit, offset, page } = await filterHelper.applyTableDrivenFiltersWithPagination(
            '5',
            req.query,
            req.user
        );

        const { count, rows } = await FavMaster.findAndCountAll({
            where,
            include: [{ model: Tiers, as: 'client' }],
            order: [['DatUser', 'DESC']],
            limit,
            offset,
            tableHint: TableHints.NOLOCK
        });



        res.json(
            filterHelper.formatPaginatedResponse(rows, count, page, limit)
        );
    } catch (error) {
        console.error('❌ Error getMyFav:', error);
        next(error);
    }
};

