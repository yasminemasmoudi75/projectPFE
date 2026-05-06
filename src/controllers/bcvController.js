const { BcvMaster, BcvDetail, Tiers, TabSociete, BlvMaster, BlvDetail, FavMaster, FavDetail, TiersClasse, TiersGouvernorat, TiersCategorie, sequelize } = require('../models');
const { Op, TableHints } = require('sequelize');

const PDFService = require('../services/pdfService');
const mouvementService = require('../services/mouvementService'); // ✅ Service de traçabilité mouvements
const { randomUUID } = require('crypto');

// Les fonctions utilitaires de filtrage hard-codées (isCommercialRole, buildCommercialCodRepresFilter, etc.) 
// ont été supprimées car elles sont maintenant gérées de manière centralisée par 
// le service applyTableDrivenFilters via la table TabRoleFilterVisibility.


const normalizeRole = (role) => String(role || '').trim().toLowerCase();

const isAdminUser = (user = {}) => {
  return ['admin', 'administrateur'].includes(normalizeRole(user?.UserRole));
};

const isAgentUser = (user = {}) => {
  return normalizeRole(user?.UserRole) === 'agent';
};

/**
 * Helper function to parse dates for SQL Server through Sequelize
 */
const parseDateValue = (dateValue) => {
    if (!dateValue || dateValue === '' || dateValue === 'null' || dateValue === null || dateValue === undefined) {
        return null;
    }

    try {
        let date;
        if (dateValue instanceof Date) {
            date = dateValue;
        } else {
            const cleaned = String(dateValue).replace(/([+-]\d{2}:\d{2}|Z)$/, '').trim();
            date = new Date(cleaned);
        }

        if (isNaN(date.getTime())) return null;
        return date;
    } catch (e) {
        return null;
    }
};

/**
 * Helper function to sanitize bcv master data
 */
const sanitizeMasterData = (masterData) => {
    const sanitized = { ...masterData };

    // Remove computed columns if any
    delete sanitized.NetHT;
    delete sanitized.Rest;
    delete sanitized.DiffLiv;

    // Do not send audit dates through Sequelize for TabBcvm to avoid timezone issues with legacy DATETIME.
    delete sanitized.DatUser;
    delete sanitized.DatCreateUser;

    // Parse and validate all date fields
    const dateFields = ['MDate', 'DatLiv', 'DatImp'];
    dateFields.forEach(field => {
        const val = sanitized[field];
        if (!val || val === '' || val === 'null' || val === null) {
            sanitized[field] = null;
        } else {
            const parsed = parseDateValue(val);
            sanitized[field] = parsed || null;
        }
    });

    // Ensure numeric fields are valid
    const numericFields = ['TotHT', 'TotTva', 'TotTTC', 'TotRem', 'Frais', 'Timbre', 'avanceforf'];
    numericFields.forEach(field => {
        if (sanitized.hasOwnProperty(field)) {
            const num = parseFloat(sanitized[field]);
            sanitized[field] = isNaN(num) ? 0 : num;
        }
    });

    // Ensure boolean fields are valid
    const booleanFields = ['Valid', 'bTransf', 'bLivr', 'IsConverted'];
    booleanFields.forEach(field => {
        if (sanitized.hasOwnProperty(field)) {
            sanitized[field] = !!sanitized[field];
        }
    });

    // Truncate string fields to match SQL Server column widths
    const stringLimits = {
        CodRepres: 10,
        CUser: 50,
        CodMag: 10,
        CodDev: 10,
        Prfx: 50,
        Sufx: 10,
        CodTiers: 20,
        LibTiers: 100,
        Adresse: 100,
        Remarq: 255
    };
    Object.entries(stringLimits).forEach(([field, maxLen]) => {
        if (sanitized[field] && typeof sanitized[field] === 'string' && sanitized[field].length > maxLen) {
            console.warn(`⚠️ [sanitizeBcvMasterData] Truncating ${field} from ${sanitized[field].length} to ${maxLen} chars`);
            sanitized[field] = sanitized[field].substring(0, maxLen);
        }
    });

    return sanitized;
};

const sanitizeBcvDetailData = (detail = {}) => {
    const sanitized = { ...detail };

    // Computed/DB-managed fields in TabBcvd must never be written.
    delete sanitized.MntHT;
    delete sanitized.MntTVA;
    delete sanitized.MntFodec;
    delete sanitized.NetHT;

    // Identity / generated fields.
    delete sanitized.NoDetail;
    delete sanitized.Guid;

    return sanitized;
};

