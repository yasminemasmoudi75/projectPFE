const { google } = require('googleapis');

// Reusing credentials from .env, with a specific redirect URI for LOGIN
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID || '111324977592873307756',
  process.env.GMAIL_CLIENT_SECRET || 'client_secret_ici',
  process.env.GOOGLE_LOGIN_REDIRECT_URI || 'http://localhost:3066/api/auth/google/callback'
);

/**
 * Générer l'URL d'authentification Google pour le LOGIN
 */
const getGoogleLoginUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'select_account'
  });
};

/**
 * Vérifier le code et récupérer le profil utilisateur
 */
const getGoogleProfile = async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });
    
    const { data } = await oauth2.userinfo.get();
    return data; // { id, email, verified_email, name, given_name, family_name, picture, locale }
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du profil Google:', error.message);
    throw error;
  }
};

module.exports = {
  getGoogleLoginUrl,
  getGoogleProfile
};
