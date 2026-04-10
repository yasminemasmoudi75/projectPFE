/*
  Database Understanding - Technician & Claims Focus (SQL Server)
  Safe: read-only queries only
  Optional: change @UserId and @TicketId
*/

USE AA;
GO

SET NOCOUNT ON;

DECLARE @UserId INT = 17;
DECLARE @TicketId INT = 10;

DECLARE @ClaimIdCol SYSNAME;
DECLARE @ClaimTicketCol SYSNAME;
DECLARE @ClaimTechIdCol SYSNAME;
DECLARE @ClaimTechNameCol SYSNAME;
DECLARE @ClaimStatusCol SYSNAME;
DECLARE @ClaimDateCol SYSNAME;
DECLARE @ClaimTiersCol SYSNAME;

DECLARE @TicketAdresseCol SYSNAME;
DECLARE @TicketVilleCol SYSNAME;
DECLARE @TicketPaysCol SYSNAME;
DECLARE @TicketCpCol SYSNAME;
DECLARE @TicketAdresseMapsCol SYSNAME;
DECLARE @TicketLatCol SYSNAME;
DECLARE @TicketLongCol SYSNAME;

DECLARE @TiersIdCol SYSNAME;
DECLARE @TiersAdresseCol SYSNAME;
DECLARE @TiersVilleCol SYSNAME;
DECLARE @TiersPaysCol SYSNAME;
DECLARE @TiersCpCol SYSNAME;
DECLARE @TiersAdresseMapsCol SYSNAME;
DECLARE @TiersLatCol SYSNAME;
DECLARE @TiersLongCol SYSNAME;

DECLARE @Sql NVARCHAR(MAX);
DECLARE @FilterByTicket NVARCHAR(500) = N'';
DECLARE @TicketOverrideExpr NVARCHAR(MAX) = N'0=1';
DECLARE @ClaimLocationExpr NVARCHAR(MAX) = N'NULL';
DECLARE @TiersLocationExpr NVARCHAR(MAX) = N'NULL';

PRINT '===== A) CHECK REQUIRED TABLES =====';
SELECT
    t.name AS TableName,
    CASE WHEN t.object_id IS NULL THEN 0 ELSE 1 END AS ExistsFlag
FROM (VALUES ('UCS_USERS'), ('Sec_Users'), ('TabReclamation'), ('TabTiers')) x(name)
LEFT JOIN sys.tables t ON t.name = x.name;

