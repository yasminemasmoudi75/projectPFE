const { Objectif, User } = require('./src/models');
const fs = require('fs');

(async () => {
    try {
        console.log('Testing Objectif.findAll with User include...');
        const res = await Objectif.findAll({
            include: [
                {
                    model: User,
                    as: 'utilisateur',
                    attributes: ['UserID', 'FullName', 'LoginName'],
                    required: false
                }
            ],
            logging: (sql) => console.log('SQL:', sql)
        });
        console.log('SUCCESS! count:', res.length);
        fs.writeFileSync('error_log.txt', 'SUCCESS');
        process.exit(0);
    } catch (err) {
        console.error('FAILED');
        let msg = 'Error Name: ' + err.name + '\n';
        msg += 'Error Message: ' + err.message + '\n';
        if (err.original) {
            msg += 'Original Error: ' + err.original.message + '\n';
            msg += 'SQL: ' + err.sql + '\n';
        }
        fs.writeFileSync('error_log.txt', msg);
        console.error(msg);
        process.exit(1);
    }
})();
