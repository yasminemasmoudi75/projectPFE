const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TabSociete = sequelize.define('TabSociete', {
    DENOMINATION: {
        type: DataTypes.STRING(50),
        field: 'DENOMINATION',
        primaryKey: true
    },
    ADRESSE: {
        type: DataTypes.TEXT,
        field: 'ADRESSE'
    },
    VILLE: {
        type: DataTypes.STRING(35),
        field: 'VILLE'
    },
    CP: {
        type: DataTypes.STRING(7),
        field: 'CP'
    },
    EMAIL: {
        type: DataTypes.STRING(40),
        field: 'EMAIL'
    },
    WWW: {
        type: DataTypes.STRING(50),
        field: 'WWW'
    },
    TELEPHONE: {
        type: DataTypes.STRING(17),
        field: 'TELEPHONE'
    },
    FAX: {
        type: DataTypes.STRING(17),
        field: 'FAX'
    },
    LOGO: {
        type: DataTypes.BLOB('long'),
        field: 'LOGO'
    },
    TVA_INTRACOM: {
        type: DataTypes.STRING(20),
        field: 'TVA_INTRACOM'
    }
}, {
    tableName: 'TabSociete',
    timestamps: false,
    freezeTableName: true
});

module.exports = TabSociete;
