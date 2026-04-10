/*
 * Test scenario: agent visibility in Devis (module 4) depending on TabAWProfileAccess.FiltreRepres.
 *
 * This script:
 * 1) Finds an agent user (preferably with a region)
 * 2) Temporarily sets FiltreRepres=1 for module 4 and captures visibility stats
 * 3) Temporarily sets FiltreRepres=0 for module 4 and captures visibility stats
 * 4) Restores original FiltreRepres values
 */

const { QueryTypes } = require('sequelize');
const { sequelize, DevisMaster } = require('../src/models');
const filterHelper = require('../src/utils/filterHelper');

const normalizeRole = (role) => {
  const value = String(role || '').trim().toLowerCase();
  if (['commercial', 'commerciale'].includes(value)) return 'commercial';
  if (['agent'].includes(value)) return 'agent';
  if (['admin', 'administrateur'].includes(value)) return 'admin';
  return value;
};

const roleAliases = (normalizedRole) => {
  const aliases = {
    admin: ['admin', 'administrateur'],
    commercial: ['commercial', 'commerciale'],
    agent: ['agent']
  };
  return aliases[normalizedRole] || [normalizedRole];
};

const toBooleanFiltre = (value) => value === 1 || value === true || value === '1';

const findAgentUser = async () => {
  const preferredAgentId = process.env.TEST_AGENT_ID;

  if (preferredAgentId) {
    const rows = await sequelize.query(
      `
        SELECT TOP 1
          u.USER_ID AS UserID,
          u.USER_NAME AS LoginName,
          u.REAL_NAME AS FullName,
          u.Gouvernorat AS Gouvernorat,
          p.PROF_DESCRIPTION AS UserRole
        FROM UCS_USERS u
        INNER JOIN UCS_USERINFO ui ON ui.USER_ID = u.USER_ID AND ui.APP_ID = 1
        INNER JOIN UCS_PROFILES p ON p.PROF_ID = ui.PROF_ID
        WHERE LOWER(p.PROF_DESCRIPTION) = 'agent'
          AND u.USER_ID = :preferredAgentId
      `,
      {
        replacements: { preferredAgentId },
        type: QueryTypes.SELECT
      }
    );

    if (rows[0]) {
      return rows[0];
    }

    throw new Error(`Aucun agent trouve avec TEST_AGENT_ID=${preferredAgentId}.`);
  }

  const rows = await sequelize.query(
    `
      SELECT TOP 1
        u.USER_ID AS UserID,
        u.USER_NAME AS LoginName,
        u.REAL_NAME AS FullName,
        u.Gouvernorat AS Gouvernorat,
        p.PROF_DESCRIPTION AS UserRole
      FROM UCS_USERS u
      INNER JOIN UCS_USERINFO ui ON ui.USER_ID = u.USER_ID AND ui.APP_ID = 1
      INNER JOIN UCS_PROFILES p ON p.PROF_ID = ui.PROF_ID
      WHERE LOWER(p.PROF_DESCRIPTION) = 'agent'
      ORDER BY CASE WHEN u.Gouvernorat IS NULL OR LTRIM(RTRIM(CONVERT(NVARCHAR(100), u.Gouvernorat))) = '' THEN 1 ELSE 0 END,
               u.USER_ID ASC
    `,
    { type: QueryTypes.SELECT }
  );

  return rows[0] || null;
};

const getFiltreRows = async (aliases) => {
  return sequelize.query(
    `
      SELECT
        LOWER(ProfileUser) AS ProfileUser,
        CAST(CodMod AS NVARCHAR(20)) AS CodMod,
        FiltreRepres
      FROM TabAWProfileAccess
      WHERE LOWER(ProfileUser) IN (:aliases)
        AND CAST(CodMod AS NVARCHAR(20)) = '4'
      ORDER BY LOWER(ProfileUser)
    `,
    {
      replacements: { aliases },
      type: QueryTypes.SELECT
    }
  );
};

const setFiltreRepres = async (aliases, value) => {
  await sequelize.query(
    `
      UPDATE TabAWProfileAccess
      SET FiltreRepres = :value
      WHERE LOWER(ProfileUser) IN (:aliases)
        AND CAST(CodMod AS NVARCHAR(20)) = '4'
    `,
    {
      replacements: { aliases, value },
      type: QueryTypes.UPDATE
    }
  );
};

const getCommercialScopeForAgent = async (user, filtreRepresEnabled) => {
  if (!filtreRepresEnabled || normalizeRole(user.UserRole) !== 'agent') {
    const rows = await sequelize.query(
      `
        SELECT
          u.USER_ID AS UserID,
          u.USER_NAME AS LoginName,
          u.REAL_NAME AS FullName,
          u.Gouvernorat AS Gouvernorat
        FROM UCS_USERS u
        INNER JOIN UCS_USERINFO ui ON ui.USER_ID = u.USER_ID AND ui.APP_ID = 1
        INNER JOIN UCS_PROFILES p ON p.PROF_ID = ui.PROF_ID
        WHERE LOWER(p.PROF_DESCRIPTION) IN ('commercial', 'commerciale')
        ORDER BY u.REAL_NAME ASC
      `,
      { type: QueryTypes.SELECT }
    );
    return rows;
  }

  if (!user.Gouvernorat) {
    return [];
  }

  const rows = await sequelize.query(
    `
      SELECT
        u.USER_ID AS UserID,
        u.USER_NAME AS LoginName,
        u.REAL_NAME AS FullName,
        u.Gouvernorat AS Gouvernorat
      FROM UCS_USERS u
      INNER JOIN UCS_USERINFO ui ON ui.USER_ID = u.USER_ID AND ui.APP_ID = 1
      INNER JOIN UCS_PROFILES p ON p.PROF_ID = ui.PROF_ID
      WHERE LOWER(p.PROF_DESCRIPTION) IN ('commercial', 'commerciale')
        AND CONVERT(NVARCHAR(100), u.Gouvernorat) = CONVERT(NVARCHAR(100), :region)
      ORDER BY u.REAL_NAME ASC
    `,
    {
      replacements: { region: String(user.Gouvernorat) },
      type: QueryTypes.SELECT
    }
  );

  return rows;
};

