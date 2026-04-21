const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAuthorizationUrl,
  handleAuthorizationCallback,
  isUserAuthorized,
  revokeUserAuthorization,
  testGmailConnection
} = require('../services/gmailAuthService');

const resolveFrontendBaseUrl = () => {
  const rawUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
};

/**
 * ═══════════════════════════════════════════════════════════════════════
 * ROUTES: Gmail OAuth 2.0 Authentication
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * ÉTAPE 1: Générer l'URL d'autorisation et rediriger vers Google
 * GET /api/auth/gmail/authorize?userId=14
 * 
 * Utilisateur clique sur "Connecter Gmail" → Redirige vers Google OAuth
 * Note: Pas besoin d'authentification car userID est fourni en query param
 */
router.get('/authorize', (req, res, next) => {
  try {
    // Récupérer l'userID du JWT ou du query param
    let userId = req.query.userId;
    
    // Si fourni en JWT (via protect), utiliser req.user
    if (!userId && req.user && req.user.UserID) {
      userId = req.user.UserID;
    }

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'UserID manquant. Veuillez vous reconnecter.'
      });
    }

    console.log(`🔐 Demande d'autorisation Gmail par UserID: ${userId}`);

    // Générer l'URL d'autorisation
    const authUrl = getAuthorizationUrl(userId);

    // Rediriger vers Google OAuth
    res.redirect(authUrl);
  } catch (error) {
    console.error('❌ Erreur lors de la génération de l\'URL:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la génération de l\'URL d\'autorisation',
      error: error.message
    });
  }
});

/**
 * ÉTAPE 1b: Générer l'URL d'autorisation (endpoint pour axios)
 * GET /api/auth/gmail/authorize-url
 * 
 * Retourne juste l'URL sans rediriger (pour appels axios depuis le frontend)
 */
router.get('/authorize-url', protect, (req, res, next) => {
  try {
    if (!req.user || !req.user.UserID) {
      console.warn('❌ Pas d\'utilisateur trouvé dans req.user');
      return res.status(401).json({
        status: 'error',
        message: 'Utilisateur non authentifié'
      });
    }

    console.log(`🔐 Demande d'URL d'autorisation Gmail par UserID: ${req.user.UserID}`);

    // Générer l'URL d'autorisation
    const authUrl = getAuthorizationUrl(req.user.UserID);
    
    console.log(`✅ URL d'autorisation générée:`, authUrl?.substring(0, 50) + '...');

    if (!authUrl || typeof authUrl !== 'string') {
      console.error('❌ AuthUrl invalide:', authUrl);
      throw new Error('URL d\'autorisation invalide');
    }

    const responseData = {
      status: 'success',
      data: {
        authUrl: authUrl
      }
    };
    
    console.log('📤 Réponse envoyée au frontend:', JSON.stringify(responseData).substring(0, 100) + '...');

    res.json(responseData);
  } catch (error) {
    console.error('❌ Erreur lors de la génération de l\'URL:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la génération de l\'URL d\'autorisation',
      error: error.message
    });
  }
});

/**
 * DEBUG: Endpoint de test sans authentification
 * GET /api/auth/gmail/test-url?userId=14
 */
