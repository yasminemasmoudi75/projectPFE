const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('MSGMessages', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'ID'
  },
  SenderID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'SenderID',
    references: {
      model: 'Sec_Users',
      key: 'UserID'
    }
  },
  RecipientID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'RecipientID',
    references: {
      model: 'Sec_Users',
      key: 'UserID'
    }
  },
  MessageText: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'MessageText'
  },
  MessageUnicodeText: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'MessageUnicodeText'
  },
  SendingDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'SendingDate'
  },
  DeliveryDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'DeliveryDate'
  },
  Delivered: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    field: 'Delivered'
  },
  MessageType: {
    type: DataTypes.SMALLINT,
    allowNull: true,
    field: 'MessageType'
  },
  Command: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'Command'
  },
  MessageDataSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'MessageDataSize'
  },
  MessageData: {
    type: DataTypes.BLOB,
    allowNull: true,
    field: 'MessageData'
  }
}, {
  tableName: 'MSGMessages',
  timestamps: false,
  indexes: [
    {
      fields: ['SenderID']
    },
    {
      fields: ['RecipientID']
    },
    {
      fields: ['SendingDate']
    }
  ]
});

module.exports = Message;
