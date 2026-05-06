const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { notifyObjectifAchieved } = require('../utils/notificationUtils');

const extractWeekNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : null;
  const match = String(value).match(/([0-9]+)/);
  return match ? parseInt(match[1], 10) : null;
};

const getISOWeekRange = (weekNumber, year) => {
  const week = Number(weekNumber);
  const isoYear = Number(year);

  if (!Number.isInteger(week) || !Number.isInteger(isoYear) || week < 1 || week > 53) {
    return { startDate: null, endDate: null };
  }

  const fourthJanuary = new Date(Date.UTC(isoYear, 0, 4));
  const dayOfWeek = fourthJanuary.getUTCDay() || 7;
  const mondayWeek1 = new Date(fourthJanuary);
  mondayWeek1.setUTCDate(fourthJanuary.getUTCDate() - dayOfWeek + 1);

  const start = new Date(mondayWeek1);
  start.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);

  const toDateOnly = (date) => date.toISOString().split('T')[0];
  return { startDate: toDateOnly(start), endDate: toDateOnly(end) };
};

const normalizeWeeklyPeriod = ({ Semaine, Numsem, Annee, DateDebut, DateFin }) => {
  const weekNumber = extractWeekNumber(Numsem ?? Semaine);
  const year = Number.parseInt(Annee, 10) || new Date().getFullYear();
  const range = getISOWeekRange(weekNumber, year);

  return {
    Numsem: weekNumber,
    Semaine: weekNumber ? `Semaine ${String(weekNumber).padStart(2, '0')}` : (Semaine || null),
    DateDebut: DateDebut || range.startDate,
    DateFin: DateFin || range.endDate,
    Annee: year
  };
};

/**
 * ObjectifGestionService
 * 
 * Logique métier CRM pour gestion des objectifs commerciaux basée sur les paiements réels.
 * 
 * Principes clés:
 * 1. UN SEUL objectif ACTIF par commercial
 * 2. Les paiements vont UNIQUEMENT à l'objectif ACTIF
 * 3. Admin peut forcer clôture (override) pour changer d'objectif
 * 4. Création d'objectif contrôlée par les règles métier
 */
class ObjectifGestionService {
  constructor(models) {
    this.Objectif = models.Objectif;
    this.Reglement = models.Reglement || null;
    this.FavMaster = models.FavMaster;
    this.User = models.User;
  }

  // ========================================================================
  // SECTION 1: GESTION DES PAIEMENTS
  // ========================================================================

