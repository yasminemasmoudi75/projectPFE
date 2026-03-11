const { Objectif, User } = require('./src/models');
const { sequelize } = require('./src/config/database');
const { Op } = require('sequelize');

(async () => {
    try {
        console.log('--- EXECUTING Objectif.findAll ---');
        const objectifs = await Objectif.findAll({
            where: { Annee: 2026 },
            include: [
                {
                    model: User,
                    as: 'utilisateur',
                    attributes: ['UserID', 'FullName', 'LoginName'],
                    required: false
                }
            ],
            logging: console.log
        });
        console.log('Success! Count:', objectifs.length);
        process.exit(0);
    } catch (err) {
        console.error('--- ERROR DETECTED ---');
        console.error('Name:', err.name);
        console.error('Message:', err.message);
        if (err.original) {
            console.error('Original Error:', err.original.message);
            console.error('SQL:', err.sql);
            console.error('Parameters:', err.parameters);
        }
        process.exit(1);
    }
})();
