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
const contactsRoutes = require('./contacts.routes');
const productsRoutes = require('./products.routes');
const stockRoutes = require('./stock.routes');
const categoriesRoutes = require('./categories.routes');
const bcvRoutes = require('./bcv.routes');
const reclamationsRoutes = require('./reclamations.routes');
const tiersClasseRoutes = require('./tiersClasseRoutes');
const tiersGouvernoratRoutes = require('./tiersGouvernoratRoutes');
const tiersCategorieRoutes = require('./tiersCategorieRoutes');
const blvRoutes = require('./blvRoutes');
const favRoutes = require('./favRoutes');
const mouvementRoutes = require('./mouvementRoutes'); // ✅ Routes pour MvtDocs - Mouvements

// Utiliser les routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/devis', devisRoutes);
router.use('/objectifs', objectifsRoutes);
router.use('/projets', projetsRoutes);
router.use('/activites', activitesRoutes);
router.use('/messages', messagesRoutes);
router.use('/tiers', tiersRoutes);
router.use('/contacts', contactsRoutes);
router.use('/products', productsRoutes);
router.use('/stock', stockRoutes);
router.use('/categories', categoriesRoutes);
router.use('/bcv', bcvRoutes);
router.use('/reclamations', reclamationsRoutes);
router.use('/tiers-classes', tiersClasseRoutes);
router.use('/tiers-gouvernorats', tiersGouvernoratRoutes);
router.use('/tiers-categories', tiersCategorieRoutes);
router.use('/blv', blvRoutes);
router.use('/fav', favRoutes);
router.use('/mouvements', mouvementRoutes); // ✅ Historique des transformations

// Route de base de l'API
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'API Backend PFE',
    version: '1.0.3',
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

