const { sequelize } = require('../config/database');

// Import des modèles
const User = require('./User');
const Message = require('./Message');
const Projet = require('./Projet');
const Activite = require('./Activite');
const Objectif = require('./Objectif');
const Tiers = require('./Tiers');
const TiersContact = require('./TiersContact');
const TiersAdr = require('./TiersAdr');
const Product = require('./Product');
const Stock = require('./Stock');
const TabStockD = require('./TabStockD');
const Category = require('./Category');
const Collection = require('./Collection');
const DevisMaster = require('./DevisMaster');
const DevisDetail = require('./DevisDetail');
const BcvMaster = require('./BcvMaster');
const BcvDetail = require('./BcvDetail');
const Reclamation = require('./Reclamation');
const TabDI = require('./TabDI');
const TabBT = require('./TabBT');
const TiersClasse = require('./TiersClasse');
const TiersGouvernorat = require('./TiersGouvernorat');
const TiersCategorie = require('./TiersCategorie');
const TabSociete = require('./TabSociete');
const BlvMaster = require('./BlvMaster');
const BlvDetail = require('./BlvDetail');
const FavMaster = require('./FavMaster');
const FavDetail = require('./FavDetail');

// Définition des relations
console.log('🔗 Setting up associations...');

// BCV Master - Detail (1:N)
BcvMaster.hasMany(BcvDetail, {
  foreignKey: 'NF',
  sourceKey: 'Nf',
  as: 'details'
});
BcvDetail.belongsTo(BcvMaster, {
  foreignKey: 'NF',
  targetKey: 'Nf',
  as: 'master'
});

// BcvMaster - Tiers (N:1)
BcvMaster.belongsTo(Tiers, {
  foreignKey: 'CodTiers',
  targetKey: 'CodTiers',
  as: 'client'
});
Tiers.hasMany(BcvMaster, {
  foreignKey: 'CodTiers',
  sourceKey: 'CodTiers',
  as: 'bcv'
});

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

// BLV Master - Detail (1:N)
BlvMaster.hasMany(BlvDetail, {
  foreignKey: 'NF',
  sourceKey: 'Nf',
  as: 'details'
});
BlvDetail.belongsTo(BlvMaster, {
  foreignKey: 'NF',
  targetKey: 'Nf',
  as: 'master'
});

// BlvMaster - Tiers (N:1)
BlvMaster.belongsTo(Tiers, {
  foreignKey: 'CodTiers',
  targetKey: 'CodTiers',
  as: 'client'
});
Tiers.hasMany(BlvMaster, {
  foreignKey: 'CodTiers',
  sourceKey: 'CodTiers',
  as: 'blv'
});

// FAV Master - Detail (1:N)
FavMaster.hasMany(FavDetail, {
  foreignKey: 'NF',
  sourceKey: 'Nf',
  as: 'details'
});
FavDetail.belongsTo(FavMaster, {
  foreignKey: 'NF',
  targetKey: 'Nf',
  as: 'master'
});

// FavMaster - Tiers (N:1)
FavMaster.belongsTo(Tiers, {
  foreignKey: 'CodTiers',
  targetKey: 'CodTiers',
  as: 'client'
});
Tiers.hasMany(FavMaster, {
  foreignKey: 'CodTiers',
  sourceKey: 'CodTiers',
  as: 'fav'
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
  sourceKey: 'UserID',
  as: 'sentMessages'
});
User.hasMany(Message, {
  foreignKey: 'RecipientID',
  sourceKey: 'UserID',
  as: 'receivedMessages'
});
Message.belongsTo(User, {
  foreignKey: 'SenderID',
  targetKey: 'UserID',
  as: 'sender'
});
Message.belongsTo(User, {
  foreignKey: 'RecipientID',
  targetKey: 'UserID',
  as: 'recipient'
});

// User - Activite (1:N)
User.hasMany(Activite, {
  foreignKey: 'User',
  sourceKey: 'UserID',
  as: 'activites'
});
Activite.belongsTo(User, {
  foreignKey: 'User',
  targetKey: 'UserID',
  as: 'utilisateur'
});

