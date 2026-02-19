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
    defaultValue: DataTypes.NOW,
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
    defaultValue: false,
    field: 'Delivered'
  },
  IsRead: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'IsRead'
  },
  MessageType: {
    type: DataTypes.SMALLINT,
    allowNull: true,
    field: 'MessageType'
  },
  TypeMessage: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'TypeMessage'
  },
  RecipientRole: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'RecipientRole'
  },
  PieceJointeUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'PieceJointeUrl'
  },
  IDThread: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'IDThread'
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
      fields: ['IDThread']
    },
    {
      fields: ['SendingDate']
    }
  ]
});

module.exports = Message;
