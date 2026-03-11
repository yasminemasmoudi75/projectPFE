const { Objectif, User } = require('./src/models');
const fs = require('fs');

(async () => {
    try {
        console.log('--- REPLICATING API QUERY EXACTLY ---');
        // This is exactly what getAllObjectifs does
        const where = { Annee: 2026 };
        const objectifs = await Objectif.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'utilisateur',
                    attributes: ['UserID', 'FullName', 'LoginName'],
                    required: false
                }
            ],
            order: [
                ['ID_Objectif', 'DESC']
            ],
            logging: (sql) => console.log('SQL:', sql)
        });
        console.log('SUCCESS! count:', objectifs.length);
        process.exit(0);
    } catch (err) {
        console.error('FAILED');
        console.error('Error:', err.message);
        if (err.original) console.error('Original:', err.original.message);
        process.exit(1);
    }
})();