IF OBJECT_ID('dbo.TabReclamation', 'U') IS NOT NULL
BEGIN
        SELECT @ClaimIdCol = c.name
        FROM sys.columns c
        WHERE c.object_id = OBJECT_ID('dbo.TabReclamation')
            AND c.name IN ('ID', 'Id', 'ReclamationID', 'ClaimID')
        ORDER BY CASE c.name
                WHEN 'ID' THEN 1
                WHEN 'Id' THEN 2
                WHEN 'ReclamationID' THEN 3
                WHEN 'ClaimID' THEN 4
                ELSE 99
        END;

        SELECT @ClaimTicketCol = c.name
        FROM sys.columns c
        WHERE c.object_id = OBJECT_ID('dbo.TabReclamation')
            AND c.name IN ('NumTicket', 'TicketNumber', 'TicketNo')
        ORDER BY CASE c.name
                WHEN 'NumTicket' THEN 1
                WHEN 'TicketNumber' THEN 2
                WHEN 'TicketNo' THEN 3
                ELSE 99
        END;

        SELECT @ClaimTechIdCol = c.name
        FROM sys.columns c
        WHERE c.object_id = OBJECT_ID('dbo.TabReclamation')
            AND c.name IN ('TechnicienID', 'TechnicianID', 'IdTechnicien', 'TechID')
        ORDER BY CASE c.name
                WHEN 'TechnicienID' THEN 1
                WHEN 'TechnicianID' THEN 2
                WHEN 'IdTechnicien' THEN 3
                WHEN 'TechID' THEN 4
                ELSE 99
        END;

        SELECT @ClaimTechNameCol = c.name
        FROM sys.columns c
        WHERE c.object_id = OBJECT_ID('dbo.TabReclamation')
            AND c.name IN ('NomTechnicien', 'TechnicianName', 'TechName')
        ORDER BY CASE c.name
                WHEN 'NomTechnicien' THEN 1
                WHEN 'TechnicianName' THEN 2
                WHEN 'TechName' THEN 3
                ELSE 99
        END;

        SELECT @ClaimStatusCol = c.name
        FROM sys.columns c
        WHERE c.object_id = OBJECT_ID('dbo.TabReclamation')
            AND c.name IN ('Statut', 'Status')
        ORDER BY CASE c.name
                WHEN 'Statut' THEN 1
                WHEN 'Status' THEN 2
                ELSE 99
        END;

        SELECT @ClaimDateCol = c.name
        FROM sys.columns c
        WHERE c.object_id = OBJECT_ID('dbo.TabReclamation')
            AND c.name IN ('DateReclamation', 'DateCreation', 'CreatedAt', 'CreatedDate')
        ORDER BY CASE c.name
                WHEN 'DateReclamation' THEN 1
                WHEN 'DateCreation' THEN 2
                WHEN 'CreatedAt' THEN 3
                WHEN 'CreatedDate' THEN 4
                ELSE 99
        END;

        SELECT @ClaimTiersCol = c.name
        FROM sys.columns c
        WHERE c.object_id = OBJECT_ID('dbo.TabReclamation')
            AND c.name IN ('TiersID', 'TiersId', 'IdTiers', 'ClientID')
        ORDER BY CASE c.name
                WHEN 'TiersID' THEN 1
                WHEN 'TiersId' THEN 2
                WHEN 'IdTiers' THEN 3
                WHEN 'ClientID' THEN 4
                ELSE 99
        END;

        SELECT @TicketAdresseCol = c.name FROM sys.columns c WHERE c.object_id = OBJECT_ID('dbo.TabReclamation') AND c.name = 'TicketAdresse';
        SELECT @TicketVilleCol = c.name FROM sys.columns c WHERE c.object_id = OBJECT_ID('dbo.TabReclamation') AND c.name = 'TicketVille';
        SELECT @TicketPaysCol = c.name FROM sys.columns c WHERE c.object_id = OBJECT_ID('dbo.TabReclamation') AND c.name = 'TicketPays';
        SELECT @TicketCpCol = c.name FROM sys.columns c WHERE c.object_id = OBJECT_ID('dbo.TabReclamation') AND c.name = 'TicketCp';
        SELECT @TicketAdresseMapsCol = c.name FROM sys.columns c WHERE c.object_id = OBJECT_ID('dbo.TabReclamation') AND c.name = 'TicketAdresseMaps';
        SELECT @TicketLatCol = c.name FROM sys.columns c WHERE c.object_id = OBJECT_ID('dbo.TabReclamation') AND c.name = 'TicketLat';
        SELECT @TicketLongCol = c.name FROM sys.columns c WHERE c.object_id = OBJECT_ID('dbo.TabReclamation') AND c.name = 'TicketLong';
END;

IF OBJECT_ID('dbo.TabTiers', 'U') IS NOT NULL
BEGIN
        SELECT @TiersIdCol = c.name
        FROM sys.columns c
        WHERE c.object_id = OBJECT_ID('dbo.TabTiers')
            AND c.name IN ('ID', 'Id', 'TiersID', 'TiersId')
        ORDER BY CASE c.name
                WHEN 'ID' THEN 1
                WHEN 'Id' THEN 2
                WHEN 'TiersID' THEN 3
                WHEN 'TiersId' THEN 4
                ELSE 99
        END;

        SELECT @TiersAdresseCol = c.name FROM sys.columns c WHERE c.object_id = OBJECT_ID('dbo.TabTiers') AND c.name = 'Adresse';
        SELECT @TiersVilleCol = c.name FROM sys.columns c WHERE c.object_id = OBJECT_ID('dbo.TabTiers') AND c.name = 'Ville';
        SELECT @TiersPaysCol = c.name FROM sys.columns c WHERE c.object_id = OBJECT_ID('dbo.TabTiers') AND c.name = 'Pays';
        SELECT @TiersCpCol = c.name FROM sys.columns c WHERE c.object_id = OBJECT_ID('dbo.TabTiers') AND c.name = 'Cp';
        SELECT @TiersAdresseMapsCol = c.name FROM sys.columns c WHERE c.object_id = OBJECT_ID('dbo.TabTiers') AND c.name = 'AdresseMaps';
        SELECT @TiersLatCol = c.name FROM sys.columns c WHERE c.object_id = OBJECT_ID('dbo.TabTiers') AND c.name = 'lat';
        SELECT @TiersLongCol = c.name FROM sys.columns c WHERE c.object_id = OBJECT_ID('dbo.TabTiers') AND c.name = 'long';
