const Reclamation = require('../models/Reclamation');
const TabDI = require('../models/TabDI');
const TabBT = require('../models/TabBT');
const { User, Tiers, sequelize } = require('../models');
const { Op } = require('sequelize');
const { resolveUserAccess } = require('../utils/userAccess');

const MAX_LENGTHS = {
    CodTiers: 20,
    LibTiers: 255,
    Objet: 500,
    TypeReclamation: 100,
    Priorite: 50,
    Statut: 50,
    NomTechnicien: 255,
    CUser: 100,
};

const buildClientFilter = async (user = {}) => {
    const userEmail = (user?.EmailPro || '').toLowerCase().trim();
    const userLogin = (user?.LoginName || '').toLowerCase().trim();
    const directCodTiers = user?.CodTiers || user?.codTiers || null;
    
    const orConditions = [];

    if (directCodTiers) {
      orConditions.push({ CodTiers: directCodTiers });
    }
    
    if (userEmail) orConditions.push(sequelize.where(sequelize.fn('LOWER', sequelize.col('CUser')), userEmail));
    if (userLogin && userLogin !== userEmail) orConditions.push(sequelize.where(sequelize.fn('LOWER', sequelize.col('CUser')), userLogin));
    
    if (userEmail) {
      try {
        const tiers = await Tiers.findOne({
          where: sequelize.where(sequelize.fn('LOWER', sequelize.col('Email')), userEmail),
          attributes: ['CodTiers'],
        });
        
        if (tiers?.CodTiers) {
          orConditions.push({ CodTiers: tiers.CodTiers });
        }
      } catch (err) {
        console.error('Error finding Tiers for client filter:', err.message);
      }
    }
    
    if (orConditions.length === 0) {
      return { NumTicket: '__NO_MATCH__' }; // NumTicket instead of Guid
    }
    
    return { [Op.or]: orConditions };
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
    const last = await Reclamation.findOne({ order: [['ID', 'DESC']] });
    const seq = ((last?.ID || 0) + 1).toString().padStart(4, '0');
    return `REC-${year}-${seq}`;
};

// ─── GET ALL ───────────────────────────────────────────────────────────────────
exports.getAll = async (req, res, next) => {
    try {
        const { search = '', statut = '', priorite = '', page = 1, limit = 100 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        let where = {};

        // Check if user is a CLIENT - apply filtering
        const userId = req.user?.id || req.user?.UserID;
        const access = await resolveUserAccess(userId, req.user?.UserRole);
        const isClient = access?.normalizedRole === 'client';

        if (isClient) {
            console.log('🔐 CLIENT filtering enabled for user:', req.user?.LoginName);
            const clientFilter = await buildClientFilter(req.user);
            where = { ...where, ...clientFilter };
            console.log('   Filter applied:', JSON.stringify(clientFilter));
        }

        if (search.trim()) {
            where[Op.or] = [
                { LibTiers: { [Op.like]: `%${search}%` } },
                { Objet: { [Op.like]: `%${search}%` } },
                { NumTicket: { [Op.like]: `%${search}%` } },
            ];
        }
        if (statut) where.Statut = statut;
        if (priorite) where.Priorite = priorite;

        console.log('📊 Query WHERE clause:', JSON.stringify(where));

        const { count, rows } = await Reclamation.findAndCountAll({
            where,
            order: [['DateOuverture', 'DESC']],
            limit: parseInt(limit),
            offset,
        });

        console.log('✅ Found', rows.length, 'reclamations (out of', count, 'total)');

        res.json({
            status: 'success',
            data: rows,
            pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) },
        });
    } catch (err) {
        console.error('❌ getAll reclamations:', err);
        next(err);
    }
};

