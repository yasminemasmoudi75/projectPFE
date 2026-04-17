const { DevisMaster, DevisDetail, BcvMaster, BcvDetail, Tiers, Product, TabSociete, TiersClasse, TiersGouvernorat, TiersCategorie, sequelize } = require('../models');
const { Op, TableHints } = require('sequelize');

const PDFService = require('../services/pdfService');
const mouvementService = require('../services/mouvementService'); // ✅ Service de traçabilité mouvements
const { randomUUID } = require('crypto');

// Les fonctions utilitaires de filtrage hard-codées (isCommercialRole, buildCommercialCodRepresFilter, etc.) 
// ont été supprimées car elles sont maintenant gérées de manière centralisée par 
// le service applyTableDrivenFilters via la table TabRoleFilterVisibility.


/**
 * Récupérer tous les devis - TABLE-DRIVEN (Utilise TabRoleFilterVisibility)
 */
exports.getAllDevis = async (req, res, next) => {
  try {
    console.log('🚀 [DevisController] getAllDevis started');
    const filterHelper = require('../utils/filterHelper');
    
    // Module 4 = Devis
    console.log('🔍 [DevisController] Applying filters...');
    const filterResult = await filterHelper.applyTableDrivenFiltersWithPagination(
      '4',

      req.query,
      req.user
    );
    const { where, limit, offset, page } = filterResult;
    const listWhere = {
      [Op.and]: [where, { bTransf: false }]
    };
    console.log('✅ [DevisController] Filters applied:', JSON.stringify(listWhere));

    console.log('📊 [DevisController] Running query on DevisMaster...');
    const { count, rows } = await DevisMaster.findAndCountAll({
      where: listWhere,
      include: [{
        model: Tiers,
        as: 'tiers',
        attributes: ['Raisoc', 'CodTiers', 'Ville', 'MapsRegion', 'Gouvernorat', 'Classe', 'Categorie'],
        include: [
          { model: TiersClasse, as: 'tiersClasse', attributes: ['id', 'libelle'], required: false },
          { model: TiersGouvernorat, as: 'region', attributes: ['id', 'libelle'], required: false },
          { model: TiersCategorie, as: 'tiersCategorieObj', attributes: ['id', 'libelle'], required: false }
        ]
      }],
      order: [['Nf', 'DESC']],
      limit,
      offset,
      distinct: false,
      tableHint: TableHints.NOLOCK
    });


    console.log(`✅ [DevisController] Query successful: ${rows.length} rows found`);

    return res.status(200).json(
      filterHelper.formatPaginatedResponse(rows, count, page, limit)
    );

  } catch (error) {
    console.error('❌ [DevisController] Error in getAllDevis:', error);
    next(error);
  }
};



/**
 * Récupérer un devis par son Guid (ID)
 */
exports.getDevisById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filterHelper = require('../utils/filterHelper');

    // Pour la récupération par ID, on applique aussi les filtres de sécurité mandataires (Module 4)
    const securityWhere = await filterHelper.applyTableDrivenFilters('4', {}, req.user);

    const where = { [Op.and]: [{ Guid: id }, securityWhere] };


    const devis = await DevisMaster.findOne({
      where,
      include: [
        {
          model: DevisDetail,
          as: 'details',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['IDArt', 'CodArt', 'LibArt', 'urlimg']
            }
          ]
        },
        {
          model: Tiers,
          as: 'tiers'
        }
      ],
      tableHint: TableHints.NOLOCK
    });


    if (!devis) {
      return res.status(404).json({
        status: 'error',
        message: 'Devis non trouvé'
      });
    }

    res.status(200).json({
      status: 'success',
      data: devis
    });
  } catch (error) {
    console.error('❌ Error getDevisById:', error);
    next(error);
  }
};

/**
 * Helper function to parse dates for SQL Server through Sequelize
 */
