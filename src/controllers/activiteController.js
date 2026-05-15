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

/**
 * Build scope filter for commercial users' activities
 * Commercial users should only see their own activities (User = their UserID)
 */
const buildCommercialActivityScope = (reqUser) => {
  const normalizedRole = String(reqUser?.UserRole || '').trim().toLowerCase();
  if (!['commercial', 'commerciale'].includes(normalizedRole)) {
    return null;
  }
  
  const userId = reqUser?.UserID;
  if (!userId) {
    return { [Op.and]: [sequelize.literal('1 = 0')] };
  }
  
  return { User: userId };
};

const normalizeRole = (role) => String(role || '').trim().toLowerCase();

const isAdminRole = (role) => ['admin', 'administrateur'].includes(normalizeRole(role));

const hasWhereConditions = (whereObj) => {
  if (!whereObj) return false;
  if (Object.keys(whereObj).length > 0) return true;
  if (Object.getOwnPropertySymbols(whereObj).length > 0) return true;
  return false;
};

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (value == null) return false;

  const normalized = String(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'oui', 'on'].includes(normalized);
};

const isCommercialRole = (role) => ['commercial', 'commerciale'].includes(normalizeRole(role));

const isAgentRole = (role) => normalizeRole(role) === 'agent';

const ACTIVITY_STATUSES = ['Planifié', 'En cours', 'Terminé', 'Annulé'];

const normalizeActivityStatus = (value) => {
  const raw = String(value || '').trim();
  if (ACTIVITY_STATUSES.includes(raw)) {
    return raw;
  }

  return null;
};


