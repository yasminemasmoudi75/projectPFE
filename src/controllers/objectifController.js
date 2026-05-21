const { Objectif, User } = require('../models');
const { Op } = require('sequelize');
const { normalizeRole, canFlag } = require('../utils/userAccess');

const normalizeInteger = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
};

const normalizeDecimal = (value, fallback = 0) => {
    if (value === undefined || value === null || value === '') return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeDateOnly = (value) => {
    if (!value || value === 'null' || value === 'undefined') return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
};

const extractWeekNumber = (value) => {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : null;
    const match = String(value).match(/([0-9]+)/);
    return match ? parseInt(match[1], 10) : null;
};

const getISOWeekRange = (weekNumber, year) => {
    const week = Number(weekNumber);
    const isoYear = Number(year);
    if (!Number.isInteger(week) || !Number.isInteger(isoYear) || week < 1 || week > 53) {
        return { startDate: null, endDate: null };
    }

    const fourthJanuary = new Date(Date.UTC(isoYear, 0, 4));
    const dayOfWeek = fourthJanuary.getUTCDay() || 7;
    const mondayWeek1 = new Date(fourthJanuary);
    mondayWeek1.setUTCDate(fourthJanuary.getUTCDate() - dayOfWeek + 1);

    const start = new Date(mondayWeek1);
    start.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);

    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);

    const toDateOnly = (date) => date.toISOString().split('T')[0];
    return { startDate: toDateOnly(start), endDate: toDateOnly(end) };
};

const buildWeeklyPeriod = ({ Semaine, Numsem, Annee, DateDebut, DateFin }) => {
    const weekNumber = extractWeekNumber(Numsem ?? Semaine);
    const year = normalizeInteger(Annee) || new Date().getFullYear();
    const computedRange = getISOWeekRange(weekNumber, year);

    return {
        Numsem: weekNumber,
        Semaine: weekNumber ? `Semaine ${weekNumber}` : (Semaine || null),
        DateDebut: normalizeDateOnly(DateDebut) || computedRange.startDate,
        DateFin: normalizeDateOnly(DateFin) || computedRange.endDate,
        Annee: year
    };
};

// Map TypeObjectif (string or integer) to nf indicator type (0-13, null = financial default)
const getNfValue = (objectif) => {
    if (objectif.nf !== undefined && objectif.nf !== null) {
        const parsed = parseInt(objectif.nf, 10);
        if (Number.isFinite(parsed)) return parsed;
    }
    const typeObj = objectif.TypeObjectif;
    if (typeObj !== null && typeObj !== undefined && typeObj !== '') {
        const trimmed = String(typeObj).trim();
        const asInt = parseInt(trimmed, 10);
        if (Number.isFinite(asInt) && String(asInt) === trimmed) return asInt;
        const nfMap = {
            'ACTIVITES': 0, 'ACTIVITE': 0, 'CALLS': 0,
            'VISITES_PRIVEES': 1, 'VISITES PRIVEES': 1, 'VISITES_PRIV': 1,
            'VISITES_ETATIQUES': 2, 'VISITES ETATIQUES': 2, 'VISITES_ETAT': 2,
            'PROJETS_FISHER': 3, 'FISHER': 3,
            'PROJETS_PRESI': 4, 'PRESI': 4,
            'PROJETS_ZEISS': 5, 'ZEISS': 5,
            'CONTACTS_ETATIQUES': 6, 'CONTACTS_ETAT': 6,
            'CONTACTS_PRIVES': 7, 'CONTACTS_PRIV': 7,
            'CONTACTS': 8, 'TOTAL_CONTACTS': 8,
            'SOCIETES_ETATIQUES': 9, 'SOCIETES_ETAT': 9,
            'PROJETS': 10, 'TOTAL_PROJETS': 10,
        };
        const upper = trimmed.toUpperCase();
        if (upper in nfMap) return nfMap[upper];
    }
    return null; // financial default
};

const extractCount = (results) => {
    const val = results?.[0]?.total ?? results?.[0]?.TOTAL ?? results?.[0]?.Total ?? 0;
    return Number.isFinite(Number(val)) ? parseInt(val, 10) : 0;
};

const extractTotal = (results) => {
    const val = results?.[0]?.total ?? results?.[0]?.TOTAL ?? results?.[0]?.Total ?? 0;
    return Number.isFinite(Number(val)) ? parseFloat(val) : 0;
};

/**
 * Batch version: fetches all objectives + computed realised values in ONE SQL query.
 * Uses CASE WHEN correlated subqueries — same business logic as calculateRealisedForObjectif
 * but without N+1 round-trips.
 * @param {object} filters - { idCont, mois, annee, numsem }
 * @returns {Promise<Array>} raw rows with valeurRealisee column
 */
