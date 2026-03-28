import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
  predictions: {
    devisConversion: null,
    projectDelays: null,
    customerSatisfaction: { score: 8.5, total: 45 },
    salesForecast: { montant: '150 000', trend: '+15%' },
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
export const getSalesForecast = createAsyncThunk('ia/getSalesForecast', async () => initialState.predictions.salesForecast);
export const getRelanceRecommendations = createAsyncThunk('ia/getRelanceRecommendations', async () => initialState.predictions.relanceRecommendations);

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
        state.predictions.salesForecast = action.payload;
      })
      .addCase(getRelanceRecommendations.fulfilled, (state, action) => {
        state.predictions.relanceRecommendations = action.payload;
      });
  },
});

export const { clearPredictions } = iaSlice.actions;
export default iaSlice.reducer;