const parseDateValue = (dateValue) => {
  if (!dateValue || dateValue === '' || dateValue === 'null' || dateValue === null || dateValue === undefined) {
    return null;
  }

  try {
    let date;
    if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      // Remove timezone offset before parsing (SQL Server DATETIME doesn't support it)
      const cleaned = String(dateValue).replace(/([+-]\d{2}:\d{2}|Z)$/, '').trim();
      date = new Date(cleaned);
    }

    if (isNaN(date.getTime())) {
      console.warn('⚠️  Invalid date value received:', dateValue);
      return null;
    }

    return date;
  } catch (e) {
    console.warn('⚠️  Error parsing date:', dateValue, e.message);
    return null;
  }
};

/**
 * Helper function to sanitize devis master data
 */
const sanitizeMasterData = (masterData) => {
  const sanitized = { ...masterData };

  // Remove computed columns
  delete sanitized.NetHT;

  // Do not send audit dates through Sequelize for TabDevm.
  // MSSQL binds DataTypes.DATE with a timezone suffix (+00:00), which this legacy DATETIME column rejects.
  // Let SQL Server keep its default/current value instead.
  delete sanitized.DatUser;
  delete sanitized.DatCreateUser;

  // Parse and validate payload date fields accepted from client.
  // MDate is a legacy audit datetime and is always set from SQL GETDATE() to avoid timezone serialization issues.
  const dateFields = ['DatLiv'];
  dateFields.forEach(field => {
    const val = sanitized[field];
    if (!val || val === '' || val === 'null' || val === null) {
      sanitized[field] = null;
    } else {
      const parsed = parseDateValue(val);
      sanitized[field] = parsed || null;
    }
  });

  // Ensure numeric fields are valid
  const numericFields = ['TotHT', 'TotTva', 'TotTTC', 'TotRem'];
  numericFields.forEach(field => {
    if (sanitized.hasOwnProperty(field)) {
      const num = parseFloat(sanitized[field]);
      sanitized[field] = isNaN(num) ? 0 : num;
    }
  });

  // Ensure boolean fields are valid
  const booleanFields = ['Valid', 'bTransf', 'IsConverted'];
  booleanFields.forEach(field => {
    if (sanitized.hasOwnProperty(field)) {
      sanitized[field] = !!sanitized[field];
    }
  });

  return sanitized;
};

const normalizeRole = (role) => String(role || '').trim().toLowerCase();

const isCommercialUser = (user = {}) => {
  return ['commercial', 'commerciale'].includes(normalizeRole(user?.UserRole));
};

const isAdminUser = (user = {}) => {
  return ['admin', 'administrateur'].includes(normalizeRole(user?.UserRole));
};

const isFiltreRepresEnabledForCommercialDevis = async (transaction) => {
  const { QueryTypes } = require('sequelize');
  const rows = await sequelize.query(`
    SELECT TOP 1 FiltreRepres
    FROM TabAWProfileAccess
    WHERE LOWER(ProfileUser) IN ('commercial', 'commerciale')
      AND CAST(CodMod AS NVARCHAR(20)) = '4'
  `, {
    type: QueryTypes.SELECT,
    transaction
  });

  const value = rows[0]?.FiltreRepres;
  return value === 1 || value === true || value === '1';
};

