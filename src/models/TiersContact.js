const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TiersContact = sequelize.define('TiersContact', {
  IDTiers: {
    type: DataTypes.UUID,
    primaryKey: true,
    field: 'IDTiers'
  },
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'ID'
  },
  Responsable: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'Responsable'
  },
  Tel: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'Tel'
  }
}, {
  tableName: 'TabTiersContact',
  timestamps: false,
  freezeTableName: true
});

module.exports = TiersContact;
