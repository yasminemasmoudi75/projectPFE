const { google } = require('googleapis');
const { GmailOAuthTokens } = require('../models');
const { sequelize } = require('../config/database');

/**
 * Service pour gérer l'authentification Gmail OAuth 2.0
 * Chaque utilisateur doit autoriser l'application une fois
 */

// Configuration OAuth 2.0
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID || '111324977592873307756',
  process.env.GMAIL_CLIENT_SECRET || 'client_secret_ici',
  process.env.GMAIL_REDIRECT_URI || 'http://localhost:3066/api/auth/gmail/callback'
);

const formatDateForSql = (date) => {
  if (!date || Number.isNaN(new Date(date).getTime())) {
    return null;
  }

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Générer l'URL d'autorisation Gmail pour un utilisateur
 */
const getAuthorizationUrl = (userId) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      include_granted_scopes: true,
      prompt: 'consent select_account',
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify'
      ],
      state: userId // Passer l'UserID pour savoir qui s'autorise
    });

    console.log(`✅ URL d'autorisation générée pour UserID: ${userId}`);
    return authUrl;
  } catch (error) {
    console.error('❌ Erreur lors de la génération de l\'URL:', error.message);
    throw error;
  }
};

/**
 * Récupérer et sauvegarder le token après autorisation
 */
const handleAuthorizationCallback = async (code, userId) => {
  try {
    // Forcer userId en nombre entier
    userId = parseInt(userId);
    console.log(`🔄 Récupération du token pour UserID: ${userId} (type: ${typeof userId})`);

    // Récupérer le token
    const { tokens } = await oauth2Client.getToken(code);
    console.log('✅ Token OAuth reçu:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      hasExpiryDate: !!tokens.expiry_date,
    });

    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({
      version: 'v1',
      auth: oauth2Client,
    });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const gmailEmail = profile.data.emailAddress || null;
    const currentHistoryId = profile.data.historyId ? String(profile.data.historyId) : null;

    // Vérifier si un token existe déjà
    const existingToken = await sequelize.query(
      `SELECT ID FROM GmailOAuthTokens WHERE UserID = ${userId}`,
      { raw: true, type: sequelize.QueryTypes.SELECT }
    );

    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token || null;
    
    if (existingToken && existingToken.length > 0) {
      // Mise à jour SQL brute
      console.log(`🔄 Mise à jour du token pour UserID: ${userId}`);
      const refreshTokenSQL = refreshToken ? `'${refreshToken.replace(/'/g, "''")}'` : 'NULL';
      await sequelize.query(
        `UPDATE GmailOAuthTokens 
         SET AccessToken = '${accessToken.replace(/'/g, "''")}'
             , RefreshToken = ${refreshTokenSQL}
             , IsActive = 1
             , GmailEmail = ${gmailEmail ? `'${gmailEmail.replace(/'/g, "''")}'` : 'NULL'}
             , LastHistoryId = NULL
             , LastSyncAt = GETDATE()
             , UpdatedAt = GETDATE()
         WHERE UserID = ${userId}`,
        { raw: true }
      );
      console.log(`✅ Token mis à jour pour UserID: ${userId}`);
    } else {
      // Création SQL brute - Désactiver FK constraint temporairement
      console.log(`🔄 Création du token pour UserID: ${userId}`);
      const refreshTokenSQL = refreshToken ? `'${refreshToken.replace(/'/g, "''")}'` : 'NULL';
      
      // Désactiver la FK temporairement (nom réel dans la base AA)
      await sequelize.query(`ALTER TABLE GmailOAuthTokens NOCHECK CONSTRAINT "FK__GmailOAut__UserI__75851133"`, { raw: true }).catch(() => {});

      await sequelize.query(
        `INSERT INTO GmailOAuthTokens (UserID, AccessToken, RefreshToken, IsActive, GmailEmail, LastHistoryId, LastSyncAt, CreatedAt, UpdatedAt)
         VALUES (${userId}, '${accessToken.replace(/'/g, "''")}', ${refreshTokenSQL}, 1, ${gmailEmail ? `'${gmailEmail.replace(/'/g, "''")}'` : 'NULL'}, NULL, GETDATE(), GETDATE(), GETDATE())`,
        { raw: true }
      );

      await sequelize.query(`ALTER TABLE GmailOAuthTokens WITH CHECK CHECK CONSTRAINT "FK__GmailOAut__UserI__75851133"`, { raw: true }).catch(() => {});
      
      console.log(`✅ Token créé pour UserID: ${userId}`);
    }

    // Mettre à jour TokenExpiry après création/update si expiry_date existe
    if (tokens.expiry_date) {
      const expiryDate = new Date(parseInt(tokens.expiry_date));
      const year = expiryDate.getFullYear();
      const month = String(expiryDate.getMonth() + 1).padStart(2, '0');
      const day = String(expiryDate.getDate()).padStart(2, '0');
      const hours = String(expiryDate.getHours()).padStart(2, '0');
      const minutes = String(expiryDate.getMinutes()).padStart(2, '0');
      const seconds = String(expiryDate.getSeconds()).padStart(2, '0');
      const expiryFormatted = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      await sequelize.query(
        `UPDATE GmailOAuthTokens SET TokenExpiry = '${expiryFormatted}' WHERE UserID = ${userId}`,
        { raw: true }
      );
      console.log(`📅 Token expiry défini: ${expiryFormatted}`);
    }

    return {
      success: true,
      userId,
      message: 'Autorisation réussie!'
    };
  } catch (error) {
    console.error('❌ Erreur lors du callback:', error.message);
    const oauthDetails = error.response?.data || error.errors || null;
    if (oauthDetails) {
      console.error('❌ Détails Google OAuth:', JSON.stringify(oauthDetails));
    }
    console.error('Stack:', error.stack);

    const wrappedError = new Error(
      oauthDetails?.error_description || oauthDetails?.error || error.message || 'Erreur OAuth inconnue'
    );
    wrappedError.oauthDetails = oauthDetails;
    throw wrappedError;
  }
};

