const { Objectif, User } = require('./src/models');
const fs = require('fs');

(async () => {
    try {
        console.log('--- REPRODUCING WITH FULL LOGGING ---');
        await Objectif.findAll({
            where: { Annee: 2026 },
            include: [{ model: User, as: 'utilisateur', attributes: ['UserID'], required: false }],
            logging: (sql) => {
                console.log('GENERATED SQL:', sql);
                fs.appendFileSync('sql_debug.log', sql + '\n');
            }
        });
        console.log('SUCCESS');
        process.exit(0);
    } catch (err) {
        console.log('FAILED');
        console.log('ERROR:', err.message);
        if (err.parent) console.log('PARENT ERROR:', err.parent.message);
        process.exit(1);
    }
})();
