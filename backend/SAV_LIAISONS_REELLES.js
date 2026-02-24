/**
 * ================================================================
 * LIAISON COMPLÈTE DES TABLES SAV - STRUCTURE RÉELLE
 * ================================================================
 * 
 * Cette documentation décrit les relations réelles entre les tables
 * de gestion des services après vente (SAV) de votre système.
 */

// ==============================================================
// 1. STRUCTURE DES TABLES PRINCIPALES
// ==============================================================

const SAV_TABLES = {
  
  // Table des Réclamations - Point d'entrée du flux SAV
  TabReclamation: {
    description: "Table des réclamations/tickets clients",
    columns: {
      ID: { type: "INT", pk: true, comment: "Identifiant unique" },
      NumTicket: { type: "NVARCHAR", comment: "Numéro de ticket unique" },
      CodTiers: { type: "NVARCHAR", fk: "TabTiers.CodTiers", comment: "Référence client" },
      LibTiers: { type: "NVARCHAR", comment: "Nom du client" },
      Objet: { type: "NVARCHAR", comment: "Sujet/objet de la réclamation" },
      Description: { type: "NVARCHAR", comment: "Description détaillée du problème" },
      TypeReclamation: { type: "NVARCHAR", default: "Technique", comment: "Type: Technique, Livraison, Facturation, etc." },
      Priorite: { type: "NVARCHAR", default: "Moyenne", comment: "Basse, Moyenne, Haute, Urgente" },
      Statut: { type: "NVARCHAR", default: "Ouvert", comment: "Ouvert, En cours, Résolu, Fermé" },
      TechnicienID: { type: "INT", fk: "Sec_Users.UserID", comment: "Technicien assigné" },
      NomTechnicien: { type: "NVARCHAR", comment: "Nom du technicien (copie pour perf)" },
      DateOuverture: { type: "DATETIMEOFFSET", comment: "Date de création" },
      DateResolution: { type: "DATETIMEOFFSET", comment: "Date de résolution" },
      CUser: { type: "NVARCHAR", comment: "Utilisateur qui a créé" },
      Solution: { type: "NVARCHAR", comment: "Description de la solution apportée" },
    },
    relationships: [
      "→ Sec_Users (via TechnicienID)",
      "→ TabTiers (via CodTiers)",
      "→ TabDI (création si nécessaire)"
    ]
  },

  // Table des Demandes d'Intervention
  TabDI: {
    description: "Demande d'Intervention créée à partir d'une réclamation",
    columns: {
      IDDI: { type: "UNIQUEIDENTIFIER", pk: true, comment: "Identifiant unique" },
      NumDI: { type: "INT", comment: "Numéro de DI séquentiel" },
      DatDI: { type: "DATETIME", comment: "Date de la DI" },
      CodServ: { type: "VARCHAR", comment: "Code du service" },
      DescPanne: { type: "VARCHAR", comment: "Description de la panne" },
      IDEquip: { type: "UNIQUEIDENTIFIER", fk: "TabEquipement.IDEquip", comment: "Équipement concerné" },
      Service: { type: "VARCHAR", comment: "Service concerné" },
      DesEquip: { type: "VARCHAR", comment: "Description équipement" },
      CodSymp: { type: "VARCHAR", fk: "TabSymptome.CodSymp", comment: "Symptôme détecté" },
      Reponse: { type: "NTEXT", comment: "Réponse/solution proposée" },
      Comment: { type: "NTEXT", comment: "Commentaires" },
      DatCreate: { type: "DATETIME", comment: "Date créaction" },
      DatModif: { type: "DATETIME", comment: "Date modification" },
      Demandeur: { type: "VARCHAR", comment: "Personne qui a demandé" },
      CodSServ: { type: "INT", comment: "Code sous-service" },
    },
    relationships: [
      "→ TabEquipement (IDEquip)",
      "→ TabSymptome (CodSymp)",
      "→ TabEquipDi (details des techniciens assignés)",
      "→ TabBT (Bon de Travail généré)"
    ]
  },

  // Table de liaison DI - Équipement - Techniciens assignés
  TabEquipDi: {
    description: "Détails d'une DI: qui (technicien) fait quoi (interventions) sur l'équipement",
    columns: {
      IDDI: { type: "UNIQUEIDENTIFIER", fk: "TabDI.IDDI", comment: "Référence DI" },
      NumDI: { type: "INT", comment: "Numéro de DI" },
      ID: { type: "INT", comment: "Numéro d'ordre" },
      IDInterv: { type: "UNIQUEIDENTIFIER", fk: "Sec_Users.UserID", comment: "Technicien/Intervenant" },
      CodInterv: { type: "VARCHAR", comment: "Code intervenant" },
      NomInterv: { type: "VARCHAR", comment: "Nom intervenant" },
      DatDI: { type: "DATETIME", comment: "Date de l'intervention" },
    },
    note: "Permet plusieurs techniciens par DI"
  },

  // Table Bon de Travail (BT)
  TabBT: {
    description: "Bon de Travail généré pour exécuter la DI",
    columns: {
      IDBT: { type: "UNIQUEIDENTIFIER", pk: true, comment: "Identifiant unique BT" },
      NumBT: { type: "INT", comment: "Numéro BT séquentiel" },
      DatBT: { type: "DATETIME", comment: "Date du BT" },
      CodServ: { type: "VARCHAR", comment: "Code service" },
      DescPanne: { type: "VARCHAR", comment: "Description panne" },
      IDEquip: { type: "UNIQUEIDENTIFIER", fk: "TabEquipement.IDEquip", comment: "Équipement" },
      IDInterv: { type: "UNIQUEIDENTIFIER", fk: "Sec_Users.UserID", comment: "Technicien principal" },
      NumDI: { type: "INT", fk: "TabDI.NumDI", comment: "Référence DI" },
      IDDI: { type: "UNIQUEIDENTIFIER", fk: "TabDI.IDDI", comment: "Référence DI (UUID)" },
      CodPanne: { type: "VARCHAR", fk: "TabPannes.CodPanne", comment: "Code panne diagnostiquée" },
      CodSymp: { type: "VARCHAR", fk: "TabSymptome.CodSymp", comment: "Symptôme" },
      CodRemed: { type: "VARCHAR", fk: "TabRemedes.CodRemed", comment: "Remède appliqué" },
      DesRemed: { type: "VARCHAR", comment: "Description remède" },
      DatDebutRep: { type: "DATETIME", comment: "Début réparation" },
      DatFinRep: { type: "DATETIME", comment: "Fin réparation" },
      Resultat: { type: "NTEXT", comment: "Résultat/observations" },
      BTClotured: { type: "BIT", comment: "BT clôturé?" },
      BTEncours: { type: "BIT", comment: "BT en cours?" },
    },
    note: "Lien entre l'intervention et le diagnostic"
  },

  // Table Équipement
  TabEquipement: {
    description: "Catalogue des équipements clients",
    columns: {
      IDEquip: { type: "UNIQUEIDENTIFIER", pk: true, comment: "Identifiant unique" },
      CodEquip: { type: "VARCHAR", comment: "Code équipement" },
      DesEquip: { type: "VARCHAR", comment: "Description" },
      CodFam: { type: "VARCHAR", comment: "Code famille produit" },
      NumSeries: { type: "VARCHAR", comment: "Numéro de série" },
      CodServ: { type: "VARCHAR", comment: "Code service/garantie" },
      DatMisServis: { type: "DATETIME", comment: "Date mise en service" },
      DatLimit: { type: "DATETIME", comment: "Date limite garantie" },
      HorsServis: { type: "BIT", comment: "Hors service?" },
    },
    note: "Chaque équipement peut avoir plusieurs interventions"
  },

  // Tables de Codes/Référentiels
  TabPannes: {
    description: "Catalogue des pannes possibles",
    columns: {
      CodPanne: { type: "VARCHAR", pk: true },
      DesPanne: { type: "VARCHAR", comment: "Description panne" }
    }
  },

  TabSymptome: {
    description: "Catalogue des symptômes",
    columns: {
      CodSymp: { type: "VARCHAR", pk: true },
      DesSymp: { type: "VARCHAR", comment: "Description symptôme" }
    }
  },

  TabRemedes: {
    description: "Catalogue des remèdes/solutions",
    columns: {
      CodRemed: { type: "VARCHAR", pk: true },
      DesRemed: { type: "VARCHAR", comment: "Description remède" }
    }
  },

  // Tables de support
  TabTiers: {
    description: "Clients/Fournisseurs",
    columns: {
      IDTiers: { type: "UNIQUEIDENTIFIER", pk: true },
      CodTiers: { type: "VARCHAR", comment: "Code client unique" },
      Raisoc: { type: "VARCHAR", comment: "Raison sociale" },
      Email: { type: "VARCHAR" },
      Tel: { type: "VARCHAR" },
      Adresse: { type: "VARCHAR" }
    }
  },

  SecUsers: {
    description: "Utilisateurs/Techniciens",
    columns: {
      UserID: { type: "INT", pk: true },
      FullName: { type: "VARCHAR", comment: "Nom complet" },
      EmailPro: { type: "VARCHAR" },
      UserRole: { type: "VARCHAR", comment: "admin|technicien|agent_commercial|manager" },
      PosteOccupe: { type: "VARCHAR", comment: "Poste/fonction" },
      IsActive: { type: "BIT", comment: "Actif?" }
    }
  }
};

