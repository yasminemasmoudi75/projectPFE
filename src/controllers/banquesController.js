const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

exports.getAllBanques = async (req, res, next) => {
  try {
    const banques = await sequelize.query(
      `
        SELECT
          IDBanque AS id,
          LTRIM(RTRIM(Banque)) AS banque,
          Adresse AS adresse,
          CASE WHEN Photo IS NULL THEN 0 ELSE 1 END AS hasPhoto
        FROM TabBanques
        WHERE ISNULL(LTRIM(RTRIM(Banque)), '') <> ''
        ORDER BY LTRIM(RTRIM(Banque)) ASC
      `,
      { type: QueryTypes.SELECT }
    );

    res.json({ status: 'success', data: banques });
  } catch (err) {
    console.error('❌ getAllBanques:', err);
    next(err);
  }
};

exports.createBanque = async (req, res, next) => {
  try {
    const banqueRaw = String(req.body?.banque || '').trim();
    const adresseRaw = String(req.body?.adresse || '').trim();
    const photoBuffer = req.file?.buffer || null;

    if (!banqueRaw) {
      return res.status(400).json({ status: 'error', message: 'Nom de banque obligatoire' });
    }

    const existing = await sequelize.query(
      `
        SELECT TOP 1
          IDBanque AS id,
          LTRIM(RTRIM(Banque)) AS banque,
          Adresse AS adresse,
          CASE WHEN Photo IS NULL THEN 0 ELSE 1 END AS hasPhoto
        FROM TabBanques
        WHERE LOWER(LTRIM(RTRIM(Banque))) = LOWER(:banque)
      `,
      {
        replacements: { banque: banqueRaw },
        type: QueryTypes.SELECT,
      }
    );

    if (existing.length > 0) {
      return res.status(200).json({
        status: 'success',
        created: false,
        data: existing[0],
      });
    }

    const createdRows = await sequelize.transaction(async (transaction) => {
      return sequelize.query(
        `
          DECLARE @NewId INT;

          SELECT @NewId = ISNULL(MAX(IDBanque), 0) + 1
          FROM TabBanques WITH (UPDLOCK, HOLDLOCK);

          INSERT INTO TabBanques (IDBanque, Banque, Adresse, Photo)
          OUTPUT INSERTED.IDBanque AS id, LTRIM(RTRIM(INSERTED.Banque)) AS banque, INSERTED.Adresse AS adresse, CASE WHEN INSERTED.Photo IS NULL THEN 0 ELSE 1 END AS hasPhoto
          VALUES (@NewId, :banque, :adresse, :photo);
        `,
        {
          replacements: {
            banque: banqueRaw,
            adresse: adresseRaw || null,
            photo: photoBuffer,
          },
          transaction,
        }
      );
    });

    const inserted = Array.isArray(createdRows?.[0]) ? createdRows[0][0] : (Array.isArray(createdRows) ? createdRows[0] : null);

    return res.status(201).json({
      status: 'success',
      created: true,
      data: inserted || { banque: banqueRaw, adresse: adresseRaw || null, hasPhoto: photoBuffer ? 1 : 0 },
    });
  } catch (err) {
    console.error('❌ createBanque:', err);
    next(err);
  }
};
