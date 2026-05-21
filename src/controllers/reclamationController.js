const Reclamation = require('../models/Reclamation');
const TabDI = require('../models/TabDI');
const TabBT = require('../models/TabBT');
const { User, Tiers, sequelize } = require('../models');
const { Op, TableHints, QueryTypes } = require('sequelize');

const { resolveUserAccess } = require('../utils/userAccess');
const { notifyAdmins, createNotifications } = require('../utils/notificationUtils');

const MAX_LENGTHS = {
    CodTiers: 20,
    LibTiers: 255,
    Objet: 500,
    TypeReclamation: 100,
    Priorite: 50,
    Statut: 50,
    NomTechnicien: 255,
    CUser: 100,
    TicketAdresse: 255,
    TicketVille: 50,
    TicketPays: 50,
    TicketCp: 20,
    TicketAdresseMaps: 255,
};

const RECLAMATION_SCHEMA_CACHE_TTL_MS = 60 * 1000;
let reclamationSchemaCache = {
    loadedAt: 0,
    columns: null,
};

const findClientUserIdByCodTiers = async (codTiers) => {
    if (!codTiers) return null;
    try {
        const rows = await sequelize.query(
            `SELECT TOP 1 u.USER_ID FROM UCS_USERS u
             INNER JOIN TabTiers t ON LOWER(t.Email) = LOWER(u.USER_NAME)
             WHERE t.CodTiers = :codTiers`,
            { replacements: { codTiers }, type: QueryTypes.SELECT }
        );
        return rows[0]?.USER_ID ? Number(rows[0].USER_ID) : null;
    } catch { return null; }
};

const getReclamationColumns = async () => {
    const now = Date.now();
    if (
        reclamationSchemaCache.columns &&
        now - reclamationSchemaCache.loadedAt < RECLAMATION_SCHEMA_CACHE_TTL_MS
    ) {
        return reclamationSchemaCache.columns;
    }

    const rows = await sequelize.query(
        `
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'TabReclamation'
        `,
        { type: QueryTypes.SELECT }
    );

    const columns = new Set(rows.map((row) => row.COLUMN_NAME));
    reclamationSchemaCache = {
        loadedAt: now,
        columns,
    };

    return columns;
};

const getReclamationSelectableAttributes = async () => {
    const columns = await getReclamationColumns();
    const attributes = Object.entries(Reclamation.rawAttributes)
        .filter(([attrName, definition]) => columns.has(definition.field || attrName))
        .map(([attrName]) => attrName);

    return attributes.length ? attributes : undefined;
};

const getReclamationDefaultOrder = async () => {
    const columns = await getReclamationColumns();
    return columns.has('DateOuverture') ? [['DateOuverture', 'DESC']] : [['ID', 'DESC']];
};

const findReclamationByPkSafe = async (id, options = {}) => {
    const attributes = options.attributes || await getReclamationSelectableAttributes();
    return Reclamation.findByPk(id, { ...options, attributes });
};

const findReclamationOneSafe = async (options = {}) => {
    const attributes = options.attributes || await getReclamationSelectableAttributes();
    return Reclamation.findOne({ ...options, attributes });
};

const findReclamationAndCountAllSafe = async (options = {}) => {
    const attributes = options.attributes || await getReclamationSelectableAttributes();
    return Reclamation.findAndCountAll({ ...options, attributes });
};

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : value);

const truncateString = (value, maxLength) => {
    if (value === null || value === undefined) return value;
    const normalized = normalizeString(value);
    if (typeof normalized !== 'string') return normalized;
    return normalized.slice(0, maxLength);
};

const buildReclamationPayload = (body = {}) => ({
    CodTiers: truncateString(body.CodTiers || body.codTiers, MAX_LENGTHS.CodTiers),
    LibTiers: truncateString(body.LibTiers || body.libTiers, MAX_LENGTHS.LibTiers),
    Objet: truncateString(body.Objet || body.objet, MAX_LENGTHS.Objet),
    Description: normalizeString(body.Description || body.description),
    TypeReclamation: truncateString(body.TypeReclamation || body.categorie || body.typeReclamation, MAX_LENGTHS.TypeReclamation),
    Priorite: truncateString(body.Priorite || body.priorite, MAX_LENGTHS.Priorite),
    Statut: truncateString(body.Statut || body.statut, MAX_LENGTHS.Statut),
    NomTechnicien: truncateString(body.NomTechnicien || body.nomTechnicien, MAX_LENGTHS.NomTechnicien),
    TechnicienID: body.TechnicienID ? Number(body.TechnicienID) : (body.technicienID ? Number(body.technicienID) : null),
    Solution: normalizeString(body.Solution || body.solution),
    TicketAdresse: truncateString(body.TicketAdresse || body.ticketAdresse, MAX_LENGTHS.TicketAdresse),
    TicketVille: truncateString(body.TicketVille || body.ticketVille, MAX_LENGTHS.TicketVille),
    TicketPays: truncateString(body.TicketPays || body.ticketPays, MAX_LENGTHS.TicketPays),
    TicketCp: truncateString(body.TicketCp || body.ticketCp, MAX_LENGTHS.TicketCp),
    TicketAdresseMaps: truncateString(body.TicketAdresseMaps || body.ticketAdresseMaps, MAX_LENGTHS.TicketAdresseMaps),
    TicketLat: body.TicketLat !== undefined && body.TicketLat !== null && body.TicketLat !== '' ? Number(body.TicketLat) : null,
    TicketLong: body.TicketLong !== undefined && body.TicketLong !== null && body.TicketLong !== '' ? Number(body.TicketLong) : null,
});

