const { sequelize, QueryTypes } = require('sequelize');
const db = require('./src/config/database');

(async () => {
    try {
        const columns = await db.sequelize.query(
            "SELECT COLUMN_NAME, DATA_TYPE, COLUMNPROPERTY(object_id('TabStock'), COLUMN_NAME, 'IsIdentity') AS IsIdentity FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TabStock'",
            { type: QueryTypes.SELECT }
        );
        console.log(JSON.stringify(columns, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
