const TiersClasse = require('../models/TiersClasse');

exports.getAll = async (req, res) => {
    try {
        const classes = await TiersClasse.findAll({
            order: [['libelle', 'ASC']]
        });
        res.status(200).json({
            success: true,
            data: classes
        });
    } catch (error) {
        console.error('Error fetching tiers classes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des classes de tiers'
        });
    }
};