const fetchInterventionsForReclamation = async (reclamation) => {
    if (!reclamation) return [];

    const searchCriteria = {
        DescPanne: reclamation.Objet,
        Demandeur: reclamation.LibTiers,
    };

    const interventions = await TabDI.findAll({
        where: searchCriteria,
        order: [['DatCreate', 'DESC']],
    });

    if (!interventions.length) return [];

    const interventionKeys = interventions
        .map((item) => ({
            iddi: item.IDDI,
            numdi: item.NumDI,
            datdi: item.DatCreate || item.DatDI,
            descpanne: item.DescPanne,
            demandeur: item.Demandeur,
        }))
        .filter(Boolean);

    const btList = await TabBT.findAll({
        where: {
            [Op.or]: interventionKeys.flatMap((item) => [
                item.iddi ? { IDDI: item.iddi } : null,
                item.numdi ? { NumDI: item.numdi } : null,
            ].filter(Boolean)),
        },
        order: [['DatCreate', 'DESC']],
    });

    const btByNumDi = new Map(btList.map((bt) => [String(bt.NumDI || ''), bt]));
    const btByIdDi = new Map(btList.map((bt) => [String(bt.IDDI || ''), bt]));

    return interventions.map((di) => {
        const bt = btByIdDi.get(String(di.IDDI || '')) || btByNumDi.get(String(di.NumDI || '')) || null;

        return {
            iddi: di.IDDI,
            numdi: di.NumDI,
            datdi: di.DatCreate || di.DatDI,
            demandeur: di.Demandeur,
            descPanne: di.DescPanne,
            service: di.Service,
            réponse: di.Reponse,
            commentaire: di.Comment,
            intervention: bt
                ? {
                    idbt: bt.IDBT,
                    numbt: bt.NumBT,
                    datbt: bt.DatCreate || bt.DatBT,
                    technicien: bt.CodInterv || null,
                    resultat: bt.Resultat || null,
                    encours: bt.BTEncours,
                    clotured: bt.BTClotured,
                    descPanne: bt.DescPanne,
                }
                : null,
        };
    });
};

const getNextInterventionNumbers = async () => {
    const [maxDi] = await sequelize.query('SELECT MAX(NumDI) as maxNum FROM TabDI');
    const [maxBt] = await sequelize.query('SELECT MAX(NumBT) as maxNum FROM TabBT');

    return {
        nextNumDI: (maxDi?.[0]?.maxNum || 0) + 1,
        nextNumBT: (maxBt?.[0]?.maxNum || 0) + 1,
    };
};

// Auto-generate ticket number: REC-YYYY-XXXX
const generateNumTicket = async () => {
    const year = new Date().getFullYear();
    const last = await findReclamationOneSafe({
        attributes: ['ID'],
        order: [['ID', 'DESC']],
    });
    const seq = ((last?.ID || 0) + 1).toString().padStart(4, '0');
    return `REC-${year}-${seq}`;
};

