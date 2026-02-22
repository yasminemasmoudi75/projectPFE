require('dotenv').config();
const { Objectif, User } = require('./src/models');
const { testConnection } = require('./src/config/database');

async function run() {
    console.log('Testing DB connection...');
    await testConnection();
    
    console.log('Running Objectif.findAll()...');
    try {
        const results = await Objectif.findAll({
            include: [
                {
                    model: User,
                    as: 'utilisateur',
                    attributes: ['UserID', 'FullName', 'LoginName']
                }
            ],
            order: [['Annee', 'DESC'], ['Mois', 'DESC'], ['Semaine', 'DESC']]
        });
        console.log('Success!', results.length, 'records found.');
    } catch (err) {
        console.error('Error running findAll:', err);
    }
}

run();
