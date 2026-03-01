const { Objectif, sequelize } = require('./src/models');

async function advancedDebug() {
    try {
        await sequelize.authenticate();
        console.log('DB Valid.');
        
        // Let's create a fresh objective to test with
        const initial = await Objectif.create({
            ID_Utilisateur: 6, // We know this works
            Mois: 1, 
            Annee: 2025, 
            MontantCible: 100, 
            TypePeriode: 'Mensuel', 
            Statut: 'En cours',
            TypeObjectif: 'Chiffre d\'affaires',
            Montant_Realise_Actuel: 0 // Default
        });
        const id = initial.ID_Objectif;
        console.log('Created ID:', id);

        // 1. Test update with empty string for dates (common frontend behavior)
        console.log('Test 1: Empty string dates...');
        try {
            await initial.update({
                DateDebut: "",
                DateFin: ""
            });
            console.log('Success empty strings.');
        } catch (e) {
            console.error('Failed empty strings:', e.message);
        }

        // 2. Test update with null for dates
        console.log('Test 2: Null dates...');
        try {
            await initial.update({
                DateDebut: null,
                DateFin: null
            });
            console.log('Success null dates.');
        } catch (e) {
            console.error('Failed null dates:', e.message);
        }

        // 3. Test update with valid date string
        console.log('Test 3: Valid date string...');
        try {
             // Simulate exact payload logic from controller
             const payload = {
                 DateDebut: "2024-03-01",
                 DateFin: "2024-03-07"
             };
             // The controller calls sanitizeDate() before update.
             // But we are testing model behavior directly here first.
             // Let's mimic controller logic
             const { sanitizeDate } = require('./src/utils/helpers');
             const sStart = sanitizeDate(payload.DateDebut);
             const sEnd = sanitizeDate(payload.DateFin);
             
             await initial.update({
                 DateDebut: sStart,
                 DateFin: sEnd
             });
             console.log('Success valid dates.', sStart);
        } catch (e) {
             console.error('Failed valid dates:', e.message);
        }

        // 4. Test numeric fields with text/strings/nulls
        console.log('Test 4: Numeric fields...');
        try {
            await initial.update({
                MontantCible: "1000.50",
                Montant_Realise_Actuel: 500
            });
            console.log('Success numeric.');
        } catch (e) {
            console.error('Failed numeric:', e.message);
        }
        
        // 5. Test validation on Mois if sent as null (Sequelize)
        console.log('Test 5: Null Mois...');
        try {
            await initial.update({
                Mois: null,
                TypePeriode: 'Hebdomadaire'
            });
            console.log('Success null Mois.');
        } catch (e) {
            console.error('Failed null Mois:', e.message);
        }

    } catch (e) {
        console.error('Setup failed:', e);
    } finally {
        await sequelize.close();
    }
}

advancedDebug();
