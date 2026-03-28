import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../app/axios';

const initialState = {
    bcvList: [],
    currentBcv: null,
    loading: false,
    error: null,
    pagination: { page: 1, limit: 100, total: 0, totalPages: 1 },
};

// Récupérer tous les bons de commande
export const fetchBcv = createAsyncThunk('bcv/fetchBcv', async ({ page = 1, limit = 100, search = '' } = {}) => {
    const response = await axios.get('/bcv', { params: { page, limit, search } });
    return response;
});

// Récupérer un bon de commande par ID (avec détails)
export const fetchBcvById = createAsyncThunk('bcv/fetchBcvById', async (id) => {
    const response = await axios.get(`/bcv/${id}`);
    return response.data;
});

const bcvSlice = createSlice({
    name: 'bcv',
    initialState,
    reducers: {
        clearCurrentBcv: (state) => { state.currentBcv = null; },
        clearError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchBcv.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchBcv.fulfilled, (state, action) => {
                state.loading = false;
                state.bcvList = action.payload?.data || [];
                state.pagination = action.payload?.pagination || initialState.pagination;
            })
            .addCase(fetchBcv.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })

            .addCase(fetchBcvById.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchBcvById.fulfilled, (state, action) => { state.loading = false; state.currentBcv = action.payload; })
            .addCase(fetchBcvById.rejected, (state, action) => { state.loading = false; state.error = action.error.message; });
    },
});

export const { clearCurrentBcv, clearError } = bcvSlice.actions;
export default bcvSlice.reducer;
