const { FavMaster, FavDetail, Tiers } = require('../models');
const { Op } = require('sequelize');

/**
 * Récupérer toutes les factures (master)
 */
exports.getAllFav = async (req, res, next) => {
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

        const { count, rows } = await FavMaster.findAndCountAll({
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

        const fav = await FavMaster.findOne({
            where: { Guid: id },
            include: [
                { model: FavDetail, as: 'details' },
                { model: Tiers, as: 'client' }
            ]
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
