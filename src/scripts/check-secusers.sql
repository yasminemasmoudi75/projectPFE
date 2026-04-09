-- Robust check for FK parent users table + user 17 presence
-- Returns visible result sets even when Messages tab is hidden.

USE AA;
GO

DECLARE @TargetUserId INT = 17;

-- 1) Candidate tables (covers Sec_Users, SecUsers, etc.)
SELECT
    s.name AS SchemaName,
    t.name AS TableName,
    QUOTENAME(s.name) + '.' + QUOTENAME(t.name) AS FullTableName
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE LOWER(t.name) IN ('sec_users', 'secusers', 'users', 'ucs_users')
   OR LOWER(t.name) LIKE 'sec%user%'
ORDER BY t.name;

-- 2) Resolve exact FK parent table from TabReclamation.TechnicienID
;WITH FKInfo AS (
    SELECT
        fk.name AS FKName,
        s1.name AS ChildSchema,
        t1.name AS ChildTable,
        c1.name AS ChildColumn,
        s2.name AS ParentSchema,
        t2.name AS ParentTable,
        c2.name AS ParentColumn
    FROM sys.foreign_keys fk
    JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    JOIN sys.tables t1 ON fkc.parent_object_id = t1.object_id
    JOIN sys.schemas s1 ON t1.schema_id = s1.schema_id
    JOIN sys.columns c1 ON c1.object_id = t1.object_id AND c1.column_id = fkc.parent_column_id
    JOIN sys.tables t2 ON fkc.referenced_object_id = t2.object_id
    JOIN sys.schemas s2 ON t2.schema_id = s2.schema_id
    JOIN sys.columns c2 ON c2.object_id = t2.object_id AND c2.column_id = fkc.referenced_column_id
    WHERE t1.name = 'TabReclamation' AND c1.name = 'TechnicienID'
)
SELECT * FROM FKInfo;

DECLARE @ParentSchema SYSNAME;
DECLARE @ParentTable SYSNAME;
DECLARE @ParentColumn SYSNAME;
DECLARE @sql NVARCHAR(MAX);

SELECT TOP 1
    @ParentSchema = s2.name,
    @ParentTable = t2.name,
    @ParentColumn = c2.name
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
JOIN sys.tables t1 ON fkc.parent_object_id = t1.object_id
JOIN sys.columns c1 ON c1.object_id = t1.object_id AND c1.column_id = fkc.parent_column_id
JOIN sys.tables t2 ON fkc.referenced_object_id = t2.object_id
JOIN sys.schemas s2 ON t2.schema_id = s2.schema_id
JOIN sys.columns c2 ON c2.object_id = t2.object_id AND c2.column_id = fkc.referenced_column_id
WHERE t1.name = 'TabReclamation' AND c1.name = 'TechnicienID';

-- 3) If FK exists, test user presence in the exact parent table/column
IF @ParentTable IS NOT NULL
BEGIN
    SELECT
        @ParentSchema AS ResolvedParentSchema,
        @ParentTable AS ResolvedParentTable,
        @ParentColumn AS ResolvedParentColumn,
        @TargetUserId AS CheckedUserId;

    SET @sql = N'
        SELECT TOP 1 *
        FROM ' + QUOTENAME(@ParentSchema) + N'.' + QUOTENAME(@ParentTable) + N'
        WHERE ' + QUOTENAME(@ParentColumn) + N' = @pUserId;
    ';

    EXEC sp_executesql @sql, N'@pUserId INT', @pUserId = @TargetUserId;

    SET @sql = N'
        SELECT TOP 50 ' + QUOTENAME(@ParentColumn) + N' AS ParentUserId
        FROM ' + QUOTENAME(@ParentSchema) + N'.' + QUOTENAME(@ParentTable) + N'
        ORDER BY ' + QUOTENAME(@ParentColumn) + N';
    ';

    EXEC sp_executesql @sql;
END
ELSE
BEGIN
    SELECT 'NO_FK_FOUND_ON_TabReclamation_TechnicienID' AS Diagnostic;
END

-- 4) Quick state of reclamation ID 10
SELECT ID, NumTicket, NomTechnicien, TechnicienID, Statut
FROM dbo.TabReclamation
WHERE ID = 10;
