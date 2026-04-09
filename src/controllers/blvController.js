const { BlvMaster, BlvDetail, Tiers, sequelize } = require('../models');
const { Op } = require('sequelize');
const mouvementService = require('../services/mouvementService'); // ✅ Service de traçabilité mouvements
const { randomUUID } = require('crypto');
const { normalizeRole } = require('../utils/userAccess');

const isStaffRole = (role) => {
    const normalized = normalizeRole(role);
    return ['commercial', 'agent', 'technicien'].includes(normalized);
};

const getCommercialIdentifiers = (user = {}) => {
    const numericUserId = Number(user?.UserID || user?.id);
    const userIdAsString = Number.isFinite(numericUserId) ? String(Math.trunc(numericUserId)) : null;

    const candidates = [
        user?.CodRepres,
        user?.codRepres,
        userIdAsString,
        user?.LoginName,
        user?.EmailPro,
        user?.GUID
    ];

    return Array.from(new Set(
        candidates
            .map((value) => (value === null || value === undefined ? null : String(value).trim().toLowerCase()))
            .filter((value) => value)
    ));
};

const buildCommercialCodRepresFilter = (user = {}) => {
    const identifiers = getCommercialIdentifiers(user);
    if (identifiers.length === 0) {
        return { Guid: '__NO_MATCH__' };
    }

    return {
        [Op.or]: identifiers.map((identifier) =>
            sequelize.where(sequelize.fn('LOWER', sequelize.col('CodRepres')), identifier)
        )
    };
};

const resolveCommercialCodRepresValue = (user = {}) => {
    const numericUserId = Number(user?.UserID || user?.id);
    if (Number.isFinite(numericUserId)) {
        return String(Math.trunc(numericUserId));
    }

    const fallback = user?.CodRepres || user?.codRepres || user?.LoginName || user?.EmailPro || user?.GUID;
    return fallback ? String(fallback).trim().slice(0, 10) : null;
};

const buildClientFilter = async (user = {}) => {
    const userEmail = (user?.EmailPro || '').toLowerCase().trim();
    const userLogin = (user?.LoginName || '').toLowerCase().trim();
    const directCodTiers = user?.CodTiers || user?.codTiers || null;
    
    const orConditions = [];

    if (directCodTiers) {
      orConditions.push({ CodTiers: directCodTiers });
    }
    
    if (userEmail) orConditions.push(sequelize.where(sequelize.fn('LOWER', sequelize.col('CUser')), userEmail));
    if (userLogin && userLogin !== userEmail) orConditions.push(sequelize.where(sequelize.fn('LOWER', sequelize.col('CUser')), userLogin));
    
    if (userEmail) orConditions.push(sequelize.where(sequelize.fn('LOWER', sequelize.col('CodRepres')), userEmail));
    if (userLogin && userLogin !== userEmail) orConditions.push(sequelize.where(sequelize.fn('LOWER', sequelize.col('CodRepres')), userLogin));
    
    if (userEmail) {
      try {
        const tiers = await Tiers.findOne({
          where: sequelize.where(sequelize.fn('LOWER', sequelize.col('Email')), userEmail),
          attributes: ['CodTiers'],
        });
        
        if (tiers?.CodTiers) {
          orConditions.push({ CodTiers: tiers.CodTiers });
        }
      } catch (err) {
        console.error('Error finding Tiers for client filter:', err.message);
      }
    }
    
    if (orConditions.length === 0) {
      return { Guid: '__NO_MATCH__' };
    }
    
    return { [Op.or]: orConditions };
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
        const { search = '', page = 1, limit = 100 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const filters = [];
        if (search) {
            filters.push({
                [Op.or]: [
                { LibTiers: { [Op.like]: `%${search}%` } },
                { CodTiers: { [Op.like]: `%${search}%` } },
                { Nf: { [Op.like]: `%${search}%` } }
                ]
            });
        }

        if (isStaffRole(req.user?.UserRole)) {
            filters.push(buildCommercialCodRepresFilter(req.user));
        }

        const where = filters.length > 0 ? { [Op.and]: filters } : {};

        const { count, rows } = await BlvMaster.findAndCountAll({
            where,
            include: [{ model: Tiers, as: 'client' }],
            order: [['DatUser', 'DESC']],
            limit: parseInt(limit),
            offset,
        });

        return res.status(200).json({
            status: 'success',
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit)),
            },
            data: rows
        });
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

        const where = isStaffRole(req.user?.UserRole)
            ? { [Op.and]: [{ Guid: id }, buildCommercialCodRepresFilter(req.user)] }
            : { Guid: id };

        const blv = await BlvMaster.findOne({
            where,
            include: [
                { model: BlvDetail, as: 'details' },
                { model: Tiers, as: 'client' }
            ]
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

        if (isStaffRole(req.user?.UserRole)) {
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

        const blvWhere = isStaffRole(req.user?.UserRole)
            ? { [Op.and]: [{ Guid: id }, buildCommercialCodRepresFilter(req.user)] }
            : { Guid: id };
        const blv = await BlvMaster.findOne({ where: blvWhere, transaction });
        if (!blv) {
            if (transaction && !transaction.finished) await transaction.rollback();
            return res.status(404).json({ status: 'error', message: 'Bon de livraison non trouvé' });
        }

        const masterData = sanitizeMasterData(master);

        if (isStaffRole(req.user?.UserRole)) {
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
        const blvWhere = isStaffRole(req.user?.UserRole)
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
        const { page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const userEmail = req.user?.EmailPro;
        const userLogin = req.user?.LoginName;

        const where = await buildClientFilter(req.user);

        const { count, rows } = await BlvMaster.findAndCountAll({
            where,
            include: [{ model: BlvDetail, as: 'details' }],
            order: [['DatUser', 'DESC']],
            limit: parseInt(limit),
            offset,
        });

        res.json({
            status: 'success',
            data: rows,
            pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) },
        });
    } catch (error) {
        console.error('❌ Error getMyBlv:', error);
        next(error);
    }
};