const getObjectifsWithRealisedSQL = async ({ idCont, mois, annee, numsem } = {}) => {
    const { sequelize } = require('../models');

    const conditions = [];
    const replacements = {};

    if (idCont) {
        conditions.push('O.IdCont = :idCont');
        replacements.idCont = idCont;
    }
    if (mois) {
        conditions.push('O.Mois = :mois');
        replacements.mois = String(mois);
    }
    if (annee) {
        conditions.push('O.Anne = :annee');
        replacements.annee = String(annee);
    }
    if (numsem !== undefined && numsem !== null) {
        conditions.push('O.Numsem = :numsem');
        replacements.numsem = parseInt(numsem, 10);
    }

    const whereSQL = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // CommercialCode = USER_ID (en string) résolu depuis IdCont → UCS_USERS.GUID
    // C'est l'identifiant commercial utilisé dans TabActivite.[User], TabTiers.codRepresTiers,
    // TabTiersContactCrm.codRepres et tabProjet.CodCom
    const sql = `
        WITH ObjDates AS (
            SELECT
                O.IdObj             AS ID_Objectif,
                O.IdCont,
                O.TypeObj           AS TypeObjectif,
                O.[type]            AS TypePeriode,
                O.DateD             AS DateDebut,
                O.DateF             AS DateFin,
                O.Mois,
                O.Anne              AS Annee,
                O.Numsem,
                O.autObj            AS MontantCible,
                O.autVal            AS Montant_Realise_Actuel,
                O.CodTiers,
                O.StatutObjectif,
                O.Discription       AS Libelle_Indicateur,
                O.DateCreation,
                O.DateArchivage,
                O.NombreReglementsLies,
                -- Identifiant commercial : USER_ID string (via IdCont→GUID→UCS_USERS)
                U.USER_ID                       AS utilisateur_UserID,
                U.REAL_NAME                     AS utilisateur_FullName,
                U.USER_NAME                     AS utilisateur_EmailPro,
                U.GUID                          AS utilisateur_GUID,
                CAST(U.USER_ID AS NVARCHAR(50)) AS CommercialCode,
                -- Type indicateur : colonne nf d'abord, sinon TypeObj converti en entier
                COALESCE(
                    TRY_CAST(O.nf AS INT),
                    TRY_CAST(O.TypeObj AS INT)
                ) AS nf_resolved,
                -- Début de période : MAX(début calendaire, DATE de création objectif tronquée à minuit)
                -- Mdate est souvent stocké sans heure → on compare date-à-date pour éviter d'exclure
                -- les activités du jour même de création
                CASE
                    WHEN O.[type] = 'Mensuel' OR (O.[type] IS NULL AND O.Mois IS NOT NULL)
                        THEN (
                            CASE
                                WHEN CAST(O.DateCreation AS date) > CAST(DATEFROMPARTS(
                                    ISNULL(TRY_CAST(O.Anne AS INT), YEAR(GETDATE())),
                                    ISNULL(TRY_CAST(O.Mois AS INT), MONTH(GETDATE())),
                                    1
                                ) AS date)
                                THEN CAST(CAST(O.DateCreation AS date) AS datetime)
                                ELSE CAST(DATEFROMPARTS(
                                    ISNULL(TRY_CAST(O.Anne AS INT), YEAR(GETDATE())),
                                    ISNULL(TRY_CAST(O.Mois AS INT), MONTH(GETDATE())),
                                    1
                                ) AS datetime)
                            END
                        )
                    ELSE (
                        CASE
                            WHEN CAST(O.DateCreation AS date) > TRY_CAST(O.DateD AS date)
                            THEN CAST(CAST(O.DateCreation AS date) AS datetime)
                            ELSE TRY_CAST(O.DateD AS datetime)
                        END
                    )
                END AS StartDate,
                -- Fin de période
                CASE
                    WHEN O.[type] = 'Mensuel' OR (O.[type] IS NULL AND O.Mois IS NOT NULL)
                        THEN CAST(EOMONTH(DATEFROMPARTS(
                            ISNULL(TRY_CAST(O.Anne AS INT), YEAR(GETDATE())),
                            ISNULL(TRY_CAST(O.Mois AS INT), MONTH(GETDATE())),
                            1
                        )) AS datetime)
                    ELSE DATEADD(SECOND, 86399, TRY_CAST(O.DateF AS datetime))
                END AS EndDate
            FROM Objectif O WITH (NOLOCK)
            -- Résolution commercial : IdCont (GUID) → USER_ID
            LEFT JOIN UCS_USERS U WITH (NOLOCK)
                ON REPLACE(REPLACE(ISNULL(CAST(O.IdCont AS NVARCHAR(50)), ''), '{', ''), '}', '')
                 = REPLACE(REPLACE(ISNULL(U.GUID, ''), '{', ''), '}', '')
            ${whereSQL}
        )
        SELECT
            OD.*,
            -- Valeur réalisée calculée par CASE WHEN selon le type d'indicateur (nf)
            CASE
                -- nf=0 : Tâches / Appels — toutes activités validées du commercial
                WHEN OD.nf_resolved = 0 THEN (
                    SELECT ISNULL(COUNT(Guid), 0)
                    FROM TabActivite WITH (NOLOCK)
                    WHERE TRY_CONVERT(datetime, Mdate) >= OD.StartDate
                      AND TRY_CONVERT(datetime, Mdate) <= OD.EndDate
                      AND CAST([User] AS NVARCHAR(50)) = OD.CommercialCode
                      AND Valide = 1
                )
                -- nf=1 : Visites Privées — activités liées à une société Privée (Niveau != 7)
                WHEN OD.nf_resolved = 1 THEN (
                    SELECT ISNULL(COUNT(A.Guid), 0)
                    FROM TabActivite A WITH (NOLOCK)
                    INNER JOIN TabTiers T WITH (NOLOCK) ON A.CodTiers = T.CodTiers
                    WHERE TRY_CONVERT(datetime, A.Mdate) >= OD.StartDate
                      AND TRY_CONVERT(datetime, A.Mdate) <= OD.EndDate
                      AND CAST(A.[User] AS NVARCHAR(50)) = OD.CommercialCode
                      AND A.Valide = 1
                      AND (T.Niveau IS NULL OR T.Niveau != 7)
                )
                -- nf=2 : Visites Étatiques — activités liées à une société Étatique (Niveau = 7)
                WHEN OD.nf_resolved = 2 THEN (
                    SELECT ISNULL(COUNT(A.Guid), 0)
                    FROM TabActivite A WITH (NOLOCK)
                    INNER JOIN TabTiers T WITH (NOLOCK) ON A.CodTiers = T.CodTiers
                    WHERE TRY_CONVERT(datetime, A.Mdate) >= OD.StartDate
                      AND TRY_CONVERT(datetime, A.Mdate) <= OD.EndDate
                      AND CAST(A.[User] AS NVARCHAR(50)) = OD.CommercialCode
                      AND A.Valide = 1
                      AND T.Niveau = 7
                )
                -- nf=3 : Projets Fisher
                WHEN OD.nf_resolved = 3 THEN (
                    SELECT ISNULL(COUNT(idpojet), 0)
                    FROM tabProjet WITH (NOLOCK)
                    WHERE dateSave >= OD.StartDate AND dateSave <= OD.EndDate
                      AND CAST(CodCom AS NVARCHAR(50)) = OD.CommercialCode
                      AND (CodFor = 'FR4110053' OR Fornisseur LIKE '%Fisher%')
                )
                -- nf=4 : Projets Presi
                WHEN OD.nf_resolved = 4 THEN (
                    SELECT ISNULL(COUNT(idpojet), 0)
                    FROM tabProjet WITH (NOLOCK)
                    WHERE dateSave >= OD.StartDate AND dateSave <= OD.EndDate
                      AND CAST(CodCom AS NVARCHAR(50)) = OD.CommercialCode
                      AND CodFor = 'FR411023'
                )
                -- nf=5 : Projets Zeiss
                WHEN OD.nf_resolved = 5 THEN (
                    SELECT ISNULL(COUNT(idpojet), 0)
                    FROM tabProjet WITH (NOLOCK)
                    WHERE dateSave >= OD.StartDate AND dateSave <= OD.EndDate
                      AND CAST(CodCom AS NVARCHAR(50)) = OD.CommercialCode
                      AND CodFor = 'FR411032'
                )
                -- nf=6 : Contacts Étatiques — société à Niveau = 7
                WHEN OD.nf_resolved = 6 THEN (
                    SELECT ISNULL(COUNT(C.ID), 0)
                    FROM TabTiersContact C WITH (NOLOCK)
                    INNER JOIN TabTiers T WITH (NOLOCK) ON C.IDTiers = T.IDTiers
                    WHERE T.codRepresTiers = OD.CommercialCode
                      AND T.Niveau = 7
                )
                -- nf=7 : Contacts Privés — société à Niveau != 7
                WHEN OD.nf_resolved = 7 THEN (
                    SELECT ISNULL(COUNT(C.ID), 0)
                    FROM TabTiersContact C WITH (NOLOCK)
                    INNER JOIN TabTiers T WITH (NOLOCK) ON C.IDTiers = T.IDTiers
                    WHERE T.codRepresTiers = OD.CommercialCode
                      AND (T.Niveau IS NULL OR T.Niveau != 7)
                )
                -- nf=8 : Total Contacts
                WHEN OD.nf_resolved = 8 THEN (
                    SELECT ISNULL(COUNT(C.ID), 0)
                    FROM TabTiersContact C WITH (NOLOCK)
                    INNER JOIN TabTiers T WITH (NOLOCK) ON C.IDTiers = T.IDTiers
                    WHERE T.codRepresTiers = OD.CommercialCode
                )
                -- nf=9 : Sociétés Étatiques — Niveau = 7
                WHEN OD.nf_resolved = 9 THEN (
                    SELECT ISNULL(COUNT(T.IDTiers), 0)
                    FROM TabTiers T WITH (NOLOCK)
                    WHERE T.codRepresTiers = OD.CommercialCode
                      AND T.Niveau = 7
                )
                -- nf=10 : Total Projets
                WHEN OD.nf_resolved = 10 THEN (
                    SELECT ISNULL(COUNT(*), 0)
                    FROM tabProjet WITH (NOLOCK)
                    WHERE dateSave >= OD.StartDate AND dateSave <= OD.EndDate
                      AND CAST(CodCom AS NVARCHAR(50)) = OD.CommercialCode
                )
                -- nf>=13 : Toutes les activités validées du commercial (sans filtre type)
                WHEN OD.nf_resolved >= 13 THEN (
                    SELECT ISNULL(COUNT(A.Guid), 0)
                    FROM TabActivite A WITH (NOLOCK)
                    WHERE TRY_CONVERT(datetime, A.Mdate) >= OD.StartDate
                      AND TRY_CONVERT(datetime, A.Mdate) <= OD.EndDate
                      AND CAST(A.[User] AS NVARCHAR(50)) = OD.CommercialCode
                      AND A.Valide = 1
                )
                -- Défaut : indicateur financier — somme des règlements du commercial
                ELSE (
                    SELECT ISNULL(SUM(r.MntReg), 0)
                    FROM TabReg r WITH (NOLOCK)
                    LEFT JOIN TabTiers t WITH (NOLOCK) ON r.CodTiers = t.CodTiers
                    WHERE t.codRepresTiers = OD.CommercialCode
                      AND r.Payed = 1
                      AND r.DatReg >= OD.StartDate AND r.DatReg <= OD.EndDate
                )
            END AS valeurRealisee
        FROM ObjDates OD
        ORDER BY OD.StartDate DESC, OD.ID_Objectif DESC
    `;

    return sequelize.query(sql, {
        replacements,
        type: sequelize.QueryTypes.SELECT
    });
};

