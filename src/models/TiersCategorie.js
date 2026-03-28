const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TiersCategorie = sequelize.define('TiersCategorie', {
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
    tableName: 'tiersCategorie',
    timestamps: false
});

module.exports = TiersCategorie;
