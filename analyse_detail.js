const { sequelize } = require('./src/models');
const { QueryTypes } = require('sequelize');

async function analyseDetail() {
    console.log('='.repeat(60));
    console.log('   ANALYSE DÉTAILLÉE - MODULES RECAP / VISITE / RELEVER');
    console.log('='.repeat(60) + '\n');

    await sequelize.authenticate();

    // ====== 1. TabActivite - colonnes complètes ======
    console.log('--- 📋 TabActivite (Activités / Visites) ---');
    const actCols = await sequelize.query(
        `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
         FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TabActivite'
         ORDER BY ORDINAL_POSITION`,
        { type: QueryTypes.SELECT }
    );
    actCols.forEach(c => {
        const len = c.CHARACTER_MAXIMUM_LENGTH ? `(${c.CHARACTER_MAXIMUM_LENGTH})` : '';
        console.log(`  ${c.COLUMN_NAME.padEnd(35)} ${c.DATA_TYPE}${len} [${c.IS_NULLABLE}]`);
    });
    const actCount = await sequelize.query(`SELECT COUNT(*) as cnt FROM TabActivite`, { type: QueryTypes.SELECT });
    console.log(`  → Total: ${actCount[0].cnt} lignes`);

    // Échantillon de données
    try {
        const sample = await sequelize.query(
            `SELECT TOP 3 * FROM TabActivite ORDER BY (SELECT NULL)`,
            { type: QueryTypes.SELECT }
        );
        console.log('\n  Exemple de données:');
        sample.forEach(r => console.log('  ', JSON.stringify(r)));
    } catch (e) { }

    // ====== 2. MvtRecap ======
    console.log('\n--- 📋 MvtRecap (Module Recap) ---');
    const recapCols = await sequelize.query(
        `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
         FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MvtRecap'
         ORDER BY ORDINAL_POSITION`,
        { type: QueryTypes.SELECT }
    );
    recapCols.forEach(c => {
        const len = c.CHARACTER_MAXIMUM_LENGTH ? `(${c.CHARACTER_MAXIMUM_LENGTH})` : '';
        console.log(`  ${c.COLUMN_NAME.padEnd(35)} ${c.DATA_TYPE}${len} [${c.IS_NULLABLE}]`);
    });
    const recapCount = await sequelize.query(`SELECT COUNT(*) as cnt FROM MvtRecap`, { type: QueryTypes.SELECT });
    console.log(`  → Total: ${recapCount[0].cnt} lignes`);

    // ====== 3. TabTournerM / TabTournerD ======
    console.log('\n--- 📋 TabTournerM (Tournées Master - possiblement VISITE) ---');
    const tourMCols = await sequelize.query(
        `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
         FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TabTournerM'
         ORDER BY ORDINAL_POSITION`,
        { type: QueryTypes.SELECT }
    );
    tourMCols.forEach(c => {
        const len = c.CHARACTER_MAXIMUM_LENGTH ? `(${c.CHARACTER_MAXIMUM_LENGTH})` : '';
        console.log(`  ${c.COLUMN_NAME.padEnd(35)} ${c.DATA_TYPE}${len} [${c.IS_NULLABLE}]`);
    });
    const tourMCount = await sequelize.query(`SELECT COUNT(*) as cnt FROM TabTournerM`, { type: QueryTypes.SELECT });
    console.log(`  → Total: ${tourMCount[0].cnt} lignes`);
    try {
        const s = await sequelize.query(`SELECT TOP 2 * FROM TabTournerM`, { type: QueryTypes.SELECT });
        s.forEach(r => console.log('  ', JSON.stringify(r)));
    } catch (e) { }

    console.log('\n--- 📋 TabTournerD (Tournées Détail) ---');
    const tourDCols = await sequelize.query(
        `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
         FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TabTournerD'
         ORDER BY ORDINAL_POSITION`,
        { type: QueryTypes.SELECT }
    );
    tourDCols.forEach(c => {
        const len = c.CHARACTER_MAXIMUM_LENGTH ? `(${c.CHARACTER_MAXIMUM_LENGTH})` : '';
        console.log(`  ${c.COLUMN_NAME.padEnd(35)} ${c.DATA_TYPE}${len} [${c.IS_NULLABLE}]`);
    });
    const tourDCount = await sequelize.query(`SELECT COUNT(*) as cnt FROM TabTournerD`, { type: QueryTypes.SELECT });
    console.log(`  → Total: ${tourDCount[0].cnt} lignes`);

    console.log('\n--- 📋 TabTournerF (Tournées Résultats) ---');
    const tourFCols = await sequelize.query(
        `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
         FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TabTournerF'
         ORDER BY ORDINAL_POSITION`,
        { type: QueryTypes.SELECT }
    );
    tourFCols.forEach(c => {
        const len = c.CHARACTER_MAXIMUM_LENGTH ? `(${c.CHARACTER_MAXIMUM_LENGTH})` : '';
        console.log(`  ${c.COLUMN_NAME.padEnd(35)} ${c.DATA_TYPE}${len} [${c.IS_NULLABLE}]`);
    });
    const tourFCount = await sequelize.query(`SELECT COUNT(*) as cnt FROM TabTournerF`, { type: QueryTypes.SELECT });
    console.log(`  → Total: ${tourFCount[0].cnt} lignes`);
    try {
        const s = await sequelize.query(`SELECT TOP 3 * FROM TabTournerF`, { type: QueryTypes.SELECT });
        s.forEach(r => console.log('  ', JSON.stringify(r)));
    } catch (e) { }

    console.log('\n--- 📋 TabTournerR (Tournées Relever?) ---');
    const tourRCols = await sequelize.query(
        `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
         FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TabTournerR'
         ORDER BY ORDINAL_POSITION`,
        { type: QueryTypes.SELECT }
    );
    tourRCols.forEach(c => {
        const len = c.CHARACTER_MAXIMUM_LENGTH ? `(${c.CHARACTER_MAXIMUM_LENGTH})` : '';
        console.log(`  ${c.COLUMN_NAME.padEnd(35)} ${c.DATA_TYPE}${len} [${c.IS_NULLABLE}]`);
    });
    try {
        const cnt = await sequelize.query(`SELECT COUNT(*) as cnt FROM TabTournerR`, { type: QueryTypes.SELECT });
        console.log(`  → Total: ${cnt[0].cnt} lignes`);
        const s = await sequelize.query(`SELECT TOP 3 * FROM TabTournerR`, { type: QueryTypes.SELECT });
        s.forEach(r => console.log('  ', JSON.stringify(r)));
    } catch (e) { }

    // ====== 4. TabGeoLocAction ======
    console.log('\n--- 📋 TabGeoLocAction (Géolocalisation Visites) ---');
    const geoCols = await sequelize.query(
        `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
         FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TabGeoLocAction'
         ORDER BY ORDINAL_POSITION`,
        { type: QueryTypes.SELECT }
    );
    geoCols.forEach(c => {
        const len = c.CHARACTER_MAXIMUM_LENGTH ? `(${c.CHARACTER_MAXIMUM_LENGTH})` : '';
        console.log(`  ${c.COLUMN_NAME.padEnd(35)} ${c.DATA_TYPE}${len} [${c.IS_NULLABLE}]`);
    });
    try {
        const cnt = await sequelize.query(`SELECT COUNT(*) as cnt FROM TabGeoLocAction`, { type: QueryTypes.SELECT });
        console.log(`  → Total: ${cnt[0].cnt} lignes`);
        const s = await sequelize.query(`SELECT TOP 3 * FROM TabGeoLocAction`, { type: QueryTypes.SELECT });
        s.forEach(r => console.log('  ', JSON.stringify(r)));
    } catch (e) { console.log(`  ❌ ${e.message}`); }

    // ====== 5. TabRapportM / TabRapportRend ======
    console.log('\n--- 📋 TabRapportM (Rapports / Recap?) ---');
    const rapCols = await sequelize.query(
        `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
         FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TabRapportM'
         ORDER BY ORDINAL_POSITION`,
        { type: QueryTypes.SELECT }
    );
    rapCols.forEach(c => {
        const len = c.CHARACTER_MAXIMUM_LENGTH ? `(${c.CHARACTER_MAXIMUM_LENGTH})` : '';
        console.log(`  ${c.COLUMN_NAME.padEnd(35)} ${c.DATA_TYPE}${len} [${c.IS_NULLABLE}]`);
    });
    try {
        const cnt = await sequelize.query(`SELECT COUNT(*) as cnt FROM TabRapportM`, { type: QueryTypes.SELECT });
        console.log(`  → Total: ${cnt[0].cnt} lignes`);
        const s = await sequelize.query(`SELECT TOP 2 * FROM TabRapportM`, { type: QueryTypes.SELECT });
        s.forEach(r => console.log('  ', JSON.stringify(r)));
    } catch (e) { }

    console.log('\n--- 📋 TabRapportRend (Rapport Rendement / Récap?) ---');
    const rendCols = await sequelize.query(
        `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
         FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TabRapportRend'
         ORDER BY ORDINAL_POSITION`,
        { type: QueryTypes.SELECT }
    );
    rendCols.forEach(c => {
        const len = c.CHARACTER_MAXIMUM_LENGTH ? `(${c.CHARACTER_MAXIMUM_LENGTH})` : '';
        console.log(`  ${c.COLUMN_NAME.padEnd(35)} ${c.DATA_TYPE}${len} [${c.IS_NULLABLE}]`);
    });
    try {
        const cnt = await sequelize.query(`SELECT COUNT(*) as cnt FROM TabRapportRend`, { type: QueryTypes.SELECT });
        console.log(`  → Total: ${cnt[0].cnt} lignes`);
    } catch (e) { }

    // ====== 6. TabTiersHistory (Historique clients = relever?) ======
    console.log('\n--- 📋 TabTiersHistory (Historique Tiers - possible RELEVER) ---');
    const histCols = await sequelize.query(
        `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
         FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TabTiersHistory'
         ORDER BY ORDINAL_POSITION`,
        { type: QueryTypes.SELECT }
    );
    histCols.forEach(c => {
        const len = c.CHARACTER_MAXIMUM_LENGTH ? `(${c.CHARACTER_MAXIMUM_LENGTH})` : '';
        console.log(`  ${c.COLUMN_NAME.padEnd(35)} ${c.DATA_TYPE}${len} [${c.IS_NULLABLE}]`);
    });
    try {
        const cnt = await sequelize.query(`SELECT COUNT(*) as cnt FROM TabTiersHistory`, { type: QueryTypes.SELECT });
        console.log(`  → Total: ${cnt[0].cnt} lignes`);
        const s = await sequelize.query(`SELECT TOP 2 * FROM TabTiersHistory`, { type: QueryTypes.SELECT });
        s.forEach(r => console.log('  ', JSON.stringify(r)));
    } catch (e) { }

    // ====== 7. TabRecouv (Recouvrement - possible RELEVER) ======
    console.log('\n--- 📋 TabRecouv (Recouvrement des créances) ---');
    const recovCols = await sequelize.query(
        `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
         FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TabRecouv'
         ORDER BY ORDINAL_POSITION`,
        { type: QueryTypes.SELECT }
    );
    recovCols.forEach(c => {
        const len = c.CHARACTER_MAXIMUM_LENGTH ? `(${c.CHARACTER_MAXIMUM_LENGTH})` : '';
        console.log(`  ${c.COLUMN_NAME.padEnd(35)} ${c.DATA_TYPE}${len} [${c.IS_NULLABLE}]`);
    });
    try {
        const cnt = await sequelize.query(`SELECT COUNT(*) as cnt FROM TabRecouv`, { type: QueryTypes.SELECT });
        console.log(`  → Total: ${cnt[0].cnt} lignes`);
        const s = await sequelize.query(`SELECT TOP 2 * FROM TabRecouv`, { type: QueryTypes.SELECT });
        s.forEach(r => console.log('  ', JSON.stringify(r)));
    } catch (e) { }

    // ====== 8. TabFichClt (Fiche Client - possible RECAP Tiers) ======
    console.log('\n--- 📋 TabFichClt (Fiche Client) ---');
    const fichCols = await sequelize.query(
        `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
         FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TabFichClt'
         ORDER BY ORDINAL_POSITION`,
        { type: QueryTypes.SELECT }
    );
    fichCols.forEach(c => {
        const len = c.CHARACTER_MAXIMUM_LENGTH ? `(${c.CHARACTER_MAXIMUM_LENGTH})` : '';
        console.log(`  ${c.COLUMN_NAME.padEnd(35)} ${c.DATA_TYPE}${len} [${c.IS_NULLABLE}]`);
    });
    try {
        const cnt = await sequelize.query(`SELECT COUNT(*) as cnt FROM TabFichClt`, { type: QueryTypes.SELECT });
        console.log(`  → Total: ${cnt[0].cnt} lignes`);
        const s = await sequelize.query(`SELECT TOP 2 * FROM TabFichClt`, { type: QueryTypes.SELECT });
        s.forEach(r => console.log('  ', JSON.stringify(r)));
    } catch (e) { }

    // ====== 9. Chercher dans TabPlanComptab colonne Recap ======
    console.log('\n--- 📋 TabPlanComptab.Recap (Comptabilité) ---');
    try {
        const s = await sequelize.query(
            `SELECT TOP 3 Recap, * FROM TabPlanComptab WHERE Recap IS NOT NULL`,
            { type: QueryTypes.SELECT }
        );
        s.forEach(r => console.log('  ', JSON.stringify(r)));
    } catch (e) { console.log(`  ❌ ${e.message}`); }

    console.log('\n' + '='.repeat(60));
    console.log('             FIN ANALYSE DÉTAILLÉE');
    console.log('='.repeat(60));
}

analyseDetail().catch(console.error).finally(() => process.exit());