const calculateRealisedForObjectif = async (objectif) => {
    try {
        if (!objectif) return 0;

        const { sequelize } = require('../models');

        // Le commercial est identifié par IdCont (GUID) → USER_ID dans UCS_USERS
        // CodTiers dans Objectif est NULL pour tous les objectifs du CRM, on utilise IdCont
        const idCont = String(objectif.IdCont || objectif.getDataValue?.('IdCont') || '').trim();
        if (!idCont) return 0;

        const cleanGuid = idCont.replace(/^\{|\}$/g, '').trim();
        const userRows = await sequelize.query(
            `SELECT USER_ID FROM UCS_USERS WITH (NOLOCK)
             WHERE REPLACE(REPLACE(ISNULL(GUID,''),'{',''),'}','') = :guid`,
            { replacements: { guid: cleanGuid }, type: sequelize.QueryTypes.SELECT }
        );
        if (!userRows || userRows.length === 0) return 0;

        // CommercialCode = USER_ID as string (correspond à TabActivite.[User], TabTiers.codRepresTiers)
        const commercialCode = String(userRows[0].USER_ID).trim();
        if (!commercialCode) return 0;

        // Build date range from period type
        let startDate, endDate;

        if (objectif.TypePeriode === 'Mensuel' || (!objectif.TypePeriode && objectif.Mois)) {
            const year  = parseInt(objectif.Annee, 10);
            const month = parseInt(objectif.Mois,  10);
            if (!year || !month) return 0;

            const firstOfMonth = new Date(year, month - 1, 1);
            let dateCreation = null;
            if (objectif.DateCreation) {
                const dc = objectif.DateCreation instanceof Date
                    ? new Date(objectif.DateCreation.getTime())
                    : new Date(objectif.DateCreation);
                if (!isNaN(dc.getTime())) {
                    // Truncate to midnight so same-day activities (stored as date-only) still count
                    dc.setHours(0, 0, 0, 0);
                    dateCreation = dc;
                }
            }
            startDate = (dateCreation && dateCreation > firstOfMonth) ? dateCreation : firstOfMonth;
            endDate   = new Date(year, month, 0, 23, 59, 59, 999);

        } else if (objectif.TypePeriode === 'Hebdomadaire') {
            if (!objectif.DateDebut || !objectif.DateFin) return 0;

            const weekStart = new Date(objectif.DateDebut);
            let dateCreation = null;
            if (objectif.DateCreation) {
                const dc = objectif.DateCreation instanceof Date
                    ? new Date(objectif.DateCreation.getTime())
                    : new Date(objectif.DateCreation);
                if (!isNaN(dc.getTime())) {
                    dc.setHours(0, 0, 0, 0);
                    dateCreation = dc;
                }
            }
            startDate = (dateCreation && dateCreation > weekStart) ? dateCreation : weekStart;
            endDate   = new Date(objectif.DateFin);
            endDate.setHours(23, 59, 59, 999);
        } else {
            return 0;
        }

        if (String(objectif.StatutObjectif || '').toUpperCase() === 'ARCHIVÉ' && objectif.DateArchivage) {
            endDate = new Date(objectif.DateArchivage);
        }

        const fmt = (d) => {
            if (!d || !(d instanceof Date) || isNaN(d.getTime())) throw new Error(`Invalid date: ${d}`);
            const z = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
        };

        const sd = fmt(startDate);
        const ed = fmt(endDate);

        const nf = getNfValue(objectif);

        // nf=0 : Tâches / Appels — toutes activités validées du commercial
        if (nf === 0) {
            const results = await sequelize.query(`
                SELECT COUNT(Guid) AS total FROM TabActivite
                WHERE TRY_CONVERT(datetime, Mdate) >= :sd
                  AND TRY_CONVERT(datetime, Mdate) <= :ed
                  AND CAST([User] AS NVARCHAR(50)) = :cc
                  AND Valide = 1
            `, { replacements: { sd, ed, cc: commercialCode }, type: sequelize.QueryTypes.SELECT });
            return extractCount(results);
        }

        // nf=1 : Visites Privées — activité liée à une société Privée (Niveau != 7)
        if (nf === 1) {
            const results = await sequelize.query(`
                SELECT COUNT(A.Guid) AS total FROM TabActivite A
                INNER JOIN TabTiers T ON A.CodTiers = T.CodTiers
                WHERE TRY_CONVERT(datetime, A.Mdate) >= :sd
                  AND TRY_CONVERT(datetime, A.Mdate) <= :ed
                  AND CAST(A.[User] AS NVARCHAR(50)) = :cc
                  AND A.Valide = 1
                  AND (T.Niveau IS NULL OR T.Niveau != 7)
            `, { replacements: { sd, ed, cc: commercialCode }, type: sequelize.QueryTypes.SELECT });
            return extractCount(results);
        }

        // nf=2 : Visites Étatiques — activité liée à une société Étatique (Niveau = 7)
        if (nf === 2) {
            const results = await sequelize.query(`
                SELECT COUNT(A.Guid) AS total FROM TabActivite A
                INNER JOIN TabTiers T ON A.CodTiers = T.CodTiers
                WHERE TRY_CONVERT(datetime, A.Mdate) >= :sd
                  AND TRY_CONVERT(datetime, A.Mdate) <= :ed
                  AND CAST(A.[User] AS NVARCHAR(50)) = :cc
                  AND A.Valide = 1
                  AND T.Niveau = 7
            `, { replacements: { sd, ed, cc: commercialCode }, type: sequelize.QueryTypes.SELECT });
            return extractCount(results);
        }

        // nf=3 : Projets Fisher
        if (nf === 3) {
            const results = await sequelize.query(`
                SELECT COUNT(idpojet) AS total FROM tabProjet
                WHERE dateSave >= :sd AND dateSave <= :ed
                  AND CAST(CodCom AS NVARCHAR(50)) = :cc
                  AND (CodFor = 'FR4110053' OR Fornisseur LIKE '%Fisher%')
            `, { replacements: { sd, ed, cc: commercialCode }, type: sequelize.QueryTypes.SELECT });
            return extractCount(results);
        }

        // nf=4 : Projets Presi
        if (nf === 4) {
            const results = await sequelize.query(`
                SELECT COUNT(idpojet) AS total FROM tabProjet
                WHERE dateSave >= :sd AND dateSave <= :ed
                  AND CAST(CodCom AS NVARCHAR(50)) = :cc AND CodFor = 'FR411023'
            `, { replacements: { sd, ed, cc: commercialCode }, type: sequelize.QueryTypes.SELECT });
            return extractCount(results);
        }

        // nf=5 : Projets Zeiss
        if (nf === 5) {
            const results = await sequelize.query(`
                SELECT COUNT(idpojet) AS total FROM tabProjet
                WHERE dateSave >= :sd AND dateSave <= :ed
                  AND CAST(CodCom AS NVARCHAR(50)) = :cc AND CodFor = 'FR411032'
            `, { replacements: { sd, ed, cc: commercialCode }, type: sequelize.QueryTypes.SELECT });
            return extractCount(results);
        }

        // nf=6 : Contacts Étatiques — société à Niveau = 7
        if (nf === 6) {
            const results = await sequelize.query(`
                SELECT COUNT(C.ID) AS total FROM TabTiersContact C
                INNER JOIN TabTiers T ON C.IDTiers = T.IDTiers
                WHERE T.codRepresTiers = :cc
                  AND T.Niveau = 7
            `, { replacements: { cc: commercialCode }, type: sequelize.QueryTypes.SELECT });
            return extractCount(results);
        }

        // nf=7 : Contacts Privés — société à Niveau != 7
        if (nf === 7) {
            const results = await sequelize.query(`
                SELECT COUNT(C.ID) AS total FROM TabTiersContact C
                INNER JOIN TabTiers T ON C.IDTiers = T.IDTiers
                WHERE T.codRepresTiers = :cc
                  AND (T.Niveau IS NULL OR T.Niveau != 7)
            `, { replacements: { cc: commercialCode }, type: sequelize.QueryTypes.SELECT });
            return extractCount(results);
        }

        // nf=8 : Total Contacts
        if (nf === 8) {
            const results = await sequelize.query(`
                SELECT COUNT(C.ID) AS total FROM TabTiersContact C
                INNER JOIN TabTiers T ON C.IDTiers = T.IDTiers
                WHERE T.codRepresTiers = :cc
            `, { replacements: { cc: commercialCode }, type: sequelize.QueryTypes.SELECT });
            return extractCount(results);
        }

        // nf=9 : Sociétés Étatiques — Niveau = 7
        if (nf === 9) {
            const results = await sequelize.query(`
                SELECT COUNT(T.IDTiers) AS total FROM TabTiers T
                WHERE T.codRepresTiers = :cc
                  AND T.Niveau = 7
            `, { replacements: { cc: commercialCode }, type: sequelize.QueryTypes.SELECT });
            return extractCount(results);
        }

        // nf=10 : Total Projets
        if (nf === 10) {
            const results = await sequelize.query(`
                SELECT COUNT(*) AS total FROM tabProjet
                WHERE dateSave >= :sd AND dateSave <= :ed
                  AND CAST(CodCom AS NVARCHAR(50)) = :cc
            `, { replacements: { sd, ed, cc: commercialCode }, type: sequelize.QueryTypes.SELECT });
            return extractCount(results);
        }

        // nf >= 13 : Toutes les activités validées du commercial (sans filtre type)
        if (nf !== null && nf >= 13) {
            const results = await sequelize.query(`
                SELECT COUNT(A.Guid) AS total FROM TabActivite A
                WHERE TRY_CONVERT(datetime, A.Mdate) >= :sd
                  AND TRY_CONVERT(datetime, A.Mdate) <= :ed
                  AND CAST(A.[User] AS NVARCHAR(50)) = :cc
                  AND A.Valide = 1
            `, { replacements: { sd, ed, cc: commercialCode }, type: sequelize.QueryTypes.SELECT });
            return extractCount(results);
        }

        // Défaut : indicateur financier — somme des règlements du commercial
        const results = await sequelize.query(`
            SELECT ISNULL(SUM(r.MntReg), 0) AS total FROM TabReg r
            LEFT JOIN TabTiers t ON r.CodTiers = t.CodTiers
            WHERE t.codRepresTiers = :cc
              AND r.Payed = 1
              AND r.DatReg >= :sd AND r.DatReg <= :ed
        `, { replacements: { cc: commercialCode, sd, ed }, type: sequelize.QueryTypes.SELECT });
        const total = extractTotal(results);
        console.log(`[Objectif ${objectif.ID_Objectif}] financier user=${commercialCode} période=${sd}→${ed} réalisé=${total}`);
        return total;

    } catch (err) {
        console.error('Erreur calcul réalisé:', err);
        return 0;
    }
};

