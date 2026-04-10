const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');
const util = require('util');

async function testAgentFilter() {
    console.log('--- TEST AGENT FILTERING ---');

    const agentId = 20;
    const userRows = await sequelize.query('SELECT * FROM UCS_USERS WHERE USER_ID = :agentId', {
        replacements: { agentId },
        type: QueryTypes.SELECT
    });

    const user = userRows[0];
    user.UserRole = 'Agent';
    user.UserID = user.USER_ID;

    const filterHelper = require('./src/utils/filterHelper');
    const scopeClient = await filterHelper.applyTableDrivenFilters('30', {}, user);

    console.log('Scope successfully generated?');
    const symbols = Object.getOwnPropertySymbols(scopeClient);
    console.log('Symbols found:', symbols.length);
    if (symbols.length > 0) {
        console.log('Sample symbol:', symbols[0].toString());
    }
}

testAgentFilter().catch(console.error).finally(() => process.exit());
