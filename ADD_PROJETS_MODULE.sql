-- ═════════════════════════════════════════════════════════════════
-- 🔧 AJOUTER MODULE PROJETS (CodMod=3) DANS TabAWProfileAccess
-- ═════════════════════════════════════════════════════════════════

-- Vérifier si le module Projets existe déjà
SELECT * FROM TabAWProfileAccess WHERE CodMod = 3;

-- Ajouter le module Projets pour TOUS les rôles
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Admin', 3, 'Module Projets', 1, 1, 1, 1, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser = 'Admin' AND CodMod = 3);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Agent', 3, 'Module Projets', 1, 1, 1, 0, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser = 'Agent' AND CodMod = 3);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Commerciale', 3, 'Module Projets', 1, 1, 1, 0, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser = 'Commerciale' AND CodMod = 3);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Client', 3, 'Module Projets', 1, 0, 0, 0, 0, 0, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser = 'Client' AND CodMod = 3);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Technicien', 3, 'Module Projets', 0, 0, 0, 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser = 'Technicien' AND CodMod = 3);

-- Vérifier les résultats
SELECT ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt
FROM TabAWProfileAccess 
WHERE CodMod = 3
ORDER BY ProfileUser;

PRINT '✅ Module Projets ajouté! Rafraîchissez le frontend.';
