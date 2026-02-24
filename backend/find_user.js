con st { sequelize, QueryTypes } = require('sequelize');
const db = require('./src/config/database');

(async () => {
    try {
        const users = await db.sequelize.query(
            "SELECT TOP 1 EmailPro, FullName, UserRole FROM Sec_Users WHERE IsActive = 1",
            { type: QueryTypes.SELECT }
        );
        console.log(JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
