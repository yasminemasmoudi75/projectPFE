/**
 * Custom Hook React: Permissions Dynamiques
 * Charge les permissions depuis le backend et les rend réactives
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import useAuth from './useAuth';
import axios from '../app/axios';

const usePermissions = () => {
  const { user, accessToken, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cache, setCache] = useState({});

  /**
   * Charger les permissions depuis le backend
   */
  const loadPermissions = useCallback(async () => {
    if (!isAuthenticated || !accessToken) return;

    // Vérifier le cache (5 minutes)
    const cacheKey = `permissions_${user?.UserID}`;
    const cached = cache[cacheKey];
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      setPermissions(cached.data);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/permissions/my-permissions');
      
      const permData = response?.data?.data || response?.data || [];
      
      if (permData.length > 0) {
        const formatted = formatPermissions(permData);
        setPermissions(formatted);
        
        // Mettre en cache
        setCache(prev => ({
          ...prev,
          [cacheKey]: {
            data: formatted,
            timestamp: Date.now(),
          },
        }));
      }
    } catch (err) {
      setError(err.message);
      console.error('Erreur chargement permissions:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, accessToken, user?.UserID, cache]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  /**
   * Formater les données de permissions
   */
  const formatPermissions = (rawData) => {
    const modules = {};
    const modulesByCode = {};

    rawData.forEach(row => {
      if (row.moduleCode || row.CodMod) {
        const code = row.moduleCode || row.CodMod;
        modules[code] = {
          codMod: code,
          name: row.moduleName || row.LibMod,
          isActive: row.isActive ?? (row.Actif === 1),
          actions: {
            view: row.isActive ?? (row.Actif === 1),
            create: !!row.canAdd || !!row.canCreate,
            edit: !!row.canEdit,
            delete: !!row.canDelt || !!row.canDelete,
            validate: !!row.canValid || !!row.canValidate,
            export: !!row.canPDF || !!row.canExport,
            import: !!row.CanImp,
          },
          filters: {
            byRepresentative: row.FiltreRepres === 1,
            byWarehouse: row.FiltreMag === 1,
            byDriver: row.FiltreChauffeur === 1,
          },
          features: {
            stockControl: row.CtrlStk === 1,
            showCredit: row.CanShowCredit === 1,
            photos: row.CanPhoto === 1,
            statisticsBL: row.CanStatBL === 1,
            statisticsBC: row.CanStatBC === 1,
          },
        };
        modulesByCode[row.moduleName || row.LibMod] = code;
      }
    });

    return { modules, modulesByCode };
  };

  /**
   * Vérifier si un module est accessible
   */
  const canViewModule = useCallback(
    (codMod) => {
      const mod = permissions?.modules?.[codMod];
      return mod?.isActive === true;
    },
    [permissions]
  );

  /**
   * Vérifier une action spécifique sur un module
   */
  const canPerformAction = useCallback(
    (codMod, action = 'view') => {
      const mod = permissions?.modules?.[codMod];
      if (!mod?.isActive) return false;
      return mod.actions?.[action] === true;
    },
    [permissions]
  );

  /**
   * Vérifier si l'utilisateur est filtré par représentant
   */
  const isFilteredByRepresentative = useCallback(
    (codMod) => {
      return permissions?.modules?.[codMod]?.filters?.byRepresentative === true;
    },
    [permissions]
  );

  /**
   * Obtenir tous les modules actifs
   */
  const getActiveModules = useMemo(() => {
    if (!permissions?.modules) return [];
    return Object.values(permissions.modules).filter(m => m.isActive);
  }, [permissions]);

  /**
   * Vérifier si on peut afficher un bouton
   */
  const canShowButton = useCallback(
    (codMod, action) => {
      return canPerformAction(codMod, action);
    },
    [canPerformAction]
  );

  /**
   * Appliquer les filtres pour une requête API
   */
  const buildFilters = useCallback(
    (codMod, baseFilters = {}) => {
      const mod = permissions?.modules?.[codMod];
      const filters = { ...baseFilters };

      if (mod?.filters?.byRepresentative) {
        filters.representativeId = user?.commercialId;
      }
      if (mod?.filters?.byWarehouse) {
        filters.warehouseId = user?.warehouseId;
      }
      if (mod?.filters?.byDriver) {
        filters.driverId = user?.UserID;
      }

      return filters;
    },
    [permissions, user]
  );

  return {
    // État
    permissions,
    loading,
    error,
    
    // Modules et actions
    getActiveModules,
    canViewModule,
    canPerformAction,
    canShowButton,
    
    // Filtres
    isFilteredByRepresentative,
    buildFilters,
    
    // Utilitaires
    refresh: loadPermissions,
  };
};

export default usePermissions;
