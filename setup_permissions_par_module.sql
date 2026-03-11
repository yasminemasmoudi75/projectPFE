-- ==========================================
-- SCRIPT COMPLET : PERMISSIONS PAR MODULE
-- ==========================================

-- ==========================================
-- ÉTAPE 1 : CRÉER/VÉRIFIER LES PROFILS
-- ==========================================
PRINT 'Étape 1 : Création des profils standards...';

-- Admin
IF NOT EXISTS (SELECT 1 FROM UCS_PROFILES WHERE PROF_ID = 1)
BEGIN
    INSERT INTO UCS_PROFILES (PROF_ID, PROF_DESCRIPTION, PARENT_PROF, PROF_LEVEL, INTERVAL_CHANGE_PWD, MUST_CHANGE_PWD, AUDIT_MODE)
    VALUES (1, 'Admin', 0, 0, 0, '0', '0');
    PRINT '✓ Profil Admin créé';
END
ELSE
    PRINT '✓ Profil Admin existe déjà';

-- Commercial
IF NOT EXISTS (SELECT 1 FROM UCS_PROFILES WHERE PROF_ID = 2)
BEGIN
    INSERT INTO UCS_PROFILES (PROF_ID, PROF_DESCRIPTION, PARENT_PROF, PROF_LEVEL, INTERVAL_CHANGE_PWD, MUST_CHANGE_PWD, AUDIT_MODE)
    VALUES (2, 'Commercial', 0, 0, 0, '0', '0');
    PRINT '✓ Profil Commercial créé';
END
ELSE
    PRINT '✓ Profil Commercial existe déjà';

-- Technicien
IF NOT EXISTS (SELECT 1 FROM UCS_PROFILES WHERE PROF_ID = 6)
BEGIN
    INSERT INTO UCS_PROFILES (PROF_ID, PROF_DESCRIPTION, PARENT_PROF, PROF_LEVEL, INTERVAL_CHANGE_PWD, MUST_CHANGE_PWD, AUDIT_MODE)
    VALUES (6, 'Technicien', 0, 0, 0, '0', '0');
    PRINT '✓ Profil Technicien créé';
END
ELSE
    PRINT '✓ Profil Technicien existe déjà';

-- Agent
IF NOT EXISTS (SELECT 1 FROM UCS_PROFILES WHERE PROF_ID = 8)
BEGIN
    INSERT INTO UCS_PROFILES (PROF_ID, PROF_DESCRIPTION, PARENT_PROF, PROF_LEVEL, INTERVAL_CHANGE_PWD, MUST_CHANGE_PWD, AUDIT_MODE)
    VALUES (8, 'Agent', 0, 0, 0, '0', '0');
    PRINT '✓ Profil Agent créé';
END
ELSE
    PRINT '✓ Profil Agent existe déjà';

-- Client
IF NOT EXISTS (SELECT 1 FROM UCS_PROFILES WHERE PROF_ID = 7)
BEGIN
    INSERT INTO UCS_PROFILES (PROF_ID, PROF_DESCRIPTION, PARENT_PROF, PROF_LEVEL, INTERVAL_CHANGE_PWD, MUST_CHANGE_PWD, AUDIT_MODE)
    VALUES (7, 'Client', 0, 0, 0, '0', '0');
    PRINT '✓ Profil Client créé';
END
ELSE
    PRINT '✓ Profil Client existe déjà';

GO

-- ==========================================
-- ÉTAPE 2 : UNIFORMISER UserRole dans Sec_Users
-- ==========================================
PRINT '';
PRINT 'Étape 2 : Uniformisation des rôles dans Sec_Users...';

UPDATE Sec_Users SET UserRole = 'Admin' WHERE UserRole IN ('admin', 'ADMIN', 'administrateur');
UPDATE Sec_Users SET UserRole = 'Commercial' WHERE UserRole IN ('commercial', 'COMMERCIAL', 'Manager', 'manager', 'Commerciale');
UPDATE Sec_Users SET UserRole = 'Agent' WHERE UserRole IN ('agent', 'AGENT');
UPDATE Sec_Users SET UserRole = 'Technicien' WHERE UserRole IN ('technicien', 'TECHNICIEN', 'Technicien SAV');
UPDATE Sec_Users SET UserRole = 'Client' WHERE UserRole IN ('client', 'CLIENT');

PRINT '✓ Rôles uniformisés';

GO

-- ==========================================
-- ÉTAPE 3 : NETTOYER TabAWProfileAccess
-- ==========================================
PRINT '';
PRINT 'Étape 3 : Nettoyage de TabAWProfileAccess...';

