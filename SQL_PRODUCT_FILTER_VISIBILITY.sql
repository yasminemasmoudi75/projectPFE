-- Configure visibility of product stock filters for client UI
-- Filters: all, ok (Dispo), low (Faible), rupture

IF OBJECT_ID('dbo.TabProductFilterVisibility', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TabProductFilterVisibility (
        FilterKey NVARCHAR(20) NOT NULL PRIMARY KEY,
        VisibleForClient BIT NOT NULL DEFAULT(1),
        UpdatedAt DATETIME2 NOT NULL DEFAULT(SYSDATETIME())
    );
END;

MERGE dbo.TabProductFilterVisibility AS target
USING (
    SELECT 'all' AS FilterKey, CAST(1 AS BIT) AS VisibleForClient UNION ALL
    SELECT 'ok', CAST(1 AS BIT) UNION ALL
    SELECT 'low', CAST(1 AS BIT) UNION ALL
    SELECT 'rupture', CAST(1 AS BIT)
) AS source
ON target.FilterKey = source.FilterKey
WHEN MATCHED THEN
    UPDATE SET
        target.VisibleForClient = source.VisibleForClient,
        target.UpdatedAt = SYSDATETIME()
WHEN NOT MATCHED BY TARGET THEN
    INSERT (FilterKey, VisibleForClient, UpdatedAt)
    VALUES (source.FilterKey, source.VisibleForClient, SYSDATETIME());

-- Example toggles:
-- Hide 'Faible' for client
-- UPDATE dbo.TabProductFilterVisibility SET VisibleForClient = 0, UpdatedAt = SYSDATETIME() WHERE FilterKey = 'low';

-- Show only Dispo + Rupture
-- UPDATE dbo.TabProductFilterVisibility SET VisibleForClient = CASE WHEN FilterKey IN ('all','ok','rupture') THEN 1 ELSE 0 END, UpdatedAt = SYSDATETIME();

-- Check current config
SELECT FilterKey, VisibleForClient, UpdatedAt
FROM dbo.TabProductFilterVisibility
ORDER BY FilterKey;
