import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../app/axios';

// État initial
const initialState = {
  orders: [],
  currentOrder: null,
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
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async ({ page = 1, limit = 100, search = '' }) => {
    const response = await axios.get('/devis/orders/all', {
      params: { page, limit, search }
    });
    return response;
  }
);

export const fetchOrderById = createAsyncThunk('orders/fetchOrderById', async (id) => {
  const response = await axios.get(`/devis/${id}`);
  return response.data;
});

// Slice
const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload?.data || [];
        state.pagination = action.payload?.pagination || initialState.pagination;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Fetch Order By ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearCurrentOrder, clearError } = ordersSlice.actions;
export default ordersSlice.reducer;

