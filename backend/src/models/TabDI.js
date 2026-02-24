const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TabDI = sequelize.define('TabDI', {
    IDDI: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'IDDI'
    },
    NumDI: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'NumDI'
    },
    DatDI: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
        field: 'DatDI'
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
    Service: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'Service'
    },
    DesEquip: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'DesEquip'
    },
    CodSymp: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'CodSymp'
    },
    Reponse: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'Reponse'
    },
    Comment: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'Comment'
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
    Demandeur: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'Demandeur'
    },
    CodSServ: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'CodSServ'
    }
}, {
    tableName: 'TabDI',
    timestamps: false
});

module.exports = TabDI;
