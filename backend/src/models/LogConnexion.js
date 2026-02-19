const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LogConnexion = sequelize.define('TabLogConnexion', {
  ID_Log: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'ID_Log'
  },
  UserID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'UserID',
    references: {
      model: 'Sec_Users',
      key: 'UserID'
    }
  },
  DateAcces: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    field: 'DateAcces'
  },
  AdresseIP: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'AdresseIP'
  },
  Navigateur: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'Navigateur'
  },
  Tentative_Reussie: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
    field: 'Tentative_Reussie'
  },
  Motif_Echec: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'Motif_Echec'
  }
}, {
  tableName: 'TabLogConnexion',
  timestamps: false,
  indexes: [
    {
      fields: ['UserID']
    },
    {
      fields: ['DateAcces']
    },
    {
      fields: ['Tentative_Reussie']
    }
  ]
});

module.exports = LogConnexion;
