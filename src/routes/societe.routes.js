const express = require('express');
const router = express.Router();
const { TabSociete } = require('../models');
const { protect, restrictTo } = require('../middleware/auth');

// GET /societe — retourne les infos société (CACHET en base64)
router.get('/', protect, async (req, res) => {
    try {
        const soc = await TabSociete.findOne();
        if (!soc) return res.json({ status: 'success', data: null });

        const plain = soc.toJSON();

        if (plain.CACHET) {
            plain.CACHET = `data:image/png;base64,${Buffer.from(plain.CACHET).toString('base64')}`;
        }
        if (plain.LOGO) {
            plain.LOGO = `data:image/png;base64,${Buffer.from(plain.LOGO).toString('base64')}`;
        }

        res.json({ status: 'success', data: plain });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// PUT /societe/cachet — upload du cachet par l'admin (base64)
router.put('/cachet', protect, restrictTo('admin'), async (req, res) => {
    try {
        const { cachetData } = req.body;
        if (!cachetData) {
            return res.status(400).json({ status: 'error', message: 'cachetData requis' });
        }

        const base64 = cachetData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64, 'base64');

        let soc = await TabSociete.findOne();
        if (!soc) {
            return res.status(404).json({ status: 'error', message: 'Société non trouvée' });
        }

        await soc.update({ CACHET: buffer });

        res.json({ status: 'success', message: 'Cachet enregistré' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// DELETE /societe/cachet — supprime le cachet
router.delete('/cachet', protect, restrictTo('admin'), async (req, res) => {
    try {
        const soc = await TabSociete.findOne();
        if (!soc) return res.status(404).json({ status: 'error', message: 'Société non trouvée' });

        await soc.update({ CACHET: null });
        res.json({ status: 'success', message: 'Cachet supprimé' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
