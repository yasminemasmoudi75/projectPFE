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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Charger les permissions depuis la base de données
  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setDbPermissions([]);
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
          // Fallback: If admin, show all modules
          if (user?.UserRole?.toLowerCase() === 'admin') {
            const allModules = [
              { moduleCode: 1, moduleName: 'Module Utilisateurs', isActive: true, canCreate: true, canEdit: true, canDelete: true },
              { moduleCode: 2, moduleName: 'Module Messages', isActive: true, canCreate: true, canEdit: true, canDelete: true },
              { moduleCode: 3, moduleName: 'Module Projets', isActive: true, canCreate: true, canEdit: true, canDelete: true },
              { moduleCode: 4, moduleName: 'Module Devis', isActive: true, canCreate: true, canEdit: true, canDelete: true },
              { moduleCode: 5, moduleName: 'Module Commande', isActive: true, canCreate: true, canEdit: true, canDelete: true },
              { moduleCode: 6, moduleName: 'Module Livraison', isActive: true, canCreate: true, canEdit: true, canDelete: true },
              { moduleCode: 7, moduleName: 'Module Facture', isActive: true, canCreate: true, canEdit: true, canDelete: true },
              { moduleCode: 8, moduleName: 'Module Calendrier', isActive: true, canCreate: true, canEdit: true, canDelete: true },
              { moduleCode: 30, moduleName: 'Module Client', isActive: true, canCreate: true, canEdit: true, canDelete: true },
              { moduleCode: 31, moduleName: 'Module Reglement', isActive: true, canCreate: true, canEdit: true, canDelete: true },
              { moduleCode: 40, moduleName: 'Module Tournée', isActive: true, canCreate: true, canEdit: true, canDelete: true },
              { moduleCode: 41, moduleName: 'Module Chargement', isActive: true, canCreate: true, canEdit: true, canDelete: true },
              { moduleCode: 42, moduleName: 'Module Objectif', isActive: true, canCreate: true, canEdit: true, canDelete: true },
              { moduleCode: 43, moduleName: 'Module Recap', isActive: true, canCreate: true, canEdit: true, canDelete: true },
              { moduleCode: 44, moduleName: 'Module Relevé', isActive: true, canCreate: true, canEdit: true, canDelete: true },
              { moduleCode: 45, moduleName: 'Module visite', isActive: true, canCreate: true, canEdit: true, canDelete: true },
              { moduleCode: 46, moduleName: 'Stock', isActive: true, canCreate: true, canEdit: true, canDelete: true },
              { moduleCode: 47, moduleName: 'soldeClient', isActive: true, canCreate: true, canEdit: true, canDelete: true },
              { moduleCode: 52, moduleName: 'Maps', isActive: true, canCreate: true, canEdit: true, canDelete: true },
            ];
            setDbPermissions(allModules);
          } else {
            setDbPermissions([]);
          }
        }
      } catch (err) {
        setError(err.message);
        // Fallback for admin on error
        if (user?.UserRole?.toLowerCase() === 'admin') {
          const allModules = [
            { moduleCode: 1, moduleName: 'Module Utilisateurs', isActive: true, canCreate: true, canEdit: true, canDelete: true },
            { moduleCode: 2, moduleName: 'Module Messages', isActive: true, canCreate: true, canEdit: true, canDelete: true },
            { moduleCode: 3, moduleName: 'Module Projets', isActive: true, canCreate: true, canEdit: true, canDelete: true },
            { moduleCode: 4, moduleName: 'Module Devis', isActive: true, canCreate: true, canEdit: true, canDelete: true },
            { moduleCode: 5, moduleName: 'Module Commande', isActive: true, canCreate: true, canEdit: true, canDelete: true },
            { moduleCode: 6, moduleName: 'Module Livraison', isActive: true, canCreate: true, canEdit: true, canDelete: true },
            { moduleCode: 7, moduleName: 'Module Facture', isActive: true, canCreate: true, canEdit: true, canDelete: true },
            { moduleCode: 8, moduleName: 'Module Calendrier', isActive: true, canCreate: true, canEdit: true, canDelete: true },
            { moduleCode: 30, moduleName: 'Module Client', isActive: true, canCreate: true, canEdit: true, canDelete: true },
            { moduleCode: 31, moduleName: 'Module Reglement', isActive: true, canCreate: true, canEdit: true, canDelete: true },
            { moduleCode: 40, moduleName: 'Module Tournée', isActive: true, canCreate: true, canEdit: true, canDelete: true },
            { moduleCode: 41, moduleName: 'Module Chargement', isActive: true, canCreate: true, canEdit: true, canDelete: true },
            { moduleCode: 42, moduleName: 'Module Objectif', isActive: true, canCreate: true, canEdit: true, canDelete: true },
            { moduleCode: 43, moduleName: 'Module Recap', isActive: true, canCreate: true, canEdit: true, canDelete: true },
            { moduleCode: 44, moduleName: 'Module Relevé', isActive: true, canCreate: true, canEdit: true, canDelete: true },
            { moduleCode: 45, moduleName: 'Module visite', isActive: true, canCreate: true, canEdit: true, canDelete: true },
            { moduleCode: 46, moduleName: 'Stock', isActive: true, canCreate: true, canEdit: true, canDelete: true },
            { moduleCode: 47, moduleName: 'soldeClient', isActive: true, canCreate: true, canEdit: true, canDelete: true },
            { moduleCode: 52, moduleName: 'Maps', isActive: true, canCreate: true, canEdit: true, canDelete: true },
          ];
          setDbPermissions(allModules);
        } else {
          setDbPermissions([]);
        }
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

  // Vérifier si l'utilisateur est admin
  const isUserAdmin = useMemo(() => {
    return user?.UserRole?.toLowerCase() === 'admin';
  }, [user?.UserRole]);

  // Obtenir tous les modules actifs
  const activeModules = useMemo(() => {
    return dbPermissions.filter((p) => toBool(p.isActive));
  }, [dbPermissions]);

  return {
    // ✅ Permissions depuis la base de données pour le module courant
    // Mapper les noms de champs BD (canAdd, canEdit, canDelt) vers l'API (canCreate, canEdit, canDelete)
    // Si permissions trouvées: utiliser la BD (même si false)
    // Si permissions non trouvées ET admin: autoriser tout
    // Si permissions non trouvées ET non-admin: interdire tout
    isModuleActive: modulePermissions !== null ? toBool(modulePermissions?.Actif) : isUserAdmin,
    canCreate: modulePermissions !== null ? toBool(modulePermissions?.canAdd || modulePermissions?.canCreate) : isUserAdmin,
    canEdit: modulePermissions !== null ? toBool(modulePermissions?.canEdit) : isUserAdmin,
    canDelete: modulePermissions !== null ? toBool(modulePermissions?.canDelt || modulePermissions?.canDelete) : isUserAdmin,
    canValidate: modulePermissions !== null ? toBool(modulePermissions?.canValid || modulePermissions?.canValidate) : isUserAdmin,
    canExport: modulePermissions !== null ? toBool(modulePermissions?.canExport) : isUserAdmin,

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


