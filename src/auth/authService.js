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
    return await axios.get('/auth/me');
  },

  /**
   * Mettre à jour le profil
   */
  updateProfile: async (data) => {
    return await axios.put('/auth/profile', data);
  },

  /**
   * Changer le mot de passe
   */
  changePassword: async (data) => {
    return await axios.put('/auth/change-password', data);
  },
};

export default authService;
