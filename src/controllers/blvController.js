const { BlvMaster, BlvDetail, Tiers } = require('../models');
const { Op } = require('sequelize');

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
