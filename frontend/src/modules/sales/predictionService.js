/**
 * SERVICE - PREDICTION API
 * =========================
 * Appels à l'API Flask ML pour les prédictions commerciales
 */

import axios from 'axios';

// Configuration API ML - Vite utilise import.meta.env au lieu de process.env
const ML_API_BASE_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:5000/api';

// Créer instance Axios pour ML API (sans authentification)
const mlAxios = axios.create({
  baseURL: ML_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Service d'API pour les prédictions ML
 */
export const predictionService = {
  /**
   * Vérifier la santé du service ML
   * GET /api/health
   */
  checkHealth: async () => {
    try {
      const response = await mlAxios.get('/health');
      return response.data;
    } catch (error) {
      console.error('ML Service health check failed:', error);
      throw new Error('Service ML indisponible');
    }
  },

  /**
   * Récupérer les régions valides
   * GET /api/regions
   */
  getRegions: async () => {
    try {
      const response = await mlAxios.get('/regions');
      return response.data?.regions || [];
    } catch (error) {
      console.error('Failed to fetch regions:', error);
      return [];
    }
  },

  /**
   * Obtenir une prédiction simple
   * POST /api/predict
   * @param {string} region - Nom de la région
   * @param {number} trimestre - Trimestre (1-4)
   * @param {number} year - Année (2020-2030)
   */
  predictRegion: async (region, trimestre = 3, year = new Date().getFullYear()) => {
    try {
      const response = await mlAxios.post('/predict', {
        region,
        trimestre,
        year,
      });
      return response.data;
    } catch (error) {
      console.error('Prediction failed:', error);
      throw new Error(error.response?.data?.error || 'Erreur de prédiction');
    }
  },

  /**
   * Prédictions batch pour plusieurs régions
   * POST /api/batch-predict
   * @param {array} regions - Liste des régions
   * @param {number} trimestre - Trimestre (1-4)
   * @param {number} year - Année
   */
  predictBatch: async (regions, trimestre = 3, year = new Date().getFullYear()) => {
    try {
      const response = await mlAxios.post('/batch-predict', {
        regions,
        trimestre,
        year,
      });
      return response.data;
    } catch (error) {
      console.error('Batch prediction failed:', error);
      throw new Error(error.response?.data?.error || 'Erreur prédictions batch');
    }
  },

  /**
   * Récupérer les statistiques du service
   * GET /api/stats
   */
  getStats: async () => {
    try {
      const response = await mlAxios.get('/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return null;
    }
  },

  /**
   * Prédire pour toutes les régions d'une année/trimestre
   * Combine getRegions + predictBatch
   */
  predictAllRegions: async (trimestre = 3, year = new Date().getFullYear()) => {
    try {
      // 1. Récupérer les régions
      const regionsData = await predictionService.getRegions();
      const regions = Array.isArray(regionsData) ? regionsData : [];

      if (regions.length === 0) {
        throw new Error('Aucune région disponible');
      }

      // 2. Faire prédictions batch
      const predictions = await predictionService.predictBatch(
        regions,
        trimestre,
        year
      );

      return {
        success: true,
        regions: regions.length,
        predictions: predictions.results || [],
        errors: predictions.errors || [],
      };
    } catch (error) {
      console.error('Predict all regions failed:', error);
      throw error;
    }
  },
};

export default predictionService;
