const { Objectif, sequelize } = require('./src/models');
const { sanitizeDate } = require('./src/utils/helpers');

async function debugUpdateParams() {
    try {
        console.log('Connecting...');
        await sequelize.authenticate();
        console.log('Connected.');

        // Update ID from user logs
        const id = 1190; 
        
        console.log(`Checking if Objectif ${id} exists...`);
        let existing = await Objectif.findByPk(id);
        
        if (!existing) {
            console.log(`Objectif ${id} not found, creating a new one for testing...`);
             existing = await Objectif.create({
                ID_Utilisateur: 6, // VALID USER
                Mois: 1, 
                Annee: 2025, 
                MontantCible: 100, 
                TypePeriode: 'Mensuel', 
                Statut: 'En cours',
                TypeObjectif: 'Chiffre d\'affaires'
            });
            console.log('Created test obj with ID:', existing.ID_Objectif);
        } else {
            console.log('Found existing objectif:', existing.toJSON());
        }

        const testId = existing.ID_Objectif;

        // Simulate failing payload #1: NaN Year
        console.log('--- Test 1: Updating with NaN year ---');
        try {
            await existing.update({ Annee: NaN });
            console.log('Success (Unexpected)');
        } catch (e) {
            console.log('Caught expected error for NaN:', e.message);
        }

        // Simulate failing payload #2: TypePeriode switch with nulls
        console.log('--- Test 2: Switching to Weekly with Null Month/Year ---');
        console.log('Current state:', existing.toJSON());
        
        const payload2 = {
            Mois: null,
            Annee: 2024,
            TypePeriode: 'Hebdomadaire',
            Semaine: 'Semaine 10',
            DateDebut: '2024-03-01',
            DateFin: '2024-03-07'
        };

        try {
            await Objectif.update(payload2, { where: { ID_Objectif: testId }});
            // Or using instance update
            // await existing.update(payload2);
            console.log('Test 2 Success');
        } catch (e) {
            console.error('Test 2 Failed:', e);
        }

    } catch (e) {
        console.error('Global Error:', e);
    } finally {
        await sequelize.close();
    }
}

debugUpdateParams();
