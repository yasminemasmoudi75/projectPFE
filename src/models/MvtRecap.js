const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MvtRecap = sequelize.define('MvtRecap', {
    CODTIERS: {
        type: DataTypes.STRING(20),
        primaryKey: true,
    },
    DESTIERS: DataTypes.STRING(255),
    TOTHT: DataTypes.FLOAT,
    TOTHTRET: DataTypes.FLOAT,
    REM: DataTypes.FLOAT,
    CODTVA: DataTypes.STRING(100),
    FLAGS: DataTypes.INTEGER,
}, {
    tableName: 'MvtRecap',
    timestamps: false,
});

module.exports = MvtRecap;
