const sequelize = require('./src/config/database');
const { DataTypes } = require('sequelize');

async function analyzeSAVLiaisons() {
  try {
    console.log('\n=== ANALYSE COMPLÈTE DES LIAISONS SAV ===\n');

    // 1. Vérifier les tables qui existent
    console.log('📊 ÉTAPE 1: Vérification des tables existantes...\n');
    
    const tableNames = [
      'TabReclamation',
      'TabDI',
      'TabBT',
      'TabPanne',
      'TabSymptome',
      'TabRemede',
      'TabEquipement',
      'Sec_Users',
      'TierSTab'
    ];

    const existingTables = {};

    for (const tableName of tableNames) {
      try {
        const description = await sequelize.getQueryInterface().describeTable(tableName);
        existingTables[tableName] = description;
        console.log(`✅ ${tableName} existe (${Object.keys(description).length} colonnes)`);
      } catch (err) {
        console.log(`❌ ${tableName} N'EXISTE PAS`);
      }
    }

    // 2. Afficher la structure détaillée de chaque table
    console.log('\n\n📋 ÉTAPE 2: Structure détaillée des tables\n');
    
    for (const [tableName, columns] of Object.entries(existingTables)) {
      console.log(`\n┌─ ${tableName.toUpperCase()}`);
      console.log('└─────────────────────────────────────');
      
      Object.entries(columns).forEach(([colName, colInfo]) => {
        const isPK = colInfo.primaryKey ? '🔑' : '  ';
        const isFK = colInfo.references ? '👆' : '  ';
        const type = colInfo.type.toString();
        const nullable = colInfo.allowNull ? 'NULL' : 'NOT NULL';
        const references = colInfo.references ? `→ ${colInfo.references.model}(${colInfo.references.key})` : '';
        
        console.log(`  ${isPK} ${isFK} ${colName.padEnd(25)} ${type.padEnd(20)} ${nullable.padEnd(10)} ${references}`);
      });
    }

    // 3. Analyser les relations
    console.log('\n\n🔗 ÉTAPE 3: Relations détectées\n');

    const relations = [];
    
    for (const [tableName, columns] of Object.entries(existingTables)) {
      Object.entries(columns).forEach(([colName, colInfo]) => {
        if (colInfo.references) {
          relations.push({
            from: tableName,
            to: colInfo.references.model,
            column: colName,
            referencedKey: colInfo.references.key
          });
        }
      });
    }

    if (relations.length > 0) {
      relations.forEach((rel, idx) => {
        console.log(`${idx + 1}. ${rel.from}.${rel.column} → ${rel.to}.${rel.referencedKey}`);
      });
    } else {
      console.log('⚠️  Aucune clé étrangère détectée dans la structure');
    }

    // 4. Afficher le flux de réclamation
    console.log('\n\n📊 ÉTAPE 4: Flux de traitement d\'une Réclamation\n');
    console.log('Réclamation créée');
    console.log('     ↓');
    console.log('Assignée à Technicien (TechnicienID)');
    console.log('     ↓');
    
    if (existingTables['TabDI']) {
      console.log('Demande d\'Intervention créée (TabDI)');
      console.log('     ↓');
    }
    
    if (existingTables['TabBT']) {
      console.log('Bon de Travail créé (TabBT)');
      console.log('     ↓');
    }

    if (existingTables['TabPanne']) {
      console.log('Panne diagnostiquée (TabPanne)');
      console.log('     ↓');
    }

    if (existingTables['TabSymptome']) {
      console.log('Symptôme identifié (TabSymptome)');
      console.log('     ↓');
    }

    if (existingTables['TabRemede']) {
      console.log('Remède appliqué (TabRemede)');
      console.log('     ↓');
    }

    console.log('Réclamation résolue');

    // 5. Synthèse
    console.log('\n\n📈 ÉTAPE 5: Synthèse\n');
    console.log(`Total tables trouvées: ${Object.keys(existingTables).length} / ${tableNames.length}`);
    console.log(`Relations FK trouvées: ${relations.length}`);
    
    const tablesWithFK = relations.map(r => r.from).filter((v, i, a) => a.indexOf(v) === i);
    console.log(`Tables avec FK: ${tablesWithFK.join(', ')}`);

    console.log('\n✅ Analyse terminée!\n');

  } catch (error) {
    console.error('ERREUR:', error.message);
  } finally {
    try {
      await sequelize.close();
    } catch (e) {
      // Ignore close errors
    }
  }
}

analyzeSAVLiaisons();
