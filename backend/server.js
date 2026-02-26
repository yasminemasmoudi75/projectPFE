require('dotenv').config();
const app = require('./src/app');
const { testConnection, sequelize } = require('./src/config/database');
const { PORT } = require('./src/config/constants');

// Fonction pour démarrer le serveur
const startServer = async () => {
  try {
    // Tester la connexion à la base de données
    const isConnected = await testConnection();

    if (!isConnected) {
      console.error('❌ Impossible de démarrer le serveur sans connexion à la base de données');
      process.exit(1);
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
  console.error('❌ Erreur non gérée (Promise):', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Erreur non gérée (Exception):', err);
  process.exit(1);
});

