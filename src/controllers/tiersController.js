const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Tiers, User, sequelize } = require('../models');
const { sendClientCredentials } = require('../utils/emailService');
const { logAction } = require('../utils/logger');
const { allocateNextUserId } = require('../utils/userId');
const { attachAccessToUser, upsertUserAccess } = require('../utils/userAccess');

const DEFAULT_TIERS_NIVEAU = 0;
const MAX_COD_TIERS_LENGTH = 20;
const MAX_USER_LOGIN_LENGTH = 30;
const MAX_USER_FULLNAME_LENGTH = 40;

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : value);

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
        const {
            Raisoc,
            Email,
            CodTiers,
            Tel,
            Fax,
            Adresse,
            Ville,
            Pays,
            Cin,
            CodePostal,
            MatriculeFiscale,
            Commercial
        } = req.body;

        const normalizedRaisoc = normalizeString(Raisoc);
        const normalizedEmail = normalizeString(Email);
        const niveau = resolveTiersNiveau(req.body);
        const resolvedCodTiers = resolveCodTiers(CodTiers);
        const userFullName = resolveUserFullName(normalizedRaisoc);

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
            Niveau: niveau,
            Raisoc: normalizedRaisoc,
            Email: normalizedEmail,
            CodTiers: resolvedCodTiers,
            Tel,
            Fax,
            Adresse,
            Ville,
            Pays,
            Cin,
            Cp: CodePostal,
            CodTva: MatriculeFiscale,
            codRepresTiers: Commercial,
            Actif: true,
            UserCreate: req.user.LoginName
        }, { transaction: t });
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
        res.status(200).json({ status: 'success', data: tiers });
    } catch (error) {
        next(error);
    }
};

/**
 * Mettre à jour un client
 */
exports.updateTiers = async (req, res, next) => {
    try {
        const tiers = await Tiers.findByPk(req.params.id);
        if (!tiers) {
            return res.status(404).json({ status: 'error', message: 'Client non trouvé' });
        }

        // Protection contre le "Mass Assignment"
        // On ne met à jour QUE les champs autorisés
        const allowedUpdates = {
            Niveau: req.body.Niveau,
            Raisoc: req.body.Raisoc,
            Email: req.body.Email,
            Tel: req.body.Tel,
            Fax: req.body.Fax,
            Adresse: req.body.Adresse,
            Ville: req.body.Ville,
            Pays: req.body.Pays,
            Cin: req.body.Cin,
            Cp: req.body.CodePostal,
            CodTva: req.body.MatriculeFiscale,
            codRepresTiers: req.body.Commercial,
            // Ne jamais inclure CodTiers ou UserCreate ici
        };

        // Filtrer les valeurs undefined (pour ne pas écraser avec null)
        Object.keys(allowedUpdates).forEach(key => allowedUpdates[key] === undefined && delete allowedUpdates[key]);

        await tiers.update(allowedUpdates);

        res.status(200).json({
            status: 'success',
            message: 'Client mis à jour avec succès',
            data: tiers
        });

        // Audit Log
        await logAction(req.user.UserID, 'UPDATE', 'Tiers', tiers.CodTiers, `Mise à jour client : ${Object.keys(allowedUpdates).join(', ')}`);
    } catch (error) {
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