const buildBcvSecurityWhere = async (guid, user) => {
    const filterHelper = require('../utils/filterHelper');
    const securityWhere = await filterHelper.applyTableDrivenFilters('5', {}, user);
    return { [Op.and]: [{ Guid: guid }, securityWhere] };
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

const isEmptyValue = (value) => {
    if (value === null || value === undefined) return true;
    return String(value).trim() === '';
};

const normalizeProjectId = (value) => {
    if (isEmptyValue(value)) return '';
    return String(value).trim();
};

const resolveLookupIdByLabel = async (Model, value, transaction) => {
    if (isEmptyValue(value)) return null;

    const raw = String(value).trim();
    if (/^\d+$/.test(raw)) return Number(raw);

    const normalized = raw.toLowerCase();
    const row = await Model.findOne({
        attributes: ['id'],
        where: sequelize.where(
            sequelize.fn('LOWER', sequelize.col('libelle')),
            normalized
        ),
        transaction
    });

    return row?.id ?? null;
};

const buildTierPatchFromMaster = async (master = {}, transaction) => {
    const patch = {};

    if (hasOwn(master, 'Ville')) {
        patch.Ville = isEmptyValue(master.Ville) ? null : String(master.Ville).trim();
    }

    if (hasOwn(master, 'MapsRegion')) {
        patch.MapsRegion = isEmptyValue(master.MapsRegion) ? null : String(master.MapsRegion).trim();
    } else if (hasOwn(master, 'Ville') && !isEmptyValue(master.Ville)) {
        patch.MapsRegion = String(master.Ville).trim();
    }

    if (hasOwn(master, 'Classe')) {
        if (isEmptyValue(master.Classe)) {
            patch.Classe = null;
        } else {
            const classeId = await resolveLookupIdByLabel(TiersClasse, master.Classe, transaction);
            if (classeId !== null) patch.Classe = classeId;
        }
    }

    if (hasOwn(master, 'Categorie')) {
        if (isEmptyValue(master.Categorie)) {
            patch.Categorie = null;
        } else {
            const categorieId = await resolveLookupIdByLabel(TiersCategorie, master.Categorie, transaction);
            if (categorieId !== null) patch.Categorie = categorieId;
        }
    }

    const gouvernoratSource = hasOwn(master, 'Gouvernorat')
        ? master.Gouvernorat
        : (hasOwn(master, 'Ville') ? master.Ville : undefined);

    if (gouvernoratSource !== undefined) {
        if (isEmptyValue(gouvernoratSource)) {
            patch.Gouvernorat = null;
        } else {
            const gouvernoratId = await resolveLookupIdByLabel(TiersGouvernorat, gouvernoratSource, transaction);
            if (gouvernoratId !== null) patch.Gouvernorat = gouvernoratId;
        }
    }

    return patch;
};

/**
 * Récupérer tous les bons de commande (master)
 * Ne consulte que TabBcvm — les devis convertis créent de vrais enregistrements BcvMaster
 */
exports.getAllBcv = async (req, res, next) => {
    try {
        const filterHelper = require('../utils/filterHelper');
        
        // Module 5 = BCV (Table-driven filters from TabRoleFilterVisibility)
        const { where, limit, offset, page } = await filterHelper.applyTableDrivenFiltersWithPagination(
            '5',
            req.query,
            req.user
        );


        const { count, rows } = await BcvMaster.findAndCountAll({
            where,
            include: [{
                model: Tiers,
                as: 'client',
                attributes: ['Raisoc', 'CodTiers', 'Ville', 'MapsRegion', 'Gouvernorat', 'Classe', 'Categorie'],
                include: [
                    { model: TiersClasse, as: 'tiersClasse', attributes: ['id', 'libelle'], required: false },
                    { model: TiersGouvernorat, as: 'region', attributes: ['id', 'libelle'], required: false },
                    { model: TiersCategorie, as: 'tiersCategorieObj', attributes: ['id', 'libelle'], required: false }
                ]
            }],
            order: [['DatUser', 'DESC']],
            limit,
            offset,
            tableHint: TableHints.NOLOCK
        });


        return res.status(200).json(
            filterHelper.formatPaginatedResponse(rows, count, page, limit)
        );
    } catch (error) {
        console.error('❌ Error getAllBcv:', error);
        next(error);
    }
};

/**
 * Récupérer un bon de commande par Guid (avec ses détails)
 */
exports.getBcvById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const filterHelper = require('../utils/filterHelper');

        // Sécurité mandataire pour les BCV (Module 5)
        const securityWhere = await filterHelper.applyTableDrivenFilters('5', {}, req.user);
        const where = { [Op.and]: [{ Guid: id }, securityWhere] };



        const bcv = await BcvMaster.findOne({
            where,
            include: [
                { model: BcvDetail, as: 'details' },
                { model: Tiers, as: 'client' }
            ],
            tableHint: TableHints.NOLOCK
        });


        if (!bcv) {
            return res.status(404).json({ status: 'error', message: 'Bon de commande non trouvé' });
        }

        return res.status(200).json({ status: 'success', data: bcv.toJSON() });
    } catch (error) {
        console.error('❌ Error getBcvById:', error);
        next(error);
    }
};

