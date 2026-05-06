const { sequelize } = require('./src/config/database');

async function createTierClasseView() {
  const sql = `
    IF OBJECT_ID('dbo.ViewCalculClasseTiers', 'V') IS NOT NULL
        DROP VIEW dbo.ViewCalculClasseTiers;
    GO
    CREATE VIEW dbo.ViewCalculClasseTiers AS
    WITH 
    SalesStats AS (
        SELECT CodTiers, SUM(TotTTC) as CA, MAX(MDate) as LastDate
        FROM (
            SELECT CodTiers, TotTTC, MDate FROM dbo.tabblvm
            UNION ALL
            SELECT CodTiers, TotTTC, MDate FROM dbo.tabfavm
        ) AS AllSales
        GROUP BY CodTiers
    ),
    AllDocsPrepared AS (
        SELECT CodTiers, Guid, 'Devis' as type,
               CASE WHEN EXISTS (SELECT 1 FROM dbo.tablinkeddoc L WHERE L.Guidbl = D.Guid) THEN 1 ELSE 0 END as isTransformed
        FROM dbo.tabdevm D
        UNION ALL
        SELECT CodTiers, Guid, 'BC' as type,
               CASE WHEN EXISTS (SELECT 1 FROM dbo.tablinkeddoc L WHERE L.Guidbl = B.Guid) THEN 1 ELSE 0 END as isTransformed
        FROM dbo.tabbcvm B
        UNION ALL
        SELECT CodTiers, Guid, 'BL' as type, 1 as isTransformed FROM dbo.tabblvm
        UNION ALL
        SELECT CodTiers, Guid, 'FAV' as type, 1 as isTransformed FROM dbo.tabfavm
    ),
    DocCounts AS (
        SELECT 
            CodTiers,
            COUNT(CASE WHEN type = 'Devis' THEN 1 END) as TotalDevis,
            COUNT(CASE WHEN type = 'BC' THEN 1 END) as TotalBC,
            COUNT(CASE WHEN type = 'BL' THEN 1 END) as TotalBL,
            COUNT(CASE WHEN type = 'FAV' THEN 1 END) as TotalFAV,
            COUNT(CASE WHEN type = 'Devis' AND isTransformed = 0 THEN 1 END) as DevisNonTransfo,
            COUNT(CASE WHEN type = 'BC' AND isTransformed = 0 THEN 1 END) as BCNonLivres
        FROM AllDocsPrepared
        GROUP BY CodTiers
    )
    SELECT
        T.CodTiers,
        ISNULL(S.CA, 0) as CA,
        CASE
            WHEN ISNULL(D.TotalDevis, 0) + ISNULL(D.TotalBC, 0) + ISNULL(D.TotalBL, 0) + ISNULL(D.TotalFAV, 0) = 0 THEN 'Prospect'
            WHEN S.LastDate IS NOT NULL AND S.LastDate < DATEADD(year, -1, GETDATE()) THEN 'Inactif'
            WHEN S.CA > 100000 THEN 'Diamant'
            WHEN S.CA > 50000 OR ISNULL(D.BCNonLivres, 0) >= 3 THEN 'Gold'
            WHEN S.CA > 0 AND S.CA <= 50000 THEN 'Silver'
            WHEN ISNULL(D.DevisNonTransfo, 0) >= 1 THEN 'Passif'
            ELSE 'Silver'
        END AS ClasseCalculee
    FROM dbo.TabTiers T
    LEFT JOIN SalesStats S ON S.CodTiers = T.CodTiers
    LEFT JOIN DocCounts D ON D.CodTiers = T.CodTiers;
  `;

  try {
    console.log('🚀 Création de ViewCalculClasseTiers...');
    const parts = sql.split('GO');
    for (const part of parts) {
        if (part.trim()) {
            await sequelize.query(part);
        }
    }
    console.log('✅ Vue ViewCalculClasseTiers créée avec succès !');
  } catch (error) {
    console.error('❌ Erreur SQL');
    if (error.original) {
        console.error('MESSAGE :', error.original.message);
    } else {
        console.error(error);
    }
  } finally {
    process.exit();
  }
}

createTierClasseView();
