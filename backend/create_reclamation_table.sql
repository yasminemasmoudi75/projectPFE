CREATE TABLE [dbo].[TabReclamation](
    [ID] [int] IDENTITY(1,1) NOT NULL,
    [NumTicket] [nvarchar](50) NULL,
    [CodTiers] [nvarchar](100) NULL,
    [LibTiers] [nvarchar](255) NOT NULL,
    [Objet] [nvarchar](500) NOT NULL,
    [Description] [ntext] NULL,
    [TypeReclamation] [nvarchar](100) NULL DEFAULT (N'Technique'),
    [Priorite] [nvarchar](50) NULL DEFAULT (N'Moyenne'),
    [Statut] [nvarchar](50) NULL DEFAULT (N'Ouvert'),
    [NomTechnicien] [nvarchar](255) NULL,
    [TechnicienID] [int] NULL,
    [DateOuverture] [datetime] NULL DEFAULT (getdate()),
    [DateResolution] [datetime] NULL,
    [CUser] [nvarchar](100) NULL,
    [Solution] [ntext] NULL,
 CONSTRAINT [PK_TabReclamation] PRIMARY KEY CLUSTERED 
(
    [ID] ASC
)
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
