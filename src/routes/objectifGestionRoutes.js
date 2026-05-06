const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');
const sharedModels = require('../models');

/**
 * Routes API - Gestion des objectifs commerciaux et paiements
 * Basées sur une logique métier CRM robuste et sécurisée
 */

let ObjectifGestionController;

function initializeController(models) {
  if (!ObjectifGestionController) {
    const Controller = require('../controllers/objectifGestionController');
    ObjectifGestionController = new Controller(models);
  }
  return ObjectifGestionController;
}

router.use((req, res, next) => {
  const models = req.app?.locals?.models || sharedModels;
  req.controller = initializeController(models);
  next();
});

// Protéger toutes les routes
router.use(protect);

// ============================================================================
// OBJECTIFS
// ============================================================================

/**
 * GET /api/objectifs/:idCommercial/historique
 * Récupérer l'historique de tous les objectifs d'un commercial
 */
router.get(
  '/:idCommercial/historique',
  checkPermission(MODULES.OBJECTIFS, 'read'),
  (req, res) => req.controller.obtenirHistoriqueObjectifs(req, res)
);

/**
 * GET /api/objectifs/:objectifId/synthese
 * Obtenir une synthèse complète d'un objectif
 */
router.get(
  '/:objectifId/synthese',
  checkPermission(MODULES.OBJECTIFS, 'read'),
  (req, res) => req.controller.obtenirSyntheseObjectif(req, res)
);

/**
 * POST /api/objectifs/creer
 * Créer un nouvel objectif (avec vérifications métier)
 * 
 * Body:
 * {
 *   "IdCont": "uuid",
 *   "MontantCible": 5000,
 *   "Annee": 2026,
 *   "TypeObjectif": "Commercial",
 *   "Description": "Objectif Q2 2026"
 * }
 */
router.post(
  '/creer',
  checkPermission(MODULES.OBJECTIFS, 'create'),
  (req, res) => req.controller.creerObjectif(req, res)
);

/**
 * POST /api/objectifs/:objectifId/fermer-admin
 * Admin override: Fermer un objectif NON ATTEINT
 * Autorise la création d'un nouvel objectif
 */
router.post(
  '/:objectifId/fermer-admin',
  restrictTo('Admin'),
  (req, res) => req.controller.fermerObjectifByAdmin(req, res)
);

// ============================================================================
// PAIEMENTS
// ============================================================================

/**
 * POST /api/reglements/enregistrer
 * Enregistrer un paiement
 * Met à jour automatiquement l'objectif ACTIF du commercial
 * 
 * Body:
 * {
 *   "ID_Facture": "uuid",
 *   "CodRepres": "COM001",
 *   "Montant": 1500,
 *   "MoyenPaiement": "Virement",
 *   "Reference": "VIR123456"
 * }
 */
router.post(
  '/enregistrer',
  checkPermission(MODULES.FACTURES, 'create'),
  (req, res) => req.controller.enregistrerPaiement(req, res)
);

/**
 * GET /api/reglements/facture/:factureId
 * Obtenir tous les paiements d'une facture
 */
router.get(
  '/facture/:factureId',
  checkPermission(MODULES.FACTURES, 'read'),
  (req, res) => req.controller.obtenirPaiementsFacture(req, res)
);

/**
 * GET /api/reglements/commercial/:codRepres
 * Obtenir les paiements d'un commercial sur une période
 * 
 * Query params:
 * - dateDebut: ISO date
 * - dateFin: ISO date
 */
router.get(
  '/commercial/:codRepres',
  checkPermission(MODULES.OBJECTIFS, 'read'),
  (req, res) => req.controller.obtenirPaiementsCommercial(req, res)
);

module.exports = router;
