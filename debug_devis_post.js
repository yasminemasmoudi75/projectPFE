
const { DevisMaster, DevisDetail, Tiers, sequelize } = require('./src/models');
const { randomUUID } = require('crypto');

async function debug() {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    
    const payload = {
      "master": {
        "Prfx": "DV",
        "Sufx": "",
        "Nf": null,
        "CodTiers": "CLI9183943712",
        "LibTiers": "feres1",
        "IDContact": "",
        "Adresse": "",
        "Ville": "",
        "Cin": "",
        "TotHT": 0,
        "TotTva": 0,
        "TotFodec": 0,
        "TotRem": 0,
        "TotTTC": 0,
        "Frais": 0,
        "MntTotDev": 0,
        "NatReg": "",
        "NbrLett": "",
        "Devise": "TND",
        "CodDev": "",
        "Cours": 1,
        "CodRepres": "",
        "DesRepres": "",
        "CodMag": "",
        "DesMag": "",
        "Remarq": "",
        "DatUser": null,
        "DatCreateUser": null,
        "MDate": null,
        "DatLiv": null,
        "Valid": false,
        "bTransf": false,
        "bLivr": false,
        "categ": "",
        "type": "",
        "Classe": 3,
        "Fonction": "",
        "Categorie": "",
        "Domaine": "",
        "Responsable": "",
        "Tel": "",
        "IsConverted": false,
        "MntDebit": 0,
        "MntCredit": 0,
        "CodCateg": 0,
        "ProjectId": null
      },
      "details": [
        {
          "CodArt": "11893933",
          "LibArt": "EAU EXEMPTE D'AMMONIUM",
          "ExLibArt": "",
          "IDArt": "321CAABE-0901-4E2E-898A-00228EA558E3",
          "Qt": 1,
          "PuHT": 0,
          "PuTTC": 0,
          "PvPub": 0,
          "PuDev": 0,
          "Tva": 19,
          "MntRem": 0,
          "MntTVA": 0,
          "MntHT": 0,
          "MntFodec": 0,
          "MntFrais": 0,
          "CodColor": "",
          "DesColor": "",
          "CodTaille": "",
          "Taille": "",
          "NumBL": "",
          "DateBL": null,
          "Codabar": "",
          "NumImport": "",
          "DatImport": null
        }
      ]
    };

    const { master, details } = payload;

    const selectedTier = await Tiers.findOne({
      where: { CodTiers: master.CodTiers },
      transaction
    });

    if (!selectedTier) {
      console.log('❌ Client non trouvé');
      return;
    }

    // Determine next Nf
    const lastDevis = await DevisMaster.findOne({
      order: [['Nf', 'DESC']],
      transaction
    });
    const nextNf = (lastDevis?.Nf || 0) + 1;
    console.log('🔍 Next Nf:', nextNf);

    const masterData = {
      ...master,
      Nf: nextNf,
      Guid: randomUUID(),
      DatCreateUser: sequelize.literal('GETDATE()'),
      DatUser: sequelize.literal('GETDATE()'),
      MDate: sequelize.literal('GETDATE()')
    };

    // Remove computed/problematic fields
    delete masterData.NetHT;
    delete masterData.Rest;
    delete masterData.ProjectId;
    masterData.CodProject = null;

    console.log('🚀 Creating DevisMaster...');
    const newDevis = await DevisMaster.create(masterData, { transaction });
    console.log('✅ DevisMaster created');

    const detailsWithNf = details.map((d) => {
      const detail = { ...d };
      delete detail.Guid;
      delete detail.NoDetail;
      return {
        ...detail,
        NF: newDevis.Nf,
        ID: String(newDevis.Nf)
      };
    });

    console.log('🚀 Creating DevisDetail...');
    await DevisDetail.bulkCreate(detailsWithNf, { transaction });
    console.log('✅ DevisDetail created');

    await transaction.commit();
    console.log('🎉 Transaction committed');

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('❌ Error:', error.message);
    if (error.original) console.error('❌ Original Error:', error.original.message);
    if (error.sql) console.error('❌ SQL:', error.sql);
  } finally {
    await sequelize.close();
  }
}

debug();
