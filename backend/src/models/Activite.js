const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Activite = sequelize.define('TabActivite', {
  ID_Activite: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'ID_Activite'
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
  IDTiers: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'IDTiers',
    references: {
      model: 'TabTiers',
      key: 'IDTiers'
    }
  },
  ID_Projet: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'ID_Projet',
    references: {
      model: 'TabProjet',
      key: 'ID_Projet'
    }
  },
  Type_Activite: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'Type_Activite'
  },
  Description: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'Description'
  },
  Date_Activite: {
    type: DataTypes.STRING(25),
    allowNull: true,
    defaultValue: DataTypes.NOW,
    field: 'Date_Activite',
    get() {
      const value = this.getDataValue('Date_Activite');
      return value ? new Date(value) : null;
    }
  },
  Statut: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'Statut'
  }
}, {
  tableName: 'TabActivite',
  timestamps: false,
  indexes: [
    {
      fields: ['ID_Utilisateur']
    },
    {
      fields: ['IDTiers']
    },
    {
      fields: ['ID_Projet']
    },
    {
      fields: ['Date_Activite']
    },
    {
      fields: ['Type_Activite']
    }
  ]
});

module.exports = Activite;
