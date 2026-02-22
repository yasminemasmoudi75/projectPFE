const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
    IDArt: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    CodArt: {
        type: DataTypes.STRING,
        allowNull: false
    },
    LibArt: {
        type: DataTypes.STRING,
        allowNull: true
    },
    Description: {
        type: DataTypes.TEXT,
        field: 'ExLibArt',
        allowNull: true
    },
    PrixVente: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        allowNull: true
    },
    PrixAchat: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        allowNull: true,
        field: 'PrixAvhat'
    },
    Qte: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: true
    },
    Collection: {
        type: DataTypes.STRING,
        allowNull: true
    },
    Marque: {
        type: DataTypes.STRING,
        allowNull: true
    },
    imgArt: {
        type: DataTypes.BLOB('image'),
        allowNull: true
    },
    urlimg: {
        type: DataTypes.STRING,
        allowNull: true
    },
    Tva: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        allowNull: true
    },
    Unite: {
        type: DataTypes.STRING,
        defaultValue: 'UNI',
        allowNull: true
    }
}, {
    tableName: 'TabStock',
    timestamps: false,
    defaultScope: {
        attributes: { exclude: ['imgArt'] }
    }
});

module.exports = Product;
