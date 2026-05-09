const { Sequelize, QueryTypes } = require('sequelize');
const sequelize = new Sequelize('AA', 'sa', '123456789', {
    host: '127.0.0.1',
    port: 1433,
    dialect: 'mssql',
    dialectOptions: {
        options: {
            encrypt: false,
            trustServerCertificate: true
        }
    },
    logging: false
});

async function addTechnicianProfile() {
    try {
        await sequelize.query(`
            IF NOT EXISTS (SELECT 1 FROM UCS_PROFILES WHERE PROF_ID = 4 OR PROF_DESCRIPTION = 'technicien')
            BEGIN
                INSERT INTO UCS_PROFILES (PROF_ID, PROF_DESCRIPTION, INTERVAL_CHANGE_PWD, MUST_CHANGE_PWD, AUDIT_MODE, PARENT_PROF, PROF_LEVEL)
                VALUES (4, 'technicien', 0, '0', '0', 1, 1)
                PRINT '✅ Profile technicien (4) créé avec succès'
            END
            ELSE
            BEGIN
                UPDATE UCS_PROFILES SET PROF_DESCRIPTION = 'technicien' WHERE PROF_ID = 4
                PRINT '✅ Profile ID 4 mis à jour vers technicien'
            END
        `, { type: QueryTypes.RAW });
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

addTechnicianProfile();