const buildDevisSecurityWhere = async (guid, user, transaction) => {
  const filterHelper = require('../utils/filterHelper');
  const securityWhere = await filterHelper.applyTableDrivenFilters('4', {}, user, transaction);
  return { [Op.and]: [{ Guid: guid }, securityWhere] };
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

const isEmptyValue = (value) => {
  if (value === null || value === undefined) return true;
  return String(value).trim() === '';
};

const normalizeProjectId = (value) => {
  if (isEmptyValue(value)) return '';
  return String(value).trim();
};

const resolveLookupIdByLabel = async (Model, value, transaction) => {
  if (isEmptyValue(value)) return null;

  const raw = String(value).trim();
  if (/^\d+$/.test(raw)) return Number(raw);

  const normalized = raw.toLowerCase();
  const row = await Model.findOne({
    attributes: ['id'],
    where: sequelize.where(
      sequelize.fn('LOWER', sequelize.col('libelle')),
      normalized
    ),
    transaction
  });

  return row?.id ?? null;
};

const buildTierPatchFromMaster = async (master = {}, transaction) => {
  const patch = {};

  if (hasOwn(master, 'Ville')) {
    patch.Ville = isEmptyValue(master.Ville) ? null : String(master.Ville).trim();
  }

  if (hasOwn(master, 'MapsRegion')) {
    patch.MapsRegion = isEmptyValue(master.MapsRegion) ? null : String(master.MapsRegion).trim();
  } else if (hasOwn(master, 'Ville') && !isEmptyValue(master.Ville)) {
    patch.MapsRegion = String(master.Ville).trim();
  }

  if (hasOwn(master, 'Classe')) {
    if (isEmptyValue(master.Classe)) {
      patch.Classe = null;
    } else {
      const classeId = await resolveLookupIdByLabel(TiersClasse, master.Classe, transaction);
      if (classeId !== null) patch.Classe = classeId;
    }
  }

  if (hasOwn(master, 'Categorie')) {
    if (isEmptyValue(master.Categorie)) {
      patch.Categorie = null;
    } else {
      const categorieId = await resolveLookupIdByLabel(TiersCategorie, master.Categorie, transaction);
      if (categorieId !== null) patch.Categorie = categorieId;
    }
  }

  const gouvernoratSource = hasOwn(master, 'Gouvernorat')
    ? master.Gouvernorat
    : (hasOwn(master, 'Ville') ? master.Ville : undefined);

  if (gouvernoratSource !== undefined) {
    if (isEmptyValue(gouvernoratSource)) {
      patch.Gouvernorat = null;
    } else {
      const gouvernoratId = await resolveLookupIdByLabel(TiersGouvernorat, gouvernoratSource, transaction);
      if (gouvernoratId !== null) patch.Gouvernorat = gouvernoratId;
    }
  }

  return patch;
};

/**
 * Créer un nouveau devis
 */
exports.createDevis = async (req, res, next) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { master, details } = req.body;

    // Validate input
    if (!master) {
      return res.status(400).json({ status: 'error', message: 'Master data is required' });
    }

    if (!master.CodTiers) {
      return res.status(400).json({ status: 'error', message: 'Client (CodTiers) est obligatoire' });
    }

    const selectedTier = await Tiers.findOne({
      where: { CodTiers: master.CodTiers },
      attributes: ['IDTiers', 'CodTiers', 'Raisoc', 'Adresse', 'Ville', 'codRepresTiers', 'Gouvernorat', 'MapsRegion', 'Classe', 'Categorie'],
      transaction
    });

    if (!selectedTier) {
      if (transaction && !transaction.finished) await transaction.rollback();
      return res.status(400).json({ status: 'error', message: 'Client sélectionné introuvable' });
    }

    if (isCommercialUser(req.user)) {
      const currentUserId = String(req.user?.id || req.user?.UserID || '').trim();
      if (!currentUserId) {
        if (transaction && !transaction.finished) await transaction.rollback();
        return res.status(403).json({ status: 'error', message: 'Utilisateur commercial invalide' });
      }

      // Always force representative to logged-in commercial
      master.CodRepres = currentUserId;

      // If FiltreRepres is enabled for commercial/devis, enforce that selected client belongs to this commercial
      const filtreRepresEnabled = await isFiltreRepresEnabledForCommercialDevis(transaction);
      if (filtreRepresEnabled) {
        const tierRep = String(selectedTier.codRepresTiers || '').trim();
        if (!tierRep || tierRep !== currentUserId) {
          if (transaction && !transaction.finished) await transaction.rollback();
          return res.status(403).json({
            status: 'error',
            message: 'Ce client n\'est pas affecté à ce commercial'
          });
        }
      }
    }

    if (isAdminUser(req.user)) {
      // Admin can create for any client, but keep Devis <-> Client <-> Commercial link coherent.
      // If CodRepres is not explicitly provided, inherit client's assigned commercial.
      if (!master.CodRepres) {
        const tierRep = String(selectedTier.codRepresTiers || '').trim();
        if (tierRep) {
          master.CodRepres = tierRep;
        }
      }
    }

    // Synchronize editable client profile fields from Devis form into TabTiers.
    const tierPatch = await buildTierPatchFromMaster(master, transaction);
    if (Object.keys(tierPatch).length > 0) {
      await selectedTier.update(tierPatch, { transaction });
    }

    // Always normalize client fields from DB to avoid payload inconsistencies
    master.CodTiers = selectedTier.CodTiers;
    master.LibTiers = selectedTier.Raisoc || master.LibTiers || '';
    master.Adresse = selectedTier.Adresse || master.Adresse || '';
    master.Ville = selectedTier.Ville || master.Ville || '';

    // Track creator login when available
    master.CUser = req.user?.LoginName || String(req.user?.id || req.user?.UserID || '');
    const selectedProjectId = normalizeProjectId(master.ProjectId || master.projectId || master.ID_Projet || master.projetId);
    delete master.ProjectId;
    delete master.projectId;
    delete master.ID_Projet;
    delete master.projetId;
    master.CodProject = selectedProjectId || null;


    // 1. Déterminer le prochain numéro de devis (Nf) si pas fourni
    if (!master.Nf) {
      const lastDevis = await DevisMaster.findOne({
        order: [['Nf', 'DESC']],
        transaction
      });
      master.Nf = (lastDevis?.Nf || 0) + 1;
    }

    // Sanitize and clean master data
    const masterData = sanitizeMasterData(master);

    // 2. Ajouter les dates avec GETDATE() SQL (bypass Sequelize timezone)
    masterData.DatCreateUser = sequelize.literal('GETDATE()');
    masterData.DatUser = sequelize.literal('GETDATE()');
    masterData.MDate = sequelize.literal('GETDATE()');
    masterData.Guid = randomUUID();

    // Créer le master
    const newDevis = await DevisMaster.create(masterData, { transaction });

    // 3. Créer les détails
    if (details && Array.isArray(details) && details.length > 0) {
      const detailsWithNf = details.map((d) => {
        const detail = { ...d };
        delete detail.NetHT;  // Computed column in TabDevm
        delete detail.MntHT;  // Computed column in TabDevd
        delete detail.Guid;
        delete detail.NoDetail; // autoIncrement - SQL Server generates it
        return {
          ...detail,
          NF: newDevis.Nf,
          ID: newDevis.Nf,
        };
      });
      await DevisDetail.bulkCreate(detailsWithNf, { transaction });
    }

    await transaction.commit();

    // ✅ ENREGISTRER LA CRÉATION DANS MvtDocs
    try {
      const montants = {
        codTiers: masterData.CodTiers,
        libTiers: masterData.LibTiers,
        totalHT: masterData.TotHT,
        totalRem: masterData.TotRem,
        totalFodec: masterData.TotFodec,
        totalTVA: masterData.TotTva,
        totalTTC: masterData.TotTTC
      };
      const userId = req.user?.id || req.user?.UserID;
      await mouvementService.enregistrerCreation('DEV', newDevis.Nf, montants, userId);
      console.log(`✅ Mouvement enregistré: Création Devis #${newDevis.Nf} par utilisateur ${userId}`);
    } catch (mouvementError) {
      console.error('⚠️ Erreur enregistrement mouvement (non bloquant):', mouvementError.message);
    }

    const result = await DevisMaster.findByPk(newDevis.Guid, {
      include: [{ model: DevisDetail, as: 'details' }]
    });

    res.status(201).json({
      status: 'success',
      message: 'Devis créé avec succès',
      data: result
    });
  } catch (error) {
    // Safely rollback transaction
    if (transaction) {
      try {
        if (!transaction.finished) {
          await transaction.rollback();
        }
      } catch (rollbackError) {
        console.error('❌ Error rolling back transaction:', rollbackError.message);
      }
    }
    console.error('❌ Error createDevis:', error.message);
    console.error('❌ SQL Error details:', error.original?.message || error.parent?.message || 'No SQL details');
    console.error('❌ SQL:', error.sql || 'N/A');
    console.error('❌ Parameters:', JSON.stringify(error.parameters || []));
    console.error('❌ Full error:', JSON.stringify({ name: error.name, message: error.message, fields: error.fields }));
    next(error);
  }
};

