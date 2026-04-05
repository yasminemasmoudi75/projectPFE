const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { Tiers, TiersContact, TiersAdr, User, TiersClasse, TiersGouvernorat, TiersCategorie, sequelize } = require('../models');
const { sendClientCredentials } = require('../utils/emailService');
const { logAction } = require('../utils/logger');
const { allocateNextUserId } = require('../utils/userId');
const { attachAccessToUser, upsertUserAccess } = require('../utils/userAccess');

const DEFAULT_TIERS_NIVEAU = 0;
const MAX_COD_TIERS_LENGTH = 20;
const MAX_USER_LOGIN_LENGTH = 100;
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

const isCommercialRole = (role) => {
    const normalized = String(role || '').trim().toLowerCase();
    return normalized === 'commercial' || normalized === 'commerciale';
};

const getCommercialIdentifiers = (user = {}) => {
    const candidates = [
        user?.CodRepres,
        user?.codRepres,
        user?.GUID,
        user?.UserID,
        user?.LoginName,
        user?.FullName,
        user?.EmailPro
    ];

    const normalized = candidates
        .map((value) => (value === null || value === undefined ? null : String(value).trim()))
        .filter((value) => value && value.length > 0)
        .map((value) => value.toLowerCase());

    return Array.from(new Set(normalized));
};

const buildCommercialTiersWhere = (user = {}) => {
    const identifiers = getCommercialIdentifiers(user);

    if (identifiers.length === 0) {
        return { IDTiers: '__NO_MATCH__' };
    }

    return {
        [Op.or]: identifiers.map((identifier) =>
            sequelize.where(sequelize.fn('LOWER', sequelize.col('codRepresTiers')), identifier)
        )
    };
};

