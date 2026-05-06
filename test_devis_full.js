
const { DevisMaster, DevisDetail, Tiers, sequelize } = require('./src/models');
const { randomUUID } = require('crypto');

async function test() {
  const transaction = await sequelize.transaction();
  try {
    console.log('🚀 Starting Devis creation test...');
    
    // 1. Find a tier
    const tier = await Tiers.findOne({ transaction });
    if (!tier) throw new Error('No tier found for test');
    console.log('👤 Using Tier:', tier.CodTiers);

    // 2. Prepare Master data
    const lastDevis = await DevisMaster.findOne({ order: [['Nf', 'DESC']], transaction });
    const nextNf = (lastDevis?.Nf || 0) + 1;
    
    const masterData = {
      Guid: randomUUID(),
      Nf: nextNf,
      Prfx: 'DV',
      CodTiers: tier.CodTiers,
      LibTiers: tier.Raisoc,
      TotHT: 100,
      TotTva: 19,
      TotTTC: 119,
      TotRem: 0,
      DatCreateUser: sequelize.literal('GETDATE()'),
      DatUser: sequelize.literal('GETDATE()'),
      MDate: sequelize.literal('GETDATE()')
    };

    console.log('📝 Creating DevisMaster...');
    const newDevis = await DevisMaster.create(masterData, { transaction });
    console.log('✅ DevisMaster created. Nf:', newDevis.Nf);

    // 3. Prepare Detail data
    const detailData = {
      Guid: randomUUID(),
      NF: newDevis.Nf,
      ID: String(newDevis.Nf),
      CodArt: 'TEST_ART',
      LibArt: 'Test Product',
      Qt: 1,
      PuHT: 100,
      PuTTC: 119
    };

    console.log('📝 Creating DevisDetail...');
    await DevisDetail.create(detailData, { transaction });
    console.log('✅ DevisDetail created.');

    await transaction.commit();
    console.log('🎉 Test successful! Devis created.');
  } catch (e) {
    if (transaction) await transaction.rollback();
    console.error('❌ Test failed!');
    console.error('Error Message:', e.message);
    if (e.original) console.error('Original SQL Error:', e.original.message);
    if (e.sql) console.error('SQL:', e.sql);
  } finally {
    await sequelize.close();
  }
}

test();
