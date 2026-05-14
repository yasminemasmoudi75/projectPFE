const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LoginLog = sequelize.define('LoginLog', {
  ID_Log: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'ID_Log'
  },
  ID_Utilisateur: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'ID_Utilisateur'
  },
  LoginName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'LoginName'
  },
  FullName: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'FullName'
  },
  Role: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'Role'
  },
  Action: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'Action',
    defaultValue: 'LOGIN_SUCCESS'
    // LOGIN_SUCCESS | LOGIN_FAILED | LOGOUT
  },
  IPAddress: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'IPAddress'
  },
  UserAgent: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'UserAgent'
  },
  Details: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'Details'
  },
  DateConnexion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('GETDATE()'),
    field: 'DateConnexion'
  }
}, {
  tableName: 'UCS_LOGIN_LOGS',
  timestamps: false
});

module.exports = LoginLog;
