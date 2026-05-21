import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../app/axios';

const initialState = {
    favList: [],
    currentFav: null,
    loading: false,
    error: null,
    pagination: { page: 1, limit: 100, total: 0, totalPages: 1 },
};

// Récupérer toutes les factures
export const fetchFav = createAsyncThunk('fav/fetchFav', async (params = {}) => {
    const response = await axios.get('/fav', { 
        params: { 
            page: 1, 
            limit: 1000, 
            ...params 
        } 
    });
    return response;
});

// Récupérer les factures de l'utilisateur (client sees only their invoices)
export const fetchMyFav = createAsyncThunk('fav/fetchMyFav', async (params = {}) => {
    const response = await axios.get('/fav/my-invoices', { params });
    return response;
});

// Récupérer une facture par ID (avec détails)
export const fetchFavById = createAsyncThunk('fav/fetchFavById', async (id) => {
    const response = await axios.get(`/fav/${id}`);
    // axios interceptor retourne déjà response.data (payload JSON complet)
    // qui a la forme { status, data, ... }
    return response;
});

// Créer une nouvelle facture
export const createFav = createAsyncThunk('fav/createFav', async ({ master, details }) => {
    const response = await axios.post('/fav', { master, details });
    return response;
});

// Mettre à jour une facture
export const updateFav = createAsyncThunk('fav/updateFav', async ({ id, master, details }) => {
    const response = await axios.put(`/fav/${id}`, { master, details });
    return response;
});

// Supprimer une facture
export const deleteFav = createAsyncThunk('fav/deleteFav', async (id) => {
    const response = await axios.delete(`/fav/${id}`);
    return response;
});

// Valider une FAV : anti double-décrémentation (PATCH /fav/:id/validate)
export const validateFav = createAsyncThunk('fav/validateFav', async (id, { rejectWithValue }) => {
    try {
        const response = await axios.patch(`/fav/${id}/validate`);
        return response;
    } catch (err) {
        return rejectWithValue(err?.response?.data || err?.data || { message: err.message });
    }
});

const favSlice = createSlice({
    name: 'fav',
    initialState,
    reducers: {
        clearCurrentFav: (state) => { state.currentFav = null; },
        clearError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchFav.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchFav.fulfilled, (state, action) => {
                state.loading = false;
                state.favList = action.payload?.data || [];
                state.pagination = action.payload?.pagination || initialState.pagination;
            })
            .addCase(fetchFav.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })

            .addCase(fetchMyFav.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchMyFav.fulfilled, (state, action) => {
                state.loading = false;
                state.favList = action.payload?.data || [];
                state.pagination = action.payload?.pagination || initialState.pagination;
            })
            .addCase(fetchMyFav.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })

            .addCase(fetchFavById.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchFavById.fulfilled, (state, action) => { state.loading = false; state.currentFav = action.payload.data; })
            .addCase(fetchFavById.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })

            .addCase(createFav.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(createFav.fulfilled, (state) => { state.loading = false; })
            .addCase(createFav.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })

            .addCase(updateFav.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(updateFav.fulfilled, (state) => { state.loading = false; })
            .addCase(updateFav.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })

            .addCase(deleteFav.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(deleteFav.fulfilled, (state, action) => {
                state.loading = false;
                state.favList = state.favList.filter(f => f.Guid !== action.meta.arg);
            })
            .addCase(deleteFav.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })

            .addCase(validateFav.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(validateFav.fulfilled, (state, action) => {
                state.loading = false;
                const updated = action.payload?.data;
                if (updated) {
                    state.favList = state.favList.map(f =>
                        f.Guid === updated.Guid ? { ...f, ...updated } : f,
                    );
                }
            })
            .addCase(validateFav.rejected, (state, action) => { state.loading = false; state.error = action.error.message; });
    },
});

export const { clearCurrentFav, clearError } = favSlice.actions;
export default favSlice.reducer;
