-- Script pour ajouter le module Calendrier (CodMod=8) aux permissions pour tous les rôles
-- Date: 2026-04-05

USE AA;
GO

IF OBJECT_ID('dbo.TabAWProfileAccess', 'U') IS NULL
BEGIN
	CREATE TABLE dbo.TabAWProfileAccess (
		Id INT IDENTITY(1,1) PRIMARY KEY,
		ProfileUser NVARCHAR(50) NOT NULL,
		CodMod INT NOT NULL,
		LibMod NVARCHAR(100) NULL,
		Actif BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_Actif DEFAULT(1),
		canAdd BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_canAdd DEFAULT(0),
		canEdit BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_canEdit DEFAULT(0),
		canDelt BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_canDelt DEFAULT(0),
		canMaps BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_canMaps DEFAULT(0),
		FiltreRepres BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_FiltreRepres DEFAULT(0),
		FiltreMag BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_FiltreMag DEFAULT(0),
		FiltreChauffeur BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_FiltreChauffeur DEFAULT(0),
		canValid BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_canValid DEFAULT(0),
		CtrlStk BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_CtrlStk DEFAULT(0),
		CanImp BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_CanImp DEFAULT(0),
		canPDF BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_canPDF DEFAULT(0),
		CONSTRAINT UQ_TabAWProfileAccess_ProfileUser_CodMod UNIQUE (ProfileUser, CodMod)
	);
END
GO

IF COL_LENGTH('dbo.TabAWProfileAccess', 'canViewSuiviVente') IS NULL
	ALTER TABLE dbo.TabAWProfileAccess ADD canViewSuiviVente BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_canViewSuiviVente DEFAULT(0);
IF COL_LENGTH('dbo.TabAWProfileAccess', 'canEditCommunication') IS NULL
	ALTER TABLE dbo.TabAWProfileAccess ADD canEditCommunication BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_canEditCommunication DEFAULT(0);
IF COL_LENGTH('dbo.TabAWProfileAccess', 'canDeleteCommunication') IS NULL
	ALTER TABLE dbo.TabAWProfileAccess ADD canDeleteCommunication BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_canDeleteCommunication DEFAULT(0);
IF COL_LENGTH('dbo.TabAWProfileAccess', 'canNotify') IS NULL
	ALTER TABLE dbo.TabAWProfileAccess ADD canNotify BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_canNotify DEFAULT(0);
IF COL_LENGTH('dbo.TabAWProfileAccess', 'ViewFiltreMag') IS NULL
	ALTER TABLE dbo.TabAWProfileAccess ADD ViewFiltreMag BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_ViewFiltreMag DEFAULT(0);
IF COL_LENGTH('dbo.TabAWProfileAccess', 'ViewFiltreRepres') IS NULL
	ALTER TABLE dbo.TabAWProfileAccess ADD ViewFiltreRepres BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_ViewFiltreRepres DEFAULT(0);
IF COL_LENGTH('dbo.TabAWProfileAccess', 'ViewFiltreChauffeur') IS NULL
	ALTER TABLE dbo.TabAWProfileAccess ADD ViewFiltreChauffeur BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_ViewFiltreChauffeur DEFAULT(0);
IF COL_LENGTH('dbo.TabAWProfileAccess', 'canModifyAllUser') IS NULL
	ALTER TABLE dbo.TabAWProfileAccess ADD canModifyAllUser BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_canModifyAllUser DEFAULT(0);
IF COL_LENGTH('dbo.TabAWProfileAccess', 'CanEditBase') IS NULL
	ALTER TABLE dbo.TabAWProfileAccess ADD CanEditBase BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_CanEditBase DEFAULT(0);
IF COL_LENGTH('dbo.TabAWProfileAccess', 'CanValidationBL') IS NULL
	ALTER TABLE dbo.TabAWProfileAccess ADD CanValidationBL BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_CanValidationBL DEFAULT(0);
IF COL_LENGTH('dbo.TabAWProfileAccess', 'CanEditBL') IS NULL
	ALTER TABLE dbo.TabAWProfileAccess ADD CanEditBL BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_CanEditBL DEFAULT(0);
GO

-- Vérifier et insérer les permissions pour Calendrier
-- Admin: Accès complet
IF NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser = 'Admin' AND CodMod = 8)
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canMaps, FiltreRepres, FiltreMag, FiltreChauffeur, canValid, CtrlStk, CanImp, canPDF, canViewSuiviVente, canEditCommunication, canDeleteCommunication, canNotify, ViewFiltreMag, ViewFiltreRepres, ViewFiltreChauffeur, canModifyAllUser, CanEditBase, CanValidationBL, CanEditBL)
VALUES ('Admin', 8, 'Calendrier', 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

-- Agent: Accès complet
IF NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser = 'Agent' AND CodMod = 8)
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canMaps, FiltreRepres, FiltreMag, FiltreChauffeur, canValid, CtrlStk, CanImp, canPDF, canViewSuiviVente, canEditCommunication, canDeleteCommunication, canNotify, ViewFiltreMag, ViewFiltreRepres, ViewFiltreChauffeur, canModifyAllUser, CanEditBase, CanValidationBL, CanEditBL)
VALUES ('Agent', 8, 'Calendrier', 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

-- Client: Accès lecture seule
IF NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser = 'Client' AND CodMod = 8)
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canMaps, FiltreRepres, FiltreMag, FiltreChauffeur, canValid, CtrlStk, CanImp, canPDF, canViewSuiviVente, canEditCommunication, canDeleteCommunication, canNotify, ViewFiltreMag, ViewFiltreRepres, ViewFiltreChauffeur, canModifyAllUser, CanEditBase, CanValidationBL, CanEditBL)
VALUES ('Client', 8, 'Calendrier', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

-- Commerciale: Accès complet
IF NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser = 'Commerciale' AND CodMod = 8)
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canMaps, FiltreRepres, FiltreMag, FiltreChauffeur, canValid, CtrlStk, CanImp, canPDF, canViewSuiviVente, canEditCommunication, canDeleteCommunication, canNotify, ViewFiltreMag, ViewFiltreRepres, ViewFiltreChauffeur, canModifyAllUser, CanEditBase, CanValidationBL, CanEditBL)
VALUES ('Commerciale', 8, 'Calendrier', 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0);

-- Technicien: Accès lecture seule
IF NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser = 'Technicien' AND CodMod = 8)
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canMaps, FiltreRepres, FiltreMag, FiltreChauffeur, canValid, CtrlStk, CanImp, canPDF, canViewSuiviVente, canEditCommunication, canDeleteCommunication, canNotify, ViewFiltreMag, ViewFiltreRepres, ViewFiltreChauffeur, canModifyAllUser, CanEditBase, CanValidationBL, CanEditBL)
VALUES ('Technicien', 8, 'Calendrier', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

-- Vérification: Afficher les permissions insertées
SELECT * FROM TabAWProfileAccess WHERE CodMod = 8 ORDER BY ProfileUser;
