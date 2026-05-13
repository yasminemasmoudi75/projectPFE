/**
 * COMPONENT - Sales Prediction Dashboard
 * ======================================
 * Affiche les prédictions commerciales par région
 */

import { useState, useEffect } from 'react';
import { ChartBarIcon, SparklesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import usePrediction from '../../hooks/usePrediction';

const SalesPredictionDashboard = () => {
  console.log('[SalesPredictionDashboard] MOUNTING');
  
  const {
    predictions,
    regions,
    loading,
    error,
    errorMessage,
    isServiceAvailable,
    predictAll,
    clearError,
  } = usePrediction();
  
  console.log('[SalesPredictionDashboard] State:', { predictions: predictions?.length, regions: regions?.length, loading, isServiceAvailable });

  const [localFilters, setLocalFilters] = useState({
    trimestre: 3,
    year: new Date().getFullYear(),
    selectedRegion: null,
  });

  // Load predictions on mount or filter change
  useEffect(() => {
    console.log('[SalesPredictionDashboard] useEffect triggered with filters:', localFilters);
    handlePredictAll();
  }, [localFilters, handlePredictAll]);

  // Handle errors
  useEffect(() => {
    if (error && errorMessage) {
      toast.error(errorMessage);
      clearError();
    }
  }, [error, errorMessage, clearError]);

  const handlePredictAll = async () => {
    console.log('[SalesPredictionDashboard] handlePredictAll called with:', localFilters);
    try {
      const result = await predictAll(localFilters.trimestre, localFilters.year);
      console.log('[SalesPredictionDashboard] predictAll result:', result);
    } catch (err) {
      console.error('Prediction error:', err);
    }
  };

  const handleTrimestreChange = (e) => {
    setLocalFilters({ ...localFilters, trimestre: parseInt(e.target.value) });
  };

  const handleYearChange = (e) => {
    setLocalFilters({ ...localFilters, year: parseInt(e.target.value) });
  };

  return (
    <div className="space-y-6">
      {/* VISIBLE DEBUG BOX */}
      <div className="bg-yellow-100 border-4 border-yellow-500 rounded-lg p-4 text-yellow-900 font-bold">
        ✓✓✓ SECTION PREDICTIONS CHARGÉE ✓✓✓
        <div className="text-sm mt-2">Prédictions: {predictions?.length || 0} | Service: {isServiceAvailable ? '✓' : '✗'}</div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SparklesIcon className="w-8 h-8 text-blue-600" />
          Prédictions Commerciales par Région
        </h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isServiceAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isServiceAvailable ? '✓ Service OK' : '✗ Service Down'}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 flex gap-4 flex-wrap">
        <select
          value={localFilters.trimestre}
          onChange={handleTrimestreChange}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="1">Q1</option>
          <option value="2">Q2</option>
          <option value="3">Q3</option>
          <option value="4">Q4</option>
        </select>

        <select
          value={localFilters.year}
          onChange={handleYearChange}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          {[2024, 2025, 2026, 2027, 2028].map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        <button
          onClick={handlePredictAll}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
        >
          {loading ? 'Chargement...' : 'Rafraîchir'}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="animate-spin mb-4"><ChartBarIcon className="w-8 h-8 text-blue-600 mx-auto" /></div>
          <p className="text-gray-600">Calcul des prédictions...</p>
        </div>
      )}

      {/* Error */}
      {error && errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-medium">Erreur</p>
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}

      {/* Predictions Grid */}
      {!loading && predictions && predictions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predictions.map((pred) => (
            <div key={pred.region} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">{pred.region}</h3>
                <div className={`px-2 py-1 rounded text-xs font-bold ${
                  pred.prediction === 'HAUSSE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {pred.prediction === 'HAUSSE' ? '📈 HAUSSE' : '📉 BAISSE'}
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Fiabilité</span>
                  <span className="font-bold">{(pred.confiance || 0).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (pred.confiance || 0) >= 75 ? 'bg-green-600' : (pred.confiance || 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(pred.confiance || 0, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className={`p-2 rounded text-xs font-medium text-center ${
                pred.recommandation === 'AUGMENTER' ? 'bg-green-50 text-green-800' : 
                pred.recommandation === 'MAINTENIR' ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-600 font-bold'
              }`}>
                {pred.recommandation || 'MAINTENIR'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {!loading && predictions && predictions.length > 0 && (
        <div className="grid grid-cols-4 gap-3 text-sm">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600">Total</div>
            <div className="text-xl font-bold">{predictions.length}</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600">HAUSSE</div>
            <div className="text-xl font-bold text-green-600">{predictions.filter(p => p.prediction === 'HAUSSE').length}</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600">BAISSE</div>
            <div className="text-xl font-bold text-red-600">{predictions.filter(p => p.prediction === 'BAISSE').length}</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600">Moy.</div>
            <div className="text-xl font-bold text-blue-600">
              {(predictions.reduce((sum, p) => sum + (p.confiance || 0), 0) / predictions.length).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && (!predictions || predictions.length === 0) && isServiceAvailable && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Aucune prédiction disponible</p>
        </div>
      )}

      {/* Service Down */}
      {!isServiceAvailable && !loading && (
        <div className="text-center py-12 bg-yellow-50 rounded-lg border border-yellow-200">
          <ExclamationTriangleIcon className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <p className="text-yellow-800 font-medium">Service ML indisponible</p>
          <p className="text-yellow-700 text-sm">Lancez Flask sur le port 5000</p>
        </div>
      )}
    </div>
  );
};

export default SalesPredictionDashboard;
