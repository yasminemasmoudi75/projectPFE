const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GmailOAuthTokens = sequelize.define('GmailOAuthTokens', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'ID'
  },
  UserID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'UserID'
    // Commenté: Séquelize génère une contrainte incorrecte, la BD la gère déjà
    // references: {
    //   model: 'Sec_Users',
    //   key: 'UserID'
    // }
  },
  AccessToken: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'AccessToken'
  },
  RefreshToken: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'RefreshToken'
  },
  TokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'TokenExpiry'
  },
  GmailEmail: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'GmailEmail'
  },
  CreatedAt: {
    type: DataTypes.DATE,
    defaultValue: sequelize.fn('GETDATE'),
    field: 'CreatedAt'
  },
  UpdatedAt: {
    type: DataTypes.DATE,
    defaultValue: sequelize.fn('GETDATE'),
    field: 'UpdatedAt'
  },
  IsActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: 1,
    field: 'IsActive'
  }
}, {
  tableName: 'GmailOAuthTokens',
  timestamps: false
});

module.exports = GmailOAuthTokens;
