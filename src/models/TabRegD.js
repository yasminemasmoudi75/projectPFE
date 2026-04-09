const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TabRegD = sequelize.define('TabRegD', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  IDReg: DataTypes.INTEGER,
  Echeance: DataTypes.DATE,
  ModReg: DataTypes.STRING(100),
  Montant: DataTypes.FLOAT,
  NumPieceReg: DataTypes.STRING(100),
  DetPieceReg: DataTypes.TEXT,
  Valid: DataTypes.BOOLEAN,
  IDBank: DataTypes.INTEGER,
  DatValeur: DataTypes.DATE,
  NumBord: DataTypes.STRING(100),
  ValidBloc: DataTypes.BOOLEAN,
  Banque: DataTypes.STRING(255),
  NumCompte: DataTypes.STRING(100),
  MntDebit: DataTypes.FLOAT,
  MntCredit: DataTypes.FLOAT,
  Pointer: DataTypes.BOOLEAN,
  DatPoint: DataTypes.DATE,
  Operation: DataTypes.TEXT,
  TauxRet: DataTypes.FLOAT,
  bTransfbn: DataTypes.BOOLEAN,
  DatVers: DataTypes.DATE,
  bTransfvers: DataTypes.BOOLEAN,
  bTransfReg: DataTypes.BOOLEAN,
  PieceCompt: DataTypes.STRING(100),
}, {
  tableName: 'TabRegD',
  timestamps: false,
});

module.exports = TabRegD;
