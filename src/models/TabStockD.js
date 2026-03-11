const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TabStockD = sequelize.define('TabStockD', {
    IDArt: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'IDArt'
    },
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'ID'
    },
    CodArt: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'CodArt'
    },
    CodArtD: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'CodArtD'
    },
    CodColor: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'CodColor'
    },
    CodTaille: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'CodTaille'
    },
    Taille: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'Taille'
    },
    DesColor: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'DesColor'
    },
    Qte: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0,
        field: 'Qte'
    }
}, {
    tableName: 'TabStockD',
    timestamps: false,
    freezeTableName: true
});

module.exports = TabStockD;
