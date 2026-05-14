-- Création de la table journal des connexions
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UCS_LOGIN_LOGS]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[UCS_LOGIN_LOGS] (
        [ID_Log]          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [ID_Utilisateur]  INT NULL,
        [LoginName]       NVARCHAR(100) NULL,
        [FullName]        NVARCHAR(200) NULL,
        [Role]            NVARCHAR(50)  NULL,
        [Action]          NVARCHAR(20)  NOT NULL DEFAULT 'LOGIN_SUCCESS',
        [IPAddress]       NVARCHAR(50)  NULL,
        [UserAgent]       NVARCHAR(500) NULL,
        [Details]         NVARCHAR(500) NULL,
        [DateConnexion]   DATETIME      NOT NULL DEFAULT GETDATE()
    );

    -- Index pour accélérer les requêtes fréquentes
    CREATE INDEX IX_LoginLogs_Date   ON [dbo].[UCS_LOGIN_LOGS] ([DateConnexion] DESC);
    CREATE INDEX IX_LoginLogs_User   ON [dbo].[UCS_LOGIN_LOGS] ([ID_Utilisateur]);
    CREATE INDEX IX_LoginLogs_Action ON [dbo].[UCS_LOGIN_LOGS] ([Action]);

    PRINT 'Table UCS_LOGIN_LOGS créée avec succès.';
END
ELSE
BEGIN
    PRINT 'Table UCS_LOGIN_LOGS existe déjà.';
END