const serializeActivite = (activite) => {
  const plainActivite = activite?.toJSON ? activite.toJSON() : activite;

  if (!plainActivite) {
    return plainActivite;
  }

  return {
    ...plainActivite,
    Valide: Number(plainActivite.Valide || 0),
    Statut: normalizeActivityStatus(plainActivite.Categ)
      || (Number(plainActivite.Valide || 0) === 1 ? 'Terminé' : 'Planifié'),
    ID_Utilisateur: plainActivite.utilisateur?.UserID ?? plainActivite.User ?? null,
    IDTiers: plainActivite.tiers?.IDTiers ?? null,
    CodTiers: plainActivite.CodTiers ?? plainActivite.tiers?.CodTiers ?? null,
    ID_Projet: plainActivite.projet?.ID_Projet ?? null,
    Nf: plainActivite.Nf ?? plainActivite.projet?.nf ?? null,
    CodProj: plainActivite.CodProj ?? plainActivite.projet?.Code_Pro ?? null
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

  if (!normalizedReference || ['null', 'undefined'].includes(String(normalizedReference).toLowerCase())) {
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

  if (!projet) {
    projet = await Projet.findOne({
      where: { Code_Pro: String(normalizedReference) },
      attributes: ['ID_Projet', 'Nom_Projet', 'Code_Pro', 'nf']
    });
  }

  return projet;
};

const ensureProjectNf = async (projet) => {
  if (!projet) {
    return null;
  }

  const currentNf = Number.parseInt(projet.nf, 10);
  if (Number.isFinite(currentNf) && currentNf > 0) {
    return currentNf;
  }

  const maxNf = await Projet.max('nf');
  const parsedMaxNf = Number.parseInt(maxNf, 10);
  const nextNf = (Number.isFinite(parsedMaxNf) ? parsedMaxNf : 0) + 1;

  await Projet.update(
    { nf: nextNf },
    { where: { ID_Projet: projet.ID_Projet } }
  );

  return nextNf;
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

  // Some legacy rows link project through TabActivite.Nf/codProj but the eager association can be empty.
  if (!plainActivite.projet && (plainActivite.Nf != null || plainActivite.CodProj)) {
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

    if (!fallbackProjet && plainActivite.CodProj) {
      fallbackProjet = await Projet.findOne({
        where: { Code_Pro: String(plainActivite.CodProj) },
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
      Valide,
      participants // array of UserIDs for meeting invitees
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
    const projetReference = normalizeReference(ID_Projet ?? Nf);
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
    const projectNf = await ensureProjectNf(projet);
    const normalizedStatus = normalizeActivityStatus(Statut) || 'Planifié';

    const newActivite = await Activite.create({
      User: secUserId,
      Destinataire: assignedUser?.FullName || assignedUser?.LoginName || null,
      CodTiers: tier?.CodTiers || null,
      Nf: projectNf,
      CodProj: projet?.Code_Pro || null,
      Categ: normalizedStatus,
      Type_Activite,
      Description,
      Date_Activite: sanitizedDate,
      Valide: Number(Valide) === 1 || normalizedStatus === 'Terminé' ? 1 : 0
    });

    const createdActivite = await loadActiviteById(newActivite.Guid);

    // Create activity copies for meeting participants and notify them
    const participantIds = Array.isArray(participants)
      ? [...new Set(participants.map(Number).filter((id) => Number.isInteger(id) && id > 0 && id !== assignedUser.UserID))]
      : [];

    if (participantIds.length > 0) {
      const { createNotifications } = require('../utils/notificationUtils');
      const organizerName = assignedUser?.FullName || assignedUser?.LoginName || 'Organisateur';

      // Resolve all participants first to get their names
      const resolvedParticipants = (await Promise.all(
        participantIds.map((id) => resolveUserReference(id).catch(() => null))
      )).filter(Boolean);

      const participantNames = resolvedParticipants.map((p) => p.FullName || p.LoginName || `#${p.UserID}`);

      // Update the organizer's activity description to list who's invited
      if (participantNames.length > 0) {
        const organizerDesc = [
          Description || '',
          `Participants : ${participantNames.join(', ')}`
        ].filter(Boolean).join(' — ');
        await newActivite.update({ Description: organizerDesc });
      }

      await Promise.all(resolvedParticipants.map(async (participant) => {
        try {
          // Use resolveSecUserId with fallback to UserID directly
          const secParticipantId = (await resolveSecUserId(participant.UserID)) ?? participant.UserID;
          if (!secParticipantId) return;

          const participantDesc = [
            `Réunion avec ${organizerName}`,
            Description || ''
          ].filter(Boolean).join(' — ');

          await Activite.create({
            User: secParticipantId,
            Destinataire: participant.FullName || participant.LoginName || null,
            CodTiers: tier?.CodTiers || null,
            Nf: projectNf,
            CodProj: projet?.Code_Pro || null,
            Categ: normalizedStatus,
            Type_Activite,
            Description: participantDesc,
            Date_Activite: sanitizedDate,
            Valide: 0
          });

          await createNotifications(
            [participant.UserID],
            `Réunion planifiée — ${sanitizedDate ? new Date(sanitizedDate).toLocaleString('fr-FR') : ''}`,
            JSON.stringify({
              _type: 'MEETING_INVITE',
              type: Type_Activite,
              date: sanitizedDate,
              organizer: organizerName,
              description: Description || ''
            }),
            'MEETING_INVITE'
          );
        } catch (pErr) {
          console.warn(`⚠️ [createActivite] Participant ${participant.UserID} skipped:`, pErr.message);
        }
      }));
    }

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
    const selectedCommercial = String(req.query?.commercial || req.query?.userId || '').trim();
    const selectedTierId = String(req.query?.tierId || '').trim();
    const queryForTableFilters = { ...req.query };
    delete queryForTableFilters.commercial;
    delete queryForTableFilters.userId;
    delete queryForTableFilters.tierId;
    delete queryForTableFilters.moduleCode;
    
    // Module 45 = Activités, Module 8 = Calendrier (Table-driven filters from TabRoleFilterVisibility)
    const reqModuleCode = req.query.moduleCode;
    const isValidModuleCode = reqModuleCode === '8' || reqModuleCode === '45';
    const moduleCodeToUse = (isValidModuleCode ? reqModuleCode : req.grantedModule) || '45';
    
    const { where, limit, offset, page } = await filterHelper.applyTableDrivenFiltersWithPagination(
        String(moduleCodeToUse),
        queryForTableFilters,
        req.user
    );

    let finalWhere = where;
    
    // ✅ Force commercial users to see only their own activities
    const commercialScope = buildCommercialActivityScope(req.user);
    if (commercialScope) {
      const hasWhere = where && (
        Object.keys(where).length > 0 || Object.getOwnPropertySymbols(where).length > 0
      );
      finalWhere = hasWhere ? { [Op.and]: [where, commercialScope] } : commercialScope;
    }
    
    if (selectedCommercial && /^\d+$/.test(selectedCommercial)) {
      const commercialWhere = { User: Number(selectedCommercial) };
      const hasWhere = finalWhere && (
        Object.keys(finalWhere).length > 0 || Object.getOwnPropertySymbols(finalWhere).length > 0
      );
      finalWhere = hasWhere ? { [Op.and]: [finalWhere, commercialWhere] } : commercialWhere;
    }

    if (selectedTierId) {
      const tier = await resolveTierReference(selectedTierId);
      if (!tier) {
        return res.json(filterHelper.formatPaginatedResponse([], 0, page, limit));
      }

      const tierWhere = { CodTiers: tier.CodTiers };
      const hasWhere = finalWhere && (
        Object.keys(finalWhere).length > 0 || Object.getOwnPropertySymbols(finalWhere).length > 0
      );
      finalWhere = hasWhere ? { [Op.and]: [finalWhere, tierWhere] } : tierWhere;
    }

    // ✅ Fix: Robust Projet filtering
    const selectedProjectId = String(req.query?.projetId || '').trim();
    if (selectedProjectId && !['null', 'undefined'].includes(selectedProjectId.toLowerCase())) {
      try {
        const projet = await resolveProjetReference(selectedProjectId);
        if (projet && projet.nf) {
          const projetWhere = { Nf: projet.nf };
          finalWhere = hasWhereConditions(finalWhere) 
            ? { [Op.and]: [finalWhere, projetWhere] } 
            : projetWhere;
        } else {
          // If project requested but not found, return empty set instead of 500
          console.log(`⚠️ [activiteController] Project not found: ${selectedProjectId}`);
          return res.json(filterHelper.formatPaginatedResponse([], 0, page, limit));
        }
      } catch (projErr) {
        console.error('❌ Error resolving project reference:', projErr);
      }
    }

    const { count, rows } = await Activite.findAndCountAll({
      where: finalWhere,
      include: ACTIVITE_INCLUDE,
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

    if (Object.prototype.hasOwnProperty.call(updateData, 'Statut')) {
      const normalizedStatus = normalizeActivityStatus(updateData.Statut);
      updateData.Categ = normalizedStatus || 'Planifié';
      updateData.Valide = updateData.Categ === 'Terminé' ? 1 : 0;
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
      const projetReference = normalizeReference(updateData.ID_Projet ?? updateData.Nf);

      if (!projetReference) {
        updateData.Nf = null;
        updateData.CodProj = null;
      } else {
        const projet = await resolveProjetReference(projetReference);

        if (!projet) {
          throw buildInvalidReferenceError('Projet introuvable pour l\'activité');
        }

        updateData.Nf = await ensureProjectNf(projet);
        updateData.CodProj = projet?.Code_Pro || null;
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

    await activite.update({ Valide: 1, Categ: 'Terminé' });

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

/**
 * Recherche clients pour formulaire d'activites
 * - Scope standard module 11 (tiers)
 * - Non-admin peut etendre la recherche a un autre portefeuille via codRepres
 * - Option prospectOnly pour lister uniquement les prospects
 */
exports.lookupActivityTiers = async (req, res, next) => {
  try {
    const query = String(req.query?.q || '').trim();
    const codRepres = String(req.query?.codRepres || '').trim();
    const prospectOnly = parseBoolean(req.query?.prospectOnly);

    const requestedLimit = Number.parseInt(req.query?.limit, 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(5, Math.min(requestedLimit, 100))
      : 30;

    const reqRole = req.user?.UserRole;
    const reqUserId = String(req.user?.UserID || req.user?.id || '').trim();

    let securityWhere = {};

    // Admin sees all clients.
    if (isAdminRole(reqRole)) {
      securityWhere = {};
    } else if (isCommercialRole(reqRole)) {
      // Commercial sees own portfolio by default.
      if (!reqUserId) {
        securityWhere = { [Op.and]: [sequelize.literal('1 = 0')] };
      } else {
        securityWhere = { codRepresTiers: reqUserId };
      }
    } else if (isAgentRole(reqRole)) {
      // Agent keeps existing centralized scope logic.
      const filterHelper = require('../utils/filterHelper');
      securityWhere = await filterHelper.applyTableDrivenFilters('11', {}, req.user);
    }

    const searchConditions = [];
    if (query) {
      const likePattern = `%${query}%`;
      searchConditions.push({
        [Op.or]: [
          { Raisoc: { [Op.like]: likePattern } },
          { CodTiers: { [Op.like]: likePattern } },
          { Email: { [Op.like]: likePattern } },
          { Tel: { [Op.like]: likePattern } }
        ]
      });
    }

    if (prospectOnly) {
      searchConditions.push({
        [Op.or]: [
          { Fictif: true },
          { Niveau: { [Op.gt]: 0 } }
        ]
      });
    }

    if (codRepres) {
      // Strict representative filter: when a commercial is selected,
      // only that commercial's clients must be returned.
      const codRepresWhere = { codRepresTiers: codRepres };
      securityWhere = hasWhereConditions(securityWhere)
        ? { [Op.and]: [securityWhere, codRepresWhere] }
        : codRepresWhere;
    }

    const whereParts = [];
    if (hasWhereConditions(securityWhere)) {
      whereParts.push(securityWhere);
    }
    whereParts.push(...searchConditions);

    const where = whereParts.length > 0 ? { [Op.and]: whereParts } : {};

    const rows = await Tiers.findAll({
      where,
      attributes: ['IDTiers', 'CodTiers', 'Raisoc', 'Email', 'Tel', 'codRepresTiers', 'Niveau', 'Fictif'],
      order: [['Raisoc', 'ASC']],
      limit
    });

    const data = rows.map((row) => {
      const plain = row.toJSON ? row.toJSON() : row;
      return {
        IDTiers: plain.IDTiers,
        CodTiers: plain.CodTiers,
        Raisoc: plain.Raisoc,
        Email: plain.Email,
        Tel: plain.Tel,
        codRepresTiers: plain.codRepresTiers,
        isProspect: Boolean(plain.Fictif) || Number(plain.Niveau || 0) > 0
      };
    });

    res.status(200).json({
      status: 'success',
      data,
      meta: {
        q: query,
        codRepres: codRepres || null,
        prospectOnly,
        limit
      }
    });
  } catch (error) {
    console.error('lookupActivityTiers failed:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });

    return res.status(200).json({
      status: 'success',
      data: [],
      meta: {
        degraded: true,
        reason: 'lookup_failed'
      }
    });
  }
};