/**
 * Générer le PDF d'un bon de commande
 */
exports.generateBcvPDF = async (req, res, next) => {
    try {
        const { id } = req.params;

        const bcv = await BcvMaster.findOne({
            where: { Guid: id },
            include: [
                { model: BcvDetail, as: 'details' },
                { model: Tiers, as: 'client' }
            ]
        });

        if (!bcv) {
            return res.status(404).json({ status: 'error', message: 'Bon de commande non trouvé' });
        }

        const docData = bcv.toJSON();

        // Récupérer les infos société
        const soc = await TabSociete.findOne();

        // Générer le PDF via le service
        const pdfBuffer = await PDFService.generateCommercialPDF(docData, soc, 'BON DE COMMANDE');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=bc_${docData.Prfx || 'BC'}${docData.Nf}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('❌ Error generateBcvPDF:', error);
        next(error);
    }
};

/**
 * Transférer un bon de commande vers un BL ou une Facture
 */
exports.transferBcv = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { targetType, transport } = req.body; // 'BL' ou 'FAC'

        if (!['BL', 'FAC'].includes(targetType)) {
            return res.status(400).json({ status: 'error', message: 'Type de transfert invalide' });
        }

        // 1. Chercher le BCV dans TabBcvm (avec filtre de sécurité mandataire)
        const filterHelper = require('../utils/filterHelper');
        const securityWhere = await filterHelper.applyTableDrivenFilters('5', {}, req.user, t);
        const sourceWhere = { [Op.and]: [{ Guid: id }, securityWhere] };
        const sourceData = await BcvMaster.findOne({
            where: sourceWhere,
            include: [
                { model: BcvDetail, as: 'details' },
                { model: Tiers, as: 'client' }
            ],
            transaction: t
        });

        if (!sourceData) {
            await t.rollback();
            return res.status(404).json({ status: 'error', message: 'Bon de commande source non trouvé' });
        }

        if (sourceData.bTransf) {
            await t.rollback();
            return res.status(400).json({ status: 'error', message: 'Ce bon de commande a déjà été transféré' });
        }

        const data = sourceData.toJSON();
        const details = data.details || [];

        // 2. Préparer les nouveaux objets
        const newGuid = randomUUID();

        // Trouver le prochain numéro (Nf)
        const MasterModel = targetType === 'BL' ? BlvMaster : FavMaster;
        const DetailModel = targetType === 'BL' ? BlvDetail : FavDetail;

        const maxNf = await MasterModel.max('Nf', { transaction: t }) || 0;
        const nextNf = maxNf + 1;

        // Mapper explicitement les champs pour éviter les incompatibilités
        // EXCLURE les colonnes calculées (NetHT, Rest, etc.)
        const masterData = {
            Guid: newGuid,
            Prfx: targetType === 'BL' ? 'BL' : 'FA',
            Nf: nextNf,
            CodTiers: data.CodTiers,
            LibTiers: data.LibTiers,
            IDContact: data.IDContact,
            Adresse: data.Adresse,
            Remarq: data.Remarq,
            AssujTiers: data.AssujTiers,
            TotHT: data.TotHT,
            TotTva: data.TotTva,
            TotTTC: data.TotTTC,
            TotRem: data.TotRem,
            Timbre: data.Timbre,
            MntDebit: data.MntDebit,
            MntCredit: data.MntCredit,
            CodMag: data.CodMag,
            CodRepres: data.CodRepres,
            CodProject: data.CodProject || null,
            CodDev: data.CodDev,
            Valid: false,
            bTransf: false,
            bLivr: targetType === 'BL',
            MDate: sequelize.literal('GETDATE()'),
            DatUser: sequelize.literal('GETDATE()'),
            // Champs chauffeur (initialisés à null, remplis ci-dessous si BL)
            CodChauff: null,
            DesChauff: null
        };

        // Si transfert vers BL: mapper les infos chauffeur dans les colonnes dédiées
        if (targetType === 'BL' && transport && typeof transport === 'object') {
            const safe = (v) => (v === null || v === undefined) ? '' : String(v).trim();
            const transportPayload = {
                nom: safe(transport.nom),
                tel: safe(transport.tel)
            };

            // Validation: nom + téléphone obligatoires, téléphone = 8 chiffres uniquement
            if (!transportPayload.nom) {
                await t.rollback();
                return res.status(400).json({ status: 'error', message: 'Nom chauffeur obligatoire pour créer le BL' });
            }
            if (!transportPayload.tel) {
                await t.rollback();
                return res.status(400).json({ status: 'error', message: 'Numéro de téléphone obligatoire' });
            }
            if (!/^\d+$/.test(transportPayload.tel)) {
                await t.rollback();
                return res.status(400).json({ status: 'error', message: 'Le numéro de téléphone doit contenir uniquement des chiffres' });
            }
            if (transportPayload.tel.length !== 8) {
                await t.rollback();
                return res.status(400).json({ status: 'error', message: 'Le numéro de téléphone doit contenir exactement 8 chiffres' });
            }

            // ✅ Mapper dans les colonnes dédiées de TabBlvm
            masterData.DesChauff = transportPayload.nom;
            masterData.CodChauff = transportPayload.tel;

            // Conserver aussi un tag dans Remarq pour rétrocompatibilité avec le frontend
            const tag = `__transport__=${JSON.stringify(transportPayload)}`;
            const base = safe(masterData.Remarq);
            masterData.Remarq = base ? `${base}\n${tag}` : tag;
        }

        // 3. Créer le Master
        await MasterModel.create(masterData, { transaction: t });

        // 4. Créer les Détails
        // EXCLURE les colonnes calculées (MntHT, MntTVA, MntTTC, MntFodec)
        const newDetails = details.map((d) => ({
            Guid: randomUUID(),
            NF: nextNf,
            CodArt: d.CodArt,
            LibArt: d.LibArt,
            Qt: d.Qt,
            PuHT: d.PuHT,
            PuTTC: d.PuTTC,
            MntRem: d.MntRem,
            MntTVA: d.MntTVA, // Normalement calculé mais parfois on veut forcer
            Codabar: d.Codabar,
            IDArt: d.IDArt,
            ID: targetType === 'BL' ? 'BL' : 'FA'
        }));

        // Si SQL Server râle encore sur MntTVA/MntHT, on les retire complètement
        const sanitizedDetails = newDetails.map(d => {
            const { MntHT, MntTVA, MntTTC, MntFodec, ...rest } = d;
            return rest;
        });

        await DetailModel.bulkCreate(sanitizedDetails, { transaction: t });

        // 5. Marquer le BC source comme transféré + livré si BL
        await BcvMaster.update(
            { bTransf: true, bLivr: targetType === 'BL' ? true : sourceData.bLivr },
            { where: sourceWhere, transaction: t }
        );

        await t.commit();

        // ✅ ENREGISTRER LA TRANSFORMATION DANS MvtDocs (DEV → BCV)
        try {
          const montants = {
            codTiers: sourceData.CodTiers,
            libTiers: sourceData.LibTiers,
            totalHT: sourceData.TotHT,
            totalRem: sourceData.TotRem,
            totalFodec: 0,
            totalTVA: sourceData.TotTva,
            totalTTC: sourceData.TotTTC
          };
          const targetTypeMap = { 'BL': 'BLV', 'FAC': 'FAV' };
          const targetTypeDisplay = targetTypeMap[targetType];
          const userId = req.user?.id || req.user?.UserID;
          await mouvementService.enregistrerTransformation('BCV', sourceData.Nf, targetTypeDisplay, nextNf, montants, userId);
          console.log(`✅ Mouvement enregistré: Transformation BCV #${sourceData.Nf} → ${targetTypeDisplay} #${nextNf} par utilisateur ${userId}`);

          // 🔔 NOTIFICATION SITE & EMAIL CLIENT
          const { notifyDocumentCreated } = require('../utils/notificationUtils');
          const emailService = require('../utils/emailService');
          
          // Récupérer le tiers (il est déjà dans sourceData.client car inclus à la ligne 314)
          const tiers = sourceData.client;

          // Notif site
          await notifyDocumentCreated(targetType === 'FAC' ? 'FAV' : 'BLV', nextNf, tiers, userId);

          // Email client
          if (tiers?.Email) {
            await emailService.sendDocumentNotification(tiers.Email, tiers.Raisoc, {
              type: targetType === 'FAC' ? 'FAV' : 'BLV',
              numero: `${targetType === 'BL' ? 'BL' : 'FA'}-${nextNf}`,
              montant: sourceData.TotTTC,
              id: newGuid
            });
          }
        } catch (mouvementError) {
          console.error('⚠️ Erreur notifications transformation (non bloquant):', mouvementError.message);
        }

        return res.status(201).json({
            status: 'success',
            message: `Bon de commande transféré vers ${targetType === 'BL' ? 'Bon de Livraison' : 'Facture'} avec succès`,
            data: {
                Guid: newGuid,
                Nf: nextNf,
                type: targetType,
                isTransferred: true
            }
        });

    } catch (error) {
        if (t) await t.rollback();
        console.error('❌ Error transferBcv:', error);
        next(error);
    }
};