const isValidUUID = (str) => {
    if (!str || typeof str !== 'string') return false;
    // Regex for UUID (optional braces)
    const uuidRegex = /^\{?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}?$/i;
    return uuidRegex.test(str.trim());
};

const resolveUserForObjectif = async (userId) => {
    const normalizedUserId = normalizeInteger(userId);
    if (!normalizedUserId) return null;

    const user = await User.findByPk(normalizedUserId);
    if (!user) {
        return { error: `Utilisateur introuvable pour ID_Utilisateur=${userId}` };
    }
    if (!user.GUID || !isValidUUID(user.GUID)) {
        const crypto = require('crypto');
        const newGuid = crypto.randomUUID().toUpperCase();
        
        try {
            const { sequelize } = require('../models');
            await sequelize.query('UPDATE UCS_USERS SET GUID = :guid WHERE USER_ID = :id', {
                replacements: { guid: newGuid, id: user.UserID }
            });
            user.GUID = newGuid;
            console.log(`✅ Assigned new GUID ${newGuid} to user ${user.UserID}`);
        } catch (err) {
            console.error(`❌ Failed to assign GUID to user ${user.UserID}:`, err);
            return { error: `Impossible d'assigner un identifiant unique au commercial #${normalizedUserId}` };
        }
    }

    return { user, normalizedUserId };
};

