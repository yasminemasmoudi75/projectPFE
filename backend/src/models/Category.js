const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define('Category', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    CategorieType: {
        type: DataTypes.STRING
    },
    CategorieLevel: {
        type: DataTypes.INTEGER
    },
    Pos: {
        type: DataTypes.INTEGER
    },
    Img: {
        type: DataTypes.STRING
    },
    IconField: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'TabCategorie',
    timestamps: false
});

module.exports = Category;
