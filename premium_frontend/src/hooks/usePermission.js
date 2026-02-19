import { useMemo } from 'react';
import useAuth from './useAuth';
import {
  hasPermission,
  canView,
  canCreate,
  canEdit,
  canDelete,
  canValidate,
  canExport,
  getModulePermissions,
  hasRole,
  isAdmin,
} from '../utils/permissions';

/**
 * Hook personnalisé pour gérer les permissions RBAC
 * @param {number} moduleCode - Code du module (optionnel)
 * @returns {Object} Fonctions et permissions
 */
const usePermission = (moduleCode = null) => {
  const { user } = useAuth();

  // Calculer les permissions pour le module spécifié
  const modulePermissions = useMemo(() => {
    if (!moduleCode) return null;
    return getModulePermissions(user, moduleCode);
  }, [user, moduleCode]);

  return {
    // Permissions pour le module spécifié
    ...modulePermissions,

    // Fonctions génériques
    hasPermission: (code, action) => hasPermission(user, code, action),
    canView: (code) => canView(user, code || moduleCode),
    canCreate: (code) => canCreate(user, code || moduleCode),
    canEdit: (code) => canEdit(user, code || moduleCode),
    canDelete: (code) => canDelete(user, code || moduleCode),
    canValidate: (code) => canValidate(user, code || moduleCode),
    canExport: (code) => canExport(user, code || moduleCode),

    // Vérification de rôles
    hasRole: (roles) => hasRole(user, roles),
    isAdmin: () => isAdmin(user),

    // Utilisateur
    user,
  };
};

export default usePermission;