const objectifInclude = [
    {
        model: User,
        as: 'utilisateur',
        attributes: ['UserID', 'FullName', 'EmailPro', 'GUID'],
        required: false
    }
];

const hydrateObjectif = async (id) => Objectif.findByPk(id, {
    include: objectifInclude
});

const isStaffRole = (role) => {
    const normalized = normalizeRole(role);
    return ['commercial', 'agent', 'technicien'].includes(normalized);
};

const buildCommercialObjectifScope = (user = {}) => {
    const guid = user?.GUID ? String(user.GUID).trim() : null;

    if (!guid || !isValidUUID(guid)) {
        console.warn(`⚠️ User ${user?.UserID} has invalid or missing GUID: "${guid}". Falling back to NIL UUID.`);
        return { IdCont: '00000000-0000-0000-0000-000000000000' };
    }

    return { IdCont: guid };
};

const isObjectifRelatedToCommercial = (objectif, user = {}) => {
    const userGuid = user?.GUID ? String(user.GUID).toLowerCase() : null;
    const objectifGuid = objectif?.IdCont ? String(objectif.IdCont).toLowerCase() : null;

    return userGuid && objectifGuid && userGuid === objectifGuid;
};

/**
 * Vérifier qu'un commercial n'a pas déjà un objectif actif avec le même TypeObjectif pour la même période.
 * Mensuel : unicité par (IdCont, TypeObjectif, TypePeriode, Mois, Annee)
 * Hebdomadaire : unicité par (IdCont, TypeObjectif, TypePeriode, Numsem, Annee)
 */