/**
 * Mettre à jour un devis
 */
exports.updateDevis = async (req, res, next) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { id } = req.params;
    const { master, details } = req.body;

    // Validate input
    if (!master) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      return res.status(400).json({ status: 'error', message: 'Master data is required' });
    }

    const devisWhere = await buildDevisSecurityWhere(id, req.user, transaction);

    const devis = await DevisMaster.findOne({ where: devisWhere, transaction });
    if (!devis) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      return res.status(404).json({ status: 'error', message: 'Devis non trouvé' });
    }

    const targetCodTiers = master.CodTiers || devis.CodTiers;
    const selectedTier = await Tiers.findOne({
      where: { CodTiers: targetCodTiers },
      attributes: ['IDTiers', 'CodTiers', 'Raisoc', 'Adresse', 'Ville', 'codRepresTiers', 'Gouvernorat', 'MapsRegion', 'Classe', 'Categorie'],
      transaction
    });

    if (!selectedTier) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      return res.status(400).json({ status: 'error', message: 'Client sélectionné introuvable' });
    }

    if (isCommercialUser(req.user)) {
      const currentUserId = String(req.user?.id || req.user?.UserID || '').trim();
      if (!currentUserId) {
        if (transaction && !transaction.finished) await transaction.rollback();
        return res.status(403).json({ status: 'error', message: 'Utilisateur commercial invalide' });
      }

      const filtreRepresEnabled = await isFiltreRepresEnabledForCommercialDevis(transaction);
      if (filtreRepresEnabled) {
        const tierRep = String(selectedTier.codRepresTiers || '').trim();
        if (!tierRep || tierRep !== currentUserId) {
          if (transaction && !transaction.finished) await transaction.rollback();
          return res.status(403).json({
            status: 'error',
            message: 'Ce client n\'est pas affecté à ce commercial'
          });
        }
      }
    }

    if (isAdminUser(req.user) && !master.CodRepres) {
      const tierRep = String(selectedTier.codRepresTiers || '').trim();
      if (tierRep) {
        master.CodRepres = tierRep;
      }
    }

    const tierPatch = await buildTierPatchFromMaster(master, transaction);
    if (Object.keys(tierPatch).length > 0) {
      await selectedTier.update(tierPatch, { transaction });
    }

    master.CodTiers = selectedTier.CodTiers;
    master.LibTiers = selectedTier.Raisoc || master.LibTiers || '';
    master.Adresse = selectedTier.Adresse || master.Adresse || '';
    master.Ville = selectedTier.Ville || master.Ville || '';

    const selectedProjectId = normalizeProjectId(master.ProjectId || master.projectId || master.ID_Projet || master.projetId);
    delete master.ProjectId;
    delete master.projectId;
    delete master.ID_Projet;
    delete master.projetId;
    master.CodProject = selectedProjectId || null;

    // Sanitize and clean master data
    const masterData = sanitizeMasterData(master);

    if (isCommercialUser(req.user)) {
      const codRepres = String(req.user?.id || req.user?.UserID || '').trim();
      if (!codRepres) {
        if (transaction && !transaction.finished) await transaction.rollback();
        return res.status(403).json({ status: 'error', message: 'Code représentant introuvable pour ce commercial' });
      }
      masterData.CodRepres = codRepres;
    }

    // Ajouter DatUser avec GETDATE() SQL (bypass Sequelize timezone)
    masterData.DatUser = sequelize.literal('GETDATE()');
    masterData.MDate = sequelize.literal('GETDATE()');

    // 1. Mettre à jour le master
    await devis.update(masterData, { transaction });

    // 2. Mettre à jour les détails (Supprimer et recréer pour plus de simplicité)
    if (details && Array.isArray(details)) {
      await DevisDetail.destroy({ where: { NF: devis.Nf }, transaction });
      if (details.length > 0) {
        const detailsWithNf = details.map((d) => {
          const detail = { ...d };
          delete detail.NetHT;  // Computed column in TabDevm
          delete detail.MntHT;  // Computed column in TabDevd
          delete detail.Guid;
          delete detail.NoDetail; // autoIncrement - let SQL Server generate it
          return {
            ...detail,
            NF: devis.Nf,
            ID: devis.Nf
          };
        });
        await DevisDetail.bulkCreate(detailsWithNf, { transaction });
      }
    }

    await transaction.commit();

    const result = await DevisMaster.findByPk(id, {
      include: [{ model: DevisDetail, as: 'details' }]
    });

    res.status(200).json({
      status: 'success',
      message: 'Devis mis à jour avec succès',
      data: result
    });
  } catch (error) {
    // Safely rollback transaction
    if (transaction) {
      try {
        if (!transaction.finished) {
          await transaction.rollback();
        }
      } catch (rollbackError) {
        console.error('❌ Error rolling back transaction:', rollbackError.message);
      }
    }
    console.error('❌ Error updateDevis:', error);
    next(error);
  }
};

