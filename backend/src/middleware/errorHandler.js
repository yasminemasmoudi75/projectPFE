const errorHandler = (err, req, res, next) => {
  console.error('❌ Erreur:', err);

  // Erreur de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Erreur de validation',
      errors: err.errors,
    });
  }

  // Erreur Sequelize
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Erreur de validation de la base de données',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      status: 'error',
      message: 'Cette entrée existe déjà (doublon détecté)',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({
      status: 'error',
      message: 'Impossible de réaliser l\'opération car une contrainte référentielle est violée (ex: utilisateur inexistant)',
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token invalide',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token expiré',
    });
  }

  // Erreur par défaut
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;