const checkDuplicateIndicateur = async (userGuid, typePeriode, typeObjectif, mois, annee, numsem) => {
    if (!userGuid || !typeObjectif) return null;

    try {
        const where = {
            IdCont: userGuid,
            TypeObjectif: typeObjectif,
            TypePeriode: typePeriode,
            StatutObjectif: { [Op.in]: ['ACTIF', 'ATTEINT'] }
        };

        if (typePeriode === 'Mensuel') {
            where.Mois = mois;
            where.Annee = annee;
        } else if (typePeriode === 'Hebdomadaire') {
            where.Numsem = numsem;
            where.Annee = annee;
        }

        const existing = await Objectif.findOne({ where });
        if (existing) {
            return {
                error: `Ce commercial a déjà un objectif actif avec l'indicateur "${typeObjectif}" pour cette période.`
            };
        }
        return null;
    } catch (error) {
        console.error('❌ Erreur vérification doublon indicateur:', error);
        return null;
    }
};

/**
 * Créer un nouvel objectif
 */
exports.createObjectif = async (req, res, next) => {
    try {
        const {
            ID_Utilisateur,
            CodTiers,
            Mois,
            Annee,
            Semaine,
            Numsem,
            DateDebut,
            DateFin,
            MontantCible,
            Montant_Realise_Actuel,
            TypeObjectif,
            TypePeriode,
            Libelle_Indicateur,
            Statut,
            ID_Objectif_Parent,
            nf
        } = req.body;

        const shouldFilterByCommercial = canFlag(req.permissions?.FiltreRepres);
        const effectiveUserId = shouldFilterByCommercial
            ? (req.user?.UserID || req.user?.id)
            : ID_Utilisateur;

        void ID_Objectif_Parent;

        // Validation selon le type de période
        if (TypePeriode === 'Mensuel') {
            if (!effectiveUserId || !Mois || !Annee || MontantCible === undefined || MontantCible === null) {
                return res.status(400).json({
                    status: 'error',
                    message: 'L\'utilisateur, le mois, l\'année et le montant cible sont obligatoires pour un objectif mensuel'
                });
            }
        } else if (TypePeriode === 'Hebdomadaire') {
            if (!effectiveUserId || (!Semaine && !Numsem) || !DateDebut || !DateFin) {
                return res.status(400).json({
                    status: 'error',
                    message: 'L\'utilisateur, la semaine, la date de début et la date de fin sont obligatoires pour un objectif hebdomadaire'
                });
            }
        }

        const resolvedUser = await resolveUserForObjectif(effectiveUserId);
        if (resolvedUser?.error) {
            return res.status(400).json({
                status: 'error',
                message: resolvedUser.error
            });
        }

        // Vérifier qu'un objectif avec le même indicateur n'existe pas déjà pour cette période
        const resolvedNumsem = extractWeekNumber(Numsem ?? Semaine);
        const conflictCheck = await checkDuplicateIndicateur(
            resolvedUser?.user?.GUID,
            TypePeriode,
            TypeObjectif,
            normalizeInteger(Mois),
            normalizeInteger(Annee),
            resolvedNumsem
        );

        if (conflictCheck?.error) {
            return res.status(409).json({
                status: 'error',
                message: conflictCheck.error
            });
        }

        const weeklyPeriod = TypePeriode === 'Hebdomadaire'
            ? buildWeeklyPeriod({ Semaine, Numsem, Annee, DateDebut, DateFin })
            : null;

        const { sequelize } = require('../models');

        const newObjectif = await Objectif.create({
            IdCont: resolvedUser?.user?.GUID || null,
            ID_Utilisateur: resolvedUser?.normalizedUserId || null,
            CodTiers: CodTiers ? String(CodTiers).trim() : null,
            Mois: TypePeriode === 'Mensuel' ? normalizeInteger(Mois) : null,
            Annee: TypePeriode === 'Mensuel'
                ? normalizeInteger(Annee)
                : weeklyPeriod?.Annee || normalizeInteger(DateDebut ? String(DateDebut).slice(0, 4) : null),
            Numsem: TypePeriode === 'Hebdomadaire' ? weeklyPeriod?.Numsem : null,
            Semaine: TypePeriode === 'Hebdomadaire' ? weeklyPeriod?.Semaine : null,
            DateDebut: TypePeriode === 'Hebdomadaire' ? weeklyPeriod?.DateDebut : null,
            DateFin: TypePeriode === 'Hebdomadaire' ? weeklyPeriod?.DateFin : null,
            DateCreation: sequelize.fn('GETDATE'),
            MontantCible: normalizeDecimal(MontantCible, 0),
            Montant_Realise_Actuel: normalizeDecimal(Montant_Realise_Actuel, 0),
            TypeObjectif: TypeObjectif || null,
            TypePeriode: TypePeriode || 'Mensuel',
            Libelle_Indicateur: Libelle_Indicateur || null,
            nf: normalizeInteger(nf),
            StatutObjectif: 'ACTIF'
        });

        const hydratedObjectif = await hydrateObjectif(newObjectif.ID_Objectif);
        if (hydratedObjectif) {
            try { hydratedObjectif.setDataValue('AutObjAffiche', hydratedObjectif.get('AutObjAffiche')); } catch (e) { }
        }

        res.status(201).json({
            status: 'success',
            message: 'Objectif créé avec succès',
            data: hydratedObjectif || newObjectif
        });
    } catch (error) {
        console.error('❌ Erreur création objectif:', error);
        next(error);
    }
};

