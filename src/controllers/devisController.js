const { DevisMaster, DevisDetail, BcvMaster, BcvDetail, Tiers, Product, TabSociete, sequelize } = require('../models');
const { Op } = require('sequelize');
const PDFService = require('../services/pdfService');
const mouvementService = require('../services/mouvementService'); // ✅ Service de traçabilité mouvements
const { randomUUID } = require('crypto');
const { normalizeRole } = require('../utils/userAccess');

const isStaffRole = (role) => {
  const normalized = normalizeRole(role);
  return ['commercial', 'agent', 'technicien'].includes(normalized);
};

const isClientRole = (role) => {
  const normalized = String(role || '').trim().toLowerCase();
  return normalized === 'client';
};

const getCommercialIdentifiers = (user = {}) => {
  const numericUserId = Number(user?.UserID || user?.id);
  const userIdAsString = Number.isFinite(numericUserId) ? String(Math.trunc(numericUserId)) : null;

  const candidates = [
    user?.CodRepres,
    user?.codRepres,
    userIdAsString,
    user?.LoginName,
    user?.EmailPro,
    user?.GUID
  ];

  return Array.from(new Set(
    candidates
      .map((value) => (value === null || value === undefined ? null : String(value).trim().toLowerCase()))
      .filter((value) => value)
  ));
};

const buildCommercialCodRepresFilter = (user = {}) => {
  const identifiers = getCommercialIdentifiers(user);
  if (identifiers.length === 0) {
    return { Guid: '__NO_MATCH__' };
  }

  return {
    [Op.or]: identifiers.map((identifier) =>
      sequelize.where(sequelize.fn('LOWER', sequelize.col('CodRepres')), identifier)
    )
  };
};

const resolveCommercialCodRepresValue = (user = {}) => {
  const numericUserId = Number(user?.UserID || user?.id);
  if (Number.isFinite(numericUserId)) {
    return String(Math.trunc(numericUserId));
  }

  const fallback = user?.CodRepres || user?.codRepres || user?.LoginName || user?.EmailPro || user?.GUID;
  return fallback ? String(fallback).trim().slice(0, 10) : null;
};

const RECENT_DEVIS_ORDER = [
  ['Nf', 'DESC'],
  ['DatCreateUser', 'DESC'],
  ['DatUser', 'DESC']
];

// Build filter for clients - they only see their own devis
// This is async because we need to look up the Tiers by email
const buildClientFilter = async (user = {}) => {
  const userEmail = (user?.EmailPro || '').toLowerCase().trim();
  const userLogin = (user?.LoginName || '').toLowerCase().trim();
  const directCodTiers = user?.CodTiers || user?.codTiers || null;
  
  const orConditions = [];

  if (directCodTiers) {
    orConditions.push({ CodTiers: directCodTiers });
  }
  
  // 1. Filter by CUser (created by user)
  if (userEmail) orConditions.push(sequelize.where(sequelize.fn('LOWER', sequelize.col('CUser')), userEmail));
  if (userLogin && userLogin !== userEmail) orConditions.push(sequelize.where(sequelize.fn('LOWER', sequelize.col('CUser')), userLogin));
  
  // 2. Filter by CodRepres (commercial representative)
  if (userEmail) orConditions.push(sequelize.where(sequelize.fn('LOWER', sequelize.col('CodRepres')), userEmail));
  if (userLogin && userLogin !== userEmail) orConditions.push(sequelize.where(sequelize.fn('LOWER', sequelize.col('CodRepres')), userLogin));
  
  // 3. Look up Tiers by email to get CodTiers
  if (userEmail) {
    try {
      const tiers = await Tiers.findOne({
        where: sequelize.where(sequelize.fn('LOWER', sequelize.col('Email')), userEmail),
        attributes: ['CodTiers'],
      });
      
      if (tiers?.CodTiers) {
        orConditions.push({ CodTiers: tiers.CodTiers });
      }
    } catch (err) {
      console.error('Error finding Tiers for client filter:', err.message);
    }
  }
  
  if (orConditions.length === 0) {
    return { Guid: '__NO_MATCH__' };
  }
  
  return { [Op.or]: orConditions };
};

/**
 * Récupérer tous les devis
 */
