/*
  Database Understanding - Global Overview (SQL Server)
  Safe: read-only queries only
  How to use:
  1) Connect to your SQL Server
  2) Select DB: USE AA;
  3) Run full script
*/

SET NOCOUNT ON;

PRINT '===== 1) DATABASE INFO =====';
SELECT
    DB_NAME() AS CurrentDatabase,
    @@SERVERNAME AS ServerName,
    SUSER_SNAME() AS CurrentLogin,
    GETDATE() AS SnapshotAt;

PRINT '===== 2) TOP TABLES BY ROW COUNT =====';
SELECT
    s.name AS SchemaName,
    t.name AS TableName,
    SUM(p.rows) AS TotalRows
FROM sys.tables t
INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
INNER JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0, 1)
GROUP BY s.name, t.name
ORDER BY TotalRows DESC, s.name, t.name;

PRINT '===== 3) TABLES + COLUMNS + TYPES =====';
SELECT
    s.name AS SchemaName,
    t.name AS TableName,
    c.column_id AS ColumnOrder,
    c.name AS ColumnName,
    ty.name AS DataType,
    c.max_length AS MaxLength,
    c.precision AS NumericPrecision,
    c.scale AS NumericScale,
    c.is_nullable AS IsNullable,
    c.is_identity AS IsIdentity,
    dc.definition AS DefaultValue
FROM sys.tables t
INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
INNER JOIN sys.columns c ON c.object_id = t.object_id
INNER JOIN sys.types ty ON ty.user_type_id = c.user_type_id
LEFT JOIN sys.default_constraints dc ON dc.parent_object_id = c.object_id
    AND dc.parent_column_id = c.column_id
ORDER BY s.name, t.name, c.column_id;

PRINT '===== 4) PRIMARY KEYS =====';
SELECT
    s.name AS SchemaName,
    t.name AS TableName,
    kc.name AS PrimaryKeyName,
    c.name AS ColumnName,
    ic.key_ordinal AS KeyOrder
FROM sys.key_constraints kc
INNER JOIN sys.tables t ON t.object_id = kc.parent_object_id
INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
INNER JOIN sys.index_columns ic ON ic.object_id = kc.parent_object_id
    AND ic.index_id = kc.unique_index_id
INNER JOIN sys.columns c ON c.object_id = ic.object_id
    AND c.column_id = ic.column_id
WHERE kc.type = 'PK'
ORDER BY s.name, t.name, ic.key_ordinal;

PRINT '===== 5) FOREIGN KEYS (RELATIONS) =====';
SELECT
    fk.name AS ForeignKeyName,
    sch_parent.name AS ParentSchema,
    t_parent.name AS ParentTable,
    c_parent.name AS ParentColumn,
    sch_ref.name AS ReferencedSchema,
    t_ref.name AS ReferencedTable,
    c_ref.name AS ReferencedColumn,
    fk.delete_referential_action_desc AS OnDelete,
    fk.update_referential_action_desc AS OnUpdate
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
INNER JOIN sys.tables t_parent ON t_parent.object_id = fkc.parent_object_id
INNER JOIN sys.schemas sch_parent ON sch_parent.schema_id = t_parent.schema_id
INNER JOIN sys.columns c_parent ON c_parent.object_id = fkc.parent_object_id
    AND c_parent.column_id = fkc.parent_column_id
INNER JOIN sys.tables t_ref ON t_ref.object_id = fkc.referenced_object_id
INNER JOIN sys.schemas sch_ref ON sch_ref.schema_id = t_ref.schema_id
INNER JOIN sys.columns c_ref ON c_ref.object_id = fkc.referenced_object_id
    AND c_ref.column_id = fkc.referenced_column_id
ORDER BY sch_parent.name, t_parent.name, fk.name;

PRINT '===== 6) INDEXES =====';
SELECT
    s.name AS SchemaName,
    t.name AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType,
    i.is_unique AS IsUnique,
    i.is_primary_key AS IsPrimaryKey,
    i.is_disabled AS IsDisabled
FROM sys.indexes i
INNER JOIN sys.tables t ON t.object_id = i.object_id
INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE i.name IS NOT NULL
ORDER BY s.name, t.name, i.name;

PRINT '===== 7) VIEWS =====';
SELECT
    s.name AS SchemaName,
    v.name AS ViewName,
    v.create_date AS CreatedAt,
    v.modify_date AS UpdatedAt
FROM sys.views v
INNER JOIN sys.schemas s ON s.schema_id = v.schema_id
ORDER BY s.name, v.name;

PRINT '===== 8) STORED PROCEDURES =====';
SELECT
    s.name AS SchemaName,
    p.name AS ProcedureName,
    p.create_date AS CreatedAt,
    p.modify_date AS UpdatedAt
FROM sys.procedures p
INNER JOIN sys.schemas s ON s.schema_id = p.schema_id
ORDER BY s.name, p.name;

PRINT '===== 9) TRIGGERS =====';
SELECT
    s.name AS SchemaName,
    tr.name AS TriggerName,
    OBJECT_NAME(tr.parent_id) AS ParentObject,
    tr.is_disabled AS IsDisabled,
    tr.create_date AS CreatedAt,
    tr.modify_date AS UpdatedAt
FROM sys.triggers tr
LEFT JOIN sys.objects o ON o.object_id = tr.parent_id
LEFT JOIN sys.schemas s ON s.schema_id = o.schema_id
ORDER BY s.name, tr.name;

PRINT '===== 10) COLUMNS THAT LOOK LIKE LOCATION (addr/lat/long/city) =====';
SELECT
    s.name AS SchemaName,
    t.name AS TableName,
    c.name AS ColumnName,
    ty.name AS DataType
FROM sys.tables t
INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
INNER JOIN sys.columns c ON c.object_id = t.object_id
INNER JOIN sys.types ty ON ty.user_type_id = c.user_type_id
WHERE
    c.name LIKE '%adress%'
    OR c.name LIKE '%adresse%'
    OR c.name LIKE '%ville%'
    OR c.name LIKE '%city%'
    OR c.name LIKE '%pays%'
    OR c.name LIKE '%country%'
    OR c.name LIKE '%lat%'
    OR c.name LIKE '%long%'
    OR c.name LIKE '%gps%'
ORDER BY s.name, t.name, c.name;

PRINT '===== END OF GLOBAL OVERVIEW =====';
