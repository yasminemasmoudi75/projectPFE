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
export const fetchFav = createAsyncThunk('fav/fetchFav', async ({ page = 1, limit = 100, search = '' } = {}) => {
    const response = await axios.get('/fav', { params: { page, limit, search } });
    return response; // interceptor already unwraps response.data
});

// Récupérer une facture par ID (avec détails)
export const fetchFavById = createAsyncThunk('fav/fetchFavById', async (id) => {
    const response = await axios.get(`/fav/${id}`);
    return response.data; // response.data = the 'data' field of the JSON body
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

            .addCase(fetchFavById.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchFavById.fulfilled, (state, action) => { state.loading = false; state.currentFav = action.payload.data; })
            .addCase(fetchFavById.rejected, (state, action) => { state.loading = false; state.error = action.error.message; });
    },
});

export const { clearCurrentFav, clearError } = favSlice.actions;
export default favSlice.reducer;
