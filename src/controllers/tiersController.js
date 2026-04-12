const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op, QueryTypes, TableHints } = require('sequelize');

const { Tiers, TiersContact, TiersAdr, User, TiersClasse, TiersGouvernorat, TiersCategorie, sequelize } = require('../models');
const { sendClientCredentials } = require('../utils/emailService');
const { logAction } = require('../utils/logger');
const { allocateNextUserId } = require('../utils/userId');
const { attachAccessToUser, upsertUserAccess, resolveUserAccess } = require('../utils/userAccess');

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

const normalizePhoneValue = (value) => {
    if (value === null || value === undefined) return null;
    const digits = String(value).trim().replace(/\D/g, '');
    return digits || null;
};

const normalizeComparablePhone = (value) => {
    const digits = normalizePhoneValue(value);
    if (!digits) return null;
    return digits.length > 8 ? digits.slice(-8) : digits;
};

const normalizeEmailValue = (value) => {
    const normalized = normalizeString(value);
    return normalized ? normalized.toLowerCase() : null;
};

const findTiersByPhone = async ({ phone, excludeTiersId = null, transaction = null } = {}) => {
    const comparablePhone = normalizeComparablePhone(phone);
    if (!comparablePhone) return null;

    const replacements = { phone: comparablePhone };
    const excludeClause = excludeTiersId ? ' AND IDTiers <> :excludeTiersId' : '';
    if (excludeTiersId) {
        replacements.excludeTiersId = excludeTiersId;
    }

    const rows = await sequelize.query(`
        SELECT TOP 1 IDTiers, CodTiers, Tel
        FROM TabTiers
        CROSS APPLY (
            SELECT REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(Tel, ''), ' ', ''), '-', ''), '(', ''), ')', ''), '.', ''), '/', ''), '+', '') AS normalizedTel
        ) AS phoneNorm
        WHERE RIGHT(phoneNorm.normalizedTel, 8) = :phone
        ${excludeClause}
    `, {
        replacements,
        type: QueryTypes.SELECT,
        transaction
    });

    return rows[0] || null;
};

const findTiersByEmail = async ({ email, excludeTiersId = null, transaction = null } = {}) => {
    const normalizedEmail = normalizeEmailValue(email);
    if (!normalizedEmail) return null;

    const replacements = { email: normalizedEmail };
    const excludeClause = excludeTiersId ? ' AND IDTiers <> :excludeTiersId' : '';
    if (excludeTiersId) {
        replacements.excludeTiersId = excludeTiersId;
    }

    const rows = await sequelize.query(`
        SELECT TOP 1 IDTiers, CodTiers, Email
        FROM TabTiers
        WHERE LOWER(LTRIM(RTRIM(COALESCE(Email, '')))) = :email
        ${excludeClause}
    `, {
        replacements,
        type: QueryTypes.SELECT,
        transaction
    });

    return rows[0] || null;
};

const isCommercialRole = (role) => {
    const normalized = String(role || '').trim().toLowerCase();
    return normalized === 'commercial' || normalized === 'commerciale';
};

const isAdminRole = (role) => {
    const normalized = String(role || '').trim().toLowerCase();
    return normalized === 'admin' || normalized === 'administrateur';
};

const hasWhereConditions = (whereObj) => {
    if (!whereObj) return false;
    if (Object.keys(whereObj).length > 0) return true;
    if (Object.getOwnPropertySymbols(whereObj).length > 0) return true;
    return false;
};

