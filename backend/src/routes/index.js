const express = require('express');
const router = express.Router();

// Importer les routes
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const devisRoutes = require('./devis.routes');
const objectifsRoutes = require('./objectifs.routes');
const projetsRoutes = require('./projets.routes');
const activitesRoutes = require('./activites.routes');
const messagesRoutes = require('./messages.routes');
const tiersRoutes = require('./tiers.routes');

// Utiliser les routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/devis', devisRoutes);
router.use('/objectifs', objectifsRoutes);
router.use('/projets', projetsRoutes);
router.use('/activites', activitesRoutes);
router.use('/messages', messagesRoutes);
router.use('/tiers', tiersRoutes);

// Route de base de l'API
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'API Backend PFE',
    version: '1.0.1',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      tiers: '/api/tiers',
      devis: '/api/devis',
      objectifs: '/api/objectifs',
      projets: '/api/projets',
      activites: '/api/activites',
      messages: '/api/messages',
    },
  });
});

module.exports = router;

