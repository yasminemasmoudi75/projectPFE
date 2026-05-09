const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TiersContactClasse = sequelize.define('TiersContactClasse', {
  idcontact: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'idcontact'
  },
  CA: {
    type: DataTypes.DECIMAL(18, 3),
    field: 'CA'
  },
  ClasseCalculee: {
    type: DataTypes.STRING,
    field: 'ClasseCalculee'
  }
}, {
  tableName: 'ViewCalculClasseContact',
  timestamps: false,
  freezeTableName: true
});

module.exports = TiersContactClasse;
