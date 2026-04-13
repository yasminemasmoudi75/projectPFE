const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { formatDateForMSSQL } = require('../utils/helpers');

const Activite = sequelize.define('Activite', {
  Guid: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    field: 'Guid'
  },
  ID_Activite: {
    type: DataTypes.VIRTUAL,
    get() { return this.Guid; }
  },
  Nf: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'Nf'
  },
  Description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'DesTech'
  },
  Type_Activite: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'LibProj'
  },
  Date_Activite: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'Mdate',
    set(value) {
      this.setDataValue('Date_Activite', formatDateForMSSQL(value));
    }
  },
  User: {
    type: DataTypes.INTEGER, // ERP uses int for User
    allowNull: true,
    field: 'User'
  },
  Destinataire: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'Destinataire'
  },
  CodTiers: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'CodTiers'
  },
  CodProj: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'codProj'
  },
  Categ: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'categ'
  },
  Valide: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'Valide'
  },
  // --- VIRTUALS ---
  Statut: { type: DataTypes.VIRTUAL, defaultValue: 'Planifié' }
}, {
  tableName: 'TabActivite',
  timestamps: false,
  freezeTableName: true
});

module.exports = Activite;
