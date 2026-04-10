const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TabModReg = sequelize.define('TabModReg', {
    IDReg: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    ModReg: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
}, {
    tableName: 'TabModReg',
    timestamps: false,
});

module.exports = TabModReg;
