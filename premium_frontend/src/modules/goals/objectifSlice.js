import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../app/axios';

const initialState = {
    objectifs: [],
    loading: false,
    error: null
};

export const fetchObjectifs = createAsyncThunk(
    'objectifs/fetchObjectifs',
    async (filters = {}) => {
        const response = await axios.get('/objectifs', { params: filters });
        return response.data;
    }
);

export const createObjectif = createAsyncThunk(
    'objectifs/createObjectif',
    async (data) => {
        const response = await axios.post('/objectifs', data);
        return response.data;
    }
);

export const updateObjectif = createAsyncThunk(
    'objectifs/updateObjectif',
    async ({ id, data }) => {
        const response = await axios.put(`/objectifs/${id}`, data);
        return response.data;
    }
);

const objectifSlice = createSlice({
    name: 'objectifs',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchObjectifs.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchObjectifs.fulfilled, (state, action) => {
                state.loading = false;
                state.objectifs = action.payload.data;
            })
            .addCase(fetchObjectifs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(createObjectif.fulfilled, (state, action) => {
                state.objectifs.unshift(action.payload.data);
            })
            .addCase(updateObjectif.fulfilled, (state, action) => {
                const index = state.objectifs.findIndex((o) => o.ID_Objectif === action.payload.data.ID_Objectif);
                if (index !== -1) state.objectifs[index] = action.payload.data;
            });
    },
});

export default objectifSlice.reducer;
