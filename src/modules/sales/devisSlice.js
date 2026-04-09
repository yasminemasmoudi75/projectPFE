import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../app/axios';

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
  async ({ page = 1, limit = 100, search = '', status = '' }) => {
    const response = await axios.get('/devis', {
      params: { page, limit, search, status }
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

export const createDevis = createAsyncThunk('devis/createDevis', async (payload) => {
  const response = await axios.post('/devis', payload);
  // response est { status: 'success', message: '...', data: { ... } }
  return response.data;
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
        const index = state.devis.findIndex((d) => d.Guid === action.payload.Guid);
        if (index !== -1) {
          state.devis[index] = action.payload;
        }
        if (state.currentDevis?.Guid === action.payload.Guid) {
          state.currentDevis = action.payload;
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
