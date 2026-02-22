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

// Helper function to parse and validate dates
const parseDate = (dateValue) => {
  if (!dateValue || dateValue === '' || dateValue === 'null' || dateValue === null) {
    return null;
  }
  
  try {
    // If it's already a Date object, return it
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }
    
    // Try to parse string
    const parsed = new Date(dateValue);
    if (isNaN(parsed.getTime())) {
      return null;
    }
    return parsed;
  } catch (e) {
    console.error('⚠️  Invalid date value:', dateValue, e.message);
    return null;
  }
};

// Hooks to handle computed column NetHT and date fields
Devis.beforeCreate((devis) => {
  // Remove NetHT before insert as it's a computed column in SQL Server
  if (devis.dataValues.hasOwnProperty('NetHT')) {
    delete devis.dataValues.NetHT;
  }
  
  // Parse and clean date fields
  const dateFields = ['DatUser', 'MDate', 'DatLiv'];
  dateFields.forEach(field => {
    if (devis.dataValues.hasOwnProperty(field)) {
      const parsed = parseDate(devis.dataValues[field]);
      devis.dataValues[field] = parsed || (field === 'DatUser' ? new Date() : null);
    }
  });
  
  // Ensure DatUser has a value
  if (!devis.dataValues.DatUser) {
    devis.dataValues.DatUser = new Date();
  }
});

Devis.beforeUpdate((devis) => {
  // Remove NetHT before update as it's a computed column in SQL Server
  if (devis.dataValues.hasOwnProperty('NetHT')) {
    delete devis.dataValues.NetHT;
  }
  
  // Parse and clean date fields
  const dateFields = ['DatUser', 'MDate', 'DatLiv'];
  dateFields.forEach(field => {
    if (devis.dataValues.hasOwnProperty(field)) {
      const parsed = parseDate(devis.dataValues[field]);
      devis.dataValues[field] = parsed || (field === 'DatUser' ? new Date() : null);
    }
  });
});

module.exports = Devis;
