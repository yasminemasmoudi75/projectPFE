const { DevisMaster, DevisDetail, Tiers, Product, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Récupérer tous les devis
 */
exports.getAllDevis = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    // Exclude converted devis (bTransf = true)
    where.bTransf = { [Op.ne]: true };

    if (search) {
      where[Op.or] = [
        { Nf: { [Op.like]: `%${search}%` } },
        { LibTiers: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status) {
      if (status === 'valid') where.Valid = true;
      if (status === 'pending') where.Valid = false;
    }

    const { count, rows } = await DevisMaster.findAndCountAll({
      where,
      include: [{
        model: Tiers,
        as: 'tiers',
        attributes: ['Raisoc', 'CodTiers', 'Ville']
      }],
      order: [['DatUser', 'DESC']],
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
    const devis = await DevisMaster.findByPk(id, {
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
 * Helper function to parse and format dates for SQL Server
 */
const formatDateForSQL = (dateValue) => {
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

    // Return formatted string without timezone for SQL Server DATETIME compatibility
    const pad = (n) => String(n).padStart(2, '0');
    const pad3 = (n) => String(n).padStart(3, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad3(date.getMilliseconds())}`;
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

  // Helper: format JS Date to SQL Server DATETIME string (no timezone offset)
  const toSQLDate = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    const pad3 = (n) => String(n).padStart(3, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad3(d.getMilliseconds())}`;
  };

  // Parse and validate all date fields
  const dateFields = ['DatUser', 'MDate', 'DatLiv'];
  dateFields.forEach(field => {
    const val = sanitized[field];
    if (!val || val === '' || val === 'null' || val === null) {
      sanitized[field] = (field === 'DatUser') ? toSQLDate(new Date()) : null;
    } else {
      const parsed = formatDateForSQL(val);
      sanitized[field] = parsed || (field === 'DatUser' ? toSQLDate(new Date()) : null);
    }
  });

  // Ensure DatUser is always set
  if (!sanitized.DatUser) {
    sanitized.DatUser = toSQLDate(new Date());
  }

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

    // 2. Créer le master
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

    const devis = await DevisMaster.findByPk(id, { transaction });
    if (!devis) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      return res.status(404).json({ status: 'error', message: 'Devis non trouvé' });
    }

    // Sanitize and clean master data
    const masterData = sanitizeMasterData(master);

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
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const devis = await DevisMaster.findByPk(id);

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
    const devis = await DevisMaster.findByPk(id);

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
 * Convertir un devis en commande
 */
exports.convertDevis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const devis = await DevisMaster.findByPk(id);

    if (!devis) {
      return res.status(404).json({ status: 'error', message: 'Devis non trouvé' });
    }

    // Set bTransf to true to mark as converted to bon de commande
    await devis.update({ bTransf: true, IsConverted: true });

    res.status(200).json({
      status: 'success',
      message: 'Devis converti avec succès',
      data: devis
    });
  } catch (error) {
    console.error('❌ Error convertDevis:', error);
    next(error);
  }
};

/**
 * Récupérer tous les bons de commande (devis convertis)
 */
exports.getAllOrders = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    // Only get converted devis (bTransf = true)
    where.bTransf = true;

    if (search) {
      where[Op.or] = [
        { Nf: { [Op.like]: `%${search}%` } },
        { LibTiers: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await DevisMaster.findAndCountAll({
      where,
      include: [{
        model: Tiers,
        as: 'tiers',
        attributes: ['Raisoc', 'CodTiers', 'Ville']
      }],
      order: [['DatUser', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      status: 'success',
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error getAllOrders:', error);
    next(error);
  }
};
