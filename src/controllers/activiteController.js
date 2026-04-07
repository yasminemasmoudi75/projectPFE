const { QueryTypes, Op, TableHints } = require('sequelize');

const { Activite, User, Tiers, Projet, sequelize } = require('../models');
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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizeReference = (value) => (typeof value === 'string' ? value.trim() : value);

// Les fonctions utilitaires de filtrage hard-codées (isCommercialRole, buildCommercialActivityScope, etc.) 
// ont été supprimées car elles sont maintenant gérées de manière centralisée par 
// le service applyTableDrivenFilters via la table TabRoleFilterVisibility.


const serializeActivite = (activite) => {
  const plainActivite = activite?.toJSON ? activite.toJSON() : activite;

  if (!plainActivite) {
    return plainActivite;
  }

  return {
    ...plainActivite,
    Valide: Number(plainActivite.Valide || 0),
    Statut: Number(plainActivite.Valide || 0) === 1 ? 'Terminé' : (plainActivite.Statut || 'Planifié'),
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

  let tier = null;

  if (UUID_PATTERN.test(String(normalizedReference))) {
    tier = await Tiers.findOne({
      where: { IDTiers: normalizedReference },
      attributes: ['IDTiers', 'CodTiers', 'Raisoc']
    });
  }

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

const resolveUserReference = async (userReference) => {
  const normalizedReference = normalizeReference(userReference);

  if (!normalizedReference) {
    return null;
  }

  const user = await User.findByPk(normalizedReference, {
    attributes: ['UserID', 'FullName', 'LoginName']
  });

  return user;
};

const resolveSecUserId = async (userReference) => {
  const normalizedReference = normalizeReference(userReference);

  if (!normalizedReference) {
    return null;
  }

  const rows = await sequelize.query(
    'SELECT TOP 1 UserID FROM Sec_Users WHERE UserID = :userId',
    {
      replacements: { userId: normalizedReference },
      type: QueryTypes.SELECT
    }
  );

  return rows[0]?.UserID ?? null;
};

const buildInvalidReferenceError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const loadActiviteById = async (id) => {
  const activite = await Activite.findByPk(id, {
    include: ACTIVITE_INCLUDE
  });

  if (!activite) {
    return null;
  }

  const plainActivite = activite.toJSON();

  // Some legacy rows link project through TabActivite.Nf but the eager association can be empty.
  if (!plainActivite.projet && plainActivite.Nf != null) {
    const projectAttributes = ['ID_Projet', 'Nom_Projet', 'Code_Pro', 'nf'];
    let fallbackProjet = await Projet.findOne({
      where: { nf: plainActivite.Nf },
      attributes: projectAttributes
    });

    if (!fallbackProjet) {
      fallbackProjet = await Projet.findOne({
        where: { ID_Projet: String(plainActivite.Nf) },
        attributes: projectAttributes
      });
    }

    if (fallbackProjet) {
      plainActivite.projet = fallbackProjet.toJSON();
    }
  }

  return plainActivite;
};

/**
 * Créer une nouvelle activité
 */
exports.createActivite = async (req, res, next) => {
  try {
    const {
      IDTiers,
      CodTiers,
      ID_Projet,
      Nf,
      Type_Activite,
      Description,
      Date_Activite,
      Statut,
      Valide
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
    const assignedUserReference = req.user ? req.user.UserID : null;

    const [tier, projet, assignedUser] = await Promise.all([
      resolveTierReference(tierReference),
      resolveProjetReference(projetReference),
      resolveUserReference(assignedUserReference)
    ]);

    if (tierReference && !tier) {
      throw buildInvalidReferenceError('Client introuvable pour l\'activité');
    }

    if (projetReference && !projet) {
      throw buildInvalidReferenceError('Projet introuvable pour l\'activité');
    }

    if (!assignedUserReference || !assignedUser) {
      throw buildInvalidReferenceError('Utilisateur introuvable pour l\'activité');
    }

    const secUserId = await resolveSecUserId(assignedUser.UserID);

    const newActivite = await Activite.create({
      User: secUserId,
      Destinataire: assignedUser?.FullName || assignedUser?.LoginName || null,
      CodTiers: tier?.CodTiers || null,
      Nf: projet?.nf || null,
      Type_Activite,
      Description,
      Date_Activite: sanitizedDate,
      Statut: Statut || 'Planifié',
      Valide: Number(Valide) === 1 || Statut === 'Terminé' ? 1 : 0
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
    const filterHelper = require('../utils/filterHelper');
    
    // Module 45 = Activités (Table-driven filters from TabRoleFilterVisibility)
    const { where, limit, offset, page } = await filterHelper.applyTableDrivenFiltersWithPagination(
        '45',
        req.query,
        req.user
    );

    const { count, rows } = await Activite.findAndCountAll({
      where,
      order: [['Date_Activite', 'DESC']],
      limit,
      offset,
      tableHint: TableHints.NOLOCK
    });




    res.json(
      filterHelper.formatPaginatedResponse(rows, count, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer une activité par ID
 */
exports.getActiviteById = async (req, res, next) => {
  try {
    const filterHelper = require('../utils/filterHelper');

    // Sécurité mandataire pour les activités (Module 45)
    const securityWhere = await filterHelper.applyTableDrivenFilters('45', {}, req.user);
    const where = { [Op.and]: [{ Guid: req.params.id }, securityWhere] };

    const authorized = await Activite.findOne({ where });
    if (!authorized) {
      return res.status(404).json({ status: 'error', message: 'Activité non trouvée' });
    }


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
    const filterHelper = require('../utils/filterHelper');
    const securityWhere = await filterHelper.applyTableDrivenFilters('45', {}, req.user);
    const where = { [Op.and]: [{ Guid: req.params.id }, securityWhere] };

    const activite = await Activite.findOne({ where });


    if (!activite) {
      return res.status(404).json({ status: 'error', message: 'Activité non trouvée' });
    }

    const updateData = { ...req.body };

    if (updateData.Date_Activite) {
      updateData.Date_Activite = sanitizeDate(updateData.Date_Activite);
    }

    if (Object.prototype.hasOwnProperty.call(updateData, 'Statut') && updateData.Statut === 'Terminé') {
      updateData.Valide = 1;
    }

    if (Object.prototype.hasOwnProperty.call(updateData, 'Valide')) {
      updateData.Valide = Number(updateData.Valide) === 1 ? 1 : 0;
    }

    // Assignment is automatic from authenticated account on creation;
    // manual reassignment is ignored on update.
    if (Object.prototype.hasOwnProperty.call(updateData, 'ID_Utilisateur')) {
      delete updateData.ID_Utilisateur;
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

exports.validateActivite = async (req, res, next) => {
  try {
    const where = isCommercialRole(req.user?.UserRole)
      ? { [Op.and]: [{ Guid: req.params.id }, await buildCommercialActivityScope(req.user)] }
      : { Guid: req.params.id };

    const activite = await Activite.findOne({ where });

    if (!activite) {
      return res.status(404).json({ status: 'error', message: 'Activité non trouvée' });
    }

    await activite.update({ Valide: 1 });

    const updatedActivite = await loadActiviteById(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Activité validée avec succès',
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
    const filterHelper = require('../utils/filterHelper');
    const securityWhere = await filterHelper.applyTableDrivenFilters('45', {}, req.user);
    const where = { [Op.and]: [{ Guid: req.params.id }, securityWhere] };

    const deleted = await Activite.destroy({ where });


    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Activité non trouvée' });
    }

    res.status(200).json({ status: 'success', message: 'Activité supprimée' });
  } catch (error) {
    next(error);
  }
};