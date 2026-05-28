const { Projet, Tiers, DevisMaster, BcvMaster, FavMaster, TabReg } = require('../models');
const { sequelize } = require('../config/database');
const { Op, TableHints, QueryTypes } = require('sequelize');

const { sanitizeDate, formatDateForMSSQL } = require('../utils/helpers');

console.log('✅ projetController.js loaded');

/**
 * Calcule l'avancement réel d'un projet basé sur la chaîne documentaire :
 * Devis → BCV → BLV → Paiement
 *
 * Règle : score proportionnel au ratio (docs complétés / total devis du projet).
 * Les paiements liés à d'autres projets du même client sont ignorés.
 */
async function computeAvancement(projet) {
  let score = 0;

  // ── 1. Devis liés à ce projet (20% → 50%) ────────────────────────
  const devisList = await DevisMaster.findAll({
    where: { CodProject: projet.ID_Projet },
    attributes: ['Nf', 'Valid', 'bTransf']
  });

  const totalDevis = devisList.length;

  if (totalDevis > 0) {
    const valides   = devisList.filter(d => d.Valid).length;
    const convertis = devisList.filter(d => d.bTransf).length;

    // Proportion des devis validés  : 20% → 35%
    score = 20 + Math.round((valides / totalDevis) * 15);

    // Proportion des devis convertis en BCV : 35% → 50%
    if (convertis > 0)
      score = 35 + Math.round((convertis / totalDevis) * 15);
  }

  // ── 2. BCV liés à ce projet (50% → 90%) ──────────────────────────
  const bcvList = await BcvMaster.findAll({
    where: { CodProject: projet.ID_Projet },
    attributes: ['Nf', 'Valid', 'bLivr', 'bTransf']
  });

  if (bcvList.length > 0) {
    const total   = bcvList.length;
    const valides = bcvList.filter(b => b.Valid).length;
    const livres  = bcvList.filter(b => b.bLivr).length;

    // Also detect FAVs created from these BCVs via CodDev linkage
    // (bTransf on BCV may remain false even when a FAV was created)
    const bcvNfStrings = bcvList.map(b => String(b.Nf));
    const favRows = await FavMaster.findAll({
      where: { CodDev: { [Op.in]: bcvNfStrings } },
      attributes: ['CodDev'],
      raw: true
    });
    const bcvsWithFav = new Set(favRows.map(f => f.CodDev));
    const transf = bcvList.filter(b => b.bTransf || bcvsWithFav.has(String(b.Nf))).length;

    score = Math.max(score, 50 + Math.round((valides / total) * 15)); // → 65%
    if (livres > 0)
      score = Math.max(score, 65 + Math.round((livres  / total) * 15)); // → 80%
    if (transf > 0)
      score = Math.max(score, 80 + Math.round((transf  / total) * 10)); // → 90%
  }

  // ── 3. Paiements — uniquement pour les BCV de ce projet (90% → 100%) ──
  const bcvNfs = bcvList.map(b => String(b.Nf));

  if (bcvNfs.length > 0 && totalDevis > 0) {
    let paidCount = 0;

    for (const nf of bcvNfs) {
      const paye = await TabReg.findOne({
        where: {
          CodTiers: projet.IDTiers,
          Payed: true,
          Pieces: { [Op.like]: `%${nf}%` }
        }
      });
      if (paye) paidCount++;
    }

    if (paidCount > 0)
      score = Math.max(score, 90 + Math.round((paidCount / totalDevis) * 10));
  }

  return Math.min(score, 100);
}

/**
 * Batch version of computeAvancement for a list of projects.
 * Uses 2 GROUP BY queries instead of N×3 queries.
 * Returns a Map<ID_Projet, avancement_auto>.
 */
