const { sequelize } = require('../config/database');

// Import des modèles
const User = require('./User');
const Message = require('./Message');
const Devis = require('./Devis');
const Projet = require('./Projet');
const Activite = require('./Activite');
const Objectif = require('./Objectif');
const LogConnexion = require('./LogConnexion');
const Tiers = require('./Tiers');

// Définition des relations

// User - Message (1:N)
User.hasMany(Message, {
  foreignKey: 'SenderID',
  as: 'sentMessages'
});
User.hasMany(Message, {
  foreignKey: 'RecipientID',
  as: 'receivedMessages'
});
Message.belongsTo(User, {
  foreignKey: 'SenderID',
  as: 'sender'
});
Message.belongsTo(User, {
  foreignKey: 'RecipientID',
  as: 'recipient'
});

// User - Activite (1:N)
User.hasMany(Activite, {
  foreignKey: 'ID_Utilisateur',
  as: 'activites'
});
Activite.belongsTo(User, {
  foreignKey: 'ID_Utilisateur',
  as: 'utilisateur'
});

// User - Objectif (1:N)
User.hasMany(Objectif, {
  foreignKey: 'ID_Utilisateur',
  as: 'objectifs'
});
Objectif.belongsTo(User, {
  foreignKey: 'ID_Utilisateur',
  as: 'utilisateur'
});

// User - LogConnexion (1:N)
User.hasMany(LogConnexion, {
  foreignKey: 'UserID',
  as: 'logs'
});
LogConnexion.belongsTo(User, {
  foreignKey: 'UserID',
  as: 'user'
});

// Tiers - Projet (1:N)
Tiers.hasMany(Projet, {
  foreignKey: 'IDTiers',
  as: 'projets'
});
Projet.belongsTo(Tiers, {
  foreignKey: 'IDTiers',
  as: 'client'
});

// Tiers - Activite (1:N)
Tiers.hasMany(Activite, {
  foreignKey: 'IDTiers',
  as: 'activites'
});
Activite.belongsTo(Tiers, {
  foreignKey: 'IDTiers',
  as: 'tiers'
});

// Projet - Activite (1:N)
Projet.hasMany(Activite, {
  foreignKey: 'ID_Projet',
  as: 'activites'
});
Activite.belongsTo(Projet, {
  foreignKey: 'ID_Projet',
  as: 'projet'
});

// Export des modèles et de la connexion
module.exports = {
  sequelize,
  User,
  Message,
  Devis,
  Projet,
  Activite,
  Objectif,
  LogConnexion,
  Tiers
};
