const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'ID'
  },
  RecipientID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'RecipientID'
  },
  Title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'Title'
  },
  Message: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'Message'
  },
  Type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'Type',
    defaultValue: 'INFO'
  },
  IsRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'IsRead'
  },
  CreatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'CreatedAt'
  }
}, {
  tableName: 'UCS_NOTIFICATIONS',
  timestamps: false
});

module.exports = Notification;
