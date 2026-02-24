/**
 * ================================================================
 * GUIDE D'IMPLÉMENTATION - MODÈLES SEQUELIZE & CONTROLLERS
 * Flux SAV Complet (Réclamation → DI → EquipDi → BT → Résolution)
 * ================================================================
 */

const IMPLEMENTATION_ROADMAP = `
╔═══════════════════════════════════════════════════════════════════════════╗
║            FEUILLE DE ROUTE: IMPLÉMENTATION FLUX SAV COMPLET             ║
╚═══════════════════════════════════════════════════════════════════════════╝

════════════════════════════════════════════════════════════════════════════════
PHASE 1: CRÉER LES MODÈLES SEQUELIZE (JOUR 1-2)
════════════════════════════════════════════════════════════════════════════════

📋 À CRÉER:
  1. src/models/DI.js (Demande d'Intervention)
  2. src/models/EquipDi.js (Assignation DI-Technicien)
  3. src/models/BonTravail.js (Bon de Travail)  
  4. src/models/Equipement.js (Équipements clients)
  5. src/models/Panne.js (Types de pannes)
  6. src/models/Symptome.js (Symptômes)
  7. src/models/Remede.js (Solutions/Remèdes)

════════════════════════════════════════════════════════════════════════════════

🔧 FICHIER 1: src/models/Equipement.js
════════════════════════════════════════════════════════════════════════════════

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Equipement = sequelize.define('Equipement', {
    IDEquip: {
      type: DataTypes.CHAR(36),  // UNIQUEIDENTIFIER
      primaryKey: true,
      allowNull: false
    },
    CodEquip: {
      type: DataTypes.STRING(50),
      unique: true
    },
    DesEquip: {
      type: DataTypes.STRING(255)
    },
    CodFam: {
      type: DataTypes.STRING(20)
    },
    CodSFam: {
      type: DataTypes.STRING(20)
    },
    NumSeries: {
      type: DataTypes.STRING(100)
    },
    CodServ: {
      type: DataTypes.STRING(20)
    },
    DatMisServis: {
      type: DataTypes.DATE
    },
    DatLimit: {
      type: DataTypes.DATE
    },
    HorsServis: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'TabEquipement',
    timestamps: false
  });

  return Equipement;
};

════════════════════════════════════════════════════════════════════════════════

🔧 FICHIER 2: src/models/Panne.js
════════════════════════════════════════════════════════════════════════════════

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Panne = sequelize.define('Panne', {
    CodPanne: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false
    },
    DesPanne: {
      type: DataTypes.STRING(255)
    }
  }, {
    tableName: 'TabPannes',
    timestamps: false
  });

  return Panne;
};

════════════════════════════════════════════════════════════════════════════════

🔧 FICHIER 3: src/models/Symptome.js
════════════════════════════════════════════════════════════════════════════════

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Symptome = sequelize.define('Symptome', {
    CodSymp: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false
    },
    DesSymp: {
      type: DataTypes.STRING(255)
    }
  }, {
    tableName: 'TabSymptome',
    timestamps: false
  });

  return Symptome;
};

════════════════════════════════════════════════════════════════════════════════

🔧 FICHIER 4: src/models/Remede.js
════════════════════════════════════════════════════════════════════════════════

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Remede = sequelize.define('Remede', {
    CodRemed: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false
    },
    DesRemed: {
      type: DataTypes.STRING(255)
    }
  }, {
    tableName: 'TabRemedes',
    timestamps: false
  });

  return Remede;
};

════════════════════════════════════════════════════════════════════════════════

🔧 FICHIER 5: src/models/DI.js (Demande d'Intervention)
════════════════════════════════════════════════════════════════════════════════

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DI = sequelize.define('DI', {
    IDDI: {
      type: DataTypes.CHAR(36),  // UNIQUEIDENTIFIER
      primaryKey: true,
      allowNull: false,
      defaultValue: () => require('uuid').v4()
    },
    NumDI: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      unique: true
    },
    DatDI: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    CodServ: {
      type: DataTypes.STRING(50)
    },
    DescPanne: {
      type: DataTypes.STRING(500)
    },
    IDEquip: {
      type: DataTypes.CHAR(36),
      references: {
        model: 'TabEquipement',
        key: 'IDEquip'
      }
    },
    Service: {
      type: DataTypes.STRING(100)
    },
    DesEquip: {
      type: DataTypes.STRING(255)
    },
    CodSymp: {
      type: DataTypes.STRING(50),
      references: {
        model: 'TabSymptome',
        key: 'CodSymp'
      }
    },
    Reponse: {
      type: DataTypes.TEXT
    },
    Comment: {
      type: DataTypes.TEXT
    },
    DatCreate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    DatModif: {
      type: DataTypes.DATE
    },
    Demandeur: {
      type: DataTypes.STRING(100)
    },
    CodSServ: {
      type: DataTypes.INTEGER
    }
  }, {
    tableName: 'TabDI',
    timestamps: false
  });

  return DI;
};

════════════════════════════════════════════════════════════════════════════════

🔧 FICHIER 6: src/models/EquipDi.js (Assignation DI-Technicien)
════════════════════════════════════════════════════════════════════════════════

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EquipDi = sequelize.define('EquipDi', {
    NumDI: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    IDInterv: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Sec_Users',
        key: 'UserID'
      }
    },
    CodInterv: {
      type: DataTypes.STRING(50)
    },
    NomInterv: {
      type: DataTypes.STRING(100)
    },
    DatDI: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'TabEquipDi',
    timestamps: false
  });

  return EquipDi;
};

════════════════════════════════════════════════════════════════════════════════

🔧 FICHIER 7: src/models/BonTravail.js
════════════════════════════════════════════════════════════════════════════════

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BonTravail = sequelize.define('BonTravail', {
    IDBT: {
      type: DataTypes.CHAR(36),  // UNIQUEIDENTIFIER
      primaryKey: true,
      allowNull: false,
      defaultValue: () => require('uuid').v4()
    },
    NumBT: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      unique: true
    },
    DatBT: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    CodServ: {
      type: DataTypes.STRING(50)
    },
    DescPanne: {
      type: DataTypes.STRING(500)
    },
    IDEquip: {
      type: DataTypes.CHAR(36),
      references: {
        model: 'TabEquipement',
        key: 'IDEquip'
      }
    },
    IDInterv: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Sec_Users',
        key: 'UserID'
      }
    },
    NumDI: {
      type: DataTypes.INTEGER,
      references: {
        model: 'TabDI',
        key: 'NumDI'
      }
    },
    IDDI: {
      type: DataTypes.CHAR(36),
      references: {
        model: 'TabDI',
        key: 'IDDI'
      }
    },
    CodPanne: {
      type: DataTypes.STRING(50),
      references: {
        model: 'TabPannes',
        key: 'CodPanne'
      }
    },
    CodSymp: {
      type: DataTypes.STRING(50),
      references: {
        model: 'TabSymptome',
        key: 'CodSymp'
      }
    },
    CodRemed: {
      type: DataTypes.STRING(50),
      references: {
        model: 'TabRemedes',
        key: 'CodRemed'
      }
    },
    DesRemed: {
      type: DataTypes.STRING(255)
    },
    DatDebutRep: {
      type: DataTypes.DATE
    },
    DatFinRep: {
      type: DataTypes.DATE
    },
    Resultat: {
      type: DataTypes.TEXT
    },
    BTClotured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    BTEncours: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    DatCreate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    DatModif: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'TabBT',
    timestamps: false
  });

  return BonTravail;
};

════════════════════════════════════════════════════════════════════════════════
PHASE 2: DÉFINIR LES RELATIONS DANS src/models/index.js (JOUR 2)
════════════════════════════════════════════════════════════════════════════════

  // DANS LA FONCTION QUI CONFIGURE LES ASSOCIATIONS:
  
  // Reclamation → DI
  Reclamation.hasMany(DI, {
    foreignKey: 'ReclamationID',
    as: 'demandes'
  });
  DI.belongsTo(Reclamation, {
    foreignKey: 'ReclamationID',
    as: 'reclamation'
  });
  
  // DI → Equipement
  DI.belongsTo(Equipement, {
    foreignKey: 'IDEquip',
    as: 'equipement'
  });
  Equipement.hasMany(DI, {
    foreignKey: 'IDEquip',
    as: 'demandes'
  });
  
  // DI → Symptome
  DI.belongsTo(Symptome, {
    foreignKey: 'CodSymp',
    as: 'symptome'
  });
  Symptome.hasMany(DI, {
    foreignKey: 'CodSymp',
    as: 'demandes'
  });
  
  // DI → EquipDi (assignations)
  DI.hasMany(EquipDi, {
    foreignKey: 'NumDI',
    as: 'assignations'
  });
  EquipDi.belongsTo(DI, {
    foreignKey: 'NumDI',
    as: 'demande'
  });
  
  // EquipDi → User (technicien)
  EquipDi.belongsTo(User, {
    foreignKey: 'IDInterv',
    as: 'intervenant'
  });
  User.hasMany(EquipDi, {
    foreignKey: 'IDInterv',
    as: 'assignations'
  });
  
  // DI → BonTravail
  DI.hasMany(BonTravail, {
    foreignKey: 'IDDI',
    as: 'bonsdetravail'
  });
  BonTravail.belongsTo(DI, {
    foreignKey: 'IDDI',
    as: 'demande'
  });
  
  // BonTravail → Equipement
  BonTravail.belongsTo(Equipement, {
    foreignKey: 'IDEquip',
    as: 'equipement'
  });
  Equipement.hasMany(BonTravail, {
    foreignKey: 'IDEquip',
    as: 'interventions'
  });
  
  // BonTravail → User (technicien)
  BonTravail.belongsTo(User, {
    foreignKey: 'IDInterv',
    as: 'intervenant'
  });
  User.hasMany(BonTravail, {
    foreignKey: 'IDInterv',
    as: 'bonsdetravail'
  });
  
  // BonTravail → Panne
  BonTravail.belongsTo(Panne, {
    foreignKey: 'CodPanne',
    as: 'panne'
  });
  Panne.hasMany(BonTravail, {
    foreignKey: 'CodPanne',
    as: 'interventions'
  });
  
  // BonTravail → Symptome
  BonTravail.belongsTo(Symptome, {
    foreignKey: 'CodSymp',
    as: 'symptome'
  });
  
  // BonTravail → Remede
  BonTravail.belongsTo(Remede, {
    foreignKey: 'CodRemed',
    as: 'remede'
  });
  Remede.hasMany(BonTravail, {
    foreignKey: 'CodRemed',
    as: 'interventions'
  });

════════════════════════════════════════════════════════════════════════════════
PHASE 3: CRÉER LES CONTROLLERS (JOUR 2-3)
════════════════════════════════════════════════════════════════════════════════

📋 FICHIERS À CRÉER:
  1. src/controllers/DIController.js
  2. src/controllers/BonTravailController.js
  3. src/controllers/EquipementController.js

CHAQUE CONTROLLER DOIT AVOIR:
  - getAll() - Lister tous les documents
  - getById() - Voir un document spécifique
  - create() - Créer un nouveau document
  - update() - Modifier un document
  - remove() - Supprimer un document
  - (Et des méthodes spécialisées comme assignTechnician, finish, close)

════════════════════════════════════════════════════════════════════════════════
PHASE 4: CRÉER LES ROUTES (JOUR 3)
════════════════════════════════════════════════════════════════════════════════

📋 FICHIERS À CRÉER:
  1. src/routes/di.routes.js
  2. src/routes/bontravail.routes.js
  3. src/routes/equipement.routes.js

CHAQUE ROUTE FILE DOIT AVOIR:
  - GET /api/di - Tous
  - GET /api/di/:id - Détails
  - POST /api/di - Créer
  - PATCH /api/di/:id - Modifier
  - DELETE /api/di/:id - Supprimer
  - POST /api/di/:id/assign-technician - Assigner

  - GET /api/bt - Tous
  - GET /api/bt/technician/:id - Du technicien
  - GET /api/bt/:id - Détails
  - POST /api/bt - Créer
  - PATCH /api/bt/:id/start - Commencer
  - PATCH /api/bt/:id/finish - Terminer
  - PATCH /api/bt/:id/close - Clôturer

════════════════════════════════════════════════════════════════════════════════
PHASE 5: METTRE À JOUR server.js (JOUR 3)
════════════════════════════════════════════════════════════════════════════════

DANS src/app.js, ajouter les routes:

app.use(routes.diRoutes);
app.use(routes.bonTravailRoutes);
app.use(routes.equipementRoutes);

════════════════════════════════════════════════════════════════════════════════
PHASE 6: TESTER LE FLUX COMPLET (JOUR 4)
════════════════════════════════════════════════════════════════════════════════

  1. Créer test_flux_complet.js
  2. Tester: Réclamation → DI → EquipDi → BT → Résultats → Close
  3. Vérifier les transitions de statut
  4. Vérifier les auto-updates

════════════════════════════════════════════════════════════════════════════════

CHRONOLOGIE RECOMMANDÉE:

JOUR 1:
  ☐ 09:00-11:00  Créer 7 modèles Sequelize
  ☐ 11:00-12:00  Définir relations dans index.js
  ☐ 13:00-15:00  Tester modèles avec script de vérification

JOUR 2:
  ☐ 09:00-12:00  DIController (CRUD + assignTechnician)
  ☐ 13:00-17:00  BonTravailController (CRUD + start/finish/close)
  ☐ 18:00        EquipementController (CRUD simple)

JOUR 3:
  ☐ 09:00-11:00  Routes DI
  ☐ 11:00-13:00  Routes BonTravail
  ☐ 13:00-14:00  Routes Equipement
  ☐ 14:00-16:00  Intégrer routes dans app.js et server
  ☐ 16:00-18:00  Tests unitaires endpoints

JOUR 4:
  ☐ 09:00-12:00  Tester flux complet end-to-end
  ☐ 12:00-15:00  Déboguer et fixer erreurs
  ☐ 15:00-17:00  Documentation API complète
  ☐ 17:00-18:00  Demo au client

════════════════════════════════════════════════════════════════════════════════
`;

console.log(IMPLEMENTATION_ROADMAP);

module.exports = { IMPLEMENTATION_ROADMAP };