// ─── GET BY ID ─────────────────────────────────────────────────────────────────
exports.getById = async (req, res, next) => {
    try {
        const rec = await Reclamation.findByPk(req.params.id);
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

        res.json({
            status: 'success',
            data: {
                ...rec.toJSON(),
                interventions,
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

        await sequelize.query(
            `
                INSERT INTO TabReclamation (
                    CodTiers,
                    LibTiers,
                    Objet,
                    Description,
                    TypeReclamation,
                    Priorite,
                    Statut,
                    NomTechnicien,
                    TechnicienID,
                    DateOuverture,
                    DateResolution,
                    CUser,
                    Solution,
                    NumTicket
                )
                VALUES (
                    :CodTiers,
                    :LibTiers,
                    :Objet,
                    :Description,
                    :TypeReclamation,
                    :Priorite,
                    :Statut,
                    :NomTechnicien,
                    :TechnicienID,
                    GETDATE(),
                    :DateResolution,
                    :CUser,
                    :Solution,
                    :NumTicket
                )
            `,
            {
                replacements: {
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
                },
            }
        );

        const rec = await Reclamation.findOne({ where: { NumTicket: payload.NumTicket } });
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
        const rec = await Reclamation.findByPk(req.params.id);
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

        const rec = await Reclamation.findByPk(req.params.id);
        if (!rec) return res.status(404).json({ status: 'error', message: 'Réclamation non trouvée' });

        const update = { Statut: statut };
        if (['Résolu', 'Fermé'].includes(statut) && !rec.DateResolution) {
            update.DateResolution = new Date();
        }

        await rec.update(update);
        res.json({ status: 'success', message: `Statut mis à jour : ${statut}`, data: rec });
    } catch (err) {
        console.error('❌ updateStatus reclamation:', err);
        next(err);
    }
};

// ─── DELETE ────────────────────────────────────────────────────────────────────
exports.remove = async (req, res, next) => {
    try {
        const rec = await Reclamation.findByPk(req.params.id);
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

        // Vérifier que la réclamation existe
        console.log(`🔍 [AssignTechnician] Searching for reclamation with ID = ${req.params.id}...`);
        const rec = await Reclamation.findByPk(req.params.id);
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

        // Check actual FK parent metadata before setting TechnicienID to avoid 409 conflicts.
        let canSetTechnicienId = false;
        let fkParentSchema = null;
        let fkParentTable = null;
        let fkUserColumn = null;
        try {
            const [fkRows] = await sequelize.query(
                `
                SELECT TOP 1
                    s2.name AS ParentSchema,
                    t2.name AS ParentTable,
                    c2.name AS ParentColumn
                FROM sys.foreign_keys fk
                JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
                JOIN sys.tables t1 ON fkc.parent_object_id = t1.object_id
                JOIN sys.columns c1 ON c1.object_id = t1.object_id AND c1.column_id = fkc.parent_column_id
                JOIN sys.tables t2 ON fkc.referenced_object_id = t2.object_id
                JOIN sys.schemas s2 ON t2.schema_id = s2.schema_id
                JOIN sys.columns c2 ON c2.object_id = t2.object_id AND c2.column_id = fkc.referenced_column_id
                WHERE t1.name = 'TabReclamation' AND c1.name = 'TechnicienID'
                `
            );

            const fkMeta = fkRows?.[0] || {};
            fkParentSchema = fkMeta.ParentSchema || null;
            fkParentTable = fkMeta.ParentTable || null;
            fkUserColumn = fkMeta.ParentColumn || null;

            if (fkParentSchema && fkParentTable && fkUserColumn) {
                const [existsRows] = await sequelize.query(
                    `SELECT CASE WHEN EXISTS (SELECT 1 FROM [${fkParentSchema}].[${fkParentTable}] WHERE [${fkUserColumn}] = :techId) THEN 1 ELSE 0 END AS existsInParent`,
                    { replacements: { techId: technicienIDToSave } }
                );
                canSetTechnicienId = Number(existsRows?.[0]?.existsInParent) === 1;
            }

            console.log('🔍 [AssignTechnician] FK check resolved parent:', {
                fkParentSchema,
                fkParentTable,
                fkUserColumn,
                technicianExistsInParent: canSetTechnicienId,
                techId: technicienIDToSave,
            });
        } catch (fkCheckErr) {
            console.warn('⚠️ [AssignTechnician] FK pre-check failed, fallback to NomTechnicien only:', fkCheckErr?.message);
            canSetTechnicienId = false;
        }

        const updatePayload = {
            NomTechnicien: technicianDisplayName,
            Statut: 'En cours',
            TechnicienID: canSetTechnicienId ? technicienIDToSave : null,
        };

        console.log('👤 [AssignTechnician] Final update payload:', updatePayload);

        try {
            await rec.update(updatePayload);
            console.log('✅ [AssignTechnician] Update succeeded');
        } catch (updateErr) {
            // Last safety net: if FK still fails, keep assignment by name/status only.
            if (updateErr?.name === 'SequelizeForeignKeyConstraintError') {
                console.warn('⚠️ [AssignTechnician] FK conflict on TechnicienID, retrying without TechnicienID');
                await rec.update({
                    NomTechnicien: technicianDisplayName,
                    Statut: 'En cours',
                    TechnicienID: null,
                });
            } else {
                throw updateErr;
            }
        }

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
        const updated = await Reclamation.findByPk(req.params.id, {
            include: [{ association: 'technicien', attributes: ['UserID', 'FullName', 'LoginName', 'EmailPro'] }]
        });

        console.log('✅ [AssignTechnician] Reclamation reloaded, confirming saved data:', {
            ID: updated.ID,
            TechnicienID: updated.TechnicienID,
            NomTechnicien: updated.NomTechnicien,
            Statut: updated.Statut,
            SavedSuccessfully: canSetTechnicienId
                ? String(updated.TechnicienID) === String(technicienIDToSave)
                : Boolean(updated.NomTechnicien)
        });

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
        const rec = await Reclamation.findByPk(req.params.id);
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
        const rec = await Reclamation.findByPk(req.params.id);
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

        const updated = await Reclamation.findByPk(req.params.id, {
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

        const { count, rows } = await Reclamation.findAndCountAll({
            where,
            include: [{ association: 'technicien', attributes: ['UserID', 'FullName', 'LoginName', 'EmailPro'] }],
            order: [['DateOuverture', 'DESC']],
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

        const where = await buildClientFilter(req.user);

        const { count, rows } = await Reclamation.findAndCountAll({
            where,
            order: [['DateOuverture', 'DESC']],
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
