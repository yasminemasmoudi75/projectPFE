USE AA;
GO

IF OBJECT_ID('dbo.TabAWProfileAccess', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TabAWProfileAccess (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ProfileUser NVARCHAR(50) NOT NULL,
        CodMod INT NOT NULL,
        LibMod NVARCHAR(100) NULL,
        Actif BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_Actif DEFAULT (1),
        canAdd BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_canAdd DEFAULT (0),
        canEdit BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_canEdit DEFAULT (0),
        canDelt BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_canDelt DEFAULT (0),
        canMaps BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_canMaps DEFAULT (0),
        FiltreRepres BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_FiltreRepres DEFAULT (0),
        FiltreMag BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_FiltreMag DEFAULT (0),
        FiltreChauffeur BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_FiltreChauffeur DEFAULT (0),
        canValid BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_canValid DEFAULT (0),
        CtrlStk BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_CtrlStk DEFAULT (0),
        CanImp BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_CanImp DEFAULT (0),
        canPDF BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_canPDF DEFAULT (0),
        canViewSuiviVente BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_canViewSuiviVente DEFAULT (0),
        canEditCommunication BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_canEditCommunication DEFAULT (0),
        canDeleteCommunication BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_canDeleteCommunication DEFAULT (0),
        canNotify BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_canNotify DEFAULT (0),
        ViewFiltreMag BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_ViewFiltreMag DEFAULT (0),
        ViewFiltreRepres BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_ViewFiltreRepres DEFAULT (0),
        ViewFiltreChauffeur BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_ViewFiltreChauffeur DEFAULT (0),
        canModifyAllUser BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_canModifyAllUser DEFAULT (0),
        CanEditBase BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_CanEditBase DEFAULT (0),
        CanValidationBL BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_CanValidationBL DEFAULT (0),
        CanEditBL BIT NOT NULL CONSTRAINT DF_TabAWProfileAccess_CanEditBL DEFAULT (0),
        CONSTRAINT UQ_TabAWProfileAccess_ProfileUser_CodMod UNIQUE (ProfileUser, CodMod)
    );

    PRINT 'Table dbo.TabAWProfileAccess creee.';
END
ELSE
BEGIN
    PRINT 'Table dbo.TabAWProfileAccess existe deja.';
END
GO
