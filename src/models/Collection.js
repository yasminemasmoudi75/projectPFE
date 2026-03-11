const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Collection = sequelize.define('Collection', {
    Collection: {
        type: DataTypes.STRING(100),
        primaryKey: true,
        allowNull: false,
        field: 'Collection'
    }
}, {
    tableName: 'TabCollection',
    timestamps: false,
    freezeTableName: true
});

module.exports = Collection;
