const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const path = require('path');
const { CORS_ORIGIN } = require('./config/constants');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

// Créer l'application Express
const app = express();

// Middlewares globaux
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));

// 1. Sécurité HTTP (Headers)
app.use(helmet());

// 2. Protection contre les attaques XSS (Nettoyage des entrées)
app.use(xss());

// 3. Protection contre la pollution des paramètres HTTP
app.use(hpp());

// 4. Parser les cookies pour les tokens HttpOnly
app.use(cookieParser());

// 5. Rate Limiting (Protection Brute Force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre
  message: 'Trop de requêtes effectuées depuis cette adresse IP, réessayez plus tard.'
});
app.use('/api', limiter);

// Limiteur spécifique pour la connexion (plus restrictif)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Max 10 tentatives en 15 minutes
  message: 'Trop de tentatives de connexion, réessayez dans 15 minutes.'
});
app.use('/api/auth/login', loginLimiter);

app.use(express.json({ limit: '10kb' })); // Limite la taille du body pour éviter les attaques DoS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(morgan('dev'));

// Serve static files (profile pictures) with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Le serveur fonctionne correctement',
    timestamp: new Date().toISOString(),
  });
});

// Routes de l'API
app.use('/api', routes);

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route non trouvée',
  });
});

// Middleware de gestion des erreurs
app.use(errorHandler);

module.exports = app;

