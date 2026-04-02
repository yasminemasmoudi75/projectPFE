const { DataTypes, fn, col } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Model MvtDocs - Liaison avec la table existante MvtDocs
 * Table qui enregistre tous les mouvements/transformations de documents
 * Devis → BCV → BLV/FAV
 * 
 * ✅ Utilise la table réelle: dbo.MvtDocs (15 colonnes)
 */
const Mouvement = sequelize.define(
    'MvtDocs',
    {
        ID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        MDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: fn('GETDATE'),
            comment: 'Date/heure du mouvement'
        },
        NF: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Numéro du document'
        },
        CodTiers: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Code du tiers/client'
        },
        LibTiers: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'Libellé du tiers/client'
        },
        Document: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Type de document: DEV, BCV, BLV, FAV'
        },
        TotHT: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: 'Total HT au moment du mouvement'
        },
        TotRem: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: 'Total remise'
        },
        TotFodec: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: 'Total FODEC'
        },
        TotTva: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: 'Montant TVA au moment du mouvement'
        },
        TotTTC: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: 'Total TTC au moment du mouvement'
        },
        Debit: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: 'Montant débit'
        },
        Credit: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: 'Montant crédit'
        },
        Rest: {
            type: DataTypes.FLOAT,
            allowNull: true,
            readOnly: true,  // ✅ Colonne calculée - SQL Server calcule automatiquement
            comment: 'Montant restant (calculé)'
        },
        Flags: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Flags pour état du mouvement'
        },
        UserId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'ID de l\'utilisateur qui a effectué l\'action'
        }
    },
    {
        tableName: 'MvtDocs',
        timestamps: false
    }
);

module.exports = Mouvement;