/**
 * Créer un nouveau bon de commande
 */
exports.createBcv = async (req, res, next) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const { master, details } = req.body;

        if (!master) {
            return res.status(400).json({ status: 'error', message: 'Master data is required' });
        }

        if (!master.CodTiers) {
            if (transaction && !transaction.finished) await transaction.rollback();
            return res.status(400).json({ status: 'error', message: 'Client (CodTiers) est obligatoire' });
        }

        const selectedTier = await Tiers.findOne({
            where: { CodTiers: master.CodTiers },
            attributes: ['IDTiers', 'CodTiers', 'Raisoc', 'Adresse', 'Ville', 'Gouvernorat', 'MapsRegion', 'Classe', 'Categorie', 'Email'],
            transaction
        });

        if (!selectedTier) {
            if (transaction && !transaction.finished) await transaction.rollback();
            return res.status(400).json({ status: 'error', message: 'Client sélectionné introuvable' });
        }

        const tierPatch = await buildTierPatchFromMaster(master, transaction);
        if (Object.keys(tierPatch).length > 0) {
            await selectedTier.update(tierPatch, { transaction });
        }

        // Keep BCV/client textual fields aligned with Tiers to avoid stale display values.
        master.CodTiers = selectedTier.CodTiers;
        master.LibTiers = selectedTier.Raisoc || master.LibTiers || '';
        master.Adresse = selectedTier.Adresse || master.Adresse || '';
        master.Ville = selectedTier.Ville || master.Ville || '';

        const selectedProjectId = normalizeProjectId(master.ProjectId || master.projectId || master.ID_Projet || master.projetId);
        delete master.ProjectId;
        delete master.projectId;
        delete master.ID_Projet;
        delete master.projetId;
        master.CodProject = selectedProjectId || null;

        if (req.user?.UserRole && String(req.user.UserRole).toLowerCase().includes('commercial')) {
            const codRepres = req.user.id || req.user.UserID;
            master.CodRepres = String(codRepres);
        }

        if (isAdminUser(req.user) || isAgentUser(req.user)) {
            // Admin/Agent can assign or inherit
            if (!master.CodRepres && selectedTier.codRepresTiers) {
                master.CodRepres = String(selectedTier.codRepresTiers);
            }
        }


        // 1. Déterminer le prochain numéro (Nf) si pas fourni
        if (!master.Nf) {
            const lastBcv = await BcvMaster.findOne({
                order: [['Nf', 'DESC']],
                transaction
            });
            master.Nf = (lastBcv?.Nf || 0) + 1;
        }

        const masterData = sanitizeMasterData(master);
        masterData.DatCreateUser = sequelize.literal('GETDATE()');
        masterData.DatUser = sequelize.literal('GETDATE()');
        masterData.MDate = sequelize.literal('GETDATE()');
        masterData.Guid = randomUUID();

        // 2. Créer le master
        const newBcv = await BcvMaster.create(masterData, { transaction });

        // 3. Créer les détails
        if (details && Array.isArray(details) && details.length > 0) {
            const detailsWithNf = details.map((d) => {
                const detail = sanitizeBcvDetailData(d);
                return {
                    ...detail,
                    NF: newBcv.Nf,
                    ID: newBcv.Nf,
                    Guid: randomUUID()
                };
            });
            await BcvDetail.bulkCreate(detailsWithNf, { transaction });
        }

        await transaction.commit();

        // ✅ ENREGISTRER LA CRÉATION DANS MvtDocs
        try {
          const montants = {
            codTiers: masterData.CodTiers,
            libTiers: masterData.LibTiers,
            totalHT: masterData.TotHT,
            totalRem: masterData.TotRem,
            totalFodec: masterData.TotFodec || 0,
            totalTVA: masterData.TotTva,
            totalTTC: masterData.TotTTC
          };
          const userId = req.user?.id || req.user?.UserID;
          await mouvementService.enregistrerCreation('BCV', newBcv.Nf, montants, userId);
          console.log('✅ Mouvement enregistré: Création BCV #${newBcv.Nf} par utilisateur ${userId}');

          // 🔔 NOTIFICATION SITE & EMAIL CLIENT
          const { notifyDocumentCreated } = require('../utils/notificationUtils');
          const emailService = require('../utils/emailService');

          // Log debugging information
          console.log('📧 [DEBUG-MAIL] Tentative d\'envoi email BCV...');
          console.log('📧 [DEBUG-MAIL] Email client (selectedTier.Email):', selectedTier?.Email);
          console.log('📧 [DEBUG-MAIL] SMTP Config - USER:', process.env.EMAIL_USER);
          console.log('📧 [DEBUG-MAIL] SMTP Config - SERVICE:', process.env.EMAIL_SERVICE);

          // Notif site
          await notifyDocumentCreated('BCV', newBcv.Nf, selectedTier, userId);

          // Email client
          if (selectedTier.Email) {
            await emailService.sendDocumentNotification(selectedTier.Email, selectedTier.Raisoc, {
              type: 'BCV',
              numero: `BC-${newBcv.Nf}`,
              montant: masterData.TotTTC,
              id: newBcv.Guid
            });
          }
        } catch (mouvementError) {
          console.error('⚠️ Erreur notifications creation (non bloquant):', mouvementError.message);
        }

        const result = await BcvMaster.findOne({
            where: { Guid: newBcv.Guid },
            include: [{ model: BcvDetail, as: 'details' }]
        });

        res.status(201).json({
            status: 'success',
            message: 'Bon de commande créé avec succès',
            data: result
        });
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('❌ Error createBcv:', error);
        next(error);
    }
};

