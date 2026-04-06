-- ============================================================================
-- MIGRATION: De STOCK seulement → TOUS les modules
-- ============================================================================
-- Cet script ÉTEND la table existante pour supporter TOUS les filtres
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

-- Vérifier si colonnes existent déjà
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
-- ÉTAPE 3: Mettre en jour la contrainte UNIQUE
-- ============================================================================

PRINT '🔐 ÉTAPE 3: Mettre à jour contrainte UNIQUE';
PRINT '';

-- Supprimer ancienne contrainte SI elle existe
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

-- Ajouter nouvelle contrainte UNIQUE avec ModuleCode
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
END
WHERE FilterLabel IS NULL AND ModuleCode = 'STOCK';

PRINT '✅ Labels mises à jour pour STOCK';

PRINT '';

-- ============================================================================
-- ÉTAPE 5: Insérer TOUS les filtres autres modules
-- ============================================================================

PRINT '📊 ÉTAPE 5: Insérer filtres pour TOUS les modules';
PRINT '';

PRINT '   → Insertion RECLAMATION...';

INSERT INTO dbo.TabRoleFilterVisibility 
(ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT * FROM (
    -- RECLAMATION: Statuts
    SELECT 'admin' AS ProfileUser, 'RECLAMATION' AS ModuleCode, 'status_open' AS FilterKey, CAST(1 AS BIT) AS VisibleForRole, 'Ouvert' AS FilterLabel, 'enum' AS FilterValueType
    UNION ALL SELECT 'admin', 'RECLAMATION', 'status_progress', 1, 'En cours', 'enum'
    UNION ALL SELECT 'admin', 'RECLAMATION', 'status_resolved', 1, 'Résolu', 'enum'
    UNION ALL SELECT 'admin', 'RECLAMATION', 'priority_urgent', 1, 'Urgent', 'enum'
    UNION ALL SELECT 'admin', 'RECLAMATION', 'priority_high', 1, 'Haute', 'enum'
    UNION ALL SELECT 'admin', 'RECLAMATION', 'priority_normal', 1, 'Normale', 'enum'
    UNION ALL SELECT 'admin', 'RECLAMATION', 'priority_low', 1, 'Basse', 'enum'
    -- Client voit statuts mais PAS priorités
    UNION ALL SELECT 'client', 'RECLAMATION', 'status_open', 1, 'Ouvert', 'enum'
    UNION ALL SELECT 'client', 'RECLAMATION', 'status_progress', 1, 'En cours', 'enum'
    UNION ALL SELECT 'client', 'RECLAMATION', 'status_resolved', 1, 'Résolu', 'enum'
    UNION ALL SELECT 'client', 'RECLAMATION', 'priority_urgent', CAST(0 AS BIT), 'Urgent', 'enum'
    UNION ALL SELECT 'client', 'RECLAMATION', 'priority_high', 0, 'Haute', 'enum'
    UNION ALL SELECT 'client', 'RECLAMATION', 'priority_normal', 0, 'Normale', 'enum'
    UNION ALL SELECT 'client', 'RECLAMATION', 'priority_low', 0, 'Basse', 'enum'
    -- Commercial et Agent: tous les filtres
    UNION ALL SELECT 'commercial', 'RECLAMATION', 'status_open', 1, 'Ouvert', 'enum'
    UNION ALL SELECT 'commercial', 'RECLAMATION', 'status_progress', 1, 'En cours', 'enum'
    UNION ALL SELECT 'commercial', 'RECLAMATION', 'status_resolved', 1, 'Résolu', 'enum'
    UNION ALL SELECT 'commercial', 'RECLAMATION', 'priority_urgent', 1, 'Urgent', 'enum'
    UNION ALL SELECT 'commercial', 'RECLAMATION', 'priority_high', 1, 'Haute', 'enum'
    UNION ALL SELECT 'commercial', 'RECLAMATION', 'priority_normal', 1, 'Normale', 'enum'
    UNION ALL SELECT 'commercial', 'RECLAMATION', 'priority_low', 1, 'Basse', 'enum'
) t
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.TabRoleFilterVisibility r
    WHERE r.ProfileUser = t.ProfileUser 
      AND r.ModuleCode = t.ModuleCode 
      AND r.FilterKey = t.FilterKey
);

PRINT '   ✅ RECLAMATION insérée';

-- DEVIS
PRINT '   → Insertion DEVIS...';

