const { DevisMaster, DevisDetail } = require('./src/models');
const { testConnection } = require('./src/config/database');

async function check() {
    try {
        const isConnected = await testConnection();
        if (!isConnected) return;

        const devis = await DevisMaster.findOne({
            include: [{ model: DevisDetail, as: 'details' }]
        });

        if (devis) {
            console.log('Devis Nf:', devis.Nf);
            console.log('Details property exists:', !!devis.details);
            if (devis.details) {
                console.log('Details length:', devis.details.length);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
