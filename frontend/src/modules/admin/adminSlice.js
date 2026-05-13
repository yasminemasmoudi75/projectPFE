import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../app/axios';

export const fetchCommercials = createAsyncThunk(
  'admin/fetchCommercials',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/users/commercials/assignable');
      // Backend returns { status: 'success', data: [...] }
      // axiosInstance returns response.data, so response is { status: 'success', data: [...] }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération des commerciaux');
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    selectedCommercial: localStorage.getItem('selectedCommercial') || null,
    commercials: [],
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedCommercial: (state, action) => {
      state.selectedCommercial = action.payload;
      if (action.payload) {
        localStorage.setItem('selectedCommercial', action.payload);
      } else {
        localStorage.removeItem('selectedCommercial');
      }
    },
    clearSelectedCommercial: (state) => {
      state.selectedCommercial = null;
      localStorage.removeItem('selectedCommercial');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommercials.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCommercials.fulfilled, (state, action) => {
        state.loading = false;
        state.commercials = action.payload;
      })
      .addCase(fetchCommercials.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSelectedCommercial, clearSelectedCommercial } = adminSlice.actions;
export default adminSlice.reducer;
