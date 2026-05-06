const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Converters (même pattern que Objectif.js pour cohérence)
 */
const toNumericValue = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const toNullableString = (value) => {
  if (value === undefined || value === null || value === '') return null;
  return String(value);
};

/**
 * Modèle Reglement - Enregistre les paiements de factures
 * 
 * Objectif: Tracer chaque paiement pour mettre à jour l'objectif du commercial
 * Structure: Simple et directe (facture → paiement → objectif)
 * Pattern: Cohérent avec Objectif.js (converters, DATEONLY, VIRTUAL fields)
 */
const Reglement = sequelize.define('Reglement', {
  ID_Reglement: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    field: 'ID_Reglement'
  },

  // ========================================================================
  // RÉFÉRENCES
  // ========================================================================

  ID_Facture: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'ID_Facture',
    index: true,
    comment: 'Lien à la facture (TabFavm.Guid)'
  },

  ID_Objectif: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'ID_Objectif',
    index: true,
    comment: 'Objectif affecté au moment du paiement'
  },

  CodRepres: {
    type: DataTypes.STRING(10),
    allowNull: false,
    field: 'CodRepres',
    index: true,
    comment: 'Commercial associé à la facture (copie de traçabilité)'
  },

  // ========================================================================
  // MONTANT (avec converter comme Objectif)
  // ========================================================================

  Montant: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'Montant',
    comment: 'Montant du paiement',
    get() {
      return toNumericValue(this.getDataValue('Montant'));
    },
    set(value) {
      // Convertir en numérique et stocker comme string (comme Objectif)
      this.setDataValue('Montant', toNullableString(value));
    }
  },

  // ========================================================================
  // DATES (DATEONLY comme Objectif.DateDebut/DateFin)
  // ========================================================================

  DateReglement: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'DateReglement',
    comment: 'Date du paiement'
  },

  // ========================================================================
  // DÉTAILS DU PAIEMENT
  // ========================================================================

  MoyenPaiement: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'MoyenPaiement',
    comment: 'Chèque, Virement, Espèces, Traite...'
  },

  Reference: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'Reference',
    comment: 'N° chèque, virement, traite...'
  },

  Observations: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'Observations'
  },

  // ========================================================================
  // TRAÇABILITÉ
  // ========================================================================

  ID_Utilisateur: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'ID_Utilisateur',
    comment: 'Qui a enregistré le paiement'
  },

  DateCreation: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'DateCreation'
  },

  DateModification: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'DateModification'
  },

  // ========================================================================
  // ÉTAT (STRING au lieu de ENUM pour SQL Server)
  // ========================================================================

  Statut: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'Enregistré',
    field: 'Statut',
    comment: 'État du paiement: Enregistré, Validé, Annulé'
  },

  // ========================================================================
  // VIRTUAL FIELDS (comme Objectif.js)
  // ========================================================================

  Statut_FR: {
    type: DataTypes.VIRTUAL,
    get() {
      const statuts = {
        'Enregistré': '📝 Enregistré',
        'Validé': '✅ Validé',
        'Annulé': '❌ Annulé'
      };
      return statuts[this.getDataValue('Statut')] || this.getDataValue('Statut');
    },
    comment: 'Statut avec icône pour affichage'
  },

  Montant_Formaté: {
    type: DataTypes.VIRTUAL,
    get() {
      const montant = toNumericValue(this.getDataValue('Montant'));
      return new Intl.NumberFormat('fr-TN', {
        style: 'currency',
        currency: 'TND'
      }).format(montant);
    },
    comment: 'Montant formaté en dinars tunisiens'
  },

  EstOrphelin: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('ID_Objectif') === null;
    },
    comment: 'true si paiement sans objectif lié'
  },

  isAffecteObjectif: {
    type: DataTypes.VIRTUAL,
    get() {
      // true si le paiement a été lié à un objectif ACTIF au moment de l'enregistrement
      const objectifId = this.getDataValue('ID_Objectif');
      return objectifId !== null && objectifId !== undefined;
    },
    comment: 'true si paiement affecté à un objectif. Inverse de EstOrphelin.'
  }

}, {
  tableName: 'TabReglements',
  timestamps: false,
  freezeTableName: true,
  indexes: [
    {
      name: 'idx_Reglement_Facture_Date',
      fields: ['ID_Facture', 'DateReglement']
    },
    {
      name: 'idx_Reglement_Commercial_Date',
      fields: ['CodRepres', 'DateReglement']
    },
    {
      name: 'idx_Reglement_Objectif',
      fields: ['ID_Objectif']
    }
  ]
});

module.exports = Reglement;
