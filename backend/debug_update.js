const { Objectif, sequelize } = require('./src/models');
const { sanitizeDate } = require('./src/utils/helpers');

async function debugUpdate() {
    try {
        console.log('Connecting...');
        await sequelize.authenticate();
        console.log('Connected.');

        // 1. Create a dummy objectif to update
        console.log('Creating dummy objectif...');
        const newObj = await Objectif.create({
            ID_Utilisateur: 6, // VALID USER ID
            Mois: 1, 
            Annee: 2025, 
            MontantCible: 100, 
            TypePeriode: 'Mensuel', 
            Statut: 'En cours',
            TypeObjectif: 'Chiffre d\'affaires'
        });
        const id = newObj.ID_Objectif;
        console.log('Created dummy ID:', id);

        // 2. Simulate the update payload from frontend
        // In ObjectifForm.jsx, for update:
        // const objectifData = { ...formData, Mois: ..., Annee: ..., MontantCible: ..., Montant_Realise_Actuel: ... }
        
        const updatePayload = {
            Mois: 1,
            Annee: 2025,
            MontantCible: 200, // Changed
            Montant_Realise_Actuel: 50, // Changed
            TypePeriode: 'Mensuel',
            TypeObjectif: 'Chiffre d\'affaires',
            Statut: 'Terminé'
        };

        console.log('Updating...');
        
        // Logic from controller updateObjectif
        const objectif = await Objectif.findByPk(id);
        if (!objectif) throw new Error('Not found');

        const {
            Mois, Annee, Semaine, DateDebut, DateFin,
            MontantCible, Amount_Realise_Actuel, // Typos in destructuring vs body? No, controller uses Montant_Realise_Actuel
             Montant_Realise_Actuel,
            TypeObjectif,
            Libelle_Indicateur,
            Statut
        } = updatePayload;

        const sanitizedDateDebut = DateDebut !== undefined ? sanitizeDate(DateDebut) : objectif.DateDebut;
        const sanitizedDateFin = DateFin !== undefined ? sanitizeDate(DateFin) : objectif.DateFin;

        await objectif.update({
            Mois: Mois !== undefined ? parseInt(Mois) : objectif.Mois,
            Annee: Annee !== undefined ? parseInt(Annee) : objectif.Annee,
            Semaine: Semaine !== undefined ? Semaine : objectif.Semaine,
            DateDebut: sanitizedDateDebut,
            DateFin: sanitizedDateFin,
            MontantCible: MontantCible || objectif.MontantCible,
            Montant_Realise_Actuel: Montant_Realise_Actuel !== undefined ? Montant_Realise_Actuel : objectif.Montant_Realise_Actuel,
            TypeObjectif: TypeObjectif || objectif.TypeObjectif,
            Libelle_Indicateur: Libelle_Indicateur !== undefined ? Libelle_Indicateur : objectif.Libelle_Indicateur,
            Statut: Statut !== undefined ? Statut : objectif.Statut
        });

        console.log('Update success!');

    } catch (e) {
        console.error('Update failed:', e);
        if (e.original && e.original.errors) {
            e.original.errors.forEach(err => console.error('SQL Error:', err.message));
        }
    } finally {
        await sequelize.close();
    }
}

debugUpdate();
