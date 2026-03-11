const { Objectif, User } = require('./src/models');
const fs = require('fs');

(async () => {
    try {
        await Objectif.findAll({
            where: { Annee: 2026 },
            include: [{ model: User, as: 'utilisateur', attributes: ['UserID'], required: false }],
            logging: false
        });
        fs.writeFileSync('error_log.txt', 'SUCCESS');
        process.exit(0);
    } catch (err) {
        let msg = 'Error Name: ' + err.name + '\n';
        msg += 'Error Message: ' + err.message + '\n';
        if (err.original) {
            msg += 'Original Error: ' + err.original.message + '\n';
            msg += 'SQL: ' + err.sql + '\n';
        }
        fs.writeFileSync('error_log.txt', msg);
        process.exit(1);
    }
})();
