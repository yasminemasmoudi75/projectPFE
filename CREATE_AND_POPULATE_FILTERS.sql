-- ============================================================================
-- SCRIPT COMPLET: Créer TabRoleFilterVisibility + Insérer TOUS les filtres
-- ============================================================================
-- Cette table contient la configuration de visibilité des filtres
-- par rôle, module, et type de filtre
-- ============================================================================

USE AA;
GO

-- ============================================================================
-- ÉTAPE 1: Créer la table
-- ============================================================================

PRINT '✅ ÉTAPE 1: Créer la table TabRoleFilterVisibility';
PRINT '';

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'TabRoleFilterVisibility'
)
BEGIN
    CREATE TABLE dbo.TabRoleFilterVisibility (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ProfileUser NVARCHAR(50) NOT NULL,
        ModuleCode NVARCHAR(50) NOT NULL,
        FilterKey NVARCHAR(100) NOT NULL,
        VisibleForRole BIT NOT NULL DEFAULT(1),
        FilterLabel NVARCHAR(200),
        FilterValueType NVARCHAR(20) DEFAULT('enum'),
        UpdatedAt DATETIME2 DEFAULT(GETDATE()),
        CONSTRAINT UQ_TabRoleModuleFilter UNIQUE (ProfileUser, ModuleCode, FilterKey)
    );
    
    PRINT '✅ Table TabRoleFilterVisibility CRÉÉE';
    PRINT '   Colonnes: Id, ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType, UpdatedAt';
    PRINT '   Contrainte UNIQUE: (ProfileUser, ModuleCode, FilterKey)';
END
ELSE
BEGIN
    PRINT '⚠️  Table TabRoleFilterVisibility existe déjà';
END

PRINT '';

-- ============================================================================
-- ÉTAPE 2: Créer les index
-- ============================================================================

PRINT '📑 ÉTAPE 2: Créer les index';
PRINT '';

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_TabRoleFilterVisibility_ProfileModule'
    AND object_id = OBJECT_ID('dbo.TabRoleFilterVisibility')
)
BEGIN
    CREATE INDEX IX_TabRoleFilterVisibility_ProfileModule 
    ON dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode);
    
    PRINT '✅ Index créé: (ProfileUser, ModuleCode)';
END
ELSE
BEGIN
    PRINT '⚠️  Index existe déjà';
END

PRINT '';

-- ============================================================================
-- ÉTAPE 3: Insérer STOCK - admins voient tous les filtres
-- ============================================================================

PRINT '📊 ÉTAPE 3: Insérer filtres STOCK';
PRINT '   → admin...';

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'STOCK', 'all', 1, 'Tous', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'STOCK' AND FilterKey = 'all');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'STOCK', 'ok', 1, 'Dispo', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'STOCK' AND FilterKey = 'ok');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'STOCK', 'low', 1, 'Faible', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'STOCK' AND FilterKey = 'low');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'STOCK', 'rupture', 1, 'Rupture', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'STOCK' AND FilterKey = 'rupture');

-- Commercial
PRINT '   → commercial...';

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'commercial', 'STOCK', 'all', 1, 'Tous', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'commercial' AND ModuleCode = 'STOCK' AND FilterKey = 'all');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'commercial', 'STOCK', 'ok', 1, 'Dispo', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'commercial' AND ModuleCode = 'STOCK' AND FilterKey = 'ok');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'commercial', 'STOCK', 'low', 1, 'Faible', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'commercial' AND ModuleCode = 'STOCK' AND FilterKey = 'low');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'commercial', 'STOCK', 'rupture', 1, 'Rupture', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'commercial' AND ModuleCode = 'STOCK' AND FilterKey = 'rupture');

