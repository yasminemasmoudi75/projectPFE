-- Add optional claim-specific intervention location columns
-- Safe to run multiple times

IF COL_LENGTH('dbo.TabReclamation', 'TicketAdresse') IS NULL
BEGIN
    ALTER TABLE dbo.TabReclamation ADD TicketAdresse NVARCHAR(255) NULL;
END

IF COL_LENGTH('dbo.TabReclamation', 'TicketVille') IS NULL
BEGIN
    ALTER TABLE dbo.TabReclamation ADD TicketVille NVARCHAR(50) NULL;
END

IF COL_LENGTH('dbo.TabReclamation', 'TicketPays') IS NULL
BEGIN
    ALTER TABLE dbo.TabReclamation ADD TicketPays NVARCHAR(50) NULL;
END

IF COL_LENGTH('dbo.TabReclamation', 'TicketCp') IS NULL
BEGIN
    ALTER TABLE dbo.TabReclamation ADD TicketCp NVARCHAR(20) NULL;
END

IF COL_LENGTH('dbo.TabReclamation', 'TicketAdresseMaps') IS NULL
BEGIN
    ALTER TABLE dbo.TabReclamation ADD TicketAdresseMaps NVARCHAR(255) NULL;
END

IF COL_LENGTH('dbo.TabReclamation', 'TicketLat') IS NULL
BEGIN
    ALTER TABLE dbo.TabReclamation ADD TicketLat FLOAT NULL;
END

IF COL_LENGTH('dbo.TabReclamation', 'TicketLong') IS NULL
BEGIN
    ALTER TABLE dbo.TabReclamation ADD TicketLong FLOAT NULL;
END
