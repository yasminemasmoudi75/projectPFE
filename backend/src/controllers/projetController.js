const { Projet, Tiers } = require('../models');
const { sequelize } = require('../config/database');
const { sanitizeDate, formatDateForMSSQL } = require('../utils/helpers');

console.log('✅ projetController.js loaded');

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

    // Validation des dates
    if (dateEcheance && dateCloture && dateCloture > dateEcheance) {
      return res.status(400).json({
        status: 'error',
        message: 'La date de clôture ne peut pas être après la date d\'échéance'
      });
    }

    // Vérifier que le Tiers existe si fourni
    if (IDTiers) {
      const tiers = await Tiers.findByPk(IDTiers);
      if (!tiers) {
        return res.status(404).json({
          status: 'error',
          message: `Le client (Tiers) avec l'ID ${IDTiers} n'existe pas`
        });
      }
    }

    console.log('📝 Attempting to create project in database...');
    const newProjet = await Projet.create({
      Code_Pro: finalCodePro,
      Nom_Projet: Nom_Projet.trim(),
      IDTiers: IDTiers || null,
      CA_Estime: CA_Estime || 0,
      Budget_Alloue: Budget_Alloue || 0,
      Avancement: avancementNum,
      Phase: Phase || null,
      Priorite: Priorite || null,
      Date_Creation: formatDateForMSSQL(new Date()),
      Date_Echeance: dateEcheance,
      Date_Cloture_Reelle: dateCloture,
      Note_Privee: Note_Privee || null,
      Alerte_IA_Risque: Alerte_IA_Risque || false
    });

    console.log('✅ Project created successfully with ID:', newProjet.ID_Projet);

    // Récupérer le projet avec ses relations
    const projet = await Projet.findByPk(newProjet.ID_Projet, {
      include: [
        {
          model: Tiers,
          as: 'client',
          attributes: ['IDTiers', 'Raisoc', 'CodTiers']
        }
      ]
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    console.log(`🔍 Fetching projets: page=${page}, limit=${limit}, offset=${offset}`);

    const { count, rows } = await Projet.findAndCountAll({
      include: [
        {
          model: Tiers,
          as: 'client',
          attributes: ['IDTiers', 'Raisoc', 'CodTiers']
        }
      ],
      order: [['Date_Creation', 'DESC'], ['ID_Projet', 'DESC']],
      limit: limit,
      offset: offset,
      distinct: true
    });

    res.status(200).json({
      status: 'success',
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      },
      data: rows
    });
  } catch (error) {
    console.error('❌ Error in getProjets:', error);
    next(error);
  }
};

/**
 * Récupérer un projet par ID
 */
exports.getProjetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Fetching projet with ID: ${id}`);
    const projet = await Projet.findByPk(id, {
      include: [
        {
          model: Tiers,
          as: 'client',
          attributes: ['IDTiers', 'Raisoc', 'CodTiers']
        }
      ]
    });

    if (!projet) {
      console.log(`⚠️ Projet ${id} not found`);
      return res.status(404).json({
        status: 'error',
        message: 'Projet non trouvé'
      });
    }

    res.status(200).json({
      status: 'success',
      data: projet
    });
  } catch (error) {
    console.error(`❌ Error in getProjetById (${req.params.id}):`, error);
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
      Avancement,
      Date_Echeance,
      Date_Cloture_Reelle,
      ...otherFields
    } = req.body;

    const projet = await Projet.findByPk(id);

    if (!projet) {
      return res.status(404).json({
        status: 'error',
        message: 'Projet non trouvé'
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

    // Préparer la mise à jour
    const updateData = {};
    if (Nom_Projet !== undefined) updateData.Nom_Projet = Nom_Projet.trim();
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
      include: [
        {
          model: Tiers,
          as: 'client',
          attributes: ['IDTiers', 'Raisoc', 'CodTiers']
        }
      ]
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
    const projet = await Projet.findByPk(id);

    if (!projet) {
      return res.status(404).json({
        status: 'error',
        message: 'Projet non trouvé'
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
