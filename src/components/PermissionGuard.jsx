import React from 'react';
import usePermission from '../hooks/usePermission';

/**
 * Composant Helper pour conditionner l'affichage selon les permissions.
 *
 * @param {number} moduleCode Le code du module (ex: MODULE_CODES.CLIENTS)
 * @param {string} action Action requise: 'create', 'edit', 'delete', ou 'view' (actif)
 * @param {ReactNode} children Le composant (Bouton, Lien, etc.) à afficher s'il a les droits
 * @param {ReactNode} fallback Composant de repli optionnel si pas de droits
 */
const PermissionGuard = ({ moduleCode, action, children, fallback = null }) => {
  const { 
    isModuleActive, 
    canCreate, 
    canEdit, 
    canDelete, 
    canValidate, 
    canExport, 
    isUserAdmin 
  } = usePermission(moduleCode);

  // Default is true if it's Admin (handled in hook) or if the specific check passes
  let hasAccess = false;

  // L'accès de base passe par est-ce que le module est actif?
  if (!isModuleActive) {
      return fallback;
  }

  // Vérifier l'action spécifique
  switch (action) {
    case 'create':
    case 'add':
      hasAccess = canCreate;
      break;
    case 'edit':
    case 'update':
      hasAccess = canEdit;
      break;
    case 'delete':
    case 'remove':
      hasAccess = canDelete;
      break;
    case 'validate':
      hasAccess = canValidate;
      break;
    case 'export':
      hasAccess = canExport;
      break;
    case 'view':
    default:
      hasAccess = true; // Déjà vérifié isModuleActive
      break;
  }

  return hasAccess ? <>{children}</> : fallback;
};

export default PermissionGuard;