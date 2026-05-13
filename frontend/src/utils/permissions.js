import { MODULE_CODES, ACTION_TYPES, USER_ROLES } from './constants';

const normalizeRole = (role) => (role || '').toString().trim().toLowerCase();

/**
 * ✅ MATRICE FALLBACK: Rôles et Modules Accessibles
 * 
 * Utilisée quand l'API de permissions du backend ne répond pas
 * Correspond à la table TabAWProfileAccess de la base de données
 * 
 * ADMIN: Tous les modules (sauf modules vides: 8, 40, 43, 44)
 * COMMERCIAL: 11 modules (Ventes + Stock)
 * AGENT: Même que Commercial (11 modules)
 * TECHNICIEN: 5 modules (Support spécialisé)
 * CLIENT: 5 modules (Lecture seule + SAV personnel)
 */
const ROLE_MODULE_FALLBACK = {
  admin: [
    // Module codes from TabAWProfileAccess (1-52)
    MODULE_CODES.USERS,        // 1 - Utilisateurs
    MODULE_CODES.MESSAGES,     // 2 - Messages
    MODULE_CODES.PROJETS,      // 3 - Projets
    MODULE_CODES.DEVIS,        // 4 - Devis
    MODULE_CODES.COMMANDES,    // 5 - BCV/Commandes
    MODULE_CODES.LIVRAISONS,   // 6 - BLV/Livraisons
    MODULE_CODES.FACTURES,     // 7 - FAV/Factures
    // MODULE_CODES.CALENDRIER,    // 8 - VIDE (non-implémenté)
    MODULE_CODES.CLIENTS,      // 30 - Clients
    MODULE_CODES.REGLEMENT,    // 31 - SAV/Réclamations
    MODULE_CODES.MENU,         // 32 - Menu
    // MODULE_CODES.TOURNEE,       // 40 - VIDE (non-implémenté)
    MODULE_CODES.CHARGEMENT,   // 41 - Activités/Chargement
    MODULE_CODES.OBJECTIFS,    // 42 - Objectifs
    // MODULE_CODES.RECAP,         // 43 - VIDE (non-implémenté)
    // MODULE_CODES.RELEVE,        // 44 - VIDE (non-implémenté)
    MODULE_CODES.VISITES,      // 45 - Visites
    MODULE_CODES.STOCK,        // 46 - Stock
    MODULE_CODES.SOLDE_CLIENT, // 47 - Solde Client
    MODULE_CODES.MAPS,         // 52 - Maps
  ],
  
  commercial: [
    // 11 modules: Ventes + Clients + Stock
    // ✅ Avec filtrage FiltreRepres (voir leurs propres données)
    MODULE_CODES.MESSAGES,     // 2 - Messages
    MODULE_CODES.PROJETS,      // 3 - Projets  
    MODULE_CODES.DEVIS,        // 4 - Devis ⭐ (filtré)
    MODULE_CODES.COMMANDES,    // 5 - BCV ⭐ (filtré)
    MODULE_CODES.LIVRAISONS,   // 6 - BLV ⭐ (filtré)
    MODULE_CODES.FACTURES,     // 7 - FAV ⭐ (filtré)
    MODULE_CODES.CLIENTS,      // 30 - Clients ⭐ (filtré)
    MODULE_CODES.CHARGEMENT,   // 41 - Activités
    MODULE_CODES.OBJECTIFS,    // 42 - Objectifs
    MODULE_CODES.VISITES,      // 45 - Visites
    MODULE_CODES.STOCK,        // 46 - Stock ⭐ (limité)
  ],
  
  agent: [
    // MÊME que Commercial (11 modules)
    MODULE_CODES.MESSAGES,     // 2 - Messages
    MODULE_CODES.PROJETS,      // 3 - Projets
    MODULE_CODES.DEVIS,        // 4 - Devis ⭐ (filtré)
    MODULE_CODES.COMMANDES,    // 5 - BCV ⭐ (filtré)
    MODULE_CODES.LIVRAISONS,   // 6 - BLV ⭐ (filtré)
    MODULE_CODES.FACTURES,     // 7 - FAV ⭐ (filtré)
    MODULE_CODES.CLIENTS,      // 30 - Clients ⭐ (filtré)
    MODULE_CODES.CHARGEMENT,   // 41 - Activités
    MODULE_CODES.OBJECTIFS,    // 42 - Objectifs
    MODULE_CODES.VISITES,      // 45 - Visites
    MODULE_CODES.STOCK,        // 46 - Stock ⭐ (limité)
  ],
  
  technicien: [
    // 5 modules: Support spécialisé
    MODULE_CODES.MESSAGES,     // 2 - Messages
    MODULE_CODES.CHARGEMENT,   // 41 - Activités
    MODULE_CODES.REGLEMENT,    // 31 - SAV/Réclamations (gestion complète)
    MODULE_CODES.STOCK,        // 46 - Stock (lecture)
    MODULE_CODES.VISITES,      // 45 - Visites
  ],
  
  client: [
    // 5 modules: Lecture seule + SAV personnel
    MODULE_CODES.MESSAGES,     // 2 - Messages
    MODULE_CODES.DEVIS,        // 4 - Devis personnel
    MODULE_CODES.FACTURES,     // 7 - Factures personnelles
    MODULE_CODES.REGLEMENT,    // 31 - SAV personnel (création uniquement)
    MODULE_CODES.PROJETS,      // 3 - Projets (lecture)
  ],
};

/**
 * Vérifie si l'utilisateur a une permission spécifique
 * @param {Object} user - Objet utilisateur avec permissions
 * @param {number} moduleCode - Code du module
 * @param {string} action - Type d'action
 * @returns {boolean} True si l'utilisateur a la permission
 */