/**
 * Supprimer un devis
 */
exports.deleteDevis = async (req, res, next) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { id } = req.params;
    const devisWhere = await buildDevisSecurityWhere(id, req.user, transaction);
    const devis = await DevisMaster.findOne({ where: devisWhere, transaction });

    if (!devis) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Devis non trouvé' });
    }

    // Supprimer les détails d'abord
    await DevisDetail.destroy({ where: { NF: devis.Nf }, transaction });

    // Supprimer le master
    await devis.destroy({ transaction });

    await transaction.commit();

    res.status(200).json({
      status: 'success',
      message: 'Devis supprimé avec succès'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error deleteDevis:', error);
    next(error);
  }
};

/**
 * Valider un devis
 */
exports.validateDevis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const devisWhere = await buildDevisSecurityWhere(id, req.user);
    const devis = await DevisMaster.findOne({ where: devisWhere });

    if (!devis) {
      return res.status(404).json({ status: 'error', message: 'Devis non trouvé' });
    }

    await devis.update({ Valid: true });

    res.status(200).json({
      status: 'success',
      message: 'Devis validé avec succès',
      data: devis
    });
  } catch (error) {
    console.error('❌ Error validateDevis:', error);
    next(error);
  }
};

/**
 * Convertir un devis en bon de commande (BCV)
 * Crée un vrai enregistrement BcvMaster + BcvDetail dans TabBcvm/TabBcvd
 * puis marque le devis source comme transféré (bTransf = true)
 */