/**
 * Obtenir le client Gmail authentifié pour un utilisateur
 */
const getGmailClientForUser = async (userId) => {
  try {
    // Récupérer le token de l'utilisateur
    const tokenRecord = await GmailOAuthTokens.findOne({
      where: {
        UserID: userId,
        IsActive: 1
      }
    });

    if (!tokenRecord) {
      throw new Error(`Aucun token trouvé pour UserID: ${userId}. L'utilisateur doit d'abord autoriser l'application.`);
    }

    // Vérifier si le token a expiré
    if (tokenRecord.TokenExpiry && new Date() > new Date(tokenRecord.TokenExpiry)) {
      console.log(`⚠️ Token expiré pour UserID: ${userId}, tentative de refresh...`);
      await refreshTokenForUser(userId);
      // Récupérer le nouveau token
      const newTokenRecord = await GmailOAuthTokens.findOne({
        where: { UserID: userId, IsActive: 1 }
      });
      tokenRecord.AccessToken = newTokenRecord.AccessToken;
    }

    // Configurer le client OAuth2
    oauth2Client.setCredentials({
      access_token: tokenRecord.AccessToken,
      refresh_token: tokenRecord.RefreshToken
    });

    // Créer le client Gmail
    const gmail = google.gmail({
      version: 'v1',
      auth: oauth2Client
    });

    return gmail;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération du client Gmail:`, error.message);
    throw error;
  }
};

/**
 * Rafraîchir le token d'un utilisateur
 */
const refreshTokenForUser = async (userId) => {
  try {
    const tokenRecord = await GmailOAuthTokens.findOne({
      where: { UserID: userId }
    });

    if (!tokenRecord || !tokenRecord.RefreshToken) {
      throw new Error('Pas de RefreshToken trouvé');
    }

    oauth2Client.setCredentials({
      refresh_token: tokenRecord.RefreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    const accessToken = (credentials.access_token || '').replace(/'/g, "''");
    const tokenExpiryFormatted = credentials.expiry_date
      ? formatDateForSql(new Date(credentials.expiry_date))
      : null;

    await sequelize.query(
      `UPDATE GmailOAuthTokens
       SET AccessToken = '${accessToken}',
           TokenExpiry = ${tokenExpiryFormatted ? `'${tokenExpiryFormatted}'` : 'NULL'},
           UpdatedAt = GETDATE()
       WHERE UserID = ${parseInt(userId, 10)}`,
      { raw: true }
    );

    console.log(`✅ Token rafraîchi pour UserID: ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors du refresh du token:', error.message);
    throw error;
  }
};

/**
 * Vérifier si un utilisateur est autorisé
 */
const isUserAuthorized = async (userId) => {
  try {
    const tokenRecord = await GmailOAuthTokens.findOne({
      where: {
        UserID: userId,
        IsActive: 1
      }
    });

    return !!tokenRecord;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    return false;
  }
};

/**
 * Révoquer l'autorisation d'un utilisateur
 */
const revokeUserAuthorization = async (userId) => {
  try {
    const tokenRecord = await GmailOAuthTokens.findOne({
      where: { UserID: userId }
    });

    if (tokenRecord) {
      await tokenRecord.update({ IsActive: 0 });
      console.log(`✅ Autorisation révoquée pour UserID: ${userId}`);
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la révocation:', error.message);
    throw error;
  }
};

/**
 * Tester la connexion Gmail pour un utilisateur
 */
const testGmailConnection = async (userId) => {
  try {
    console.log(`🔄 Test de connexion Gmail pour UserID: ${userId}`);

    const gmail = await getGmailClientForUser(userId);
    const profile = await gmail.users.getProfile({ userId: 'me' });

    console.log(`✅ Connexion réussie! Email: ${profile.data.emailAddress}`);
    return {
      success: true,
      email: profile.data.emailAddress,
      messagesTotal: profile.data.messagesTotal
    };
  } catch (error) {
    console.error('❌ Échec du test:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Initialiser le service Gmail OAuth 2.0
 * Pour OAuth 2.0, aucune initialisation globale n'est nécessaire
 * Les tokens sont gérés per-user lors de l'autorisation
 */
const initializeGmailAuth = () => {
  console.log('✅ Gmail OAuth 2.0 service initialized');
  console.log('📧 Waiting for users to authorize their Gmail accounts...');
  return true;
};

module.exports = {
  initializeGmailAuth,
  getAuthorizationUrl,
  handleAuthorizationCallback,
  getGmailClientForUser,
  refreshTokenForUser,
  isUserAuthorized,
  revokeUserAuthorization,
  testGmailConnection,
  oauth2Client
};