async function computeAvancementBatch(projets) {
  const result = new Map();
  if (!projets.length) return result;

  const ids = projets.map(p => p.ID_Projet);

  // ── Devis stats per project ──
  const devisRows = await DevisMaster.findAll({
    where: { CodProject: { [Op.in]: ids } },
    attributes: ['CodProject', 'Valid', 'bTransf'],
    raw: true
  });

  // ── BCV stats per project ──
  const bcvRows = await BcvMaster.findAll({
    where: { CodProject: { [Op.in]: ids } },
    attributes: ['CodProject', 'Nf', 'Valid', 'bLivr', 'bTransf'],
    raw: true
  });

  // ── FAV records linked to those BCVs via CodDev ──
  const allBcvNfs = bcvRows.map(b => String(b.Nf));
  let bcvsWithFav = new Set();
  if (allBcvNfs.length > 0) {
    const favRows = await FavMaster.findAll({
      where: { CodDev: { [Op.in]: allBcvNfs } },
      attributes: ['CodDev'],
      raw: true
    });
    bcvsWithFav = new Set(favRows.map(f => f.CodDev));
  }

  // Group devis by project
  const devisByProject = {};
  for (const d of devisRows) {
    const key = d.CodProject;
    if (!devisByProject[key]) devisByProject[key] = [];
    devisByProject[key].push(d);
  }

  // Group bcv by project
  const bcvByProject = {};
  for (const b of bcvRows) {
    const key = b.CodProject;
    if (!bcvByProject[key]) bcvByProject[key] = [];
    bcvByProject[key].push(b);
  }

  for (const projet of projets) {
    const id = projet.ID_Projet;
    let score = 0;

    const devisList = devisByProject[id] || [];
    const totalDevis = devisList.length;

    if (totalDevis > 0) {
      const valides   = devisList.filter(d => d.Valid).length;
      const convertis = devisList.filter(d => d.bTransf).length;
      score = 20 + Math.round((valides / totalDevis) * 15);
      if (convertis > 0) score = 35 + Math.round((convertis / totalDevis) * 15);
    }

    const bcvList = bcvByProject[id] || [];
    if (bcvList.length > 0) {
      const total   = bcvList.length;
      const valides = bcvList.filter(b => b.Valid).length;
      const livres  = bcvList.filter(b => b.bLivr).length;
      const transf  = bcvList.filter(b => b.bTransf || bcvsWithFav.has(String(b.Nf))).length;
      score = Math.max(score, 50 + Math.round((valides / total) * 15));
      if (livres > 0) score = Math.max(score, 65 + Math.round((livres / total) * 15));
      if (transf > 0) score = Math.max(score, 80 + Math.round((transf / total) * 10));
    }

    result.set(id, Math.min(score, 100));
  }

  return result;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Les fonctions utilitaires de filtrage hard-codées (isCommercialRole, buildProjectIncludeForUser, etc.) 
// ont été supprimées car elles sont maintenant gérées de manière centralisée par 
// le service applyTableDrivenFilters via la table TabRoleFilterVisibility.

const normalizeRole = (role) => String(role || '').trim().toLowerCase();

const isAdminRole = (role) => ['admin', 'administrateur'].includes(normalizeRole(role));

const isCommercialRole = (role) => ['commercial', 'commerciale'].includes(normalizeRole(role));

const isAgentRole = (role) => normalizeRole(role) === 'agent';

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

const resolveTierReference = async (tierReference) => {
  if (!tierReference) {
    return null;
  }

  const normalizedReference = String(tierReference).trim();
  let tier = null;

  if (UUID_PATTERN.test(normalizedReference)) {
    tier = await Tiers.findOne({
      where: { IDTiers: normalizedReference },
      attributes: ['IDTiers', 'CodTiers', 'Raisoc', 'codRepresTiers']
    });
  }

  if (!tier) {
    tier = await Tiers.findOne({
      where: { CodTiers: normalizedReference },
      attributes: ['IDTiers', 'CodTiers', 'Raisoc', 'codRepresTiers']
    });
  }

  return tier;
};

/**
 * Lookup Tiers (Clients) for Projet creation with commercial filtering
 * GET /api/projets/tiers-lookup
 */
exports.lookupProjetTiers = async (req, res, next) => {
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

    // Admin sees all clients
    if (isAdminRole(reqRole)) {
      securityWhere = {};
    } else if (isCommercialRole(reqRole)) {
      // Commercial sees own portfolio by default
      if (!reqUserId) {
        securityWhere = { [Op.and]: [sequelize.literal('1 = 0')] };
      } else {
        securityWhere = { codRepresTiers: reqUserId };
      }
    } else if (isAgentRole(reqRole)) {
      // Agent keeps existing centralized scope logic
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
        limit,
        count: data.length
      }
    });
  } catch (error) {
    console.error('lookupProjetTiers failed:', {
      query: req.query,
      user: req.user?.UserID,
      error: error.message
    });

    res.status(200).json({
      status: 'degraded',
      message: 'Lookup endpoint failed, fallback to /tiers',
      degraded: true,
      data: []
    });
  }
};

/**
 * Créer un nouveau projet
 */
