
const { sequelize } = require('./src/config/database');

(async () => {
    try {
        console.log('🔄 DEBUT DU TEST DE CONNEXION ET D\'INSERTION...');
        await sequelize.authenticate();
        console.log('✅ Connexion DB réussie.');

        // Test insertion DI
        console.log('🔄 Test insertion TabDI...');
        try {
            const sqlDI = `
                INSERT INTO TabDI (IDDI, NumDI, DatDI, DescPanne, Demandeur, DatCreate, CodServ)
                OUTPUT INSERTED.IDDI
                VALUES (NEWID(), 999999, GETDATE(), 'TEST_AUTO_SCRIPT', 'TEST_USER', GETDATE(), 'SAV');
            `;
            const [diResult] = await sequelize.query(sqlDI);
            const idDI = diResult[0].IDDI;
            console.log(`✅ TabDI OK! ID=${idDI}`);

            // Test insertion BT
            console.log('🔄 Test insertion TabBT...');
            const sqlBT = `
                INSERT INTO TabBT (IDBT, NumBT, DatBT, NumDI, IDDI, CodInterv, DescPanne, DatCreate, Demandeur, BTEncours, BTClotured, CodServ)
                VALUES (NEWID(), 999999, GETDATE(), 999999, '${idDI}', 'TEST_TECH', 'TEST_AUTO_SCRIPT', GETDATE(), 'TEST_USER', 1, 0, 'SAV');
            `;
            await sequelize.query(sqlBT);
            console.log('✅ TabBT OK!');

            // Suppression des données de test
            console.log('🧹 Nettoyage...');
            await sequelize.query("DELETE FROM TabBT WHERE NumBT = 999999");
            await sequelize.query("DELETE FROM TabDI WHERE NumDI = 999999");
            console.log('✅ Nettoyage terminé.');

        } catch (err) {
            console.error('❌ ERREUR LORS DU TEST D\'INSERTION:', err.message);
            console.error(err);
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur générale:', err);
        process.exit(1);
    }
})();
