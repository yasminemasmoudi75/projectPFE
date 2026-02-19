import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../app/axios';

const initialState = {
  projets: [],
  currentProjet: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

export const fetchProjets = createAsyncThunk(
  'projets/fetchProjets',
  async ({ page = 1, limit = 10, filters = {} }) => {
    const response = await axios.get('/projets', { params: { page, limit, ...filters } });
    return response;
  }
);

export const fetchProjetById = createAsyncThunk('projets/fetchProjetById', async (id) => {
  const response = await axios.get(`/projets/${id}`);
  return response.data;
});

export const createProjet = createAsyncThunk('projets/createProjet', async (data) => {
  const response = await axios.post('/projets', data);
  return response.data;
});

export const updateProjet = createAsyncThunk('projets/updateProjet', async ({ id, data }) => {
  const response = await axios.put(`/projets/${id}`, data);
  return response.data;
});

export const deleteProjet = createAsyncThunk('projets/deleteProjet', async (id) => {
  await axios.delete(`/projets/${id}`);
  return id;
});

const projetSlice = createSlice({
  name: 'projets',
  initialState,
  reducers: {
    clearCurrentProjet: (state) => {
      state.currentProjet = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjets.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProjets.fulfilled, (state, action) => {
        state.loading = false;
        state.projets = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProjets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchProjetById.fulfilled, (state, action) => {
        state.currentProjet = action.payload;
      })
      .addCase(createProjet.fulfilled, (state, action) => {
        state.projets.unshift(action.payload);
      })
      .addCase(updateProjet.fulfilled, (state, action) => {
        const index = state.projets.findIndex((p) => p.ID_Projet === action.payload.ID_Projet);
        if (index !== -1) state.projets[index] = action.payload;
        if (state.currentProjet?.ID_Projet === action.payload.ID_Projet) {
          state.currentProjet = action.payload;
        }
      })
      .addCase(deleteProjet.fulfilled, (state, action) => {
        state.projets = state.projets.filter((p) => p.ID_Projet !== action.payload);
      });
  },
});

export const { clearCurrentProjet } = projetSlice.actions;
export default projetSlice.reducer;

