const { Activite, User, Tiers, Projet } = require('../models');
const { sanitizeDate, formatDateForMSSQL } = require('../utils/helpers');

/**
 * Créer une nouvelle activité
 */
exports.createActivite = async (req, res, next) => {
  try {
    const {
      ID_Utilisateur,
      IDTiers,
      ID_Projet,
      Type_Activite,
      Description,
      Date_Activite,
      Statut
    } = req.body;

    // Validation
    if (!Type_Activite || !Date_Activite) {
      return res.status(400).json({
        status: 'error',
        message: 'Le type de l\'activité et la date sont obligatoires'
      });
    }

    const sanitizedDate = sanitizeDate(Date_Activite);
    if (!sanitizedDate) {
      return res.status(400).json({
        status: 'error',
        message: 'La date fournie est invalide'
      });
    }

    const newActivite = await Activite.create({
      ID_Utilisateur: ID_Utilisateur || (req.user ? req.user.UserID : null),
      IDTiers: IDTiers || null,
      ID_Projet: ID_Projet || null,
      Type_Activite,
      Description,
      Date_Activite: sanitizedDate,
      Statut: Statut || 'Planifié'
    });

    res.status(201).json({
      status: 'success',
      message: 'Activité créée avec succès',
      data: newActivite
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer toutes les activités avec filtres et pagination
 */
exports.getAllActivites = async (req, res, next) => {
  try {
    const { userId, projetId, tierId, type } = req.query;
    const where = {};

    // Filtres optionnels pour Postman
    if (userId) where.ID_Utilisateur = userId;
    if (projetId) where.ID_Projet = projetId;
    if (tierId) where.IDTiers = tierId;
    if (type) where.Type_Activite = type;

    const activites = await Activite.findAll({
      where,
      include: [
        {
          model: User,
          as: 'utilisateur',
          attributes: ['UserID', 'FullName'] // Vérifiez que FullName existe dans Sec_Users
        },
        {
          model: Tiers,
          as: 'tiers',
          attributes: ['IDTiers', 'Raisoc'] // 'Raisoc' remplace 'NomTiers' pour corriger votre erreur
        },
        {
          model: Projet,
          as: 'projet',
          attributes: ['ID_Projet', 'Nom_Projet', 'Code_Pro'] // Ajout de Code_Pro pour plus de détails
        }
      ],
      order: [['Date_Activite', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      count: activites.length,
      data: activites
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer une activité par ID
 */
exports.getActiviteById = async (req, res, next) => {
  try {
    const activite = await Activite.findByPk(req.params.id, {
      include: [
        { model: User, as: 'utilisateur', attributes: ['UserID', 'FullName'] },
        { model: Tiers, as: 'tiers', attributes: ['IDTiers', 'Raisoc'] },
        { model: Projet, as: 'projet', attributes: ['ID_Projet', 'Nom_Projet'] }
      ]
    });

    if (!activite) {
      return res.status(404).json({ status: 'error', message: 'Activité non trouvée' });
    }

    res.status(200).json({ status: 'success', data: activite });
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour une activité
 */
exports.updateActivite = async (req, res, next) => {
  try {
    const activite = await Activite.findByPk(req.params.id);

    if (!activite) {
      return res.status(404).json({ status: 'error', message: 'Activité non trouvée' });
    }

    const updateData = { ...req.body };
    if (updateData.Date_Activite) {
      updateData.Date_Activite = sanitizeDate(updateData.Date_Activite);
    }

    await activite.update(updateData);

    res.status(200).json({
      status: 'success',
      message: 'Activité mise à jour',
      data: activite
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Supprimer une activité
 */
exports.deleteActivite = async (req, res, next) => {
  try {
    const deleted = await Activite.destroy({ where: { ID_Activite: req.params.id } });

    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Activité non trouvée' });
    }

    res.status(200).json({ status: 'success', message: 'Activité supprimée' });
  } catch (error) {
    next(error);
  }
};