exports.convertDevis = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const devisWhere = await buildDevisSecurityWhere(id, req.user, t);
    const devis = await DevisMaster.findOne({
      where: devisWhere,
      include: [{ model: DevisDetail, as: 'details' }],
      transaction: t
    });

    if (!devis) {
      await t.rollback();
      return res.status(404).json({ status: 'error', message: 'Devis non trouvé' });
    }

    if (devis.bTransf) {
      await t.rollback();
      return res.status(400).json({ status: 'error', message: 'Ce devis a déjà été converti en bon de commande' });
    }

    const data = devis.toJSON();
    const details = data.details || [];
    const newGuid = randomUUID();

    // Déterminer le prochain numéro BCV (Nf)
    const maxNf = await BcvMaster.max('Nf', { transaction: t }) || 0;
    const nextNf = maxNf + 1;

    // Créer le BcvMaster
    const masterData = {
      Guid: newGuid,
      Prfx: 'BC',
      Nf: nextNf,
      CodTiers: data.CodTiers,
      LibTiers: data.LibTiers,
      IDContact: data.IDContact,
      Adresse: data.Adresse,
      Remarq: data.Remarq,
      AssujTiers: data.AssujTiers,
      TotHT: data.TotHT,
      TotTva: data.TotTva,
      TotTTC: data.TotTTC,
      TotRem: data.TotRem,
      Timbre: data.Timbre,
      MntDebit: data.MntDebit,
      MntCredit: data.MntCredit,
      CodMag: data.CodMag,
      CodRepres: data.CodRepres,
      CodProject: data.CodProject || null,
      CodDev: data.CodDev,
      MDate: sequelize.literal('GETDATE()'),
      DatCreateUser: sequelize.literal('GETDATE()'),
      DatUser: sequelize.literal('GETDATE()'),
      Valid: false,
      bTransf: false,
      bLivr: false
    };

    await BcvMaster.create(masterData, { transaction: t });

    // Créer les BcvDetail
    if (details.length > 0) {
      const newDetails = details.map(d => ({
        Guid: randomUUID(),
        NF: nextNf,
        ID: nextNf,
        CodArt: d.CodArt,
        LibArt: d.LibArt,
        Qt: d.Qt,
        PuHT: d.PuHT,
        PuTTC: d.PuTTC,
        MntRem: d.MntRem,
        Codabar: d.Codabar,
        IDArt: d.IDArt
      }));
      await BcvDetail.bulkCreate(newDetails, { transaction: t });
    }

    // Marquer le devis source comme transféré
    await devis.update({ bTransf: true }, { transaction: t });

    await t.commit();

    // ✅ ENREGISTRER LA TRANSFORMATION DANS MvtDocs (DEV → BCV)
    try {
      const montants = {
        codTiers: data.CodTiers,
        libTiers: data.LibTiers,
        totalHT: data.TotHT,
        totalRem: data.TotRem,
        totalFodec: 0,
        totalTVA: data.TotTva,
        totalTTC: data.TotTTC
      };
      const userId = req.user?.id || req.user?.UserID;
      await mouvementService.enregistrerTransformation('DEV', data.Nf, 'BCV', nextNf, montants, userId);
      console.log(`✅ Mouvement enregistré: Transformation DEV #${data.Nf} → BCV #${nextNf} par utilisateur ${userId}`);
    } catch (mouvementError) {
      console.error('⚠️ Erreur enregistrement mouvement (non bloquant):', mouvementError.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'Devis converti en bon de commande avec succès',
      data: { Guid: newGuid, Nf: nextNf }
    });
  } catch (error) {
    if (t && !t.finished) await t.rollback();
    console.error('❌ Error convertDevis:', error);
    next(error);
  }
};

