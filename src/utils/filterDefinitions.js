/**
 * filterDefinitions.js
 * Définition centralisée des filtres de l'application
 * Utilisé par filterService et filterConfigService
 */

const MODULE_MAPPING = {
    'STOCK': 12,
    'RECLAMATION': 47,
    'DEVIS': 31,
    'BCV': 3,
    'BLV': 6,
    'FAV': 5
};

const FILTER_DEFINITIONS = {
    'STOCK': [
        { key: 'all', label: 'Tous', field: 'Qte', operator: 'gte', value: '-1', hideForClient: false },
        { key: 'ok', label: 'Dispo', field: 'Qte', operator: 'gt', value: '5', hideForClient: false },
        { key: 'low', label: 'Faible', field: 'Qte', operator: 'between', value: '1,5', hideForClient: true },
        { key: 'rupture', label: 'Rupture', field: 'Qte', operator: 'equals', value: '0', hideForClient: false }
    ],
    'RECLAMATION': [
        { key: 'status_open', label: 'Ouvert', field: 'Statut', operator: 'equals', value: 'Ouvert', hideForClient: false },
        { key: 'status_progress', label: 'En cours', field: 'Statut', operator: 'equals', value: 'En cours', hideForClient: false },
        { key: 'status_resolved', label: 'Résolu', field: 'Statut', operator: 'equals', value: 'Résolu', hideForClient: false },
        { key: 'priority_urgent', label: 'Urgent', field: 'Priorite', operator: 'equals', value: 'Urgent', hideForClient: true }
    ],
    'DEVIS': [
        { key: 'status_draft', label: 'Brouillon', field: 'Valid', operator: 'equals', value: '0', hideForClient: true },
        { key: 'status_valid', label: 'Validé', field: 'Valid', operator: 'equals', value: '1', hideForClient: false },
        { key: 'status_converted', label: 'Converti', field: 'bTransf', operator: 'equals', value: '1', hideForClient: false }
    ],
    'BCV': [
        { key: 'status_draft', label: 'Brouillon', field: 'Valid', operator: 'equals', value: '0', hideForClient: true },
        { key: 'status_valid', label: 'Validé', field: 'Valid', operator: 'equals', value: '1', hideForClient: false },
        { key: 'status_converted', label: 'Livré', field: 'bLivr', operator: 'equals', value: '1', hideForClient: false }
    ],
    'BLV': [
        { key: 'status_valid', label: 'Validé', field: 'Valid', operator: 'equals', value: '1', hideForClient: false },
        { key: 'status_converted', label: 'Transféré', field: 'bTransf', operator: 'equals', value: '1', hideForClient: false }
    ],
    'FAV': [
        { key: 'status_valid', label: 'Validée', field: 'Valid', operator: 'equals', value: '1', hideForClient: false },
        { key: 'status_converted', label: 'Convertie', field: 'bTransf', operator: 'equals', value: '1', hideForClient: false }
    ]
};

module.exports = {
    MODULE_MAPPING,
    FILTER_DEFINITIONS
};
