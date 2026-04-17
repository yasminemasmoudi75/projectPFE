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
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'Sufx'
  },
  IDContact: {
    type: DataTypes.STRING(40),
    allowNull: true,
    field: 'IDContact'
  },
  CodTiers: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'CodTiers'
  },
  LibTiers: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'LibTiers'
  },
  Adresse: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'Adresse'
  },
  Remarq: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'Remarq'
  },
  AssujTiers: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'AssujTiers'
  },
  TotHT: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'TotHT'
  },
  TotTva: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'TotTva'
  },
  TotTTC: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'TotTTC'
  },
  TotRem: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'TotRem'
  },
  NetHT: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'NetHT'
  },
  Timbre: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'Timbre'
  },
  Valid: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    field: 'Valid'
  },
  MntDebit: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'MntDebit'
  },
  MntCredit: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'MntCredit'
  },
  DatUser: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'DatUser'
  },
  DatCreateUser: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'DatCreateUser'
  },
  MDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'MDate'
  },
  DatLiv: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'DatLiv'
  },
  CUser: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'CUser'
  },
  CodMag: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'CodMag'
  },
  CodRepres: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'CodRepres'
  },
  bTransf: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    field: 'bTransf'
  },
  CodProject: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'CodProject'
  },
  CodDev: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'CodDev'
  }
}, {
  tableName: 'TabDevm',
  timestamps: false,
  freezeTableName: true,
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
    }
  ]
});

// Hooks pour ajouter les dates automatiquement
Devis.beforeCreate((devis) => {
  const now = new Date();
  // Envoyer les dates sans timezone pour SQL Server DATETIME
  if (!devis.DatCreateUser) devis.DatCreateUser = now.toISOString().slice(0, 19).replace('T', ' ');
  if (!devis.DatUser) devis.DatUser = now.toISOString().slice(0, 19).replace('T', ' ');
  if (!devis.MDate) devis.MDate = now.toISOString().slice(0, 19).replace('T', ' ');
});

Devis.beforeUpdate((devis) => {
  const now = new Date();
  if (!devis.DatUser) devis.DatUser = now.toISOString().slice(0, 19).replace('T', ' ');
});

module.exports = Devis;
