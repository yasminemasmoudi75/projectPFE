USE [AA];
GO
IF OBJECT_ID('dbo.ViewCalculClasseContact', 'V') IS NOT NULL
    DROP VIEW dbo.ViewCalculClasseContact;
GO
CREATE VIEW dbo.ViewCalculClasseContact AS
WITH 
SalesStats AS (
    SELECT IDContact, SUM(TotTTC) as CA, MAX(MDate) as LastDate
    FROM (
        SELECT IDContact, TotTTC, MDate FROM dbo.tabblvm
        UNION ALL
        SELECT IDContact, TotTTC, MDate FROM dbo.tabfavm
    ) AS AllSales
    GROUP BY IDContact
),
AllDocsPrepared AS (
    -- On prépare tous les docs avec une colonne "isTransformed" calculée au préalable
    SELECT D.IDContact, D.Guid, 'Devis' as type, 
           CASE WHEN EXISTS (SELECT 1 FROM dbo.tablinkeddoc L WHERE L.Guidbl = D.Guid) THEN 1 ELSE 0 END as isTransformed
    FROM dbo.tabdevm D
    UNION ALL
    SELECT B.IDContact, B.Guid, 'BC' as type,
           CASE WHEN EXISTS (SELECT 1 FROM dbo.tablinkeddoc L WHERE L.Guidbl = B.Guid) THEN 1 ELSE 0 END as isTransformed
    FROM dbo.tabbcvm B
    UNION ALL
    SELECT IDContact, Guid, 'BL' as type, 1 as isTransformed FROM dbo.tabblvm
    UNION ALL
    SELECT IDContact, Guid, 'FAV' as type, 1 as isTransformed FROM dbo.tabfavm
),
DocCounts AS (
    SELECT 
        IDContact,
        COUNT(CASE WHEN type = 'Devis' THEN 1 END) as TotalDevis,
        COUNT(CASE WHEN type = 'BC' THEN 1 END) as TotalBC,
        COUNT(CASE WHEN type = 'BL' THEN 1 END) as TotalBL,
        COUNT(CASE WHEN type = 'FAV' THEN 1 END) as TotalFAV,
        COUNT(CASE WHEN type = 'Devis' AND isTransformed = 0 THEN 1 END) as DevisNonTransfo,
        COUNT(CASE WHEN type = 'BC' AND isTransformed = 0 THEN 1 END) as BCNonLivres
    FROM AllDocsPrepared
    GROUP BY IDContact
)
SELECT
    C.ID as idcontact,
    ISNULL(S.CA, 0) as CA,
    CASE
        WHEN ISNULL(D.TotalDevis, 0) + ISNULL(D.TotalBC, 0) + ISNULL(D.TotalBL, 0) + ISNULL(D.TotalFAV, 0) = 0 THEN 'Prospect'
        WHEN S.LastDate IS NOT NULL AND S.LastDate < DATEADD(year, -1, GETDATE()) THEN 'Inactif'
        WHEN S.CA > 100000 THEN 'Diamant'
        WHEN S.CA > 50000 OR ISNULL(D.BCNonLivres, 0) >= 3 THEN 'Gold'
        WHEN S.CA > 0 AND S.CA <= 50000 THEN 'Silver'
        WHEN ISNULL(D.DevisNonTransfo, 0) >= 1 THEN 'Passif'
        ELSE 'Non Classifié'
    END AS ClasseCalculee
FROM dbo.TabTiersContact C
LEFT JOIN SalesStats S ON S.IDContact = CAST(C.ID AS varchar(50))
LEFT JOIN DocCounts D ON D.IDContact = CAST(C.ID AS varchar(50));
GO
