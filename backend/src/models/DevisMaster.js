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
    field: 'NetHT'
  },
  Valid: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'Valid'
  },
  DatUser: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'DatUser'
  },
  MDate: {
    type: DataTypes.STRING(30),
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
    type: DataTypes.STRING(30),
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
    type: DataTypes.STRING(30),
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

// Helper function to parse and validate dates
const parseDate = (dateValue) => {
  if (!dateValue || dateValue === '' || dateValue === 'null' || dateValue === null) {
    return null;
  }

  try {
    let date;
    if (dateValue instanceof Date) {
      date = isNaN(dateValue.getTime()) ? null : dateValue;
    } else {
      // Strip timezone offset - SQL Server DATETIME doesn't support it
      const cleaned = String(dateValue).replace(/([+-]\d{2}:\d{2}|Z)$/, '').trim();
      date = new Date(cleaned);
      if (isNaN(date.getTime())) return null;
    }

    // Format as SQL Server-compatible datetime string (no timezone)
    const pad = (n) => String(n).padStart(2, '0');
    const pad3 = (n) => String(n).padStart(3, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad3(date.getMilliseconds())}`;
  } catch (e) {
    console.error('⚠️  Invalid date value:', dateValue, e.message);
    return null;
  }
};

const nowForSQL = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const pad3 = (n) => String(n).padStart(3, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad3(d.getMilliseconds())}`;
};

// Hooks to handle computed column NetHT and date fields
Devis.beforeCreate((devis) => {
  if (devis.dataValues.hasOwnProperty('NetHT')) {
    delete devis.dataValues.NetHT;
  }

  const dateFields = ['DatUser', 'MDate', 'DatLiv'];
  dateFields.forEach(field => {
    if (devis.dataValues.hasOwnProperty(field)) {
      const parsed = parseDate(devis.dataValues[field]);
      devis.dataValues[field] = parsed || (field === 'DatUser' ? nowForSQL() : null);
    }
  });

  if (!devis.dataValues.DatUser) {
    devis.dataValues.DatUser = nowForSQL();
  }
});

Devis.beforeUpdate((devis) => {
  if (devis.dataValues.hasOwnProperty('NetHT')) {
    delete devis.dataValues.NetHT;
  }

  const dateFields = ['DatUser', 'MDate', 'DatLiv'];
  dateFields.forEach(field => {
    if (devis.dataValues.hasOwnProperty(field)) {
      const parsed = parseDate(devis.dataValues[field]);
      devis.dataValues[field] = parsed || (field === 'DatUser' ? nowForSQL() : null);
    }
  });
});

module.exports = Devis;
