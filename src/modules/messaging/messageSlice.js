import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../app/axios';

const initialState = {
  messages: [],
  unreadCount: 0,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ page = 1, limit = 10 }) => {
    const response = await axios.get('/messages', { params: { page, limit } });
    return response;
  }
);

export const sendMessage = createAsyncThunk('messages/sendMessage', async (data) => {
  const response = await axios.post('/messages', data);
  return response.data;
});

export const markAsRead = createAsyncThunk('messages/markAsRead', async (id) => {
  const response = await axios.put(`/messages/${id}/read`);
  return response.data;
});

export const deleteMessage = createAsyncThunk('messages/deleteMessage', async (id) => {
  await axios.delete(`/messages/${id}`);
  return id;
});

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload.data;
        state.pagination = action.payload.pagination;
        state.unreadCount = action.payload.data.filter((m) => !m.IsRead).length;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messages.unshift(action.payload);
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const index = state.messages.findIndex((m) => m.ID === action.payload.ID);
        if (index !== -1) {
          state.messages[index].IsRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.messages = state.messages.filter((m) => m.ID !== action.payload);
      });
  },
});

export default messageSlice.reducer;

