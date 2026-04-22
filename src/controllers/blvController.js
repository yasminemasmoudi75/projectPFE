const { BlvMaster, BlvDetail, Tiers, sequelize } = require('../models');
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
 * Helper function to sanitize blv master data
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
 * Récupérer tous les bons de livraison (master)
 */
exports.getAllBlv = async (req, res, next) => {
    try {
        const filterHelper = require('../utils/filterHelper');
        const moduleCode = filterHelper.getModuleCode('blv');
        
        // Module BLV (Table-driven filters from TabRoleFilterVisibility)
        const { where, limit, offset, page } = await filterHelper.applyTableDrivenFiltersWithPagination(
            moduleCode,
            req.query,
            req.user
        );

        const visibilityOverrides = await filterHelper.getModuleFiltersVisibility(req.user?.UserRole, 'blv');

        const { count, rows } = await BlvMaster.findAndCountAll({
            where,
            include: [{ model: Tiers, as: 'client' }],
            order: [['DatUser', 'DESC']],
            limit,
            offset,
            tableHint: TableHints.NOLOCK
        });


        return res.status(200).json(
            filterHelper.formatPaginatedResponse(rows, count, page, limit, {
                meta: {
                    blvFilters: visibilityOverrides
                }
            })
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
        const filterHelper = require('../utils/filterHelper');
        const moduleCode = filterHelper.getModuleCode('blv');

        // Pour la récupération par ID, on applique aussi les filtres de sécurité mandataires
        // cela garantit qu'un agent ne peut pas accéder au BL d'une autre région en changeant l'ID dans l'URL
        const securityWhere = await filterHelper.applyTableDrivenFilters(moduleCode, {}, req.user);
        const where = { [Op.and]: [{ Guid: id }, securityWhere] };

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
                ...d,
                NF: newBlv.Nf,
                ID: 'BL',
                Guid: randomUUID()
            }));
            await BlvDetail.bulkCreate(detailsWithNf, { transaction });
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

        // Ajouter DatUser avec GETDATE() SQL (bypass Sequelize timezone)
        masterData.DatUser = sequelize.literal('GETDATE()');

        // Mettre à jour le master
        await blv.update(masterData, { transaction });

        if (details && Array.isArray(details)) {
            await BlvDetail.destroy({ where: { NF: blv.Nf }, transaction });
            if (details.length > 0) {
                const detailsWithNf = details.map((d) => ({
                    ...d,
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
        const blv = await BlvMaster.findOne({ where: blvWhere, transaction });

        if (!blv) {
            await transaction.rollback();
            return res.status(404).json({ status: 'error', message: 'Bon de livraison non trouvé' });
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
 * Récupérer les bons de livraison de l'utilisateur connecté (Client Portal)
 */
exports.getMyBlv = async (req, res, next) => {
    try {
        const filterHelper = require('../utils/filterHelper');
        const moduleCode = filterHelper.getModuleCode('blv');
        
        // Utilisation du système de filtrage centralisé pour les clients aussi (Module BLV)
        const { where, limit, offset, page } = await filterHelper.applyTableDrivenFiltersWithPagination(
            moduleCode,
            req.query,
            req.user
        );

        const { count, rows } = await BlvMaster.findAndCountAll({
            where,
            include: [{ model: Tiers, as: 'client' }],
            order: [['DatUser', 'DESC']],
            limit,
            offset,
            tableHint: TableHints.NOLOCK
        });



        res.json(
            filterHelper.formatPaginatedResponse(rows, count, page, limit, {
                meta: {
                    blvFilters: await filterHelper.getModuleFiltersVisibility(req.user?.UserRole, 'blv')
                }
            })
        );
    } catch (error) {
        console.error('❌ Error getMyBlv:', error);
        next(error);
    }
};

