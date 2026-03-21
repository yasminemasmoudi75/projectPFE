const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Tiers, TiersContact, TiersAdr, User, sequelize } = require('../models');
const { sendClientCredentials } = require('../utils/emailService');
const { logAction } = require('../utils/logger');
const { allocateNextUserId } = require('../utils/userId');
const { attachAccessToUser, upsertUserAccess } = require('../utils/userAccess');

const DEFAULT_TIERS_NIVEAU = 0;
const MAX_COD_TIERS_LENGTH = 20;
const MAX_USER_LOGIN_LENGTH = 30;
const MAX_USER_FULLNAME_LENGTH = 40;

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : value);
const normalizeNullableString = (value) => {
    const normalized = normalizeString(value);
    return normalized === '' ? null : normalized;
};
const normalizeNullableNumber = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
};
const normalizeNullableInt = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number.parseInt(value, 10);
    return Number.isInteger(n) ? n : null;
};
const normalizeNullableBool = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
        const v = value.trim().toLowerCase();
        if (['1', 'true', 'yes', 'oui'].includes(v)) return true;
        if (['0', 'false', 'no', 'non'].includes(v)) return false;
    }
    return null;
};

const resolveTiersNiveau = (payload = {}) => {
    const rawNiveau = payload.Niveau ?? payload.niveau;
    const normalizedNiveau = Number(rawNiveau);

    if (Number.isInteger(normalizedNiveau) && normalizedNiveau >= 0) {
        return normalizedNiveau;
    }

    return DEFAULT_TIERS_NIVEAU;
};

const generateCodTiers = () => {
    const timestamp = Date.now().toString().slice(-8);
    const randomSuffix = Math.floor(Math.random() * 100)
        .toString()
        .padStart(2, '0');

    return `CLI${timestamp}${randomSuffix}`;
};

const resolveCodTiers = (rawCodTiers) => {
    const normalizedCodTiers = normalizeString(rawCodTiers) || '';

    const candidate = normalizedCodTiers || generateCodTiers();

    if (candidate.length > MAX_COD_TIERS_LENGTH) {
        const error = new Error(`Le code client (CodTiers) ne doit pas dépasser ${MAX_COD_TIERS_LENGTH} caractères`);
        error.statusCode = 400;
        throw error;
    }

    return candidate;
};

const resolveUserFullName = (rawRaisoc) => {
    const normalizedRaisoc = normalizeString(rawRaisoc) || '';
    return normalizedRaisoc.slice(0, MAX_USER_FULLNAME_LENGTH);
};

const mapTiersPayload = (payload = {}, { forCreate = false, createdBy = null } = {}) => {
    const niveau = resolveTiersNiveau(payload);

    const mapped = {
        Niveau: niveau,
        Raisoc: normalizeNullableString(payload.Raisoc),
        Email: normalizeNullableString(payload.Email),
        Tel: normalizeNullableString(payload.Tel),
        Fax: normalizeNullableString(payload.Fax),
        Gsm: normalizeNullableString(payload.Gsm),
        www: normalizeNullableString(payload.www),
        Adresse: normalizeNullableString(payload.Adresse),
        Ville: normalizeNullableString(payload.Ville),
        Pays: normalizeNullableString(payload.Pays),
        Cp: normalizeNullableString(payload.CodePostal ?? payload.Cp),
        CodTva: normalizeNullableString(payload.MatriculeFiscale ?? payload.CodTva),
        Cin: normalizeNullableString(payload.Cin),
        Remise: normalizeNullableNumber(payload.Remise),
        Blockage: normalizeNullableBool(payload.Blockage),
        Timbre: normalizeNullableBool(payload.Timbre),
        Major: normalizeNullableBool(payload.Major),
        Exonor: normalizeNullableBool(payload.Exonor),
        TextExonor: normalizeNullableString(payload.TextExonor),
        NbrCreditJour: normalizeNullableInt(payload.NbrCreditJour),
        Plafondcredit: normalizeNullableNumber(payload.Plafondcredit),
        ModReg: normalizeNullableString(payload.ModReg),
        DetailReg: normalizeNullableString(payload.DetailReg),
        Banque: normalizeNullableString(payload.Banque),
        RC: normalizeNullableString(payload.RC),
        assujet: normalizeNullableBool(payload.assujet),
        Actif: normalizeNullableBool(payload.Actif),
        Fictif: normalizeNullableBool(payload.Fictif),
        Pub: normalizeNullableBool(payload.Pub),
        AdresseMaps: normalizeNullableString(payload.AdresseMaps),
        MapsVille: normalizeNullableString(payload.MapsVille),
        MapsPays: normalizeNullableString(payload.MapsPays),
        MapsDistrict: normalizeNullableString(payload.MapsDistrict),
        MapsRegion: normalizeNullableString(payload.MapsRegion),
        MapsSubRegion: normalizeNullableString(payload.MapsSubRegion),
        gouvernorat: normalizeNullableString(payload.gouvernorat),
        lat: normalizeNullableNumber(payload.lat),
        long: normalizeNullableNumber(payload.long),
        codRepresTiers: normalizeNullableString(payload.Commercial ?? payload.codRepresTiers)
    };

    if (forCreate) {
        mapped.Actif = mapped.Actif ?? true;
        mapped.UserCreate = createdBy || null;
        mapped.SaveDate = new Date();
    }

    return mapped;
};

