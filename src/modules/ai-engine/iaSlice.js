import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../app/axios';

const initialState = {
  predictions: {
    devisConversion: null,
    projectDelays: null,
    customerSatisfaction: { score: 8.5, total: 45 },
    salesForecast: {
      montant: '0 / 24',
      trend: '+0.0%',
      raw: [],
      modelAccuracy: 72.94,
    },
    relanceRecommendations: [
      { id: 1, client: 'BEN AROUS', population: 700000, indiceAchat: 118, lastInteraction: 1, priority: 'Haute', score: 65, variation_label: '+5%' },
      { id: 2, client: 'SOUSSE',    population: 720000, indiceAchat: 124, lastInteraction: 2, priority: 'Moyenne', score: 58, variation_label: '+3%' },
      { id: 3, client: 'KAIROUAN', population: 590000, indiceAchat: 97,  lastInteraction: 3, priority: 'Normale', score: 52, variation_label: '+2%' },
    ],
  },
  loading: false,
  error: null,
};

export const getDevisConversionProbability = createAsyncThunk(
  'ia/getDevisConversionProbability',
  async () => ({ probability: 85 })
);

export const getProjectDelayPrediction = createAsyncThunk(
  'ia/getProjectDelayPrediction',
  async () => ({ delayDays: 0 })
);

export const getCustomerSatisfactionAnalysis = createAsyncThunk(
  'ia/getCustomerSatisfactionAnalysis',
  async () => initialState.predictions.customerSatisfaction
);

/**
 * Récupère les prédictions batch des 24 régions via le proxy backend (/ia/forecast)
 * → backend → Flask ML API (/api/batch-predict)
 * Retourne : { montant, trend, raw, modelAccuracy }
 */
export const getSalesForecast = createAsyncThunk('ia/getSalesForecast', async () => {
  // response = { status, data: [...résultats Flask batch-predict...] }
  // (l'intercepteur axios retourne directement response.data)
  const response = await axios.get('/ia/forecast');
  const rows = response?.data || [];

  const augmenterRows = rows.filter(r => r.recommandation === 'AUGMENTER');
  const augmenterCount = augmenterRows.length;

  // Variation moyenne sur les régions AUGMENTER
  const avgVariation =
    augmenterRows.length > 0
      ? augmenterRows.reduce((s, r) => s + Number(r.variation_estimee || 0), 0) / augmenterRows.length
      : 0;

  const trendLabel =
    avgVariation >= 0 ? `+${avgVariation.toFixed(1)}%` : `${avgVariation.toFixed(1)}%`;

  // Précision du modèle renvoyée par Flask (ex : 0.7294 → 72.94)
  const modelAccuracy =
    rows[0]?.model_accuracy != null
      ? Math.round(rows[0].model_accuracy * 100 * 100) / 100
      : 72.94;

  return {
    montant: `${augmenterCount} / ${rows.length || 24}`,
    trend: trendLabel,
    raw: rows,
    modelAccuracy,
  };
});

/**
 * Dérive les régions prioritaires (AUGMENTER) depuis le state déjà chargé
 * par getSalesForecast — pas de second appel réseau.
 */
export const getRelanceRecommendations = createAsyncThunk(
  'ia/getRelanceRecommendations',
  async (_, { getState }) => {
    // Réutilise les données déjà en state (chargées par getSalesForecast avant ce dispatch)
    const rows = getState().ia?.predictions?.salesForecast?.raw || [];

    return rows
      .filter(r => r.recommandation === 'AUGMENTER')
      .sort((a, b) => (b.probabilite_hausse || 0) - (a.probabilite_hausse || 0))
      .slice(0, 3)
      .map((item, index) => ({
        id: index + 1,
        client: (item.region || 'RÉGION').replace(/_/g, ' '),
        population: item.region_data?.population || 0,
        indiceAchat: item.region_data?.indice_achat || 0,
        lastInteraction: index + 1,
        priority: index === 0 ? 'Haute' : index === 1 ? 'Moyenne' : 'Normale',
        score: Math.round(item.probabilite_hausse || 60),
        variation_label: item.variation_label || '+0%',
      }));
  }
);

const iaSlice = createSlice({
  name: 'ia',
  initialState,
  reducers: {
    clearPredictions: (state) => {
      state.predictions = initialState.predictions;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getSalesForecast.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDevisConversionProbability.fulfilled, (state, action) => {
        state.predictions.devisConversion = action.payload;
      })
      .addCase(getProjectDelayPrediction.fulfilled, (state, action) => {
        state.predictions.projectDelays = action.payload;
      })
      .addCase(getCustomerSatisfactionAnalysis.fulfilled, (state, action) => {
        state.predictions.customerSatisfaction = action.payload;
      })
      .addCase(getSalesForecast.fulfilled, (state, action) => {
        state.loading = false;
        state.predictions.salesForecast = action.payload;
      })
      .addCase(getRelanceRecommendations.fulfilled, (state, action) => {
        state.predictions.relanceRecommendations = action.payload;
      })
      .addCase(getSalesForecast.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erreur lors du chargement IA';
      });
  },
});

export const { clearPredictions } = iaSlice.actions;
export default iaSlice.reducer;
