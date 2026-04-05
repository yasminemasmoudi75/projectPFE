-- ═════════════════════════════════════════════════════════════════
-- 🔧 SCRIPT SQL: REMPLIR TabAWProfileAccess AVEC TOUS LES RÔLES
-- ═════════════════════════════════════════════════════════════════
-- 
-- Ce script ajoute les permissions pour TOUS les rôles dans la base
-- Rôles: Admin, Commerciale, Technicien, Client, Agent
-- 
-- À exécuter dans SQL Server Management Studio
-- ═════════════════════════════════════════════════════════════════

-- 1️⃣ NETTOYER LES DOUBLONS (optionnel - si tu veux recommencer from scratch)
-- DELETE FROM TabAWProfileAccess WHERE LOWER(ProfileUser) IN ('admin', 'administrateur', 'technicien', 'client', 'agent');

-- ═════════════════════════════════════════════════════════════════
-- 2️⃣ AJOUTER LES PROFILS MANQUANTS (Admin, Technicien, Client, Agent)
-- ═════════════════════════════════════════════════════════════════

-- ############################################
-- PROFIL: ADMIN (Tous les droits partout)
-- ############################################
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Admin', 4, 'Module Devis', 1, 1, 1, 1, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Admin' AND CodMod=4);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Admin', 5, 'Module Commande', 1, 1, 1, 1, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Admin' AND CodMod=5);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Admin', 6, 'Module Livraison', 1, 1, 1, 1, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Admin' AND CodMod=6);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Admin', 7, 'Module Facture', 1, 1, 1, 1, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Admin' AND CodMod=7);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Admin', 30, 'Module Client', 1, 1, 1, 1, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Admin' AND CodMod=30);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Admin', 31, 'Module Reglement', 1, 1, 1, 1, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Admin' AND CodMod=31);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Admin', 32, 'Menu', 1, 1, 1, 1, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Admin' AND CodMod=32);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Admin', 40, 'Module Tournée', 1, 1, 1, 1, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Admin' AND CodMod=40);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Admin', 41, 'Module Chargement', 1, 1, 1, 1, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Admin' AND CodMod=41);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Admin', 42, 'Module Objectif', 1, 1, 1, 1, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Admin' AND CodMod=42);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Admin', 46, 'Stock', 1, 1, 1, 1, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Admin' AND CodMod=46);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Admin', 47, 'soldeClient', 1, 1, 1, 1, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Admin' AND CodMod=47);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Admin', 52, 'Maps', 1, 1, 1, 1, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Admin' AND CodMod=52);

-- ############################################
-- PROFIL: TECHNICIEN (Activités, Stock, SAV)
-- ############################################
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Technicien', 4, 'Module Devis', 0, 0, 0, 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Technicien' AND CodMod=4);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Technicien', 5, 'Module Commande', 0, 0, 0, 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Technicien' AND CodMod=5);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Technicien', 30, 'Module Client', 0, 0, 0, 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Technicien' AND CodMod=30);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Technicien', 31, 'Module Reglement', 0, 0, 0, 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Technicien' AND CodMod=31);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Technicien', 46, 'Stock', 1, 0, 1, 0, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Technicien' AND CodMod=46);

-- ############################################
-- PROFIL: CLIENT (Devis, Facture - Lecture)
-- ############################################
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Client', 4, 'Module Devis', 1, 0, 0, 0, 0, 0, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Client' AND CodMod=4);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Client', 7, 'Module Facture', 1, 0, 0, 0, 0, 0, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Client' AND CodMod=7);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Client', 30, 'Module Client', 1, 0, 0, 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Client' AND CodMod=30);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Client', 31, 'Module Reglement', 0, 0, 0, 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Client' AND CodMod=31);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Client', 46, 'Stock', 0, 0, 0, 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Client' AND CodMod=46);

-- ############################################
-- PROFIL: AGENT (Comme Commercial, sans Stock)
-- ############################################
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Agent', 4, 'Module Devis', 1, 1, 1, 0, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Agent' AND CodMod=4);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Agent', 5, 'Module Commande', 1, 1, 1, 0, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Agent' AND CodMod=5);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Agent', 6, 'Module Livraison', 1, 1, 1, 0, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Agent' AND CodMod=6);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Agent', 30, 'Module Client', 1, 1, 1, 0, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Agent' AND CodMod=30);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Agent', 31, 'Module Reglement', 1, 1, 1, 0, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Agent' AND CodMod=31);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Agent', 46, 'Stock', 0, 0, 0, 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser='Agent' AND CodMod=46);

-- ═════════════════════════════════════════════════════════════════
-- 3️⃣ VÉRIFIER LE RÉSULTAT
-- ═════════════════════════════════════════════════════════════════

SELECT 
    ProfileUser,
    COUNT(*) as NombreModules,
    SUM(CASE WHEN Actif=1 THEN 1 ELSE 0 END) as ModulesActifs,
    SUM(CASE WHEN canAdd=1 THEN 1 ELSE 0 END) as ModulesCan_Add,
    SUM(CASE WHEN canEdit=1 THEN 1 ELSE 0 END) as ModulesCan_Edit,
    SUM(CASE WHEN canDelt=1 THEN 1 ELSE 0 END) as ModulesCan_Delete
FROM TabAWProfileAccess
WHERE LOWER(ProfileUser) IN ('admin', 'commerciale', 'technicien', 'client', 'agent')
GROUP BY ProfileUser
ORDER BY ProfileUser;

-- ═════════════════════════════════════════════════════════════════
-- RÉSUMÉ DES PERMISSIONS PAR RÔLE:
-- ═════════════════════════════════════════════════════════════════
/*
ADMIN:
  ✓ TOUS les modules (4, 5, 6, 7, 30, 31, 32, 40, 41, 42, 46, 47, 52)
  ✓ Actif=1, canAdd=1, canEdit=1, canDelt=1, canValid=1

COMMERCIALE: (existait déjà)
  ✓ Devis (4), Commande (5), Livraison (6), Client (30), Réglement (31)
  ✓ Maps (52)
  ✗ Stock (46), Facture (7)

TECHNICIEN: (nouveau)
  ✗ Devis (4), Commande (5), Client (30)
  ✓ Stock (46) - consulter et éditer
  
CLIENT: (nouveau)
  ✓ Devis (4) - lecture
  ✓ Facture (7) - lecture
  ✗ Commandes, Livraison, Stock

AGENT: (nouveau)
  ✓ Comme Commercial (Devis, Commande, Livraison, Client, Réglement)
  ✗ Stock (46)
*/
