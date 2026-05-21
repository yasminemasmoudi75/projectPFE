const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const parseLegacyNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;

  const normalized = String(value).replace(',', '.');
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatLegacyNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? String(value) : String(parsed);
};

const Projet = sequelize.define('Projet', {
  ID_Projet: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    field: 'IdPojet'
  },
  Code_Pro: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'CodProjet'
  },
  Nom_Projet: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'Libstatut' // Alias for project name
  },
  IDTiers: {
    type: DataTypes.STRING(250),
    allowNull: true,
    field: 'CodSoc' // Logical link to Tiers
  },
  Date_Creation: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'dateSave'
  },
  Budget_Alloue: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'CA',
    get() {
      return parseLegacyNumber(this.getDataValue('Budget_Alloue'));
    },
    set(value) {
      this.setDataValue('Budget_Alloue', formatLegacyNumber(value));
    }
  },
  CA_Estime: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.get('Budget_Alloue');
    },
    set(value) {
      this.set('Budget_Alloue', value);
    }
  },
  Avancement: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'codstatut',
    get() {
      return parseLegacyNumber(this.getDataValue('Avancement'));
    }
  },
  Phase: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'Statut'
  },
  CodDev: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'CodDev'
  },
  CodBc: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'CodBc'
  },
  Priorite: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'Categ'
  },
  Date_Echeance: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'DateBl'
  },
  Note_Privee: {
    type: DataTypes.STRING(4000),
    allowNull: true,
    field: 'Discreption'
  },
  CodCom: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'CodCom'
  },
  nf: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'nf'
  },
  // --- VIRTUALS FOR APP LOGIC ---
  Alerte_IA_Risque: { type: DataTypes.VIRTUAL, defaultValue: false }
}, {
  tableName: 'TabProjet',
  timestamps: false,
  freezeTableName: true
});

module.exports = Projet;
