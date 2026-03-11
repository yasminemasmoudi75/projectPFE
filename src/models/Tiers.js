const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tiers = sequelize.define('Tiers', {
  IDTiers: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    field: 'IDTiers'
  },
  Niveau: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    defaultValue: 0,
    field: 'Niveau'
  },
  CodTiers: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    field: 'CodTiers'
  },
  NomTiers: {
    type: DataTypes.VIRTUAL,
    get() { return this.Raisoc; }
  },
  Raisoc: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'Raisoc'
  },
  Email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'Email'
  },
  Tel: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'Tel'
  },
  Fax: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'Fax'
  },
  Gsm: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'Gsm'
  },
  Adresse: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'Adresse'
  },
  Ville: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'Ville'
  },
  Pays: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'Pays'
  },
  Cp: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'Cp'
  },
  CodTva: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'CodTva'
  },
  Cin: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'Cin'
  },
  UserCreate: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'UserCreate'
  },
  SaveDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'SaveDate'
  },
  Actif: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    field: 'Actif'
  },
  codRepresTiers: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'codRepresTiers'
  }
}, {
  tableName: 'TabTiers',
  timestamps: false,
  freezeTableName: true
});

module.exports = Tiers;