exports.createProjet = async (req, res, next) => {
  try {
    console.log('--- [START] createProjet ---');
    console.log('Body:', JSON.stringify(req.body, null, 2));

    const {
      Code_Pro,
      Nom_Projet,
      IDTiers,
      CA_Estime,
      Budget_Alloue,
      Avancement,
      Phase,
      Priorite,
      Date_Echeance,
      Date_Cloture_Reelle,
      Note_Privee,
      Alerte_IA_Risque
    } = req.body;

    // Fix: Generate unique Code_Pro if not provided to avoid UNIQUE constraint violation on NULL
    let finalCodePro = Code_Pro;
    if (!finalCodePro || finalCodePro.trim() === '') {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      finalCodePro = `PRJ-${new Date().getFullYear()}${timestamp}${random}`;
      console.log(`ℹ️ No Code_Pro provided, generated: ${finalCodePro}`);
    }

    // Validation des champs obligatoires
    if (!Nom_Projet || Nom_Projet.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Le nom du projet est obligatoire'
      });
    }

    // Validation de l'avancement
    const avancementNum = Avancement !== undefined ? parseInt(Avancement) : 0;
    if (isNaN(avancementNum) || avancementNum < 0 || avancementNum > 100) {
      return res.status(400).json({
        status: 'error',
        message: 'L\'avancement doit être entre 0 et 100'
      });
    }

    const dateEcheance = sanitizeDate(Date_Echeance);
    const dateCloture = sanitizeDate(Date_Cloture_Reelle);
    const budgetValue = Number(Budget_Alloue ?? CA_Estime ?? 0);

    if (!Number.isFinite(budgetValue) || budgetValue < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Le budget alloué ne peut pas être négatif'
      });
    }

    // Validation des dates
    if (dateEcheance && dateCloture && dateCloture > dateEcheance) {
      return res.status(400).json({
        status: 'error',
        message: 'La date de clôture ne peut pas être après la date d\'échéance'
      });
    }

    // Vérifier que le Tiers existe si fourni
    const tier = await resolveTierReference(IDTiers);

    if (IDTiers && !tier) {
      return res.status(404).json({
        status: 'error',
        message: `Le client (Tiers) avec l'identifiant ${IDTiers} n'existe pas`
      });
    }

    const filterHelper = require('../utils/filterHelper');
    const securityWhere = await filterHelper.applyTableDrivenFilters('46', {}, req.user);
    // Si une restriction s'applique (ex: région), on vérifie si le client cible est accessible
    // Les admins ont accès à tous les clients
    if (tier && !isAdminRole(req.user?.UserRole)) {
        const clientFilter = await filterHelper.applyTableDrivenFilters('11', {}, req.user);
        const canAccessClient = await Tiers.findOne({
          where: { [Op.and]: [{ CodTiers: tier.CodTiers }, clientFilter] }
        });
        if (!canAccessClient) {
          return res.status(403).json({ status: 'error', message: 'Accès refusé: ce client ne vous est pas attribué' });
        }
    }


    console.log('📝 Attempting to create project in database...');
    const newProjet = await Projet.create({
      Code_Pro: finalCodePro,
      Nom_Projet: Nom_Projet.trim(),
      IDTiers: tier?.CodTiers || null,
      Budget_Alloue: budgetValue,
      Avancement: avancementNum,
      Phase: Phase || null,
      Priorite: Priorite || null,
      Date_Creation: formatDateForMSSQL(new Date()),
      Date_Echeance: dateEcheance,
      Date_Cloture_Reelle: dateCloture,
      Note_Privee: Note_Privee || null,
      Alerte_IA_Risque: Alerte_IA_Risque || false,
      CodCom: String(req.user?.UserID || req.user?.id || '')
    });

    console.log('✅ Project created successfully with ID:', newProjet.ID_Projet);

    // Récupérer le projet avec ses relations
    const projet = await Projet.findByPk(newProjet.ID_Projet, {
      include: [{ model: Tiers, as: 'client', attributes: ['IDTiers', 'Raisoc', 'CodTiers', 'codRepresTiers'] }]
    });


    res.status(201).json({
      status: 'success',
      message: 'Projet créé avec succès',
      data: projet
    });
  } catch (error) {
    console.error('❌ [CREATE PROJET ERROR]:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        status: 'error',
        message: 'Un projet avec ce code existe déjà'
      });
    }
    next(error);
  }
};

/**
 * Récupérer tous les projets
 */
