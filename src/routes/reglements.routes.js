const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/checkPermissions');
const reglemController = require('../controllers/reglemController');
const { REGLEMENT } = require('../middleware/checkPermissions').MODULES || { REGLEMENT: 51 };

/**
 * @route   POST /api/reglements
 * @desc    Create new reglement (Admin only)
 * @access  Private (Admin)
 * @body    { codTiers: string, libTiers?: string, mntReg: number, datReg?: Date }
 */
router.post('/', protect, reglemController.createReglement);

/**
 * @route   GET /api/reglements/paymodes
 * @desc    Get all payment modes (species, cheque, etc)
 */
router.get('/paymodes', protect, reglemController.getPaymentModes);

/**
 * @route   GET /api/reglements/unpaid/:codTiers
 * @desc    Get all unpaid documents for a client
 */
router.get('/unpaid/:codTiers', protect, reglemController.getUnpaidByClient);

/**
 * @route   GET /api/reglements/client/:codTiers/open
 * @desc    Get open reglements for a client (remaining > 0)
 */
router.get('/client/:codTiers/open', protect, reglemController.getOpenReglementsByClient);

/**
 * @route   GET /api/reglements/document/:type/:id
 * @desc    Get reglement history for a specific document (FA/BL)
 */
router.get('/document/:type/:id', protect, reglemController.getReglementHistoryByDocument);

/**
 * @route   GET /api/reglements
 * @desc    Get all reglements with role-based filtering
 * @access  Private (Admin sees all, Client sees theirs)
 */
router.get('/', protect, reglemController.getAllReglements);

/**
 * @route   GET /api/reglements/stats
 * @desc    Get reglement statistics (total paid, remaining, etc)
 * @access  Private
 */
router.get('/stats', protect, reglemController.getReglemStats);

/**
 * @route   GET /api/reglements/:id
 * @desc    Get single reglement details
 * @access  Private
 */
router.get('/:id', protect, reglemController.getReglemById);

/**
 * @route   PUT /api/reglements/:id
 * @desc    Update reglement payment status (Admin only)
 * @access  Private (Admin)
 * @body    { mntCredit?: number, payed?: boolean }
 */
router.put('/:id', protect, reglemController.updateReglemPaymentStatus);

/**
 * @route   POST /api/reglements/batch-update
 * @desc    Batch update multiple payments (Admin only)
 * @access  Private (Admin)
 * @body    { reglemIds: number[], markAsPayedTotal: boolean }
 */
router.post('/batch-update', protect, reglemController.batchUpdatePayments);

module.exports = router;

/**
 * DEBUG ENDPOINT - Check database for reglements
 */
const reglemDiag = async (req, res) => {
    try {
        const { TabReg, TabRegD } = require('../models');

        const total = await TabReg.count();
        const first5 = await TabReg.findAll({
            limit: 5,
            attributes: ['IDReg', 'DatReg', 'CodTiers', 'LibTiers', 'MntReg', 'Payed'],
            order: [['IDReg', 'DESC']]
        });

        res.json({
            status: 'debug',
            totalReglements: total,
            sample: first5,
            message: total > 0 ? 'Data exists in database' : 'No data in TabReg table'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Add debug route
router.get('/debug/check-data', reglemDiag);
