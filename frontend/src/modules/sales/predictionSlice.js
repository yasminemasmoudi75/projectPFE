/**
 * REDUX SLICE - PREDICTION
 * =========================
 * Gestion d'état pour les prédictions ML
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import predictionService from './predictionService';

// État initial
const initialState = {
  predictions: [],
  currentPrediction: null,
  regions: [],
  stats: null,
  
  // Loading states
  loading: false,
  loadingRegions: false,
  loadingStats: false,
  
  // Errors
  error: null,
  errorMessage: null,
  
  // Filter state
  filters: {
    region: null,
    trimestre: 3,
    year: new Date().getFullYear(),
  },
  
  // Cache
  lastUpdated: null,
  serviceHealth: 'unknown', // 'healthy', 'unavailable', 'unknown'
};

/**
 * Thunks - Actions Asynchrones
 */

// Check service health
export const checkServiceHealth = createAsyncThunk(
  'prediction/checkHealth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await predictionService.checkHealth();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch regions
export const fetchRegions = createAsyncThunk(
  'prediction/fetchRegions',
  async (_, { rejectWithValue }) => {
    try {
      const regions = await predictionService.getRegions();
      return regions;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch stats
export const fetchStats = createAsyncThunk(
  'prediction/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await predictionService.getStats();
      return stats;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Single region prediction
export const predictRegion = createAsyncThunk(
  'prediction/predictRegion',
  async ({ region, trimestre = 3, year }, { rejectWithValue }) => {
    try {
      const result = await predictionService.predictRegion(region, trimestre, year);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Batch predictions
export const predictBatch = createAsyncThunk(
  'prediction/predictBatch',
  async ({ regions, trimestre = 3, year }, { rejectWithValue }) => {
    try {
      const result = await predictionService.predictBatch(regions, trimestre, year);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Predict all regions
export const predictAllRegions = createAsyncThunk(
  'prediction/predictAllRegions',
  async ({ trimestre = 3, year }, { rejectWithValue }) => {
    try {
      const result = await predictionService.predictAllRegions(trimestre, year);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Slice
 */
const predictionSlice = createSlice({
  name: 'prediction',
  initialState,
  reducers: {
    // Synchronous actions
    setRegionFilter: (state, action) => {
      state.filters.region = action.payload;
    },
    setTrimestreFilter: (state, action) => {
      state.filters.trimestre = action.payload;
    },
    setYearFilter: (state, action) => {
      state.filters.year = action.payload;
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearError: (state) => {
      state.error = false;
      state.errorMessage = null;
    },
  },
  extraReducers: (builder) => {
    // Check Health
    builder
      .addCase(checkServiceHealth.fulfilled, (state, action) => {
        state.serviceHealth = 'healthy';
        state.error = false;
      })
      .addCase(checkServiceHealth.rejected, (state, action) => {
        state.serviceHealth = 'unavailable';
        state.error = true;
        state.errorMessage = action.payload;
      });

    // Fetch Regions
    builder
      .addCase(fetchRegions.pending, (state) => {
        state.loadingRegions = true;
        state.error = false;
      })
      .addCase(fetchRegions.fulfilled, (state, action) => {
        state.regions = action.payload;
        state.loadingRegions = false;
        state.error = false;
      })
      .addCase(fetchRegions.rejected, (state, action) => {
        state.loadingRegions = false;
        state.error = true;
        state.errorMessage = action.payload;
      });

    // Fetch Stats
    builder
      .addCase(fetchStats.pending, (state) => {
        state.loadingStats = true;
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.stats = action.payload;
        state.loadingStats = false;
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.loadingStats = false;
        state.errorMessage = action.payload;
      });

    // Predict Region
    builder
      .addCase(predictRegion.pending, (state) => {
        state.loading = true;
        state.error = false;
      })
      .addCase(predictRegion.fulfilled, (state, action) => {
        state.currentPrediction = action.payload;
        state.predictions = [action.payload, ...state.predictions].slice(0, 50);
        state.loading = false;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(predictRegion.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.errorMessage = action.payload;
      });

    // Predict Batch
    builder
      .addCase(predictBatch.pending, (state) => {
        state.loading = true;
        state.error = false;
      })
      .addCase(predictBatch.fulfilled, (state, action) => {
        // API retourne { results: [...], success: true, ... }
        state.predictions = Array.isArray(action.payload) 
          ? action.payload 
          : (action.payload.results || action.payload.predictions || []);
        state.loading = false;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(predictBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.errorMessage = action.payload;
      });

    // Predict All Regions
    builder
      .addCase(predictAllRegions.pending, (state) => {
        state.loading = true;
        state.error = false;
      })
      .addCase(predictAllRegions.fulfilled, (state, action) => {
        // API retourne { predictions: [...] } via predictAllRegions wrapper
        const payload = action.payload;
        state.predictions = Array.isArray(payload)
          ? payload
          : (payload.predictions || payload.results || []);
        state.loading = false;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(predictAllRegions.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.errorMessage = action.payload;
      });
  },
});

// Selectors
export const selectPredictions = (state) => state.prediction.predictions;
export const selectCurrentPrediction = (state) => state.prediction.currentPrediction;
export const selectRegions = (state) => state.prediction.regions;
export const selectStats = (state) => state.prediction.stats;
export const selectLoading = (state) => state.prediction.loading;
export const selectError = (state) => state.prediction.error;
export const selectErrorMessage = (state) => state.prediction.errorMessage;
export const selectFilters = (state) => state.prediction.filters;
export const selectServiceHealth = (state) => state.prediction.serviceHealth;

// Actions
export const {
  setRegionFilter,
  setTrimestreFilter,
  setYearFilter,
  resetFilters,
  clearError,
} = predictionSlice.actions;

export default predictionSlice.reducer;
