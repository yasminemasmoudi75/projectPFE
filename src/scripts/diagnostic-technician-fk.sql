-- SQL Server Diagnostic Script for Technician Assignment Issue
-- Run this directly in SQL Server Management Studio to diagnose the FK constraint problem

USE AA;
GO

PRINT '=== DIAGNOSTIC: Technician Assignment FK Issues ==='
PRINT ''

-- 1. Check if User table exists and has data
PRINT '1️⃣  [Users Table] Checking if UCS_USERS exists and has records...'
IF OBJECT_ID('dbo.UCS_USERS', 'U') IS NOT NULL
BEGIN
    SELECT 'UCS_USERS' as TableName, COUNT(*) as RecordCount FROM UCS_USERS
    PRINT 'Sample users (first 5):'
    SELECT TOP 5 USER_ID, USER_NAME, REAL_NAME FROM UCS_USERS
END
ELSE
BEGIN
    PRINT '❌ ERROR: UCS_USERS table not found!'
END

PRINT ''

-- 2. Check if ReclamationTable exists and structure
PRINT '2️⃣  [TabReclamation Table] Checking structure...'
IF OBJECT_ID('dbo.TabReclamation', 'U') IS NOT NULL
BEGIN
    PRINT '✅ TabReclamation exists'
    
    -- Check columns
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'TabReclamation'
    ORDER BY ORDINAL_POSITION
    
    -- Check how many records
    SELECT COUNT(*) as TotalRecords FROM TabReclamation
    
    -- Check NULLs in TechnicienID
    PRINT 'TechnicienID value distribution:'
    SELECT 
        CASE WHEN TechnicienID IS NULL THEN 'NULL' 
             ELSE CAST(TechnicienID as VARCHAR(20)) 
        END as TechnicienID_Value,
        COUNT(*) as Count
    FROM TabReclamation
    GROUP BY CASE WHEN TechnicienID IS NULL THEN 'NULL' 
                  ELSE CAST(TechnicienID as VARCHAR(20)) 
             END
    ORDER BY Count DESC
END
ELSE
BEGIN
    PRINT '❌ ERROR: TabReclamation table not found!'
END

PRINT ''

-- 3. Check Foreign Keys on TabReclamation
PRINT '3️⃣  [Foreign Keys] Checking constraints...'
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'TabReclamation'
ORDER BY CONSTRAINT_NAME

PRINT ''

-- 4. Specific test: Try to assign technician 17 to reclamation 10
PRINT '4️⃣  [Test Update] Simulating assignment of TechnicienID=17 to ReclamationID=10...'

-- First, verify user 17 exists
PRINT 'Checking if User ID 17 exists...'
IF EXISTS (SELECT 1 FROM UCS_USERS WHERE USER_ID = 17)
BEGIN
    PRINT '✅ User ID 17 exists'
    SELECT USER_ID, USER_NAME, REAL_NAME FROM UCS_USERS WHERE USER_ID = 17
END
ELSE IF EXISTS (SELECT 1 FROM UCS_USERS WHERE USER_ID = 17.0)
BEGIN
    PRINT '✅ User ID 17.0 (FLOAT) exists'
    SELECT USER_ID, USER_NAME, REAL_NAME FROM UCS_USERS WHERE USER_ID = 17.0
END
ELSE
BEGIN
    PRINT '❌ ERROR: User ID 17 does NOT exist in database!'
    PRINT 'Available user IDs:'
    SELECT DISTINCT USER_ID FROM UCS_USERS ORDER BY USER_ID
END

PRINT ''

-- Check if reclamation 10 exists
PRINT 'Checking if Reclamation ID 10 exists...'
IF EXISTS (SELECT 1 FROM TabReclamation WHERE ID = 10)
BEGIN
    PRINT '✅ Reclamation 10 exists'
    SELECT ID, NumTicket, NomTechnicien, TechnicienID, Statut 
    FROM TabReclamation 
    WHERE ID = 10
END
ELSE
BEGIN
    PRINT '❌ ERROR: Reclamation ID 10 does NOT exist!'
END

PRINT ''

-- 5. Test the update WITHOUT constraints
PRINT '5️⃣  [Test Update] Attempting test update...'
BEGIN TRANSACTION

BEGIN TRY
    -- Disable constraints temporarily
    ALTER TABLE TabReclamation NOCHECK CONSTRAINT ALL
    
    -- Try the update
    UPDATE TabReclamation 
    SET TechnicienID = 17,
        NomTechnicien = 'Test Technician',
        Statut = 'En cours'
    WHERE ID = 10
    
    -- Re-enable constraints
    ALTER TABLE TabReclamation CHECK CONSTRAINT ALL
    
    PRINT '✅ Update succeeded!'
    PRINT 'New values:'
    SELECT ID, TechnicienID, NomTechnicien, Statut FROM TabReclamation WHERE ID = 10
    
    -- Rollback since this was just a test
    ROLLBACK
    PRINT '⚠️  (Rolled back test update)'
END TRY
BEGIN CATCH
    ALTER TABLE TabReclamation CHECK CONSTRAINT ALL
    ROLLBACK
    PRINT '❌ Update failed!'
    PRINT 'Error: ' + ERROR_MESSAGE()
END CATCH

PRINT ''
PRINT '=== DIAGNOSTIC COMPLETE ==='
PRINT ''
PRINT 'Summary: If User 17 and Reclamation 10 exist, the backend should be able to assign it.'
PRINT 'If FK constraints still fail, check:'
PRINT '  1. The USER_ID column type in UCS_USERS (should be numeric)'
PRINT '  2. The TechnicienID column type in TabReclamation (should match USER_ID type)'
PRINT '  3. Any existing ForeignKey constraints between the tables'
PRINT '  4. Data integrity - ensure User ID 17 really exists'