END;

/* Fallback detection when exact names are not found */
IF OBJECT_ID('dbo.TabReclamation', 'U') IS NOT NULL AND @ClaimTiersCol IS NULL
BEGIN
    SELECT TOP 1 @ClaimTiersCol = c.name
    FROM sys.columns c
    WHERE c.object_id = OBJECT_ID('dbo.TabReclamation')
      AND (
          c.name LIKE '%Tiers%'
          OR c.name LIKE '%Client%'
          OR c.name LIKE '%Customer%'
      )
    ORDER BY CASE
        WHEN c.name IN ('IDTiers', 'IdTiers', 'Tiers', 'CodeTiers', 'TiersCode') THEN 1
        WHEN c.name IN ('ClientID', 'IdClient', 'CodeClient', 'CustomerID') THEN 2
        ELSE 99
    END,
    c.column_id;
END;

IF OBJECT_ID('dbo.TabTiers', 'U') IS NOT NULL AND @TiersIdCol IS NULL
BEGIN
    /* Prefer real primary key column of TabTiers */
    SELECT TOP 1 @TiersIdCol = c.name
    FROM sys.key_constraints kc
    INNER JOIN sys.index_columns ic ON ic.object_id = kc.parent_object_id
        AND ic.index_id = kc.unique_index_id
    INNER JOIN sys.columns c ON c.object_id = ic.object_id
        AND c.column_id = ic.column_id
    WHERE kc.parent_object_id = OBJECT_ID('dbo.TabTiers')
      AND kc.type = 'PK'
    ORDER BY ic.key_ordinal;
END;

IF OBJECT_ID('dbo.TabTiers', 'U') IS NOT NULL AND @TiersIdCol IS NULL
BEGIN
    SELECT TOP 1 @TiersIdCol = c.name
    FROM sys.columns c
    WHERE c.object_id = OBJECT_ID('dbo.TabTiers')
      AND (
          c.name LIKE '%ID%'
          OR c.name LIKE '%Code%'
          OR c.name LIKE '%Tiers%'
      )
    ORDER BY CASE
        WHEN c.name IN ('ID', 'Id', 'TiersID', 'IdTiers', 'IDTiers') THEN 1
        WHEN c.name IN ('CodeTiers', 'TiersCode', 'Code') THEN 2
        ELSE 99
    END,
    c.column_id;
END;

PRINT '===== A.1) DETECTED KEY COLUMNS =====';
SELECT
        @ClaimIdCol AS ClaimIdCol,
        @ClaimTicketCol AS ClaimTicketCol,
        @ClaimTechIdCol AS ClaimTechIdCol,
        @ClaimTechNameCol AS ClaimTechNameCol,
        @ClaimStatusCol AS ClaimStatusCol,
        @ClaimDateCol AS ClaimDateCol,
        @ClaimTiersCol AS ClaimTiersCol,
        @TiersIdCol AS TiersIdCol;

PRINT '===== A.2) POSSIBLE JOIN CANDIDATES =====';
SELECT
        c.name AS ReclamationCandidate,
        c.column_id AS ReclamationColumnOrder
FROM sys.columns c
WHERE c.object_id = OBJECT_ID('dbo.TabReclamation')
    AND (
            c.name LIKE '%Tiers%'
            OR c.name LIKE '%Client%'
            OR c.name LIKE '%Customer%'
    )
ORDER BY c.column_id;

SELECT
        c.name AS TiersCandidate,
        c.column_id AS TiersColumnOrder
FROM sys.columns c
WHERE c.object_id = OBJECT_ID('dbo.TabTiers')
    AND (
            c.name LIKE '%ID%'
            OR c.name LIKE '%Code%'
            OR c.name LIKE '%Tiers%'
    )
ORDER BY c.column_id;

PRINT '===== B) USER IN UCS_USERS =====';
IF OBJECT_ID('dbo.UCS_USERS', 'U') IS NOT NULL
BEGIN
    SELECT TOP 1 *
    FROM dbo.UCS_USERS
    WHERE USER_ID = @UserId;
