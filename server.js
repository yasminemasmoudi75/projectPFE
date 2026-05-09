require('dotenv').config();
const app = require('./src/app');
const { testConnection, sequelize } = require('./src/config/database');
const { PORT } = require('./src/config/constants');
const { verifyAuthEmailTransport } = require('./src/utils/emailService');
const models = require('./src/models');

// Import des services Gmail
const { initializeGmailAuth } = require('./src/services/gmailAuthService');
const { startGmailSyncJob } = require('./src/services/gmailSyncJob');

// Routes de debug
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/debug', require('./debug_routes'));
}

// Fonction pour démarrer le serveur
const startServer = async () => {
  try {
    // Tester la connexion à la base de données
    const isConnected = await testConnection();

    if (!isConnected) {
// Exposer les modèles aux routes qui en ont besoin
app.locals.models = models;

      console.error('❌ Impossible de démarrer le serveur sans connexion à la base de données');
      process.exit(1);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALISATION EMAIL D'AUTHENTIFICATION CLIENT (SMTP DÉDIÉ)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n🔐 ═══════════════════════════════════════════════════════════');
    console.log('🔐 Validation service email d\'authentification...');
    console.log('🔐 ═══════════════════════════════════════════════════════════\n');

    try {
      const authMailCheck = await verifyAuthEmailTransport();
      if (authMailCheck.ok) {
        console.log('✅ Service email d\'authentification: OK\n');
      } else {
        console.warn('⚠️ Service email d\'authentification: KO');
        console.warn(`⚠️ Cause: ${authMailCheck.reason}`);
        console.warn('⚠️ La création client continue, mais l\'envoi automatique des identifiants peut échouer.\n');
      }
    } catch (authMailError) {
      console.warn('⚠️ Erreur validation service email d\'authentification:', authMailError.message);
      console.warn('⚠️ La création client continue, mais l\'envoi automatique des identifiants peut échouer.\n');
    }

    // Synchroniser les modèles avec la base de données (désactivé car tables déjà créées)
    // Si vous avez besoin de synchroniser, décommentez le code ci-dessous
    /*
    try {
      console.log('🔄 Synchronisation des modèles avec la base de données...');
      await sequelize.sync({ alter: false });
      console.log('✅ Synchronisation réussie');
    } catch (syncError) {
      console.warn('⚠️ Erreur lors de la synchronisation:', syncError.message);
      // Ne pas arrêter le serveur, les tables peuvent déjà exister
    }
    */

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALISATION GMAIL
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n📧 ═══════════════════════════════════════════════════════════');
    console.log('📧 Initialisation du service Gmail...');
    console.log('📧 ═══════════════════════════════════════════════════════════\n');

    try {
      initializeGmailAuth();
      
      // OAuth 2.0 n'a pas besoin de test global (tokens sont créés per-user)
      // Démarrer le cron job de synchronisation
      console.log('✅ Service Gmail initialisé avec succès\n');
      startGmailSyncJob();
      console.log('✅ Gmail Sync Cron Job démarré\n');
    } catch (gmailError) {
      console.warn('⚠️ Erreur lors de l\'initialisation Gmail:', gmailError.message);
      console.log('⚠️ Le serveur peut continuer sans Gmail, mais les emails ne seront pas synchronisés\n');
    }

    // Démarrer le serveur Express
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📍 Environnement: ${process.env.NODE_ENV}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

// Démarrer le serveur
startServer();

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  const fs = require('fs');
  const log = `\n[${new Date().toISOString()}] ❌ Unhandled Rejection: ${err.stack || err}\n`;
  fs.appendFileSync('crash_log.txt', log);
  console.error(log);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  const fs = require('fs');
  const log = `\n[${new Date().toISOString()}] ❌ Uncaught Exception: ${err.stack || err}\n`;
  fs.appendFileSync('crash_log.txt', log);
  console.error(log);
  process.exit(1);
});

