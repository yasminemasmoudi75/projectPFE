-- ═════════════════════════════════════════════════════════════════
-- 🔧 SCRIPT SQL COMPLET: ALL ROLES + ALL MODULES
-- ═════════════════════════════════════════════════════════════════
-- 
-- Ajoute TOUS les rôles (Admin, Commercial, Technicien, Client, Agent)
-- Pour TOUS les modules
-- 
-- À exécuter dans SQL Server Management Studio
-- ═════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- MÉTHODE: DELETE + INSERT (recommandé pour partir from scratch)
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Supprimer les rôles qui seront recréés (optionnel)
DELETE FROM TabAWProfileAccess 
WHERE LOWER(ProfileUser) IN ('admin', 'commerciale', 'commercial', 'technicien', 'client', 'agent');

-- ═══════════════════════════════════════════════════════════════════════
-- 2. INSERT TOUS LES RÔLES POUR TOUS LES MODULES
-- ═══════════════════════════════════════════════════════════════════════

-- ┌─────────────────────────┐
-- │ ADMIN (Accès complet)   │
-- └─────────────────────────┘

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF, FiltreRepres, FiltreMag)
VALUES 
('Admin', 4, 'Module Devis', 1, 1, 1, 1, 1, 1, 1, 0, NULL),
('Admin', 5, 'Module Commande', 1, 1, 1, 1, 1, 1, 1, 0, NULL),
('Admin', 6, 'Module Livraison', 1, 1, 1, 1, 1, 1, 1, 0, 0),
('Admin', 7, 'Module Facture', 1, 1, 1, 1, 1, 1, 1, NULL, NULL),
('Admin', 30, 'Module Client', 1, 1, 1, 1, 1, 1, 1, 0, 0),
('Admin', 31, 'Module Reglement', 1, 1, 1, 1, 1, 1, 1, 0, 0),
('Admin', 32, 'Menu', 1, 1, 1, 1, 1, 1, 1, NULL, NULL),
('Admin', 40, 'Module Tournée', 1, 1, 1, 1, 1, 1, 1, NULL, NULL),
('Admin', 41, 'Module Chargement', 1, 1, 1, 1, 1, 1, 1, NULL, NULL),
('Admin', 42, 'Module Objectif', 1, 1, 1, 1, 1, 1, 1, NULL, NULL),
('Admin', 43, 'Module Recap', 1, 1, 1, 1, 1, 1, 1, NULL, NULL),
('Admin', 44, 'Module Relevé', 1, 1, 1, 1, 1, 1, 1, NULL, NULL),
('Admin', 45, 'Module visite', 1, 1, 1, 1, 1, 1, 1, 0, NULL),
('Admin', 46, 'Stock', 1, 1, 1, 1, 1, 1, 1, 0, 0),
('Admin', 47, 'soldeClient', 1, 1, 1, 1, 1, 1, 1, 0, NULL),
('Admin', 52, 'Maps', 1, 1, 1, 1, 1, 1, 1, 0, 0);

