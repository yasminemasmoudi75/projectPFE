const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TabRegF = sequelize.define('TabRegF', {
  IDReg: DataTypes.UUID,
  IDPieces: DataTypes.UUID,
  NumPiece: DataTypes.STRING(100),
  MDate: DataTypes.DATE,
  MntPiece: DataTypes.FLOAT,
  MntReg: DataTypes.FLOAT,
  Solde: DataTypes.FLOAT,
  MntAdded: DataTypes.FLOAT,
  TypPiece: DataTypes.STRING(100),
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
}, {
  tableName: 'TabRegF',
  timestamps: false,
});

module.exports = TabRegF;
