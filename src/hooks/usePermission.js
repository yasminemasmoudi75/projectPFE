import { useMemo, useEffect, useState } from 'react';
import useAuth from './useAuth';
import axios from '../app/axios';
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

const toBool = (value) => value === true || value === 1 || value === '1';

/**
 * Hook personnalisé pour gérer les permissions RBAC
 * Charge les permissions depuis la base de données via l'API
 * @param {number} moduleCode - Code du module (optionnel)
 * @returns {Object} Fonctions et permissions
 */
const usePermission = (moduleCode = null) => {
  const { user, accessToken, isAuthenticated } = useAuth();
  const [dbPermissions, setDbPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Charger les permissions depuis la base de données
  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setDbPermissions([]);
      setLoading(false);
      return;
    }

    const loadPermissions = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get('/permissions/my-permissions');

        // Axios interceptor returns response.data directly
        // Backend response structure: { status: "success", data: { permissions: [...] } }
        // So response = { status: "success", data: { permissions: [...] } }
        let permissions = [];

        // Path 1: response.data.permissions (standard path after interceptor)
        if (response?.data?.permissions && Array.isArray(response.data.permissions)) {
          permissions = response.data.permissions;
        }
        // Path 2: response.permissions (fallback if interceptor doesn't wrap)
        else if (response?.permissions && Array.isArray(response.permissions)) {
          permissions = response.permissions;
        }
        // Path 3: Direct array
        else if (Array.isArray(response)) {
          permissions = response;
        }
        
        if (permissions.length > 0) {
          setDbPermissions(permissions);
        } else {
          setDbPermissions([]);
        }
      } catch (err) {
        setError(err.message);
        setDbPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [accessToken, isAuthenticated, user?.UserRole]);

  // Obtenir les permissions pour le module spécifié
  const modulePermissions = useMemo(() => {
    if (moduleCode == null || !dbPermissions.length) return null;

    const targetCode = Number(moduleCode);
    return dbPermissions.find((permission) => Number(permission.moduleCode) === targetCode) || null;
  }, [moduleCode, dbPermissions]);

  // Obtenir tous les modules actifs
  const activeModules = useMemo(() => {
    return dbPermissions.filter((p) => toBool(p.isActive));
  }, [dbPermissions]);

  return {
    // Permissions strictement pilotées par la base de données.
    // Si une permission module est absente, l'accès est refusé par défaut.
    isModuleActive: modulePermissions !== null
      ? toBool(modulePermissions?.isActive ?? modulePermissions?.Actif)
      : false,
    isFilterRepresEnabled: modulePermissions !== null
      ? toBool(modulePermissions?.filterRepres ?? modulePermissions?.FiltreRepres)
      : false,
    canCreate: modulePermissions !== null
      ? toBool(modulePermissions?.canCreate ?? modulePermissions?.canAdd)
      : false,
    canEdit: modulePermissions !== null
      ? toBool(modulePermissions?.canEdit)
      : false,
    canDelete: modulePermissions !== null
      ? toBool(modulePermissions?.canDelete ?? modulePermissions?.canDelt)
      : false,
    canValidate: modulePermissions !== null
      ? toBool(modulePermissions?.canValidate ?? modulePermissions?.canValid)
      : false,
    canExport: modulePermissions !== null
      ? toBool(modulePermissions?.canExport)
      : false,

    // Tous les modules
    allPermissions: dbPermissions,
    activeModules: activeModules,
    
    // Autres fonctions
    hasPermission: (code, action) => hasPermission(user, code, action),
    hasRole: (roles) => hasRole(user, roles),
    isAdmin: () => isAdmin(user),

    // Info utilisateur
    user,
    loading,
    error,
  };
};

export default usePermission;


