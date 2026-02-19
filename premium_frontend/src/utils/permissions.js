import { MODULE_CODES, ACTION_TYPES, USER_ROLES } from './constants';

/**
 * Vérifie si l'utilisateur a une permission spécifique
 * @param {Object} user - Objet utilisateur avec permissions
 * @param {number} moduleCode - Code du module
 * @param {string} action - Type d'action
 * @returns {boolean} True si l'utilisateur a la permission
 */
export const hasPermission = (user, moduleCode, action) => {
  // Administrateur a tous les droits
  if (user?.UserRole === USER_ROLES.ADMIN) {
    return true;
  }

  // Vérifier dans les permissions de l'utilisateur
  if (!user?.permissions || !Array.isArray(user.permissions)) {
    return false;
  }

  return user.permissions.some(
    (perm) => perm.moduleCode === moduleCode && perm.actions?.includes(action)
  );
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
    if (!item.moduleCode) return true;

    // Vérifier la permission de consultation
    return canView(user, item.moduleCode);
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

  if (Array.isArray(roles)) {
    return roles.includes(user.UserRole);
  }

  return user.UserRole === roles;
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

