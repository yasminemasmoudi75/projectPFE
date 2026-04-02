const { BlvMaster, BlvDetail, Tiers, sequelize } = require('../models');
const { Op } = require('sequelize');
const { randomUUID } = require('crypto');

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

        const where = {};
        if (search) {
            where[Op.or] = [
                { LibTiers: { [Op.like]: `%${search}%` } },
                { CodTiers: { [Op.like]: `%${search}%` } },
                { Nf: { [Op.like]: `%${search}%` } }
            ];
        }

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

        const blv = await BlvMaster.findOne({
            where: { Guid: id },
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

        if (!master.Nf) {
            const lastBlv = await BlvMaster.findOne({
                order: [['Nf', 'DESC']],
                transaction
            });
            master.Nf = (lastBlv?.Nf || 0) + 1;
        }

        const masterData = sanitizeMasterData(master);
        masterData.DatCreateUser = sequelize.literal('GETDATE()');
        masterData.DatUser = sequelize.literal('GETDATE()');
        masterData.Guid = randomUUID();
        masterData.bLivr = true;

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

        const blv = await BlvMaster.findOne({ where: { Guid: id }, transaction });
        if (!blv) {
            if (transaction && !transaction.finished) await transaction.rollback();
            return res.status(404).json({ status: 'error', message: 'Bon de livraison non trouvé' });
        }

        const masterData = sanitizeMasterData(master);
        masterData.MDate = sequelize.literal('GETDATE()');

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
        const blv = await BlvMaster.findOne({ where: { Guid: id }, transaction });

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