const normalizeContacts = (payload = {}) => {
    const raw = payload.contacts ?? payload.Contacts ?? payload.tiersContacts;
    if (!Array.isArray(raw)) return [];

    return raw
        .map((item) => ({
            Responsable: normalizeNullableString(item?.Responsable),
            Tel: normalizeNullableString(item?.Tel)
        }))
        .filter((item) => item.Responsable || item.Tel);
};

const normalizeAddresses = (payload = {}) => {
    const raw = payload.addresses ?? payload.Addresses ?? payload.tiersAddresses;
    if (!Array.isArray(raw)) return [];

    return raw
        .map((item) => ({
            Adresse: normalizeNullableString(item?.Adresse)
        }))
        .filter((item) => item.Adresse);
};

const replaceTiersChildren = async ({ tierId, contacts, addresses, transaction }) => {
    if (!tierId) return;

    if (Array.isArray(contacts)) {
        await TiersContact.destroy({ where: { IDTiers: tierId }, transaction });
        if (contacts.length > 0) {
            await TiersContact.bulkCreate(
                contacts.map((item, index) => ({
                    IDTiers: tierId,
                    ID: index + 1,
                    Responsable: item.Responsable,
                    Tel: item.Tel
                })),
                { transaction }
            );
        }
    }

    if (Array.isArray(addresses)) {
        await TiersAdr.destroy({ where: { IDTiers: tierId }, transaction });
        if (addresses.length > 0) {
            await TiersAdr.bulkCreate(
                addresses.map((item, index) => ({
                    IDTiers: tierId,
                    ID: index + 1,
                    Adresse: item.Adresse
                })),
                { transaction }
            );
        }
    }
};

/**
 * Générer un mot de passe aléatoire sécurisé (Fort)
 */
const generateRandomPassword = (length = 12) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    // Garantir au moins un caractère de chaque type
    password += "A"; // Majuscule
    password += "a"; // Minuscule
    password += "1"; // Chiffre
    password += "!"; // Spécial

    for (let i = 4; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    // Mélanger le mot de passe
    return password.split('').sort(() => 0.5 - Math.random()).join('');
};

/**
 * Créer un nouveau client (Tiers) et son compte utilisateur associé
 */
