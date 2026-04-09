const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuration de la connexion à SQL Server
const dbServer = process.env.DB_SERVER || 'localhost';
const [host, instanceName] = dbServer.includes('\\')
  ? dbServer.split('\\')
  : [dbServer, undefined];

console.log(`🔍 Configuration DB:`);
console.log(`   - Host: ${host}`);
console.log(`   - Port: ${process.env.DB_PORT || 1433}`);
console.log(`   - Database: ${process.env.DB_DATABASE}`);
console.log(`   - User: ${process.env.DB_USER || '(Windows Auth)'}`);
console.log(`   - Instance: ${instanceName || 'Défaut'}`);

// ✅ FIXÉ: Force SQL Server Auth si credentials fournis dans .env
const useWindowsAuth = process.env.DB_AUTH_TYPE === 'windows' && !process.env.DB_USER;
console.log(`🔐 Mode d'authentification: ${useWindowsAuth ? 'Windows (Trusted Connection)' : 'SQL Server (User/Password)'}`);

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  useWindowsAuth ? undefined : (process.env.DB_USER || 'sa'),
  useWindowsAuth ? undefined : (process.env.DB_PASSWORD || ''),
  {
    host: host,
    port: parseInt(process.env.DB_PORT) || 1433,
    dialect: 'mssql',
    dialectOptions: {
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        instanceName: instanceName,
        useUTC: false,
        ...(useWindowsAuth && { authentication: { type: 'default' } }),
      },
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: false
    },
    // Désactiver les logs SQL sauf pour les erreurs
    logging: false,
    // Alternative: afficher seulement les requêtes importantes
    // logging: (msg) => {
    //   if (!msg.includes('INFORMATION_SCHEMA') && !msg.includes('sp_helpindex')) {
    //     console.log(msg);
    //   }
    // },
  }
);

// Fonction pour tester la connexion
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à SQL Server réussie !');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à SQL Server:', error.message);
    return false;
  }
};

module.exports = { sequelize, testConnection };