/**
 * Récupérer tous les objectifs
 */
exports.getAllObjectifs = async (req, res, next) => {
    try {
        const { userId, mois, annee, semaine, tiersId, projetId, statut } = req.query;
        
        // On détecte si l'utilisateur est commercial (rôle)
        const normalizedRole = normalizeRole(req.user?.UserRole);
        const isCommercial = normalizedRole === 'commercial';
        const shouldFilterByCommercial = canFlag(req.permissions?.FiltreRepres) || isCommercial;
        const where = shouldFilterByCommercial
            ? buildCommercialObjectifScope(req.user)
            : {};

        void tiersId;
        void projetId;

        // Un commercial (rôle ou FiltreRepres) ne peut voir QUE ses propres objectifs, jamais ceux d'un autre
        if (shouldFilterByCommercial) {
            // On ignore totalement userId passé en paramètre
            // where.IdCont est déjà forcé à l'utilisateur courant via buildCommercialObjectifScope
        } else if (userId && userId !== 'null') {
            // Pour les autres rôles (admin, manager...), on peut filtrer sur userId
            const resolvedUser = await resolveUserForObjectif(userId);
            if (!resolvedUser || resolvedUser.error) {
                return res.status(200).json({
                    status: 'success',
                    count: 0,
                    data: []
                });
            }
            where.IdCont = resolvedUser.user.GUID;
        }
        const sqlFilters = {};
        if (where.IdCont) sqlFilters.idCont = where.IdCont;
        if (mois)         sqlFilters.mois   = mois;
        if (annee)        sqlFilters.annee  = annee;
        if (semaine)      sqlFilters.numsem = semaine;

        const rawRows = await getObjectifsWithRealisedSQL(sqlFilters);

        // Persist updated realised values for ACTIF objectives and shape response
        const { sequelize } = require('../models');
        const objectifs = await Promise.all(rawRows.map(async (row) => {
            const realized = Number(row.valeurRealisee) || 0;
            const stored   = Number(row.Montant_Realise_Actuel) || 0;

            if (String(row.StatutObjectif || '').toUpperCase() === 'ACTIF' && stored !== realized) {
                await sequelize.query(
                    `UPDATE Objectif SET autVal = :v WHERE IdObj = :id`,
                    { replacements: { v: String(realized), id: row.ID_Objectif } }
                );
            }

            const target = Number(row.MontantCible) || 0;
            const avancement = target > 0 ? Math.min(Math.round((realized / target) * 100), 100) : 0;
            const nfVal = row.nf_resolved !== undefined ? row.nf_resolved : null;
            const isCount = nfVal !== null;
            const fmtVal = isCount
                ? (v) => Math.round(v).toString()
                : (v) => v.toFixed(2).replace('.', ',');
            const unit = isCount ? '' : ' TND';

            return {
                ID_Objectif:           row.ID_Objectif,
                IdCont:                row.IdCont,
                TypeObjectif:          row.TypeObjectif,
                TypePeriode:           row.TypePeriode || (row.Numsem ? 'Hebdomadaire' : 'Mensuel'),
                DateDebut:             row.DateDebut,
                DateFin:               row.DateFin,
                Mois:                  row.Mois ? parseInt(row.Mois, 10) : null,
                Annee:                 row.Annee ? parseInt(row.Annee, 10) : null,
                Numsem:                row.Numsem || null,
                Semaine:               row.Numsem ? `Semaine ${row.Numsem}` : null,
                MontantCible:          target,
                Montant_Realise_Actuel: realized,
                autObj:                target,
                autVal:                realized,
                nf:                    nfVal,
                CodTiers:              row.CodTiers || null,
                StatutObjectif:        row.StatutObjectif,
                Libelle_Indicateur:    row.Libelle_Indicateur,
                DateCreation:          row.DateCreation,
                DateArchivage:         row.DateArchivage,
                NombreReglementsLies:  row.NombreReglementsLies,
                Avancement:            avancement,
                AutObjAffiche:         `${fmtVal(realized)} / ${fmtVal(target)}${unit}`,
                Statut:                realized >= target ? 'Terminé' : 'En cours',
                utilisateur: row.utilisateur_UserID ? {
                    UserID:    row.utilisateur_UserID,
                    FullName:  row.utilisateur_FullName,
                    EmailPro:  row.utilisateur_EmailPro,
                    GUID:      row.utilisateur_GUID
                } : null
            };
        }));

        const normalizedStatut = String(statut || 'actif').toLowerCase();
        const hiddenStatuses = new Set(['ARCHIVÉ', 'INACTIF']);
        const filteredObjectifs = objectifs.filter((obj) => {
            const currentStatus = String(obj.StatutObjectif || '').toUpperCase();
            if (normalizedStatut === 'archive') {
                return hiddenStatuses.has(currentStatus);
            }
            if (normalizedStatut === 'all') {
                return true;
            }
            return !hiddenStatuses.has(currentStatus);
        });

        res.status(200).json({
            status: 'success',
            count: filteredObjectifs.length,
            data: filteredObjectifs
        });
    } catch (error) {
        // Log ultra détaillé pour debug
        console.error('❌ Erreur récupération objectifs (full):', error);
        if (error && error.stack) {
            console.error('❌ Stacktrace:', error.stack);
        }
        if (error && error.original) {
            console.error('❌ Erreur SQL (original):', error.original);
        }
        next(error);
    }
};

/**
 * Récupérer un objectif par ID
 */
