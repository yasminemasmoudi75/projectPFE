// ===========================
// RÔLES UTILISATEURS
// ===========================
export const USER_ROLES = {
  ADMIN: 'Admin',
  COMMERCIAL: 'Commercial',
  AGENT: 'Agent',
  TECHNICIEN: 'Technicien',
  CLIENT: 'Client',
};

// ===========================
// STATUTS DEVIS
// ===========================
export const DEVIS_STATUS = {
  BROUILLON: 'Brouillon',
  ENVOYE: 'Envoyé',
  ACCEPTE: 'Accepté',
  REFUSE: 'Refusé',
  EXPIRE: 'Expiré',
};

// ===========================
// STATUTS PROJETS
// ===========================
export const PROJET_STATUS = {
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
  EN_ATTENTE: 'En attente',
};

// ===========================
// PHASES PROJETS
// ===========================
export const PROJET_PHASES = {
  PROSPECTION: 'Prospection',
  NEGOCIATION: 'Négociation',
  EXECUTION: 'Exécution',
  CLOTURE: 'Clôture',
};

// ===========================
// PRIORITÉS
// ===========================
export const PRIORITIES = {
  BASSE: 'Basse',
  MOYENNE: 'Moyenne',
  HAUTE: 'Haute',
  URGENTE: 'Urgente',
};

// ===========================
// TYPES D'ACTIVITÉS
// ===========================
export const ACTIVITY_TYPES = {
  APPEL: 'Appel',
  EMAIL: 'Email',
  REUNION: 'Réunion',
  VISITE: 'Visite',
  TACHE: 'Tâche',
  NOTE: 'Note',
};

// ===========================
// STATUTS ACTIVITÉS
// ===========================
export const ACTIVITY_STATUS = {
  PLANIFIE: 'Planifié',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
};

// ===========================
// TYPES DE MESSAGES
// ===========================
export const MESSAGE_TYPES = {
  INTERNE: 'Interne',
  NOTIFICATION: 'Notification',
  ALERTE: 'Alerte',
};

// ===========================
// CODES MODULES (pour permissions)
// ===========================
export const MODULE_CODES = {
  DASHBOARD: 1,
  CLIENTS: 10,
  CONTACTS: 11,
  DEVIS: 20,
  COMMANDES: 21,
  FACTURES: 22,
  PROJETS: 30,
  ACTIVITES: 31,
  OBJECTIFS: 32,
  STOCK: 40,
  SAV: 50,
  MESSAGES: 60,
  IA: 70,
  USERS: 80,
  SETTINGS: 90,
};

// ===========================
// TYPES D'ACTIONS (pour permissions)
// ===========================
export const ACTION_TYPES = {
  VIEW: 'Consulter',
  CREATE: 'Créer',
  EDIT: 'Modifier',
  DELETE: 'Supprimer',
  VALIDATE: 'Valider',
  EXPORT: 'Exporter',
};

// ===========================
// COULEURS PAR STATUT
// ===========================
export const STATUS_COLORS = {
  // Devis
  Brouillon: 'gray',
  Envoyé: 'blue',
  Accepté: 'green',
  Refusé: 'red',
  Expiré: 'orange',

  // Projets
  'En cours': 'blue',
  Terminé: 'green',
  Annulé: 'red',
  'En attente': 'yellow',

  // Activités
  Planifié: 'blue',
  Terminé: 'green',

  // Priorités
  Basse: 'gray',
  Moyenne: 'yellow',
  Haute: 'orange',
  Urgente: 'red',
};

// ===========================
// PAGINATION
// ===========================
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMITS: [10, 25, 50, 100],
};

// ===========================
// FORMATS
// ===========================
export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';

// ===========================
// VALIDATION
// ===========================
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^(\+216)?[0-9]{8}$/,
};

