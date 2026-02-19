const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('Sec_Users', {
  UserID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'UserID'
  },

  LoginName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    field: 'LoginName'
  },

  FullName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'FullName'
  },

  Password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'Password'
  },

  MustChangePassword: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
    field: 'MustChangePassword'
  },

  EmailPro: {
    type: DataTypes.STRING(150),
    allowNull: true,
    field: 'EmailPro',
    validate: { isEmail: true }
  },

  TelPro: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'TelPro'
  },

  UserRole: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'UserRole'
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
    type: DataTypes.STRING(25),
    allowNull: true,
    field: 'DateNaissance',
    get() {
      const value = this.getDataValue('DateNaissance');
      return value ? new Date(value) : null;
    }
  },

  PhotoProfil: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'PhotoProfil'
  },

  IsActive: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
    field: 'IsActive'
  },

  Enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
    field: 'Enabled'
  },

  StatutCompte: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'StatutCompte'
  },

  RefreshToken: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'RefreshToken'
  },

  LastLogin: {
    type: DataTypes.STRING(25),
    allowNull: true,
    field: 'LastLogin',
    get() {
      const value = this.getDataValue('LastLogin');
      return value ? new Date(value) : null;
    }
  },

  LastAccess: {
    type: DataTypes.STRING(25),
    allowNull: true,
    field: 'LastAccess',
    get() {
      const value = this.getDataValue('LastAccess');
      return value ? new Date(value) : null;
    }
  },

  CreatedDate: {
    type: DataTypes.STRING(25),
    allowNull: true,
    field: 'CreatedDate',
    get() {
      const value = this.getDataValue('CreatedDate');
      return value ? new Date(value) : null;
    }
  },

  AccessCount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    field: 'AccessCount'
  },

  TauxTransformationCible: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'TauxTransformationCible'
  }

}, {
  tableName: 'Sec_Users',
  timestamps: false,
  freezeTableName: true
});

module.exports = User;