-- ┌────────────────────────────────┐
-- │ COMMERCIALE (Ventes)           │
-- └────────────────────────────────┘

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF, FiltreRepres, FiltreMag)
VALUES 
('Commerciale', 4, 'Module Devis', 1, 1, 0, 0, 1, 1, 1, 0, NULL),
('Commerciale', 5, 'Module Commande', 1, 1, 0, 0, 1, 1, 1, 0, NULL),
('Commerciale', 6, 'Module Livraison', 1, 1, 0, 0, 0, 1, 1, 0, 0),
('Commerciale', 7, 'Module Facture', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Commerciale', 30, 'Module Client', 1, 1, 1, 0, 1, NULL, NULL, 0, 0),
('Commerciale', 31, 'Module Reglement', 1, 1, 0, 0, 1, 1, 1, 0, 0),
('Commerciale', 32, 'Menu', 1, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Commerciale', 40, 'Module Tournée', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Commerciale', 41, 'Module Chargement', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Commerciale', 42, 'Module Objectif', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Commerciale', 43, 'Module Recap', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Commerciale', 44, 'Module Relevé', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Commerciale', 45, 'Module visite', 1, 1, 0, 0, 0, 1, 1, 0, NULL),
('Commerciale', 46, 'Stock', 0, 0, 0, 0, 1, 0, 0, 0, 0),
('Commerciale', 47, 'soldeClient', 1, 0, 0, 0, 0, NULL, NULL, 0, NULL),
('Commerciale', 52, 'Maps', 1, 1, 0, 0, 1, 0, 0, 0, 0);

-- ┌────────────────────────────────┐
-- │ TECHNICIEN (Support + Stock)   │
-- └────────────────────────────────┘

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF, FiltreRepres, FiltreMag)
VALUES 
('Technicien', 4, 'Module Devis', 0, 0, 0, 0, 0, 0, 0, 0, NULL),
('Technicien', 5, 'Module Commande', 0, 0, 0, 0, 0, 0, 0, 0, NULL),
('Technicien', 6, 'Module Livraison', 0, 0, 0, 0, 0, 0, 0, 0, 0),
('Technicien', 7, 'Module Facture', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Technicien', 30, 'Module Client', 0, 0, 0, 0, 0, NULL, NULL, 0, 0),
('Technicien', 31, 'Module Reglement', 0, 0, 0, 0, 0, 0, 0, 0, 0),
('Technicien', 32, 'Menu', 1, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Technicien', 40, 'Module Tournée', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Technicien', 41, 'Module Chargement', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Technicien', 42, 'Module Objectif', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Technicien', 43, 'Module Recap', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Technicien', 44, 'Module Relevé', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Technicien', 45, 'Module visite', 0, 0, 0, 0, 0, 0, 0, 0, NULL),
('Technicien', 46, 'Stock', 1, 0, 1, 0, 1, 0, 0, 0, 0),
('Technicien', 47, 'soldeClient', 0, 0, 0, 0, 0, NULL, NULL, 0, NULL),
('Technicien', 52, 'Maps', 0, 0, 0, 0, 0, 0, 0, 0, 0);

-- ┌────────────────────────────────┐
-- │ CLIENT (Lecture seulement)     │
-- └────────────────────────────────┘

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF, FiltreRepres, FiltreMag)
VALUES 
('Client', 4, 'Module Devis', 1, 0, 0, 0, 0, 0, 1, 0, NULL),
('Client', 5, 'Module Commande', 0, 0, 0, 0, 0, 0, 0, 0, NULL),
('Client', 6, 'Module Livraison', 0, 0, 0, 0, 0, 0, 0, 0, 0),
('Client', 7, 'Module Facture', 1, 0, 0, 0, 0, NULL, 1, NULL, NULL),
('Client', 30, 'Module Client', 1, 0, 0, 0, 0, NULL, NULL, 0, 0),
('Client', 31, 'Module Reglement', 0, 0, 0, 0, 0, 0, 0, 0, 0),
('Client', 32, 'Menu', 1, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Client', 40, 'Module Tournée', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Client', 41, 'Module Chargement', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Client', 42, 'Module Objectif', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Client', 43, 'Module Recap', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Client', 44, 'Module Relevé', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Client', 45, 'Module visite', 0, 0, 0, 0, 0, 0, 0, 0, NULL),
('Client', 46, 'Stock', 0, 0, 0, 0, 0, 0, 0, 0, 0),
('Client', 47, 'soldeClient', 0, 0, 0, 0, 0, NULL, NULL, 0, NULL),
('Client', 52, 'Maps', 0, 0, 0, 0, 0, 0, 0, 0, 0);