-- Agent
PRINT '   → agent...';

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'agent', 'STOCK', 'all', 1, 'Tous', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'agent' AND ModuleCode = 'STOCK' AND FilterKey = 'all');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'agent', 'STOCK', 'ok', 1, 'Dispo', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'agent' AND ModuleCode = 'STOCK' AND FilterKey = 'ok');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'agent', 'STOCK', 'low', 1, 'Faible', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'agent' AND ModuleCode = 'STOCK' AND FilterKey = 'low');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'agent', 'STOCK', 'rupture', 1, 'Rupture', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'agent' AND ModuleCode = 'STOCK' AND FilterKey = 'rupture');

-- Technicien
PRINT '   → technicien...';

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'technicien', 'STOCK', 'all', 1, 'Tous', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'technicien' AND ModuleCode = 'STOCK' AND FilterKey = 'all');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'technicien', 'STOCK', 'ok', 1, 'Dispo', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'technicien' AND ModuleCode = 'STOCK' AND FilterKey = 'ok');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'technicien', 'STOCK', 'low', 1, 'Faible', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'technicien' AND ModuleCode = 'STOCK' AND FilterKey = 'low');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'technicien', 'STOCK', 'rupture', 1, 'Rupture', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'technicien' AND ModuleCode = 'STOCK' AND FilterKey = 'rupture');

-- Client - cache le filtre 'low'
PRINT '   → client (low caché)...';

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'client', 'STOCK', 'all', 1, 'Tous', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'client' AND ModuleCode = 'STOCK' AND FilterKey = 'all');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'client', 'STOCK', 'ok', 1, 'Dispo', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'client' AND ModuleCode = 'STOCK' AND FilterKey = 'ok');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'client', 'STOCK', 'low', 0, 'Faible', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'client' AND ModuleCode = 'STOCK' AND FilterKey = 'low');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'client', 'STOCK', 'rupture', 1, 'Rupture', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'client' AND ModuleCode = 'STOCK' AND FilterKey = 'rupture');

PRINT '   ✅ STOCK: 20 lignes insérées (4 filtres × 5 rôles)';

-- ============================================================================
-- ÉTAPE 4: Insérer RECLAMATION
-- ============================================================================

PRINT '   → Insertion RECLAMATION...';

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'RECLAMATION', 'status_open', 1, 'Ouvert', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'RECLAMATION' AND FilterKey = 'status_open');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'RECLAMATION', 'status_progress', 1, 'En cours', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'RECLAMATION' AND FilterKey = 'status_progress');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'RECLAMATION', 'status_resolved', 1, 'Résolu', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'RECLAMATION' AND FilterKey = 'status_resolved');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'RECLAMATION', 'priority_urgent', 1, 'Urgent', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'RECLAMATION' AND FilterKey = 'priority_urgent');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'RECLAMATION', 'priority_high', 1, 'Haute', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'RECLAMATION' AND FilterKey = 'priority_high');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'RECLAMATION', 'priority_normal', 1, 'Normale', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'RECLAMATION' AND FilterKey = 'priority_normal');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'RECLAMATION', 'priority_low', 1, 'Basse', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'RECLAMATION' AND FilterKey = 'priority_low');

-- Client - Statuts oui, Priorités non
INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'client', 'RECLAMATION', 'status_open', 1, 'Ouvert', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'client' AND ModuleCode = 'RECLAMATION' AND FilterKey = 'status_open');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'client', 'RECLAMATION', 'status_progress', 1, 'En cours', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'client' AND ModuleCode = 'RECLAMATION' AND FilterKey = 'status_progress');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'client', 'RECLAMATION', 'status_resolved', 1, 'Résolu', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'client' AND ModuleCode = 'RECLAMATION' AND FilterKey = 'status_resolved');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'client', 'RECLAMATION', 'priority_urgent', 0, 'Urgent', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'client' AND ModuleCode = 'RECLAMATION' AND FilterKey = 'priority_urgent');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'client', 'RECLAMATION', 'priority_high', 0, 'Haute', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'client' AND ModuleCode = 'RECLAMATION' AND FilterKey = 'priority_high');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'client', 'RECLAMATION', 'priority_normal', 0, 'Normale', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'client' AND ModuleCode = 'RECLAMATION' AND FilterKey = 'priority_normal');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'client', 'RECLAMATION', 'priority_low', 0, 'Basse', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'client' AND ModuleCode = 'RECLAMATION' AND FilterKey = 'priority_low');

