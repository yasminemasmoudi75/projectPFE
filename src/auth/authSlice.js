import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from './authService';

const clearPersistedAuth = () => {
  localStorage.removeItem('accessToken');
};

const extractUserFromPayload = (payload) => payload?.data?.user || payload?.user || payload?.data || payload || null;

const extractTokenFromPayload = (payload) => payload?.data?.token || payload?.token || null;

const decodeJwtPayload = (token) => {
  try {
    const payload = token?.split('.')?.[1];

    if (!payload) {
      return null;
    }

    const normalizedPayload = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payload.length / 4) * 4, '=');

    return JSON.parse(atob(normalizedPayload));
  } catch {
    return null;
  }
};

const isAccessTokenValid = (token) => {
  if (!token) {
    return false;
  }

  const payload = decodeJwtPayload(token);
  const expiresAt = Number(payload?.exp || 0) * 1000;

  return Boolean(expiresAt) && expiresAt > Date.now();
};

const getPersistedAccessToken = () => {
  const storedToken = localStorage.getItem('accessToken');

  if (!isAccessTokenValid(storedToken)) {
    clearPersistedAuth();
    return null;
  }

  return storedToken;
};

const resetAuthState = (state) => {
  state.user = null;
  state.accessToken = null;
  state.isAuthenticated = false;
  state.loading = false;
  state.error = null;
  clearPersistedAuth();
};

// État initial
const persistedAccessToken = getPersistedAccessToken();

const initialState = {
  user: null,
  accessToken: persistedAccessToken,
  isAuthenticated: !!persistedAccessToken,
  loading: false,
  error: null,
};

// Actions asynchrones
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);

      if (!isAccessTokenValid(extractTokenFromPayload(response))) {
        return rejectWithValue('Réponse de connexion invalide. Veuillez réessayer.');
      }

      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur de connexion');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async (_, { getState }) => {
  const userId = getState().auth?.user?.UserID;
  await authService.logout(userId);
});

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getProfile();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur de récupération du profil');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur de mise à jour du profil');
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccessToken: (state, action) => {
      const nextToken = isAccessTokenValid(action.payload) ? action.payload : null;

      state.accessToken = nextToken;
      state.isAuthenticated = !!nextToken;

      if (nextToken) {
        localStorage.setItem('accessToken', nextToken);
      } else {
        state.user = null;
        clearPersistedAuth();
      }
    },
    clearAuthState: (state) => {
      resetAuthState(state);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        const token = extractTokenFromPayload(action.payload);
        const user = extractUserFromPayload(action.payload);

        if (!isAccessTokenValid(token)) {
          resetAuthState(state);
          state.error = 'Réponse de connexion invalide. Veuillez réessayer.';
          return;
        }

        state.loading = false;
        state.error = null;
        state.isAuthenticated = !!token;
        state.user = user;
        state.accessToken = token;

        // Sauvegarder dans localStorage (Uniquement l'accessToken)
        if (token) {
          localStorage.setItem('accessToken', token);
        } else {
          clearPersistedAuth();
        }
      })
      .addCase(login.rejected, (state, action) => {
        resetAuthState(state);
        state.error = action.payload;
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        resetAuthState(state);
      })
      .addCase(logout.rejected, (state) => {
        resetAuthState(state);
      })

      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.user = extractUserFromPayload(action.payload);
      })
      .addCase(getProfile.rejected, (state) => {
        resetAuthState(state);
      })

      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.user = extractUserFromPayload(action.payload);
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setAccessToken, clearAuthState, clearError } = authSlice.actions;
export default authSlice.reducer;

