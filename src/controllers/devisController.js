const { DevisMaster, DevisDetail, BcvMaster, BcvDetail, Tiers, Product, TabSociete, sequelize } = require('../models');
const { Op, TableHints } = require('sequelize');

const PDFService = require('../services/pdfService');
const mouvementService = require('../services/mouvementService'); // ✅ Service de traçabilité mouvements
const { randomUUID } = require('crypto');
const { sanitizeMasterData, sanitizeDetailData } = require('../utils/documentHelper');

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
    console.log('✅ [DevisController] Filters applied:', JSON.stringify(where));

    console.log('📊 [DevisController] Running query on DevisMaster...');
    const { count, rows } = await DevisMaster.findAndCountAll({
      where,
      include: [{
        model: Tiers,
        as: 'tiers',
        attributes: ['Raisoc', 'CodTiers', 'Ville']
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

    if (req.user?.UserRole && req.user.UserRole.toLowerCase().includes('commercial')) {
      const codRepres = req.user.id || req.user.UserID;
      master.CodRepres = String(codRepres);
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
        const sanitizedDetail = sanitizeDetailData(d);
        return {
          ...sanitizedDetail,
          NF: newDevis.Nf,
          ID: newDevis.Nf,
          Guid: randomUUID()
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

    const devisWhere = isCommercialRole(req.user?.UserRole)
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

    if (isCommercialRole(req.user?.UserRole)) {
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
          const sanitizedDetail = sanitizeDetailData(d);
          return {
            ...sanitizedDetail,
            NF: devis.Nf,
            ID: devis.Nf,
            Guid: randomUUID()
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
    const devisWhere = isCommercialRole(req.user?.UserRole)
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
    const devisWhere = isCommercialRole(req.user?.UserRole)
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
    const devisWhere = isCommercialRole(req.user?.UserRole)
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
    const bcvMasterRaw = {
      ...data,
      Guid: newGuid,
      Prfx: 'BC',
      Nf: nextNf,
      MDate: sequelize.literal('GETDATE()'),
      DatCreateUser: sequelize.literal('GETDATE()'),
      DatUser: sequelize.literal('GETDATE()'),
      Valid: false,
      bTransf: false,
      bLivr: false
    };
    const bcvMasterData = sanitizeMasterData(bcvMasterRaw);

    await BcvMaster.create(bcvMasterData, { transaction: t });

    // Créer les BcvDetail
    if (details.length > 0) {
      const newDetails = details.map(d => {
        const sanitizedDetail = sanitizeDetailData(d);
        return {
          ...sanitizedDetail,
          Guid: randomUUID(),
          NF: nextNf,
          ID: nextNf
        };
      });
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

    const { count, rows } = await DevisMaster.findAndCountAll({
      where,
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

