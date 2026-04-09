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
    return response.data;
  }
);

export const sendMessage = createAsyncThunk('messages/sendMessage', async (data) => {
  const response = await axios.post('/messages/send', data);
  return response.data;
});

export const markAsRead = createAsyncThunk('messages/markAsRead', async (id) => {
  const response = await axios.patch(`/messages/${id}/mark-read`);
  return response.data;
});

export const markAsUnread = createAsyncThunk('messages/markAsUnread', async (id) => {
  const response = await axios.patch(`/messages/${id}/mark-unread`);
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
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        // Assurer que data est un tableau et mapper StatusRead -> IsRead
        let messages = Array.isArray(action.payload.data)
          ? action.payload.data
          : Array.isArray(action.payload)
          ? action.payload
          : [];
        
        // Mapper StatusRead -> IsRead pour compatibilité frontend
        messages = messages.map((msg) => ({
          ...msg,
          IsRead: msg.StatusRead || msg.IsRead || false
        }));
        
        state.messages = messages;
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
        state.unreadCount = state.messages.filter((m) => !m.IsRead).length;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Send Message
      .addCase(sendMessage.fulfilled, (state, action) => {
        // Ajouter le nouveau message au début de la liste
        if (action.payload.data) {
          state.messages.unshift(action.payload.data);
        } else {
          state.messages.unshift(action.payload);
        }
      })
      
      // Mark as Read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const messageId = action.payload.data?.ID || action.payload.ID;
        const index = state.messages.findIndex((m) => m.ID === messageId);
        if (index !== -1) {
          state.messages[index].IsRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      
      // Mark as Unread
      .addCase(markAsUnread.fulfilled, (state, action) => {
        const messageId = action.payload.data?.ID || action.payload.ID;
        const index = state.messages.findIndex((m) => m.ID === messageId);
        if (index !== -1) {
          state.messages[index].IsRead = false;
          state.unreadCount += 1;
        }
      })
      
      // Delete Message
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const deletedId = action.payload;
        state.messages = state.messages.filter((m) => m.ID !== deletedId);
      });
  },
});

export default messageSlice.reducer;

