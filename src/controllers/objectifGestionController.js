/**
 * ObjectifGestionController
 * 
 * API endpoints pour gérer les objectifs et paiements
 */
const ObjectifGestionService = require('../services/objectifGestionService');

class ObjectifGestionController {
  constructor(models) {
    this.service = new ObjectifGestionService(models);
    this.models = models;
  }

  /**
   * POST /api/objectifs/enregistrer-paiement
   * Enregistrer un paiement → met à jour objectif ACTIF
   */
  async enregistrerPaiement(req, res) {
    try {
      const user = req.user || {};
      const paiement = req.body;

      paiement.ID_Utilisateur = user.UserID;

      const resultat = await this.service.updateObjectifOnPayment(paiement);

      return res.status(201).json({
        status: 'success',
        data: resultat
      });
    } catch (error) {
      console.error('❌ Erreur paiement:', error.message);
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * POST /api/objectifs/creer
   * Créer un nouvel objectif (avec vérifications métier)
   */
  async creerObjectif(req, res) {
    try {
      const { IdCont, MontantCible, ...data } = req.body;

      if (!IdCont) {
        return res.status(400).json({
          status: 'error',
          message: 'IdCont (commercial) est requis'
        });
      }

      const resultat = await this.service.createObjectif(IdCont, {
        MontantCible,
        ...data
      });

      return res.status(201).json({
        status: 'success',
        data: resultat
      });
    } catch (error) {
      console.error('❌ Erreur création objectif:', error.message);
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * POST /api/objectifs/:objectifId/fermer-admin
   * Admin override - Fermer un objectif NON ATTEINT
   */
  async fermerObjectifByAdmin(req, res) {
    try {
      const { objectifId } = req.params;
      const user = req.user || {};

      const resultat = await this.service.closeObjectifByAdmin(
        objectifId,
        user.UserID
      );

      return res.status(200).json({
        status: 'success',
        data: resultat
      });
    } catch (error) {
      console.error('❌ Erreur fermeture admin:', error.message);
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * GET /api/objectifs/:idCommercial/historique
   * Obtenir tous les objectifs d'un commercial
   */
  async obtenirHistoriqueObjectifs(req, res) {
    try {
      const { idCommercial } = req.params;

      const objectifs = await this.service.obtenirHistoriqueObjectifs(idCommercial);

      return res.status(200).json({
        status: 'success',
        data: {
          idCommercial,
          nombre: objectifs.length,
          objectifs: objectifs.map(o => ({
            id: o.ID_Objectif,
            montantCible: o.MontantCible,
            montantAtteint: o.Montant_Realise_Actuel,
            statut: o.StatutObjectif,
            annee: o.Annee,
            dateDebut: o.DateDebut,
            dateFin: o.DateFin,
            nombreReglement: o.NombreReglementsLies,
            progression: o.Montant_Realise_Actuel / o.MontantCible * 100
          }))
        }
      });
    } catch (error) {
      console.error('❌ Erreur récupération historique:', error.message);
      return res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération de l\'historique'
      });
    }
  }

  /**
   * GET /api/objectifs/:objectifId/synthese
   * Obtenir synthèse complète d'un objectif
   */
  async obtenirSyntheseObjectif(req, res) {
    try {
      const { objectifId } = req.params;

      const synthese = await this.service.obtenirSyntheseObjectif(objectifId);

      return res.status(200).json({
        status: 'success',
        data: synthese
      });
    } catch (error) {
      console.error('❌ Erreur synthèse:', error.message);
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * GET /api/reglements/facture/:factureId
   * Obtenir tous les paiements d'une facture
   */
  async obtenirPaiementsFacture(req, res) {
    try {
      const { factureId } = req.params;

      const paiements = await this.service.obtenirPaiementsFacture(factureId);
      const total = paiements.reduce((sum, p) => sum + Number(p.Montant), 0);

      return res.status(200).json({
        status: 'success',
        data: {
          factureId,
          nombre: paiements.length,
          total,
          paiements: paiements.map(p => ({
            id: p.ID_Reglement,
            montant: p.Montant,
            date: p.DateReglement,
            moyen: p.MoyenPaiement,
            statut: p.Statut
          }))
        }
      });
    } catch (error) {
      console.error('❌ Erreur paiements facture:', error.message);
      return res.status(500).json({
        status: 'error',
        message: 'Erreur'
      });
    }
  }

  /**
   * GET /api/reglements/commercial/:codRepres
   * Obtenir les paiements d'un commercial (période)
   */
  async obtenirPaiementsCommercial(req, res) {
    try {
      const { codRepres } = req.params;
      const { dateDebut, dateFin } = req.query;

      const debut = dateDebut ? new Date(dateDebut) : new Date(new Date().getFullYear(), 0, 1);
      const fin = dateFin ? new Date(dateFin) : new Date();

      const paiements = await this.service.obtenirPaiementsCommercial(
        codRepres,
        debut,
        fin
      );

      const total = paiements.reduce((sum, p) => sum + Number(p.Montant), 0);

      return res.status(200).json({
        status: 'success',
        data: {
          codRepres,
          periode: { debut, fin },
          nombre: paiements.length,
          total,
          paiements
        }
      });
    } catch (error) {
      console.error('❌ Erreur paiements commercial:', error.message);
      return res.status(500).json({
        status: 'error',
        message: 'Erreur'
      });
    }
  }
}

module.exports = ObjectifGestionController;
