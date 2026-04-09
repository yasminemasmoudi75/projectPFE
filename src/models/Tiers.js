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
  Classe: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'Classe',
    references: {
      model: 'tiersClasse',
      key: 'id'
    }
  },
  Categorie: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'Categorie',
    references: {
      model: 'tiersCategorie',
      key: 'id'
    }
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
  www: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'www'
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
  Remise: {
    type: DataTypes.DECIMAL(18, 3),
    allowNull: true,
    field: 'Remise'
  },
  Blockage: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    field: 'Blockage'
  },
  Timbre: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    field: 'Timbre'
  },
  Major: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    field: 'Major'
  },
  Exonor: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    field: 'Exonor'
  },
  TextExonor: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'TextExonor'
  },
  NbrCreditJour: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'NbrCreditJour'
  },
  Plafondcredit: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'Plafondcredit'
  },
  ModReg: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'ModReg'
  },
  DetailReg: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'DetailReg'
  },
  Banque: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'Banque'
  },
  RC: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'RC'
  },
  assujet: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    field: 'assujet'
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
    type: 'DATETIME',
    allowNull: true,
    field: 'SaveDate'
  },
  Actif: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    field: 'Actif'
  },
  Fictif: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    field: 'Fictif'
  },
  Pub: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    field: 'Pub'
  },
  AdresseMaps: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'AdresseMaps'
  },
  MapsVille: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'MapsVille'
  },
  MapsPays: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'MapsPays'
  },
  MapsDistrict: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'MapsDistrict'
  },
  MapsRegion: {
    type: DataTypes.STRING(70),
    allowNull: true,
    field: 'MapsRegion'
  },
  MapsSubRegion: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'MapsSubRegion'
  },
  Gouvernorat: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'gouvernorat',
    references: {
      model: 'tiersGouvernorat',
      key: 'id'
    }
  },
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

Tiers.associate = (models) => {
  Tiers.belongsTo(models.TiersClasse, { foreignKey: 'Classe', as: 'tiersClasse' });
  Tiers.belongsTo(models.TiersGouvernorat, { foreignKey: 'Gouvernorat', as: 'region' });
  Tiers.belongsTo(models.TiersCategorie, { foreignKey: 'Categorie', as: 'tiersCategorieObj' });
};

module.exports = Tiers;
