-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION: Add Gmail sync cursor fields and dedup index
-- ═══════════════════════════════════════════════════════════════════════
-- Exécute ce script sur la BD AmsLabOrigin pour rendre la synchro Gmail incrémentale et sans doublons

USE AmsLabOrigin
GO

-- Ajouter LastHistoryId pour la synchro incrémentale Gmail
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='GmailOAuthTokens' AND COLUMN_NAME='LastHistoryId')
BEGIN
    ALTER TABLE GmailOAuthTokens ADD LastHistoryId NVARCHAR(50) NULL;
    PRINT '✅ Colonne LastHistoryId ajoutée';
END
ELSE
    PRINT '✓ Colonne LastHistoryId existe déjà';

-- Ajouter LastSyncAt pour suivre la dernière synchro Gmail
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='GmailOAuthTokens' AND COLUMN_NAME='LastSyncAt')
BEGIN
    ALTER TABLE GmailOAuthTokens ADD LastSyncAt DATETIME NULL;
    PRINT '✅ Colonne LastSyncAt ajoutée';
END
ELSE
    PRINT '✓ Colonne LastSyncAt existe déjà';

-- Nettoyer les doublons GmailMessageID existants avant de créer l'index unique
;WITH Duplicates AS (
    SELECT
        ID,
        ROW_NUMBER() OVER (PARTITION BY GmailMessageID ORDER BY ID) AS rn
    FROM MSGMessages
    WHERE GmailMessageID IS NOT NULL
)
DELETE FROM Duplicates
WHERE rn > 1;

-- Index filtré unique sur GmailMessageID pour éviter les doublons Gmail dans le module message
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='UX_MSGMessages_GmailMessageID_NotNull')
BEGIN
    CREATE UNIQUE INDEX UX_MSGMessages_GmailMessageID_NotNull
    ON MSGMessages(GmailMessageID)
    WHERE GmailMessageID IS NOT NULL;
    PRINT '✅ Index unique GmailMessageID créé';
END
ELSE
    PRINT '✓ Index GmailMessageID existe déjà';

PRINT '';
PRINT '═══════════════════════════════════════════════════════════════════';
PRINT '✅ Migration Gmail sync cursor complétée avec succès!';
PRINT '═══════════════════════════════════════════════════════════════════';
GO