exports.getProjets = async (req, res, next) => {
  try {
    const filterHelper = require('../utils/filterHelper');

    // Build security scope (ignores limit/offset — we return all matching projects)
    const scopeWhere = await filterHelper.applyTableDrivenFilters('3', req.query, req.user);

    const rows = await Projet.findAll({
      where: scopeWhere,
      attributes: [
        'ID_Projet', 'Code_Pro', 'Nom_Projet', 'IDTiers',
        'Date_Creation', 'CodDev', 'CodBc', 'nf',
        'Phase', 'Avancement', 'Budget_Alloue', 'Priorite',
        'Date_Echeance', 'CodCom'
      ],
      include: [{ model: Tiers, as: 'client', attributes: ['IDTiers', 'Raisoc', 'CodTiers', 'codRepresTiers'] }],
      order: [['Date_Creation', 'DESC']]
    });

    const avancementMap = await computeAvancementBatch(rows);
    const data = rows.map(r => ({
      ...r.toJSON(),
      avancement_auto: avancementMap.get(r.ID_Projet) ?? 0
    }));

    res.json(filterHelper.formatPaginatedResponse(data, data.length, 1, data.length || 1));
  } catch (error) {
    console.error('❌ [PROJET LIST ERROR]:', error.message);
    console.error('❌ Stack:', error.stack);
    next(error);
  }
};

/**
 * Récupérer les projets d'un client précis
 * GET /api/projets/client/:codTiers
 */
exports.getProjectsByClient = async (req, res, next) => {
  try {
    const { codTiers } = req.params;
    if (!codTiers) {
      return res.status(400).json({ status: 'error', message: 'Client obligatoire' });
    }

    const filterHelper = require('../utils/filterHelper');
    const securityWhere = await filterHelper.applyTableDrivenFilters('3', {}, req.user);

    const projets = await Projet.findAll({
      where: { [Op.and]: [{ IDTiers: codTiers }, securityWhere] },
      include: [{ model: Tiers, as: 'client', attributes: ['IDTiers', 'Raisoc', 'CodTiers'] }],
      attributes: ['ID_Projet', 'Code_Pro', 'Nom_Projet', 'IDTiers', 'Date_Creation', 'CodDev', 'CodBc', 'nf'],
      order: [['Date_Creation', 'DESC']]
    });

    res.json({ status: 'success', data: projets });
  } catch (error) {
    console.error('❌ [PROJECTS BY CLIENT ERROR]:', error);
    next(error);
  }
};

/**
 * Récupérer un projet par ID
 */
exports.getProjetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filterHelper = require('../utils/filterHelper');
    const securityWhere = await filterHelper.applyTableDrivenFilters('46', {}, req.user);
    const include = [{ model: Tiers, as: 'client', attributes: ['IDTiers', 'Raisoc', 'CodTiers', 'codRepresTiers'] }];

    let projet = await Projet.findOne({
      where: { [Op.and]: [{ ID_Projet: req.params.id }, securityWhere] },
      include
    });

    // Fallback: legacy links from activities may reference project via nf.
    if (!projet && /^\d+$/.test(String(id))) {
      projet = await Projet.findOne({
        where: { [Op.and]: [{ nf: Number(id) }, securityWhere] },
        include
      });
    }

    if (!projet) {
      projet = await Projet.findOne({
        where: { [Op.and]: [{ Code_Pro: String(id) }, securityWhere] },
        include
      });
    }

    if (!projet) {
      console.log(`⚠️ Projet ${id} not found or access denied`);
      return res.status(404).json({
        status: 'error',
        message: 'Projet non trouvé ou accès refusé'
      });
    }

    const avancement_auto = await computeAvancement(projet);

    res.status(200).json({
      status: 'success',
      data: { ...projet.toJSON(), avancement_auto }
    });
  } catch (error) {
    console.error(`❌ Error in getProjetById (${req.params.id}):`, error);
    next(error);
  }
};

/**
 * GET /api/projets/:id/avancement
 * Retourne uniquement l'avancement calculé d'un projet
 */
exports.getAvancement = async (req, res, next) => {
  try {
    const filterHelper = require('../utils/filterHelper');
    const securityWhere = await filterHelper.applyTableDrivenFilters('46', {}, req.user);

    const projet = await Projet.findOne({
      where: { [Op.and]: [{ ID_Projet: req.params.id }, securityWhere] },
      attributes: ['ID_Projet', 'Code_Pro', 'IDTiers', 'Avancement']
    });

    if (!projet) {
      return res.status(404).json({ status: 'error', message: 'Projet non trouvé ou accès refusé' });
    }

    const avancement_auto = await computeAvancement(projet);

    res.status(200).json({
      status: 'success',
      data: {
        ID_Projet:      projet.ID_Projet,
        avancement_manuel: projet.Avancement,
        avancement_auto
      }
    });
  } catch (error) {
    console.error(`❌ Error in getAvancement (${req.params.id}):`, error);
    next(error);
  }
};

/**
 * Mettre à jour un projet
 */
