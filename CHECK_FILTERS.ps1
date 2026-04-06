# Connection string aligned with backend .env
$ServerInstance = "127.0.0.1"
$Database = "AA"
$Query = @"
SELECT 
    Id, 
    ProfileUser, 
    ModuleCode, 
    FilterKey, 
    VisibleForRole, 
    FilterLabel
FROM [dbo].[TabRoleFilterVisibility]
WHERE ProfileUser = 'client' 
  AND ModuleCode = 'STOCK'
ORDER BY FilterKey
"@

# Execute the query
Invoke-Sqlcmd -ServerInstance $ServerInstance -Database $Database -Query $Query