// ==============================================================
// 2. FLUX DE TRAITEMENT D'UNE RÉCLAMATION
// ==============================================================

const FLUX_SAV = `
┌─────────────────────────────────────────────────────────────┐
│         FLUX COMPLET DE TRAITEMENT SAV                      │
└─────────────────────────────────────────────────────────────┘

1️⃣  CLIENT OUVRE RÉCLAMATION
    ↓
    Client appelle → TabReclamation créée
    - NumTicket généré
    - CodTiers + LibTiers remplis
    - Statut = "Ouvert"
    - Priorité définie

2️⃣  ADMIN ASSIGNE UN TECHNICIEN
    ↓
    API PATCH /reclamations/:id/assign-technician
    - TechnicienID défini
    - NomTechnicien copié à partir de Sec_Users
    - Statut change à "En cours"

3️⃣  CRÉATION DEMANDE D'INTERVENTION (DI)
    ↓
    TabDI créée avec:
    - DescPanne depuis TabReclamation.Description
    - IDEquip si présent
    - CodSymp choisi (panne diagnostiquée)
    - Statut DI = "Planifiée"

4️⃣  ASSIGNATION DES TECHNICIENS À LA DI
    ↓
    TabEquipDi créée avec:
    - IDInterv = Technicien assigné
    - DatDI = Date intervention planifiée
    (Permet plusieurs techniciens par DI)

5️⃣  CRÉATION BON DE TRAVAIL (BT)
    ↓
    TabBT créée avec:
    - NumDI et IDDI (lien vers DI)
    - IDEquip (équipement à réparer)
    - IDInterv (technicien exécutant)
    - CodPanne diagnostiquée
    - CodSymp observé

6️⃣  EXÉCUTION TRAVAUX
    ↓
    Technicien remplit TabBT:
    - DatDebutRep (début)
    - DatFinRep (fin)
    - CodRemed (remède appliqué)
    - DesRemed (description remède)
    - Resultat (observations)

7️⃣  CLÔTURE DES DOCUMENTS
    ↓
    BTClotured = 1 dans TabBT
    Statut TabReclamation = "Résolu"
    DateResolution remplie
    Solution documentée

8️⃣  ARCHIVAGE
    ↓
    Tous les documents clôturés
    Réclamation fermée


┌─────────────────────────────────────────────────────────────┐
│              KEY DATES TRACKING                             │
└─────────────────────────────────────────────────────────────┘

TabReclamation:
  - DateOuverture: Quand la reclamation est créée
  - DateResolution: Quand elle est résolue

TabDI:
  - DatDI: Date de la demande d'intervention

TabEquipDi:
  - DatDI: Date/heure prévue de l'intervention

TabBT:
  - DatBT: Date du bon de travail
  - DatDebutRep: Quand le technicien a commencé
  - DatFinRep: Quand le technicien a terminé
`;

