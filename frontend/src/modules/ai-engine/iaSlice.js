import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../app/axios';

const initialState = {
  predictions: {
    devisConversion: null,
    projectDelays: null,
    customerSatisfaction: { score: 8.5, total: 45 },
    salesForecast: { montant: '0', trend: '+0.0%', raw: [] },
    relanceRecommendations: [
      { id: 1, client: 'Société ABC', lastInteraction: 5, priority: 'Haute' },
      { id: 2, client: 'Tech Solutions', lastInteraction: 10, priority: 'Moyenne' },
      { id: 3, client: 'Global Import', lastInteraction: 15, priority: 'Haute' },
    ],
  },
  loading: false,
  error: null,
};

// Mock thunks
export const getDevisConversionProbability = createAsyncThunk('ia/getDevisConversionProbability', async (id) => ({ probability: 85 }));
export const getProjectDelayPrediction = createAsyncThunk('ia/getProjectDelayPrediction', async (id) => ({ delayDays: 0 }));
export const getCustomerSatisfactionAnalysis = createAsyncThunk('ia/getCustomerSatisfactionAnalysis', async () => initialState.predictions.customerSatisfaction);
export const getSalesForecast = createAsyncThunk('ia/getSalesForecast', async () => {
  const response = await axios.get('/ia/forecast', { params: { limit: 200 } });
  const rows = response?.data || [];

  const totalQty = rows.reduce((sum, row) => sum + Number(row.pred_qty_next_week || 0), 0);
  const amountEstimate = Math.round(totalQty);

  return {
    montant: amountEstimate.toLocaleString('fr-FR'),
    trend: '+0.0%',
    raw: rows,
  };
});

export const getRelanceRecommendations = createAsyncThunk('ia/getRelanceRecommendations', async () => {
  const response = await axios.get('/ia/forecast', { params: { limit: 20 } });
  const rows = response?.data || [];

  return rows.slice(0, 3).map((item, index) => ({
    id: index + 1,
    client: `${item.region || 'Zone'} / ${String(item.product_id || 'Produit').slice(0, 8)}`,
    lastInteraction: 7 + index * 3,
    priority: index === 0 ? 'Haute' : index === 1 ? 'Moyenne' : 'Normale',
    score: Math.max(60, Math.min(95, Math.round(Number(item.pred_qty_next_week || 0)))),
  }));
});

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
