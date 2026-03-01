const { sequelize } = require('./src/config/database');
const { Objectif } = require('./src/models');
const objectifController = require('./src/controllers/objectifController');

const fs = require('fs');
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('output.txt', msg + '\n');
};

(async () => {
    try {
        log("Starting...");
        await sequelize.authenticate();
        log('DB Connected.');
        
        const obj = await Objectif.findOne();
        if(!obj) {
             log('No objective found');
             return;
        }
        log(`Objective found: ${obj.ID_Objectif}`);

        // Helper function to safely parse int
        const safeInt = (val) => {
           if (val === null || val === undefined || val === '') return null;
           const parsed = parseInt(val);
           return isNaN(parsed) ? null : parsed;
        };

        const body = {
            // Fields matching TabObjectifs columns
            ID_Utilisateur: obj.ID_Utilisateur,
            Mois: safeInt(obj.Mois),
            Annee: safeInt(obj.Annee),
            Semaine: obj.Semaine,
            DateDebut: obj.DateDebut,
            DateFin: obj.DateFin,
            MontantCible: parseFloat(obj.MontantCible),
            Montant_Realise_Actuel: parseFloat(obj.Montant_Realise_Actuel),
            TypeObjectif: obj.TypeObjectif,
            TypePeriode: obj.TypePeriode,
            Libelle_Indicateur: "Updated Libelle via Script", // Use valid column
            Statut: obj.Statut,
            ID_Objectif_Parent: obj.ID_Objectif_Parent
            // Avancement is virtual, not sent to DB
        };
        const user = { id: 1 };
        
        const req = { headers: {}, params: { id: obj.ID_Objectif }, body, user };
        
        log('Request object created.');

        const res = {
            status: function(code) {
                log(`Response Status: ${code}`);
                return this;
            },
            json: function(data) {
                log(`Response Data: ${JSON.stringify(data, null, 2)}`);
                return this;
            }
        };
        
        log('Invoking updateObjectif...');
        try {
            await objectifController.updateObjectif(req, res);
        } catch (innerErr) {
            log(`Error inside updateObjectif: ${innerErr}`);
        }

    } catch (error) {
        log(`Script Error: ${error}`);
    } finally {
        await sequelize.close();
    }
})();