-- Commercial - tous les filtres
INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'commercial', 'RECLAMATION', 'status_open', 1, 'Ouvert', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'commercial' AND ModuleCode = 'RECLAMATION' AND FilterKey = 'status_open');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'commercial', 'RECLAMATION', 'status_progress', 1, 'En cours', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'commercial' AND ModuleCode = 'RECLAMATION' AND FilterKey = 'status_progress');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'commercial', 'RECLAMATION', 'status_resolved', 1, 'Résolu', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'commercial' AND ModuleCode = 'RECLAMATION' AND FilterKey = 'status_resolved');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'commercial', 'RECLAMATION', 'priority_urgent', 1, 'Urgent', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'commercial' AND ModuleCode = 'RECLAMATION' AND FilterKey = 'priority_urgent');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'commercial', 'RECLAMATION', 'priority_high', 1, 'Haute', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'commercial' AND ModuleCode = 'RECLAMATION' AND FilterKey = 'priority_high');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'commercial', 'RECLAMATION', 'priority_normal', 1, 'Normale', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'commercial' AND ModuleCode = 'RECLAMATION' AND FilterKey = 'priority_normal');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'commercial', 'RECLAMATION', 'priority_low', 1, 'Basse', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'commercial' AND ModuleCode = 'RECLAMATION' AND FilterKey = 'priority_low');

PRINT '   ✅ RECLAMATION: 21 lignes insérées';

-- ============================================================================
-- ÉTAPE 5: Insérer DEVIS
-- ============================================================================

PRINT '   → Insertion DEVIS...';

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'DEVIS', 'status_draft', 1, 'Brouillon', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'DEVIS' AND FilterKey = 'status_draft');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'DEVIS', 'status_valid', 1, 'Validé', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'DEVIS' AND FilterKey = 'status_valid');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'DEVIS', 'status_converted', 1, 'Converti', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'DEVIS' AND FilterKey = 'status_converted');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'commercial', 'DEVIS', 'status_draft', 0, 'Brouillon', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'commercial' AND ModuleCode = 'DEVIS' AND FilterKey = 'status_draft');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'commercial', 'DEVIS', 'status_valid', 1, 'Validé', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'commercial' AND ModuleCode = 'DEVIS' AND FilterKey = 'status_valid');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'commercial', 'DEVIS', 'status_converted', 1, 'Converti', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'commercial' AND ModuleCode = 'DEVIS' AND FilterKey = 'status_converted');

PRINT '   ✅ DEVIS: 6 lignes insérées';

-- ============================================================================
-- ÉTAPE 6: Insérer BCV
-- ============================================================================

PRINT '   → Insertion BCV...';

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'BCV', 'status_draft', 1, 'Brouillon', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'BCV' AND FilterKey = 'status_draft');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'BCV', 'status_valid', 1, 'Validé', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'BCV' AND FilterKey = 'status_valid');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'BCV', 'status_converted', 1, 'Livré', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'BCV' AND FilterKey = 'status_converted');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'commercial', 'BCV', 'status_draft', 0, 'Brouillon', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'commercial' AND ModuleCode = 'BCV' AND FilterKey = 'status_draft');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'commercial', 'BCV', 'status_valid', 1, 'Validé', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'commercial' AND ModuleCode = 'BCV' AND FilterKey = 'status_valid');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'commercial', 'BCV', 'status_converted', 1, 'Livré', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'commercial' AND ModuleCode = 'BCV' AND FilterKey = 'status_converted');

PRINT '   ✅ BCV: 6 lignes insérées';

-- ============================================================================
-- ÉTAPE 7: Insérer BLV
-- ============================================================================

