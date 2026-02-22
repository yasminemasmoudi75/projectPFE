const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DevisDetail = sequelize.define('TabDevd', {
    Guid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        field: 'Guid'
    },
    NoDetail: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'NoDetail'
    },
    ID: {
        type: DataTypes.INTEGER,
        field: 'ID'
    },
    NF: {
        type: DataTypes.INTEGER,
        field: 'NF'
    },
    CodArt: {
        type: DataTypes.STRING(100),
        field: 'CodArt'
    },
    LibArt: {
        type: DataTypes.STRING(500),
        field: 'LibArt'
    },
    Qt: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        field: 'Qt'
    },
    PuHT: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        field: 'PuHT'
    },
    PuTTC: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        field: 'PuTTC'
    },
    MntHT: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        field: 'MntHT'
    },
    MntRem: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        field: 'MntRem'
    },
    Tva: {
        type: DataTypes.FLOAT,
        defaultValue: 19,
        field: 'MntTVA'
    },
    IDArt: {
        type: DataTypes.UUID,
        field: 'IDArt'
    }
}, {
    tableName: 'TabDevd',
    timestamps: false
});

module.exports = DevisDetail;
