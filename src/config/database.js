const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuration de la connexion à SQL Server
const dbServer = process.env.DB_SERVER || 'localhost';
const [host, instanceName] = dbServer.includes('\\')
  ? dbServer.split('\\')
  : [dbServer, undefined];

console.log(`🔍 Tentative de connexion - Host: ${host}, Instance: ${instanceName || 'Défaut'}`);

// Utiliser authentification Windows si DB_USER est vide
const useWindowsAuth = !process.env.DB_USER || process.env.DB_AUTH_TYPE === 'windows';
console.log(`🔐 Mode d'authentification: ${useWindowsAuth ? 'Windows (Trusted Connection)' : 'SQL Server'}`);

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  useWindowsAuth ? undefined : process.env.DB_USER,
  useWindowsAuth ? undefined : process.env.DB_PASSWORD,
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
