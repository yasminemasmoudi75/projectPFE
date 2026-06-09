/**
 * Script de vérification : colonne SignatureData dans TabDevm
 * Usage (depuis la racine du projet) : node backend/scripts/check-signature-column.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { Sequelize, QueryTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_DATABASE || 'AA',
  process.env.DB_USER     || 'sa',
  process.env.DB_PASSWORD || '123456789',
  {
    host:    process.env.DB_SERVER || '127.0.0.1',
    port:    parseInt(process.env.DB_PORT || '1433'),
    dialect: 'mssql',
    logging: false,
    dialectOptions: {
      options: {
        encrypt:                  false,
        trustServerCertificate:   true,
        requestTimeout:           15000,
        connectTimeout:           15000,
      },
    },
  }
);

async function run() {
  try {
    console.log('\n🔌  Connexion à SQL Server...');
    console.log(`    Serveur    : ${process.env.DB_SERVER || '127.0.0.1'}:${process.env.DB_PORT || 1433}`);
    console.log(`    Base       : ${process.env.DB_DATABASE || 'AA'}`);
    console.log(`    Utilisateur: ${process.env.DB_USER || 'sa'}\n`);

    await sequelize.authenticate();
    console.log('✅  Connexion réussie\n');

    // ── 1. Vérifier si la colonne existe ────────────────────────────────────
    const cols = await sequelize.query(`
      SELECT
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME  = 'TabDevm'
        AND COLUMN_NAME = 'SignatureData'
    `, { type: QueryTypes.SELECT });

    if (cols.length === 0) {
      console.log('⚠️   Colonne SignatureData introuvable dans TabDevm.');
      console.log('    → Création automatique...\n');

      await sequelize.query(
        `ALTER TABLE TabDevm ADD SignatureData NVARCHAR(MAX) NULL`,
        { type: QueryTypes.RAW }
      );

      console.log('✅  Colonne SignatureData créée avec succès !\n');
    } else {
      const c = cols[0];
      const len = c.CHARACTER_MAXIMUM_LENGTH === -1 ? 'MAX' : c.CHARACTER_MAXIMUM_LENGTH;
      console.log('✅  Colonne SignatureData EXISTE déjà :\n');
      console.log(`    Nom          : ${c.COLUMN_NAME}`);
      console.log(`    Type SQL     : ${c.DATA_TYPE.toUpperCase()}`);
      console.log(`    Longueur max : ${len}`);
      console.log(`    Nullable     : ${c.IS_NULLABLE}`);
    }

    // ── 2. Statistiques ─────────────────────────────────────────────────────
    const [stats] = await sequelize.query(`
      SELECT
        COUNT(*)                                                     AS total_devis,
        SUM(CASE WHEN SignatureData IS NOT NULL THEN 1 ELSE 0 END)   AS avec_signature,
        SUM(CASE WHEN SignatureData IS NULL     THEN 1 ELSE 0 END)   AS sans_signature
      FROM TabDevm
    `, { type: QueryTypes.SELECT });

    console.log('\n── Statistiques TabDevm ──────────────────────────────');
    console.log(`   Total devis    : ${stats.total_devis}`);
    console.log(`   Avec signature : ${stats.avec_signature}`);
    console.log(`   Sans signature : ${stats.sans_signature}`);

    // ── 3. 5 derniers devis ─────────────────────────────────────────────────
    const recent = await sequelize.query(`
      SELECT TOP 5
        Nf, Prfx, LibTiers, DatUser,
        CASE WHEN SignatureData IS NOT NULL THEN '✅ Signé' ELSE '—' END AS Sig
      FROM TabDevm
      ORDER BY DatUser DESC
    `, { type: QueryTypes.SELECT });

    if (recent.length > 0) {
      console.log('\n── 5 derniers devis ──────────────────────────────────');
      recent.forEach(r => {
        const date = r.DatUser ? new Date(r.DatUser).toLocaleDateString('fr-FR') : '—';
        const lib  = (r.LibTiers || '—').substring(0, 22).padEnd(22);
        console.log(`   N°${String(r.Nf).padEnd(6)}  ${(r.Prfx || 'DV').padEnd(5)}  ${lib}  ${date.padEnd(12)}  ${r.Sig}`);
      });
    }

    console.log('\n──────────────────────────────────────────────────────\n');

  } catch (err) {
    console.error('\n❌  Erreur :', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌  Connexion fermée.\n');
  }
}

run();