// ==============================================================
// 3. CLÉS ÉTRANGÈRES ET RELATIONS
// ==============================================================

const FOREIGN_KEYS = {
  "TabReclamation.TechnicienID": "Sec_Users.UserID",
  "TabReclamation.CodTiers": "TabTiers.CodTiers",
  
  "TabDI.IDEquip": "TabEquipement.IDEquip",
  "TabDI.CodSymp": "TabSymptome.CodSymp",
  
  "TabEquipDi.IDDI": "TabDI.IDDI",
  "TabEquipDi.IDInterv": "Sec_Users.UserID",
  
  "TabBT.IDEquip": "TabEquipement.IDEquip",
  "TabBT.IDInterv": "Sec_Users.UserID",
  "TabBT.NumDI": "TabDI.NumDI",
  "TabBT.IDDI": "TabDI.IDDI",
  "TabBT.CodPanne": "TabPannes.CodPanne",
  "TabBT.CodSymp": "TabSymptome.CodSymp",
  "TabBT.CodRemed": "TabRemedes.CodRemed",
};

// ==============================================================
// 4. STATISTIQUES DE VOTRE BASE DE DONNÉES
// ==============================================================

const DATABASE_STATS = `
TABLES SAV DÉTECTÉES:
✅ TabReclamation (15 colonnes)  - Réclamations
✅ TabDI (15 colonnes)           - Demandes d'Intervention
✅ TabEquipDi (7 colonnes)       - DI-Technicien-Équipement
✅ TabBT (34 colonnes)           - Bons de Travail ⭐ RICHE
✅ TabEquipement (25 colonnes)   - Équipements
✅ TabPannes (2 colonnes)        - Types de pannes
✅ TabSymptome (2 colonnes)      - Symptômes
✅ TabRemedes (2 colonnes)       - Solutions/Remèdes
✅ TabTiers (74 colonnes)        - Clients/Fournisseurs
✅ Sec_Users (25+ colonnes)      - Utilisateurs/Techniciens
✅ TabBonIntM (43 colonnes)      - Bons d'Intervention Master
✅ TabBonIntD (8 colonnes)       - Détails Bons d'Intervention
✅ TabIntervPrevent (13 colonnes)- Interventions Préventives

TOTAL: 13+ tables SAV interconnectées

REMARQUE: TabBT est très riche (34 colonnes) et contient déjà:
  - Les références à DI (NumDI, IDDI)
  - IDEquip et IDInterv
  - Codes panne, symptôme, remède
  - Dates début/fin
  - Résultats et observations
  
C'est la table centrale d'exécution!
`;

