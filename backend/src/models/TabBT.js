const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TabBT = sequelize.define('TabBT', {
    IDBT: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'IDBT'
    },
    NumBT: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'NumBT'
    },
    DatBT: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
        field: 'DatBT'
    },
    CodServ: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'CodServ'
    },
    DescPanne: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'DescPanne'
    },
    IDEquip: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'IDEquip'
    },
    IDInterv: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'IDInterv'
    },
    CodInterv: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'CodInterv'
    },
    CodPanne: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'CodPanne'
    },
    DesPanne: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'DesPanne'
    },
    DatDebutRep: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'DatDebutRep'
    },
    DatFinrep: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'DatFinrep'
    },
    Resultat: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'Resultat'
    },
    CodGroup: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'CodGroup'
    },
    NumDI: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'NumDI'
    },
    DatDI: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'DatDI'
    },
    IDDI: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'IDDI'
    },
    CodSymp: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'CodSymp'
    },
    DatCreate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
        field: 'DatCreate'
    },
    DatModif: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'DatModif'
    },
    CodRemed: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'CodRemed'
    },
    DesRemed: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'DesRemed'
    },
    BTClotured: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        field: 'BTClotured'
    },
    BTEncours: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        field: 'BTEncours'
    },
    DesEquip: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'DesEquip'
    },
    IntExt: {
        type: DataTypes.SMALLINT,
        allowNull: true,
        field: 'IntExt'
    },
    IDFournis: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'IDFournis'
    },
    IDBRep: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'IDBRep'
    },
    NumBRep: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'NumBRep'
    },
    Demandeur: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'Demandeur'
    },
    CodSServ: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'CodSServ'
    },
    PeriodRepJ: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'PeriodRepJ'
    },
    PeriodRepH: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'PeriodRepH'
    },
    PeriodRepM: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'PeriodRepM'
    }
}, {
    tableName: 'TabBT',
    timestamps: false
});

module.exports = TabBT;
