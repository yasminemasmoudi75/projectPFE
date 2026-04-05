-- ═════════════════════════════════════════════════════════════════
-- 🔧 FIX: ACTIVATE ALL MODULES FOR ADMIN
-- ═════════════════════════════════════════════════════════════════
-- Execute this script in SQL Server Management Studio
-- This will ensure all modules are visible (Actif=1) for Admin role
-- ═════════════════════════════════════════════════════════════════

-- Step 1: Check current permissions for Admin
SELECT 'BEFORE FIX - Current Admin Permissions:' as Info;
SELECT ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid
FROM TabAWProfileAccess
WHERE LOWER(ProfileUser) = 'admin'
ORDER BY CodMod;

-- Step 2: Update all Admin modules to Actif=1
UPDATE TabAWProfileAccess
SET Actif = 1,
    canAdd = 1,
    canEdit = 1,
    canDelt = 1,
    canValid = 1,
    CanImp = 1,
    canPDF = 1
WHERE LOWER(ProfileUser) = 'admin';

-- Step 3: If Admin doesn't exist, insert all modules
-- First check if Admin has any permissions
DECLARE @AdminCount INT;
SELECT @AdminCount = COUNT(*) FROM TabAWProfileAccess WHERE LOWER(ProfileUser) = 'admin';

IF @AdminCount = 0
BEGIN
    PRINT 'Admin not found - Inserting all modules...';
    
    INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
    VALUES 
    ('Admin', 4, 'Module Devis', 1, 1, 1, 1, 1, 1, 1),
    ('Admin', 5, 'Module Commande', 1, 1, 1, 1, 1, 1, 1),
    ('Admin', 6, 'Module Livraison', 1, 1, 1, 1, 1, 1, 1),
    ('Admin', 7, 'Module Facture', 1, 1, 1, 1, 1, 1, 1),
    ('Admin', 30, 'Module Client', 1, 1, 1, 1, 1, 1, 1),
    ('Admin', 31, 'Module Reglement', 1, 1, 1, 1, 1, 1, 1),
    ('Admin', 32, 'Menu', 1, 1, 1, 1, 1, 1, 1),
    ('Admin', 40, 'Module Tournée', 1, 1, 1, 1, 1, 1, 1),
    ('Admin', 41, 'Module Chargement', 1, 1, 1, 1, 1, 1, 1),
    ('Admin', 42, 'Module Objectif', 1, 1, 1, 1, 1, 1, 1),
    ('Admin', 43, 'Module Recap', 1, 1, 1, 1, 1, 1, 1),
    ('Admin', 44, 'Module Relevé', 1, 1, 1, 1, 1, 1, 1),
    ('Admin', 45, 'Module visite', 1, 1, 1, 1, 1, 1, 1),
    ('Admin', 46, 'Stock', 1, 1, 1, 1, 1, 1, 1),
    ('Admin', 47, 'soldeClient', 1, 1, 1, 1, 1, 1, 1),
    ('Admin', 52, 'Maps', 1, 1, 1, 1, 1, 1, 1);
END

-- Step 4: Verify the fix
SELECT 'AFTER FIX - Admin Permissions:' as Info;
SELECT ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid
FROM TabAWProfileAccess
WHERE LOWER(ProfileUser) = 'admin'
ORDER BY CodMod;

-- Step 5: Show summary
SELECT 
    'SUMMARY' as Info,
    COUNT(*) as 'Total Modules',
    SUM(CASE WHEN Actif=1 THEN 1 ELSE 0 END) as 'Active Modules'
FROM TabAWProfileAccess
WHERE LOWER(ProfileUser) = 'admin';

PRINT '✅ Fix complete! Restart backend server to apply changes.';
