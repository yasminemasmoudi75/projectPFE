const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BcvDetail = sequelize.define('TabBcvd', {
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
        type: DataTypes.STRING(30),
        field: 'ID'
    },
    NF: {
        type: DataTypes.INTEGER,
        field: 'NF'
    },
    CodArt: {
        type: DataTypes.STRING(30),
        allowNull: false,
        field: 'CodArt'
    },
    LibArt: {
        type: DataTypes.STRING(255),
        field: 'LibArt'
    },
    Qt: {
        type: DataTypes.FLOAT,
        field: 'Qt'
    },
    PuHT: {
        type: DataTypes.FLOAT,
        field: 'PuHT'
    },
    PuTTC: {
        type: DataTypes.FLOAT,
        field: 'PuTTC'
    },
    MntRem: {
        type: DataTypes.FLOAT,
        field: 'MntRem'
    },
    MntTVA: {
        type: DataTypes.FLOAT,
        field: 'MntTVA'
    },
    MntHT: {
        type: DataTypes.FLOAT,
        field: 'MntHT'
    },
    MntFodec: {
        type: DataTypes.FLOAT,
        field: 'MntFodec'
    },
    Codabar: {
        type: DataTypes.STRING(50),
        field: 'Codabar'
    },
    IDArt: {
        type: DataTypes.STRING(50),
        field: 'IDArt'
    }
}, {
    tableName: 'TabBcvd',
    timestamps: false,
    freezeTableName: true
});

module.exports = BcvDetail;