exports.createTiers = async (req, res, next) => {
    console.time('CreateTiers-Total');
    console.log('--- [START] createTiers ---');
    console.log('Body:', req.body);

    const t = await sequelize.transaction();
    console.log('Transaction started');

    try {
        const tiersPayload = mapTiersPayload(req.body, {
            forCreate: true,
            createdBy: req.user.LoginName
        });
        const normalizedRaisoc = normalizeString(tiersPayload.Raisoc);
        const normalizedEmail = normalizeString(tiersPayload.Email);
        const resolvedCodTiers = resolveCodTiers(req.body.CodTiers);
        const userFullName = resolveUserFullName(normalizedRaisoc);
        const contacts = normalizeContacts(req.body);
        const addresses = normalizeAddresses(req.body);

        // 1. Validation de base
        if (!normalizedRaisoc || !normalizedEmail) {
            await t.rollback();
            return res.status(400).json({
                status: 'error',
                message: 'La raison sociale (Raisoc) et l\'email sont obligatoires'
            });
        }

        if (normalizedEmail.length > MAX_USER_LOGIN_LENGTH) {
            await t.rollback();
            return res.status(400).json({
                status: 'error',
                message: `L'email ne doit pas dépasser ${MAX_USER_LOGIN_LENGTH} caractères pour la création du compte client`
            });
        }

        // 2. Vérifier si l'email est déjà utilisé par un utilisateur
        console.time('Check-Email');
        const existingUser = await User.findOne({
            where: { EmailPro: normalizedEmail },
            transaction: t
        });
        console.timeEnd('Check-Email');

        const existingTiers = await Tiers.findOne({
            where: { CodTiers: resolvedCodTiers },
            transaction: t
        });

        if (existingTiers) {
            await t.rollback();
            return res.status(400).json({
                status: 'error',
                message: 'Le code client (CodTiers) existe déjà'
            });
        }

        if (existingUser) {
            await t.rollback();
            return res.status(400).json({
                status: 'error',
                message: 'Cet email est déjà associé à un utilisateur existant'
            });
        }

        // 3. Créer le Tiers (Société)
        console.time('Create-Tiers-DB');
        const newTiers = await Tiers.create({
            CodTiers: resolvedCodTiers,
            ...tiersPayload,
            Raisoc: normalizedRaisoc,
            Email: normalizedEmail
        }, { transaction: t });

        await replaceTiersChildren({
            tierId: newTiers.IDTiers,
            contacts,
            addresses,
            transaction: t
        });
        console.timeEnd('Create-Tiers-DB');

        // 4. Préparer le compte utilisateur pour le client
        const clearPassword = generateRandomPassword();

        console.time('Hash-Password');
        const hashedPassword = await bcrypt.hash(clearPassword, 10);
        console.timeEnd('Hash-Password');

        console.time('Create-User-DB');
        const newUser = await User.create({
            UserID: await allocateNextUserId({ transaction: t }),
            LoginName: normalizedEmail, // On utilise l'email comme login par défaut
            EmailPro: normalizedEmail,
            FullName: userFullName,
            Password: hashedPassword,
            IsActive: true,
            Enabled: true,
            MustChangePassword: true
        }, { transaction: t });

        await upsertUserAccess(newUser.UserID, 'Client', { transaction: t, isActive: true });
        await attachAccessToUser(newUser, { transaction: t });
        console.timeEnd('Create-User-DB');

        // 5. Envoyer l'email (on le fait après la transaction pour être sûr)
        console.time('Commit-Transaction');
        await t.commit();
        console.timeEnd('Commit-Transaction');
        console.log('Transaction committed');

        // L'envoi d'email ne bloque pas la réponse si succès DB
        // L'envoi d'email ne bloque pas la réponse si succès DB
        console.time('Send-Email');
        sendClientCredentials(normalizedEmail, normalizedRaisoc, clearPassword).catch(err => console.error('Email send failed asynchronous:', err));
        console.timeEnd('Send-Email');

        // Audit Log
        console.time('Log-Action');
        await logAction(req.user.UserID, 'CREATE', 'Tiers', newTiers.CodTiers, `Nouveau client : ${normalizedRaisoc}`);
        console.timeEnd('Log-Action');

        console.timeEnd('CreateTiers-Total');
        console.log('--- [END] createTiers Success ---');

        res.status(201).json({
            status: 'success',
            message: 'Client et compte utilisateur créés avec succès',
            data: {
                tiers: newTiers,
                user: {
                    UserID: newUser.UserID,
                    LoginName: newUser.LoginName,
                    UserRole: newUser.UserRole
                }
            }
        });
    } catch (error) {
        console.error('❌ [CREATE TIERS ERROR]:', error.name, error.message);
        if (error.errors) {
            error.errors.forEach(err => console.error(`   - Champ: ${err.path}, Message: ${err.message}`));
        }

        // Gestion spécifique des erreurs de validation Sequelize
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            if (t && !t.finished) await t.rollback().catch(() => { });
            return res.status(400).json({
                status: 'error',
                message: error.errors[0]?.message || 'Erreur de validation',
                errors: error.errors.map(err => ({
                    field: err.path,
                    message: err.message
                }))
            });
        }

        if (t && !t.finished) {
            try {
                await t.rollback();
            } catch (rollbackError) {
                console.error('❌ [ROLLBACK ERROR]:', rollbackError.message);
            }
        }
        next(error);
    }
};

/**
 * Récupérer tous les clients
 */