END
ELSE
BEGIN
    SELECT 'Table dbo.UCS_USERS not found' AS Info;
END

PRINT '===== C) USER IN Sec_Users =====';
IF OBJECT_ID('dbo.Sec_Users', 'U') IS NOT NULL
BEGIN
    SELECT TOP 1 *
    FROM dbo.Sec_Users
    WHERE UserID = @UserId;
END
ELSE
BEGIN
    SELECT 'Table dbo.Sec_Users not found' AS Info;
END

PRINT '===== D) CLAIM ASSIGNMENTS FOR TECHNICIAN =====';
IF OBJECT_ID('dbo.TabReclamation', 'U') IS NOT NULL
BEGIN
    SET @Sql = N'SELECT TOP 100 '
        + CASE WHEN @ClaimIdCol IS NOT NULL THEN N'r.' + QUOTENAME(@ClaimIdCol) + N' AS ID' ELSE N'NULL AS ID' END + N', '
        + CASE WHEN @ClaimTicketCol IS NOT NULL THEN N'r.' + QUOTENAME(@ClaimTicketCol) + N' AS NumTicket' ELSE N'NULL AS NumTicket' END + N', '
        + CASE WHEN @ClaimTechIdCol IS NOT NULL THEN N'r.' + QUOTENAME(@ClaimTechIdCol) + N' AS TechnicienID' ELSE N'NULL AS TechnicienID' END + N', '
        + CASE WHEN @ClaimTechNameCol IS NOT NULL THEN N'r.' + QUOTENAME(@ClaimTechNameCol) + N' AS NomTechnicien' ELSE N'NULL AS NomTechnicien' END + N', '
        + CASE WHEN @ClaimStatusCol IS NOT NULL THEN N'r.' + QUOTENAME(@ClaimStatusCol) + N' AS Statut' ELSE N'NULL AS Statut' END + N', '
        + CASE WHEN @ClaimDateCol IS NOT NULL THEN N'r.' + QUOTENAME(@ClaimDateCol) + N' AS DateReclamation' ELSE N'NULL AS DateReclamation' END + N', '
        + CASE WHEN @ClaimTiersCol IS NOT NULL THEN N'r.' + QUOTENAME(@ClaimTiersCol) + N' AS TiersID' ELSE N'NULL AS TiersID' END + N'
FROM dbo.TabReclamation r
WHERE 1 = 1 ';

    IF @ClaimTechIdCol IS NOT NULL
        SET @Sql += N' AND r.' + QUOTENAME(@ClaimTechIdCol) + N' = @UserId';
    ELSE IF @ClaimTechNameCol IS NOT NULL
        SET @Sql += N' AND r.' + QUOTENAME(@ClaimTechNameCol) + N' IS NOT NULL';

    SET @Sql += N' ORDER BY '
        + CASE WHEN @ClaimIdCol IS NOT NULL THEN N'r.' + QUOTENAME(@ClaimIdCol) + N' DESC' ELSE N'(SELECT NULL)' END + N';';

    EXEC sp_executesql @Sql, N'@UserId INT', @UserId;
END
ELSE
BEGIN
    SELECT 'Table dbo.TabReclamation not found' AS Info;
END