exports.getAllDevis = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    const filters = [];

    // Exclude converted devis (bTransf = true)
    filters.push({ [Op.or]: [{ bTransf: false }, { bTransf: null }] });

    if (search) {
      filters.push({
        [Op.or]: [
          { Nf: { [Op.like]: `%${search}%` } },
          { LibTiers: { [Op.like]: `%${search}%` } }
        ]
      });
    }

    if (status) {
      if (status === 'valid') filters.push({ Valid: true });
      if (status === 'pending') filters.push({ Valid: false });
    }

    if (isStaffRole(req.user?.UserRole)) {
      filters.push(buildCommercialCodRepresFilter(req.user));
    }

    // Client filter - only their own devis
    if (isClientRole(req.user?.UserRole)) {
      filters.push(await buildClientFilter(req.user));
    }

    const where = filters.length === 1 ? filters[0] : { [Op.and]: filters };

    const { count, rows } = await DevisMaster.findAndCountAll({
      where,
      include: [{
        model: Tiers,
        as: 'tiers',
        attributes: ['Raisoc', 'CodTiers', 'Ville']
      }],
      order: RECENT_DEVIS_ORDER,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      status: 'success',
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      },
      data: rows
    });
  } catch (error) {
    console.error('❌ Error getAllDevis:', error);
    next(error);
  }
};

/**
 * Récupérer un devis par son Guid (ID)
 */
exports.getDevisById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Build role-based filter
    let where = { Guid: id };
    
    if (isStaffRole(req.user?.UserRole)) {
      where = { [Op.and]: [{ Guid: id }, buildCommercialCodRepresFilter(req.user)] };
    } else if (isClientRole(req.user?.UserRole)) {
      where = { [Op.and]: [{ Guid: id }, await buildClientFilter(req.user)] };
    }

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
      ]
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

  // Parse and validate all date fields
  const dateFields = ['MDate', 'DatLiv'];
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

    if (isStaffRole(req.user?.UserRole)) {
      const codRepres = resolveCommercialCodRepresValue(req.user);
      if (!codRepres) {
        if (transaction && !transaction.finished) await transaction.rollback();
        return res.status(403).json({ status: 'error', message: 'Code représentant introuvable pour ce commercial' });
      }
      master.CodRepres = codRepres;
    }

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

    const devisWhere = isStaffRole(req.user?.UserRole)
      ? { [Op.and]: [{ Guid: id }, buildCommercialCodRepresFilter(req.user)] }
      : { Guid: id };

    const devis = await DevisMaster.findOne({ where: devisWhere, transaction });
    if (!devis) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      return res.status(404).json({ status: 'error', message: 'Devis non trouvé' });
    }

    // Sanitize and clean master data
    const masterData = sanitizeMasterData(master);

    if (isStaffRole(req.user?.UserRole)) {
      const codRepres = resolveCommercialCodRepresValue(req.user);
      if (!codRepres) {
        if (transaction && !transaction.finished) await transaction.rollback();
        return res.status(403).json({ status: 'error', message: 'Code représentant introuvable pour ce commercial' });
      }
      masterData.CodRepres = codRepres;
    }

    // Ajouter DatUser avec GETDATE() SQL (bypass Sequelize timezone)
    masterData.DatUser = sequelize.literal('GETDATE()');

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
    const devisWhere = isStaffRole(req.user?.UserRole)
      ? { [Op.and]: [{ Guid: id }, buildCommercialCodRepresFilter(req.user)] }
      : { Guid: id };
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
    const devisWhere = isStaffRole(req.user?.UserRole)
      ? { [Op.and]: [{ Guid: id }, buildCommercialCodRepresFilter(req.user)] }
      : { Guid: id };
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
    const devisWhere = isStaffRole(req.user?.UserRole)
      ? { [Op.and]: [{ Guid: id }, buildCommercialCodRepresFilter(req.user)] }
      : { Guid: id };
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
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Use the same comprehensive client filter
    const where = await buildClientFilter(req.user);
    console.log('🧾 getMyDevis client filter:', JSON.stringify(where, null, 2));

    const { count, rows } = await DevisMaster.findAndCountAll({
      where,
      include: [
        { model: DevisDetail, as: 'details' },
        { model: Tiers, as: 'tiers', attributes: ['CodTiers', 'Raisoc', 'Email'] },
      ],
      order: [['DatUser', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      status: 'success',
      data: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) },
    });
  } catch (error) {
    console.error('❌ Error getMyDevis:', error);
    next(error);
  }
};
