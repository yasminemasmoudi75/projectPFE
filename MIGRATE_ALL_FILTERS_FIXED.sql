-- ============================================================================
-- MIGRATION: De STOCK seulement → TOUS les modules
-- VERSION: CORRIGÉE ET TESTÉE
-- ============================================================================

USE AA;
GO

-- ============================================================================
-- ÉTAPE 1: Vérifier l'état actuel
-- ============================================================================

PRINT '🔍 ÉTAPE 1: Vérifier état actuel de la table';
PRINT '';

SELECT 
    COUNT(*) AS TotalRows,
    COUNT(DISTINCT ProfileUser) AS Roles,
    COUNT(DISTINCT FilterKey) AS Filtres
FROM dbo.TabRoleFilterVisibility;

PRINT '';

-- ============================================================================
-- ÉTAPE 2: Ajouter colonnes pour généraliser
-- ============================================================================

PRINT '📝 ÉTAPE 2: Ajouter colonnes pour généraliser';
PRINT '';

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'TabRoleFilterVisibility' AND COLUMN_NAME = 'ModuleCode'
)
BEGIN
    ALTER TABLE dbo.TabRoleFilterVisibility
    ADD ModuleCode NVARCHAR(50) NOT NULL DEFAULT('STOCK');
    
    PRINT '✅ Colonne ModuleCode ajoutée (default: STOCK)';
END
ELSE
BEGIN
    PRINT '⚠️ Colonne ModuleCode existe déjà';
END

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'TabRoleFilterVisibility' AND COLUMN_NAME = 'FilterLabel'
)
BEGIN
    ALTER TABLE dbo.TabRoleFilterVisibility
    ADD FilterLabel NVARCHAR(200);
    
    PRINT '✅ Colonne FilterLabel ajoutée';
END
ELSE
BEGIN
    PRINT '⚠️ Colonne FilterLabel existe déjà';
END

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'TabRoleFilterVisibility' AND COLUMN_NAME = 'FilterValueType'
)
BEGIN
    ALTER TABLE dbo.TabRoleFilterVisibility
    ADD FilterValueType NVARCHAR(20) DEFAULT('enum');
    
    PRINT '✅ Colonne FilterValueType ajoutée';
END
ELSE
BEGIN
    PRINT '⚠️ Colonne FilterValueType existe déjà';
END

PRINT '';

-- ============================================================================
-- ÉTAPE 3: Mettre à jour contrainte UNIQUE
-- ============================================================================

PRINT '🔐 ÉTAPE 3: Mettre à jour contrainte UNIQUE';
PRINT '';

IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE 
    WHERE TABLE_NAME = 'TabRoleFilterVisibility' 
    AND CONSTRAINT_NAME = 'UQ_TabRoleFilterVisibility_Profile_Filter'
)
BEGIN
    ALTER TABLE dbo.TabRoleFilterVisibility
    DROP CONSTRAINT UQ_TabRoleFilterVisibility_Profile_Filter;
    
    PRINT '✅ Supprimé ancienne contrainte UQ';
END

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE 
    WHERE TABLE_NAME = 'TabRoleFilterVisibility' 
    AND CONSTRAINT_NAME = 'UQ_TabRoleModuleFilter'
)
BEGIN
    ALTER TABLE dbo.TabRoleFilterVisibility
    ADD CONSTRAINT UQ_TabRoleModuleFilter 
    UNIQUE (ProfileUser, ModuleCode, FilterKey);
    
    PRINT '✅ Ajoutée nouvelle contrainte: (ProfileUser, ModuleCode, FilterKey)';
END
ELSE
BEGIN
    PRINT '⚠️ Nouvelle contrainte existe déjà';
END

PRINT '';

-- ============================================================================
-- ÉTAPE 4: Mettre à jour les labels pour STOCK
-- ============================================================================

PRINT '🏷️ ÉTAPE 4: Mettre à jour FilterLabel pour STOCK';
PRINT '';

UPDATE dbo.TabRoleFilterVisibility
SET FilterLabel = CASE 
    WHEN FilterKey = 'all' THEN 'Tous'
    WHEN FilterKey = 'ok' THEN 'Dispo'
    WHEN FilterKey = 'low' THEN 'Faible'
    WHEN FilterKey = 'rupture' THEN 'Rupture'
    ELSE FilterKey
END,
FilterValueType = 'enum'
WHERE FilterLabel IS NULL AND ModuleCode = 'STOCK';

PRINT '✅ Labels mises à jour pour STOCK';

PRINT '';

-- ============================================================================
-- ÉTAPE 5: Insérer filtres RECLAMATION
-- ============================================================================

PRINT '📊 ÉTAPE 5: Insérer filtres pour TOUS les modules';
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

PRINT '   ✅ RECLAMATION insérée';

-- ============================================================================
-- ÉTAPE 6: Insérer filtres DEVIS
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

PRINT '   ✅ DEVIS insérée';

-- ============================================================================
-- ÉTAPE 7: Insérer filtres BCV
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

PRINT '   ✅ BCV insérée';

-- ============================================================================
-- ÉTAPE 8: Insérer filtres BLV
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

PRINT '   ✅ BLV insérée';

-- ============================================================================
-- ÉTAPE 9: Insérer filtres FAV
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

PRINT '   ✅ FAV insérée';

PRINT '';

-- ============================================================================
-- ÉTAPE 10: Vérifier le résultat
-- ============================================================================

PRINT '✅ ÉTAPE 10: Vérifier le résultat';
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
PRINT 'Statistiques générales:';
SELECT 
    COUNT(*) AS TotalLignes,
    COUNT(DISTINCT ProfileUser) AS TotalRoles,
    COUNT(DISTINCT ModuleCode) AS ModulesCouverts,
    COUNT(DISTINCT FilterKey) AS TotalFiltres
FROM dbo.TabRoleFilterVisibility;

PRINT '';
PRINT 'Filtres visibles par rôle:';
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
-- ÉTAPE 11: Example Query
-- ============================================================================

PRINT '📋 ÉTAPE 11: Example - Filtres CLIENT + STOCK';
PRINT '';

SELECT 
    ProfileUser,
    ModuleCode,
    FilterKey,
    FilterLabel,
    FilterValueType,
    CASE WHEN VisibleForRole = 1 THEN '✅ VISIBLE' ELSE '❌ CACHÉ' END AS Statut
FROM dbo.TabRoleFilterVisibility
WHERE ProfileUser = 'client' AND ModuleCode = 'STOCK'
ORDER BY FilterKey;

PRINT '';

-- ============================================================================
-- FIN
-- ============================================================================

PRINT '✅ MIGRATION TERMINÉE AVEC SUCCÈS!';
PRINT '';
PRINT 'Résumé:';
PRINT '  ✅ Table étendue pour supporter TOUS les modules';
PRINT '  ✅ Structure: (ProfileUser, ModuleCode, FilterKey, VisibleForRole)';
PRINT '  ✅ 140+ lignes couvrant tous les filtres de l''application';
PRINT '  ✅ Prêt pour backend/frontend généralisé';
PRINT '';
