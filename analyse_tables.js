const { sequelize } = require('./src/models');
const { QueryTypes } = require('sequelize');

async function analyseTables() {
    console.log('='.repeat(60));
    console.log('   ANALYSE COMPLÈTE DES TABLES - BASE DE DONNÉES AA');
    console.log('='.repeat(60) + '\n');

    try {
        await sequelize.authenticate();
        console.log('✅ Connexion réussie\n');
    } catch (err) {
        console.error('❌ Connexion échouée:', err.message);
        return;
    }

    // 1. Lister TOUTES les tables
    console.log('--- 📋 LISTE DE TOUTES LES TABLES ---');
    const allTables = await sequelize.query(
        `SELECT TABLE_NAME, TABLE_TYPE 
         FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_CATALOG = 'AA'
         ORDER BY TABLE_NAME`,
        { type: QueryTypes.SELECT }
    );

    console.log(`Total : ${allTables.length} tables/vues\n`);
    allTables.forEach(t => {
        console.log(`  [${t.TABLE_TYPE}] ${t.TABLE_NAME}`);
    });

    // 2. Rechercher tables liées à RECAP
    console.log('\n--- 🔍 TABLES LIÉES AU MODULE RECAP ---');
    const recapTables = allTables.filter(t =>
        t.TABLE_NAME.toLowerCase().includes('recap')
    );
    if (recapTables.length === 0) {
        console.log('  ⚠️ Aucune table contenant "recap" trouvée');
    } else {
        recapTables.forEach(t => console.log(`  ✅ ${t.TABLE_NAME}`));
    }

    // 3. Rechercher tables liées à VISITE
    console.log('\n--- 🔍 TABLES LIÉES AU MODULE VISITE ---');
    const visiteTables = allTables.filter(t =>
        t.TABLE_NAME.toLowerCase().includes('visite') ||
        t.TABLE_NAME.toLowerCase().includes('visit')
    );
    if (visiteTables.length === 0) {
        console.log('  ⚠️ Aucune table contenant "visite/visit" trouvée');
    } else {
        visiteTables.forEach(t => console.log(`  ✅ ${t.TABLE_NAME}`));
    }

    // 4. Rechercher tables liées à RELEVER
    console.log('\n--- 🔍 TABLES LIÉES AU MODULE RELEVER ---');
    const releverTables = allTables.filter(t =>
        t.TABLE_NAME.toLowerCase().includes('relev') ||
        t.TABLE_NAME.toLowerCase().includes('relever')
    );
    if (releverTables.length === 0) {
        console.log('  ⚠️ Aucune table contenant "relev/relever" trouvée');
    } else {
        releverTables.forEach(t => console.log(`  ✅ ${t.TABLE_NAME}`));
    }

    // 5. Colonnes de chaque table concernée
    const targetModules = ['recap', 'visite', 'visit', 'relev'];
    const interestingTables = allTables.filter(t =>
        targetModules.some(kw => t.TABLE_NAME.toLowerCase().includes(kw))
    );

    if (interestingTables.length > 0) {
        console.log('\n--- 📐 COLONNES DES TABLES TROUVÉES ---');
        for (const table of interestingTables) {
            console.log(`\n  TABLE: ${table.TABLE_NAME}`);
            const cols = await sequelize.query(
                `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
                 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_NAME = '${table.TABLE_NAME}'
                 ORDER BY ORDINAL_POSITION`,
                { type: QueryTypes.SELECT }
            );
            cols.forEach(c => {
                const len = c.CHARACTER_MAXIMUM_LENGTH ? `(${c.CHARACTER_MAXIMUM_LENGTH})` : '';
                console.log(`    - ${c.COLUMN_NAME.padEnd(30)} ${c.DATA_TYPE}${len} [${c.IS_NULLABLE}]`);
            });
            try {
                const cnt = await sequelize.query(
                    `SELECT COUNT(*) as cnt FROM ${table.TABLE_NAME}`,
                    { type: QueryTypes.SELECT }
                );
                console.log(`    → ${cnt[0].cnt} lignes`);
            } catch (e) { }
        }
    }

    // 6. Tables TAB (pattern du projet)
    console.log('\n--- 📦 TOUTES LES TABLES "Tab" (Pattern projet) ---');
    const tabTables = allTables.filter(t =>
        t.TABLE_NAME.toLowerCase().startsWith('tab')
    );
    tabTables.forEach(t => console.log(`  ${t.TABLE_NAME}`));

    // 7. Compter les lignes des tables principales
    console.log('\n--- 📊 STATISTIQUES DES TABLES PRINCIPALES ---');
    const mainTables = ['TabDevm', 'TabDevd', 'TabBcvm', 'TabBcvd',
        'TabBlvm', 'TabBlvd', 'TabFavm', 'TabFavd',
        'TabTiers', 'TabArt', 'TabUsers', 'TabActivite',
        'TabBT', 'TabDI'];
    for (const tbl of mainTables) {
        try {
            const res = await sequelize.query(
                `SELECT COUNT(*) as cnt FROM ${tbl}`,
                { type: QueryTypes.SELECT }
            );
            console.log(`  ${tbl.padEnd(20)} : ${res[0].cnt} lignes`);
        } catch (e) {
            console.log(`  ${tbl.padEnd(20)} : ❌ (table inexistante ou erreur)`);
        }
    }

    // 8. Chercher colonnes "recap" dans toutes les tables existantes
    console.log('\n--- 🔎 COLONNES "RECAP" DANS TOUTES LES TABLES ---');
    const recapCols = await sequelize.query(
        `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE COLUMN_NAME LIKE '%Recap%' OR COLUMN_NAME LIKE '%recap%'
         ORDER BY TABLE_NAME`,
        { type: QueryTypes.SELECT }
    );
    if (recapCols.length === 0) {
        console.log('  ⚠️ Aucune colonne contenant "recap" trouvée');
    } else {
        recapCols.forEach(c => console.log(`  ${c.TABLE_NAME}.${c.COLUMN_NAME} (${c.DATA_TYPE})`));
    }

    // 9. Chercher colonnes "visite" dans toutes les tables
    console.log('\n--- 🔎 COLONNES "VISITE" DANS TOUTES LES TABLES ---');
    const visiteCols = await sequelize.query(
        `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE COLUMN_NAME LIKE '%Visite%' OR COLUMN_NAME LIKE '%visite%'
         ORDER BY TABLE_NAME`,
        { type: QueryTypes.SELECT }
    );
    if (visiteCols.length === 0) {
        console.log('  ⚠️ Aucune colonne contenant "visite" trouvée');
    } else {
        visiteCols.forEach(c => console.log(`  ${c.TABLE_NAME}.${c.COLUMN_NAME} (${c.DATA_TYPE})`));
    }

    // 10. Chercher colonnes "relever" dans toutes les tables
    console.log('\n--- 🔎 COLONNES "RELEVER" DANS TOUTES LES TABLES ---');
    const releverCols = await sequelize.query(
        `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE COLUMN_NAME LIKE '%Relev%' OR COLUMN_NAME LIKE '%relev%'
         ORDER BY TABLE_NAME`,
        { type: QueryTypes.SELECT }
    );
    if (releverCols.length === 0) {
        console.log('  ⚠️ Aucune colonne contenant "relev" trouvée');
    } else {
        releverCols.forEach(c => console.log(`  ${c.TABLE_NAME}.${c.COLUMN_NAME} (${c.DATA_TYPE})`));
    }

    console.log('\n' + '='.repeat(60));
    console.log('               FIN DE L\'ANALYSE');
    console.log('='.repeat(60));
}

analyseTables().catch(console.error).finally(() => process.exit());
