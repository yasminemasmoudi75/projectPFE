-- Script pour ajouter/mettre à jour le module SAV dans les permissions
-- Suppression des anciens enregistrements SAV
DELETE FROM TABAWPROFILEACCESS WHERE CodMod = 31;

-- Insertions des accès pour chaque rôle

-- Row 1 - SAV pour Admin (accès complet)
INSERT INTO TABAWPROFILEACCESS (
    ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canMaps, 
    FiltreRepres, FiltreMag, FiltreChauffeur, canValid, CtrlStk, CanImp, canPDF, filtreTyp, 
    CanShowCredit, CanPhoto, CanStatBL, CanStatBC, CanCateg, CanCarton, canHomologe, CanCRM, 
    TotBle, canNavigateMenu, canMultiImg, canDateLivPrev, canExtraData, ChampObligClientForm, 
    canViewSuiviVente, canEditCommunication, canDeleteCommunication, canNotify, ViewFiltreMag, 
    ViewFiltreRepres, ViewFiltreChauffeur, canModifyAllUser, CanEditBase, CanValidationBL, CanEditBL
) VALUES (
    'Admin', 31, 'Module SAV', 1, 1, 1, 1, 0, 
    NULL, NULL, NULL, 1, 0, 1, 1, NULL, 
    0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 
    NULL, NULL, NULL, NULL, NULL, NULL, 
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
);

-- Row 2 - SAV pour Agent
INSERT INTO TABAWPROFILEACCESS (
    ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canMaps, 
    FiltreRepres, FiltreMag, FiltreChauffeur, canValid, CtrlStk, CanImp, canPDF, filtreTyp, 
    CanShowCredit, CanPhoto, CanStatBL, CanStatBC, CanCateg, CanCarton, canHomologe, CanCRM, 
    TotBle, canNavigateMenu, canMultiImg, canDateLivPrev, canExtraData, ChampObligClientForm, 
    canViewSuiviVente, canEditCommunication, canDeleteCommunication, canNotify, ViewFiltreMag, 
    ViewFiltreRepres, ViewFiltreChauffeur, canModifyAllUser, CanEditBase, CanValidationBL, CanEditBL
) VALUES (
    'Agent', 31, 'Module SAV', 1, 1, 1, 0, 0, 
    NULL, NULL, NULL, 0, 0, 0, 0, NULL, 
    0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 
    NULL, NULL, NULL, NULL, NULL, NULL, 
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
);

-- Row 3 - SAV pour Client
INSERT INTO TABAWPROFILEACCESS (
    ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canMaps, 
    FiltreRepres, FiltreMag, FiltreChauffeur, canValid, CtrlStk, CanImp, canPDF, filtreTyp, 
    CanShowCredit, CanPhoto, CanStatBL, CanStatBC, CanCateg, CanCarton, canHomologe, CanCRM, 
    TotBle, canNavigateMenu, canMultiImg, canDateLivPrev, canExtraData, ChampObligClientForm, 
    canViewSuiviVente, canEditCommunication, canDeleteCommunication, canNotify, ViewFiltreMag, 
    ViewFiltreRepres, ViewFiltreChauffeur, canModifyAllUser, CanEditBase, CanValidationBL, CanEditBL
) VALUES (
    'Client', 31, 'Module SAV', 0, 0, 0, 0, 0, 
    NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 
    0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 
    NULL, NULL, NULL, NULL, NULL, NULL, 
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
);

-- Row 4 - SAV pour Commerciale (HIDDEN - accès désactivé)
INSERT INTO TABAWPROFILEACCESS (
    ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canMaps, 
    FiltreRepres, FiltreMag, FiltreChauffeur, canValid, CtrlStk, CanImp, canPDF, filtreTyp, 
    CanShowCredit, CanPhoto, CanStatBL, CanStatBC, CanCateg, CanCarton, canHomologe, CanCRM, 
    TotBle, canNavigateMenu, canMultiImg, canDateLivPrev, canExtraData, ChampObligClientForm, 
    canViewSuiviVente, canEditCommunication, canDeleteCommunication, canNotify, ViewFiltreMag, 
    ViewFiltreRepres, ViewFiltreChauffeur, canModifyAllUser, CanEditBase, CanValidationBL, CanEditBL
) VALUES (
    'Commerciale', 31, 'Module SAV', 0, 0, 0, 0, 0, 
    NULL, NULL, NULL, 0, 0, 0, 0, NULL, 
    0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 
    NULL, NULL, NULL, NULL, NULL, NULL, 
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
);

-- Row 5 - SAV pour Technicien
INSERT INTO TABAWPROFILEACCESS (
    ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canMaps, 
    FiltreRepres, FiltreMag, FiltreChauffeur, canValid, CtrlStk, CanImp, canPDF, filtreTyp, 
    CanShowCredit, CanPhoto, CanStatBL, CanStatBC, CanCateg, CanCarton, canHomologe, CanCRM, 
    TotBle, canNavigateMenu, canMultiImg, canDateLivPrev, canExtraData, ChampObligClientForm, 
    canViewSuiviVente, canEditCommunication, canDeleteCommunication, canNotify, ViewFiltreMag, 
    ViewFiltreRepres, ViewFiltreChauffeur, canModifyAllUser, CanEditBase, CanValidationBL, CanEditBL
) VALUES (
    'Technicien', 31, 'Module SAV', 1, 1, 1, 0, 0, 
    NULL, NULL, NULL, 0, 0, 0, 0, NULL, 
    0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 
    NULL, NULL, NULL, NULL, NULL, NULL, 
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
);

-- Vérification - afficher les entrées ajoutées
SELECT * FROM TABAWPROFILEACCESS WHERE CodMod = 31 AND LibMod = 'Module SAV';
