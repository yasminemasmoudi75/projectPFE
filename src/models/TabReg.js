const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TabReg = sequelize.define('TabReg', {
  IDReg: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  IDContact: DataTypes.INTEGER,
  DatReg: DataTypes.DATE,
  CodTiers: DataTypes.STRING(50),
  LibTiers: DataTypes.STRING(255),
  Adresse: DataTypes.STRING(255),
  Pieces: DataTypes.TEXT,
  MntReg: DataTypes.FLOAT,
  Niveau: DataTypes.INTEGER,
  CUser: DataTypes.STRING(255),
  DatUser: DataTypes.DATE,
  Payed: DataTypes.BOOLEAN,
  MntTotPieces: DataTypes.FLOAT,
  Document: DataTypes.STRING(255),
  bTransf: DataTypes.BOOLEAN,
}, {
  tableName: 'TabReg',
  timestamps: false,
});

module.exports = TabReg;
