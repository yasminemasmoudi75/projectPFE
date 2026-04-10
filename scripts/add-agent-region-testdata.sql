-- ===================================================================
-- SCRIPT SQL: Donnees de test Agent/Commercial par region
-- ===================================================================
-- Objectif:
-- 1) Renseigner UCS_USERS.Gouvernorat pour 1 agent + 4 commerciaux
-- 2) Affecter des clients (TabTiers) a ces commerciaux
-- 3) Aligner des devis (TabDevm.CodRepres) pour tester /devis
--
-- Ce script evite les IDs hardcodes et s'adapte aux donnees existantes.
-- ===================================================================

USE AA;
GO

SET NOCOUNT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF COL_LENGTH('dbo.UCS_USERS', 'Gouvernorat') IS NULL
    BEGIN
        THROW 50001, 'La colonne dbo.UCS_USERS.Gouvernorat est introuvable.', 1;
    END;

    IF COL_LENGTH('dbo.TabTiers', 'gouvernorat') IS NULL
    BEGIN
        THROW 50002, 'La colonne dbo.TabTiers.gouvernorat est introuvable.', 1;
    END;

    IF COL_LENGTH('dbo.TabTiers', 'codRepresTiers') IS NULL
    BEGIN
        THROW 50003, 'La colonne dbo.TabTiers.codRepresTiers est introuvable.', 1;
    END;

    IF COL_LENGTH('dbo.TabDevm', 'CodRepres') IS NULL
    BEGIN
        THROW 50004, 'La colonne dbo.TabDevm.CodRepres est introuvable.', 1;
    END;

    DECLARE @RegionTunis NVARCHAR(50) = N'Tunis';
    DECLARE @RegionSfax NVARCHAR(50) = N'Sfax';
    DECLARE @RegionSousse NVARCHAR(50) = N'Sousse';

    DECLARE @RegionTunisId INT;
    DECLARE @RegionSfaxId INT;
    DECLARE @RegionSousseId INT;

    SELECT @RegionTunisId = id FROM dbo.tiersGouvernorat WHERE libelle = @RegionTunis;
    SELECT @RegionSfaxId = id FROM dbo.tiersGouvernorat WHERE libelle = @RegionSfax;
    SELECT @RegionSousseId = id FROM dbo.tiersGouvernorat WHERE libelle = @RegionSousse;

    -- Fallback robuste si les libelles exacts n'existent pas dans la table.
    IF @RegionTunisId IS NULL
        SELECT TOP (1) @RegionTunisId = id FROM dbo.tiersGouvernorat ORDER BY id ASC;

    IF @RegionSfaxId IS NULL
        SELECT TOP (1) @RegionSfaxId = id FROM dbo.tiersGouvernorat WHERE id <> @RegionTunisId ORDER BY id ASC;

    IF @RegionSousseId IS NULL
        SELECT TOP (1) @RegionSousseId = id FROM dbo.tiersGouvernorat WHERE id NOT IN (@RegionTunisId, @RegionSfaxId) ORDER BY id ASC;

    IF @RegionTunisId IS NULL OR @RegionSfaxId IS NULL OR @RegionSousseId IS NULL
    BEGIN
        THROW 50005, 'La table tiersGouvernorat ne contient pas assez de regions pour le test.', 1;
    END;

    DECLARE @AgentUserId INT;
    DECLARE @Commercial1 INT;
    DECLARE @Commercial2 INT;
    DECLARE @Commercial3 INT;
    DECLARE @Commercial4 INT;

    ;WITH AgentPick AS (
        SELECT TOP (1) u.USER_ID
        FROM dbo.UCS_USERS u
        INNER JOIN dbo.UCS_USERINFO ui ON ui.USER_ID = u.USER_ID AND ui.APP_ID = 1
        INNER JOIN dbo.UCS_PROFILES p ON p.PROF_ID = ui.PROF_ID
        WHERE LOWER(p.PROF_DESCRIPTION) = 'agent'
        ORDER BY u.USER_ID ASC
    )
    SELECT @AgentUserId = USER_ID FROM AgentPick;

    ;WITH Commercials AS (
        SELECT TOP (4)
            u.USER_ID,
            ROW_NUMBER() OVER (ORDER BY u.USER_ID ASC) AS rn
        FROM dbo.UCS_USERS u
        INNER JOIN dbo.UCS_USERINFO ui ON ui.USER_ID = u.USER_ID AND ui.APP_ID = 1
        INNER JOIN dbo.UCS_PROFILES p ON p.PROF_ID = ui.PROF_ID
        WHERE LOWER(p.PROF_DESCRIPTION) IN ('commercial', 'commerciale')
        ORDER BY u.USER_ID ASC
    )
    SELECT
        @Commercial1 = MAX(CASE WHEN rn = 1 THEN USER_ID END),
        @Commercial2 = MAX(CASE WHEN rn = 2 THEN USER_ID END),
        @Commercial3 = MAX(CASE WHEN rn = 3 THEN USER_ID END),
        @Commercial4 = MAX(CASE WHEN rn = 4 THEN USER_ID END)
    FROM Commercials;

    IF @AgentUserId IS NULL
    BEGIN
        THROW 50006, 'Aucun utilisateur avec role Agent trouve dans UCS_PROFILES/UCS_USERINFO.', 1;
    END;

    IF @Commercial1 IS NULL OR @Commercial2 IS NULL OR @Commercial3 IS NULL OR @Commercial4 IS NULL
    BEGIN
        THROW 50007, 'Il faut au moins 4 commerciaux pour ce test regional.', 1;
    END;

    -- =================================================================
    -- 1) Regions sur les utilisateurs
    -- =================================================================
    UPDATE dbo.UCS_USERS
    SET Gouvernorat = @RegionTunis
    WHERE USER_ID = @AgentUserId;

    UPDATE dbo.UCS_USERS
    SET Gouvernorat = @RegionTunis
    WHERE USER_ID IN (@Commercial1, @Commercial2);

    UPDATE dbo.UCS_USERS
    SET Gouvernorat = @RegionSfax
    WHERE USER_ID = @Commercial3;

    UPDATE dbo.UCS_USERS
    SET Gouvernorat = @RegionSousse
    WHERE USER_ID = @Commercial4;

    -- =================================================================
    -- 2) Affectation clients (4 clients de test)
    -- =================================================================
    ;WITH DemoClients AS (
        SELECT TOP (4)
            t.IDTiers,
            ROW_NUMBER() OVER (ORDER BY t.CodTiers ASC) AS rn
        FROM dbo.TabTiers t
        WHERE t.CodTiers IS NOT NULL
        ORDER BY t.CodTiers ASC
    )
    UPDATE t
    SET
        t.codRepresTiers = CASE dc.rn
            WHEN 1 THEN CONVERT(NVARCHAR(50), @Commercial1)
            WHEN 2 THEN CONVERT(NVARCHAR(50), @Commercial2)
            WHEN 3 THEN CONVERT(NVARCHAR(50), @Commercial3)
            WHEN 4 THEN CONVERT(NVARCHAR(50), @Commercial4)
        END,
        t.gouvernorat = CASE dc.rn
            WHEN 1 THEN @RegionTunisId
            WHEN 2 THEN @RegionTunisId
            WHEN 3 THEN @RegionSfaxId
            WHEN 4 THEN @RegionSousseId
        END
    FROM dbo.TabTiers t
    INNER JOIN DemoClients dc ON dc.IDTiers = t.IDTiers;

    -- =================================================================
    -- 3) Aligner les devis sur le commercial du client
    -- =================================================================
    UPDATE d
    SET d.CodRepres = CONVERT(NVARCHAR(50), t.codRepresTiers)
    FROM dbo.TabDevm d
    INNER JOIN dbo.TabTiers t ON t.CodTiers = d.CodTiers
    WHERE t.codRepresTiers IS NOT NULL
      AND (d.CodRepres IS NULL OR LTRIM(RTRIM(CONVERT(NVARCHAR(50), d.CodRepres))) <> LTRIM(RTRIM(CONVERT(NVARCHAR(50), t.codRepresTiers))));

    COMMIT TRANSACTION;

    -- =================================================================
    -- Verification
    -- =================================================================
    PRINT '=== USERS WITH REGION TEST DATA ===';
    SELECT
        USER_ID,
        USER_NAME,
        REAL_NAME,
        Gouvernorat
    FROM dbo.UCS_USERS
    WHERE USER_ID IN (@AgentUserId, @Commercial1, @Commercial2, @Commercial3, @Commercial4)
    ORDER BY USER_ID;

    PRINT '=== CLIENTS AFFECTES POUR TEST REGION ===';
    SELECT TOP (20)
        t.CodTiers,
        t.Raisoc,
        t.codRepresTiers,
        t.gouvernorat,
        g.libelle AS LibelleGouvernorat
    FROM dbo.TabTiers t
    LEFT JOIN dbo.tiersGouvernorat g ON g.id = t.gouvernorat
    WHERE t.codRepresTiers IN (
        CONVERT(NVARCHAR(50), @Commercial1),
        CONVERT(NVARCHAR(50), @Commercial2),
        CONVERT(NVARCHAR(50), @Commercial3),
        CONVERT(NVARCHAR(50), @Commercial4)
    )
    ORDER BY t.CodTiers;

    PRINT '=== DEVIS AFFECTES (CONTROLE FILTRE MODULE DEVIS) ===';
    SELECT TOP (20)
        d.Nf,
        d.CodTiers,
        d.LibTiers,
        d.CodRepres,
        d.DatUser
    FROM dbo.TabDevm d
    WHERE d.CodRepres IN (
        CONVERT(NVARCHAR(50), @Commercial1),
        CONVERT(NVARCHAR(50), @Commercial2),
        CONVERT(NVARCHAR(50), @Commercial3),
        CONVERT(NVARCHAR(50), @Commercial4)
    )
    ORDER BY d.Nf DESC;

    PRINT '';
    PRINT '=== COMMENT TESTER ===';
    PRINT '1) Mettre FiltreRepres=1 sur module 4 (Devis) pour role Agent dans TabAWProfileAccess';
    PRINT '2) Login avec le compte agent ci-dessus';
    PRINT '3) Ouvrir /devis: tu dois voir seulement les devis des commerciaux de sa region';
    PRINT '4) Ouvrir filtre Commercial dans /devis: la liste est limitee a cette region';
    PRINT '5) Passer FiltreRepres a 0 puis re-tester pour voir tous les commerciaux';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
