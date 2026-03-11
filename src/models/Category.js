const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define('Category', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'ID'
    },
    Title: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'Title'
    },
    CategorieType: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'CategorieType'
    },
    CategorieLevel: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'CategorieLevel'
    },
    Pos: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'Pos'
    },
    Img: {
        type: DataTypes.BLOB,
        allowNull: true,
        field: 'Img'
    },
    IconField: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'IconField'
    }
}, {
    tableName: 'TabCategorie',
    timestamps: false,
    freezeTableName: true
});

module.exports = Category;