/**
 * Mettre à jour un bon de commande
 */
exports.updateBcv = async (req, res, next) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const { id } = req.params;
        const { master, details } = req.body;

        if (!master) {
            if (transaction && !transaction.finished) await transaction.rollback();
            return res.status(400).json({ status: 'error', message: 'Master data is required' });
        }

        const bcvWhere = await buildBcvSecurityWhere(id, req.user);

        const bcv = await BcvMaster.findOne({ where: bcvWhere, transaction });
        if (!bcv) {
            if (transaction && !transaction.finished) await transaction.rollback();
            return res.status(404).json({ status: 'error', message: 'Bon de commande non trouvé' });
        }

        const targetCodTiers = master.CodTiers || bcv.CodTiers;
        const selectedTier = await Tiers.findOne({
            where: { CodTiers: targetCodTiers },
            attributes: ['IDTiers', 'CodTiers', 'Raisoc', 'Adresse', 'Ville', 'Gouvernorat', 'MapsRegion', 'Classe', 'Categorie', 'Email'],
            transaction
        });

        if (!selectedTier) {
            if (transaction && !transaction.finished) await transaction.rollback();
            return res.status(400).json({ status: 'error', message: 'Client sélectionné introuvable' });
        }

        const tierPatch = await buildTierPatchFromMaster(master, transaction);
        if (Object.keys(tierPatch).length > 0) {
            await selectedTier.update(tierPatch, { transaction });
        }

        master.CodTiers = selectedTier.CodTiers;
        master.LibTiers = selectedTier.Raisoc || master.LibTiers || '';
        master.Adresse = selectedTier.Adresse || master.Adresse || '';
        master.Ville = selectedTier.Ville || master.Ville || '';

        const selectedProjectId = normalizeProjectId(master.ProjectId || master.projectId || master.ID_Projet || master.projetId);
        delete master.ProjectId;
        delete master.projectId;
        delete master.ID_Projet;
        delete master.projetId;
        master.CodProject = selectedProjectId || null;

        if (req.user?.UserRole && String(req.user.UserRole).toLowerCase().includes('commercial')) {
            const codRepres = String(req.user?.id || req.user?.UserID || '').trim();
            if (!codRepres) {
                if (transaction && !transaction.finished) await transaction.rollback();
                return res.status(403).json({ status: 'error', message: 'Code représentant introuvable pour ce commercial' });
            }
            master.CodRepres = codRepres;
        }

        if (isAdminUser(req.user) || isAgentUser(req.user)) {
            // Admin/Agent can assign or inherit
            if (!master.CodRepres && selectedTier.codRepresTiers) {
                master.CodRepres = String(selectedTier.codRepresTiers);
            }
        }

        const masterData = sanitizeMasterData(master);
        masterData.MDate = sequelize.literal('GETDATE()');
        masterData.DatUser = sequelize.literal('GETDATE()');

        await bcv.update(masterData, { transaction });

        if (details && Array.isArray(details)) {
            await BcvDetail.destroy({ where: { NF: bcv.Nf }, transaction });
            if (details.length > 0) {
                const detailsWithNf = details.map((d) => {
                    const detail = sanitizeBcvDetailData(d);
                    return {
                        ...detail,
                        NF: bcv.Nf,
                        ID: bcv.Nf,
                        Guid: randomUUID()
                    };
                });
                await BcvDetail.bulkCreate(detailsWithNf, { transaction });
            }
        }

        await transaction.commit();

        const result = await BcvMaster.findOne({
            where: { Guid: id },
            include: [{ model: BcvDetail, as: 'details' }]
        });

        res.status(200).json({
            status: 'success',
            message: 'Bon de commande mis à jour avec succès',
            data: result
        });
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('❌ Error updateBcv:', error);
        next(error);
    }
};

