const express = require('express');
const router = express.Router();
const { Notification } = require('../models');
const { protect } = require('../middleware/auth');

// Récupérer les notifications de l'utilisateur
router.get('/', protect, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const notifications = await Notification.findAll({
      where: { RecipientID: req.user.UserID },
      order: [['CreatedAt', 'DESC']],
      limit
    });

    res.status(200).json({
      status: 'success',
      data: notifications
    });
  } catch (error) {
    next(error);
  }
});

// Marquer une notification comme lue
router.patch('/:id/read', protect, async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      where: { ID: req.params.id, RecipientID: req.user.UserID }
    });

    if (!notification) {
      return res.status(404).json({ status: 'error', message: 'Notification non trouvée' });
    }

    await notification.update({ IsRead: true });

    res.status(200).json({ status: 'success', data: notification });
  } catch (error) {
    next(error);
  }
});

// Marquer toutes les notifications comme lues
router.post('/read-all', protect, async (req, res, next) => {
  try {
    await Notification.update(
      { IsRead: true },
      { where: { RecipientID: req.user.UserID, IsRead: false } }
    );

    res.status(200).json({ status: 'success', message: 'Toutes les notifications marquées comme lues' });
  } catch (error) {
    next(error);
  }
});

// DELETE /notifications/:id — supprimer une notification
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      where: { ID: req.params.id, RecipientID: req.user.UserID }
    });
    if (!notification) {
      return res.status(404).json({ status: 'error', message: 'Notification non trouvée' });
    }
    await notification.destroy();
    res.status(200).json({ status: 'success' });
  } catch (error) {
    next(error);
  }
});

// POST /notifications/notify-decision — admin informe le commercial de la décision
router.post('/notify-decision', protect, async (req, res, next) => {
  try {
    const normalizedRole = String(req.user?.UserRole || '').toLowerCase();
    const isAdmin = ['admin', 'administrateur'].includes(normalizedRole);
    if (!isAdmin) return res.status(403).json({ status: 'error', message: 'Accès réservé aux administrateurs' });

    const { recipientId, sourceType, sourceNf, targetType, decision, newDocGuid } = req.body;
    if (!recipientId) return res.status(400).json({ status: 'error', message: 'recipientId requis' });

    const { notifyTransformDecision } = require('../utils/notificationUtils');
    await notifyTransformDecision({ recipientId: Number(recipientId), sourceType, sourceNf, targetType, decision, docGuid: newDocGuid });

    res.json({ status: 'success' });
  } catch (err) {
    next(err);
  }
});

// GET /notifications/pending-transforms — demandes de transformation non traitées (admin)
router.get('/pending-transforms', protect, async (req, res, next) => {
  try {
    const isAdmin = String(req.user?.UserRole || '').toLowerCase() === 'admin';
    if (!isAdmin) return res.status(403).json({ status: 'error', message: 'Accès réservé aux administrateurs' });

    const { Op } = require('sequelize');
    const pending = await Notification.findAll({
      where: {
        RecipientID: req.user.UserID,
        Type: 'TRANSFORM_REQUEST',
        IsRead: false
      },
      order: [['CreatedAt', 'DESC']]
    });

    const parsed = pending.map(n => {
      let payload = null;
      try { payload = JSON.parse(n.Message); } catch (_) {}
      return { id: n.ID, title: n.Title, createdAt: n.CreatedAt, payload };
    });

    res.json({ status: 'success', count: parsed.length, data: parsed });
  } catch (err) {
    next(err);
  }
});

// Récupérer les notifications d'un utilisateur précis
router.get('/:userId', protect, async (req, res, next) => {
  try {
    const requestedUserId = Number(req.params.userId);
    const currentUserId = Number(req.user?.UserID);
    const isAdmin = String(req.user?.UserRole || '').toLowerCase() === 'admin';

    if (!Number.isInteger(requestedUserId) || requestedUserId <= 0) {
      return res.status(400).json({ status: 'error', message: 'Utilisateur invalide' });
    }

    if (!isAdmin && requestedUserId !== currentUserId) {
      return res.status(403).json({ status: 'error', message: 'Accès refusé' });
    }

    const limit = parseInt(req.query.limit, 10) || 20;
    const notifications = await Notification.findAll({
      where: { RecipientID: requestedUserId },
      order: [['CreatedAt', 'DESC']],
      limit
    });

    res.status(200).json({
      status: 'success',
      data: notifications
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
