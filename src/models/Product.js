const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
    IDArt: {
        type: DataTypes.UUID,
        primaryKey: true,
        field: 'IDArt'
    },
    CodArt: {
        type: DataTypes.STRING,
        field: 'CodArt'
    },
    LibArt: {
        type: DataTypes.STRING,
        field: 'LibArt'
    },
    Libelle: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.getDataValue('LibArt');
        },
        set(value) {
            this.setDataValue('LibArt', value);
        }
    },
    Description: {
        type: DataTypes.TEXT,
        field: 'ExLibArt'
    },
    PrixVente: {
        type: DataTypes.FLOAT,
        field: 'PrixVente'
    },
    PrixAchat: {
        type: DataTypes.FLOAT,
        field: 'PrixAvhat'
    },
    Qte: {
        type: DataTypes.FLOAT,
        field: 'Qte'
    },
    Collection: {
        type: DataTypes.STRING,
        field: 'Collection'
    },
    Marque: {
        type: DataTypes.STRING,
        field: 'Marque'
    },
    urlimg: {
        type: DataTypes.STRING,
        field: 'urlimg'
    },
    DateUser: {
        type: DataTypes.DATE,
        field: 'DateUser'
    },
    LastDateUpdate: {
        type: DataTypes.DATE,
        field: 'LastDateUpdate'
    },
    DateUpdate: {
        type: DataTypes.DATE,
        field: 'DateUpdate'
    },
    Tva: {
        type: DataTypes.FLOAT,
        field: 'Tva'
    },
    Unite: {
        type: DataTypes.STRING,
        field: 'Unite'
    }
}, {
    tableName: 'TabStock',
    timestamps: false,
    freezeTableName: true
});

module.exports = Product;