// ==============================================================
// 5. IMPLÉMENTATION SEQUELIZE REQUISE
// ==============================================================

const SEQUELIZE_MODELS = `
MODÈLES À CRÉER:

1. Reclamation.js (EXISTE)
   - Importée de TabReclamation
   - Relationship: belongsTo(User, 'technicien')
   
2. DI.js (À CRÉER)
   - Table: TabDI
   - Relationship: belongsTo(Equipement)
   - Relationship: belongsTo(Symptome)
   - hasMany(EquipDi)
   - hasMany(BT)

3. EquipDi.js (À CRÉER)
   - Table: TabEquipDi
   - Relationship: belongsTo(DI)
   - Relationship: belongsTo(User, 'intervenant')

4. BonTravail.js (À CRÉER)
   - Table: TabBT
   - Relationship: belongsTo(DI)
   - Relationship: belongsTo(Equipement)
   - Relationship: belongsTo(User, 'intervenant')
   - Relationship: belongsTo(Panne)
   - Relationship: belongsTo(Symptome)
   - Relationship: belongsTo(Remede)

5. Equipement.js (À CRÉER)
   - Table: TabEquipement
   - hasMany(BT)
   - hasMany(DI)

6. Panne.js (À CRÉER)
   - Table: TabPannes
   - hasMany(BT)

7. Symptome.js (À CRÉER)
   - Table: TabSymptome
   - hasMany(BT)
   - hasMany(DI)

8. Remede.js (À CRÉER)
   - Table: TabRemedes
   - hasMany(BT)

ASSOCIATIONS CLÉS:
- Reclamation → User (technicien)
- Reclamation → Tiers (client)
- DI → Equipement
- DI → EquipDi → User (technicien)
- DI → BT
- BT → User (technicien)
- BT → Equipement
- BT → Panne/Symptome/Remede
`;

// ==============================================================
// 6. PROCHAINES ÉTAPES RECOMMENDED
// ==============================================================

const NEXT_STEPS = `
PHASE 1: MODÈLES SEQUELIZE (1-2 jours)
□ Créer Equipement.js
□ Créer DI.js
□ Créer EquipDi.js
□ Créer BonTravail.js
□ Créer Panne.js, Symptome.js, Remede.js
□ Définir toutes les relations

PHASE 2: CONTROLLERS (2-3 jours)
□ DIController.js (CRUD pour DI)
□ BonTravailController.js (CRUD pour BT)
□ EquipementController.js (CRUD)
□ Ajouter createDI trigger dans reclamationController
□ Ajouter createBT trigger dans DIController

PHASE 3: ROUTES (1 jour)
□ GET /di - Toutes les DI
□ GET /di/:id - DI spécifique avec BT
□ POST /di - Créer DI
□ PATCH /di/:id - Modifier DI
□ GET /bt - Tous les BT
□ PATCH /bt/:id/resultat - Remplir résultat

PHASE 4: FRONTEND (3-5 jours)
□ ReclamationForm.jsx
□ ReclamationList.jsx avec statut
□ DIForm.jsx
□ BonTravailForm.jsx
□ Dashboard technicien (voir ses BT assignés)
□ Workflow UI (étapes réclamation → résolution)

PHASE 5: AUTOMATION (2 jours)
□ Auto-creation DI quand reclamation assignée
□ Auto-creation BT quand DI créée
□ Auto-update Reclamation statut quand BT clôturé
`;

console.log("════════════════════════════════════════════════════════════");
console.log("📊 LIAISON SAV COMPLÈTE");
console.log("════════════════════════════════════════════════════════════\n");

console.log(FLUX_SAV);
console.log("\n" + DATABASE_STATS);
console.log("\n" + SEQUELIZE_MODELS);
console.log("\n" + NEXT_STEPS);

module.exports = { SAV_TABLES, FLUX_SAV, FOREIGN_KEYS, DATABASE_STATS, SEQUELIZE_MODELS, NEXT_STEPS };
