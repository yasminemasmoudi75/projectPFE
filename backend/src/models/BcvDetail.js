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
    ID: { type: DataTypes.INTEGER, allowNull: true, field: 'ID' },
    NF: { type: DataTypes.INTEGER, allowNull: true, field: 'NF' },
    CodArt: { type: DataTypes.STRING(100), allowNull: true, field: 'CodArt' },
    LibArt: { type: DataTypes.STRING(500), allowNull: true, field: 'LibArt' },
    ExLibArt: { type: DataTypes.STRING(1000), allowNull: true, field: 'ExLibArt' },
    Qt: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0, field: 'Qt' },
    PuHT: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0, field: 'PuHT' },
    PuTTC: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0, field: 'PuTTC' },
    MntRem: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0, field: 'MntRem' },
    MntTVA: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0, field: 'MntTVA' },
    MntHT: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0, field: 'MntHT' },
    MntFodec: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0, field: 'MntFodec' },
    NumBL: { type: DataTypes.STRING(100), allowNull: true, field: 'NumBL' },
    DateBL: { type: DataTypes.STRING(30), allowNull: true, field: 'DateBL' },
    Codabar: { type: DataTypes.STRING(100), allowNull: true, field: 'Codabar' },
    PvPub: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0, field: 'PvPub' },
    CodColor: { type: DataTypes.STRING(50), allowNull: true, field: 'CodColor' },
    DesColor: { type: DataTypes.STRING(100), allowNull: true, field: 'DesColor' },
    CodTaille: { type: DataTypes.STRING(50), allowNull: true, field: 'CodTaille' },
    Taille: { type: DataTypes.STRING(50), allowNull: true, field: 'Taille' },
    IDArt: { type: DataTypes.UUID, allowNull: true, field: 'IDArt' },
    PuDev: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0, field: 'PuDev' },
    MntFrais: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0, field: 'MntFrais' },
    NumImport: { type: DataTypes.STRING(100), allowNull: true, field: 'NumImport' },
    DatImport: { type: DataTypes.STRING(30), allowNull: true, field: 'DatImport' },
}, {
    tableName: 'TabBcvd',
    timestamps: false,
});

module.exports = BcvDetail;
