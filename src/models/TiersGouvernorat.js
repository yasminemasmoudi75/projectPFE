const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TiersGouvernorat = sequelize.define('TiersGouvernorat', {
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
    tableName: 'tiersGouvernorat',
    timestamps: false,
    freezeTableName: true
});

module.exports = TiersGouvernorat;
