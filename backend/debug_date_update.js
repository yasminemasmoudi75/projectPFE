const { Objectif, sequelize } = require('./src/models');
const { sanitizeDate } = require('./src/utils/helpers');

async function debugDateUpdate() {
    try {
        console.log('Connecting...');
        await sequelize.authenticate();
        
        const id = 1195; // Use the one we created or find one
        console.log(`Checking ID ${id}...`);
        let obj = await Objectif.findByPk(id);
        if (!obj) {
             obj = await Objectif.create({
                ID_Utilisateur: 6, // We know this works
                Mois: 1, 
                Annee: 2025, 
                MontantCible: 100, 
                TypePeriode: 'Mensuel', 
                Statut: 'En cours',
                TypeObjectif: 'Chiffre d\'affaires',
                DateDebut: new Date('2025-01-01'), // Existing date
                Montant_Realise_Actuel: 0 
            });
            console.log('Created new ID:', obj.ID_Objectif);
        } else {
            console.log('Using existing ID:', obj.ID_Objectif);
        }

        // Test logic from controller:
        const payload = {
            // Suppose user sends Hebdomadaire but no dates yet (impossible in form, but in theory)
            // Or updating just Montant_Realise_Actuel
            Montant_Realise_Actuel: 50
        };
        const { DateDebut } = payload;
        
        console.log('DateDebut from payload:', DateDebut); // undefined
        
        // This is what happens in controller if DateDebut is undefined
        const sanitizedDateDebut = DateDebut !== undefined ? sanitizeDate(DateDebut) : obj.DateDebut;
        
        console.log('Sanitized Date:', sanitizedDateDebut); // Should be Date object
        console.log('Is Date?', sanitizedDateDebut instanceof Date);
        
        console.log('Updating...');
        await obj.update({
             DateDebut: sanitizedDateDebut,
             Montant_Realise_Actuel: 50
        });
        console.log('Update success with Date object!');

        // Now test failing case: What if existing Date is null?
        await obj.update({ DateDebut: null });
        await obj.reload();
        console.log('Date set to null.');
        
        const sDate2 = DateDebut !== undefined ? sanitizeDate(DateDebut) : obj.DateDebut;
        console.log('Sanitized Date 2 (should be null):', sDate2);
        
        await obj.update({
             DateDebut: sDate2
        });
        console.log('Update success with null!');

    } catch (e) {
        console.error('Test Failed:', e);
    } finally {
        await sequelize.close();
    }
}

debugDateUpdate();
