import axios from '../app/axios';

const authService = {
  /**
   * Connexion utilisateur
   */
  login: async (credentials) => {
    // credentials expected: { EmailPro, Password }
    const response = await axios.post('/auth/login', credentials);
    return response;
  },

  /**
   * Déconnexion utilisateur
   */
  logout: async () => {
    return await axios.post('/auth/logout');
  },

  /**
   * Inscription utilisateur
   */
  register: async (userData) => {
    // userData expected: { LoginName, Password, FullName, EmailPro, UserRole, DateNaissance }
    const response = await axios.post('/auth/register', userData);
    return response;
  },

  /**
   * Rafraîchir le token d'accès
   */
  refreshToken: async () => {
    const response = await axios.post('/auth/refresh-token');
    return response;
  },

  /**
   * Récupérer le profil utilisateur
   */
  getProfile: async () => {
    const response = await axios.get('/auth/me');
    return response.data;
  },

  /**
   * Mettre à jour le profil
   */
  updateProfile: async (data) => {
    // If data contains a file, send as FormData, otherwise as JSON
    const isFormData = data instanceof FormData;
    const response = await axios.put('/auth/profile', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    return response.data;
  },

  /**
   * Changer le mot de passe
   */
  changePassword: async (data) => {
    return await axios.put('/auth/change-password', data);
  },
};

export default authService;