const isTierRelatedToCommercial = (tier, user = {}) => {
    const rep = String(tier?.codRepresTiers || '').trim().toLowerCase();
    if (!rep) return false;
    return getCommercialIdentifiers(user).includes(rep);
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

// Validation supplémentaire pour éviter les troncatures
const validateUserFields = (email, fullName) => {
    const errors = [];
    
    if (email && email.length > MAX_USER_LOGIN_LENGTH) {
        errors.push(`L'email ne doit pas dépasser ${MAX_USER_LOGIN_LENGTH} caractères`);
    }
    
    if (fullName && fullName.length > MAX_USER_FULLNAME_LENGTH) {
        errors.push(`Le nom complet ne doit pas dépasser ${MAX_USER_FULLNAME_LENGTH} caractères`);
    }
    
    return errors;
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
        gouvernorat: normalizeNullableInt(payload.gouvernorat),
        lat: normalizeNullableNumber(payload.lat),
        long: normalizeNullableNumber(payload.long),
        Classe: normalizeNullableInt(payload.Classe),
        Categorie: normalizeNullableInt(payload.Categorie),
        codRepresTiers: normalizeNullableString(payload.Commercial ?? payload.codRepresTiers)
    };

    if (forCreate) {
        mapped.Actif = mapped.Actif ?? true;
        mapped.UserCreate = createdBy || null;
        // Format sans timezone pour compatibilité SQL Server datetime
        const now = new Date();
        mapped.SaveDate = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + ' ' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0') + ':' +
            String(now.getSeconds()).padStart(2, '0');
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

        // 2. Validation des champs utilisateur pour éviter les troncatures
        const validationErrors = validateUserFields(normalizedEmail, userFullName);
        if (validationErrors.length > 0) {
            await t.rollback();
            return res.status(400).json({
                status: 'error',
                message: 'Validation des champs utilisateur échouée',
                errors: validationErrors
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
        await newTiers.reload({
            include: [
                { model: TiersClasse, as: 'tiersClasse' },
                { model: TiersGouvernorat, as: 'region' },
                { model: TiersCategorie, as: 'tiersCategorieObj' }
            ],
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

        const where = isCommercialRole(req.user?.UserRole)
            ? buildCommercialTiersWhere(req.user)
            : undefined;

        const tiers = await Tiers.findAll({
            where,
            order,
            include: [
                { model: TiersClasse, as: 'tiersClasse' },
                { model: TiersGouvernorat, as: 'region' },
                { model: TiersCategorie, as: 'tiersCategorieObj' }
            ]
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
        const tiers = await Tiers.findByPk(req.params.id, {
            include: [
                { model: TiersClasse, as: 'tiersClasse' },
                { model: TiersGouvernorat, as: 'region' },
                { model: TiersCategorie, as: 'tiersCategorieObj' }
            ]
        });
        if (!tiers) {
            return res.status(404).json({ status: 'error', message: 'Client non trouvé' });
        }

        if (isCommercialRole(req.user?.UserRole) && !isTierRelatedToCommercial(tiers, req.user)) {
            return res.status(403).json({
                status: 'error',
                message: 'Accès refusé à ce client'
            });
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
        await tiers.reload({
            include: [
                { model: TiersClasse, as: 'tiersClasse' },
                { model: TiersGouvernorat, as: 'region' }
            ],
            transaction: t
        });

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

        await tiers.reload({
            include: [
                { model: TiersClasse, as: 'tiersClasse' },
                { model: TiersGouvernorat, as: 'region' },
                { model: TiersCategorie, as: 'tiersCategorieObj' }
            ],
            transaction: t
        });
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


/**
 * Envoyer les identifiants (email + nouveau mot de passe) à tous les clients existants
 * Génère un nouveau mot de passe pour chaque client, met à jour le hash en base,
 * puis envoie un email avec les nouveaux identifiants.
 * Réservé aux administrateurs.
 */
exports.bulkSendCredentials = async (req, res, next) => {
    try {
        const { Op } = require('sequelize');

        // 1. Récupérer tous les tiers (clients) qui ont un email
        const allTiers = await Tiers.findAll({
            where: {
                Email: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] }
            },
            attributes: ['IDTiers', 'CodTiers', 'Raisoc', 'Email']
        });

        if (!allTiers || allTiers.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Aucun client avec email trouvé'
            });
        }

        let sent = 0;
        let skipped = 0;
        let failed = 0;
        const errors = [];

        for (const tiers of allTiers) {
            const email = normalizeString(tiers.Email);
            if (!email) continue;

            // Ignorer les emails trop longs pour le champ USER_NAME
            if (email.length > MAX_USER_LOGIN_LENGTH) {
                skipped++;
                errors.push({ email, error: `Email trop long (${email.length} > ${MAX_USER_LOGIN_LENGTH} car.)` });
                continue;
            }

            try {
                const clearPassword = generateRandomPassword();
                const hashedPassword = await bcrypt.hash(clearPassword, 10);

                // 2. Vérifier si un compte utilisateur existe déjà pour ce client
                let user = await User.findOne({ where: { EmailPro: email } });

                if (user) {
                    // Compte existant → mettre à jour le mot de passe
                    await user.update({ Password: hashedPassword, MustChangePassword: true });
                } else {
                    // Pas de compte → en créer un (comme dans createTiers)
                    const userFullName = (tiers.Raisoc || email).substring(0, MAX_USER_FULLNAME_LENGTH);
                    
                    // Validation supplémentaire pour éviter les troncatures
                    const validationErrors = validateUserFields(email, userFullName);
                    if (validationErrors.length > 0) {
                        skipped++;
                        errors.push({ email, error: validationErrors.join(', ') });
                        continue;
                    }
                    
                    const newUser = await User.create({
                        UserID: await allocateNextUserId(),
                        LoginName: email,
                        EmailPro: email,
                        FullName: userFullName,
                        Password: hashedPassword,
                        IsActive: true,
                        Enabled: true,
                        MustChangePassword: true
                    });
                    await upsertUserAccess(newUser.UserID, 'Client', { isActive: true });
                }

                // 3. Envoyer l'email avec les identifiants
                await sendClientCredentials(email, tiers.Raisoc || email, clearPassword);
                sent++;
            } catch (err) {
                console.error(`❌ Erreur envoi credentials pour ${email}:`, err.message);
                failed++;
                errors.push({ email, error: err.message });
            }
        }

        return res.status(200).json({
            status: 'success',
            message: `Envoi terminé: ${sent} envoyés, ${skipped} ignorés, ${failed} échecs`,
            data: { sent, skipped, failed, total: allTiers.length, errors: errors.slice(0, 20) }
        });
    } catch (error) {
        console.error('❌ Error bulkSendCredentials:', error);
        next(error);
    }
};
