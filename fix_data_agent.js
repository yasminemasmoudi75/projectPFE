const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');

async function fixData() {
    console.log('--- Cleaning Data for Agent Test ---');

    // 1. Ensure Agent Profile 8 exists
    await sequelize.query("IF NOT EXISTS (SELECT 1 FROM UCS_PROFILES WHERE PROF_ID = 8) INSERT INTO UCS_PROFILES (PROF_ID, PROF_DESCRIPTION, PARENT_PROF, PROF_LEVEL) VALUES (8, 'Agent', 0, 0)");

    // 2. Setup ag@gmail.com (ID 20) as Agent in region 17
    await sequelize.query("UPDATE UCS_USERS SET Gouvernorat = '17' WHERE USER_ID = 20");
    await sequelize.query("IF NOT EXISTS (SELECT 1 FROM UCS_USERINFO WHERE USER_ID = 20) INSERT INTO UCS_USERINFO (USER_ID, PROF_ID, APP_ID, USER_ACTIVE, USER_IS_ADMIN) VALUES (20, 8, 1, 1, 0) ELSE UPDATE UCS_USERINFO SET PROF_ID = 8 WHERE USER_ID = 20");

    // 3. Setup Israel (ID 18) as Commercial in region 17
    await sequelize.query("UPDATE UCS_USERS SET Gouvernorat = '17' WHERE USER_ID = 18");

    // 4. Ensure permissions for Agent (Profile 8 / Agent) in TabAWProfileAccess
    const modules = [30, 4, 45];
    for (const mod of modules) {
        await sequelize.query("IF NOT EXISTS (SELECT 1 FROM TabAWProfileAccess WHERE ProfileUser = 'Agent' AND CodMod = :mod) " +
            "INSERT INTO TabAWProfileAccess (ProfileUser, CodMod, Actif, FiltreRepres, canAdd, canEdit, canDelt) VALUES ('Agent', :mod, 1, 1, 1, 1, 0) " +
            "ELSE UPDATE TabAWProfileAccess SET Actif = 1, FiltreRepres = 1 WHERE ProfileUser = 'Agent' AND CodMod = :mod",
            { replacements: { mod } });
    }

    console.log('Setup finished');
}

fixData().catch(console.error).finally(() => process.exit());
