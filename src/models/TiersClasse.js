const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TiersClasse = sequelize.define('TiersClasse', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
    },
    libelle: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'libelle'
    }
}, {
    tableName: 'tiersClasse',
    timestamps: false,
    freezeTableName: true
});

module.exports = TiersClasse;
