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
    type: DataTypes.STRING(100),
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
  Gouvernorat: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'Gouvernorat'
  },
  PhotoProfil: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'PhotoProfil'
  },
  TelPro: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'TelPro'
  },
  PosteOccupe: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'PosteOccupe'
  },
  Departement: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'Departement'
  },
  DateNaissance: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'DateNaissance'
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