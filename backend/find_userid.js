const { sequelize, QueryTypes } = require('sequelize');
const db = require('./src/config/database');

(async () => {
    try {
        const users = await db.sequelize.query(
            "SELECT UserID, EmailPro FROM Sec_Users WHERE EmailPro = 'feres@business-software.tn'",
            { type: QueryTypes.SELECT }
        );
        console.log(JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
