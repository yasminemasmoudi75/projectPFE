import axios from 'axios';
import toast from 'react-hot-toast';
import { clearAuthState, setAccessToken } from '../auth/authSlice';

// Instance Axios configurée
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 120000, // 2 minutes pour les uploads volumineux
  withCredentials: true,
});

let refreshPromise = null;
let sessionExpiredToastShown = false;
let requestInterceptorId = null;
let responseInterceptorId = null;
let sessionRedirectInProgress = false;

const AUTH_ROUTES = ['/auth/login', '/auth/refresh-token', '/auth/logout', '/auth/register'];

const isAuthRoute = (url = '') => AUTH_ROUTES.some((route) => url.includes(route));

const extractAccessToken = (responsePayload) => responsePayload?.data?.token || responsePayload?.token || null;

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

const isAccessTokenExpired = (token, bufferInSeconds = 10) => {
  if (!token) {
    return false;
  }

  const payload = decodeJwtPayload(token);
  const expiresAt = Number(payload?.exp || 0) * 1000;

  if (!expiresAt) {
    return true;
  }

  return expiresAt <= Date.now() + bufferInSeconds * 1000;
};

const markSessionExpiredError = (error) => {
  if (error && typeof error === 'object') {
    error.isSessionExpired = true;
  }

  return error;
};

const clearExpiredSession = (store) => {
  const { auth } = store.getState();

  if (auth?.accessToken || auth?.isAuthenticated || auth?.user) {
    store.dispatch(clearAuthState());
  }

  if (!sessionExpiredToastShown) {
    toast.error('Session expirée. Veuillez vous reconnecter.');
    sessionExpiredToastShown = true;
  }

  if (
    typeof window !== 'undefined' &&
    !window.location.pathname.startsWith('/auth/login') &&
    !sessionRedirectInProgress
  ) {
    sessionRedirectInProgress = true;
    window.location.replace('/auth/login');
  }
};

const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = axiosInstance.post('/auth/refresh-token').finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

export const setupAxiosInterceptors = (store) => {
  if (requestInterceptorId !== null) {
    axiosInstance.interceptors.request.eject(requestInterceptorId);
  }

  if (responseInterceptorId !== null) {
    axiosInstance.interceptors.response.eject(responseInterceptorId);
  }

  // Intercepteur de requête - Ajouter le token JWT
  requestInterceptorId = axiosInstance.interceptors.request.use(
    async (config) => {
      if (isAuthRoute(config.url)) {
        return config;
      }

      const state = store.getState();
      let token = state.auth.accessToken;

      if (token && isAccessTokenExpired(token)) {
        try {
          const response = await refreshAccessToken();
          token = extractAccessToken(response);

          if (!token) {
            throw new Error('Aucun token d\'accès retourné par le refresh.');
          }

          store.dispatch(setAccessToken(token));
        } catch (refreshError) {
          clearExpiredSession(store);
          return Promise.reject(markSessionExpiredError(refreshError));
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Intercepteur de réponse - Gérer les erreurs
  responseInterceptorId = axiosInstance.interceptors.response.use(
    (response) => {
      if (isAuthRoute(response.config?.url)) {
        sessionExpiredToastShown = false;
        sessionRedirectInProgress = false;
      }

      // Pour les réponses binaires (download), garder la réponse complète
      const responseType = response.config?.responseType;
      if (responseType === 'blob' || responseType === 'arraybuffer') {
        return response;
      }

      // Retourner directement les données
      return response.data;
    },
    async (error) => {
      const originalRequest = error.config || {};
      const originalUrl = originalRequest.url || '';

      // Erreur 401 - Token expiré
      // Ne pas tenter de refresh si c'est une route d'auth pour éviter les boucles
      const requestTargetsAuthRoute = isAuthRoute(originalUrl);

      if (error.response?.status === 401 && !originalRequest._retry && !requestTargetsAuthRoute) {
        originalRequest._retry = true;

        try {
          const response = await refreshAccessToken();
          const token = extractAccessToken(response);

          if (!token) {
            throw new Error('Aucun token d\'accès retourné par le refresh.');
          }

          store.dispatch(setAccessToken(token));
          originalRequest.headers = {
            ...(originalRequest.headers || {}),
            Authorization: `Bearer ${token}`,
          };

          return axiosInstance(originalRequest);
        } catch (refreshError) {
          clearExpiredSession(store);
          return Promise.reject(markSessionExpiredError(refreshError));
        }
      }

      if (error.response?.status === 401 && originalUrl.includes('/auth/refresh-token')) {
        clearExpiredSession(store);
        return Promise.reject(markSessionExpiredError(error));
      }

      // Erreur 403 - Accès refusé
      if (error.response?.status === 403) {
        toast.error('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
      }

      // Erreur 404 - Ressource non trouvée
      if (error.response?.status === 404) {
        toast.error('Ressource non trouvée.');
      }

      // Erreur 500 - Erreur serveur
      if (error.response?.status >= 500) {
        toast.error('Erreur serveur. Veuillez réessayer plus tard.');
      }

      // Erreur réseau
      if (!error.response) {
        toast.error('Erreur de connexion. Vérifiez votre connexion internet.');
      }

      return Promise.reject(error);
    }
  );
};

export default axiosInstance;

