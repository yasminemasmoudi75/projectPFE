const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Reclamation = sequelize.define('TabReclamation', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'ID'
    },
    NumTicket: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'NumTicket'
    },
    CodTiers: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'CodTiers'
    },
    LibTiers: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'LibTiers'
    },
    Objet: {
        type: DataTypes.STRING(500),
        allowNull: false,
        field: 'Objet'
    },
    Description: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'Description'
    },
    TypeReclamation: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: 'Technique',
        field: 'TypeReclamation'
    },
    Priorite: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'Moyenne',
        field: 'Priorite'
    },
    Statut: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'Ouvert',
        field: 'Statut'
        // Valeurs: Ouvert | En cours | En attente | Résolu | Fermé
    },
    NomTechnicien: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'NomTechnicien'
    },
    TechnicienID: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'TechnicienID'
    },
    DateOuverture: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
        field: 'DateOuverture'
    },
    DateResolution: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'DateResolution'
    },
    CUser: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'CUser'
    },
    Solution: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'Solution'
    }
}, {
    tableName: 'TabReclamation',
    timestamps: false,
    // Sequelize will create the table if it doesn't exist when sync is called
});

module.exports = Reclamation;
