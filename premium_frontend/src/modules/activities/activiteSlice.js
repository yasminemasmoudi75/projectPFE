import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../app/axios';

const initialState = {
  activites: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

export const fetchActivites = createAsyncThunk(
  'activites/fetchActivites',
  async ({ page = 1, limit = 10, filters = {} }) => {
    const response = await axios.get('/activites', { params: { page, limit, ...filters } });
    return response;
  }
);

export const createActivite = createAsyncThunk('activites/createActivite', async (data) => {
  const response = await axios.post('/activites', data);
  return response.data;
});

export const updateActivite = createAsyncThunk('activites/updateActivite', async ({ id, data }) => {
  const response = await axios.put(`/activites/${id}`, data);
  return response.data;
});

export const deleteActivite = createAsyncThunk('activites/deleteActivite', async (id) => {
  await axios.delete(`/activites/${id}`);
  return id;
});

const activiteSlice = createSlice({
  name: 'activites',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivites.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActivites.fulfilled, (state, action) => {
        state.loading = false;
        state.activites = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchActivites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createActivite.fulfilled, (state, action) => {
        state.activites.unshift(action.payload);
      })
      .addCase(updateActivite.fulfilled, (state, action) => {
        const index = state.activites.findIndex((a) => a.ID_Activite === action.payload.ID_Activite);
        if (index !== -1) state.activites[index] = action.payload;
      })
      .addCase(deleteActivite.fulfilled, (state, action) => {
        state.activites = state.activites.filter((a) => a.ID_Activite !== action.payload);
      });
  },
});

export default activiteSlice.reducer;

