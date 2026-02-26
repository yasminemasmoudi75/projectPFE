const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Objectif = sequelize.define('TabObjectifs', {
  ID_Objectif: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'ID_Objectif'
  },
  ID_Utilisateur: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'ID_Utilisateur',
    references: {
      model: 'Sec_Users',
      key: 'UserID'
    }
  },
  Mois: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'Mois',
    validate: {
      min: 1,
      max: 12
    }
  },
  Annee: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'Annee'
  },
  MontantCible: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
    field: 'MontantCible'
  },
  Montant_Realise_Actuel: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
    defaultValue: 0,
    field: 'Montant_Realise_Actuel'
  },
  TypeObjectif: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'TypeObjectif'
  },
  TypePeriode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'Mensuel',
    field: 'TypePeriode',
    comment: 'Mensuel ou Hebdomadaire'
  },
  Semaine: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'Semaine'
  },
  DateDebut: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'DateDebut'
  },
  DateFin: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'DateFin'
  },
  Libelle_Indicateur: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'Libelle_Indicateur'
  },
  Statut: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'Statut'
  },
  ID_Objectif_Parent: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'ID_Objectif_Parent',
    comment: 'Référence vers l\'objectif mensuel parent pour les objectifs hebdomadaires'
  }
}, {
  tableName: 'TabObjectifs',
  timestamps: false,
  indexes: [
    {
      fields: ['ID_Utilisateur']
    },
    {
      fields: ['Mois', 'Annee']
    },
    {
      fields: ['TypeObjectif']
    }
  ]
});

module.exports = Objectif;
