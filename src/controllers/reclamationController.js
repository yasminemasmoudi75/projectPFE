const Reclamation = require('../models/Reclamation');
const TabDI = require('../models/TabDI');
const TabBT = require('../models/TabBT');
const { User, sequelize } = require('../models');
const { Op } = require('sequelize');

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
        const where = {};

        if (search.trim()) {
            where[Op.or] = [
                { LibTiers: { [Op.like]: `%${search}%` } },
                { Objet: { [Op.like]: `%${search}%` } },
                { NumTicket: { [Op.like]: `%${search}%` } },
            ];
        }
        if (statut) where.Statut = statut;
        if (priorite) where.Priorite = priorite;

        const { count, rows } = await Reclamation.findAndCountAll({
            where,
            order: [['DateOuverture', 'DESC']],
            limit: parseInt(limit),
            offset,
        });

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
        res.json({ status: 'success', data: rec });
    } catch (err) {
        next(err);
    }
};

// ─── CREATE ────────────────────────────────────────────────────────────────────
exports.create = async (req, res, next) => {
    try {
        const payload = { ...req.body };
        payload.NumTicket = await generateNumTicket();
        payload.DateOuverture = new Date();
        payload.Statut = payload.Statut || 'Ouvert';
        payload.CUser = req.user?.username || req.user?.email || 'admin';

        const rec = await Reclamation.create(payload);
        res.status(201).json({ status: 'success', message: 'Réclamation créée', data: rec });
    } catch (err) {
        console.error('❌ create reclamation:', err);
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
    console.log('👉 [AssignTechnician] Route hit with body:', req.body);
    try {
        const { technicienID } = req.body;
        
        if (!technicienID) {
            return res.status(400).json({ status: 'error', message: 'TechnicienID requis' });
        }

        // Vérifier que le technicien existe
        const technician = await User.findByPk(technicienID);
        if (!technician) {
            return res.status(404).json({ status: 'error', message: 'Technicien non trouvé' });
        }

        // Vérifier que la réclamation existe
        const rec = await Reclamation.findByPk(req.params.id);
        if (!rec) {
            return res.status(404).json({ status: 'error', message: 'Réclamation non trouvée' });
        }

        // Affecter le technicien
        const update = {
            TechnicienID: technicienID,
            NomTechnicien: technician.FullName || technician.LoginName,
            Statut: 'En cours' // Changer le statut à "En cours" au moment de l'affectation
        };

        await rec.update(update);

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
                VALUES (@NewIDBT, ${newNumBT}, GETDATE(), ${newNumDI}, @NewIDDI, '${technician.LoginName}', '${description}', GETDATE(), '${demandeur}', 1, 0, 'SAV');
            `;
            
            console.log('Debug: Executing Transaction SQL...');
            await sequelize.query(sqlTransaction);
            console.log(`✅ [Automation] DI #${newNumDI} and BT #${newNumBT} created via SINGLE SQL TRANSACTION`);

        } catch (autoErr) {
            console.error('⚠️ CRITICAL AUTOMATION ERROR:', autoErr);
        }
        // ------------------------------------
        
        const updated = await Reclamation.findByPk(req.params.id, {
            include: [{ association: 'technicien', attributes: ['UserID', 'FullName', 'LoginName', 'EmailPro'] }]
        });


        res.json({ 
            status: 'success', 
            message: `Réclamation affectée à ${technician.FullName || technician.LoginName}`, 
            data: updated 
        });
    } catch (err) {
        console.error('❌ assignTechnician reclamation:', err);
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
