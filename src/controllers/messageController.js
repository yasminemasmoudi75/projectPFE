// Message controller

exports.getAllMessages = async (req, res, next) => {
  try {
    res.status(200).json({ status: 'success', message: 'Liste des messages - À implémenter', data: [] });
  } catch (error) {
    next(error);
  }
};

exports.getMessageById = async (req, res, next) => {
  try {
    res.status(200).json({ status: 'success', message: 'Détails message - À implémenter', data: null });
  } catch (error) {
    next(error);
  }
};

exports.createMessage = async (req, res, next) => {
  try {
    res.status(201).json({ status: 'success', message: 'Message créé - À implémenter' });
  } catch (error) {
    next(error);
  }
};

exports.deleteMessage = async (req, res, next) => {
  try {
    res.status(200).json({ status: 'success', message: 'Message supprimé - À implémenter' });
  } catch (error) {
    next(error);
  }
};

