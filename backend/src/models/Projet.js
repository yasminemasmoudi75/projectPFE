const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Projet = sequelize.define('TabProjet', {
  ID_Projet: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'ID_Projet'
  },
  Code_Pro: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'Code_Pro'
  },
  Nom_Projet: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'Nom_Projet'
  },
  IDTiers: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'IDTiers',
    references: {
      model: 'TabTiers',
      key: 'IDTiers'
    }
  },
  CA_Estime: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'CA_Estime'
  },
  Budget_Alloue: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'Budget_Alloue'
  },
  Avancement: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'Avancement',
    validate: {
      min: 0,
      max: 100
    }
  },
  Phase: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'Phase'
  },
  Priorite: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'Priorite'
  },
  Date_Creation: {
    type: DataTypes.STRING(25),
    allowNull: true,
    field: 'Date_Creation',
    get() {
      const value = this.getDataValue('Date_Creation');
      return value ? new Date(value) : null;
    }
  },
  Date_Echeance: {
    type: DataTypes.STRING(25),
    allowNull: true,
    field: 'Date_Echeance',
    get() {
      const value = this.getDataValue('Date_Echeance');
      return value ? new Date(value) : null;
    }
  },
  Date_Cloture_Reelle: {
    type: DataTypes.STRING(25),
    allowNull: true,
    field: 'Date_Cloture_Reelle',
    get() {
      const value = this.getDataValue('Date_Cloture_Reelle');
      return value ? new Date(value) : null;
    }
  },
  Note_Privee: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'Note_Privee'
  },
  Alerte_IA_Risque: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'Alerte_IA_Risque',
    comment: 'Alerte IA si le projet est à risque'
  }
}, {
  tableName: 'TabProjet',
  timestamps: false,
  indexes: [
    {
      fields: ['Code_Pro']
    },
    {
      fields: ['IDTiers']
    },
    {
      fields: ['Phase']
    },
    {
      fields: ['Date_Echeance']
    },
    {
      fields: ['Alerte_IA_Risque']
    }
  ]
});

module.exports = Projet;
