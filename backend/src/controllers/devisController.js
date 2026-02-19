// Devis controller

exports.getAllDevis = async (req, res, next) => {
  try {
    res.status(200).json({ status: 'success', message: 'Liste des devis - À implémenter', data: [] });
  } catch (error) {
    next(error);
  }
};

exports.getDevisById = async (req, res, next) => {
  try {
    res.status(200).json({ status: 'success', message: 'Détails devis - À implémenter', data: null });
  } catch (error) {
    next(error);
  }
};

exports.createDevis = async (req, res, next) => {
  try {
    res.status(201).json({ status: 'success', message: 'Devis créé - À implémenter' });
  } catch (error) {
    next(error);
  }
};

exports.updateDevis = async (req, res, next) => {
  try {
    res.status(200).json({ status: 'success', message: 'Devis mis à jour - À implémenter' });
  } catch (error) {
    next(error);
  }
};

exports.deleteDevis = async (req, res, next) => {
  try {
    res.status(200).json({ status: 'success', message: 'Devis supprimé - À implémenter' });
  } catch (error) {
    next(error);
  }
};