const captureScenario = async (user, label) => {
  const filterResult = await filterHelper.applyTableDrivenFiltersWithPagination('4', { page: 1, limit: 1000 }, user);
  const { where } = filterResult;

  const { count, rows } = await DevisMaster.findAndCountAll({
    where,
    attributes: ['Nf', 'CodRepres'],
    order: [['Nf', 'DESC']],
    limit: 1000
  });

  const distinctCodRepres = Array.from(
    new Set(
      rows
        .map((row) => row.CodRepres)
        .filter((value) => value !== null && value !== undefined)
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  );

  const filtreRows = await getFiltreRows(roleAliases(normalizeRole(user.UserRole)));
  const filtreRepresEnabled = toBooleanFiltre(filtreRows[0]?.FiltreRepres);
  const commercialScopeRows = await getCommercialScopeForAgent(user, filtreRepresEnabled);

  return {
    label,
    filtreRepresEnabled,
    devisCount: count,
    distinctCodRepresCount: distinctCodRepres.length,
    distinctCodRepresPreview: distinctCodRepres.slice(0, 15),
    assignableCommercialCount: commercialScopeRows.length,
    assignableCommercialPreview: commercialScopeRows.slice(0, 10).map((row) => ({
      userId: row.UserID,
      fullName: row.FullName,
      gouvernorat: row.Gouvernorat
    }))
  };
};

(async () => {
  let originalRows = [];
  let aliases = [];

  try {
    const user = await findAgentUser();
    if (!user) {
      throw new Error('Aucun utilisateur Agent trouvé dans UCS_USERS/UCS_USERINFO/UCS_PROFILES.');
    }

    user.UserRole = user.UserRole || 'Agent';
    aliases = roleAliases(normalizeRole(user.UserRole));

    console.log('=== TEST VISIBILITE AGENT DANS DEVIS (MODULE 4) ===');
    console.log('Agent selectionne:');
    console.log({
      userId: user.UserID,
      login: user.LoginName,
      fullName: user.FullName,
      role: user.UserRole,
      gouvernorat: user.Gouvernorat || null
    });

    originalRows = await getFiltreRows(aliases);
    if (!originalRows.length) {
      throw new Error('Aucune ligne TabAWProfileAccess trouvee pour role Agent sur module 4.');
    }

    console.log('FiltreRepres avant test (module 4):');
    console.log(originalRows.map((row) => ({
      profileUser: row.ProfileUser,
      codMod: row.CodMod,
      filtreRepres: row.FiltreRepres
    })));

    await setFiltreRepres(aliases, 1);
    const scenarioOn = await captureScenario(user, 'FiltreRepres = ON (1)');

    await setFiltreRepres(aliases, 0);
    const scenarioOff = await captureScenario(user, 'FiltreRepres = OFF (0)');

    console.log('\n--- RESULTATS ---');
    console.log(JSON.stringify({ scenarioOn, scenarioOff }, null, 2));

    console.log('\n--- VERIFICATIONS ATTENDUES ---');
    console.log('- ON: visibilité restreinte par région (si gouvernorat agent renseigné)');
    console.log('- OFF: visibilité élargie (pas de restriction FiltreRepres)');

    if (scenarioOn.devisCount > scenarioOff.devisCount) {
      console.warn('ATTENTION: scenario ON retourne plus de devis que OFF, verifier les donnees ou mapping CodRepres.');
    } else {
      console.log('OK: scenario OFF retourne au moins autant de devis que ON.');
    }
  } catch (error) {
    console.error('ECHEC TEST:', error.message);
    process.exitCode = 1;
  } finally {
    try {
      if (originalRows.length && aliases.length) {
        for (const row of originalRows) {
          await sequelize.query(
            `
              UPDATE TabAWProfileAccess
              SET FiltreRepres = :filtreRepres
              WHERE LOWER(ProfileUser) = :profileUser
                AND CAST(CodMod AS NVARCHAR(20)) = :codMod
            `,
            {
              replacements: {
                filtreRepres: row.FiltreRepres,
                profileUser: row.ProfileUser,
                codMod: row.CodMod
              },
              type: QueryTypes.UPDATE
            }
          );
        }
        console.log('\nFiltreRepres restaure a la valeur initiale.');
      }
    } catch (restoreError) {
      console.error('ERREUR RESTAURATION:', restoreError.message);
      process.exitCode = 1;
    }

    await sequelize.close();
  }
})();
