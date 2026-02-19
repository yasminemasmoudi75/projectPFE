const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Tiers, User, sequelize } = require('../models');
const { sendClientCredentials } = require('../utils/emailService');
const { logAction } = require('../utils/logger');

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
            Adresse,
            Ville,
            Pays,
            DomaineActivite
        } = req.body;

        // 1. Validation de base
        if (!Raisoc || !Email) {
            await t.rollback();
            return res.status(400).json({
                status: 'error',
                message: 'La raison sociale (Raisoc) et l\'email sont obligatoires'
            });
        }

        // 2. Vérifier si l'email est déjà utilisé par un utilisateur
        console.time('Check-Email');
        const existingUser = await User.findOne({
            where: { EmailPro: Email },
            transaction: t
        });
        console.timeEnd('Check-Email');

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
            Raisoc,
            Email,
            CodTiers: CodTiers || `CLI-${Date.now()}`,
            Tel,
            Adresse,
            Ville,
            Pays,
            DomaineActivite,
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
            LoginName: Email, // On utilise l'email comme login par défaut
            EmailPro: Email,
            FullName: Raisoc,
            Password: hashedPassword,
            UserRole: 'Client',
            IsActive: true,
            Enabled: true,
            MustChangePassword: true
        }, { transaction: t });
        console.timeEnd('Create-User-DB');

        // 5. Envoyer l'email (on le fait après la transaction pour être sûr)
        console.time('Commit-Transaction');
        await t.commit();
        console.timeEnd('Commit-Transaction');
        console.log('Transaction committed');

        // L'envoi d'email ne bloque pas la réponse si succès DB
        // L'envoi d'email ne bloque pas la réponse si succès DB
        console.time('Send-Email');
        sendClientCredentials(Email, Raisoc, clearPassword).catch(err => console.error('Email send failed asynchronous:', err));
        console.timeEnd('Send-Email');

        // Audit Log
        console.time('Log-Action');
        await logAction(req.user.UserID, 'CREATE', 'Tiers', newTiers.CodTiers, `Nouveau client : ${Raisoc}`);
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
        const tiers = await Tiers.findAll({
            order: [['Raisoc', 'ASC']]
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
            Raisoc: req.body.Raisoc,
            Email: req.body.Email,
            Tel: req.body.Tel,
            Adresse: req.body.Adresse,
            Ville: req.body.Ville,
            Pays: req.body.Pays,
            DomaineActivite: req.body.DomaineActivite,
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
