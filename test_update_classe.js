const { Tiers, sequelize } = require('./src/models');

async function debugUpdate() {
    try {
        console.log('Fetching a tier...');
        const tiers = await Tiers.findOne();
        if (!tiers) {
            console.log('No tiers found.');
            return;
        }

        console.log('Current Classe:', tiers.Classe);
        const testValue = 2; // "inactif" usually
        console.log(`Setting Classe to ${testValue}...`);

        await tiers.update({ Classe: testValue });

        // Reload from DB
        const updated = await Tiers.findByPk(tiers.IDTiers);
        console.log('Updated Classe from DB:', updated.Classe);

        if (updated.Classe === testValue) {
            console.log('SUCCESS: Classe updated in DB.');
        } else {
            console.log('FAILURE: Classe NOT updated in DB.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

debugUpdate();
