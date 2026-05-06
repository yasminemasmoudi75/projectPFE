-- Ajout des colonnes de profil à la table UCS_USERS
IF OBJECT_ID('dbo.UCS_USERS', 'U') IS NOT NULL
BEGIN
    -- Photo de profil
    IF COL_LENGTH('dbo.UCS_USERS', 'PhotoProfil') IS NULL
    BEGIN
        ALTER TABLE dbo.UCS_USERS ADD PhotoProfil NVARCHAR(500) NULL;
        PRINT '✅ Colonne PhotoProfil ajoutée';
    END

    -- Téléphone Professionnel
    IF COL_LENGTH('dbo.UCS_USERS', 'TelPro') IS NULL
    BEGIN
        ALTER TABLE dbo.UCS_USERS ADD TelPro NVARCHAR(50) NULL;
        PRINT '✅ Colonne TelPro ajoutée';
    END

    -- Poste Occupé
    IF COL_LENGTH('dbo.UCS_USERS', 'PosteOccupe') IS NULL
    BEGIN
        ALTER TABLE dbo.UCS_USERS ADD PosteOccupe NVARCHAR(100) NULL;
        PRINT '✅ Colonne PosteOccupe ajoutée';
    END

    -- Département
    IF COL_LENGTH('dbo.UCS_USERS', 'Departement') IS NULL
    BEGIN
        ALTER TABLE dbo.UCS_USERS ADD Departement NVARCHAR(100) NULL;
        PRINT '✅ Colonne Departement ajoutée';
    END

    -- Date de Naissance
    IF COL_LENGTH('dbo.UCS_USERS', 'DateNaissance') IS NULL
    BEGIN
        ALTER TABLE dbo.UCS_USERS ADD DateNaissance DATETIME NULL;
        PRINT '✅ Colonne DateNaissance ajoutée';
    END
END
ELSE
BEGIN
    PRINT '❌ Table UCS_USERS non trouvée';
END
