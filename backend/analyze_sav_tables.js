require('dotenv').config();
const { sequelize } = require('./src/config/database');

async function analyzeServiceTables() {
    try {
        console.log('\n' + '═'.repeat(100));
        console.log('🔍 ANALYSE DES TABLES DE SERVICE APRÈS-VENTE (SAV)');
        console.log('════════════════════════════════════════════════════════════════════════════════════════════════════\n');

        // Lister toutes les tables
        const tablesResult = await sequelize.query(`
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        `);

        const tables = tablesResult[0];
        const savTables = tables.filter(t => {
            const name = t.TABLE_NAME.toLowerCase();
            return name.includes('bt') || 
                   name.includes('di') || 
                   name.includes('panne') || 
                   name.includes('symptome') || 
                   name.includes('remede') || 
                   name.includes('equip') ||
                   name.includes('equipe') ||
                   name.includes('service') ||
                   name.includes('sav') ||
                   name.includes('intervention') ||
                   name.includes('technic');
        });

        console.log('📌 TABLES DE SAV DÉTECTÉES:\n');
        savTables.forEach((t, i) => {
            console.log(`   ${i + 1}. ${t.TABLE_NAME}`);
        });

        if (savTables.length === 0) {
            console.log('\n   ⚠️  Aucune table de SAV trouvée');
            console.log('\n   Tables existantes dans la base:');
            tables.slice(0, 20).forEach((t, i) => {
                console.log(`      ${i + 1}. ${t.TABLE_NAME}`);
            });
        } else {
            console.log('\n' + '═'.repeat(100));
            console.log('📊 STRUCTURE DES TABLES DE SAV\n');

            for (const table of savTables) {
                const columnsResult = await sequelize.query(`
                    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = '${table.TABLE_NAME}'
                    ORDER BY ORDINAL_POSITION
                `);

                console.log(`\n▢ ${table.TABLE_NAME}`);
                console.log('─'.repeat(100));
                
                columnsResult[0].forEach((col, idx) => {
                    const pk = col.COLUMN_NAME.includes('ID') ? '🔑 ' : '   ';
                    const nullable = col.IS_NULLABLE === 'YES' ? '(nullable)' : '';
                    console.log(`  ${pk}${col.COLUMN_NAME.padEnd(25)} ${col.DATA_TYPE.padEnd(20)} ${nullable}`);
                });
            }
        }

        // Chercher les foreign keys
        console.log('\n\n' + '═'.repeat(100));
        console.log('🔗 ANALYSE DES LIAISONS (FOREIGN KEYS)\n');

        const fkResult = await sequelize.query(`
            SELECT 
                tc.TABLE_NAME,
                kcu.COLUMN_NAME,
                ccu.TABLE_NAME AS REFERENCED_TABLE_NAME,
                ccu.COLUMN_NAME AS REFERENCED_COLUMN_NAME
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
            JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS kcu
                ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
            JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE AS ccu
                ON ccu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
            WHERE tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
            ORDER BY tc.TABLE_NAME
        `);

        if (fkResult[0].length > 0) {
            console.log('Clés étrangères détectées:\n');
            fkResult[0].forEach((fk, i) => {
                console.log(`   ${i + 1}. ${fk.TABLE_NAME}.${fk.COLUMN_NAME}`);
                console.log(`      ↓ Référence ↓`);
                console.log(`      ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}\n`);
            });
        } else {
            console.log('⚠️  Aucune clé étrangère trouvée\n');
        }

        console.log('═'.repeat(100));
        console.log('✅ ANALYSE TERMINÉE\n');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await sequelize.close();
    }
}

analyzeServiceTables();
