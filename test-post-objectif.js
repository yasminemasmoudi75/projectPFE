const { createObjectif } = require('./src/controllers/objectifController');

async function run() {
  const req = {
    body: {
      ID_Utilisateur: 36,
      Mois: 5,
      Annee: 2026,
      MontantCible: 5000,
      AvancementEstime: 0,
      TypeObjectif: "Chiffre d'affaires",
      TypePeriode: 'Mensuel'
    },
    user: { UserRole: 'admin', UserID: 7 },
    permissions: { FiltreRepres: 0 }
  };
  
  const res = {
    status: function(code) {
      console.log('Status:', code);
      return {
        json: function(data) {
          console.log('Data:', data);
        }
      };
    }
  };
  
  await createObjectif(req, res, (err) => console.error('Next Error:', err));
  process.exit();
}
run();
