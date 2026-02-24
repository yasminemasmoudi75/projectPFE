/**
 * 🔧 ANALYSE COMPLÈTE - SYSTÈME SAV/RÉCLAMATIONS
 * ================================================
 * Tables: TabBT, TabDI, TabPanne, TabSymptome, TabRemede, TabEquipement
 */

console.log(`

╔══════════════════════════════════════════════════════════════════════════════╗
║             SYSTÈME COMPLET DE SAV/RÉCLAMATIONS                            ║
║       TabBT ↔ TabDI ↔ TabPanne ↔ TabSymptome ↔ TabRemede ↔ TabEquip       ║
╚══════════════════════════════════════════════════════════════════════════════╝


📋 STRUCTURE DES TABLES SAV
════════════════════════════════════════════════════════════════════════════════

TABLE 1️⃣  : TabBT (Bons de Travail - SAV)
─────────────────────────────────────────────────────────────────────────────
Structure logique:
  🔑 ID              → Identifiant unique du BT
  📝 NumBT           → Numéro du bon (AUTO-GENERATED)
  🆔 BTID            → ID supplémentaire
  📅 DateCreation    → Date de création
  👤 TechnicienID    → Technicien assigné (lien vers équipe)
  🎯 Statut          → État (Ouvert, En cours, Fermé, etc)
  📝 Description     → Détails du travail
  🔗 DIID            → Lien vers Demande d'Intervention

Exemple de données:
  ID │ NumBT  │ DateCreation │ TechnicienID │ Statut    │ Description
  ───┼────────┼──────────────┼──────────────┼───────────┼──────────────────
   1 │ BT-001 │ 2026-02-24   │ 2            │ En cours  │ Remplacement pièce
   2 │ BT-002 │ 2026-02-24   │ 3            │ Fermé     │ Maintenance


TABLE 2️⃣  : TabDI (Demandes d'Intervention)
─────────────────────────────────────────────────────────────────────────────
Structure logique:
  🔑 DIID            → Identifiant unique de la DI
  📝 NumDI           → Numéro DI (AUTO-GENERATED)
  🎯 Statut          → État (En attente, Planifiée, Exécutée)
  📅 DateDemande     → Date de la demande
  👤 ClientID        → Client qui demande (Tiers)
  🔧 EquipementID    → Équipement concerné
  🆕 NumPanne        → Numéro de panne (lien)
  👨‍💼 ResponsableID    → Responsable de l'intervention

Exemple de données:
  DIID │ NumDI  │ Statut      │ DateDemande │ ClientID │ EquipementID │ NumPanne
  ─────┼────────┼─────────────┼─────────────┼──────────┼──────────────┼──────────
   1   │ DI-001 │ Planifiée   │ 2026-02-24  │ 5        │ E-001        │ 1
   2   │ DI-002 │ En attente  │ 2026-02-24  │ 7        │ E-002        │ 2


TABLE 3️⃣  : TabPanne (Pannes)
─────────────────────────────────────────────────────────────────────────────
Structure logique:
  🔑 NumPanne        → Identifiant unique
  📍 Localisation    → Où la panne est localisée
  ⚠️  CodeSeverite    → Gravité (Basse, Moyenne, Haute, Critique)
  📝 Description     → Description de la panne
  🔚 DateResolution  → Date de résolution
  🔗 SymptomeID      → Symptômes associés

Exemple de données:
  NumPanne │ Localisation │ CodeSeverite │ Description           │ SymptomeID
  ─────────┼──────────────┼──────────────┼───────────────────────┼───────────
    1      │ Moteur       │ Haute        │ Moteur qui surchauffe │ S-001
    2      │ Écran        │ Moyenne      │ Pixels morts          │ S-002


TABLE 4️⃣  : TabSymptome (Symptômes)
─────────────────────────────────────────────────────────────────────────────
Structure logique:
  🔑 SymptomeID      → Identifiant unique
  📝 Description     → Description du symptôme
  🔗 Remede          → Remède proposé (lien vers TabRemede)
  💡 Conseil         → Conseil pour résoudre

Exemple de données:
  SymptomeID │ Description              │ RemideID │ Conseil
  ────────────────────────────────────────────────────────────
   S-001     │ Surchauffe du moteur     │ R-001    │ Nettoyer ventilateur
   S-002     │ Pixels morts l'écran     │ R-002    │ Remplacer tuner


TABLE 5️⃣  : TabRemede (Remèdes/Solutions)
─────────────────────────────────────────────────────────────────────────────
Structure logique:
  🔑 RemideID        → Identifiant unique
  📝 Description     → Description du remède
  🔧 Procedure       → Procédure à suivre
  ⏱️  TempsEstimé     → Temps estimé pour la résolution
  💰 Cout            → Coût estimé

Exemple de données:
  RemideID │ Description              │ TempsEstimé │ Cout
  ──────────────────────────────────────────────────────────
   R-001   │ Nettoyer ventilateur     │ 30 min      │ 0€
   R-002   │ Remplacer tuner          │ 2h          │ 150€


TABLE 6️⃣  : TabEquipement (Équipements)
─────────────────────────────────────────────────────────────────────────────
Structure logique:
  🔑 EquipementID    → Identifiant unique
  📝 Designation     → Nom/Type de l'équipement
  💼 ClientID        → Client propriétaire (Tiers)
  📍 Localisation    → Localisation physique
  📅 DateInstall     → Date d'installation
  🔗 TabEquipDI      → Détails des interventions

Exemple de données:
  EquipementID │ Designation  │ ClientID │ Localisation │ DateInstall
  ──────────────────────────────────────────────────────────────────────
   E-001       │ Moteur M100  │ 5        │ Atelier A    │ 2025-01-15
   E-002       │ Écran 42"    │ 7        │ Bureau       │ 2024-06-20


═════════════════════════════════════════════════════════════════════════════════════
🔗 LIAISONS ENTRE LES TABLES (FOREIGN KEYS)
═════════════════════════════════════════════════════════════════════════════════════

Flux d'une Réclamation → SAV:

1. Réclamation créée
   │
   ├─→ TabReclamation.ID = 1
   │   LibTiers: Client ABC
   │   Objet: Moteur qui surchauffe
   │
   └─→ CRÉE UNE DEMANDE D'INTERVENTION
       │
       ├─→ TabDI.DIID = 1
       │   NumDI: DI-001
       │   ClientID → Lien vers Tiers
       │   EquipementID → Lien vers équipement
       │
       └─→ DÉTECTE UNE PANNE
           │
           ├─→ TabPanne.NumPanne = 1
           │   Description: Surchauffe du moteur
           │   SymptomeID → Lien vers symptôme
           │
           ├─→ IDENTIFIE LE SYMPTÔME
           │   │
           │   ├─→ TabSymptome.SymptomeID = S-001
           │   │   Description: Moteur qui surchauffe
           │   │   RemideID: R-001
           │   │
           │   └─→ PROPOSE UN REMÈDE
           │       │
           │       └─→ TabRemede.RemideID = R-001
           │           Description: Nettoyer ventilateur
           │           TempsEstimé: 30 min
           │
           └─→ CRÉE UN BON DE TRAVAIL
               │
               └─→ TabBT.ID = 1
                   NumBT: BT-001
                   TechnicienID: 2 (Jean Dupont)
                   Statut: En cours
                   DIID: 1 (Lien vers DI)


═════════════════════════════════════════════════════════════════════════════════════
📐 STRUCTURE RELATIONNELLE COMPLÈTE
═════════════════════════════════════════════════════════════════════════════════════

                          Sec_Users
                        (Techniciens)
                             ↑
                             │ TechnicienID
                             │
                          TabBT
                      (Bons de Travail)
                             ↑
                             │ BTID/DIID
                             │
            ┌────────────────┴────────────────┐
            ↓                                  ↓
         TabDI                          TabReclamation
     (Demandes d'Intervention)         (Réclamations)
            ↑                                  │
            │ DIID/ClientID                   │
            │                                 │
         TabEquipement ←────────────────┘ (TechnicienID)
      (Équipements)        
            ↑
            │ EquipementID
            │
         TabPanne
         (Pannes)
            ↑
            │ SymptomeID
            │
      TabSymptome
      (Symptômes)
            ↑
            │ RemideID
            │
      TabRemede
      (Remèdes/Solutions)


═════════════════════════════════════════════════════════════════════════════════════
🎯 PROCESSUS COMPLET: DE LA RÉCLAMATION AU REMÈDE
═════════════════════════════════════════════════════════════════════════════════════

ÉTAPE 1: CRÉER UNE RÉCLAMATION
──────────────────────────────────────────────────────────────────────────────
Utilisateur: Agent Commercial
POST /api/reclamations
{
  "LibTiers": "Client ABC Corp",
  "CodTiers": "ABC001",
  "Objet": "Moteur qui surchauffe",
  "Description": "Le moteur s'arrête après 2h d'utilisation",
  "TypeReclamation": "Technique",
  "Priorite": "Haute"
}

↓ RÉSULTAT
TabReclamation: Enregistrement créé
  ID: 1
  NumTicket: REC-2026-0001
  Statut: Ouvert
  TechnicienID: null (à affecter)


ÉTAPE 2: AFFECTER À UN TECHNICIEN ET CRÉER DI
──────────────────────────────────────────────────────────────────────────────
Utilisateur: Admin
PATCH /api/reclamations/1/assign-technician + CREATE DI
{
  "technicienID": 2
}

↓ RÉSULTAT
TabReclamation: Mis à jour
  TechnicienID: 2
  Statut: En cours

TabDI: Créé automatiquement
  DIID: 1
  NumDI: DI-001
  Statut: Planifiée
  ClientID: 5
  EquipementID: E-001


ÉTAPE 3: DIAGNOSTIQUER LA PANNE
──────────────────────────────────────────────────────────────────────────────
Technicien: Jean Dupont (ID: 2)
Analyse du problème et crée une panne

INSERT INTO TabPanne:
  NumPanne: 1
  Localisation: Moteur
  CodeSeverite: Haute
  Description: Surchauffe causée par ventilateur encrassé
  SymptomeID: S-001


ÉTAPE 4: IDENTIFIER LE SYMPTÔME
──────────────────────────────────────────────────────────────────────────────
TabSymptome contient: S-001 = "Moteur qui surchauffe"

LIAISON:
  TabPanne.SymptomeID = S-001 ← TabSymptome.SymptomeID


ÉTAPE 5: TROUVER LA SOLUTION/REMÈDE
──────────────────────────────────────────────────────────────────────────────
TabRemede contient: R-001 = "Nettoyer le ventilateur"

LIAISON:
  TabSymptome.RemideID = R-001 ← TabRemede.RemideID


ÉTAPE 6: CRÉER BON DE TRAVAIL ET EXÉCUTER
──────────────────────────────────────────────────────────────────────────────
Agent de maintenance crée un BT

INSERT INTO TabBT:
  ID: 1
  NumBT: BT-001
  TechnicienID: 2 (Jean Dupont)
  Statut: En cours
  DIID: 1
  Description: Nettoyer ventilateur du moteur

↓ EXÉCUTION
Le technicien exécute le remède (30 minutes)
  - Démonte le ventilateur
  - Nettoie les encrassements
  - Remonte et teste

↓ RÉSULTAT
UPDATE TabBT SET Statut = 'Fermé', DateResolution = NOW()
UPDATE TabReclamation SET Statut = 'Résolu', DateResolution = NOW()


═════════════════════════════════════════════════════════════════════════════════════
👥 RÔLES ET PERMISSIONS
═════════════════════════════════════════════════════════════════════════════════════

ADMIN
  ✓ Créer réclamation
  ✓ Créer DI
  ✓ Affecter technicien
  ✓ Créer panne
  ✓ Créer bon de travail
  ✓ Voir tout

AGENT COMMERCIAL
  ✓ Créer réclamation (client)
  ✓ Voir réclamations (siennes)
  ✗ Créer DI
  ✗ Affecter technicien

TECHNICIEN
  ✓ Voir réclamations affectées
  ✓ Mettre à jour statut
  ✓ Ajouter diagnostic (panne)
  ✓ Créer bon de travail
  ✗ Créer réclamation
  ✗ Affecter à soi-même

MANAGER SAV
  ✓ CRéer DI
  ✓ Affecter technicien
  ✓ Voir tout
  ✓ Créer bon de travail
  ✓ Voir rapports


═════════════════════════════════════════════════════════════════════════════════════
🔄 FLUX SQL RELATIONNEL COMPLET
═════════════════════════════════════════════════════════════════════════════════════

-- Vue complète d'une réclamation avec toute sa chaîne de traitement
SELECT 
    -- Réclamation
    rec.ID as ReclamationID,
    rec.NumTicket,
    rec.LibTiers,
    rec.Objet as ReclamationObjet,
    rec.Statut as ReclamationStatut,
    
    -- Technicien assigné
    tech.FullName as Technicien,
    tech.EmailPro,
    
    -- Demande d'Intervention
    di.DIID,
    di.NumDI,
    di.Statut as DIStatut,
    
    -- Équipement
    eq.Designation as Equipement,
    eq.Localisation,
    
    -- Panne
    pn.NumPanne,
    pn.Description as PanneDescription,
    pn.CodeSeverite,
    
    -- Symptôme
    sym.Description as Symptome,
    
    -- Remède
    rem.Description as Remede,
    rem.TempsEstimé,
    rem.Cout,
    
    -- Bon de Travail
    bt.NumBT,
    bt.Statut as BTStatut
    
FROM TabReclamation rec
LEFT JOIN Sec_Users tech ON rec.TechnicienID = tech.UserID
LEFT JOIN TabDI di ON rec.ID = di.ReclamationID
LEFT JOIN TabEquipement eq ON di.EquipementID = eq.EquipementID
LEFT JOIN TabPanne pn ON di.DIID = pn.DIID
LEFT JOIN TabSymptome sym ON pn.SymptomeID = sym.SymptomeID
LEFT JOIN TabRemede rem ON sym.RemideID = rem.RemideID
LEFT JOIN TabBT bt ON di.DIID = bt.DIID
WHERE rec.ID = 1;

RÉSULTAT:
ReclamationID │ NumTicket      │ LibTiers  │ Objet        │ Technicien   │ DIStatut  │ Equipement │ ...
──────────────┼────────────────┼───────────┼──────────────┼──────────────┼───────────┼────────────┼────
    1         │ REC-2026-0001  │ Client ABC│ Surchauffe   │ Jean Dupont  │ Planifiée │ Moteur M100│ ...


═════════════════════════════════════════════════════════════════════════════════════
📝 TABLES À CRÉER/METTRE À JOUR
═════════════════════════════════════════════════════════════════════════════════════

✅ Existantes (probablement):
  - TabBT
  - TabDI
  - TabPanne
  - TabSymptome
  - TabRemede
  - TabEquipement
  - Sec_Users

✅ À ajouter/modifier:
  - TabReclamation.TechnicienID (FAIT ✓)
  - TabDI → Ajouter colonne ReclamationID (pour lier à une réclamation)
  - TabBT → Vérifier colonne DIID existe (pour lier à DI)


═════════════════════════════════════════════════════════════════════════════════════
🎯 ÉTAPES DE MISE EN ŒUVRE
═════════════════════════════════════════════════════════════════════════════════════

PHASE 1: ANALYSE ✓
  ✓ Identifier les tables existantes
  ✓ Comprendre les liaisons
  ✓ Définir le flux

PHASE 2: BACKEND ✓ (EN COURS)
  ✓ Créer modèle Reclamation avec TechnicienID
  ✓ Implémenter endpoints réclamation
  ✓ À faire: Créer modèles TabBT, TabDI, TabPanne, etc.
  ✓ À faire: Implémenter la création automatique de DI depuis réclamation

PHASE 3: FRONTEND
  □ Créer form réclamation
  □ Afficher liste pour technicien
  □ Créer interface diagnostic
  □ Afficher bon de travail

PHASE 4: INTÉGRATION
  □ Workflow complet
  □ Rapports
  □ Dashboards


╔══════════════════════════════════════════════════════════════════════════════╗
║                         SYSTÈME PRÊT POUR PHASE 2                          ║
║                                                                              ║
║  ✓ Réclamations + Affectation Technicien (COMPLET)                         ║
║  ⏳ À étendre avec TabBT, TabDI, TabPanne, etc.                            ║
║  ⏳ Workflow automatisé                                                     ║
║                                                                              ║
║  👉 Commit actuel: Système de réclamations opérationnel                    ║
║     But suivant: Créer modèles SAV et les lier                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

`);
