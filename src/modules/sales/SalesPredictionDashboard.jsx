/**
 * COMPONENT - Sales Prediction Dashboard
 * ======================================
 * Affiche les prédictions commerciales par région
 */

import { useState, useEffect, useCallback } from 'react';
import { ChartBarIcon, SparklesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import usePrediction from '../../hooks/usePrediction';

const SalesPredictionDashboard = () => {
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

  const [localFilters, setLocalFilters] = useState({
    trimestre: 3,
    year: new Date().getFullYear(),
    selectedRegion: null,
  });

  const handlePredictAll = useCallback(async () => {
    try {
      await predictAll(localFilters.trimestre, localFilters.year);
    } catch (err) {
      // errors handled by Redux slice
    }
  }, [predictAll, localFilters]);

  useEffect(() => {
    handlePredictAll();
  }, [handlePredictAll]);

  // Handle errors
  useEffect(() => {
    if (error && errorMessage) {
      toast.error(errorMessage);
      clearError();
    }
  }, [error, errorMessage, clearError]);

  const handleTrimestreChange = (e) => {
    setLocalFilters({ ...localFilters, trimestre: parseInt(e.target.value) });
  };

  const handleYearChange = (e) => {
    setLocalFilters({ ...localFilters, year: parseInt(e.target.value) });
  };

  return (
    <div className="space-y-6">

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
          {predictions.map((pred) => {
            const confiance = pred.confiance ?? 0;
            const isAugmenter = pred.recommandation === 'AUGMENTER';
            const isMaintenir = pred.recommandation === 'MAINTENIR';

            return (
              <div key={pred.region} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">

                {/* En-tête : région + direction ML */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-gray-900">{pred.region}</h3>
                  <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                    pred.prediction === 'HAUSSE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {pred.prediction === 'HAUSSE' ? '📈' : '📉'} {pred.prediction}
                  </span>
                </div>

                {/* Confiance ML */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Confiance IA</span>
                    <span className="font-bold text-gray-800">{confiance}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        confiance >= 75 ? 'bg-green-500' : confiance >= 55 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${confiance}%` }}
                    />
                  </div>
                </div>

                {/* Recommandation */}
                <div className={`py-2 px-3 rounded-lg text-sm font-black text-center tracking-wide ${
                  isAugmenter ? 'bg-green-600 text-white' :
                  isMaintenir ? 'bg-yellow-500 text-white' :
                  'bg-red-600 text-white'
                }`}>
                  {isAugmenter ? '↑ AUGMENTER' : isMaintenir ? '= MAINTENIR' : '↓ RÉDUIRE'}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      {!loading && predictions && predictions.length > 0 && (() => {
        const augmenter = predictions.filter(p => p.recommandation === 'AUGMENTER').length;
        const maintenir = predictions.filter(p => p.recommandation === 'MAINTENIR').length;
        const reduire   = predictions.filter(p => p.recommandation === 'REDUIRE').length;
        const avgConf   = (predictions.reduce((s, p) => s + (p.confiance ?? 0), 0) / predictions.length).toFixed(1);

        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
              <div className="text-gray-500 text-xs mb-1">Total régions</div>
              <div className="text-2xl font-bold">{predictions.length}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200 text-center">
              <div className="text-green-700 text-xs font-medium mb-1">↑ AUGMENTER</div>
              <div className="text-2xl font-bold text-green-700">{augmenter}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200 text-center">
              <div className="text-yellow-700 text-xs font-medium mb-1">= MAINTENIR</div>
              <div className="text-2xl font-bold text-yellow-600">{maintenir}</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 border border-red-200 text-center">
              <div className="text-red-700 text-xs font-medium mb-1">↓ RÉDUIRE</div>
              <div className="text-2xl font-bold text-red-600">{reduire}</div>
            </div>
          </div>
        );
      })()}

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
