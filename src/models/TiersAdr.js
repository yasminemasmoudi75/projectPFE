const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TiersAdr = sequelize.define('TiersAdr', {
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
  Adresse: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'Adresse'
  }
}, {
  tableName: 'TabTiersAdr',
  timestamps: false,
  freezeTableName: true
});

module.exports = TiersAdr;
