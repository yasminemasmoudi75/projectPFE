-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION: Add Gmail Integration Columns to MSGMessages
-- ═══════════════════════════════════════════════════════════════════════
-- Exécute ce script sur la BD AmsLabOrigin pour ajouter les colonnes manquantes

USE AmsLabOrigin
GO

-- Vérifier et ajouter la colonne Subject
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='MSGMessages' AND COLUMN_NAME='Subject')
BEGIN
    ALTER TABLE MSGMessages ADD Subject NVARCHAR(500) NULL;
    PRINT '✅ Colonne Subject ajoutée';
END
ELSE
    PRINT '✓ Colonne Subject existe déjà';

-- Vérifier et ajouter la colonne StatusRead (Is message read?)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='MSGMessages' AND COLUMN_NAME='StatusRead')
BEGIN
    ALTER TABLE MSGMessages ADD StatusRead BIT DEFAULT 0 NULL;
    PRINT '✅ Colonne StatusRead ajoutée';
END
ELSE
    PRINT '✓ Colonne StatusRead existe déjà';

-- Vérifier et ajouter la colonne Priority
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='MSGMessages' AND COLUMN_NAME='Priority')
BEGIN
    ALTER TABLE MSGMessages ADD Priority SMALLINT DEFAULT 1 NULL;
    PRINT '✅ Colonne Priority ajoutée';
END
ELSE
    PRINT '✓ Colonne Priority existe déjà';

-- Vérifier et ajouter la colonne GmailMessageID (pour synchronisation Gmail)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='MSGMessages' AND COLUMN_NAME='GmailMessageID')
BEGIN
    ALTER TABLE MSGMessages ADD GmailMessageID NVARCHAR(MAX) NULL;
    PRINT '✅ Colonne GmailMessageID ajoutée';
END
ELSE
    PRINT '✓ Colonne GmailMessageID existe déjà';

-- Vérifier et ajouter la colonne SyncedWithGmail (synchronisation status)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='MSGMessages' AND COLUMN_NAME='SyncedWithGmail')
BEGIN
    ALTER TABLE MSGMessages ADD SyncedWithGmail BIT DEFAULT 0 NULL;
    PRINT '✅ Colonne SyncedWithGmail ajoutée';
END
ELSE
    PRINT '✓ Colonne SyncedWithGmail existe déjà';

-- Ajouter des indexes pour la performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_MSGMessages_StatusRead')
BEGIN
    CREATE INDEX IX_MSGMessages_StatusRead ON MSGMessages(StatusRead);
    PRINT '✅ Index StatusRead créé';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_MSGMessages_SenderID_RecipientID')
BEGIN
    CREATE INDEX IX_MSGMessages_SenderID_RecipientID ON MSGMessages(SenderID, RecipientID);
    PRINT '✅ Index SenderID_RecipientID créé';
END

PRINT '';
PRINT '═══════════════════════════════════════════════════════════════════';
PRINT '✅ Migration complétée avec succès!';
PRINT '═══════════════════════════════════════════════════════════════════';
GO
