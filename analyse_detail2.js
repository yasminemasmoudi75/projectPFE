const { sequelize } = require('./src/models');
const { QueryTypes } = require('sequelize');
const fs = require('fs');

const lines = [];
const log = (msg) => { lines.push(msg); };

async function analyseDetail() {
    log('='.repeat(60));
    log('   ANALYSE DETAILED - MODULES RECAP / VISITE / RELEVER');
    log('='.repeat(60));

    await sequelize.authenticate();
    log('DB Connected OK\n');

    const getColumns = async (tableName) => {
        return await sequelize.query(
            `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
             FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${tableName}'
             ORDER BY ORDINAL_POSITION`,
            { type: QueryTypes.SELECT }
        );
    };
    const getCount = async (tableName) => {
        try {
            const r = await sequelize.query(`SELECT COUNT(*) as cnt FROM ${tableName}`, { type: QueryTypes.SELECT });
            return r[0].cnt;
        } catch (e) { return `ERROR: ${e.message}`; }
    };
    const getSample = async (tableName, n = 2) => {
        try {
            return await sequelize.query(`SELECT TOP ${n} * FROM ${tableName}`, { type: QueryTypes.SELECT });
        } catch (e) { return []; }
    };

    const showTable = async (tableName, label) => {
        log(`\n--- TABLE: ${tableName} (${label}) ---`);
        try {
            const cols = await getColumns(tableName);
            if (cols.length === 0) { log('  [Table vide ou inexistante]'); return; }
            cols.forEach(c => {
                const len = c.CHARACTER_MAXIMUM_LENGTH ? `(${c.CHARACTER_MAXIMUM_LENGTH})` : '';
                log(`  ${c.COLUMN_NAME.padEnd(35)} ${(c.DATA_TYPE + len).padEnd(25)} [${c.IS_NULLABLE}]`);
            });
            const cnt = await getCount(tableName);
            log(`  --> Total lignes: ${cnt}`);
            const sample = await getSample(tableName, 3);
            if (sample.length > 0) {
                log('  Echantillon:');
                sample.forEach(r => log('  ' + JSON.stringify(r)));
            }
        } catch (e) {
            log(`  ERREUR: ${e.message}`);
        }
    };

    // TABLES CIBLES
    await showTable('TabActivite', 'Activites / Visites clients');
    await showTable('MvtRecap', 'Module RECAP');
    await showTable('TabTournerM', 'Tournees Master');
    await showTable('TabTournerD', 'Tournees Detail');
    await showTable('TabTournerF', 'Tournees Fiches / Resultats');
    await showTable('TabTournerR', 'Tournees R - possible RELEVER');
    await showTable('TabGeoLocAction', 'Geolocalisation Actions');
    await showTable('TabRapportM', 'Rapports Master');
    await showTable('TabRapportRend', 'Rapports Rendement');
    await showTable('TabTiersHistory', 'Historique Tiers - possible RELEVER');
    await showTable('TabRecouv', 'Recouvrement creances - RELEVER');
    await showTable('TabFichClt', 'Fiche Client - RECAP Tiers');
    await showTable('TabCompagne', 'Campagnes commerciales');
    await showTable('TabBRep', 'Bons de Representation / Recap');

    // TabPlanComptab - colonne Recap
    log('\n--- TabPlanComptab.Recap - Exemple ---');
    try {
        const r = await sequelize.query(
            `SELECT TOP 3 Recap FROM TabPlanComptab WHERE Recap IS NOT NULL`,
            { type: QueryTypes.SELECT }
        );
        r.forEach(row => log('  ' + JSON.stringify(row)));
        if (r.length === 0) log('  Aucune ligne avec Recap non-null');
    } catch (e) { log(`  ERREUR: ${e.message}`); }

    log('\n' + '='.repeat(60));
    log('             FIN ANALYSE DETAILLEE');
    log('='.repeat(60));

    fs.writeFileSync('./analyse_result.txt', lines.join('\n'), 'utf8');
    console.log('Done! Output saved to analyse_result.txt');
}

analyseDetail().catch(e => { console.error(e); }).finally(() => process.exit());
