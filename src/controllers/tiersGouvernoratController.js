const { TiersGouvernorat } = require('../models');

/**
 * Récupérer tous les gouvernorats
 */
exports.getAll = async (req, res, next) => {
    try {
        const regions = await TiersGouvernorat.findAll({
            order: [['libelle', 'ASC']]
        });
        res.status(200).json({
            status: 'success',
            data: regions
        });
    } catch (error) {
        next(error);
    }
};