exports.updateProjet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      Nom_Projet,
      IDTiers,
      CA_Estime,
      Budget_Alloue,
      Avancement,
      Date_Echeance,
      Date_Cloture_Reelle,
      ...otherFields
    } = req.body;

    const filterHelper = require('../utils/filterHelper');
    const securityWhere = await filterHelper.applyTableDrivenFilters('46', {}, req.user);
    
    const projet = await Projet.findOne({
      where: { [Op.and]: [{ ID_Projet: id }, securityWhere] },
      include: [{ model: Tiers, as: 'client', attributes: ['IDTiers', 'Raisoc', 'CodTiers', 'codRepresTiers'] }]
    });

    if (!projet) {
      return res.status(404).json({
        status: 'error',
        message: 'Projet non trouvé ou accès refusé'
      });
    }


    // Validation de l'avancement
    if (Avancement !== undefined && (Avancement < 0 || Avancement > 100)) {
      return res.status(400).json({
        status: 'error',
        message: 'L\'avancement doit être entre 0 et 100'
      });
    }

    // Sanitize dates
    const sanitizedDateEcheance = Date_Echeance !== undefined ? sanitizeDate(Date_Echeance) : projet.Date_Echeance;
    const sanitizedDateCloture = Date_Cloture_Reelle !== undefined ? sanitizeDate(Date_Cloture_Reelle) : projet.Date_Cloture_Reelle;

    // Validation des dates
    if (sanitizedDateEcheance && sanitizedDateCloture) {
      const echeance = new Date(sanitizedDateEcheance);
      const cloture = new Date(sanitizedDateCloture);
      if (cloture > echeance) {
        return res.status(400).json({
          status: 'error',
          message: 'La date de clôture ne peut pas être après la date d\'échéance'
        });
      }
    }

    // Validation du nom du projet
    if (Nom_Projet !== undefined && (!Nom_Projet || Nom_Projet.trim() === '')) {
      return res.status(400).json({
        status: 'error',
        message: 'Le nom du projet ne peut pas être vide'
      });
    }

    const tier = IDTiers !== undefined ? await resolveTierReference(IDTiers) : null;

    if (IDTiers !== undefined && IDTiers && !tier) {
      return res.status(404).json({
        status: 'error',
        message: `Le client (Tiers) avec l'identifiant ${IDTiers} n'existe pas`
      });
    }

    if (isCommercialRole(req.user?.UserRole) && IDTiers !== undefined && tier && !isTierRelatedToCommercial(tier, req.user)) {
      return res.status(403).json({
        status: 'error',
        message: 'Accès refusé: ce client ne vous est pas attribué'
      });
    }

    // Préparer la mise à jour
    const updateData = {};
    if (Nom_Projet !== undefined) updateData.Nom_Projet = Nom_Projet.trim();
    if (IDTiers !== undefined) updateData.IDTiers = tier?.CodTiers || null;
    if (Budget_Alloue !== undefined || CA_Estime !== undefined) {
      const budgetValue = Number(Budget_Alloue ?? CA_Estime ?? 0);

      if (!Number.isFinite(budgetValue) || budgetValue < 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Le budget alloué ne peut pas être négatif'
        });
      }

      updateData.Budget_Alloue = budgetValue;
    }
    if (Avancement !== undefined) updateData.Avancement = parseInt(Avancement);

    // Parse dates to JS Date objects for update
    if (Date_Echeance !== undefined) {
      updateData.Date_Echeance = sanitizeDate(Date_Echeance);
    }

    if (Date_Cloture_Reelle !== undefined) {
      updateData.Date_Cloture_Reelle = sanitizeDate(Date_Cloture_Reelle);
    }

    Object.assign(updateData, otherFields);

    console.log('📝 Updating projet with data:', JSON.stringify(updateData));

    await Projet.update(updateData, {
      where: { ID_Projet: id }
    });

    // Récupérer le projet mis à jour avec ses relations
    const projetUpdated = await Projet.findByPk(id, {
      include: [{ model: Tiers, as: 'client', attributes: ['IDTiers', 'Raisoc', 'CodTiers', 'codRepresTiers'] }]
    });


    res.status(200).json({
      status: 'success',
      message: 'Projet mis à jour avec succès',
      data: projetUpdated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Supprimer un projet
 */
exports.deleteProjet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filterHelper = require('../utils/filterHelper');
    const securityWhere = await filterHelper.applyTableDrivenFilters('46', {}, req.user);
    
    const projet = await Projet.findOne({
      where: { [Op.and]: [{ ID_Projet: id }, securityWhere] }
    });

    if (!projet) {
      return res.status(404).json({
        status: 'error',
        message: 'Projet non trouvé ou accès refusé'
      });
    }

    await projet.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Projet supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
};
