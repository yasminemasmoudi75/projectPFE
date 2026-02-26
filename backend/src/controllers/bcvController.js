const { BcvMaster, BcvDetail, Tiers, DevisMaster } = require('../models');
const { Op } = require('sequelize');

/**
 * Récupérer tous les bons de commande (master)
 * Inclut à la fois les BCV (TabBcvm) et les devis convertis (TabDevm avec bTransf = true)
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

        // Récupérer les BCV de TabBcvm
        const { count: bcvCount, rows: bcvRows } = await BcvMaster.findAndCountAll({
            where,
            order: [['DatUser', 'DESC']],
            limit: parseInt(limit),
            offset,
        });

        // Récupérer les devis convertis de TabDevm (bTransf = true)
        const devisWhere = { ...where, bTransf: true };
        const { count: devisCount, rows: devisRows } = await DevisMaster.findAndCountAll({
            where: devisWhere,
            order: [['DatUser', 'DESC']],
            limit: parseInt(limit),
            offset,
        });

        // Combiner les deux listes et marquer la source
        const bcvWithSource = bcvRows.map(bcv => ({
            ...bcv.toJSON(),
            _source: 'TabBcvm',
            Prfx: bcv.Prfx || 'BC'
        }));

        const devisWithSource = devisRows.map(devis => ({
            ...devis.toJSON(),
            _source: 'TabDevm',
            Prfx: 'BC' // Afficher comme BC au lieu de DV
        }));

        // Fusionner et trier par date
        const allOrders = [...bcvWithSource, ...devisWithSource].sort((a, b) => {
            const dateA = new Date(a.DatUser || 0);
            const dateB = new Date(b.DatUser || 0);
            return dateB - dateA; // Tri décroissant
        });

        const totalCount = bcvCount + devisCount;

        return res.status(200).json({
            status: 'success',
            pagination: {
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
            },
            data: allOrders,
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
