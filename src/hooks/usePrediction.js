/**
 * CUSTOM HOOK - usePrediction
 * ===========================
 * Hook pour gérer les prédictions ML
 */

import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useCallback } from 'react';
import {
  predictRegion,
  predictBatch,
  predictAllRegions,
  fetchRegions,
  fetchStats,
  checkServiceHealth,
  setRegionFilter,
  setTrimestreFilter,
  setYearFilter,
  clearError,
  selectPredictions,
  selectCurrentPrediction,
  selectRegions,
  selectStats,
  selectLoading,
  selectError,
  selectErrorMessage,
  selectFilters,
  selectServiceHealth,
} from '../sales/predictionSlice';

/**
 * Hook principal pour les prédictions
 * @returns {Object} Fonctions et état pour les prédictions
 */
export const usePrediction = () => {
  const dispatch = useDispatch();

  // Selectors
  const predictions = useSelector(selectPredictions);
  const currentPrediction = useSelector(selectCurrentPrediction);
  const regions = useSelector(selectRegions);
  const stats = useSelector(selectStats);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const errorMessage = useSelector(selectErrorMessage);
  const filters = useSelector(selectFilters);
  const serviceHealth = useSelector(selectServiceHealth);

  // Initialize on mount
  useEffect(() => {
    dispatch(checkServiceHealth());
    dispatch(fetchRegions());
  }, [dispatch]);

  // Callback functions
  const predictOne = useCallback(
    async (region, trimestre, year) => {
      return dispatch(predictRegion({ region, trimestre, year }));
    },
    [dispatch]
  );

  const predictMultiple = useCallback(
    async (regionsArray, trimestre, year) => {
      return dispatch(predictBatch({ regions: regionsArray, trimestre, year }));
    },
    [dispatch]
  );

  const predictAll = useCallback(
    async (trimestre, year) => {
      return dispatch(predictAllRegions({ trimestre, year }));
    },
    [dispatch]
  );

  const loadStats = useCallback(async () => {
    return dispatch(fetchStats());
  }, [dispatch]);

  const updateRegionFilter = useCallback(
    (region) => {
      dispatch(setRegionFilter(region));
    },
    [dispatch]
  );

  const updateTrimestreFilter = useCallback(
    (trimestre) => {
      dispatch(setTrimestreFilter(trimestre));
    },
    [dispatch]
  );

  const updateYearFilter = useCallback(
    (year) => {
      dispatch(setYearFilter(year));
    },
    [dispatch]
  );

  const handleError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    predictions,
    currentPrediction,
    regions,
    stats,
    loading,
    error,
    errorMessage,
    filters,
    serviceHealth,
    isServiceAvailable: serviceHealth === 'healthy',

    // Functions
    predictOne,
    predictMultiple,
    predictAll,
    loadStats,
    updateRegionFilter,
    updateTrimestreFilter,
    updateYearFilter,
    clearError: handleError,
  };
};

export default usePrediction;
