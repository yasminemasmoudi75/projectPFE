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
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'MontantCible'
  },
  Montant_Realise_Actuel: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
    field: 'Montant_Realise_Actuel'
  },
  TypeObjectif: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'TypeObjectif'
  },
  Semaine: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'Semaine'
  },
  DateDebut: {
    type: DataTypes.STRING(25),
    allowNull: true,
    field: 'DateDebut',
    get() {
      const value = this.getDataValue('DateDebut');
      return value ? new Date(value) : null;
    }
  },
  DateFin: {
    type: DataTypes.STRING(25),
    allowNull: true,
    field: 'DateFin',
    get() {
      const value = this.getDataValue('DateFin');
      return value ? new Date(value) : null;
    }
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