PRINT '===== E) ONE TICKET DETAIL WITH LOCATION COLUMNS =====';
IF OBJECT_ID('dbo.TabReclamation', 'U') IS NOT NULL
BEGIN
    SET @FilterByTicket = N'';
    IF @ClaimIdCol IS NOT NULL
        SET @FilterByTicket = N' WHERE r.' + QUOTENAME(@ClaimIdCol) + N' = @TicketId';

    SET @Sql = N'SELECT TOP 1 '
        + CASE WHEN @ClaimIdCol IS NOT NULL THEN N'r.' + QUOTENAME(@ClaimIdCol) + N' AS ID' ELSE N'NULL AS ID' END + N', '
        + CASE WHEN @ClaimTicketCol IS NOT NULL THEN N'r.' + QUOTENAME(@ClaimTicketCol) + N' AS NumTicket' ELSE N'NULL AS NumTicket' END + N', '
        + CASE WHEN @ClaimTechIdCol IS NOT NULL THEN N'r.' + QUOTENAME(@ClaimTechIdCol) + N' AS TechnicienID' ELSE N'NULL AS TechnicienID' END + N', '
        + CASE WHEN @ClaimTechNameCol IS NOT NULL THEN N'r.' + QUOTENAME(@ClaimTechNameCol) + N' AS NomTechnicien' ELSE N'NULL AS NomTechnicien' END + N', '
        + CASE WHEN @ClaimStatusCol IS NOT NULL THEN N'r.' + QUOTENAME(@ClaimStatusCol) + N' AS Statut' ELSE N'NULL AS Statut' END + N', '
        + CASE WHEN @ClaimTiersCol IS NOT NULL THEN N'r.' + QUOTENAME(@ClaimTiersCol) + N' AS TiersID' ELSE N'NULL AS TiersID' END + N', '
        + CASE WHEN @TicketAdresseCol IS NOT NULL THEN N'r.' + QUOTENAME(@TicketAdresseCol) + N' AS TicketAdresse' ELSE N'NULL AS TicketAdresse' END + N', '
        + CASE WHEN @TicketVilleCol IS NOT NULL THEN N'r.' + QUOTENAME(@TicketVilleCol) + N' AS TicketVille' ELSE N'NULL AS TicketVille' END + N', '
        + CASE WHEN @TicketPaysCol IS NOT NULL THEN N'r.' + QUOTENAME(@TicketPaysCol) + N' AS TicketPays' ELSE N'NULL AS TicketPays' END + N', '
        + CASE WHEN @TicketCpCol IS NOT NULL THEN N'r.' + QUOTENAME(@TicketCpCol) + N' AS TicketCp' ELSE N'NULL AS TicketCp' END + N', '
        + CASE WHEN @TicketAdresseMapsCol IS NOT NULL THEN N'r.' + QUOTENAME(@TicketAdresseMapsCol) + N' AS TicketAdresseMaps' ELSE N'NULL AS TicketAdresseMaps' END + N', '
        + CASE WHEN @TicketLatCol IS NOT NULL THEN N'r.' + QUOTENAME(@TicketLatCol) + N' AS TicketLat' ELSE N'NULL AS TicketLat' END + N', '
        + CASE WHEN @TicketLongCol IS NOT NULL THEN N'r.' + QUOTENAME(@TicketLongCol) + N' AS TicketLong' ELSE N'NULL AS TicketLong' END + N'
FROM dbo.TabReclamation r' + @FilterByTicket + N';';

    EXEC sp_executesql @Sql, N'@TicketId INT', @TicketId;
END

PRINT '===== F) TICKET + TIERS JOIN (FALLBACK ADDRESS) =====';
IF OBJECT_ID('dbo.TabReclamation', 'U') IS NOT NULL
   AND OBJECT_ID('dbo.TabTiers', 'U') IS NOT NULL
