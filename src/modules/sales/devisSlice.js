import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../app/axios';
import { logout } from '../../auth/authSlice';

// État initial
const initialState = {
  devis: [],
  currentDevis: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  },
};

// Actions asynchrones
// Note: axiosInstance (dans ../../app/axios) retourne déjà response.data via un intercepteur
export const fetchDevis = createAsyncThunk(
  'devis/fetchDevis',
  async (params = {}) => {
    const response = await axios.get('/devis', {
      params: { 
        page: 1, 
        limit: 1000,
        ...params 
      }
    });
    // response est ici { status: 'success', data: [...], pagination: {...} }
    return response;
  }
);

export const fetchDevisById = createAsyncThunk('devis/fetchDevisById', async (id) => {
  const response = await axios.get(`/devis/${id}`);
  // response est { status: 'success', data: { ... } }
  return response.data;
});

export const createDevis = createAsyncThunk('devis/createDevis', async (payload, { rejectWithValue }) => {
  try {
    const response = await axios.post('/devis', payload);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const updateDevis = createAsyncThunk('devis/updateDevis', async ({ id, payload }) => {
  const response = await axios.put(`/devis/${id}`, payload);
  return response.data;
});

export const deleteDevis = createAsyncThunk('devis/deleteDevis', async (id) => {
  await axios.delete(`/devis/${id}`);
  return id;
});

export const validateDevis = createAsyncThunk('devis/validateDevis', async (id) => {
  const response = await axios.patch(`/devis/${id}/validate`);
  return response.data;
});

export const convertDevis = createAsyncThunk('devis/convertDevis', async (id) => {
  const response = await axios.patch(`/devis/${id}/convert`);
  return response.data;
});

// Récupérer les devis du client connecté uniquement
export const fetchMyDevis = createAsyncThunk('devis/fetchMyDevis', async (params = {}) => {
  const response = await axios.get('/devis/my-quotations', { params });
  return response;
});

// Slice
const devisSlice = createSlice({
  name: 'devis',
  initialState,
  reducers: {
    clearCurrentDevis: (state) => {
      state.currentDevis = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Reset state on logout to prevent stale data leaking across user sessions
      .addCase(logout.fulfilled, () => initialState)
      .addCase(logout.rejected, () => initialState)

      // Fetch Devis
      .addCase(fetchDevis.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDevis.fulfilled, (state, action) => {
        state.loading = false;
        state.devis = action.payload?.data || [];
        state.pagination = action.payload?.pagination || initialState.pagination;
      })
      .addCase(fetchDevis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Fetch My Devis (client)
      .addCase(fetchMyDevis.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyDevis.fulfilled, (state, action) => {
        state.loading = false;
        state.devis = action.payload?.data || [];
        state.pagination = action.payload?.pagination || initialState.pagination;
      })
      .addCase(fetchMyDevis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Fetch Devis By ID
      .addCase(fetchDevisById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDevisById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDevis = action.payload;
      })
      .addCase(fetchDevisById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Create Devis
      .addCase(createDevis.fulfilled, (state, action) => {
        if (action.payload) {
          state.devis.unshift(action.payload);
        }
      })

      // Update Devis
      .addCase(updateDevis.fulfilled, (state, action) => {
        if (!action.payload) return;
        const index = state.devis.findIndex((d) => d.Guid === action.payload.Guid);
        if (index !== -1) {
          state.devis[index] = action.payload;
        }
        if (state.currentDevis?.Guid === action.payload.Guid) {
          state.currentDevis = action.payload;
        }
      })

      // Delete Devis
      .addCase(deleteDevis.fulfilled, (state, action) => {
        state.devis = state.devis.filter((d) => d.Guid !== action.payload);
      })

      // Validate Devis
      .addCase(validateDevis.fulfilled, (state, action) => {
        if (!action.payload) return;
        // Preserve existing details if the response doesn't include them
        const withDetails = action.payload.details?.length
          ? action.payload
          : { ...action.payload, details: state.currentDevis?.details ?? [] };
        const index = state.devis.findIndex((d) => d.Guid === action.payload.Guid);
        if (index !== -1) {
          state.devis[index] = withDetails;
        }
        if (state.currentDevis?.Guid === action.payload.Guid) {
          state.currentDevis = withDetails;
        }
      })

      // Convert Devis
      .addCase(convertDevis.fulfilled, (state, action) => {
        if (!action.payload) return;
        const index = state.devis.findIndex((d) => d.Guid === action.payload.Guid);
        if (index !== -1) {
          state.devis[index] = action.payload;
        }
        if (state.currentDevis?.Guid === action.payload.Guid) {
          state.currentDevis = action.payload;
        }
      });
  },
});

export const { clearCurrentDevis, clearError } = devisSlice.actions;
export default devisSlice.reducer;