const resolveAutoCodRepresTiers = (payload = {}, user = {}, effectiveRole = null) => {
    const explicitRepresentative = normalizeString(payload.Commercial ?? payload.codRepresTiers);
    const creatorRepresRaw = user?.UserID ?? user?.id ?? user?.CodRepres ?? user?.codRepres;
    const creatorRepres = creatorRepresRaw == null ? null : String(creatorRepresRaw).trim();
    const role = effectiveRole || user?.UserRole;

    // Commercial creator should always be attached to their own representative id.
    if (isCommercialRole(role)) {
        return creatorRepres || explicitRepresentative || null;
    }

    // Admin creator keeps explicit representative if provided; fallback to creator id.
    if (isAdminRole(role)) {
        return explicitRepresentative || creatorRepres || null;
    }

    return explicitRepresentative || null;
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
        mapped.SaveDate = sequelize.literal('GETDATE()');
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
                contacts.map((item) => ({
                    IDTiers: tierId,
                    Responsable: item.Responsable,
                    Tel: item.Tel
                })),
                { transaction, fields: ['IDTiers', 'Responsable', 'Tel'] }
            );
        }
    }

    if (Array.isArray(addresses)) {
        await TiersAdr.destroy({ where: { IDTiers: tierId }, transaction });
        if (addresses.length > 0) {
            await TiersAdr.bulkCreate(
                addresses.map((item) => ({
                    IDTiers: tierId,
                    Adresse: item.Adresse
                })),
                { transaction, fields: ['IDTiers', 'Adresse'] }
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
        const creatorUserId = req.user?.UserID || req.user?.id || null;
        const creatorAccess = await resolveUserAccess(creatorUserId, req.user?.UserRole, { transaction: t });
        const creatorRole = creatorAccess?.normalizedRole || req.user?.UserRole || '';

        const tiersPayload = mapTiersPayload(req.body, {
            forCreate: true,
            createdBy: req.user.LoginName
        });
        tiersPayload.codRepresTiers = resolveAutoCodRepresTiers(req.body, req.user, creatorRole);
        const normalizedRaisoc = normalizeString(tiersPayload.Raisoc);
        const normalizedEmail = normalizeEmailValue(tiersPayload.Email);
        const normalizedTel = normalizeComparablePhone(tiersPayload.Tel);
        const requestedCodTiers = normalizeString(req.body.CodTiers);
        let resolvedCodTiers = resolveCodTiers(requestedCodTiers);
        const gouvernoratId = normalizeNullableInt(req.body.gouvernorat ?? tiersPayload.gouvernorat);
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

        if (!Number.isInteger(gouvernoratId)) {
            await t.rollback();
            return res.status(400).json({
                status: 'error',
                message: 'Le gouvernorat est obligatoire',
                errors: [{ field: 'gouvernorat', message: 'Gouvernorat obligatoire' }]
            });
        }

        const existingTierEmail = await findTiersByEmail({ email: normalizedEmail, transaction: t });
        if (existingTierEmail) {
            await t.rollback();
            return res.status(400).json({
                status: 'error',
                message: 'Cet email est déjà utilisé par un autre client',
                errors: [{ field: 'Email', message: 'Email déjà utilisé' }]
            });
        }

        if (normalizedTel) {
            const existingPhone = await findTiersByPhone({ phone: normalizedTel, transaction: t });
            if (existingPhone) {
                await t.rollback();
                return res.status(400).json({
                    status: 'error',
                    message: 'Ce numéro de téléphone est déjà utilisé par un autre client',
                    errors: [{ field: 'Tel', message: 'Numéro de téléphone déjà utilisé' }]
                });
            }
        }

        const gouvernoratExists = await TiersGouvernorat.findByPk(gouvernoratId, { transaction: t });
        if (!gouvernoratExists) {
            await t.rollback();
            return res.status(400).json({
                status: 'error',
                message: 'Gouvernorat invalide',
                errors: [{ field: 'gouvernorat', message: 'Gouvernorat introuvable' }]
            });
        }

        tiersPayload.gouvernorat = gouvernoratId;

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

        if (!requestedCodTiers) {
            // Retry auto-generation a few times to avoid random collisions.
            let attempts = 0;
            let found = null;
            do {
                resolvedCodTiers = resolveCodTiers(null);
                found = await Tiers.findOne({
                    where: { CodTiers: resolvedCodTiers },
                    transaction: t
                });
                attempts += 1;
            } while (found && attempts < 6);

            if (found) {
                await t.rollback();
                return res.status(400).json({
                    status: 'error',
                    message: 'Impossible de générer un code client unique. Réessayez.',
                    errors: [{ field: 'CodTiers', message: 'Code client auto en conflit' }]
                });
            }
        } else {
            const existingTiers = await Tiers.findOne({
                where: { CodTiers: resolvedCodTiers },
                transaction: t
            });

            if (existingTiers) {
                await t.rollback();
                return res.status(400).json({
                    status: 'error',
                    message: 'Le code client (CodTiers) existe déjà',
                    errors: [{ field: 'CodTiers', message: 'Code client déjà utilisé' }]
                });
            }
        }

        if (existingUser) {
            await t.rollback();
            return res.status(400).json({
                status: 'error',
                message: 'Cet email est déjà associé à un utilisateur existant',
                errors: [{ field: 'Email', message: 'Email déjà utilisé' }]
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
        const filterHelper = require('../utils/filterHelper');

        // Module 11 = Tiers/Clients (Table-driven filters from TabRoleFilterVisibility)
        const { where, limit, offset, page } = await filterHelper.applyTableDrivenFiltersWithPagination(
            '11',
            req.query,
            req.user
        );

        let finalWhere = where;
        if (isCommercialRole(req.user?.UserRole)) {
            const commercialScope = buildCommercialTiersWhere(req.user);
            finalWhere = hasWhereConditions(where)
                ? { [Op.and]: [where, commercialScope] }
                : commercialScope;
        }

        const { count, rows } = await Tiers.findAndCountAll({
            where: finalWhere,
            order: [['Raisoc', 'ASC']],
            limit,
            offset,
            tableHint: TableHints.NOLOCK
        });




        res.status(200).json(
            filterHelper.formatPaginatedResponse(rows, count, page, limit)
        );

    } catch (error) {
        next(error);
    }
};

/**
 * Récupérer un client par ID
 */
exports.getTiersById = async (req, res, next) => {
    try {
        const tiers = await Tiers.findOne({
            where: {
                [Op.or]: [
                    { IDTiers: req.params.id },
                    { CodTiers: req.params.id }
                ]
            },
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

exports.checkTierEmailUnique = async (req, res, next) => {
    try {
        const email = normalizeEmailValue(req.query?.email);
        const excludeId = normalizeString(req.query?.excludeId);

        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'Email manquant'
            });
        }

        const existingTier = await findTiersByEmail({ email, excludeTiersId: excludeId || null });
        if (existingTier) {
            return res.status(200).json({
                status: 'success',
                unique: false,
                message: 'Cet email est déjà utilisé par un autre client'
            });
        }

        return res.status(200).json({
            status: 'success',
            unique: true,
            message: 'Email disponible'
        });
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
        const updatedPhone = normalizeComparablePhone(allowedUpdates.Tel);
        Object.keys(allowedUpdates).forEach((key) => {
            if (allowedUpdates[key] === undefined) {
                delete allowedUpdates[key];
            }
        });

        if (updatedPhone) {
            const duplicatePhone = await findTiersByPhone({
                phone: updatedPhone,
                excludeTiersId: tiers.IDTiers,
                transaction: t
            });

            if (duplicatePhone) {
                await t.rollback();
                return res.status(400).json({
                    status: 'error',
                    message: 'Ce numéro de téléphone est déjà utilisé par un autre client',
                    errors: [{ field: 'Tel', message: 'Numéro de téléphone déjà utilisé' }]
                });
            }
        }

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
 * Récupérer la liste des commerciaux disponibles pour l'utilisateur
 * (Utilisé par les agents pour affecter un commercial à un client)
 */
exports.getAvailableCommercials = async (req, res, next) => {
    try {
        const { QueryTypes } = require('sequelize');
        const userRegion = req.user?.Gouvernorat ?? null;
        const normalizedRole = String(req.user?.UserRole || '').trim().toLowerCase();
        const includeAll = req.query?.includeAll === 'true' || req.query?.includeAll === '1';

        console.log(`🔍 Fetching available commercials for ${req.user?.LoginName} (Role: ${normalizedRole}, Region: ${userRegion}, IncludeAll: ${includeAll})`);

        let query = `
            SELECT 
                u.USER_ID as id,
                u.USER_NAME as email,
                u.REAL_NAME as fullName,
                u.Gouvernorat,
                u.GUID as guid,
                p.PROF_DESCRIPTION as role
            FROM UCS_USERS u
            INNER JOIN UCS_USERINFO ui ON ui.USER_ID = u.USER_ID AND ui.APP_ID = 1
            INNER JOIN UCS_PROFILES p ON p.PROF_ID = ui.PROF_ID
            WHERE LOWER(p.PROF_DESCRIPTION) IN ('commercial', 'commerciale')
        `;

        const replacements = {};

        // Si includeAll est spécifié, retourner TOUS les commerciaux
        // Sinon si l'utilisateur est un Agent avec une région, restreindre à sa région
        if (!includeAll && normalizedRole === 'agent' && userRegion) {
            query += `
                AND EXISTS (
                    SELECT 1
                    FROM tiersGouvernorat tgReq
                    INNER JOIN tiersGouvernorat tgUser ON tgUser.id = tgReq.id
                    WHERE (
                        tgReq.id = TRY_CONVERT(INT, :userRegion)
                        OR LOWER(LTRIM(RTRIM(tgReq.libelle))) = LOWER(LTRIM(RTRIM(CONVERT(NVARCHAR(100), :userRegion))))
                    )
                    AND (
                        tgUser.id = TRY_CONVERT(INT, u.Gouvernorat)
                        OR LOWER(LTRIM(RTRIM(tgUser.libelle))) = LOWER(LTRIM(RTRIM(CONVERT(NVARCHAR(100), u.Gouvernorat))))
                    )
                )
            `;
            replacements.userRegion = String(userRegion);
        }

        const commercials = await sequelize.query(query, {
            replacements,
            type: QueryTypes.SELECT
        });

        res.status(200).json({
            status: 'success',
            count: commercials.length,
            data: commercials
        });
    } catch (error) {
        console.error('Erreur getAvailableCommercials:', error);
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