// ─── GET ALL ───────────────────────────────────────────────────────────────────
exports.getAll = async (req, res, next) => {
    try {
        const filterHelper = require('../utils/filterHelper');
        const queryForPermissions = { ...req.query };
        if (req.user && req.user.UserRole === 'admin') {
            queryForPermissions.includeAll = 'true';
            queryForPermissions.selectedCommercial = 'all';
        }
        // These fields are handled manually below; remove them so filterHelper
        // does not add Op.like conditions that would AND with the manual filters
        // and break the OR-based search logic.
        delete queryForPermissions.Date;
        delete queryForPermissions.DateFrom;
        delete queryForPermissions.DateTo;
        delete queryForPermissions.CommercialID;
        delete queryForPermissions.Objet;
        delete queryForPermissions.LibTiers;
        delete queryForPermissions.NumTicket;
        delete queryForPermissions.Statut;
        delete queryForPermissions.Priorite;
        delete queryForPermissions.TechnicienID;
        
        // Module 31 = Reclamations/SAV (aligned with TabAWProfileAccess CodMod)
        const { where, limit, offset, page } = await filterHelper.applyTableDrivenFiltersWithPagination(
            '31',
            queryForPermissions,
            req.user
        );

        // Add manual filters for reclamations
        const { Objet, LibTiers, NumTicket, Statut, Priorite, TechnicienID, Date: filterDate, DateFrom, DateTo, CommercialID } = req.query;

        if (Objet || LibTiers || NumTicket) {
            const searchConditions = [];
            if (Objet) searchConditions.push({ Objet: { [Op.like]: `%${Objet}%` } });
            if (LibTiers) searchConditions.push({ LibTiers: { [Op.like]: `%${LibTiers}%` } });
            if (NumTicket) searchConditions.push({ NumTicket: { [Op.like]: `%${NumTicket}%` } });
            if (searchConditions.length > 0) {
                where[Op.or] = searchConditions;
            }
        }

        if (Statut && Statut !== 'all') {
            where.Statut = Statut;
        }

        if (Priorite && Priorite !== 'all') {
            where.Priorite = Priorite;
        }

        if (TechnicienID && TechnicienID !== 'all') {
            where.TechnicienID = TechnicienID;
        }

        if (CommercialID && CommercialID !== 'all') {
            const clientRows = await sequelize.query(`
                SELECT CodTiers
                FROM TabTiers
                WHERE CONVERT(VARCHAR, codRepresTiers) = :commercialId
            `, {
                replacements: { commercialId: String(CommercialID) },
                type: QueryTypes.SELECT
            });
            const clientCodes = clientRows.map(r => r.CodTiers).filter(Boolean);
            if (clientCodes.length > 0) {
                where[Op.and] = [...(where[Op.and] || []), { CodTiers: { [Op.in]: clientCodes } }];
            } else {
                where[Op.and] = [...(where[Op.and] || []), sequelize.literal('1 = 0')];
            }
        }

        const reclamationColumns = await getReclamationColumns();
        if (reclamationColumns.has('DateOuverture') && (filterDate || DateFrom || DateTo)) {
            const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
            const andConditions = [];

            if (filterDate && isIsoDate(filterDate)) {
                andConditions.push(
                    sequelize.literal(`CONVERT(date, [DateOuverture]) = '${filterDate}'`)
                );
            } else {
                if (DateFrom && isIsoDate(DateFrom)) {
                    andConditions.push(
                        sequelize.literal(`CONVERT(date, [DateOuverture]) >= '${DateFrom}'`)
                    );
                }
                if (DateTo && isIsoDate(DateTo)) {
                    andConditions.push(
                        sequelize.literal(`CONVERT(date, [DateOuverture]) <= '${DateTo}'`)
                    );
                }
            }

            if (andConditions.length > 0) {
                where[Op.and] = [...(where[Op.and] || []), ...andConditions];
            }
        }

        const { count, rows } = await findReclamationAndCountAllSafe({
            where,
            order: await getReclamationDefaultOrder(),
            limit,
            offset,
            tableHint: TableHints.NOLOCK
        });


        res.json(
            filterHelper.formatPaginatedResponse(rows, count, page, limit)
        );
    } catch (err) {
        console.error('❌ getAll reclamations:', err);
        next(err);
    }
};

// ─── GET BY ID ─────────────────────────────────────────────────────────────────
exports.getById = async (req, res, next) => {
    try {
        const rawId = req.params.id;
        let rec = await findReclamationByPkSafe(rawId);

        // Fallback: try matching by exact NumTicket or by padded suffix (REC-YYYY-XXXX format)
        if (!rec) {
            const paddedSuffix = rawId.toString().padStart(4, '0');
            rec = await findReclamationOneSafe({
                where: {
                    [Op.or]: [
                        { NumTicket: rawId },
                        { NumTicket: { [Op.like]: `%-${paddedSuffix}` } },
                    ],
                },
            });
        }

        if (!rec) return res.status(404).json({ status: 'error', message: 'Réclamation non trouvée' });

        const userId = req.user?.id || req.user?.UserID;
        const access = await resolveUserAccess(userId, req.user?.UserRole);
        const isClient = access?.normalizedRole === 'client';

        if (isClient) {
            const userEmail = String(req.user?.EmailPro || '').toLowerCase();
            const userLogin = String(req.user?.LoginName || '').toLowerCase();
            const claimOwner = String(rec.CUser || '').toLowerCase();
            const isOwner = claimOwner && (claimOwner === userEmail || claimOwner === userLogin);

            if (!isOwner) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Accès refusé à cette réclamation'
                });
            }
        }

        const interventions = await fetchInterventionsForReclamation(rec);

        let location = null;
        if (rec.CodTiers) {
            const tier = await Tiers.findOne({
                where: { CodTiers: rec.CodTiers },
                attributes: ['CodTiers', 'Raisoc', 'Adresse', 'Ville', 'Pays', 'Cp', 'AdresseMaps', 'lat', 'long'],
            });

            const ticketLocation = {
                codTiers: rec.CodTiers || null,
                clientName: rec.LibTiers || null,
                address: rec.TicketAdresse || null,
                city: rec.TicketVille || null,
                country: rec.TicketPays || null,
                postalCode: rec.TicketCp || null,
                addressMaps: rec.TicketAdresseMaps || null,
                lat: rec.TicketLat !== null && rec.TicketLat !== undefined ? Number(rec.TicketLat) : null,
                long: rec.TicketLong !== null && rec.TicketLong !== undefined ? Number(rec.TicketLong) : null,
            };

            const hasTicketLocation = Boolean(
                ticketLocation.address ||
                ticketLocation.city ||
                ticketLocation.country ||
                ticketLocation.postalCode ||
                ticketLocation.addressMaps ||
                ticketLocation.lat !== null ||
                ticketLocation.long !== null
            );

            if (hasTicketLocation) {
                location = { ...ticketLocation, source: 'ticket' };
            } else if (tier) {
                location = {
                    codTiers: tier.CodTiers || null,
                    clientName: tier.Raisoc || rec.LibTiers || null,
                    address: tier.Adresse || null,
                    city: tier.Ville || null,
                    country: tier.Pays || null,
                    postalCode: tier.Cp || null,
                    addressMaps: tier.AdresseMaps || null,
                    lat: tier.lat !== null && tier.lat !== undefined ? Number(tier.lat) : null,
                    long: tier.long !== null && tier.long !== undefined ? Number(tier.long) : null,
                    source: 'tiers',
                };
            }
        }

        res.json({
            status: 'success',
            data: {
                ...rec.toJSON(),
                interventions,
                location,
            },
        });
    } catch (err) {
        next(err);
    }
};

