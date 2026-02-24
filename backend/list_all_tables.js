const { sequelize } = require('./src/config/database');

async function listAllTables() {
  try {
    console.log('\n=== TOUTES LES TABLES DE LA BASE DE DONNÉES ===\n');

    // Utiliser une requête SQL directe pour obtenir les tables
    // Query pour SQL Server pour obtenir le nom des tables  
    const query = `
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE' 
ORDER BY TABLE_NAME
`;

    const [tables] = await sequelize.query(query, { 
      raw: true 
    });
    
    console.log(`Total: ${tables.length} tables trouvées\n`);
    
    tables.forEach((row, idx) => {
      const tableName = row.TABLE_NAME;
      console.log(`${idx + 1}. ${tableName}`);
    });

    // Pour chaque table, afficher le nombre de colonnes
    console.log('\n\n=== STRUCTURE DÉTAILLÉE ===\n');

    for (const row of tables) {
      const tableName = row.TABLE_NAME;
      try {
        const describeQuery = `
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = '${tableName}'
ORDER BY ORDINAL_POSITION
`;
        
        const [columns] = await sequelize.query(describeQuery, { 
          raw: true 
        });
        
        console.log(`\n${tableName} (${columns.length} colonnes):`);
        
        columns.forEach((col) => {
          const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.COLUMN_DEFAULT ? ` Default: ${col.COLUMN_DEFAULT}` : '';
          console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}, ${nullable})${defaultVal}`);
        });
      } catch (err) {
        console.log(`  ⚠️  Erreur: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('ERREUR:', error.message);
  } finally {
    try {
      await sequelize.close();
    } catch (e) {
      // Ignore
    }
  }
}

listAllTables();
