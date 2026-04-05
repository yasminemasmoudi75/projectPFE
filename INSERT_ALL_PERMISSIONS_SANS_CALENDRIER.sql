-- ========================================
-- INSERT ALL PERMISSIONS - TabAWProfileAccess
-- ========================================
-- Ce script insère toutes les permissions pour les 5 rôles (Admin, Agent, Client, Commerciale, Technicien)
-- SANS le module Calendrier (CodMod=8)

-- ========================================
-- ADMIN PERMISSIONS (Tous accès)
-- ========================================
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canMaps, FiltreRepres, FiltreMag, FiltreChauffeur, canValid, CtrlStk, CanImp, canPDF, filtreTyp, CanShowCredit, CanPhoto, CanStatBL, CanStatBC, CanCateg, CanCarton, canHomologe, CanCRM, TotBle, canNavigateMenu, canMultiImg, canDateLivPrev, canExtraData, ChampObligClientForm)
VALUES 
('Admin', 1, 'Module Utilisateurs', 1, 1, 1, 1, 0, NULL, NULL, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Admin', 2, 'Module Messages', 1, 1, 1, 1, 0, NULL, NULL, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Admin', 3, 'Module Projets', 1, 1, 1, 1, 0, NULL, NULL, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Admin', 4, 'Module Devis', 1, 1, 1, 1, 0, 0, NULL, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Admin', 5, 'Module Commande', 1, 1, 1, 1, 0, 0, NULL, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Admin', 6, 'Module Livraison', 1, 1, 1, 1, 0, 0, 0, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Admin', 7, 'Module Facture', 1, 1, 1, 1, 0, NULL, NULL, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Admin', 30, 'Module Client', 1, 0, 0, 1, 0, 0, 0, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Admin', 31, 'Module Reglement', 1, 1, 1, 1, 0, 0, 0, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Admin', 32, 'Menu', 1, 1, 1, 1, 0, NULL, NULL, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Admin', 40, 'Module Tournée', 1, 1, 1, 1, 0, NULL, NULL, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Admin', 41, 'Module Chargement', 1, 1, 1, 1, 0, NULL, NULL, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Admin', 42, 'Module Objectif', 1, 1, 1, 1, 0, NULL, NULL, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Admin', 43, 'Module Recap', 1, 1, 1, 1, 0, NULL, NULL, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Admin', 44, 'Module Relevé', 1, 1, 1, 1, 0, NULL, NULL, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Admin', 45, 'Module visite', 1, 1, 1, 1, 0, 0, NULL, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Admin', 46, 'Stock', 1, 1, 1, 1, 0, 0, 0, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Admin', 47, 'soldeClient', 1, 1, 1, 1, 0, 0, NULL, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Admin', 52, 'Maps', 1, 1, 1, 1, 0, 0, 0, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- ========================================
-- AGENT PERMISSIONS
-- ========================================
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canMaps, FiltreRepres, FiltreMag, FiltreChauffeur, canValid, CtrlStk, CanImp, canPDF, filtreTyp, CanShowCredit, CanPhoto, CanStatBL, CanStatBC, CanCateg, CanCarton, canHomologe, CanCRM, TotBle, canNavigateMenu, canMultiImg, canDateLivPrev, canExtraData, ChampObligClientForm)
VALUES 
('Agent', 1, 'Module Utilisateurs', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Agent', 2, 'Module Messages', 1, 1, 1, 0, 0, NULL, NULL, NULL, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Agent', 4, 'Module Devis', 1, 1, 1, 0, 0, 0, NULL, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Agent', 5, 'Module Commande', 1, 1, 1, 0, 0, 0, NULL, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Agent', 6, 'Module Livraison', 1, 1, 1, 0, 0, 0, 0, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Agent', 7, 'Module Facture', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Agent', 30, 'Module Client', 1, 1, 1, 0, 0, 0, 0, NULL, 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Agent', 31, 'Module Reglement', 1, 1, 1, 0, 0, 0, 0, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Agent', 32, 'Menu', 1, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Agent', 40, 'Module Tournée', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Agent', 41, 'Module Chargement', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Agent', 42, 'Module Objectif', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Agent', 43, 'Module Recap', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Agent', 44, 'Module Relevé', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Agent', 45, 'Module visite', 1, 1, 1, 0, 0, 0, NULL, NULL, 0, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Agent', 46, 'Stock', 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Agent', 47, 'soldeClient', 1, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Agent', 52, 'Maps', 1, 1, 0, 0, 0, 0, 0, NULL, 1, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- ========================================
-- CLIENT PERMISSIONS (Lecture seule)
-- ========================================
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canMaps, FiltreRepres, FiltreMag, FiltreChauffeur, canValid, CtrlStk, CanImp, canPDF, filtreTyp, CanShowCredit, CanPhoto, CanStatBL, CanStatBC, CanCateg, CanCarton, canHomologe, CanCRM, TotBle, canNavigateMenu, canMultiImg, canDateLivPrev, canExtraData, ChampObligClientForm)
VALUES 
('Client', 1, 'Module Utilisateurs', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Client', 2, 'Module Messages', 1, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Client', 4, 'Module Devis', 1, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, 0, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Client', 5, 'Module Commande', 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Client', 6, 'Module Livraison', 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Client', 7, 'Module Facture', 1, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Client', 30, 'Module Client', 1, 0, 0, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Client', 31, 'Module Reglement', 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Client', 32, 'Menu', 1, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Client', 40, 'Module Tournée', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Client', 41, 'Module Chargement', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Client', 42, 'Module Objectif', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Client', 43, 'Module Recap', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Client', 44, 'Module Relevé', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Client', 45, 'Module visite', 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Client', 46, 'Stock', 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Client', 47, 'soldeClient', 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Client', 52, 'Maps', 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- ========================================
-- COMMERCIALE PERMISSIONS
-- ========================================
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canMaps, FiltreRepres, FiltreMag, FiltreChauffeur, canValid, CtrlStk, CanImp, canPDF, filtreTyp, CanShowCredit, CanPhoto, CanStatBL, CanStatBC, CanCateg, CanCarton, canHomologe, CanCRM, TotBle, canNavigateMenu, canMultiImg, canDateLivPrev, canExtraData, ChampObligClientForm)
VALUES 
('Commerciale', 1, 'Module Utilisateurs', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Commerciale', 2, 'Module Messages', 1, 1, 1, 0, 0, NULL, NULL, NULL, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Commerciale', 4, 'Module Devis', 1, 1, 0, 0, 0, 0, NULL, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Commerciale', 5, 'Module Commande', 1, 1, 0, 0, 0, 0, NULL, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Commerciale', 6, 'Module Livraison', 1, 1, 0, 0, 0, 0, 0, NULL, 0, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Commerciale', 7, 'Module Facture', 1, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Commerciale', 30, 'Module Client', 1, 1, 1, 0, 0, 0, 0, NULL, 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Commerciale', 31, 'Module Reglement', 1, 1, 0, 0, 0, 0, 0, NULL, 1, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Commerciale', 32, 'Menu', 1, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Commerciale', 40, 'Module Tournée', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Commerciale', 41, 'Module Chargement', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Commerciale', 42, 'Module Objectif', 1, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Commerciale', 43, 'Module Recap', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Commerciale', 44, 'Module Relevé', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Commerciale', 45, 'Module visite', 1, 1, 0, 0, 0, 0, NULL, NULL, 0, 0, 1, 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Commerciale', 46, 'Stock', 0, 0, 0, 0, 0, 0, 0, NULL, 1, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Commerciale', 47, 'soldeClient', 1, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Commerciale', 52, 'Maps', 1, 1, 0, 0, 0, 0, 0, NULL, 1, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- ========================================
-- TECHNICIEN PERMISSIONS
-- ========================================
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canMaps, FiltreRepres, FiltreMag, FiltreChauffeur, canValid, CtrlStk, CanImp, canPDF, filtreTyp, CanShowCredit, CanPhoto, CanStatBL, CanStatBC, CanCateg, CanCarton, canHomologe, CanCRM, TotBle, canNavigateMenu, canMultiImg, canDateLivPrev, canExtraData, ChampObligClientForm)
VALUES 
('Technicien', 1, 'Module Utilisateurs', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Technicien', 2, 'Module Messages', 1, 0, 1, 0, 0, NULL, NULL, NULL, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Technicien', 4, 'Module Devis', 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Technicien', 5, 'Module Commande', 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Technicien', 6, 'Module Livraison', 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Technicien', 7, 'Module Facture', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Technicien', 30, 'Module Client', 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Technicien', 31, 'Module Reglement', 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Technicien', 32, 'Menu', 1, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Technicien', 40, 'Module Tournée', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Technicien', 41, 'Module Chargement', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Technicien', 42, 'Module Objectif', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Technicien', 43, 'Module Recap', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Technicien', 44, 'Module Relevé', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Technicien', 45, 'Module visite', 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Technicien', 46, 'Stock', 1, 0, 1, 0, 0, 0, 0, NULL, 1, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Technicien', 47, 'soldeClient', 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Technicien', 52, 'Maps', 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, 0, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- ========================================
-- VÉRIFICATION
-- ========================================
-- Vérifier combien de permissions ont été insérées
SELECT COUNT(*) as 'Total Permissions' FROM TabAWProfileAccess;

-- Voir par rôle
SELECT ProfileUser, COUNT(*) as 'Nombre de Modules' FROM TabAWProfileAccess GROUP BY ProfileUser;

-- Voir les modules actifs par rôle
SELECT ProfileUser, COUNT(*) as 'Modules Actifs' 
FROM TabAWProfileAccess 
WHERE Actif = 1 
GROUP BY ProfileUser 
ORDER BY ProfileUser;

-- Voir le calendrier (doit être vide)
SELECT * FROM TabAWProfileAccess WHERE CodMod = 8;
