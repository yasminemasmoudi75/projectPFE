const { MvtRecap } = require('../models');

exports.getAllRecap = async (req, res, next) => {
    try {
        const data = await MvtRecap.findAll();
        res.json({
            status: 'success',
            data
        });
    } catch (err) {
        next(err);
    }
};

exports.getRecapByTiers = async (req, res, next) => {
    try {
        const { codTiers } = req.params;
        const data = await MvtRecap.findByPk(codTiers);
        if (!data) {
            return res.status(404).json({ status: 'error', message: 'Recap non trouvé' });
        }
        res.json({
            status: 'success',
            data
        });
    } catch (err) {
        next(err);
    }
};
