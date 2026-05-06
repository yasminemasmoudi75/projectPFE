-- ========================================================================
-- Migration SQL: ajouter uniquement les colonnes nécessaires à Objectif
-- ========================================================================
-- Date: 04/05/2026
-- Description:
--   Cette migration ne crée pas de nouvelle base, ne crée pas de table,
--   et ne touche qu'à la table existante Objectif via ALTER TABLE.
-- ========================================================================

-- ========================================================================
-- ÉTAPE 1: Modifier table Objectif
-- ========================================================================

-- Ajouter colonne StatutObjectif
IF NOT EXISTS (
  SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'Objectif' AND COLUMN_NAME = 'StatutObjectif'
)
BEGIN
  ALTER TABLE Objectif
  ADD StatutObjectif VARCHAR(30) NOT NULL DEFAULT 'ACTIF';
  PRINT '✅ Colonne StatutObjectif ajoutée';
END
ELSE
BEGIN
  PRINT 'ℹ️  Colonne StatutObjectif existe déjà';
END

-- Ajouter colonne DateClotureAdmin
IF NOT EXISTS (
  SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'Objectif' AND COLUMN_NAME = 'DateClotureAdmin'
)
BEGIN
  ALTER TABLE Objectif
  ADD DateClotureAdmin DATETIME NULL;
  PRINT '✅ Colonne DateClotureAdmin ajoutée';
END
ELSE
BEGIN
  PRINT 'ℹ️  Colonne DateClotureAdmin existe déjà';
END

-- Ajouter colonne IdUtilisateurClotureAdmin
IF NOT EXISTS (
  SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'Objectif' AND COLUMN_NAME = 'IdUtilisateurClotureAdmin'
)
BEGIN
  ALTER TABLE Objectif
  ADD IdUtilisateurClotureAdmin INT NULL;
  PRINT '✅ Colonne IdUtilisateurClotureAdmin ajoutée';
END
ELSE
BEGIN
  PRINT 'ℹ️  Colonne IdUtilisateurClotureAdmin existe déjà';
END

-- Ajouter colonne NombreReglementsLies
IF NOT EXISTS (
  SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'Objectif' AND COLUMN_NAME = 'NombreReglementsLies'
)
BEGIN
  ALTER TABLE Objectif
  ADD NombreReglementsLies INT NOT NULL DEFAULT 0;
  PRINT '✅ Colonne NombreReglementsLies ajoutée';
END
ELSE
BEGIN
  PRINT 'ℹ️  Colonne NombreReglementsLies existe déjà';
END

PRINT '';
PRINT '====================================================';
PRINT '✅ MIGRATION TERMINÉE: colonnes Objectif ajoutées';
PRINT '====================================================';