exports.getAllTiers = async (req, res, next) => {
    try {
        const sort = normalizeString(req.query.sort)?.toLowerCase();
        const order = sort === 'recent'
            ? [['SaveDate', 'DESC'], ['Raisoc', 'ASC']]
            : [['Raisoc', 'ASC']];

        const tiers = await Tiers.findAll({
            order
        });
        res.status(200).json({
            status: 'success',
            count: tiers.length,
            data: tiers
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Récupérer un client par ID
 */
exports.getTiersById = async (req, res, next) => {
    try {
        const tiers = await Tiers.findByPk(req.params.id);
        if (!tiers) {
            return res.status(404).json({ status: 'error', message: 'Client non trouvé' });
        }

        const [contacts, addresses] = await Promise.all([
            TiersContact.findAll({ where: { IDTiers: tiers.IDTiers }, order: [['ID', 'ASC']] }),
            TiersAdr.findAll({ where: { IDTiers: tiers.IDTiers }, order: [['ID', 'ASC']] })
        ]);

        const plainTiers = tiers.toJSON();
        plainTiers.contacts = contacts.map((c) => c.toJSON());
        plainTiers.addresses = addresses.map((a) => a.toJSON());

        res.status(200).json({ status: 'success', data: plainTiers });
    } catch (error) {
        next(error);
    }
};

/**
 * Mettre à jour un client
 */
exports.updateTiers = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const tiers = await Tiers.findByPk(req.params.id, { transaction: t });
        if (!tiers) {
            await t.rollback();
            return res.status(404).json({ status: 'error', message: 'Client non trouvé' });
        }

        const allowedUpdates = mapTiersPayload(req.body, { forCreate: false });
        Object.keys(allowedUpdates).forEach((key) => {
            if (allowedUpdates[key] === undefined) {
                delete allowedUpdates[key];
            }
        });

        await tiers.update(allowedUpdates, { transaction: t });

        const contactsProvided = Array.isArray(req.body.contacts) || Array.isArray(req.body.Contacts) || Array.isArray(req.body.tiersContacts);
        const addressesProvided = Array.isArray(req.body.addresses) || Array.isArray(req.body.Addresses) || Array.isArray(req.body.tiersAddresses);

        if (contactsProvided || addressesProvided) {
            await replaceTiersChildren({
                tierId: tiers.IDTiers,
                contacts: contactsProvided ? normalizeContacts(req.body) : null,
                addresses: addressesProvided ? normalizeAddresses(req.body) : null,
                transaction: t
            });
        }

        await t.commit();

        res.status(200).json({
            status: 'success',
            message: 'Client mis à jour avec succès',
            data: tiers
        });

        // Audit Log
        await logAction(req.user.UserID, 'UPDATE', 'Tiers', tiers.CodTiers, `Mise à jour client : ${Object.keys(allowedUpdates).join(', ')}`);
    } catch (error) {
        if (t && !t.finished) {
            await t.rollback().catch(() => { });
        }
        next(error);
    }
};

/**
 * Supprimer un client
 */
exports.deleteTiers = async (req, res, next) => {
    try {
        const tiers = await Tiers.findByPk(req.params.id);
        if (!tiers) {
            return res.status(404).json({ status: 'error', message: 'Client non trouvé' });
        }

        await tiers.destroy();

        res.status(200).json({
            status: 'success',
            message: 'Client supprimé avec succès'
        });

        // Audit Log
        await logAction(req.user.UserID, 'DELETE', 'Tiers', tiers.CodTiers, 'Suppression client');
    } catch (error) {
        next(error);
    }
};

/**
 * Récupérer les gouvernorats distincts
 */
exports.getRegions = async (req, res, next) => {
    try {
        const [regions] = await sequelize.query(
            `SELECT DISTINCT gouvernorat FROM Tiers WHERE gouvernorat IS NOT NULL AND gouvernorat != '' ORDER BY gouvernorat ASC`
        );

        const regionsList = regions.map(row => row.gouvernorat).filter(r => r && r.trim() !== '');

        res.status(200).json({
            status: 'success',
            data: regionsList
        });
    } catch (error) {
        console.error('Erreur getRegions:', error);
        next(error);
    }
};

/**
 * Récupérer les villes/régions distinctes
 */
exports.getVilles = async (req, res, next) => {
    try {
        const [villes] = await sequelize.query(
            `SELECT DISTINCT Ville FROM Tiers WHERE Ville IS NOT NULL AND Ville != '' ORDER BY Ville ASC`
        );

        const villesList = villes.map(row => row.Ville).filter(v => v && v.trim() !== '');

        res.status(200).json({
            status: 'success',
            data: villesList
        });
    } catch (error) {
        console.error('Erreur getVilles:', error);
        next(error);
    }
};
