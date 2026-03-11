const { Activite, User, Tiers, Projet } = require('../models');
const { sanitizeDate } = require('../utils/helpers');

const ACTIVITE_INCLUDE = [
  {
    model: User,
    as: 'utilisateur',
    attributes: ['UserID', 'FullName']
  },
  {
    model: Tiers,
    as: 'tiers',
    attributes: ['IDTiers', 'CodTiers', 'Raisoc']
  },
  {
    model: Projet,
    as: 'projet',
    attributes: ['ID_Projet', 'Nom_Projet', 'Code_Pro', 'nf']
  }
];

const normalizeReference = (value) => (typeof value === 'string' ? value.trim() : value);

const serializeActivite = (activite) => {
  const plainActivite = activite?.toJSON ? activite.toJSON() : activite;

  if (!plainActivite) {
    return plainActivite;
  }

  return {
    ...plainActivite,
    ID_Utilisateur: plainActivite.utilisateur?.UserID ?? plainActivite.User ?? null,
    IDTiers: plainActivite.tiers?.IDTiers ?? null,
    CodTiers: plainActivite.CodTiers ?? plainActivite.tiers?.CodTiers ?? null,
    ID_Projet: plainActivite.projet?.ID_Projet ?? null,
    Nf: plainActivite.Nf ?? plainActivite.projet?.nf ?? null
  };
};

const resolveTierReference = async (tierReference) => {
  const normalizedReference = normalizeReference(tierReference);

  if (!normalizedReference) {
    return null;
  }

  let tier = await Tiers.findOne({
    where: { IDTiers: normalizedReference },
    attributes: ['IDTiers', 'CodTiers', 'Raisoc']
  });

  if (!tier) {
    tier = await Tiers.findOne({
      where: { CodTiers: normalizedReference },
      attributes: ['IDTiers', 'CodTiers', 'Raisoc']
    });
  }

  return tier;
};

const resolveProjetReference = async (projetReference) => {
  const normalizedReference = normalizeReference(projetReference);

  if (!normalizedReference) {
    return null;
  }

  let projet = await Projet.findOne({
    where: { ID_Projet: normalizedReference },
    attributes: ['ID_Projet', 'Nom_Projet', 'Code_Pro', 'nf']
  });

  if (!projet && /^\d+$/.test(String(normalizedReference))) {
    projet = await Projet.findOne({
      where: { nf: Number(normalizedReference) },
      attributes: ['ID_Projet', 'Nom_Projet', 'Code_Pro', 'nf']
    });
  }

  return projet;
};

const buildInvalidReferenceError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const loadActiviteById = async (id) => Activite.findByPk(id, {
  include: ACTIVITE_INCLUDE
});

/**
 * Créer une nouvelle activité
 */
exports.createActivite = async (req, res, next) => {
  try {
    const {
      ID_Utilisateur,
      IDTiers,
      CodTiers,
      ID_Projet,
      Nf,
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

    const tierReference = IDTiers ?? CodTiers;
    const projetReference = ID_Projet ?? Nf;

    const [tier, projet] = await Promise.all([
      resolveTierReference(tierReference),
      resolveProjetReference(projetReference)
    ]);

    if (tierReference && !tier) {
      throw buildInvalidReferenceError('Client introuvable pour l\'activité');
    }

    if (projetReference && !projet) {
      throw buildInvalidReferenceError('Projet introuvable pour l\'activité');
    }

    const newActivite = await Activite.create({
      User: ID_Utilisateur || (req.user ? req.user.UserID : null),
      CodTiers: tier?.CodTiers || null,
      Nf: projet?.nf || null,
      Type_Activite,
      Description,
      Date_Activite: sanitizedDate,
      Statut: Statut || 'Planifié'
    });

    const createdActivite = await loadActiviteById(newActivite.Guid);

    res.status(201).json({
      status: 'success',
      message: 'Activité créée avec succès',
      data: serializeActivite(createdActivite || newActivite)
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
    if (userId) where.User = userId;

    if (projetId) {
      const projet = await resolveProjetReference(projetId);

      if (!projet) {
        return res.status(200).json({
          status: 'success',
          count: 0,
          data: []
        });
      }

      where.Nf = projet.nf;
    }

    if (tierId) {
      const tier = await resolveTierReference(tierId);

      if (!tier) {
        return res.status(200).json({
          status: 'success',
          count: 0,
          data: []
        });
      }

      where.CodTiers = tier.CodTiers;
    }

    if (type) where.Type_Activite = type;

    const activites = await Activite.findAll({
      where,
      include: ACTIVITE_INCLUDE,
      order: [['Date_Activite', 'DESC']]
    });

    const serializedActivites = activites.map(serializeActivite);

    res.status(200).json({
      status: 'success',
      count: serializedActivites.length,
      data: serializedActivites
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
    const activite = await loadActiviteById(req.params.id);

    if (!activite) {
      return res.status(404).json({ status: 'error', message: 'Activité non trouvée' });
    }

    res.status(200).json({ status: 'success', data: serializeActivite(activite) });
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

    if (Object.prototype.hasOwnProperty.call(updateData, 'ID_Utilisateur')) {
      updateData.User = updateData.ID_Utilisateur || null;
    }

    if (
      Object.prototype.hasOwnProperty.call(updateData, 'IDTiers') ||
      Object.prototype.hasOwnProperty.call(updateData, 'CodTiers')
    ) {
      const tierReference = updateData.IDTiers ?? updateData.CodTiers;

      if (!tierReference) {
        updateData.CodTiers = null;
      } else {
        const tier = await resolveTierReference(tierReference);

        if (!tier) {
          throw buildInvalidReferenceError('Client introuvable pour l\'activité');
        }

        updateData.CodTiers = tier.CodTiers;
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(updateData, 'ID_Projet') ||
      Object.prototype.hasOwnProperty.call(updateData, 'Nf')
    ) {
      const projetReference = updateData.ID_Projet ?? updateData.Nf;

      if (!projetReference) {
        updateData.Nf = null;
      } else {
        const projet = await resolveProjetReference(projetReference);

        if (!projet) {
          throw buildInvalidReferenceError('Projet introuvable pour l\'activité');
        }

        updateData.Nf = projet.nf;
      }
    }

    delete updateData.ID_Utilisateur;
    delete updateData.IDTiers;
    delete updateData.ID_Projet;
    delete updateData.Statut;

    await activite.update(updateData);

    const updatedActivite = await loadActiviteById(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Activité mise à jour',
      data: serializeActivite(updatedActivite || activite)
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
    const deleted = await Activite.destroy({ where: { Guid: req.params.id } });

    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Activité non trouvée' });
    }

    res.status(200).json({ status: 'success', message: 'Activité supprimée' });
  } catch (error) {
    next(error);
  }
};