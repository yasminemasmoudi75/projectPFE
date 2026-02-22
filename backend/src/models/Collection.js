const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Collection = sequelize.define('Collection', {
    Collection: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    }
}, {
    tableName: 'TabCollection',
    timestamps: false
});

module.exports = Collection;
