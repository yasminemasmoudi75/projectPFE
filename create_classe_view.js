const { sequelize } = require('./src/config/database');

async function createClasseView() {
  const sql = `
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
    DocCounts AS (
        SELECT 
            IDContact,
            COUNT(CASE WHEN type = 'Devis' THEN 1 END) as TotalDevis,
            COUNT(CASE WHEN type = 'BC' THEN 1 END) as TotalBC,
            COUNT(CASE WHEN type = 'BL' THEN 1 END) as TotalBL,
            COUNT(CASE WHEN type = 'FAV' THEN 1 END) as TotalFAV,
            COUNT(CASE WHEN type = 'Devis' AND NOT EXISTS (SELECT 1 FROM dbo.tablinkeddoc L WHERE L.Guidbl = Guid) THEN 1 END) as DevisNonTransfo,
            COUNT(CASE WHEN type = 'BC' AND NOT EXISTS (SELECT 1 FROM dbo.tablinkeddoc L WHERE L.Guidbl = Guid) THEN 1 END) as BCNonLivres
        FROM (
            SELECT IDContact, Guid, 'Devis' as type FROM dbo.tabdevm
            UNION ALL SELECT IDContact, Guid, 'BC' FROM dbo.tabbcvm
            UNION ALL SELECT IDContact, Guid, 'BL' FROM dbo.tabblvm
            UNION ALL SELECT IDContact, Guid, 'FAV' FROM dbo.tabfavm
        ) AS AllDocs
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
  `;

  try {
    console.log('🚀 Tentative de création via exécution séquentielle...');
    // Sequelize ne supporte pas 'GO', on doit séparer les commandes
    const parts = sql.split('GO');
    for (const part of parts) {
        if (part.trim()) {
            await sequelize.query(part);
        }
    }
    console.log('✅ Vue créée avec succès !');
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

createClasseView();