/**
 * Générer le PDF d'un devis
 */
exports.generateDevisPDF = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Récupérer les données du devis avec tous les détails
    const devis = await DevisMaster.findByPk(id, {
      include: [
        {
          model: DevisDetail,
          as: 'details'
        },
        {
          model: Tiers,
          as: 'tiers'
        }
      ]
    });

    if (!devis) {
      return res.status(404).json({ status: 'error', message: 'Devis non trouvé' });
    }

    // 2. Récupérer les infos société
    const soc = await TabSociete.findOne();

    // 3. Générer le PDF via le service
    const pdfBuffer = await PDFService.generateCommercialPDF(devis, soc, 'DEVIS');

    // 4. Envoyer le PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=devis_${devis.Prfx || 'DV'}${devis.Nf}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('❌ Error generateDevisPDF:', error);
    next(error);
  }
};

/**
 * Récupérer les devis de l'utilisateur connecté (Client Portal)
 */
exports.getMyDevis = async (req, res, next) => {
  try {
    const filterHelper = require('../utils/filterHelper');

    // Utilisation du système de filtrage centralisé (Module 31)
    const { where, limit, offset, page } = await filterHelper.applyTableDrivenFiltersWithPagination(
      '31',
      req.query,
      req.user
    );

    const listWhere = {
      [Op.and]: [where, { bTransf: false }]
    };

    const { count, rows } = await DevisMaster.findAndCountAll({
      where: listWhere,
      include: [
        { model: Tiers, as: 'tiers', attributes: ['CodTiers', 'Raisoc', 'Email'] },
      ],
      order: [['DatUser', 'DESC']],
      limit,
      offset,
      tableHint: TableHints.NOLOCK
    });


    res.json(
      filterHelper.formatPaginatedResponse(rows, count, page, limit)
    );
  } catch (error) {
    console.error('❌ Error getMyDevis:', error);
    next(error);
  }
};

