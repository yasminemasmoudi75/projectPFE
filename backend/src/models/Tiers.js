const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tiers = sequelize.define('TabTiers', {
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
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'CodTiers'
  },
  Raisoc: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'Raisoc'
  },
  Cin: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'Cin'
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
  Pays: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'Pays'
  },
  Tel: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'Tel'
  },
  Gsm: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'Gsm'
  },
  Email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'Email',
    validate: {
      isEmail: true
    }
  },
  www: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'www'
  },
  Remise: {
    type: DataTypes.DECIMAL,
    allowNull: true,
    defaultValue: 0,
    field: 'Remise'
  },
  Blockage: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'Blockage'
  },
  Actif: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
    field: 'Actif'
  },
  DateCreatUser: {
    type: DataTypes.STRING(25),
    allowNull: true,
    defaultValue: require('../config/database').sequelize.literal('GETDATE()'),
    field: 'DateCreatUser',
    get() {
      const value = this.getDataValue('DateCreatUser');
      return value ? new Date(value) : null;
    }
  },
  UserCreate: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'UserCreate'
  },
  // Géolocalisation
  lat: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'lat'
  },
  long: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'long'
  },
  AdresseMaps: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'AdresseMaps'
  },
  // Champs IA et CRM
  ScoreSatisfaction: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'ScoreSatisfaction'
  },
  IA_NoteInterne: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'IA_NoteInterne'
  },
  Est_Favoris: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'Est_Favoris'
  },
  DomaineActivite: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'DomaineActivite'
  },
  CatSociete: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'CatSociete'
  },
  StatutSociete: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'StatutSociete'
  },
  codRepresTiers: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'codRepresTiers'
  }
}, {
  tableName: 'TabTiers',
  timestamps: false,
  indexes: [
    {
      name: 'TabTiers_idx',
      unique: true,
      fields: ['CodTiers', 'Niveau']
    },
    {
      name: 'PK_TabClient',
      unique: true,
      fields: ['IDTiers', 'Niveau']
    },
    {
      fields: ['Raisoc']
    },
    {
      fields: ['Email']
    },
    {
      fields: ['Actif']
    },
    {
      fields: ['lat', 'long']
    }
  ]
});

module.exports = Tiers;

