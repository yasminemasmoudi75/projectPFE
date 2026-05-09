const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BcvDetail = sequelize.define('TabBcvd', {
    Guid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        field: 'Guid'
    },
    NoDetail: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'NoDetail'
    },
    ID: {
        type: DataTypes.STRING(30),
        field: 'ID'
    },
    NF: {
        type: DataTypes.INTEGER,
        field: 'NF'
    },
    CodArt: {
        type: DataTypes.STRING(30),
        allowNull: false,
        field: 'CodArt'
    },
    LibArt: {
        type: DataTypes.STRING(255),
        field: 'LibArt'
    },
    ExLibArt: {
        type: DataTypes.STRING(255),
        field: 'ExLibArt'
    },
    IDArt: {
        type: DataTypes.STRING(50),
        field: 'IDArt'
    },
    Qt: {
        type: DataTypes.FLOAT,
        field: 'Qt'
    },
    PuHT: {
        type: DataTypes.FLOAT,
        field: 'PuHT'
    },
    PuTTC: {
        type: DataTypes.FLOAT,
        field: 'PuTTC'
    },
    PvPub: {
        type: DataTypes.FLOAT,
        field: 'PvPub'
    },
    PuDev: {
        type: DataTypes.FLOAT,
        field: 'PuDev'
    },
    /* 
    Tva: {
        type: DataTypes.FLOAT,
        field: 'Tva'
    },
    */
    // ✅ Note: La colonne 'Tva' n'existe pas dans TabBcvd. 
    // Le montant de la TVA est stocké dans 'MntTVA'.

    MntRem: {
        type: DataTypes.FLOAT,
        field: 'MntRem'
    },
    MntTVA: {
        type: DataTypes.FLOAT,
        field: 'MntTVA'
    },
    MntHT: {
        type: DataTypes.FLOAT,
        field: 'MntHT'
        // ✅ Note: Colonne calculée dans la DB. Ne pas envoyer lors de l'INSERT/UPDATE.
    },

    MntFodec: {
        type: DataTypes.FLOAT,
        field: 'MntFodec'
    },
    MntFrais: {
        type: DataTypes.FLOAT,
        field: 'MntFrais'
    },
    CodColor: {
        type: DataTypes.STRING(30),
        field: 'CodColor'
    },
    DesColor: {
        type: DataTypes.STRING(100),
        field: 'DesColor'
    },
    CodTaille: {
        type: DataTypes.STRING(30),
        field: 'CodTaille'
    },
    Taille: {
        type: DataTypes.STRING(100),
        field: 'Taille'
    },
    NumBL: {
        type: DataTypes.STRING(30),
        field: 'NumBL'
    },
    DateBL: {
        type: DataTypes.DATE,
        field: 'DateBL'
    },
    Codabar: {
        type: DataTypes.STRING(50),
        field: 'Codabar'
    },
    NumImport: {
        type: DataTypes.STRING(50),
        field: 'NumImport'
    },
    DatImport: {
        type: DataTypes.DATE,
        field: 'DatImport'
    }
}, {
    tableName: 'TabBcvd',
    timestamps: false,
    freezeTableName: true,
    hooks: {
        beforeCreate: (record) => {
            delete record.MntHT;
            delete record.Tva;
        },
        beforeUpdate: (record) => {
            delete record.MntHT;
            delete record.Tva;
        },
        beforeBulkCreate: (records) => {
            records.forEach(record => {
                delete record.MntHT;
                delete record.Tva;
            });
        }
    }
});


module.exports = BcvDetail;