router.get('/test-url', (req, res, next) => {
  try {
    const userId = req.query.userId || '14';
    console.log(`🧪 TEST: Demande d'URL pour UserID: ${userId}`);
    
    const authUrl = getAuthorizationUrl(userId);
    console.log(`✅ URL générée pour test:`, authUrl?.substring(0, 50) + '...');

    res.json({
      status: 'success',
      userId,
      authUrl
    });
  } catch (error) {
    console.error('❌ Erreur test:', error.message);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

/**
 * ÉTAPE 2: Callback Google → Récupérer et sauvegarder le token
 * GET /api/auth/gmail/callback?code=xxx&state=userId
 * 
 * Google redirige ici avec le code d'autorisation → On échange contre un token
 */
router.get('/callback', async (req, res, next) => {
  try {
    const {
      code,
      state,
      error: oauthError,
      error_description: oauthErrorDescription,
      scope,
    } = req.query;
    const userId = state;

    console.log(`🔄 Callback OAuth reçu pour UserID: ${userId}`);
    console.log('🔎 Callback query résumé:', {
      hasCode: !!code,
      hasState: !!state,
      oauthError: oauthError || null,
      oauthErrorDescription: oauthErrorDescription || null,
      scope: scope || null,
    });

    if (oauthError) {
      const oauthMessage = oauthErrorDescription
        ? `${oauthError} - ${oauthErrorDescription}`
        : oauthError;

      console.error(`❌ OAuth callback error from Google: ${oauthMessage}`);
      const frontendBaseUrl = resolveFrontendBaseUrl();
      return res.redirect(
        `${frontendBaseUrl}/messages?auth=error&message=${encodeURIComponent(oauthMessage)}`
      );
    }

    if (!code || !userId) {
      return res.status(400).json({
        status: 'error',
        message: 'Code ou UserID manquant'
      });
    }

    // Échanger le code contre un token et sauvegarder en DB
    const result = await handleAuthorizationCallback(code, userId);

    console.log(`✅ Autorisation réussie pour UserID: ${userId}`);

    // Rediriger vers le frontend avec succès
    const frontendBaseUrl = resolveFrontendBaseUrl();
    res.redirect(`${frontendBaseUrl}/messages?auth=success`);
  } catch (error) {
    console.error('❌ Erreur lors du callback:', error.message);
    if (error.oauthDetails) {
      console.error('❌ Détails OAuth:', JSON.stringify(error.oauthDetails));
    }

    // Rediriger vers le frontend avec erreur
    const frontendBaseUrl = resolveFrontendBaseUrl();
    res.redirect(
      `${frontendBaseUrl}/messages?auth=error&message=${encodeURIComponent(error.message)}`
    );
  }
});

/**
 * Vérifier l'état d'autorisation de l'utilisateur
 * GET /api/auth/gmail/status
 * 
 * Retourne : { authorized: true/false, email: "xxx@gmail.com" }
 */
router.get('/status', protect, async (req, res, next) => {
  try {
    if (!req.user || !req.user.UserID) {
      return res.status(401).json({
        status: 'error',
        message: 'Utilisateur non authentifié'
      });
    }

    const authorized = await isUserAuthorized(req.user.UserID);

    if (!authorized) {
      return res.json({
        status: 'success',
        data: {
          authorized: false,
          message: 'Utilisateur non autorisé. Cliquez sur "Connecter Gmail" pour autoriser.'
        }
      });
    }

    res.json({
      status: 'success',
      data: {
        authorized: true,
        message: 'Utilisateur autorisé avec Gmail'
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du statut:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la vérification du statut',
      error: error.message
    });
  }
});

/**
 * Révoquer l'autorisation Gmail
 * POST /api/auth/gmail/revoke
 * 
 * Supprime le token → L'utilisateur devra re-autoriser pour utiliser Gmail
 */
router.post('/revoke', protect, async (req, res, next) => {
  try {
    if (!req.user || !req.user.UserID) {
      return res.status(401).json({
        status: 'error',
        message: 'Utilisateur non authentifié'
      });
    }

    console.log(`🔐 Révocation d'autorisation pour UserID: ${req.user.UserID}`);

    await revokeUserAuthorization(req.user.UserID);

    res.json({
      status: 'success',
      message: 'Autorisation Gmail révoquée',
      data: { authorized: false }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la révocation:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la révocation',
      error: error.message
    });
  }
});

/**
 * Tester la connexion Gmail
 * POST /api/auth/gmail/test
 * 
 * Vérifie que le token fonctionne et retourne les infos du compte Gmail
 */
router.post('/test', protect, async (req, res, next) => {
  try {
    if (!req.user || !req.user.UserID) {
      return res.status(401).json({
        status: 'error',
        message: 'Utilisateur non authentifié'
      });
    }

    console.log(`🔄 Test de connexion Gmail pour UserID: ${req.user.UserID}`);

    const result = await testGmailConnection(req.user.UserID);

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Test de connexion échoué',
        error: result.error
      });
    }

    res.json({
      status: 'success',
      message: 'Connexion Gmail réussie',
      data: {
        email: result.email,
        messagesTotal: result.messagesTotal
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors du test',
      error: error.message
    });
  }
});

module.exports = router;
