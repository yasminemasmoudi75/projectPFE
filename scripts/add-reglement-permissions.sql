-- ===================================================================
-- SCRIPT SQL: Ajouter module REGLEMENT dans TabAWProfileAccess
-- ===================================================================
-- Module REGLEMENT Code: 51 (nouveau code, ne réutilise PAS SAV=31)
-- Permet Admin, Commercial, Technicien, Client de voir leurs réglement
-- ===================================================================

-- 1️⃣ ADMIN - Accès complet (voir, créer, modifier, supprimer)
IF NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE CodMod = 51 AND LOWER(ProfileUser) = 'admin')
BEGIN
    INSERT INTO TabAWProfileAccess (CodMod, ProfileUser, Actif, canAdd, canEdit, canDelt, LibMod)
    VALUES (51, 'Admin', 1, 1, 1, 1, 'Module REGLEMENT')
    PRINT '✅ Admin permissions for REGLEMENT (CodMod=51) added'
END
ELSE
BEGIN
    UPDATE TabAWProfileAccess 
    SET Actif = 1, canAdd = 1, canEdit = 1, canDelt = 1, LibMod = 'Module REGLEMENT'
    WHERE CodMod = 51 AND LOWER(ProfileUser) = 'admin'
    PRINT '✏️ Admin permissions for REGLEMENT updated'
END

-- 2️⃣ COMMERCIAL - Accès complet (voir, créer, modifier)
IF NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE CodMod = 51 AND LOWER(ProfileUser) = 'commercial')
BEGIN
    INSERT INTO TabAWProfileAccess (CodMod, ProfileUser, Actif, canAdd, canEdit, canDelt, LibMod)
    VALUES (51, 'commercial', 1, 1, 1, 0, 'Module REGLEMENT')
    PRINT '✅ Commercial permissions for REGLEMENT added'
END
ELSE
BEGIN
    UPDATE TabAWProfileAccess 
    SET Actif = 1, canAdd = 1, canEdit = 1, canDelt = 0, LibMod = 'Module REGLEMENT'
    WHERE CodMod = 51 AND LOWER(ProfileUser) = 'commercial'
    PRINT '✏️ Commercial permissions for REGLEMENT updated'
END

-- 2️⃣B COMMERCIALE - Accès complet (voir, créer, modifier)
IF NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE CodMod = 51 AND LOWER(ProfileUser) = 'commerciale')
BEGIN
    INSERT INTO TabAWProfileAccess (CodMod, ProfileUser, Actif, canAdd, canEdit, canDelt, LibMod)
    VALUES (51, 'Commerciale', 1, 1, 1, 0, 'Module REGLEMENT')
    PRINT '✅ Commerciale permissions for REGLEMENT added'
END
ELSE
BEGIN
    UPDATE TabAWProfileAccess 
    SET Actif = 1, canAdd = 1, canEdit = 1, canDelt = 0, LibMod = 'Module REGLEMENT'
    WHERE CodMod = 51 AND LOWER(ProfileUser) = 'commerciale'
    PRINT '✏️ Commerciale permissions for REGLEMENT updated'
END

-- 3️⃣ TECHNICIEN - Accès en lecture (voir seulement)
IF NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE CodMod = 51 AND LOWER(ProfileUser) = 'technicien')
BEGIN
    INSERT INTO TabAWProfileAccess (CodMod, ProfileUser, Actif, canAdd, canEdit, canDelt, LibMod)
    VALUES (51, 'Technicien', 1, 0, 0, 0, 'Module REGLEMENT')
    PRINT '✅ Technicien permissions for REGLEMENT added'
END
ELSE
BEGIN
    UPDATE TabAWProfileAccess 
    SET Actif = 1, canAdd = 0, canEdit = 0, canDelt = 0, LibMod = 'Module REGLEMENT'
    WHERE CodMod = 51 AND LOWER(ProfileUser) = 'technicien'
    PRINT '✏️ Technicien permissions for REGLEMENT updated'
END

-- 4️⃣ CLIENT - Accès en lecture (voir seulement, filtré à leur propre réglement)
IF NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE CodMod = 51 AND LOWER(ProfileUser) = 'client')
BEGIN
    INSERT INTO TabAWProfileAccess (CodMod, ProfileUser, Actif, canAdd, canEdit, canDelt, LibMod)
    VALUES (51, 'Client', 1, 0, 0, 0, 'Module REGLEMENT')
    PRINT '✅ Client permissions for REGLEMENT added'
END
ELSE
BEGIN
    UPDATE TabAWProfileAccess 
    SET Actif = 1, canAdd = 0, canEdit = 0, canDelt = 0, LibMod = 'Module REGLEMENT'
    WHERE CodMod = 51 AND LOWER(ProfileUser) = 'client'
    PRINT '✏️ Client permissions for REGLEMENT updated'
END

-- 5️⃣ AGENT - Accès en lecture (voir seulement)
IF NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE CodMod = 51 AND LOWER(ProfileUser) = 'agent')
BEGIN
    INSERT INTO TabAWProfileAccess (CodMod, ProfileUser, Actif, canAdd, canEdit, canDelt, LibMod)
    VALUES (51, 'Agent', 1, 0, 0, 0, 'Module REGLEMENT')
    PRINT '✅ Agent permissions for REGLEMENT added'
END
ELSE
BEGIN
    UPDATE TabAWProfileAccess 
    SET Actif = 1, canAdd = 0, canEdit = 0, canDelt = 0, LibMod = 'Module REGLEMENT'
    WHERE CodMod = 51 AND LOWER(ProfileUser) = 'agent'
    PRINT '✏️ Agent permissions for REGLEMENT updated'
END

-- =================================================================
-- VÉRIFICATION
-- =================================================================

PRINT ''
PRINT '📊 REGLEMENT Module Permissions (CodMod=51):'
PRINT '═══════════════════════════════════════════════════════════'

SELECT 
    ProfileUser, 
    CodMod, 
    LibMod,
    Actif, 
    canAdd, 
    canEdit, 
    canDelt
FROM TabAWProfileAccess
WHERE CodMod = 51
ORDER BY CASE WHEN LOWER(ProfileUser) = 'admin' THEN 0
              WHEN LOWER(ProfileUser) LIKE 'commerc%' THEN 1
              WHEN LOWER(ProfileUser) = 'technicien' THEN 2
              WHEN LOWER(ProfileUser) = 'agent' THEN 3
              WHEN LOWER(ProfileUser) = 'client' THEN 4
              ELSE 5 END;

PRINT ''
PRINT '✅ Script completed! REGLEMENT module now uses CodMod=51'