export const hasPermission = (user, moduleCode, action) => {
  const normalizedRole = normalizeRole(user?.UserRole);

  // ✨ MODIFICATION: Admin respecte AUSSI les permissions (pas de bypass)
  // Ancien code (supprimé):
  // if (normalizedRole === normalizeRole(USER_ROLES.ADMIN)) {
  //   return true;
  // }

  // Vérifier dans les permissions de l'utilisateur
  if (user?.permissions && Array.isArray(user.permissions)) {
    return user.permissions.some(
      (perm) => perm.moduleCode === moduleCode && perm.actions?.includes(action)
    );
  }

  // Fallback par rôle (quand le backend ne renvoie pas user.permissions)
  const allowedModules = ROLE_MODULE_FALLBACK[normalizedRole] || [];
  if (!allowedModules.includes(moduleCode)) {
    return false;
  }

  if (action === ACTION_TYPES.VIEW) return true;

  // Règle simple CRUD par rôle sur fallback UI
  if (normalizedRole === 'commercial' || normalizedRole === 'agent') {
    return [ACTION_TYPES.CREATE, ACTION_TYPES.EDIT].includes(action);
  }
  if (normalizedRole === 'technicien') {
    return action === ACTION_TYPES.EDIT;
  }
  if (normalizedRole === 'client') {
    return action === ACTION_TYPES.CREATE;
  }

  return false;
};


/**
 * Vérifie si l'utilisateur peut consulter un module
 * @param {Object} user - Objet utilisateur
 * @param {number} moduleCode - Code du module
 * @returns {boolean}
 */
export const canView = (user, moduleCode) => {
  return hasPermission(user, moduleCode, ACTION_TYPES.VIEW);
};

/**
 * Vérifie si l'utilisateur peut créer dans un module
 * @param {Object} user - Objet utilisateur
 * @param {number} moduleCode - Code du module
 * @returns {boolean}
 */
export const canCreate = (user, moduleCode) => {
  return hasPermission(user, moduleCode, ACTION_TYPES.CREATE);
};

/**
 * Vérifie si l'utilisateur peut modifier dans un module
 * @param {Object} user - Objet utilisateur
 * @param {number} moduleCode - Code du module
 * @returns {boolean}
 */
export const canEdit = (user, moduleCode) => {
  return hasPermission(user, moduleCode, ACTION_TYPES.EDIT);
};

/**
 * Vérifie si l'utilisateur peut supprimer dans un module
 * @param {Object} user - Objet utilisateur
 * @param {number} moduleCode - Code du module
 * @returns {boolean}
 */
export const canDelete = (user, moduleCode) => {
  return hasPermission(user, moduleCode, ACTION_TYPES.DELETE);
};

/**
 * Vérifie si l'utilisateur peut valider dans un module
 * @param {Object} user - Objet utilisateur
 * @param {number} moduleCode - Code du module
 * @returns {boolean}
 */
export const canValidate = (user, moduleCode) => {
  return hasPermission(user, moduleCode, ACTION_TYPES.VALIDATE);
};

/**
 * Vérifie si l'utilisateur peut exporter depuis un module
 * @param {Object} user - Objet utilisateur
 * @param {number} moduleCode - Code du module
 * @returns {boolean}
 */
export const canExport = (user, moduleCode) => {
  return hasPermission(user, moduleCode, ACTION_TYPES.EXPORT);
};

/**
 * Filtre les éléments de menu selon les permissions
 * @param {Array} menuItems - Éléments de menu
 * @param {Object} user - Objet utilisateur
 * @returns {Array} Éléments de menu filtrés
 */
export const filterMenuByPermissions = (menuItems, user) => {
  if (!user) return [];

  return menuItems.filter((item) => {
    // Si pas de moduleCode, l'élément est toujours visible
    if (item.moduleCode == null) return true;

    // Vérifier la permission de consultation
    return canView(user, Number(item.moduleCode));
  });
};

/**
 * Obtient toutes les permissions d'un utilisateur pour un module
 * @param {Object} user - Objet utilisateur
 * @param {number} moduleCode - Code du module
 * @returns {Object} Objet avec les permissions booléennes
 */
export const getModulePermissions = (user, moduleCode) => {
  return {
    canView: canView(user, moduleCode),
    canCreate: canCreate(user, moduleCode),
    canEdit: canEdit(user, moduleCode),
    canDelete: canDelete(user, moduleCode),
    canValidate: canValidate(user, moduleCode),
    canExport: canExport(user, moduleCode),
  };
};

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 * @param {Object} user - Objet utilisateur
 * @param {string|Array} roles - Rôle(s) à vérifier
 * @returns {boolean}
 */
export const hasRole = (user, roles) => {
  if (!user?.UserRole) return false;
  const currentRole = normalizeRole(user.UserRole);

  if (Array.isArray(roles)) {
    return roles.some((role) => normalizeRole(role) === currentRole);
  }

  return normalizeRole(roles) === currentRole;
};

/**
 * Vérifie si l'utilisateur est administrateur
 * @param {Object} user - Objet utilisateur
 * @returns {boolean}
 */
export const isAdmin = (user) => {
  return hasRole(user, USER_ROLES.ADMIN);
};

/**
 * Vérifie si l'utilisateur est commercial
 * @param {Object} user - Objet utilisateur
 * @returns {boolean}
 */
export const isCommercial = (user) => {
  return hasRole(user, USER_ROLES.COMMERCIAL);
};

/**
 * Vérifie si l'utilisateur est technicien
 * @param {Object} user - Objet utilisateur
 * @returns {boolean}
 */
export const isTechnicien = (user) => {
  return hasRole(user, USER_ROLES.TECHNICIEN);
};