BEGIN
    IF @ClaimTiersCol IS NULL OR @TiersIdCol IS NULL
    BEGIN
        SELECT 'Join impossible: missing claim/tiers key column' AS Info,
               @ClaimTiersCol AS ClaimTiersCol,
               @TiersIdCol AS TiersIdCol;
    END
    ELSE
    BEGIN
        SET @FilterByTicket = N'';
        IF @ClaimIdCol IS NOT NULL
            SET @FilterByTicket = N' WHERE r.' + QUOTENAME(@ClaimIdCol) + N' = @TicketId';

        IF @TicketAdresseCol IS NOT NULL SET @TicketOverrideExpr += N' OR r.' + QUOTENAME(@TicketAdresseCol) + N' IS NOT NULL';
        IF @TicketAdresseMapsCol IS NOT NULL SET @TicketOverrideExpr += N' OR r.' + QUOTENAME(@TicketAdresseMapsCol) + N' IS NOT NULL';
        IF @TicketLatCol IS NOT NULL SET @TicketOverrideExpr += N' OR r.' + QUOTENAME(@TicketLatCol) + N' IS NOT NULL';
        IF @TicketLongCol IS NOT NULL SET @TicketOverrideExpr += N' OR r.' + QUOTENAME(@TicketLongCol) + N' IS NOT NULL';

        SET @Sql = N'SELECT TOP 1 '
            + CASE WHEN @ClaimIdCol IS NOT NULL THEN N'r.' + QUOTENAME(@ClaimIdCol) + N' AS ID' ELSE N'NULL AS ID' END + N', '
            + CASE WHEN @ClaimTicketCol IS NOT NULL THEN N'r.' + QUOTENAME(@ClaimTicketCol) + N' AS NumTicket' ELSE N'NULL AS NumTicket' END + N', '
            + N'r.' + QUOTENAME(@ClaimTiersCol) + N' AS TiersID, '
            + CASE WHEN @TicketAdresseCol IS NOT NULL THEN N'r.' + QUOTENAME(@TicketAdresseCol) + N' AS TicketAdresse' ELSE N'NULL AS TicketAdresse' END + N', '
            + CASE WHEN @TicketVilleCol IS NOT NULL THEN N'r.' + QUOTENAME(@TicketVilleCol) + N' AS TicketVille' ELSE N'NULL AS TicketVille' END + N', '
            + CASE WHEN @TicketPaysCol IS NOT NULL THEN N'r.' + QUOTENAME(@TicketPaysCol) + N' AS TicketPays' ELSE N'NULL AS TicketPays' END + N', '
            + CASE WHEN @TicketCpCol IS NOT NULL THEN N'r.' + QUOTENAME(@TicketCpCol) + N' AS TicketCp' ELSE N'NULL AS TicketCp' END + N', '
            + CASE WHEN @TicketAdresseMapsCol IS NOT NULL THEN N'r.' + QUOTENAME(@TicketAdresseMapsCol) + N' AS TicketAdresseMaps' ELSE N'NULL AS TicketAdresseMaps' END + N', '
            + CASE WHEN @TicketLatCol IS NOT NULL THEN N'r.' + QUOTENAME(@TicketLatCol) + N' AS TicketLat' ELSE N'NULL AS TicketLat' END + N', '
            + CASE WHEN @TicketLongCol IS NOT NULL THEN N'r.' + QUOTENAME(@TicketLongCol) + N' AS TicketLong' ELSE N'NULL AS TicketLong' END + N', '
            + CASE WHEN @TiersAdresseCol IS NOT NULL THEN N't.' + QUOTENAME(@TiersAdresseCol) + N' AS TiersAdresse' ELSE N'NULL AS TiersAdresse' END + N', '
            + CASE WHEN @TiersVilleCol IS NOT NULL THEN N't.' + QUOTENAME(@TiersVilleCol) + N' AS TiersVille' ELSE N'NULL AS TiersVille' END + N', '
            + CASE WHEN @TiersPaysCol IS NOT NULL THEN N't.' + QUOTENAME(@TiersPaysCol) + N' AS TiersPays' ELSE N'NULL AS TiersPays' END + N', '
            + CASE WHEN @TiersCpCol IS NOT NULL THEN N't.' + QUOTENAME(@TiersCpCol) + N' AS TiersCp' ELSE N'NULL AS TiersCp' END + N', '
            + CASE WHEN @TiersAdresseMapsCol IS NOT NULL THEN N't.' + QUOTENAME(@TiersAdresseMapsCol) + N' AS TiersAdresseMaps' ELSE N'NULL AS TiersAdresseMaps' END + N', '
            + CASE WHEN @TiersLatCol IS NOT NULL THEN N't.' + QUOTENAME(@TiersLatCol) + N' AS TiersLat' ELSE N'NULL AS TiersLat' END + N', '
            + CASE WHEN @TiersLongCol IS NOT NULL THEN N't.' + QUOTENAME(@TiersLongCol) + N' AS TiersLong' ELSE N'NULL AS TiersLong' END + N', '
            + N'CASE WHEN (' + @TicketOverrideExpr + N') THEN ''TicketOverride'' ELSE ''TiersDefault'' END AS LocationSource
'
            + N'FROM dbo.TabReclamation r
LEFT JOIN dbo.TabTiers t ON TRY_CONVERT(NVARCHAR(200), t.' + QUOTENAME(@TiersIdCol) + N') = TRY_CONVERT(NVARCHAR(200), r.' + QUOTENAME(@ClaimTiersCol) + N')
            + @FilterByTicket + N';';

        EXEC sp_executesql @Sql, N'@TicketId INT', @TicketId;
    END
END
ELSE
BEGIN
    SELECT 'TabReclamation or TabTiers not found' AS Info;
END

