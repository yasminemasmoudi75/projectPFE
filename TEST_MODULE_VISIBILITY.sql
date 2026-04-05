-- ═════════════════════════════════════════════════════════════════
-- 🧪 TEST: DÉSACTIVER UN MODULE POUR TESTER LA VISIBILITÉ
-- ═════════════════════════════════════════════════════════════════
-- Exécutez ce script dans SQL Server Management Studio
-- ═════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- OPTION 1: Désactiver le module "Devis" (CodMod=4) pour Admin
-- ─────────────────────────────────────────────────────────────────
UPDATE TabAWProfileAccess
SET Actif = 0
WHERE ProfileUser = 'Admin' AND CodMod = 4;

-- Vérifier
SELECT ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt
FROM TabAWProfileAccess
WHERE ProfileUser = 'Admin' AND CodMod = 4;


-- ─────────────────────────────────────────────────────────────────
-- OPTION 2: Désactiver le module "Clients" (CodMod=30) pour Admin
-- ─────────────────────────────────────────────────────────────────
/*
UPDATE TabAWProfileAccess
SET Actif = 0
WHERE ProfileUser = 'Admin' AND CodMod = 30;

-- Vérifier
SELECT ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt
FROM TabAWProfileAccess
WHERE ProfileUser = 'Admin' AND CodMod = 30;
*/


-- ─────────────────────────────────────────────────────────────────
-- OPTION 3: Désactiver TOUS les modules pour un rôle (ex: Agent)
-- ─────────────────────────────────────────────────────────────────
/*
UPDATE TabAWProfileAccess
SET Actif = 0
WHERE ProfileUser = 'Agent';

-- Vérifier
SELECT ProfileUser, CodMod, LibMod, Actif
FROM TabAWProfileAccess
WHERE ProfileUser = 'Agent'
ORDER BY CodMod;
*/


-- ─────────────────────────────────────────────────────────────────
-- RÉTABLIR: Remettre Actif=1 pour Admin (tous les modules)
-- ─────────────────────────────────────────────────────────────────
/*
UPDATE TabAWProfileAccess
SET Actif = 1
WHERE ProfileUser = 'Admin';

-- Vérifier
SELECT ProfileUser, CodMod, LibMod, Actif
FROM TabAWProfileAccess
WHERE ProfileUser = 'Admin'
ORDER BY CodMod;
*/


-- ─────────────────────────────────────────────────────────────────
-- LISTE DES CODES MODULES DISPONIBLES
-- ─────────────────────────────────────────────────────────────────
/*
CodMod = 1   → Module Utilisateurs
CodMod = 2   → Module Messages
CodMod = 4   → Module Devis
CodMod = 5   → Module Commande (BCV)
CodMod = 6   → Module Livraison (BLV)
CodMod = 7   → Module Facture (FAV)
CodMod = 30  → Module Client
CodMod = 31  → Module Reglement
CodMod = 32  → Menu
CodMod = 40  → Module Tournée
CodMod = 41  → Module Chargement
CodMod = 42  → Module Objectif
CodMod = 43  → Module Recap
CodMod = 44  → Module Relevé
CodMod = 45  → Module visite
CodMod = 46  → Stock
CodMod = 47  → soldeClient
CodMod = 52  → Maps
*/

PRINT '✅ Script exécuté! Redémarrez le backend et rafraîchissez le frontend.';
