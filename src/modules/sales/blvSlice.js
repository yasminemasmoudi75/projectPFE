import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../app/axios';

const initialState = {
    blvList: [],
    currentBlv: null,
    loading: false,
    error: null,
    pagination: { page: 1, limit: 100, total: 0, totalPages: 1 },
};

// Récupérer tous les bons de livraison
export const fetchBlv = createAsyncThunk('blv/fetchBlv', async ({ page = 1, limit = 100, search = '' } = {}) => {
    const response = await axios.get('/blv', { params: { page, limit, search } });
    return response; // interceptor already unwraps response.data
});

// Récupérer un bon de livraison par ID (avec détails)
export const fetchBlvById = createAsyncThunk('blv/fetchBlvById', async (id) => {
    const response = await axios.get(`/blv/${id}`);
    return response.data; // response.data = the 'data' field of the JSON body
});

const blvSlice = createSlice({
    name: 'blv',
    initialState,
    reducers: {
        clearCurrentBlv: (state) => { state.currentBlv = null; },
        clearError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchBlv.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchBlv.fulfilled, (state, action) => {
                state.loading = false;
                state.blvList = action.payload?.data || [];
                state.pagination = action.payload?.pagination || initialState.pagination;
            })
            .addCase(fetchBlv.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })

            .addCase(fetchBlvById.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchBlvById.fulfilled, (state, action) => { state.loading = false; state.currentBlv = action.payload.data; })
            .addCase(fetchBlvById.rejected, (state, action) => { state.loading = false; state.error = action.error.message; });
    },
});

export const { clearCurrentBlv, clearError } = blvSlice.actions;
export default blvSlice.reducer;
