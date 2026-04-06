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

// Récupérer les bons de livraison de l'utilisateur (client sees only their deliveries)
export const fetchMyBlv = createAsyncThunk('blv/fetchMyBlv', async ({ page = 1, limit = 100 } = {}) => {
    const response = await axios.get('/blv/my-deliveries', { params: { page, limit } });
    return response;
});

// Récupérer un bon de livraison par ID (avec détails)
export const fetchBlvById = createAsyncThunk('blv/fetchBlvById', async (id) => {
    const response = await axios.get(`/blv/${id}`);
    // axios interceptor retourne déjà response.data (payload JSON complet)
    // qui a la forme { status, data, ... }
    return response;
});

// Créer un nouveau bon de livraison
export const createBlv = createAsyncThunk('blv/createBlv', async ({ master, details }) => {
    const response = await axios.post('/blv', { master, details });
    return response;
});

// Mettre à jour un bon de livraison
export const updateBlv = createAsyncThunk('blv/updateBlv', async ({ id, master, details }) => {
    const response = await axios.put(`/blv/${id}`, { master, details });
    return response;
});

// Supprimer un bon de livraison
export const deleteBlv = createAsyncThunk('blv/deleteBlv', async (id) => {
    const response = await axios.delete(`/blv/${id}`);
    return response;
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

            .addCase(fetchMyBlv.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchMyBlv.fulfilled, (state, action) => {
                state.loading = false;
                state.blvList = action.payload?.data || [];
                state.pagination = action.payload?.pagination || initialState.pagination;
            })
            .addCase(fetchMyBlv.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })

            .addCase(fetchBlvById.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchBlvById.fulfilled, (state, action) => { state.loading = false; state.currentBlv = action.payload.data; })
            .addCase(fetchBlvById.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })

            .addCase(createBlv.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(createBlv.fulfilled, (state) => { state.loading = false; })
            .addCase(createBlv.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })

            .addCase(updateBlv.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(updateBlv.fulfilled, (state) => { state.loading = false; })
            .addCase(updateBlv.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })

            .addCase(deleteBlv.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(deleteBlv.fulfilled, (state, action) => {
                state.loading = false;
                state.blvList = state.blvList.filter(b => b.Guid !== action.meta.arg);
            })
            .addCase(deleteBlv.rejected, (state, action) => { state.loading = false; state.error = action.error.message; });
    },
});

export const { clearCurrentBlv, clearError } = blvSlice.actions;
export default blvSlice.reducer;
