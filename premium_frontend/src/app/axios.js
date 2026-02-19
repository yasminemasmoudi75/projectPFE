import axios from 'axios';
import { logout } from '../auth/authSlice';
import toast from 'react-hot-toast';

// Instance Axios configurée
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  withCredentials: true, // Crucial pour envoyer/recevoir les cookies HttpOnly
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setupAxiosInterceptors = (store) => {
  // Intercepteur de requête - Ajouter le token JWT
  axiosInstance.interceptors.request.use(
    (config) => {
      const state = store.getState();
      const token = state.auth.accessToken;

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
  axiosInstance.interceptors.response.use(
    (response) => {
      // Retourner directement les données
      return response.data;
    },
    async (error) => {
      const originalRequest = error.config;

      // Erreur 401 - Token expiré
      // Ne pas tenter de refresh si c'est une route d'auth pour éviter les boucles
      const isAuthRoute = originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh-token');

      if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
        originalRequest._retry = true;

        try {
          const state = store.getState();
          const refreshToken = state.auth.refreshToken;

          if (refreshToken) {
            // Tenter de rafraîchir le token
            const response = await axiosInstance.post('/auth/refresh-token', { refreshToken });

            const token = response.data?.data?.token;

            if (token) {
              // Mettre à jour le token dans le store
              store.dispatch({ type: 'auth/setAccessToken', payload: token });

              // Réessayer la requête originale
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axiosInstance(originalRequest);
            }
          }
        } catch (refreshError) {
          // Échec du refresh - Déconnecter l'utilisateur
          store.dispatch(logout());
          toast.error('Session expirée. Veuillez vous reconnecter.');
          return Promise.reject(refreshError);
        }
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