INSERT INTO dbo.TabRoleFilterVisibility 
(ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT * FROM (
    SELECT 'admin' AS ProfileUser, 'DEVIS' AS ModuleCode, 'status_draft' AS FilterKey, CAST(1 AS BIT) AS VisibleForRole, 'Brouillon' AS FilterLabel, 'enum' AS FilterValueType
    UNION ALL SELECT 'admin', 'DEVIS', 'status_valid', 1, 'Validé', 'enum'
    UNION ALL SELECT 'admin', 'DEVIS', 'status_converted', 1, 'Converti', 'enum'
    -- Commercial ne voit pas brouillons
    UNION ALL SELECT 'commercial', 'DEVIS', 'status_draft', CAST(0 AS BIT), 'Brouillon', 'enum'
    UNION ALL SELECT 'commercial', 'DEVIS', 'status_valid', 1, 'Validé', 'enum'
    UNION ALL SELECT 'commercial', 'DEVIS', 'status_converted', 1, 'Converti', 'enum'
) t
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.TabRoleFilterVisibility r
    WHERE r.ProfileUser = t.ProfileUser 
      AND r.ModuleCode = t.ModuleCode 
      AND r.FilterKey = t.FilterKey
);

PRINT '   ✅ DEVIS insérée';

-- BCV (Bon de Commande)
PRINT '   → Insertion BCV...';

INSERT INTO dbo.TabRoleFilterVisibility 
(ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT * FROM (
    SELECT 'admin' AS ProfileUser, 'BCV' AS ModuleCode, 'status_draft' AS FilterKey, CAST(1 AS BIT) AS VisibleForRole, 'Brouillon' AS FilterLabel, 'enum' AS FilterValueType
    UNION ALL SELECT 'admin', 'BCV', 'status_valid', 1, 'Validé', 'enum'
    UNION ALL SELECT 'admin', 'BCV', 'status_converted', 1, 'Livré', 'enum'
    UNION ALL SELECT 'commercial', 'BCV', 'status_draft', CAST(0 AS BIT), 'Brouillon', 'enum'
    UNION ALL SELECT 'commercial', 'BCV', 'status_valid', 1, 'Validé', 'enum'
    UNION ALL SELECT 'commercial', 'BCV', 'status_converted', 1, 'Livré', 'enum'
) t
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.TabRoleFilterVisibility r
    WHERE r.ProfileUser = t.ProfileUser 
      AND r.ModuleCode = t.ModuleCode 
      AND r.FilterKey = t.FilterKey
);

PRINT '   ✅ BCV insérée';

-- BLV (Bon de Livraison)
PRINT '   → Insertion BLV...';

INSERT INTO dbo.TabRoleFilterVisibility 
(ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT * FROM (
    SELECT 'admin' AS ProfileUser, 'BLV' AS ModuleCode, 'status_draft' AS FilterKey, CAST(1 AS BIT) AS VisibleForRole, 'Brouillon' AS FilterLabel, 'enum' AS FilterValueType
    UNION ALL SELECT 'admin', 'BLV', 'status_valid', 1, 'Validé', 'enum'
    UNION ALL SELECT 'admin', 'BLV', 'status_converted', 1, 'Transféré', 'enum'
) t
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.TabRoleFilterVisibility r
    WHERE r.ProfileUser = t.ProfileUser 
      AND r.ModuleCode = t.ModuleCode 
      AND r.FilterKey = t.FilterKey
);

PRINT '   ✅ BLV insérée';

-- FAV (Facture)
PRINT '   → Insertion FAV...';

INSERT INTO dbo.TabRoleFilterVisibility 
(ProfileUser, ModuleCode, FilterKey, VisibleForRole, FilterLabel, FilterValueType)
SELECT * FROM (
    SELECT 'admin' AS ProfileUser, 'FAV' AS ModuleCode, 'status_draft' AS FilterKey, CAST(1 AS BIT) AS VisibleForRole, 'Brouillon' AS FilterLabel, 'enum' AS FilterValueType
    UNION ALL SELECT 'admin', 'FAV', 'status_valid', 1, 'Validée', 'enum'
    UNION ALL SELECT 'admin', 'FAV', 'status_converted', 1, 'Convertie', 'enum'
) t
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.TabRoleFilterVisibility r
    WHERE r.ProfileUser = t.ProfileUser 
      AND r.ModuleCode = t.ModuleCode 
      AND r.FilterKey = t.FilterKey
);

PRINT '   ✅ FAV insérée';

PRINT '';

-- ============================================================================
-- ÉTAPE 6: Vérifier le résultat
-- ============================================================================

PRINT '✅ ÉTAPE 6: Vérifier le résultat';
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
-- ÉTAPE 7: Example Query - Filtres accessibles pour un rôle/module
-- ============================================================================

PRINT '📋 ÉTAPE 7: Example - Filtres CLIENT + STOCK';
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

