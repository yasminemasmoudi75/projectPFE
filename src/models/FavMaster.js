const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FavMaster = sequelize.define('TabFavm', {
    Guid: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        field: 'Guid'
    },
    Prfx: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'Prfx'
    },
    Sufx: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'Sufx'
    },
    Nf: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'Nf'
    },
    IDContact: {
        type: DataTypes.STRING(40),
        allowNull: true,
        field: 'IDContact'
    },
    CodTiers: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'CodTiers'
    },
    LibTiers: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'LibTiers'
    },
    Adresse: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'Adresse'
    },
    Remarq: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'Remarq'
    },
    AssujTiers: {
        type: DataTypes.STRING(30),
        allowNull: true,
        field: 'AssujTiers'
    },
    TotHT: {
        type: DataTypes.FLOAT,
        allowNull: true,
        field: 'TotHT'
    },
    TotTva: {
        type: DataTypes.FLOAT,
        allowNull: true,
        field: 'TotTva'
    },
    TotTTC: {
        type: DataTypes.FLOAT,
        allowNull: true,
        field: 'TotTTC'
    },
    TotRem: {
        type: DataTypes.FLOAT,
        allowNull: true,
        field: 'TotRem'
    },
    NetHT: {
        type: DataTypes.FLOAT,
        allowNull: true,
        field: 'NetHT'
    },
    Timbre: {
        type: DataTypes.FLOAT,
        allowNull: true,
        field: 'Timbre'
    },
    Valid: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        field: 'Valid'
    },
    MntDebit: {
        type: DataTypes.FLOAT,
        allowNull: true,
        field: 'MntDebit'
    },
    MntCredit: {
        type: DataTypes.FLOAT,
        allowNull: true,
        field: 'MntCredit'
    },
    DatUser: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'DatUser'
    },
    MDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'MDate'
    },
    DatLiv: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'DatLiv'
    },
    CUser: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'CUser'
    },
    CodMag: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'CodMag'
    },
    CodRepres: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'CodRepres'
    },
    bTransf: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        field: 'bTransf'
    },
    // Alias UI: frontend expects IsConverted, DB uses bTransf
    IsConverted: {
        type: DataTypes.VIRTUAL,
        get() { return !!this.getDataValue('bTransf'); }
    },
    bLivr: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        field: 'bLivr'
    },
    CodDev: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'CodDev'
    },
    StockDecremente: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'StockDecremente'
    },
    SourceBlvGuid: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'SourceBlvGuid'
    }
}, {
    tableName: 'TabFavm',
    timestamps: false,
    freezeTableName: true,
    indexes: [
        { fields: ['Nf'] },
        { fields: ['CodTiers'] },
        { fields: ['DatUser'] },
        { fields: ['Valid'] }
    ]
});

// Hooks pour ajouter les dates automatiquement
const FavMasterModel = FavMaster;
FavMasterModel.beforeCreate((fav) => {
    const now = new Date();
    // Envoyer les dates sans timezone pour SQL Server DATETIME
    if (!fav.DatUser) fav.DatUser = now.toISOString().slice(0, 19).replace('T', ' ');
    if (!fav.MDate) fav.MDate = now.toISOString().slice(0, 19).replace('T', ' ');
});

FavMasterModel.beforeUpdate((fav) => {
    const now = new Date();
    if (!fav.DatUser) fav.DatUser = now.toISOString().slice(0, 19).replace('T', ' ');
});

module.exports = FavMaster;