// ─── CREATE ────────────────────────────────────────────────────────────────────
exports.create = async (req, res, next) => {
    try {
        const payload = buildReclamationPayload(req.body);

        if (!payload.LibTiers) {
            payload.LibTiers = truncateString(
                req.user?.FullName || req.user?.LoginName || req.user?.EmailPro || 'Client',
                MAX_LENGTHS.LibTiers
            );
        }

        if (!payload.LibTiers || !payload.Objet) {
            return res.status(400).json({
                status: 'error',
                message: 'LibTiers et Objet sont obligatoires'
            });
        }

        if (payload.CodTiers) {
            const tierExists = await Tiers.findOne({ where: { CodTiers: payload.CodTiers } });
            if (!tierExists) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Client introuvable pour ce CodTiers'
                });
            }
        }

        payload.NumTicket = await generateNumTicket();
        payload.Statut = payload.Statut || 'Ouvert';
        payload.CUser = truncateString(req.user?.LoginName || req.user?.EmailPro || 'admin', MAX_LENGTHS.CUser);

        const existingColumns = await getReclamationColumns();
        const optionalLocationColumns = [
            'TicketAdresse',
            'TicketVille',
            'TicketPays',
            'TicketCp',
            'TicketAdresseMaps',
            'TicketLat',
            'TicketLong',
        ];
        const missingLocationColumns = optionalLocationColumns.filter((column) => !existingColumns.has(column));
        if (missingLocationColumns.length) {
            console.warn(
                `⚠️ TabReclamation missing columns (${missingLocationColumns.join(', ')}). Proceeding without them.`
            );
        }

        const insertColumns = [];
        const insertValues = [];
        const columnToSqlValue = {
            CodTiers: ':CodTiers',
            LibTiers: ':LibTiers',
            Objet: ':Objet',
            Description: ':Description',
            TypeReclamation: ':TypeReclamation',
            Priorite: ':Priorite',
            Statut: ':Statut',
            NomTechnicien: ':NomTechnicien',
            TechnicienID: ':TechnicienID',
            DateOuverture: 'GETDATE()',
            DateResolution: ':DateResolution',
            CUser: ':CUser',
            Solution: ':Solution',
            NumTicket: ':NumTicket',
            TicketAdresse: ':TicketAdresse',
            TicketVille: ':TicketVille',
            TicketPays: ':TicketPays',
            TicketCp: ':TicketCp',
            TicketAdresseMaps: ':TicketAdresseMaps',
            TicketLat: ':TicketLat',
            TicketLong: ':TicketLong',
        };

        Object.entries(columnToSqlValue).forEach(([column, sqlValue]) => {
            if (existingColumns.has(column)) {
                insertColumns.push(column);
                insertValues.push(sqlValue);
            }
        });

        const insertReplacements = {
            CodTiers: payload.CodTiers ?? null,
            LibTiers: payload.LibTiers ?? null,
            Objet: payload.Objet ?? null,
            Description: payload.Description ?? null,
            TypeReclamation: payload.TypeReclamation ?? null,
            Priorite: payload.Priorite ?? null,
            Statut: payload.Statut ?? null,
            NomTechnicien: payload.NomTechnicien ?? null,
            TechnicienID: payload.TechnicienID ?? null,
            CUser: payload.CUser ?? null,
            Solution: payload.Solution ?? null,
            NumTicket: payload.NumTicket ?? null,
            DateResolution: null,
            TicketAdresse: payload.TicketAdresse ?? null,
            TicketVille: payload.TicketVille ?? null,
            TicketPays: payload.TicketPays ?? null,
            TicketCp: payload.TicketCp ?? null,
            TicketAdresseMaps: payload.TicketAdresseMaps ?? null,
            TicketLat: Number.isFinite(payload.TicketLat) ? payload.TicketLat : null,
            TicketLong: Number.isFinite(payload.TicketLong) ? payload.TicketLong : null,
        };

        // Use OUTPUT INSERTED.ID to get the auto-generated PK immediately
        const [insertedRows] = await sequelize.query(
            `
                INSERT INTO TabReclamation (
                    ${insertColumns.join(',\n                    ')}
                )
                OUTPUT INSERTED.ID
                VALUES (
                    ${insertValues.join(',\n                    ')}
                )
            `,
            { replacements: insertReplacements, type: QueryTypes.SELECT }
        );

        const newId = insertedRows?.ID;
        const rec = newId
            ? await findReclamationByPkSafe(newId)
            : await findReclamationOneSafe({ where: { NumTicket: payload.NumTicket } });

        // Notify admins of new claim with link to claim detail (fire-and-forget)
        if (rec?.ID) {
            const { getActiveAdminIds } = require('../utils/notificationUtils');
            getActiveAdminIds().then((adminIds) => {
                if (adminIds.length) {
                    createNotifications(
                        adminIds,
                        `Nouvelle réclamation — ${payload.NumTicket}`,
                        JSON.stringify({
                            _type: 'CLAIM_CREATED',
                            claimId: rec.ID,
                            numTicket: payload.NumTicket,
                            libTiers: payload.LibTiers || payload.CodTiers || 'Inconnu',
                            objet: payload.Objet || ''
                        }),
                        'CLAIM_CREATED'
                    );
                }
            }).catch(() => {});
        }

        res.status(201).json({ status: 'success', message: 'Réclamation créée', data: rec });
    } catch (err) {
        console.error('❌ create reclamation:', err);

        if (err?.name === 'SequelizeDatabaseError' || err?.name === 'SequelizeValidationError') {
            return res.status(400).json({
                status: 'error',
                message: err.original?.message || err.message || 'Impossible de créer la réclamation',
            });
        }

        next(err);
    }
};

