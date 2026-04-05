-- Script complet pour créer la table TabAWProfileAccess et insérer les permissions avec Calendrier
-- Date: 2026-04-05

USE AA;
GO

-- Créer la table TabAWProfileAccess si elle n'existe pas
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'TabAWProfileAccess')
BEGIN
    CREATE TABLE TabAWProfileAccess (
        Id INT PRIMARY KEY IDENTITY(1,1),
        ProfileUser NVARCHAR(50) NOT NULL,
        CodMod INT NOT NULL,
        LibMod NVARCHAR(100),
        Actif BIT DEFAULT 1,
        canAdd BIT DEFAULT 0,
        canEdit BIT DEFAULT 0,
        canDelt BIT DEFAULT 0,
        canMaps BIT DEFAULT 0,
        FiltreRepres BIT DEFAULT 0,
        FiltreMag BIT DEFAULT 0,
        FiltreChauffeur BIT DEFAULT 0,
        canValid BIT DEFAULT 0,
        CtrlStk BIT DEFAULT 0,
        CanImp BIT DEFAULT 0,
        canPDF BIT DEFAULT 0,
        canViewSuiviVente BIT DEFAULT 0,
        canEditCommunication BIT DEFAULT 0,
        canDeleteCommunication BIT DEFAULT 0,
        canNotify BIT DEFAULT 0,
        ViewFiltreMag BIT DEFAULT 0,
        ViewFiltreRepres BIT DEFAULT 0,
        ViewFiltreChauffeur BIT DEFAULT 0,
        canModifyAllUser BIT DEFAULT 0,
        CanEditBase BIT DEFAULT 0,
        CanValidationBL BIT DEFAULT 0,
        CanEditBL BIT DEFAULT 0,
        UNIQUE (ProfileUser, CodMod)
    );
    PRINT 'Table TabAWProfileAccess créée avec succès';
END
GO

-- Vider la table avant d'insérer
DELETE FROM TabAWProfileAccess;
GO

-- ====== ADMIN ======
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canMaps, FiltreRepres, FiltreMag, FiltreChauffeur, canValid, CtrlStk, CanImp, canPDF, canViewSuiviVente, canEditCommunication, canDeleteCommunication, canNotify, ViewFiltreMag, ViewFiltreRepres, ViewFiltreChauffeur, canModifyAllUser, CanEditBase, CanValidationBL, CanEditBL)
VALUES 
    ('Admin', 1, 'Activités', 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Admin', 2, 'Clients', 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Admin', 3, 'Devis', 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Admin', 4, 'BCV', 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1),
    ('Admin', 5, 'BLV', 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1),
    ('Admin', 6, 'Factures', 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Admin', 7, 'Stock', 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0),
    ('Admin', 8, 'Calendrier', 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Admin', 30, 'Retour', 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Admin', 31, 'Règlement', 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Admin', 40, 'Tournée', 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0),
    ('Admin', 41, 'Commandes', 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Admin', 42, 'Mouvements', 1, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0),
    ('Admin', 43, 'BLI', 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Admin', 44, 'DI', 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Admin', 46, 'Produits', 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Admin', 47, 'Catégories', 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Admin', 52, 'Carte', 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

-- ====== AGENT ======
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canMaps, FiltreRepres, FiltreMag, FiltreChauffeur, canValid, CtrlStk, CanImp, canPDF, canViewSuiviVente, canEditCommunication, canDeleteCommunication, canNotify, ViewFiltreMag, ViewFiltreRepres, ViewFiltreChauffeur, canModifyAllUser, CanEditBase, CanValidationBL, CanEditBL)
VALUES 
    ('Agent', 1, 'Activités', 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Agent', 2, 'Clients', 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Agent', 3, 'Devis', 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Agent', 4, 'BCV', 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Agent', 5, 'BLV', 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1),
    ('Agent', 6, 'Factures', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Agent', 7, 'Stock', 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0),
    ('Agent', 8, 'Calendrier', 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Agent', 30, 'Retour', 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Agent', 31, 'Règlement', 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Agent', 40, 'Tournée', 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0),
    ('Agent', 41, 'Commandes', 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Agent', 42, 'Mouvements', 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0),
    ('Agent', 43, 'BLI', 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Agent', 44, 'DI', 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Agent', 46, 'Produits', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Agent', 47, 'Catégories', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Agent', 52, 'Carte', 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

-- ====== CLIENT ======
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canMaps, FiltreRepres, FiltreMag, FiltreChauffeur, canValid, CtrlStk, CanImp, canPDF, canViewSuiviVente, canEditCommunication, canDeleteCommunication, canNotify, ViewFiltreMag, ViewFiltreRepres, ViewFiltreChauffeur, canModifyAllUser, CanEditBase, CanValidationBL, CanEditBL)
VALUES 
    ('Client', 2, 'Clients', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Client', 3, 'Devis', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Client', 6, 'Factures', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Client', 8, 'Calendrier', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Client', 30, 'Retour', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Client', 41, 'Commandes', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Client', 46, 'Produits', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Client', 52, 'Carte', 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

-- ====== COMMERCIALE ======
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canMaps, FiltreRepres, FiltreMag, FiltreChauffeur, canValid, CtrlStk, CanImp, canPDF, canViewSuiviVente, canEditCommunication, canDeleteCommunication, canNotify, ViewFiltreMag, ViewFiltreRepres, ViewFiltreChauffeur, canModifyAllUser, CanEditBase, CanValidationBL, CanEditBL)
VALUES 
    ('Commerciale', 1, 'Activités', 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0),
    ('Commerciale', 2, 'Clients', 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0),
    ('Commerciale', 3, 'Devis', 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0),
    ('Commerciale', 4, 'BCV', 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0),
    ('Commerciale', 5, 'BLV', 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0),
    ('Commerciale', 6, 'Factures', 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0),
    ('Commerciale', 8, 'Calendrier', 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0),
    ('Commerciale', 30, 'Retour', 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0),
    ('Commerciale', 31, 'Règlement', 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0),
    ('Commerciale', 40, 'Tournée', 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0),
    ('Commerciale', 41, 'Commandes', 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0),
    ('Commerciale', 42, 'Mouvements', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Commerciale', 43, 'BLI', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Commerciale', 44, 'DI', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Commerciale', 46, 'Produits', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Commerciale', 47, 'Catégories', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Commerciale', 52, 'Carte', 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0);

-- ====== TECHNICIEN ======
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canMaps, FiltreRepres, FiltreMag, FiltreChauffeur, canValid, CtrlStk, CanImp, canPDF, canViewSuiviVente, canEditCommunication, canDeleteCommunication, canNotify, ViewFiltreMag, ViewFiltreRepres, ViewFiltreChauffeur, canModifyAllUser, CanEditBase, CanValidationBL, CanEditBL)
VALUES 
    ('Technicien', 1, 'Activités', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Technicien', 7, 'Stock', 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0),
    ('Technicien', 8, 'Calendrier', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

GO

-- Afficher le résumé
SELECT DISTINCT ProfileUser, COUNT(*) as NbModules 
FROM TabAWProfileAccess 
WHERE Actif = 1
GROUP BY ProfileUser
ORDER BY ProfileUser;

PRINT '';
PRINT 'Permissions du module Calendrier (CodMod=8):';
SELECT ProfileUser, LibMod, canAdd, canEdit, canDelt, canValid, canPDF 
FROM TabAWProfileAccess 
WHERE CodMod = 8
ORDER BY ProfileUser;

PRINT '';
PRINT 'Insertion complétée avec succès!';
