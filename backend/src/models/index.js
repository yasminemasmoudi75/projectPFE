const { sequelize } = require('../config/database');

// Import des modèles
const User = require('./User');
const Message = require('./Message');
const Projet = require('./Projet');
const Activite = require('./Activite');
const Objectif = require('./Objectif');
const LogConnexion = require('./LogConnexion');
const Tiers = require('./Tiers');
const Product = require('./Product');
const Category = require('./Category');
const Collection = require('./Collection');
const DevisMaster = require('./DevisMaster');
const DevisDetail = require('./DevisDetail');

// Définition des relations

// Devis Master - Detail (1:N)
DevisMaster.hasMany(DevisDetail, {
  foreignKey: 'NF',
  sourceKey: 'Nf',
  as: 'details'
});
DevisDetail.belongsTo(DevisMaster, {
  foreignKey: 'NF',
  targetKey: 'Nf',
  as: 'master'
});

// DevisDetail - Product (N:1) - Pour récupérer l'image du produit
DevisDetail.belongsTo(Product, {
  foreignKey: 'IDArt',
  targetKey: 'IDArt',
  as: 'product'
});
Product.hasMany(DevisDetail, {
  foreignKey: 'IDArt',
  sourceKey: 'IDArt',
  as: 'devisDetails'
});

// Tiers - DevisMaster (1:N)
Tiers.hasMany(DevisMaster, {
  foreignKey: 'CodTiers',
  sourceKey: 'CodTiers',
  as: 'devis'
});
DevisMaster.belongsTo(Tiers, {
  foreignKey: 'CodTiers',
  targetKey: 'CodTiers',
  as: 'tiers'
});

// Product - Collection
Product.belongsTo(Collection, {
  foreignKey: 'Collection',
  targetKey: 'Collection',
  as: 'collectionDetail'
});
Collection.hasMany(Product, {
  foreignKey: 'Collection',
  sourceKey: 'Collection',
  as: 'products'
});

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
  DevisMaster,
  DevisDetail,
  Projet,
  Activite,
  Objectif,
  LogConnexion,
  Tiers,
  Product,
  Category,
  Collection
};
