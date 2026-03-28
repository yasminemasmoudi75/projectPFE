const { TiersCategorie } = require('../models');

/**
 * Récupérer toutes les catégories
 */
exports.getAll = async (req, res, next) => {
    try {
        const categories = await TiersCategorie.findAll({
            order: [['libelle', 'ASC']]
        });
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
};
