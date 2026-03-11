const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  UserID: {
    type: DataTypes.FLOAT,
    primaryKey: true,
    field: 'USER_ID'
  },
  // Use EmailPro handles the App's requirement for that field name
  EmailPro: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    field: 'USER_NAME' // This IS the liaison to ERP username
  },
  LoginName: {
    type: DataTypes.VIRTUAL,
    get() { return this.EmailPro; },
    set(val) { this.EmailPro = val; }
  },
  FullName: {
    type: DataTypes.STRING(40),
    allowNull: true,
    field: 'REAL_NAME'
  },
  Password: {
    type: DataTypes.STRING(60),
    allowNull: true,
    field: 'USER_PWD'
  },
  GUID: {
    type: DataTypes.STRING(38),
    allowNull: true,
    field: 'GUID'
  },
  // --- VIRTUALS ---
  UserRole: {
    type: DataTypes.VIRTUAL,
    get() { return this.getDataValue('UserRole') || 'User'; }
  },
  Enabled: {
    type: DataTypes.VIRTUAL,
    get() { return true; }
  },
  IsActive: {
    type: DataTypes.VIRTUAL,
    get() {
      const value = this.getDataValue('IsActive');
      return value == null ? true : value;
    }
  },
  RefreshToken: {
    type: DataTypes.VIRTUAL
  }
}, {
  tableName: 'UCS_USERS',
  timestamps: false,
  freezeTableName: true
});

module.exports = User;