// ─── UPDATE ────────────────────────────────────────────────────────────────────
exports.update = async (req, res, next) => {
    try {
        const rec = await findReclamationByPkSafe(req.params.id);
        if (!rec) return res.status(404).json({ status: 'error', message: 'Réclamation non trouvée' });

        const payload = { ...req.body };
        // If status changes to Résolu/Fermé, set DateResolution
        if (['Résolu', 'Fermé'].includes(payload.Statut) && !rec.DateResolution) {
            payload.DateResolution = new Date();
        }

        await rec.update(payload);
        res.json({ status: 'success', message: 'Réclamation mise à jour', data: rec });
    } catch (err) {
        console.error('❌ update reclamation:', err);
        next(err);
    }
};

// ─── UPDATE STATUS ─────────────────────────────────────────────────────────────
exports.updateStatus = async (req, res, next) => {
    try {
        const { statut } = req.body;
        if (!statut) return res.status(400).json({ status: 'error', message: 'Statut requis' });

        const rec = await findReclamationByPkSafe(req.params.id);
        if (!rec) return res.status(404).json({ status: 'error', message: 'Réclamation non trouvée' });

        const shouldSetResolutionDate = ['résolu', 'resolu', 'fermé', 'ferme'].includes(
            String(statut).trim().toLowerCase()
        );

        await sequelize.query(
            `
                UPDATE TabReclamation
                SET
                    Statut = :statut,
                    DateResolution = CASE
                        WHEN :shouldSetResolutionDate = 1 AND DateResolution IS NULL THEN GETDATE()
                        ELSE DateResolution
                    END
                WHERE ID = :id
            `,
            {
                replacements: {
                    id: req.params.id,
                    statut,
                    shouldSetResolutionDate: shouldSetResolutionDate ? 1 : 0,
                },
            }
        );

        const updated = await findReclamationByPkSafe(req.params.id);

        // Notify client when claim is resolved or closed
        if (shouldSetResolutionDate && updated?.CodTiers) {
            findClientUserIdByCodTiers(updated.CodTiers).then((clientUserId) => {
                if (clientUserId) {
                    createNotifications(
                        [clientUserId],
                        `Réclamation ${statut} — ${updated.NumTicket || ''}`,
                        `Votre réclamation "${updated.Objet || ''}" a été ${statut.toLowerCase()}.`,
                        'SUCCESS'
                    ).catch(() => {});
                }
            }).catch(() => {});
        }

        res.json({ status: 'success', message: `Statut mis à jour : ${statut}`, data: updated });
    } catch (err) {
        console.error('❌ updateStatus reclamation:', err);
        if (err?.name === 'SequelizeDatabaseError' || err?.name === 'SequelizeValidationError') {
            return res.status(400).json({
                status: 'error',
                message: err.original?.message || err.message || 'Impossible de mettre à jour le statut',
            });
        }
        next(err);
    }
};

// ─── DELETE ────────────────────────────────────────────────────────────────────
exports.remove = async (req, res, next) => {
    try {
        const rec = await findReclamationByPkSafe(req.params.id);
        if (!rec) return res.status(404).json({ status: 'error', message: 'Réclamation non trouvée' });
        await rec.destroy();
        res.json({ status: 'success', message: 'Réclamation supprimée' });
    } catch (err) {
        next(err);
    }
};

