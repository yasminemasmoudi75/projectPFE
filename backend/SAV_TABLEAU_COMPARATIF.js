/**
 * ================================================================
 * TABLEAU COMPARATIF: RÉCLAMATION vs DI vs BT
 * ================================================================
 */

const COMPARISON_TABLE = `
┌──────────────────────────────────────────────────────────────────────────┐
│                    COMPARAISON DES 3 DOCUMENTS CLÉS                     │
└──────────────────────────────────────────────────────────────────────────┘

╔═════════════════════════════════════════════════════════════════════════╗
║                    TABRECLAMATION (Ticket Client)                      ║
╚═════════════════════════════════════════════════════════════════════════╝
│ QUI CRÉE?        │ Client appelle / Admin crée via formulaire         │
│ QUAND?           │ Immédiatement après le problème                    │
│ QUI L'ASSIGNE?   │ Admin/Manager à un technicien                      │
│ CONTIENT?        │ • NumTicket (numéro unique suivi client)          │
│                  │ • Description du problème du CLIENT                │
│                  │ • Priorité du POV du client                        │
│                  │ • TechnicienID assigné                             │
│                  │ • Statut global (Ouvert→En cours→Résolu)          │
│ MODIFIÉ PAR?     │ Admin, Technicien assigné                          │
│ INFO CLÉS?       │ ✓ Historique complet du support client            │
│                  │ ✓ Traçabilité SLA (Priorité, DateOuverture)      │
│                  │ ✓ Solution documentée pour base de connaissances  │
│ RELATIONS?       │ • Sec_Users (technicien assigné)                  │
│                  │ • TabTiers (client qui a appelé)                  │
│                  │ • TabDI (demande intervention créée)              │

╔═════════════════════════════════════════════════════════════════════════╗
║              TABDI (Demande d'Intervention - SAV Internal)             ║
╚═════════════════════════════════════════════════════════════════════════╝
│ QUI CRÉE?        │ Système auto OU Admin manuellement                 │
│ QUAND?           │ Au moment d'assigner le technicien à la réclamation│
│ QUI L'ASSIGNE?   │ Admin/Manager assigne 1+ techniciens via TabEquipDI│
│ CONTIENT?        │ • NumDI (numéro d'intervention interne)           │
│                  │ • IDEquip (équipement à intervenir)               │
│                  │ • CodSymp (symptôme diagnostiqué)                 │
│                  │ • DescPanne (description SAV interne)             │
│                  │ • Reponse proposée provisoire                     │
│ MODIFIÉ PAR?     │ Admin planifiant les interventions                 │
│ INFO CLÉS?       │ ✓ Lien entre réclamation et équipement           │
│                  │ ✓ Planification des interventions                 │
│                  │ ✓ Diagnostic précoce du problème                  │
│ RELATIONS?       │ • TabEquipement (quel équipement)                 │
│                  │ • TabSymptome (symptôme observé)                  │
│                  │ • TabEquipDi (techniciens assignés)               │
│                  │ • TabBT (bon de travail généré)                   │

╔═════════════════════════════════════════════════════════════════════════╗
║                  TABBT (Bon de Travail - Exécution)                    ║
╚═════════════════════════════════════════════════════════════════════════╝
│ QUI CRÉE?        │ Système auto quand DI est planifiée                │
│ QUAND?           │ Jour de l'intervention programmée                  │
│ QUI L'ASSIGNE?   │ Déjà assigné via DI → EquipDi → Technicien       │
│ CONTIENT?        │ • NumBT (numéro bon de travail)                   │
│                  │ • IDInterv (technicien qui exécute)               │
│                  │ • NumDI/IDDI (référence DI)                       │
│                  │ • IDEquip (équipement à réparer)                  │
│                  │ • CodPanne (panne confirmée)                      │
│                  │ • CodRemed (remède appliqué) ← Rempli par tech   │
│                  │ • DatDebutRep, DatFinRep ← Rempli par tech       │
│                  │ • Resultat (observations du technicien)           │
│ MODIFIÉ PAR?     │ Technicien sur site                                │
│ INFO CLÉS?       │ ✓ Document d'exécution (preuve de travail)       │
│                  │ ✓ Traces de ce qui fut fait exactement            │
│                  │ ✓ Mesures de performance (durée réelle)          │
│                  │ ✓ Pièce justificative pour facturation           │
│ RELATIONS?       │ • TabDI (la demande à l'origine)                  │
│                  │ • TabEquipement (équipement réparé)               │
│                  │ • TabPannes (panne réelle trouvée)                │
│                  │ • TabSymptome (symptôme réel observé)             │
│                  │ • TabRemedes (solution réelle appliquée)          │
│                  │ • Sec_Users (technicien exécutant)               │

════════════════════════════════════════════════════════════════════════════════

MATRICE DE TRANSITION:

        STATE DIAGRAM

    Réclamation créée
         (Ouvert)
             │
             ▼
    ┌────────────────────┐
    │ Assigner Technicien│
    └────────────────────┘
             │
             ▼ (Statut = En cours)
        Créer DI
     (TabDI créée)
             │
             ▼
    Assigner Technicien à DI
     (TabEquipDi créée)
             │
             ▼
        Créer BT
     (TabBT créée)
             │
             ▼ (Technicien reçoit notification)
    ┌────────────────────┐
    │   EXÉCUTION        │
    │ Technicien travaille
    │   DatDebutRep ← NOW
    └────────────────────┘
             │
             ▼ (Travail terminé)
    Remplir résultats BT
    - DatFinRep ← NOW
    - CodRemed ← Solution
    - Resultat ← observations
             │
             ▼
    Clôturer BT
    (BTClotured = 1)
             │
             ▼ (Trigger: Auto-update Réclamation)
    Réclamation: Statut = "Résolu"
    Réclamation: DateResolution = NOW
    Réclamation: Solution = BT.Resultat
             │
             ▼
    ✅ TICKET FERMÉ

════════════════════════════════════════════════════════════════════════════════

WHO SEES WHAT?

👤 ADMIN/MANAGER:
   ✓ Toutes les Réclamations
   ✓ Créer/modifier DI et BT
   ✓ Dashboard globale (stats, SLA, etc.)
   ✓ Reporter qui fait quoi

👨‍🔧 TECHNICIEN:
   ✓ Ses DI assignées (via TabEquipDi)
   ✓ Ses BT assignés
   ✓ Réclamations liées à ses BT
   ✗ Les réclamations assignées à d'autres
   ✗ Les DI qu'il n'exécute pas

👨‍💼 AGENT COMMERCIAL:
   ✓ Réclamations qu'il a créées
   ✓ Statut de ses dossiers
   ✗ Les détails techniques (DI, BT)

════════════════════════════════════════════════════════════════════════════════

CLÉS À COMPRENDRE:

1. TabReclamation = Client ticket (support SLA)
   └─ Toujours 1 par problème client
   └─ Contient ce que le CLIENT a dit
   └─ Durée de vie: longue (plusieurs semaines si gros problème)

2. TabDI = Document SAV planifié
   └─ Peut avoir 1...N DI par Réclamation (plusieurs interventions)
   └─ Contient ce que SAV a diagnostiqué
   └─ Durée de vie: moyenne (quelques jours)

3. TabBT = Bon de travail exécution
   └─ 1 BT par DI généralement
   └─ Contient ce que le TECHNICIEN a fait
   └─ Durée de vie: courte (1 jour de travail)

FLUX: Réclamation → DI → BT

════════════════════════════════════════════════════════════════════════════════
`;

console.log(COMPARISON_TABLE);

module.exports = { COMPARISON_TABLE };