-- Supprimer les anciennes entrées si nécessaire
DELETE FROM TabAWProfileAccess WHERE ProfileUser IN ('Admin', 'Commercial', 'Commerciale', 'Agent', 'Technicien', 'Client');
PRINT '✓ Anciennes permissions supprimées';

GO

-- ==========================================
-- ÉTAPE 4 : REMPLIR TabAWProfileAccess
-- ==========================================
PRINT '';
PRINT 'Étape 4 : Configuration des permissions par module...';

-- ===== ADMIN : TOUS DROITS SUR TOUS MODULES =====
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CtrlStk, CanImp, canPDF)
VALUES
('Admin', 1, 'Objectifs', 1, 1, 1, 1, 1, 0, 1, 1),
('Admin', 2, 'Réclamations', 1, 1, 1, 1, 1, 0, 1, 1),
('Admin', 3, 'Interventions', 1, 1, 1, 1, 1, 0, 1, 1),
('Admin', 4, 'Devis', 1, 1, 1, 1, 1, 0, 1, 1),
('Admin', 5, 'Projets', 1, 1, 1, 1, 1, 0, 1, 1),
('Admin', 6, 'Produits', 1, 1, 1, 1, 0, 0, 1, 1),
('Admin', 7, 'Tiers', 1, 1, 1, 1, 0, 0, 1, 1),
('Admin', 8, 'BCV', 1, 1, 1, 1, 1, 1, 1, 1),
('Admin', 9, 'Activités', 1, 1, 1, 1, 0, 0, 1, 1),
('Admin', 10, 'Messages', 1, 1, 1, 1, 0, 0, 0, 0);

PRINT '✓ Permissions Admin configurées (10 modules)';

-- ===== COMMERCIAL : CRÉER/MODIFIER, PAS SUPPRIMER =====
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, FiltreRepres, CtrlStk, CanImp, canPDF)
VALUES
('Commercial', 1, 'Objectifs', 1, 0, 1, 0, 0, 1, 0, 1, 1),           -- voir/modifier ses objectifs
('Commercial', 2, 'Réclamations', 1, 1, 1, 0, 0, 1, 0, 1, 1),        -- créer/modifier
('Commercial', 4, 'Devis', 1, 1, 1, 0, 1, 1, 0, 1, 1),               -- créer/modifier/valider
('Commercial', 5, 'Projets', 1, 1, 1, 0, 0, 1, 0, 1, 1),             -- créer/modifier
('Commercial', 6, 'Produits', 1, 0, 0, 0, 0, 0, 0, 1, 1),            -- lecture seule
('Commercial', 7, 'Tiers', 1, 1, 1, 0, 0, 1, 0, 1, 1),               -- gérer clients
('Commercial', 8, 'BCV', 1, 1, 1, 0, 0, 1, 0, 1, 1),                 -- bons de commande
('Commercial', 9, 'Activités', 1, 1, 1, 0, 0, 1, 0, 1, 1),           -- suivre activités
('Commercial', 10, 'Messages', 1, 1, 1, 0, 0, 0, 0, 0, 0);           -- messages

PRINT '✓ Permissions Commercial configurées (9 modules)';

-- ===== AGENT : opérationnel proche commercial (sans suppression) =====
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, FiltreRepres, CtrlStk, CanImp, canPDF)
VALUES
('Agent', 1, 'Objectifs', 1, 0, 1, 0, 0, 1, 0, 1, 1),
('Agent', 2, 'Réclamations', 1, 1, 1, 0, 0, 1, 0, 1, 1),
('Agent', 4, 'Devis', 1, 1, 1, 0, 0, 1, 0, 1, 1),
('Agent', 5, 'Projets', 1, 1, 1, 0, 0, 1, 0, 1, 1),
('Agent', 7, 'Tiers', 1, 1, 1, 0, 0, 1, 0, 1, 1),
('Agent', 9, 'Activités', 1, 1, 1, 0, 0, 1, 0, 1, 1),
('Agent', 10, 'Messages', 1, 1, 1, 0, 0, 0, 0, 0, 0);

PRINT '✓ Permissions Agent configurées (7 modules)';

-- ===== TECHNICIEN : INTERVENTIONS + LECTURES =====
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CtrlStk, CanImp, canPDF)
VALUES
('Technicien', 2, 'Réclamations', 1, 0, 1, 0, 0, 0, 1, 1),          -- modifier statut
('Technicien', 3, 'Interventions', 1, 1, 1, 0, 0, 0, 1, 1),         -- créer/modifier DI
('Technicien', 6, 'Produits', 1, 0, 0, 0, 0, 0, 1, 1),              -- lecture seule
('Technicien', 7, 'Tiers', 1, 0, 0, 0, 0, 0, 1, 1),                 -- lecture clients
('Technicien', 10, 'Messages', 1, 1, 1, 0, 0, 0, 0, 0);             -- messages

