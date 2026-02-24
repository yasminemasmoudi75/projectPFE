const { BcvMaster, BcvDetail, Tiers } = require('../models');
const { Op } = require('sequelize');

/**
 * Récupérer tous les bons de commande (master)
 */
exports.getAllBcv = async (req, res, next) => {
    try {
        const { search = '', page = 1, limit = 100 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const where = {};

        if (search) {
            where[Op.or] = [
                { LibTiers: { [Op.like]: `%${search}%` } },
                { CodTiers: { [Op.like]: `%${search}%` } },
            ];
        }

        const { count, rows } = await BcvMaster.findAndCountAll({
            where,
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
            data: rows,
        });
    } catch (error) {
        console.error('❌ Error getAllBcv:', error);
        next(error);
    }
};

/**
 * Récupérer un bon de commande par Guid (avec ses détails)
 */
exports.getBcvById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const bcv = await BcvMaster.findByPk(id, {
            include: [
                {
                    model: BcvDetail,
                    as: 'details',
                },
            ],
        });

        if (!bcv) {
            return res.status(404).json({ status: 'error', message: 'Bon de commande non trouvé' });
        }

        return res.status(200).json({ status: 'success', data: bcv });
    } catch (error) {
        console.error('❌ Error getBcvById:', error);
        next(error);
    }
};