PRINT '===== G) DATA QUALITY: CLAIMS WITHOUT TECHNICIAN =====';
IF OBJECT_ID('dbo.TabReclamation', 'U') IS NOT NULL
BEGIN
    IF @ClaimTechIdCol IS NULL AND @ClaimTechNameCol IS NULL
    BEGIN
        SELECT 'No technician columns detected in TabReclamation' AS Info;
    END
    ELSE
    BEGIN
        SET @Sql = N'SELECT COUNT(*) AS ClaimsWithoutTechnician
FROM dbo.TabReclamation r
WHERE 1 = 1';

        IF @ClaimTechIdCol IS NOT NULL
            SET @Sql += N' AND (r.' + QUOTENAME(@ClaimTechIdCol) + N' IS NULL OR r.' + QUOTENAME(@ClaimTechIdCol) + N' = 0)';

        IF @ClaimTechNameCol IS NOT NULL
            SET @Sql += N' AND (r.' + QUOTENAME(@ClaimTechNameCol) + N' IS NULL OR LTRIM(RTRIM(r.' + QUOTENAME(@ClaimTechNameCol) + N')) = '''')';

        SET @Sql += N';';
        EXEC sp_executesql @Sql;
    END
END

PRINT '===== H) DATA QUALITY: CLAIMS WITHOUT ANY LOCATION =====';
IF OBJECT_ID('dbo.TabReclamation', 'U') IS NOT NULL
   AND OBJECT_ID('dbo.TabTiers', 'U') IS NOT NULL
BEGIN
    IF @ClaimTiersCol IS NULL OR @TiersIdCol IS NULL
    BEGIN
        SELECT 'Cannot compute location quality: missing join keys' AS Info,
               @ClaimTiersCol AS ClaimTiersCol,
               @TiersIdCol AS TiersIdCol;
    END
    ELSE
    BEGIN
        SET @ClaimLocationExpr = N'COALESCE('
            + CASE WHEN @TicketAdresseCol IS NOT NULL THEN N'r.' + QUOTENAME(@TicketAdresseCol) ELSE N'NULL' END + N', '
            + CASE WHEN @TicketAdresseMapsCol IS NOT NULL THEN N'r.' + QUOTENAME(@TicketAdresseMapsCol) ELSE N'NULL' END + N', '
            + CASE WHEN @TicketLatCol IS NOT NULL THEN N'CONVERT(VARCHAR(50), r.' + QUOTENAME(@TicketLatCol) + N')' ELSE N'NULL' END + N', '
            + CASE WHEN @TicketLongCol IS NOT NULL THEN N'CONVERT(VARCHAR(50), r.' + QUOTENAME(@TicketLongCol) + N')' ELSE N'NULL' END + N')';

        SET @TiersLocationExpr = N'COALESCE('
            + CASE WHEN @TiersAdresseCol IS NOT NULL THEN N't.' + QUOTENAME(@TiersAdresseCol) ELSE N'NULL' END + N', '
            + CASE WHEN @TiersAdresseMapsCol IS NOT NULL THEN N't.' + QUOTENAME(@TiersAdresseMapsCol) ELSE N'NULL' END + N', '
            + CASE WHEN @TiersLatCol IS NOT NULL THEN N'CONVERT(VARCHAR(50), t.' + QUOTENAME(@TiersLatCol) + N')' ELSE N'NULL' END + N', '
            + CASE WHEN @TiersLongCol IS NOT NULL THEN N'CONVERT(VARCHAR(50), t.' + QUOTENAME(@TiersLongCol) + N')' ELSE N'NULL' END + N')';

        SET @Sql = N'SELECT COUNT(*) AS ClaimsWithoutAnyLocation
FROM dbo.TabReclamation r
    LEFT JOIN dbo.TabTiers t ON TRY_CONVERT(NVARCHAR(200), t.' + QUOTENAME(@TiersIdCol) + N') = TRY_CONVERT(NVARCHAR(200), r.' + QUOTENAME(@ClaimTiersCol) + N')
WHERE ' + @ClaimLocationExpr + N' IS NULL
  AND ' + @TiersLocationExpr + N' IS NULL;';

        EXEC sp_executesql @Sql;
    END
END

PRINT '===== END OF TECHNICIAN/CLAIMS DIAGNOSTIC =====';