PRINT '✓ Permissions Technicien configurées (5 modules)';

-- ===== CLIENT : LECTURE + CRÉER RÉCLAMATIONS =====
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CtrlStk, CanImp, canPDF)
VALUES
('Client', 2, 'Réclamations', 1, 1, 0, 0, 0, 0, 0, 0),             -- créer réclamation uniquement
('Client', 4, 'Devis', 1, 0, 0, 0, 0, 0, 1, 1),                    -- voir ses devis
('Client', 10, 'Messages', 1, 1, 0, 0, 0, 0, 0, 0);                -- envoyer messages

PRINT '✓ Permissions Client configurées (3 modules)';

GO

-- ==========================================
-- ÉTAPE 5 (OPTIONNEL) : REMPLIR UCS_USERINFO
-- ==========================================
PRINT '';
PRINT 'Étape 5 : Liaison utilisateurs → profils via UCS_USERINFO...';

-- Remplir pour tous les users existants
INSERT INTO UCS_USERINFO (APP_ID, USER_ID, PROF_ID, USER_ACTIVE, USER_IS_ADMIN, EXPIRATION_DATE, USER_EXPIRE, ADDITIONAL_INFO)
SELECT 
    1 AS APP_ID,
    u.UserID,
    CASE 
        WHEN u.UserRole = 'Admin' THEN 1
        WHEN u.UserRole = 'Commercial' THEN 2
        WHEN u.UserRole = 'Agent' THEN 8
        WHEN u.UserRole = 'Technicien' THEN 6
        WHEN u.UserRole = 'Client' THEN 7
        ELSE 2 -- Par défaut Commercial
    END AS PROF_ID,
    '1' AS USER_ACTIVE,
    CASE WHEN u.UserRole = 'Admin' THEN '1' ELSE '0' END AS USER_IS_ADMIN,
    50000 AS EXPIRATION_DATE,
    '0' AS USER_EXPIRE,
    '' AS ADDITIONAL_INFO
FROM Sec_Users u
WHERE NOT EXISTS (SELECT 1 FROM UCS_USERINFO WHERE USER_ID = u.UserID AND APP_ID = 1);

-- Synchroniser PROF_ID existant avec le rôle actuel pour garantir Option B
UPDATE ui
SET ui.PROF_ID = CASE 
        WHEN u.UserRole = 'Admin' THEN 1
        WHEN u.UserRole = 'Commercial' THEN 2
        WHEN u.UserRole = 'Agent' THEN 8
        WHEN u.UserRole = 'Technicien' THEN 6
        WHEN u.UserRole = 'Client' THEN 7
        ELSE ui.PROF_ID
    END,
    ui.USER_IS_ADMIN = CASE WHEN u.UserRole = 'Admin' THEN '1' ELSE '0' END,
    ui.USER_ACTIVE = '1'
FROM UCS_USERINFO ui
INNER JOIN Sec_Users u ON u.UserID = ui.USER_ID
WHERE ui.APP_ID = 1;

PRINT '✓ Liaison utilisateurs → profils effectuée';

GO

-- ==========================================
-- VÉRIFICATION FINALE
-- ==========================================
PRINT '';
PRINT '==========================================';
PRINT 'VÉRIFICATION FINALE';
PRINT '==========================================';

PRINT '';
PRINT 'Profils créés :';
SELECT PROF_ID, PROF_DESCRIPTION, PROF_LEVEL FROM UCS_PROFILES ORDER BY PROF_ID;

PRINT '';
PRINT 'Permissions par profil :';
SELECT 
    ProfileUser,
    COUNT(*) as NbModules,
    SUM(CASE WHEN canAdd = 1 THEN 1 ELSE 0 END) as NbAdd,
    SUM(CASE WHEN canEdit = 1 THEN 1 ELSE 0 END) as NbEdit,
    SUM(CASE WHEN canDelt = 1 THEN 1 ELSE 0 END) as NbDelt
FROM TabAWProfileAccess
GROUP BY ProfileUser
ORDER BY ProfileUser;

PRINT '';
PRINT 'Distribution des rôles utilisateurs :';
SELECT UserRole, COUNT(*) as NbUsers
FROM Sec_Users
GROUP BY UserRole
ORDER BY UserRole;

PRINT '';
PRINT '==========================================';
PRINT '✓ SCRIPT TERMINÉ AVEC SUCCÈS';
PRINT '==========================================';
