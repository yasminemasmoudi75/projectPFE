-- ===================================================================
-- SCRIPT SQL: Ajouter données TEST pour Réglement
-- ===================================================================
-- Version robuste:
-- - Utilise Raisoc au lieu de Name
-- - N'écrit pas dans la colonne calculée Solde
-- - Capture l'ID auto-incrémenté avec OUTPUT inserted.IDReg
-- ===================================================================

USE AA;
GO

SET NOCOUNT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @CreatedBy NVARCHAR(255) = N'admin@test.com';
    DECLARE @RegIdIsGuid BIT = CASE
        WHEN EXISTS (
            SELECT 1
            FROM sys.columns c
            INNER JOIN sys.types t ON t.user_type_id = c.user_type_id
            WHERE c.object_id = OBJECT_ID('dbo.TabReg')
              AND c.name = 'IDReg'
              AND t.name = 'uniqueidentifier'
        ) THEN 1 ELSE 0 END;

    DECLARE @Clients TABLE (
        rn INT IDENTITY(1,1),
        CodTiers NVARCHAR(50),
        LibTiers NVARCHAR(255)
    );

    INSERT INTO @Clients (CodTiers, LibTiers)
    SELECT TOP (3)
        CONVERT(NVARCHAR(50), CodTiers),
        COALESCE(Raisoc, CONVERT(NVARCHAR(255), CodTiers))
    FROM TabTiers
    WHERE CodTiers IS NOT NULL
    ORDER BY CONVERT(NVARCHAR(50), CodTiers);

    IF (SELECT COUNT(*) FROM @Clients) < 3
    BEGIN
        THROW 50010, 'Il faut au moins 3 clients dans TabTiers pour générer les données de test.', 1;
    END;

    DECLARE @CodTiers1 NVARCHAR(50), @LibTiers1 NVARCHAR(255);
    DECLARE @CodTiers2 NVARCHAR(50), @LibTiers2 NVARCHAR(255);
    DECLARE @CodTiers3 NVARCHAR(50), @LibTiers3 NVARCHAR(255);

    DECLARE @IDReg1Guid UNIQUEIDENTIFIER = NULL;
    DECLARE @IDReg2Guid UNIQUEIDENTIFIER = NULL;
    DECLARE @IDReg3Guid UNIQUEIDENTIFIER = NULL;
    DECLARE @IDReg1Int INT = NULL;
    DECLARE @IDReg2Int INT = NULL;
    DECLARE @IDReg3Int INT = NULL;

    SELECT @CodTiers1 = CodTiers, @LibTiers1 = LibTiers FROM @Clients WHERE rn = 1;
    SELECT @CodTiers2 = CodTiers, @LibTiers2 = LibTiers FROM @Clients WHERE rn = 2;
    SELECT @CodTiers3 = CodTiers, @LibTiers3 = LibTiers FROM @Clients WHERE rn = 3;

    -- 1) Non payé
    IF NOT EXISTS (SELECT 1 FROM TabReg WHERE CodTiers = @CodTiers1 AND MntReg = 5000)
    BEGIN
        IF @RegIdIsGuid = 1
        BEGIN
            SET @IDReg1Guid = NEWID();

            INSERT INTO TabReg (IDReg, DatReg, CodTiers, LibTiers, MntReg, Payed, CUser, DatUser)
            VALUES (@IDReg1Guid, GETDATE(), @CodTiers1, @LibTiers1, 5000.00, 0, @CreatedBy, GETDATE());

            INSERT INTO TabRegD (IDReg, ModReg, MntDebit, MntCredit, Banque, NumCompte, DatValeur, Montant)
            VALUES (@IDReg1Guid, N'Non encore reçu', 5000, 0, N'', N'', GETDATE(), 5000);
        END
        ELSE
        BEGIN
            INSERT INTO TabReg (DatReg, CodTiers, LibTiers, MntReg, Payed, CUser, DatUser)
            VALUES (GETDATE(), @CodTiers1, @LibTiers1, 5000.00, 0, @CreatedBy, GETDATE());

            SET @IDReg1Int = CONVERT(INT, SCOPE_IDENTITY());

            INSERT INTO TabRegD (IDReg, ModReg, MntDebit, MntCredit, Banque, NumCompte, DatValeur, Montant)
            VALUES (@IDReg1Int, N'Non encore reçu', 5000, 0, N'', N'', GETDATE(), 5000);
        END

        PRINT '✅ Réglement #1 (Non payé) créé';
    END;

    -- 2) Partiellement payé
    IF NOT EXISTS (SELECT 1 FROM TabReg WHERE CodTiers = @CodTiers2 AND MntReg = 10000)
    BEGIN
        IF @RegIdIsGuid = 1
        BEGIN
            SET @IDReg2Guid = NEWID();

            INSERT INTO TabReg (IDReg, DatReg, CodTiers, LibTiers, MntReg, Payed, CUser, DatUser)
            VALUES (@IDReg2Guid, GETDATE(), @CodTiers2, @LibTiers2, 10000.00, 0, @CreatedBy, GETDATE());

            INSERT INTO TabRegD (IDReg, ModReg, MntDebit, MntCredit, Banque, NumCompte, DatValeur, Montant)
            VALUES (@IDReg2Guid, N'Virement partiel', 10000, 6000, N'BNP Paribas', N'FR12 3456 7890', GETDATE(), 10000);

            INSERT INTO TabRegF (IDReg, NumPiece, MDate, MntPiece, MntReg, TypPiece)
            VALUES (@IDReg2Guid, N'FAV-2024-001', GETDATE(), 10000, 10000, N'Facture');
        END
        ELSE
        BEGIN
            INSERT INTO TabReg (DatReg, CodTiers, LibTiers, MntReg, Payed, CUser, DatUser)
            VALUES (GETDATE(), @CodTiers2, @LibTiers2, 10000.00, 0, @CreatedBy, GETDATE());

            SET @IDReg2Int = CONVERT(INT, SCOPE_IDENTITY());

            INSERT INTO TabRegD (IDReg, ModReg, MntDebit, MntCredit, Banque, NumCompte, DatValeur, Montant)
            VALUES (@IDReg2Int, N'Virement partiel', 10000, 6000, N'BNP Paribas', N'FR12 3456 7890', GETDATE(), 10000);

            INSERT INTO TabRegF (IDReg, NumPiece, MDate, MntPiece, MntReg, TypPiece)
            VALUES (@IDReg2Int, N'FAV-2024-001', GETDATE(), 10000, 10000, N'Facture');
        END

        PRINT '✅ Réglement #2 (Partiellement payé 60%) créé';
    END;

    -- 3) Payé
    IF NOT EXISTS (SELECT 1 FROM TabReg WHERE CodTiers = @CodTiers3 AND MntReg = 3500)
    BEGIN
        IF @RegIdIsGuid = 1
        BEGIN
            SET @IDReg3Guid = NEWID();

            INSERT INTO TabReg (IDReg, DatReg, CodTiers, LibTiers, MntReg, Payed, CUser, DatUser)
            VALUES (@IDReg3Guid, GETDATE(), @CodTiers3, @LibTiers3, 3500.00, 1, @CreatedBy, GETDATE());

            INSERT INTO TabRegD (IDReg, ModReg, MntDebit, MntCredit, Banque, NumCompte, DatValeur, Montant)
            VALUES (@IDReg3Guid, N'Virement complet', 3500, 3500, N'Crédit Agricole', N'FR34 5678 9012', GETDATE(), 3500);

            INSERT INTO TabRegF (IDReg, NumPiece, MDate, MntPiece, MntReg, TypPiece)
            VALUES (@IDReg3Guid, N'FAV-2024-002', GETDATE(), 3500, 3500, N'Facture');
        END
        ELSE
        BEGIN
            INSERT INTO TabReg (DatReg, CodTiers, LibTiers, MntReg, Payed, CUser, DatUser)
            VALUES (GETDATE(), @CodTiers3, @LibTiers3, 3500.00, 1, @CreatedBy, GETDATE());

            SET @IDReg3Int = CONVERT(INT, SCOPE_IDENTITY());

            INSERT INTO TabRegD (IDReg, ModReg, MntDebit, MntCredit, Banque, NumCompte, DatValeur, Montant)
            VALUES (@IDReg3Int, N'Virement complet', 3500, 3500, N'Crédit Agricole', N'FR34 5678 9012', GETDATE(), 3500);

            INSERT INTO TabRegF (IDReg, NumPiece, MDate, MntPiece, MntReg, TypPiece)
            VALUES (@IDReg3Int, N'FAV-2024-002', GETDATE(), 3500, 3500, N'Facture');
        END

        PRINT '✅ Réglement #3 (Payé 100%) créé';
    END;

    COMMIT TRANSACTION;

    -- =================================================================
    -- VÉRIFICATION
    -- =================================================================
    PRINT '';
    PRINT '📊 RÉGLEMENT DE TEST CRÉÉS:';
    PRINT '═══════════════════════════════════════════════════════════';

    SELECT
        IDReg,
        DatReg,
        LibTiers,
        MntReg AS [Montant Total],
        CASE WHEN Payed = 1 THEN 'Payé ✅' ELSE 'Non payé ❌' END AS [Statut],
        CUser,
        DatUser
    FROM TabReg
    WHERE CUser = @CreatedBy
      AND DatUser >= DATEADD(MINUTE, -10, GETDATE())
    ORDER BY IDReg DESC;

    PRINT '';
    PRINT '💳 DÉTAILS DES PAIEMENTS:';
    PRINT '═══════════════════════════════════════════════════════════';

    SELECT
        d.IDReg,
        d.MntDebit AS [Montant débité],
        d.MntCredit AS [Montant crédité],
        (d.MntDebit - d.MntCredit) AS [Solde restant],
        CAST(ROUND((d.MntCredit * 100.0 / NULLIF(d.MntDebit, 0)), 0) AS INT) AS [Pourcentage %],
        d.ModReg,
        d.DatValeur
    FROM TabRegD d
    INNER JOIN TabReg r ON d.IDReg = r.IDReg
    WHERE r.CUser = @CreatedBy
    ORDER BY d.IDReg DESC;

    PRINT '';
    PRINT '🎯 PIÈCES RATTACHÉES:';
    PRINT '═══════════════════════════════════════════════════════════';

    SELECT
        f.IDReg,
        f.NumPiece,
        f.MntPiece,
        f.MntReg,
        f.TypPiece
    FROM TabRegF f
    INNER JOIN TabReg r ON f.IDReg = r.IDReg
    WHERE r.CUser = @CreatedBy
    ORDER BY f.IDReg DESC;

    PRINT '';
    PRINT '✨ Pour afficher vos réglement en frontend:';
    PRINT '   → Allez à /reglements (après login)';
    PRINT '   → Vous verrez les 3 réglement de test';
    PRINT '';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
