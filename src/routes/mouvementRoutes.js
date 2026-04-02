const express = require('express');
const router = express.Router();
const mouvementController = require('../controllers/mouvementController');
const { protect } = require('../middleware/auth');

/**
 * ✅ MOUVEMENTS ROUTES - Utilise MvtDocs (table réelle)
 * Récupère l'historique des transformations Devis → BCV → BLV/FAV
 */

/**
 * GET /api/mouvements/historique?docType=DEV&nf=1
 * Récupérer l'historique complet d'un document (toutes les transformations)
 * Params:
 *  - docType: DEV, BCV, BLV, FAV
 *  - nf: Numéro du document
 */
router.get('/historique', protect, mouvementController.getHistorique);

/**
 * GET /api/mouvements/statistiques?dateDebut=2026-01-01&dateFin=2026-04-02
 * Statistiques des mouvements par type de document
 * Params:
 *  - dateDebut: Date début (ISO format)
 *  - dateFin: Date fin (ISO format)
 */
router.get('/statistiques', protect, mouvementController.getStatistiques);

/**
 * GET /api/mouvements?page=1&limit=50&docType=BCV&nf=1&codTiers=C001
 * Tous les mouvements avec pagination et filtres
 * Params:
 *  - page: Page number (default: 1)
 *  - limit: Records per page (default: 50)
 *  - docType: Filter by document type (DEV, BCV, BLV, FAV)
 *  - nf: Filter by document number
 *  - codTiers: Filter by client code
 *  - dateDebut: Start date
 *  - dateFin: End date
 */
router.get('/', protect, mouvementController.getAllMouvements);

module.exports = router;
