-- ═════════════════════════════════════════════════════════════════
-- 🔧 AJOUTER MODULES UTILISATEURS (1) ET MESSAGES (2)
-- ═════════════════════════════════════════════════════════════════

-- Vérifier les modules existants
SELECT ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt
FROM TabAWProfileAccess
WHERE CodMod IN (1, 2)
ORDER BY ProfileUser, CodMod;

-- Module Utilisateurs (CodMod=1)
UPDATE TabAWProfileAccess
SET LibMod = 'Module Utilisateurs',
	Actif = 1,
	canAdd = 1,
	canEdit = 1,
	canDelt = 1,
	canValid = 1,
	CanImp = 1,
	canPDF = 1
WHERE ProfileUser = 'Admin' AND CodMod = 1;

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Admin', 1, 'Module Utilisateurs', 1, 1, 1, 1, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser = 'Admin' AND CodMod = 1);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Agent', 1, 'Module Utilisateurs', 0, 0, 0, 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser = 'Agent' AND CodMod = 1);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Commerciale', 1, 'Module Utilisateurs', 0, 0, 0, 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser = 'Commerciale' AND CodMod = 1);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Client', 1, 'Module Utilisateurs', 0, 0, 0, 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser = 'Client' AND CodMod = 1);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Technicien', 1, 'Module Utilisateurs', 0, 0, 0, 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser = 'Technicien' AND CodMod = 1);

-- Module Messages (CodMod=2)
INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Admin', 2, 'Module Messages', 1, 1, 1, 1, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser = 'Admin' AND CodMod = 2);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Agent', 2, 'Module Messages', 1, 1, 1, 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser = 'Agent' AND CodMod = 2);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Commerciale', 2, 'Module Messages', 1, 1, 1, 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser = 'Commerciale' AND CodMod = 2);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Client', 2, 'Module Messages', 1, 0, 0, 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser = 'Client' AND CodMod = 2);

INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt, canValid, CanImp, canPDF)
SELECT 'Technicien', 2, 'Module Messages', 1, 0, 1, 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser = 'Technicien' AND CodMod = 2);

-- Vérifier les résultats
SELECT ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt
FROM TabAWProfileAccess
WHERE CodMod IN (1, 2)
ORDER BY CodMod, ProfileUser;

PRINT '✅ Modules Utilisateurs (1) et Messages (2) ajoutés.';
