const { TiersContact } = require('../models');

console.log('✅ contactController.js loaded');

/**
 * Récupérer tous les contacts
 */
exports.getContacts = async (req, res, next) => {
  try {
    console.log('🔍 Fetching all contacts');

    const contacts = await TiersContact.findAll({
      attributes: ['IDTiers', 'ID', 'Responsable', 'Tel'],
      include: [
        {
          model: require('../models').TiersContactClasse,
          as: 'classeAuto',
          attributes: ['CA', 'ClasseCalculee']
        }
      ],
      limit: 1000
    });

    res.status(200).json({
      status: 'success',
      data: contacts
    });
  } catch (error) {
    console.error('❌ Error in getContacts:', error);
    next(error);
  }
};

/**
 * Récupérer les contacts d'un client spécifique
 */
exports.getContactsByTier = async (req, res, next) => {
  try {
    const { tierId } = req.params;
    console.log(`🔍 Fetching contacts for tier: ${tierId}`);

    const contacts = await TiersContact.findAll({
      where: { IDTiers: tierId },
      attributes: ['IDTiers', 'ID', 'Responsable', 'Tel'],
      include: [
        {
          model: require('../models').TiersContactClasse,
          as: 'classeAuto',
          attributes: ['CA', 'ClasseCalculee']
        }
      ]
    });

    res.status(200).json({
      status: 'success',
      data: contacts
    });
  } catch (error) {
    console.error('❌ Error in getContactsByTier:', error);
    next(error);
  }
};

/**
 * Créer un nouveau contact
 */
exports.createContact = async (req, res, next) => {
  try {
    const { IDTiers, Responsable, Tel } = req.body;

    if (!IDTiers) {
      return res.status(400).json({
        status: 'error',
        message: 'IDTiers est obligatoire'
      });
    }

    const contact = await TiersContact.create({
      IDTiers,
      Responsable: Responsable || null,
      Tel: Tel || null
    });

    res.status(201).json({
      status: 'success',
      message: 'Contact créé avec succès',
      data: contact
    });
  } catch (error) {
    console.error('❌ Error in createContact:', error);
    next(error);
  }
};

/**
 * Modifier un contact
 */
exports.updateContact = async (req, res, next) => {
  try {
    const { tierId, contactId } = req.params;
    const { Responsable, Tel } = req.body;

    const contact = await TiersContact.findOne({
      where: { IDTiers: tierId, ID: contactId }
    });

    if (!contact) {
      return res.status(404).json({
        status: 'error',
        message: 'Contact non trouvé'
      });
    }

    await contact.update({
      Responsable: Responsable !== undefined ? Responsable : contact.Responsable,
      Tel: Tel !== undefined ? Tel : contact.Tel
    });

    res.status(200).json({
      status: 'success',
      message: 'Contact modifié avec succès',
      data: contact
    });
  } catch (error) {
    console.error('❌ Error in updateContact:', error);
    next(error);
  }
};

/**
 * Supprimer un contact
 */
exports.deleteContact = async (req, res, next) => {
  try {
    const { tierId, contactId } = req.params;

    const contact = await TiersContact.findOne({
      where: { IDTiers: tierId, ID: contactId }
    });

    if (!contact) {
      return res.status(404).json({
        status: 'error',
        message: 'Contact non trouvé'
      });
    }

    await contact.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Contact supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Error in deleteContact:', error);
    next(error);
  }
};
