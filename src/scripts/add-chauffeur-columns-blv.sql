-- ============================================================
-- Migration : Ajout des colonnes chauffeur dans TabBlvm
-- Date     : 2026-04-23
-- Objectif : Stocker CodChauff (tél chauffeur) et DesChauff
--            (nom chauffeur) directement dans TabBlvm lors
--            de la transformation BC → BL.
-- ============================================================

-- 1. Ajouter la colonne CodChauff si elle n'existe pas encore
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'TabBlvm'
      AND COLUMN_NAME = 'CodChauff'
)
BEGIN
    ALTER TABLE TabBlvm
    ADD CodChauff NVARCHAR(20) NULL;

    PRINT '✅ Colonne CodChauff ajoutée à TabBlvm.';
END
ELSE
BEGIN
    PRINT '⚠️  Colonne CodChauff existe déjà dans TabBlvm — ignoré.';
END;

-- 2. Ajouter la colonne DesChauff si elle n'existe pas encore
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'TabBlvm'
      AND COLUMN_NAME = 'DesChauff'
)
BEGIN
    ALTER TABLE TabBlvm
    ADD DesChauff NVARCHAR(100) NULL;

    PRINT '✅ Colonne DesChauff ajoutée à TabBlvm.';
END
ELSE
BEGIN
    PRINT '⚠️  Colonne DesChauff existe déjà dans TabBlvm — ignoré.';
END;

-- 3. Vérification finale
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'TabBlvm'
  AND COLUMN_NAME IN ('CodChauff', 'DesChauff');

PRINT '✅ Migration terminée.';
