const { sequelize } = require('./src/config/database');

async function analyzeDatabase() {
    try {
        console.log('--- ANALYSE DE LA BASE DE DONNÉES AmsLabOrigin ---');

        // 1. Liste des tables et nombre de lignes
        const [tables] = await sequelize.query(`
      SELECT 
        t.name AS TableName, 
        p.rows AS RowCounts
      FROM 
        sys.tables t
      INNER JOIN 
        sys.partitions p ON t.object_id = p.object_id
      WHERE 
        t.is_ms_shipped = 0 AND p.index_id IN (0,1)
      ORDER BY 
        p.rows DESC
    `);

        console.log('\n📊 Statistiques des tables (Nombre de lignes) :');
        console.table(tables);

        // 2. Vérification de la présence des tables clés demandées précédemment
        const targetTables = ['TabProjet', 'TabActivite', 'TabObjectifs', 'TabReclamation', 'TabLogConnexion', 'Sec_Users', 'TabTiers'];
        console.log('\n🔍 Statut des tables clés :');
        for (const tableName of targetTables) {
            const found = tables.find(t => t.TableName.toLowerCase() === tableName.toLowerCase());
            if (found) {
                console.log(`✅ ${tableName} : ${found.RowCounts} lignes`);
            } else {
                console.log(`❌ ${tableName} : NON TROUVÉE`);
            }
        }

        // 3. Aperçu rapide des utilisateurs actifs
        const [users] = await sequelize.query('SELECT TOP 5 UserID, LoginName, FullName, UserRole, IsActive FROM Sec_Users');
        console.log('\n👥 Aperçu des Utilisateurs (Top 5) :');
        console.table(users);

        // 4. Aperçu des derniers projets
        const [projets] = await sequelize.query('SELECT TOP 5 ID_Projet, Nom_Projet, Phase, Avancement FROM TabProjet ORDER BY ID_Projet DESC');
        console.log('\n🏗️ Aperçu des Projets Récents :');
        console.table(projets);

    } catch (error) {
        console.error('❌ Erreur lors de l\'analyse :', error.message);
    } finally {
        await sequelize.close();
    }
}

analyzeDatabase();