/**
 * Récupérer les bons de commande de l'utilisateur connecté (Client Portal)
 */
exports.getMyBcv = async (req, res, next) => {
    try {
        const filterHelper = require('../utils/filterHelper');
        
        // Système de filtrage centralisé (Module 5)
        const { where, limit, offset, page } = await filterHelper.applyTableDrivenFiltersWithPagination(
            '5',
            req.query,
            req.user
        );


        const { count, rows } = await BcvMaster.findAndCountAll({
            where,
            include: [{
                model: Tiers,
                as: 'client',
                attributes: ['Raisoc', 'CodTiers', 'Ville', 'MapsRegion', 'Gouvernorat', 'Classe', 'Categorie'],
                include: [
                    { model: TiersClasse, as: 'tiersClasse', attributes: ['id', 'libelle'], required: false },
                    { model: TiersGouvernorat, as: 'region', attributes: ['id', 'libelle'], required: false },
                    { model: TiersCategorie, as: 'tiersCategorieObj', attributes: ['id', 'libelle'], required: false }
                ]
            }],
            order: [['DatUser', 'DESC']],
            limit,
            offset,
            tableHint: TableHints.NOLOCK
        });




        res.json(
            filterHelper.formatPaginatedResponse(rows, count, page, limit)
        );
    } catch (error) {
        console.error('❌ Error getMyBcv:', error);
        next(error);
    }
};


/**
 * Supprimer un bon de commande
 */
exports.deleteBcv = async (req, res, next) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const { id } = req.params;
        const bcvWhere = await buildBcvSecurityWhere(id, req.user);
        const bcv = await BcvMaster.findOne({ where: bcvWhere, transaction });

        if (!bcv) {
            await transaction.rollback();
            return res.status(404).json({ status: 'error', message: 'Bon de commande non trouvé' });
        }

        await BcvDetail.destroy({ where: { NF: bcv.Nf }, transaction });
        await bcv.destroy({ transaction });

        await transaction.commit();

        res.status(200).json({ status: 'success', message: 'Bon de commande supprimé avec succès' });
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('❌ Error deleteBcv:', error);
        next(error);
    }
};
