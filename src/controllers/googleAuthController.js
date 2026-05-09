const { User, sequelize } = require('../models');
const { signToken, signRefreshToken } = require('../utils/jwtUtils');
const { logAction } = require('../utils/logger');
const { allocateNextUserId, ensureUserHasUserId } = require('../utils/userId');
const { resolveUserAccess, upsertUserAccess } = require('../utils/userAccess');
const { getGoogleLoginUrl, getGoogleProfile } = require('../services/googleAuthService');
const { notifyAdmins } = require('../utils/notificationUtils');
const crypto = require('crypto');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Lax',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

/**
 * Générer un LoginName unique à partir du nom complet (réutilisé d'authController)
 */
const generateUniqueLoginName = async (fullName, transaction) => {
  if (!fullName) return null;
  const cleanName = fullName.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '.');
  let loginName = cleanName;
  let counter = 1;
  let exists = true;
  while (exists) {
    const user = await User.findOne({ where: { EmailPro: loginName }, transaction });
    if (!user) exists = false;
    else loginName = `${cleanName}${counter++}`;
  }
  return loginName;
};

/**
 * ÉTAPE 1: Initier la connexion Google
 */
exports.initiateGoogleAuth = (req, res) => {
  try {
    const authUrl = getGoogleLoginUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('❌ Erreur initiation Google Auth:', error.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors de l\'initiation Google Auth' });
  }
};

/**
 * ÉTAPE 2: Callback Google
 */
exports.googleCallback = async (req, res) => {
  const { code } = req.query;
  let transaction;

  try {
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/login?error=no_code`);
    }

    // 1. Récupérer le profil Google
    const profile = await getGoogleProfile(code);
    const { email, name, picture } = profile;

    transaction = await sequelize.transaction();

    // 2. Chercher si l'utilisateur existe déjà
    let user = await User.findOne({
      where: { EmailPro: email },
      transaction
    });

    let isNewUser = false;

    if (!user) {
      // CRÉER UN NOUVEL UTILISATEUR
      isNewUser = true;
      const nextId = await allocateNextUserId();
      const loginName = await generateUniqueLoginName(name, transaction);
      
      // Mot de passe aléatoire car OAuth
      const randomPassword = crypto.randomBytes(16).toString('hex');

      user = await User.create({
        UserID: nextId,
        EmailPro: email, // USER_NAME
        FullName: name, // REAL_NAME
        Password: randomPassword,
        LoginName: loginName,
        IsActive: false,
        Enabled: false
      }, { transaction });

      // Synchroniser avec UCS_USERINFO (Rôle NULL, Inactif)
      await upsertUserAccess(user.UserID, null, { transaction, isActive: false });

      await logAction(user.UserID, 'REGISTER_GOOGLE', 'User', user.UserID, `Nouvelle inscription Google: ${email}`, { transaction });
      
      // NOTIFIER LES ADMINS
      await notifyAdmins(
        'Nouvel utilisateur (Google)',
        `Un nouvel utilisateur s'est inscrit via Google : ${name} (${email}). Le compte est actuellement INACTIF et nécessite une validation.`
      );
    }

    // 3. Résoudre l'accès (Rôle et Statut Actif)
    const loginAccess = await resolveUserAccess(user.UserID, user.UserRole, { transaction });
    user.setDataValue('UserRole', loginAccess.role);
    user.setDataValue('IsActive', loginAccess.isActive);

    await transaction.commit();
    transaction = null;

    // 4. Gérer le blocage si inactif
    if (!loginAccess.isActive || !user.UserRole) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/auth/login?status=pending`);
    }

    // 5. Générer les tokens si actif
    const token = signToken({ id: user.UserID, role: user.UserRole });
    const refreshToken = signRefreshToken({ id: user.UserID });

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    
    // Rediriger vers le dashboard avec le token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('❌ Erreur Google Callback:', error.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/login?error=${encodeURIComponent(error.message)}`);
  }
};