// ─── ASSIGN TECHNICIAN ─────────────────────────────────────────────────────────
exports.assignTechnician = async (req, res, next) => {
    console.log('👉 [AssignTechnician] =======================================');
    console.log('👉 [AssignTechnician] Route hit');
    console.log('👉 [AssignTechnician] Request body:', req.body);
    console.log('👉 [AssignTechnician] Reclamation ID:', req.params.id);
    
    try {
        const { technicienID } = req.body;
        const parsedTechnicienID = Number(technicienID);
        
        console.log(`👉 [AssignTechnician] Parsed TechnicienID: ${parsedTechnicienID} (type: ${typeof parsedTechnicienID})`);
        
        if (!technicienID || Number.isNaN(parsedTechnicienID)) {
            const errMsg = 'TechnicienID requis et doit être un nombre';
            console.error('❌ [AssignTechnician]', errMsg);
            return res.status(400).json({ status: 'error', message: errMsg });
        }

        // Vérifier que le technicien existe
        console.log(`🔍 [AssignTechnician] Searching for technician with UserID = ${parsedTechnicienID}...`);
        const technician = await User.findByPk(parsedTechnicienID);
        if (!technician) {
            const errMsg = `Technicien avec ID ${parsedTechnicienID} non trouvé dans la base`;
            console.error('❌ [AssignTechnician]', errMsg);
            return res.status(404).json({ status: 'error', message: errMsg });
        }

        console.log('✅ [AssignTechnician] Technician found:', {
            UserID: technician.UserID,
            FullName: technician.FullName,
            EmailPro: technician.EmailPro,
            UserIDType: typeof technician.UserID
        });

        // FK on TabReclamation.TechnicienID points to dbo.Sec_Users(UserID).
        // Resolve a valid Sec_Users.UserID for this technician (create if needed).
        const loginName = String(technician.EmailPro || technician.LoginName || `user${parsedTechnicienID}`)
            .trim()
            .slice(0, 100);
        const fullName = String(technician.FullName || technician.LoginName || `Technicien ${parsedTechnicienID}`)
            .trim()
            .slice(0, 255);

        let secTechnicienId = parsedTechnicienID;
        const secUserById = await sequelize.query(
            `SELECT TOP 1 UserID FROM dbo.Sec_Users WHERE UserID = :userId`,
            {
                replacements: { userId: parsedTechnicienID },
                type: QueryTypes.SELECT,
            }
        );

        if (!secUserById.length) {
            const secUserByLogin = await sequelize.query(
                `SELECT TOP 1 UserID FROM dbo.Sec_Users WHERE LOWER(LoginName) = LOWER(:loginName)`,
                {
                    replacements: { loginName },
                    type: QueryTypes.SELECT,
                }
            );

            if (secUserByLogin.length) {
                secTechnicienId = Number(secUserByLogin[0].UserID);
                console.log('✅ [AssignTechnician] Reusing existing Sec_Users by login:', {
                    loginName,
                    secTechnicienId,
                });
            } else {
                const inserted = await sequelize.query(
                    `
                        INSERT INTO dbo.Sec_Users (
                            LoginName,
                            FullName,
                            Password,
                            LastAccess,
                            Enabled,
                            CreatedDate,
                            LastAccTime,
                            CreatedTime,
                            AccessCount
                        )
                        VALUES (
                            :loginName,
                            :fullName,
                            '',
                            NULL,
                            1,
                            GETDATE(),
                            GETDATE(),
                            GETDATE(),
                            0
                        );
                        SELECT CAST(SCOPE_IDENTITY() AS INT) AS UserID;
                    `,
                    {
                        replacements: {
                            loginName,
                            fullName,
                        },
                        type: QueryTypes.SELECT,
                    }
                );

                secTechnicienId = Number(inserted?.[0]?.UserID);
                if (!Number.isFinite(secTechnicienId)) {
                    throw new Error('Creation Sec_Users reussie mais UserID genere introuvable');
                }

                console.log('✅ [AssignTechnician] Sec_Users row created for technician:', {
                    loginName,
                    fullName,
                    secTechnicienId,
                });
            }
        }

        // Vérifier que la réclamation existe
        console.log(`🔍 [AssignTechnician] Searching for reclamation with ID = ${req.params.id}...`);
        const rec = await findReclamationByPkSafe(req.params.id);
        if (!rec) {
            const errMsg = `Réclamation avec ID ${req.params.id} non trouvée`;
            console.error('❌ [AssignTechnician]', errMsg);
            return res.status(404).json({ status: 'error', message: errMsg });
        }

        console.log('✅ [AssignTechnician] Reclamation found:', {
            ID: rec.ID,
            NumTicket: rec.NumTicket,
            CurrentTechnicienID: rec.TechnicienID,
            CurrentNomTechnicien: rec.NomTechnicien
        });

        const technicianDisplayName = technician.FullName || technician.EmailPro || technician.LoginName;
        const technicienIDToSave = Number(parsedTechnicienID);

        const updatePayload = {
            NomTechnicien: technicianDisplayName,
            Statut: 'En cours',
            TechnicienID: secTechnicienId,
        };

        console.log('👤 [AssignTechnician] Final update payload:', updatePayload);

        await rec.update(updatePayload);
        console.log('✅ [AssignTechnician] Update succeeded');

        // --- AUTOMATION: Create DI and BT ---
        try {
            console.log('🔄 [Automation] Starting DI/BT creation... (Native SQL Mode)');
            
            // 1. Calculate New NumDI & NumBT
            const [maxDi] = await sequelize.query("SELECT MAX(NumDI) as maxNum FROM TabDI");
            const newNumDI = (maxDi[0].maxNum || 0) + 1;

            const [maxBt] = await sequelize.query("SELECT MAX(NumBT) as maxNum FROM TabBT");
            const newNumBT = (maxBt[0].maxNum || 0) + 1;

            // Prepare safe strings
            const description = (rec.Objet || '').replace(/'/g, "''").substring(0, 250);
            const demandeur = (rec.LibTiers || '').replace(/'/g, "''").substring(0, 250);
            const codInterv = truncateString(technician.LoginName || technician.EmailPro || '', 10).replace(/'/g, "''");
            
            // 2. Insert DI using Native SQL with NEWID()
            // Using OUTPUT INSERTED.IDDI to get the generated ID
            // NOTE: SQL Server OUTPUT clause works best when capturing into a table variable or directly if supported by driver
            // For safety with Sequelize raw query type, we will use a different approach: DECLARE + SELECT
            
            const sqlTransaction = `
                DECLARE @NewIDDI UNIQUEIDENTIFIER = NEWID();
                DECLARE @NewIDBT UNIQUEIDENTIFIER = NEWID();
                
                INSERT INTO TabDI (IDDI, NumDI, DatDI, DescPanne, Demandeur, DatCreate, CodServ)
                VALUES (@NewIDDI, ${newNumDI}, GETDATE(), '${description}', '${demandeur}', GETDATE(), 'SAV');
                
                INSERT INTO TabBT (IDBT, NumBT, DatBT, NumDI, IDDI, CodInterv, DescPanne, DatCreate, Demandeur, BTEncours, BTClotured, CodServ)
                VALUES (@NewIDBT, ${newNumBT}, GETDATE(), ${newNumDI}, @NewIDDI, '${codInterv}', '${description}', GETDATE(), '${demandeur}', 1, 0, 'SAV');
            `;
            
            console.log('Debug: Executing Transaction SQL...');
            await sequelize.query(sqlTransaction);
            console.log(`✅ [Automation] DI #${newNumDI} and BT #${newNumBT} created via SINGLE SQL TRANSACTION`);

        } catch (autoErr) {
            console.error('⚠️ CRITICAL AUTOMATION ERROR:', autoErr);
        }
        // ------------------------------------
        
        console.log('🔄 [AssignTechnician] Reloading reclamation from database to confirm update...');
        const updated = await findReclamationByPkSafe(req.params.id, {
            include: [{ association: 'technicien', attributes: ['UserID', 'FullName', 'LoginName', 'EmailPro'] }]
        });

        console.log('✅ [AssignTechnician] Reclamation reloaded, confirming saved data:', {
            ID: updated.ID,
            TechnicienID: updated.TechnicienID,
            NomTechnicien: updated.NomTechnicien,
            Statut: updated.Statut,
            SavedSuccessfully: String(updated.TechnicienID) === String(secTechnicienId)
        });

        // Notify technician of assignment (use UCS_USERS ID, not Sec_Users ID)
        createNotifications(
            [parsedTechnicienID],
            `Nouvelle réclamation assignée — ${rec.NumTicket || ''}`,
            `La réclamation "${rec.Objet || ''}" (client : ${rec.LibTiers || rec.CodTiers || ''}) vous a été assignée.`,
            'INFO'
        ).catch(() => {});

        console.log('✅ [AssignTechnician] Assignment SUCCESS! Sending response...');
        console.log('═══════════════════════════════════════════════════════════');

        res.json({
            status: 'success',
            message: `Réclamation affectée à ${technician.FullName || technician.LoginName}`, 
            data: updated 
        });
    } catch (err) {
        console.error('═══════════════════════════════════════════════════════════');
        console.error('❌ [AssignTechnician] FAILED with error:', err?.message);
        console.error('❌ [AssignTechnician] Stack:', err?.stack?.split('\n').slice(0, 3).join('\n'));
        next(err);
    }
};

// ─── REMOVE TECHNICIAN ASSIGNMENT ──────────────────────────────────────────────
exports.removeTechnicianAssignment = async (req, res, next) => {
    try {
        const rec = await findReclamationByPkSafe(req.params.id);
        if (!rec) {
            return res.status(404).json({ status: 'error', message: 'Réclamation non trouvée' });
        }

        const update = {
            TechnicienID: null,
            NomTechnicien: null,
            Statut: 'Ouvert' // Revenir au statut "Ouvert"
        };

        await rec.update(update);
        res.json({ 
            status: 'success', 
            message: 'Affectation du technicien supprimée', 
            data: rec 
        });
    } catch (err) {
        console.error('❌ removeTechnicianAssignment reclamation:', err);
        next(err);
    }
};

// ─── ADD INTERVENTION ──────────────────────────────────────────────────────────
exports.addIntervention = async (req, res, next) => {
    try {
        const rec = await findReclamationByPkSafe(req.params.id);
        if (!rec) {
            return res.status(404).json({ status: 'error', message: 'Réclamation non trouvée' });
        }

        const currentRole = String(req.user?.UserRole || '').toLowerCase();
        const bodyTechnicienID = req.body?.technicienID ? Number(req.body.technicienID) : null;
        const technicienID = bodyTechnicienID || (currentRole === 'technicien' ? Number(req.user?.UserID) : null) || rec.TechnicienID;

        if (!technicienID) {
            return res.status(400).json({ status: 'error', message: 'Technicien requis pour ajouter une intervention' });
        }

        if (!['technicien', 'admin'].includes(currentRole)) {
            return res.status(403).json({ status: 'error', message: 'Accès interdit pour cette opération' });
        }

        const technician = await User.findByPk(technicienID);
        if (!technician) {
            return res.status(404).json({ status: 'error', message: 'Technicien non trouvé' });
        }

        const note = normalizeString(req.body?.resultat || req.body?.commentaire || req.body?.description || '');
        const description = truncateString(req.body?.description || rec.Objet, 250);
        const demandeur = truncateString(rec.LibTiers || '', 250);
        const codIntervRaw = truncateString(technician.LoginName || technician.EmailPro || '', 10);
        const { nextNumDI, nextNumBT } = await getNextInterventionNumbers();

        const safeDescription = (description || '').replace(/'/g, "''");
        const safeDemandeur = (demandeur || '').replace(/'/g, "''");
        const safeNote = (note || '').replace(/'/g, "''");
        const safeCodInterv = (codIntervRaw || '').replace(/'/g, "''");

        const sql = `
            DECLARE @NewIDDI UNIQUEIDENTIFIER = NEWID();
            DECLARE @NewIDBT UNIQUEIDENTIFIER = NEWID();

            INSERT INTO TabDI (IDDI, NumDI, DatDI, DescPanne, Demandeur, DatCreate, CodServ, Comment)
            VALUES (@NewIDDI, ${nextNumDI}, GETDATE(), '${safeDescription}', '${safeDemandeur}', GETDATE(), 'SAV', '${safeNote}');

            INSERT INTO TabBT (IDBT, NumBT, DatBT, NumDI, IDDI, CodInterv, DescPanne, DatCreate, Demandeur, Resultat, BTEncours, BTClotured, CodServ)
            VALUES (@NewIDBT, ${nextNumBT}, GETDATE(), ${nextNumDI}, @NewIDDI, '${safeCodInterv}', '${safeDescription}', GETDATE(), '${safeDemandeur}', '${safeNote}', 1, 0, 'SAV');
        `;

        await sequelize.query(sql);

        if (String(rec.Statut || '').toLowerCase() === 'ouvert') {
            await rec.update({ Statut: 'En cours' });
        }

        const updated = await findReclamationByPkSafe(req.params.id, {
            include: [{ association: 'technicien', attributes: ['UserID', 'FullName', 'LoginName', 'EmailPro'] }]
        });
        const interventions = await fetchInterventionsForReclamation(updated);

        res.status(201).json({
            status: 'success',
            message: 'Intervention ajoutée avec succès',
            data: {
                ...updated.toJSON(),
                interventions,
            },
        });
    } catch (err) {
        console.error('❌ addIntervention reclamation:', err);
        next(err);
    }
};

// ─── GET TECHNICIAN RECLAMATIONS ───────────────────────────────────────────────
exports.getTechnicianReclamations = async (req, res, next) => {
    try {
        const { technicienID } = req.params;
        const { statut = '', priorite = '', page = 1, limit = 100 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Vérifier que le technicien existe
        const technician = await User.findByPk(technicienID);
        if (!technician) {
            return res.status(404).json({ status: 'error', message: 'Technicien non trouvé' });
        }

        const where = { TechnicienID: parseInt(technicienID) };
        if (statut) where.Statut = statut;
        if (priorite) where.Priorite = priorite;

        const { count, rows } = await findReclamationAndCountAllSafe({
            where,
            include: [{ association: 'technicien', attributes: ['UserID', 'FullName', 'LoginName', 'EmailPro'] }],
            order: await getReclamationDefaultOrder(),
            limit: parseInt(limit),
            offset,
        });

        res.json({
            status: 'success',
            data: rows,
            technicien: {
                id: technician.UserID,
                nom: technician.FullName || technician.LoginName,
                email: technician.EmailPro
            },
            pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) },
        });
    } catch (err) {
        console.error('❌ getTechnicianReclamations:', err);
        next(err);
    }
};

// ─── GET MY RECLAMATIONS (Client Portal) ───────────────────────────────────────────────
exports.getMyMyClaims = async (req, res, next) => {
    try {
        const userEmail = normalizeString(req.user?.EmailPro || '');
        const userLogin = normalizeString(req.user?.LoginName || '');
        const userFullName = normalizeString(req.user?.FullName || '');
        const identities = [userEmail, userLogin, userFullName].filter(Boolean);
        
        if (!identities.length) {
            return res.status(401).json({ status: 'error', message: 'Utilisateur non authentifié' });
        }

        const { page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Filtrer STRICTEMENT par l'email ou login de l'utilisateur connecté
        // CUser = email ou login de la personne qui a créé la réclamation
        const where = {
            [Op.or]: identities.map((identity) => ({ CUser: identity }))
        };

        const { count, rows } = await findReclamationAndCountAllSafe({
            where,
            order: await getReclamationDefaultOrder(),
            limit: parseInt(limit),
            offset,
        });

        // Fetch interventions for each reclamation
        const reclamationsWithInterventions = await Promise.all(
            rows.map(async (rec) => {
                const interventions = await fetchInterventionsForReclamation(rec);
                return {
                    ...rec.toJSON(),
                    interventions,
                };
            })
        );

        res.json({
            status: 'success',
            data: reclamationsWithInterventions,
            pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) },
        });
    } catch (err) {
        console.error('❌ getMyMyClaims:', err);
        next(err);
    }
};