  /**
   * Enregistrer un paiement et mettre à jour l'objectif ACTIF
   * 
   * 🎯 LOGIQUE CRM RÉELLE:
   * 
   * 1. Trouver l'objectif ACTIF du commercial
   * 
   * 2a. SI objectif ACTIF existe:
   *     - Ajouter le montant à montantAtteint
   *     - Vérifier si objectif atteint (montantAtteint >= montantCible)
   *     - Si atteint → Statut = "ACHEVÉ"
   *     - Retourner objectif_updated = true
   * 
   * 2b. SI AUCUN objectif ACTIF:
   *     - ⚠️  NE PAS BLOQUER le paiement
   *     - ⚠️  NE PAS CRÉER d'objectif automatiquement
   *     - Enregistrer le paiement comme "ORPHELIN"
   *     - ID_Objectif = NULL (traçabilité)
   *     - Retourner warning + message
   *     - Log notification pour l'admin
   * 
   * 📍 POURQUOI CAS 2b?
   * 
   * En entreprise réelle:
   * - Commercial peut recevoir paiement AVANT qu'un objectif soit créé
   * - Admin définit les objectifs en début de période (pas au jour du paiement)
   * - Un paiement ne doit JAMAIS être rejeté (perte d'argent!)
   * - Solution: Enregistrer le paiement, alerter l'admin
   * 
   * Pourquoi pas créer objectif auto?
   * - Aucun montant cible ne peut être déduit d'un simple paiement
   * - C'est une décision stratégique (pas du code)
   * - Évite des objectifs fantômes non validés
   */
  async updateObjectifOnPayment(paiement) {
    const transaction = await sequelize.transaction();

    try {
      console.log('💳 [PAIEMENT] Enregistrement:', {
        facture: paiement.ID_Facture,
        montant: paiement.Montant,
        commercial: paiement.CodRepres
      });

      // Validation basique
      if (!paiement.ID_Facture || paiement.Montant === undefined || paiement.Montant === null) {
        throw new Error('ID_Facture et Montant sont obligatoires');
      }

      if (paiement.Montant <= 0) {
        throw new Error('Le montant doit être > 0');
      }

      const facture = await this._obtenirFactureAvecCommercial(paiement.ID_Facture, transaction);
      const commercialId = facture?.CodRepres || facture?.commercialId || null;
      const referenceDate = facture?.DatUser || facture?.MDate || paiement.DateReglement || new Date();

      if (!commercialId) {
        console.warn(`⚠️  Facture ${paiement.ID_Facture} sans commercial associé`);
        const reglement = await this._createReglementTrace({
          ID_Facture: paiement.ID_Facture,
          CodRepres: paiement.CodRepres || null,
          Montant: paiement.Montant,
          MoyenPaiement: paiement.MoyenPaiement,
          Reference: paiement.Reference,
          Observations: `ORPHELIN: facture sans commercial associé. ${paiement.Observations || ''}`.trim(),
          ID_Utilisateur: paiement.ID_Utilisateur,
          DateReglement: paiement.DateReglement || new Date(),
          Statut: 'Enregistré'
        }, transaction);

        await transaction.commit();

        return {
          success: true,
          reglement,
          objectif_updated: false,
          warning: 'Paiement enregistré mais facture sans commercial associé',
          message: 'Aucun objectif n’a été mis à jour'
        };
      }

      if (paiement.CodRepres && String(paiement.CodRepres).trim() !== String(commercialId).trim()) {
        console.warn(`⚠️  CodRepres paiement (${paiement.CodRepres}) ignoré au profit de la facture (${commercialId})`);
      }

      // 1️⃣ TROUVER TOUS LES OBJECTIFS ACTIFS
      const objectifsActifs = await this._obtenirObjectifsActifs(commercialId, transaction, referenceDate);

      if (objectifsActifs.length === 0) {
        console.warn(`⚠️  Pas d'objectif ACTIF pour commercial ${commercialId}`);
        // Créer le paiement mais sans lien objectif
        const reglement = await this._createReglementTrace({
          ID_Facture: paiement.ID_Facture,
          CodRepres: commercialId,
          Montant: paiement.Montant,
          MoyenPaiement: paiement.MoyenPaiement,
          Reference: paiement.Reference,
          Observations: `ORPHELIN: Pas d'objectif actif. ${paiement.Observations || ''}`,
          ID_Utilisateur: paiement.ID_Utilisateur,
          DateReglement: paiement.DateReglement || new Date(),
          Statut: 'Enregistré'
        }, transaction);

        await transaction.commit();

        return {
          success: true,
          reglement,
          objectif_updated: false,
          warning: 'Paiement enregistré mais pas d\'objectif actif',
          message: 'Créer un objectif actif pour ce commercial'
        };
      }

      console.log(`🎯 [MULTI-OBJECTIFS] ${objectifsActifs.length} objectif(s) trouvé(s) pour le paiement.`);

      const maintenant = new Date();
      let lastUpdatedObjectif = null;
      let totalMessages = [];

      // 2️⃣ METTRE À JOUR CHAQUE OBJECTIF CONCERNÉ
      for (const objectif of objectifsActifs) {
        const montantAvant = Number(objectif.Montant_Realise_Actuel) || 0;
        const montantCible = Number(objectif.MontantCible);
        const montantAprès = montantAvant + paiement.Montant;
        const objectifAtteintAvantPaiement = montantAvant >= montantCible;

        const dateFin = objectif.DateFin ? new Date(objectif.DateFin) : null;
        const estDateFeeDepassee = dateFin && dateFin < maintenant;
        const estMontantAtteint = montantAprès >= montantCible;

        const updatePayload = {
          Montant_Realise_Actuel: String(montantAprès),
          NombreReglementsLies: (objectif.NombreReglementsLies || 0) + 1
        };

        if (estDateFeeDepassee) {
          updatePayload.StatutObjectif = 'ARCHIVÉ';
          updatePayload.DateArchivage = sequelize.fn('GETDATE');
        }

        await this.Objectif.update(updatePayload, {
          where: { ID_Objectif: objectif.ID_Objectif },
          transaction
        });

        // Notifications si atteint maintenant
        if (estMontantAtteint && !objectifAtteintAvantPaiement) {
          await notifyObjectifAchieved({
            objectif,
            commercialUserId: facture?.CodRepres || commercialId
          });
          totalMessages.push(`🏆 Objectif ${objectif.TypePeriode || 'Mensuel'} ATTEINT !`);
        }

        lastUpdatedObjectif = objectif;
        console.log(`✅ Objectif ${objectif.ID_Objectif} (${objectif.TypePeriode || 'Mensuel'}) mis à jour: ${montantAprès}/${montantCible}`);
      }

      // 4️⃣ ENREGISTRER LE PAIEMENT (lié au dernier objectif ou au premier, peu importe pour la trace)
      const reglement = await this._createReglementTrace({
        ID_Facture: paiement.ID_Facture,
        ID_Objectif: lastUpdatedObjectif.ID_Objectif,
        CodRepres: commercialId,
        Montant: paiement.Montant,
        MoyenPaiement: paiement.MoyenPaiement,
        Reference: paiement.Reference,
        Observations: paiement.Observations,
        ID_Utilisateur: paiement.ID_Utilisateur,
        DateReglement: paiement.DateReglement || new Date(),
        Statut: 'Enregistré'
      }, transaction);

      await transaction.commit();

      return {
        success: true,
        reglement,
        objectif_updated: true,
        message: `Paiement enregistré et appliqué à ${objectifsActifs.length} objectif(s). ${totalMessages.join(' ')}`.trim(),
        count: objectifsActifs.length
      };

    } catch (error) {
      try {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }
      } catch (rollbackError) {
        console.error('⚠️ rollback updateObjectifOnPayment ignoré:', rollbackError.message);
      }
      console.error('❌ Erreur paiement:', error.message);
      throw error;
    }
  }

  // ========================================================================
  // SECTION 2: GESTION DE LA CRÉATION D'OBJECTIFS
  // ========================================================================

  /**
   * Créer un nouvel objectif pour un commercial
   * 
   * Autorisé UNIQUEMENT si:
   * - Pas d'objectif ACTIF
   * - Objectif précédent = ACHEVÉ
   * - Objectif précédent = INACTIF (clôturé par admin)
   * - Nouvelle année
   */
  async createObjectif(commercialId, data) {
    const transaction = await sequelize.transaction();

    try {
      console.log('📝 [OBJECTIF] Création demandée:', {
        commercial: commercialId,
        montantCible: data.MontantCible,
        année: data.Annee
      });

      // Validation
      if (!commercialId || !data.MontantCible) {
        throw new Error('commercialId et MontantCible sont obligatoires');
      }

      // 1️⃣ VÉRIFIER RÈGLES DE CRÉATION
      const objectifsActifs = await this._obtenirObjectifsActifs(commercialId, transaction);
      const typeDemandé = data.TypePeriode || 'Mensuel';

      // On ne refuse que s'il existe déjà un objectif de MÊME TYPE (Mensuel ou Hebdo)
      const doublon = objectifsActifs.find(o => (o.TypePeriode || 'Mensuel') === typeDemandé);

      if (doublon) {
        throw new Error(
          `Impossible: Un objectif ${typeDemandé} existe déjà pour ce commercial. ` +
          `Progression: ${doublon.Montant_Realise_Actuel}/${doublon.MontantCible}`
        );
      }

      // Vérifier l'objectif précédent
      const objectifPrecedent = await this.Objectif.findOne({
        where: {
          IdCont: commercialId,
          Annee: data.Annee // Même année
        },
        order: [['DateDebut', 'DESC']],
        transaction
      });

      // Règle: si objectif MÊME ANNÉE et NON ACHEVÉ ET NON CLÔTURÉ
      if (objectifPrecedent) {
        const statut = objectifPrecedent.StatutObjectif;
        const estAtteint = Number(objectifPrecedent.Montant_Realise_Actuel) >= Number(objectifPrecedent.MontantCible);

        if (statut === 'ACTIF') {
          throw new Error('Un objectif ACTIF existe');
        }

        if (!estAtteint && statut !== 'INACTIF') {
          throw new Error(
            `Objectif de ${objectifPrecedent.Annee} non atteint (${objectifPrecedent.Montant_Realise_Actuel}/${objectifPrecedent.MontantCible}). ` +
            `Admin peut le clôturer (override) pour en créer un nouveau.`
          );
        }
      }

      // 2️⃣ CRÉER L'OBJECTIF
      const weeklyPeriod = String(data.TypePeriode || '').toLowerCase() === 'hebdomadaire'
        ? normalizeWeeklyPeriod(data)
        : null;

      const nouvelObjectif = await this.Objectif.create({
        IdCont: commercialId,
        MontantCible: data.MontantCible,
        Montant_Realise_Actuel: 0,
        TypeObjectif: data.TypeObjectif || 'Commercial',
        DateDebut: weeklyPeriod?.DateDebut || data.DateDebut || new Date(),
        DateFin: weeklyPeriod?.DateFin || data.DateFin,
        Annee: weeklyPeriod?.Annee || data.Annee || new Date().getFullYear(),
        Mois: String(data.TypePeriode || '').toLowerCase() === 'hebdomadaire' ? null : data.Mois,
        Numsem: weeklyPeriod?.Numsem || null,
        Semaine: weeklyPeriod?.Semaine || null,
        StatutObjectif: 'ACTIF',
        NombreReglementsLies: 0,
        Libelle_Indicateur: data.Description
      }, { transaction });

      await transaction.commit();

      console.log('✅ Objectif créé:', nouvelObjectif.ID_Objectif);

      return {
        success: true,
        objectif: nouvelObjectif.toJSON(),
        message: 'Nouvel objectif créé et défini ACTIF'
      };

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Erreur création objectif:', error.message);
      throw error;
    }
  }

  // ========================================================================
  // SECTION 3: OVERRIDE ADMIN - FERMER UN OBJECTIF NON ATTEINT
  // ========================================================================

  /**
   * Fermer un objectif de force (admin override)
   * 
   * Permet de clôturer un objectif NON ATTEINT pour créer un nouveau.
   * Action administrative traçée.
   */
  async closeObjectifByAdmin(objectifId, idUtilisateurAdmin) {
    const transaction = await sequelize.transaction();

    try {
      console.log('🔐 [ADMIN OVERRIDE] Fermeture objectif:', objectifId);

      const objectif = await this.Objectif.findByPk(objectifId, { transaction });

      if (!objectif) {
        throw new Error('Objectif non trouvé');
      }

      if (objectif.StatutObjectif === 'INACTIF') {
        throw new Error('Objectif déjà clôturé');
      }

      // Sauvegarder l'état avant
      const montantBefore = objectif.Montant_Realise_Actuel;
      const montantCible = objectif.MontantCible;
      const taux = montantCible > 0 ? ((montantBefore / montantCible) * 100).toFixed(2) : 0;

      // Mettre à jour via SQL Server pour éviter les problèmes de conversion de date côté driver
      const [updatedCount] = await this.Objectif.update({
        StatutObjectif: 'INACTIF',
        DateClotureAdmin: sequelize.fn('GETDATE'),
        IdUtilisateurClotureAdmin: idUtilisateurAdmin
      }, {
        where: { ID_Objectif: objectifId },
        transaction
      });

      if (!updatedCount) {
        throw new Error('Impossible de clôturer l\'objectif');
      }

      const objectifFerme = await this.Objectif.findByPk(objectifId, { transaction });
      await transaction.commit();

      console.log('✅ Objectif fermé par admin:', {
        objectif_id: objectifId,
        admin_id: idUtilisateurAdmin,
        montant: montantBefore,
        cible: montantCible,
        taux: taux + '%'
      });

      return {
        success: true,
        objectif: objectifFerme ? objectifFerme.toJSON() : objectif.toJSON(),
        message: `Objectif fermé. Progression: ${taux}% (${montantBefore}/${montantCible}). ` +
                 `Vous pouvez maintenant créer un nouvel objectif.`
      };

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Erreur fermeture admin:', error.message);
      throw error;
    }
  }

  // ========================================================================
  // SECTION 4: REQUÊTES DE CONSULTATION
  // ========================================================================

  async _obtenirObjectifsActifs(idCommercial, transaction, referenceDate = null) {
    const identifiers = await this._resolveCommercialIdentifiers(idCommercial, transaction);
    if (identifiers.length === 0) return [];

    const candidats = await this.Objectif.findAll({
      where: {
        IdCont: { [Op.in]: identifiers },
        StatutObjectif: 'ACTIF'
      },
      order: [['DateDebut', 'DESC'], ['ID_Objectif', 'DESC']],
      transaction
    });

    if (!candidats.length) return [];

    const now = new Date();
    const invoiceDate = referenceDate ? new Date(referenceDate) : now;
    const objectifsValides = [];

    for (const objectif of candidats) {
      // Archivage automatique si date de fin dépassée.
      const dateFin = objectif.DateFin ? new Date(objectif.DateFin) : null;
      if (dateFin && dateFin < now) {
        console.warn(`⚠️  Objectif ${objectif.ID_Objectif} expiré le ${dateFin.toISOString()}, archivage automatique`);
        await objectif.update({
          StatutObjectif: 'ARCHIVÉ',
          DateArchivage: now
        }, { transaction });
        continue;
      }

      // Vérifier si la date correspond à la période de l'objectif
      if (this._isDateInObjectifPeriod(objectif, invoiceDate)) {
        objectifsValides.push(objectif);
      }
    }

    // Si aucun objectif ne correspond à la date précise, on renvoie quand même le plus récent actif par défaut
    if (objectifsValides.length === 0 && candidats.length > 0) {
        // Optionnel: on pourrait décider de ne rien renvoyer, 
        // mais pour la robustesse on garde le premier actif s'il n'est pas expiré
        const firstActive = candidats.find(o => o.StatutObjectif === 'ACTIF');
        if (firstActive) objectifsValides.push(firstActive);
    }

    return objectifsValides;
  }

  async _resolveCommercialIdentifiers(idCommercial, transaction) {
    const value = String(idCommercial || '').trim();
    if (!value) return [];

    const ids = new Set();

    if (this._isUuid(value)) {
      ids.add(value.toUpperCase());
    }

    if (this.User) {
      const numericId = Number.parseInt(value, 10);
      if (Number.isInteger(numericId)) {
        const user = await this.User.findByPk(numericId, { transaction });
        const guid = String(user?.GUID || '').trim();
        if (this._isUuid(guid)) ids.add(guid.toUpperCase());
      }

      if (this._isUuid(value)) {
        const userByGuid = await this.User.findOne({
          where: { GUID: value },
          transaction
        });

        const guid = String(userByGuid?.GUID || '').trim();
        if (this._isUuid(guid)) ids.add(guid.toUpperCase());
      }
    }

    return [...ids];
  }

  _isDateInObjectifPeriod(objectif, date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return true;

    if (String(objectif?.TypePeriode || '').toLowerCase() === 'hebdomadaire') {
      const start = objectif.DateDebut ? new Date(objectif.DateDebut) : null;
      const end = objectif.DateFin ? new Date(objectif.DateFin) : null;
      if (start && end) {
        return date >= start && date <= end;
      }
    }

    const start = objectif.DateDebut ? new Date(objectif.DateDebut) : null;
    const end = objectif.DateFin ? new Date(objectif.DateFin) : null;

    if (start && end) {
      return date >= start && date <= end;
    }

    const month = Number.parseInt(objectif.Mois, 10);
    const year = Number.parseInt(objectif.Annee, 10);
    if (Number.isInteger(month) && Number.isInteger(year)) {
      return date.getFullYear() === year && (date.getMonth() + 1) === month;
    }

    if (Number.isInteger(year)) {
      return date.getFullYear() === year;
    }

    return true;
  }

  async _createReglementTrace(payload, transaction) {
    if (!this.Reglement) {
      return {
        traceOnly: true,
        ...payload
      };
    }

    const reglement = await this.Reglement.create(payload, { transaction, skipObjectifUpdate: true });
    return reglement.toJSON();
  }

  _isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim());
  }

  /**
   * Obtenir une facture et son commercial associé.
   * La facture est la source de vérité pour éviter toute confusion commercial/objectifs.
   */
  async _obtenirFactureAvecCommercial(factureId, transaction) {
    if (!this.FavMaster) {
      console.warn('⚠️ Modèle Facture (FavMaster) non disponible');
      return null;
    }

    const facture = await this.FavMaster.findByPk(factureId, { transaction });
    if (!facture) {
      console.warn(`⚠️ Facture ${factureId} introuvable`);
      return null;
    }

    return facture;
  }

  /**
   * Obtenir tous les objectifs d'un commercial
   */
  async obtenirHistoriqueObjectifs(idCommercial) {
    return await this.Objectif.findAll({
      where: { IdCont: idCommercial },
      order: [['Annee', 'DESC'], ['DateDebut', 'DESC']]
    });
  }

  /**
   * Obtenir tous les paiements d'un objectif
   */
  async obtenirPaiementsObjectif(objectifId) {
    return await this.Reglement.findAll({
      where: { ID_Objectif: objectifId },
      order: [['DateReglement', 'DESC']]
    });
  }

  /**
   * Obtenir tous les paiements d'une facture
   */
  async obtenirPaiementsFacture(factureId) {
    return await this.Reglement.findAll({
      where: { ID_Facture: factureId },
      order: [['DateReglement', 'DESC']]
    });
  }

  /**
   * Obtenir tous les paiements d'un commercial sur une période
   */
  async obtenirPaiementsCommercial(codRepres, dateDebut, dateFin) {
    return await this.Reglement.findAll({
      where: {
        CodRepres: codRepres,
        DateReglement: {
          [Op.between]: [dateDebut, dateFin]
        }
      },
      order: [['DateReglement', 'DESC']]
    });
  }

  /**
   * Synthèse d'un objectif
   */
  async obtenirSyntheseObjectif(objectifId) {
    const objectif = await this.Objectif.findByPk(objectifId);
    if (!objectif) throw new Error('Objectif non trouvé');

    const paiements = await this.obtenirPaiementsObjectif(objectifId);
    const totalPaye = paiements.reduce((sum, p) => sum + Number(p.Montant), 0);

    const montantCible = Number(objectif.MontantCible);
    const montantAtteint = Number(objectif.Montant_Realise_Actuel);
    const progression = montantCible > 0 ? ((montantAtteint / montantCible) * 100).toFixed(2) : 0;

    return {
      objectif: objectif.toJSON(),
      paiements: {
        nombre: paiements.length,
        total: totalPaye
      },
      synthèse: {
        montantCible,
        montantAtteint,
        progression: progression + '%',
        statut: objectif.StatutObjectif,
        nomReglement: objectif.NombreReglementsLies
      }
    };
  }
}

module.exports = ObjectifGestionService;
