-- ===================================================================
-- SCRIPT SQL: Ajouter données TEST pour Réglement
-- ===================================================================
-- Ajoute 3 réglement avec statuts différents pour tester
-- ===================================================================

-- Assurez-vous qu'il y a des clients dans TabTiers sinon ça ne marche pas!
-- SELECT TOP 5 * FROM TabTiers

-- OPTION 1: Utiliser des clients existants
-- Décommenter et adapter les CodTiers selon vos données

-- 1️⃣ RÉGLEMENT #1 - NON PAYÉ
INSERT INTO TabReg (DatReg, CodTiers, LibTiers, MntReg, Payed, CUser, DatUser)
SELECT 
    GETDATE() as DatReg,
    CodTiers,
    Name as LibTiers,
    5000.00 as MntReg,
    0 as Payed,
    'admin@test.com' as CUser,
    GETDATE() as DatUser
FROM TabTiers
WHERE CodTiers IN (
    SELECT TOP 1 CodTiers FROM TabTiers ORDER BY CodTiers
)
AND NOT EXISTS (
    SELECT 1 FROM TabReg WHERE CodTiers = TabTiers.CodTiers AND MntReg = 5000
)

DECLARE @IDReg1 INT = SCOPE_IDENTITY()
INSERT INTO TabRegD (IDReg, MntDebit, MntCredit, ModReg, DatValeur, Banque, NumCompte, Montant)
VALUES (@IDReg1, 5000, 0, 'Non encore reçu', NULL, '', '', 5000)

PRINT '✅ Réglement #1 (Non payé) créé: 5000€'

-- 2️⃣ RÉGLEMENT #2 - PARTIELLEMENT PAYÉ
INSERT INTO TabReg (DatReg, CodTiers, LibTiers, MntReg, Payed, CUser, DatUser)
SELECT 
    GETDATE() as DatReg,
    CodTiers,
    Name as LibTiers,
    10000.00 as MntReg,
    0 as Payed,
    'admin@test.com' as CUser,
    GETDATE() as DatUser
FROM TabTiers
WHERE CodTiers IN (
    SELECT TOP 1 CodTiers FROM TabTiers WHERE CodTiers NOT IN (
        SELECT CodTiers FROM TabReg WHERE MntReg = 5000
    ) ORDER BY CodTiers
)
AND NOT EXISTS (
    SELECT 1 FROM TabReg WHERE CodTiers = TabTiers.CodTiers AND MntReg = 10000
)

DECLARE @IDReg2 INT = SCOPE_IDENTITY()
INSERT INTO TabRegD (IDReg, MntDebit, MntCredit, ModReg, DatValeur, Banque, NumCompte, Montant)
VALUES (@IDReg2, 10000, 6000, 'Virement partiel', GETDATE(), 'BNP Paribas', 'FR12 3456 7890', 10000)

INSERT INTO TabRegF (IDReg, NumPiece, MDate, MntPiece, Solde, TypPiece)
VALUES (@IDReg2, 'FAV-2024-001', GETDATE(), 10000, 4000, 'Facture')

PRINT '✅ Réglement #2 (Partiellement payé 60%) créé: 10000€ (reçu 6000€)'

-- 3️⃣ RÉGLEMENT #3 - PAYÉ
INSERT INTO TabReg (DatReg, CodTiers, LibTiers, MntReg, Payed, CUser, DatUser)
SELECT 
    GETDATE() as DatReg,
    CodTiers,
    Name as LibTiers,
    3500.00 as MntReg,
    1 as Payed,
    'admin@test.com' as CUser,
    GETDATE() as DatUser
FROM TabTiers
WHERE CodTiers IN (
    SELECT TOP 1 CodTiers FROM TabTiers WHERE CodTiers NOT IN (
        SELECT CodTiers FROM TabReg WHERE MntReg IN (5000, 10000)
    ) ORDER BY CodTiers
)
AND NOT EXISTS (
    SELECT 1 FROM TabReg WHERE CodTiers = TabTiers.CodTiers AND MntReg = 3500
)

DECLARE @IDReg3 INT = SCOPE_IDENTITY()
INSERT INTO TabRegD (IDReg, MntDebit, MntCredit, ModReg, DatValeur, Banque, NumCompte, Montant)
VALUES (@IDReg3, 3500, 3500, 'Virement complet', GETDATE(), 'Crédit Agricole', 'FR34 5678 9012', 3500)

INSERT INTO TabRegF (IDReg, NumPiece, MDate, MntPiece, Solde, TypPiece)
VALUES (@IDReg3, 'FAV-2024-002', GETDATE(), 3500, 0, 'Facture')

PRINT '✅ Réglement #3 (Payé 100%) créé: 3500€'

-- =================================================================
-- VÉRIFICATION
-- =================================================================

PRINT ''
PRINT '📊 RÉGLEMENT DE TEST CRÉÉS:'
PRINT '═══════════════════════════════════════════════════════════'

SELECT 
    IDReg,
    DatReg,
    LibTiers,
    MntReg as 'Montant Total',
    CASE 
        WHEN Payed = 1 THEN 'Payé ✅'
        ELSE 'Non payé ❌'
    END as 'Statut',
    CUser,
    DatUser
FROM TabReg
WHERE CUser = 'admin@test.com'
AND DatUser >= DATEADD(MINUTE, -5, GETDATE())
ORDER BY IDReg DESC;

PRINT ''
PRINT '💳 DÉTAILS DES PAIEMENTS:'
PRINT '═══════════════════════════════════════════════════════════'

SELECT 
    d.IDReg,
    d.MntDebit as 'Montant débité',
    d.MntCredit as 'Montant crédité',
    (d.MntDebit - d.MntCredit) as 'Solde restant',
    CAST(ROUND((d.MntCredit * 100.0 / NULLIF(d.MntDebit, 0)), 0) AS INT) as 'Pourcentage %',
    d.ModReg,
    d.DatValeur
FROM TabRegD d
JOIN TabReg r ON d.IDReg = r.IDReg
WHERE r.CUser = 'admin@test.com'
ORDER BY d.IDReg DESC;

PRINT ''
PRINT '🎯 PIÈCES RATTACHÉES:'
PRINT '═══════════════════════════════════════════════════════════'

SELECT 
    f.IDReg,
    f.NumPiece,
    f.MntPiece,
    f.Solde as 'Solde restant',
    f.TypPiece
FROM TabRegF f
JOIN TabReg r ON f.IDReg = r.IDReg
WHERE r.CUser = 'admin@test.com'
ORDER BY f.IDReg DESC;

PRINT ''
PRINT '✨ Pour afficher vos réglement en frontend:'
PRINT '   → Allez à /reglements (après login)'
PRINT '   → Vous verrez les 3 réglement de test'
PRINT ''