-- ┌────────────────────────────────┐
-- │ AGENT (Comme Commerciale)      │
-- └────────────────────────────────┘

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF, FiltreRepres, FiltreMag)
VALUES 
('Agent', 4, 'Module Devis', 1, 1, 1, 0, 1, 1, 1, 0, NULL),
('Agent', 5, 'Module Commande', 1, 1, 1, 0, 1, 1, 1, 0, NULL),
('Agent', 6, 'Module Livraison', 1, 1, 1, 0, 1, 1, 1, 0, 0),
('Agent', 7, 'Module Facture', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Agent', 30, 'Module Client', 1, 1, 1, 0, 1, NULL, NULL, 0, 0),
('Agent', 31, 'Module Reglement', 1, 1, 1, 0, 1, 1, 1, 0, 0),
('Agent', 32, 'Menu', 1, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Agent', 40, 'Module Tournée', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Agent', 41, 'Module Chargement', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Agent', 42, 'Module Objectif', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Agent', 43, 'Module Recap', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Agent', 44, 'Module Relevé', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
('Agent', 45, 'Module visite', 1, 1, 1, 0, 0, 1, 1, 0, NULL),
('Agent', 46, 'Stock', 0, 0, 0, 0, 0, 0, 0, 0, 0),
('Agent', 47, 'soldeClient', 1, 0, 0, 0, 0, NULL, NULL, 0, NULL),
('Agent', 52, 'Maps', 1, 1, 0, 0, 1, 0, 0, 0, 0);

-- ═══════════════════════════════════════════════════════════════════════
-- 3. VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════════

SELECT 
    ProfileUser,
    COUNT(*) as 'Nombre de Modules',
    SUM(CASE WHEN Actif=1 THEN 1 ELSE 0 END) as 'Modules Actifs',
    SUM(CASE WHEN canAdd=1 THEN 1 ELSE 0 END) as 'Peut Créer',
    SUM(CASE WHEN canEdit=1 THEN 1 ELSE 0 END) as 'Peut Éditer',
    SUM(CASE WHEN canDelt=1 THEN 1 ELSE 0 END) as 'Peut Supprimer'
FROM TabAWProfileAccess
WHERE LOWER(ProfileUser) IN ('admin', 'commerciale', 'technicien', 'client', 'agent')
GROUP BY ProfileUser
ORDER BY ProfileUser;

-- ═══════════════════════════════════════════════════════════════════════
-- 4. VOIR TOUS LES DÉTAILS
-- ═══════════════════════════════════════════════════════════════════════

SELECT 
    ProfileUser,
    CodMod,
    LibMod,
    Actif,
    canAdd,
    canEdit,
    canDelt,
    canValid
FROM TabAWProfileAccess
WHERE LOWER(ProfileUser) IN ('admin', 'commerciale', 'technicien', 'client', 'agent')
ORDER BY ProfileUser, CodMod;

-- ═══════════════════════════════════════════════════════════════════════
-- RÉSUMÉ PERMISSIONS:
-- ═══════════════════════════════════════════════════════════════════════
/*

ADMIN (16 modules - TOUS LES DROITS):
  ✓ Modules: 4,5,6,7,30,31,32,40,41,42,43,44,45,46,47,52
  ✓ Actif: Tous
  ✓ Create/Edit/Delete: Tous sauf 7,40,41,42,43,44

COMMERCIALE (16 modules - VENTES):
  ✓ Dévis (4): Créer + Éditer
  ✓ Commande (5): Créer + Éditer
  ✓ Livraison (6): Créer (pas éditer)
  ✗ Facture (7): INTERDIT
  ✓ Client (30): Créer + Éditer
  ✓ Réglement (31): Créer
  ✓ Visite (45): Créer
  ✗ Stock (46): INTERDIT

TECHNICIEN (16 modules - SUPPORT):
  ✗ Devis, Commande, Client: INTERDIT
  ✓ Stock (46): Éditer seulement
  ✓ Réglement (31): INTERDIT
  ✓ Visite (45): INTERDIT

CLIENT (16 modules - LECTURE):
  ✓ Devis (4): Lecture seulement (PDF)
  ✓ Facture (7): Lecture seulement (PDF)
  ✓ Client (30): Lecture seulement
  ✗ Tout le reste: INTERDIT

AGENT (16 modules - COMME COMMERCIAL):
  ✓ Devis, Commande, Livraison, Client, Réglement: Créer + Éditer
  ✓ Visite: Créer + Éditer
  ✗ Stock: INTERDIT

*/
