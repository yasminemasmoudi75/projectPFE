const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Devis = sequelize.define('TabDevm', {
  Guid: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    field: 'Guid'
  },
  Nf: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'Nf'
  },
  Prfx: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'Prfx'
  },
  Sufx: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'Sufx'
  },
  IDContact: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'IDContact'
  },
  CodTiers: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'CodTiers'
  },
  LibTiers: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'LibTiers'
  },
  Adresse: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'Adresse'
  },
  Ville: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'Ville'
  },
  Remarq: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    field: 'Remarq'
  },
  TotHT: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
    field: 'TotHT'
  },
  TotTva: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
    field: 'TotTva'
  },
  TotTTC: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
    field: 'TotTTC'
  },
  TotRem: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
    field: 'TotRem'
  },
  NetHT: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
    field: 'NetHT'
  },
  Valid: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'Valid'
  },
  DatUser: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    field: 'DatUser'
  },
  MDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'MDate'
  },
  CUser: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'CUser'
  },
  CodRepres: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'CodRepres'
  },
  DesRepres: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'DesRepres'
  },
  DatLiv: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'DatLiv'
  },
  bTransf: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'bTransf'
  },
  // Champs IA
  IA_Probabilite: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'IA_Probabilite',
    comment: 'Probabilité de conversion calculée par IA'
  },
  IsConverted: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'IsConverted'
  },
  DateDerniereRelance: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'DateDerniereRelance'
  },
  StatutValidation: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'StatutValidation'
  },
  categ: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'categ'
  },
  type: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'type'
  }
}, {
  tableName: 'TabDevm',
  timestamps: false,
  indexes: [
    {
      fields: ['Nf']
    },
    {
      fields: ['CodTiers']
    },
    {
      fields: ['DatUser']
    },
    {
      fields: ['Valid']
    },
    {
      fields: ['IA_Probabilite']
    }
  ]
});

module.exports = Devis;
