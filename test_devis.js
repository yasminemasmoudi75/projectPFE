
const { DevisMaster, DevisDetail, Tiers, User, sequelize } = require('./src/models');
const { randomUUID } = require('crypto');

async function test() {
  const t = await sequelize.transaction();
  try {
    const payload = {
      master: {
        CodTiers: "CLI9183943712",
        LibTiers: "feres1",
        TotHT: 0,
        TotTva: 0,
        TotTTC: 0,
        Devise: "TND",
        Cours: 1,
        Valid: false,
        bTransf: false,
        bLivr: false,
        IsConverted: false
      },
      details: [
        {
          CodArt: "415501-1621-000",
          LibArt: "OBJECTIVE IPLAN-ACHROMAT 20X/0.45 D=0 FOR PRIMOSTAR 3 (WD=1.0MM)",
          IDArt: "4777503B-DFF5-43C4-8694-00169C347DB0",
          Qt: 1,
          PuHT: 0,
          PuTTC: 0,
          Tva: 19,
          MntHT: 0,
          MntTTC: 0
        }
      ]
    };

    console.log('Finding tier...');
    const selectedTier = await Tiers.findOne({
      where: { CodTiers: payload.master.CodTiers },
      attributes: ['IDTiers', 'CodTiers', 'Raisoc', 'Adresse', 'Ville', 'Email'],
      transaction: t
    });

    if (!selectedTier) {
      console.log('Tier not found!');
      await t.rollback();
      return;
    }

    console.log('Tier found:', selectedTier.CodTiers);

    // Simulate creation logic...
    console.log('Creating DevisMaster...');
    const masterData = { ...payload.master, Guid: randomUUID() };
    masterData.DatCreateUser = sequelize.literal('GETDATE()');
    masterData.DatUser = sequelize.literal('GETDATE()');
    masterData.MDate = sequelize.literal('GETDATE()');
    
    const newDevis = await DevisMaster.create(masterData, { transaction: t });

    console.log('Creating details...');
    const detailsWithNf = payload.details.map(d => ({ ...d, NF: newDevis.Nf, Guid: randomUUID() }));
    await DevisDetail.bulkCreate(detailsWithNf, { transaction: t });

    console.log('Committing...');
    await t.commit();

    console.log('Triggering notifications (simulated)...');
    const { notifyDocumentCreated } = require('./src/utils/notificationUtils');
    await notifyDocumentCreated('DEV', newDevis.Nf, selectedTier, 14);

    console.log('Success!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    if (t && !t.finished) await t.rollback();
    process.exit(1);
  }
}

test();