exports.getObjectifById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const objectif = await hydrateObjectif(id);

        if (!objectif) {
            return res.status(404).json({
                status: 'error',
                message: 'Objectif non trouvé'
            });
        }

        const shouldFilter = canFlag(req.permissions?.FiltreRepres);
        if (shouldFilter && !isObjectifRelatedToCommercial(objectif, req.user)) {
            return res.status(403).json({
                status: 'error',
                message: 'Accès refusé à cet objectif'
            });
        }

        const realized = await calculateRealisedForObjectif(objectif);
        objectif.setDataValue('autVal', realized);
        objectif.setDataValue('Montant_Realise_Actuel', realized);
        try {
            objectif.setDataValue('AutObjAffiche', objectif.get('AutObjAffiche'));
        } catch (e) {
            // ignore if virtual not available
        }

        res.status(200).json({
            status: 'success',
            data: objectif
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Mettre à jour un objectif
 */
exports.updateObjectif = async (req, res, next) => {
    try {
        const { id } = req.params;
        const shouldFilterByCommercial = canFlag(req.permissions?.FiltreRepres);
        
        const {
            ID_Utilisateur,
            Mois,
            Annee,
            Semaine,
            Numsem,
            DateDebut,
            DateFin,
            MontantCible,
            Montant_Realise_Actuel,
            TypeObjectif,
            TypePeriode,
            Libelle_Indicateur,
            Statut,
            nf,
            // ID_Objectif_Parent
        } = req.body;

        void Statut;

        const objectif = await Objectif.findByPk(id);

        if (!objectif) {
            return res.status(404).json({
                status: 'error',
                message: 'Objectif non trouvé'
            });
        }

        if (shouldFilterByCommercial && !isObjectifRelatedToCommercial(objectif, req.user)) {
            return res.status(403).json({
                status: 'error',
                message: 'Accès refusé à cet objectif'
            });
        }

        let resolvedUser = null;
        if (ID_Utilisateur !== undefined && !shouldFilterByCommercial) {
            resolvedUser = await resolveUserForObjectif(ID_Utilisateur);
            if (resolvedUser?.error) {
                return res.status(400).json({
                    status: 'error',
                    message: resolvedUser.error
                });
            }
        }

        const nextTypePeriode = TypePeriode || objectif.TypePeriode || 'Mensuel';
        const weeklyPeriod = nextTypePeriode === 'Hebdomadaire'
            ? buildWeeklyPeriod({
                Semaine: Semaine !== undefined ? Semaine : objectif.Semaine,
                Numsem: Numsem !== undefined ? Numsem : objectif.Numsem,
                Annee: Annee !== undefined ? Annee : objectif.Annee,
                DateDebut: DateDebut !== undefined ? DateDebut : objectif.DateDebut,
                DateFin: DateFin !== undefined ? DateFin : objectif.DateFin
            })
            : null;

        await objectif.update({
            IdCont: resolvedUser?.user?.GUID || objectif.IdCont,
            ID_Utilisateur: resolvedUser?.normalizedUserId ?? objectif.ID_Utilisateur,
            Mois: nextTypePeriode === 'Mensuel'
                ? (Mois !== undefined ? normalizeInteger(Mois) : objectif.Mois)
                : null,
            Annee: nextTypePeriode === 'Hebdomadaire'
                ? weeklyPeriod?.Annee
                : (Annee !== undefined ? normalizeInteger(Annee) : objectif.Annee),
            Numsem: nextTypePeriode === 'Hebdomadaire' ? weeklyPeriod?.Numsem : null,
            Semaine: nextTypePeriode === 'Hebdomadaire'
                ? weeklyPeriod?.Semaine
                : null,
            DateDebut: nextTypePeriode === 'Hebdomadaire' ? weeklyPeriod?.DateDebut : null,
            DateFin: nextTypePeriode === 'Hebdomadaire' ? weeklyPeriod?.DateFin : null,
            MontantCible: MontantCible !== undefined ? normalizeDecimal(MontantCible, 0) : objectif.MontantCible,
            Montant_Realise_Actuel: Montant_Realise_Actuel !== undefined ? normalizeDecimal(Montant_Realise_Actuel, 0) : objectif.Montant_Realise_Actuel,
            TypeObjectif: TypeObjectif || objectif.TypeObjectif,
            TypePeriode: nextTypePeriode,
            Libelle_Indicateur: Libelle_Indicateur !== undefined ? Libelle_Indicateur : objectif.Libelle_Indicateur,
            nf: nf !== undefined ? normalizeInteger(nf) : objectif.nf,
            // ID_Objectif_Parent: ID_Objectif_Parent !== undefined ? safeInt(ID_Objectif_Parent) : objectif.ID_Objectif_Parent
        });

        const hydratedObjectif = await hydrateObjectif(id);
        if (hydratedObjectif) {
            try { hydratedObjectif.setDataValue('AutObjAffiche', hydratedObjectif.get('AutObjAffiche')); } catch (e) { }
        }

        res.status(200).json({
            status: 'success',
            message: 'Objectif mis à jour avec succès',
            data: hydratedObjectif || objectif
        });
    } catch (error) {
        console.error('❌ Erreur updateObjectif:', error);
        next(error);
    }
};

/**
 * Supprimer un objectif
 */
exports.deleteObjectif = async (req, res, next) => {
    try {
        const { id } = req.params;
        const objectif = await Objectif.findByPk(id);

        if (!objectif) {
            return res.status(404).json({
                status: 'error',
                message: 'Objectif non trouvé'
            });
        }

        const shouldFilter = canFlag(req.permissions?.FiltreRepres);
        if (shouldFilter && !isObjectifRelatedToCommercial(objectif, req.user)) {
            return res.status(403).json({
                status: 'error',
                message: 'Accès refusé à cet objectif'
            });
        }

        await objectif.destroy();

        res.status(200).json({
            status: 'success',
            message: 'Objectif supprimé avec succès'
        });
    } catch (error) {
        next(error);
    }
};