PRINT '   → Insertion BLV...';

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'BLV', 'status_draft', 1, 'Brouillon', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'BLV' AND FilterKey = 'status_draft');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'BLV', 'status_valid', 1, 'Validé', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'BLV' AND FilterKey = 'status_valid');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'BLV', 'status_converted', 1, 'Transféré', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'BLV' AND FilterKey = 'status_converted');

PRINT '   ✅ BLV: 3 lignes insérées';

-- ============================================================================
-- ÉTAPE 8: Insérer FAV
-- ============================================================================

PRINT '   → Insertion FAV...';

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'FAV', 'status_draft', 1, 'Brouillon', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'FAV' AND FilterKey = 'status_draft');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'FAV', 'status_valid', 1, 'Validée', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'FAV' AND FilterKey = 'status_valid');

INSERT INTO dbo.TabRoleFilterVisibility (ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT 'admin', 'FAV', 'status_converted', 1, 'Convertie', 'enum'
WHERE NOT EXISTS (SELECT 1 FROM dbo.TabRoleFilterVisibility WHERE ProfileUser = 'admin' AND ModuleCode = 'FAV' AND FilterKey = 'status_converted');

PRINT '   ✅ FAV: 3 lignes insérées';

PRINT '';

-- ============================================================================
-- ÉTAPE 9: Vérifier le résultat
-- ============================================================================

PRINT '✅ ÉTAPE 9: Vérifier le résultat';
PRINT '';

SELECT 
    ModuleCode,
    COUNT(*) AS NombreLignes,
    COUNT(DISTINCT ProfileUser) AS Roles,
    COUNT(DISTINCT FilterKey) AS Filtres
FROM dbo.TabRoleFilterVisibility
GROUP BY ModuleCode
ORDER BY ModuleCode;

PRINT '';
PRINT '📊 Statistiques générales:';
SELECT 
    COUNT(*) AS TotalLignes,
    COUNT(DISTINCT ProfileUser) AS TotalRoles,
    COUNT(DISTINCT ModuleCode) AS ModulesCouverts,
    COUNT(DISTINCT FilterKey) AS TotalFiltres
FROM dbo.TabRoleFilterVisibility;

PRINT '';
PRINT '👥 Filtres visibles par rôle:';
SELECT 
    ProfileUser,
    COUNT(*) AS NombreFiltres,
    SUM(CASE WHEN VisibleForRole = 1 THEN 1 ELSE 0 END) AS FiltresVisibles,
    SUM(CASE WHEN VisibleForRole = 0 THEN 1 ELSE 0 END) AS FiltresCaches
FROM dbo.TabRoleFilterVisibility
GROUP BY ProfileUser
ORDER BY ProfileUser;

PRINT '';

-- ============================================================================
-- ÉTAPE 10: Example Queries
-- ============================================================================

PRINT '📋 ÉTAPE 10: Example - Filtres CLIENT + STOCK';
PRINT '';

SELECT 
    ProfileUser,
    ModuleCode,
    FilterKey,
    FilterLabel,
    CASE WHEN VisibleForRole = 1 THEN '✅ VISIBLE' ELSE '❌ CACHÉ' END AS Statut
FROM dbo.TabRoleFilterVisibility
WHERE ProfileUser = 'client' AND ModuleCode = 'STOCK'
ORDER BY FilterKey;

PRINT '';

-- ============================================================================
-- FIN
-- ============================================================================

PRINT '✅ SETUP TERMINÉ AVEC SUCCÈS!';
PRINT '';
PRINT '📊 Résumé:';
PRINT '  ✅ Table TabRoleFilterVisibility CRÉÉE';
PRINT '  ✅ Structure: (ProfileUser, ModuleCode, FilterKey, VisibleForRole)';
PRINT '  ✅ ~59 lignes covering TOUS les filtres de l''application';
PRINT '  ✅ STOCK (20) + RECLAMATION (21) + DEVIS (6) + BCV (6) + BLV (3) + FAV (3)';
PRINT '';
PRINT '🚀 La table est prête pour le backend (filterService) et frontend (useModuleFilters hook)!';
PRINT '';