// User - Objectif (1:N)
User.hasMany(Objectif, {
  foreignKey: 'IdCont',
  sourceKey: 'GUID',
  as: 'objectifs'
});
Objectif.belongsTo(User, {
  foreignKey: 'IdCont',
  targetKey: 'GUID',
  as: 'utilisateur'
});

// Tiers - Projet (1:N)
Tiers.hasMany(Projet, {
  foreignKey: 'IDTiers', // Mapped to CodSoc in Projet.js
  sourceKey: 'CodTiers',
  as: 'projets'
});
Projet.belongsTo(Tiers, {
  foreignKey: 'IDTiers',
  targetKey: 'CodTiers',
  as: 'client'
});

// Tiers - Activite (1:N)
Tiers.hasMany(Activite, {
  foreignKey: 'CodTiers',
  sourceKey: 'CodTiers',
  as: 'activites'
});
Activite.belongsTo(Tiers, {
  foreignKey: 'CodTiers',
  targetKey: 'CodTiers',
  as: 'tiers'
});

// Tiers - Contacts (1:N)
Tiers.hasMany(TiersContact, {
  foreignKey: 'IDTiers',
  sourceKey: 'IDTiers',
  as: 'contacts'
});
TiersContact.belongsTo(Tiers, {
  foreignKey: 'IDTiers',
  targetKey: 'IDTiers',
  as: 'tiers'
});

// Tiers - Adresses (1:N)
Tiers.hasMany(TiersAdr, {
  foreignKey: 'IDTiers',
  sourceKey: 'IDTiers',
  as: 'addresses'
});
TiersAdr.belongsTo(Tiers, {
  foreignKey: 'IDTiers',
  targetKey: 'IDTiers',
  as: 'tiers'
});

// Tiers - TiersClasse (N:1)
Tiers.belongsTo(TiersClasse, {
  foreignKey: 'Classe',
  targetKey: 'id',
  as: 'tiersClasse'
});
TiersClasse.hasMany(Tiers, {
  foreignKey: 'Classe',
  sourceKey: 'id',
  as: 'tiers'
});

// Tiers - TiersGouvernorat (N:1)
Tiers.belongsTo(TiersGouvernorat, {
  foreignKey: 'gouvernorat',
  targetKey: 'id',
  as: 'region'
});

Tiers.belongsTo(TiersCategorie, {
  foreignKey: 'Categorie',
  targetKey: 'id',
  as: 'tiersCategorieObj'
});
TiersGouvernorat.hasMany(Tiers, {
  foreignKey: 'gouvernorat',
  sourceKey: 'id',
  as: 'tiers'
});

// Projet - Activite (1:N)
Projet.hasMany(Activite, {
  foreignKey: 'Nf',
  sourceKey: 'nf',
  as: 'activites'
});
Activite.belongsTo(Projet, {
  foreignKey: 'Nf',
  targetKey: 'nf',
  as: 'projet'
});

// User - Reclamation (1:N)
User.hasMany(Reclamation, {
  foreignKey: 'TechnicienID',
  sourceKey: 'UserID',
  as: 'reclamations'
});
Reclamation.belongsTo(User, {
  foreignKey: 'TechnicienID',
  targetKey: 'UserID',
  as: 'technicien'
});

// Product - TabStockD (1:N)
Product.hasMany(TabStockD, {
  foreignKey: 'IDArt',
  sourceKey: 'IDArt',
  as: 'variants'
});
TabStockD.belongsTo(Product, {
  foreignKey: 'IDArt',
  targetKey: 'IDArt',
  as: 'product'
});

console.log('✅ Associations setup complete.');

// Export des modèles et de la connexion
module.exports = {
  sequelize,
  User,
  Message,
  DevisMaster,
  DevisDetail,
  BcvMaster,
  BcvDetail,
  Reclamation,
  Projet,
  Activite,
  Objectif,
  Tiers,
  TiersContact,
  TiersAdr,
  Product,
  TabStockD,
  Stock,
  Category,
  Collection,
  TabDI,
  TabBT,
  TiersClasse,
  TiersGouvernorat,
  TiersCategorie,
  TabSociete,
  BlvMaster,
  BlvDetail,
  FavMaster,
  FavDetail
};
