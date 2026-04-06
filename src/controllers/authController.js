const bcrypt = require('bcryptjs');
const { User, sequelize } = require('../models');
const { signToken, signRefreshToken, verifyToken } = require('../utils/jwtUtils');
const { logAction } = require('../utils/logger');
const { allocateNextUserId, ensureUserHasUserId } = require('../utils/userId');
const { attachAccessToUser, resolveUserAccess, upsertUserAccess } = require('../utils/userAccess');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Lax',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

const CLEAR_REFRESH_COOKIE_OPTIONS = {
  httpOnly: REFRESH_COOKIE_OPTIONS.httpOnly,
  secure: REFRESH_COOKIE_OPTIONS.secure,
  sameSite: REFRESH_COOKIE_OPTIONS.sameSite
};

const isBcryptHash = (value) => typeof value === 'string' && /^\$2[aby]\$/.test(value);

/**
 * Inscription d'un nouvel utilisateur
 */
exports.register = async (req, res, next) => {
  let transaction;

  try {
    const {
      LoginName,
      Password,
      FullName,
      EmailPro,
      UserRole,
      TelPro,
      Poste,
      Departement,
      DateNaissance
    } = req.body || {};
    const selectedRole = UserRole || 'User';

    // 1. Validation de base
    const missingFields = [];
    if (!LoginName) missingFields.push('LoginName');
    if (!Password) missingFields.push('Password');
    if (!FullName) missingFields.push('FullName');
    if (!EmailPro) missingFields.push('EmailPro');

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Champs obligatoires manquants : ${missingFields.join(', ')}`
      });
    }

    // Validation de la complexité du mot de passe
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(Password)) {
      return res.status(400).json({
        status: 'error',
        message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.'
      });
    }

    transaction = await sequelize.transaction();

    // 2. Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      where: { EmailPro },
      transaction
    });

    if (existingUser) {
      await transaction.rollback();
      transaction = null;
      return res.status(400).json({
        status: 'error',
        message: 'Cet identifiant est déjà utilisé'
      });
    }

    // 3. Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(Password, 10);
    const nextUserId = await allocateNextUserId({ transaction });

    // 4. Créer l'utilisateur
    const newUser = await User.create({
      UserID: nextUserId,
      LoginName,
      Password: hashedPassword,
      FullName,
      EmailPro,
      TelPro,
      PosteOccupe: Poste,
      Departement,
      DateNaissance: DateNaissance || null, // Gestion explicite du null
      IsActive: true,
      Enabled: true
    }, { transaction });

    await upsertUserAccess(newUser.UserID, selectedRole, { transaction, isActive: true });
    await attachAccessToUser(newUser, { transaction });

    // 5. Générer les tokens
    const token = signToken({ id: newUser.UserID, role: newUser.UserRole });
    const refreshToken = signRefreshToken({ id: newUser.UserID });

    await transaction.commit();
    transaction = null;

    // 6. Envoyer le refresh token dans un cookie sécurisé.
    // RefreshToken est virtuel dans le modèle User et n'est pas persisté en base.
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(201).json({
      status: 'success',
      message: 'Utilisateur créé avec succès',
      data: {
        token,
        // refreshToken (Envoyé uniquement via cookie HttpOnly)
        user: {
          UserID: newUser.UserID,
          LoginName: newUser.LoginName,
          FullName: newUser.FullName,
          UserRole: newUser.UserRole,
          Gouvernorat: newUser.Gouvernorat
        }
      }
    });

    // Log Register
    await logAction(newUser.UserID, 'REGISTER', 'User', newUser.UserID, 'Inscription nouvel utilisateur');
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    next(error);
  }
};

/**
 * Connexion d'un utilisateur
 */
exports.login = async (req, res, next) => {
  let transaction;

  try {
    const { EmailPro, Password } = req.body || {};

    // 1. Vérifier si les champs sont fournis
    if (!EmailPro || !Password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email (EmailPro) et mot de passe (Password) sont requis'
      });
    }

    transaction = await sequelize.transaction();

    // 2. Trouver l'utilisateur par Email
    const user = await User.findOne({
      where: { EmailPro },
      transaction
    });

    if (!user) {
      await transaction.rollback();
      transaction = null;
      return res.status(401).json({
        status: 'error',
        message: 'Identifiant ou mot de passe incorrect'
      });
    }

    // 3. Vérifier le mot de passe et si l'utilisateur est actif
    const isBcryptMatch = isBcryptHash(user.Password)
      ? await bcrypt.compare(Password, user.Password)
      : false;
    const isPlainMatch = Password === user.Password; // Liaison ERP

    if (!isBcryptMatch && !isPlainMatch) {
      await transaction.rollback();
      transaction = null;
      return res.status(401).json({
        status: 'error',
        message: 'Identifiant ou mot de passe incorrect'
      });
    }

    if (!user.IsActive || !user.Enabled) {
      await transaction.rollback();
      transaction = null;
      return res.status(403).json({
        status: 'error',
        message: 'Votre compte est désactivé'
      });
    }

    await ensureUserHasUserId(User, user, { transaction });
    const loginAccess = await resolveUserAccess(user.UserID, user.UserRole, { transaction });
    user.setDataValue('UserRole', loginAccess.role);

    console.log('✅ LOGIN USER OBJECT:', {
      UserID: user.UserID,
      Gouvernorat: user.Gouvernorat,
      TelPro: user.TelPro,
      AllFields: user.toJSON()
    });

    // 4. Générer les tokens
    const token = signToken({ id: user.UserID, role: user.UserRole });
    const refreshToken = signRefreshToken({ id: user.UserID });

    await transaction.commit();
    transaction = null;

    // 5. Envoyer le refresh token dans un cookie sécurisé.
    // Le refresh fonctionne ici en mode stateless, car RefreshToken n'est pas persisté.
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(200).json({
      status: 'success',
      message: 'Connexion réussie',
      data: {
        token,
        // refreshToken (Envoyé uniquement via cookie HttpOnly)
        user: {
          UserID: user.UserID,
          LoginName: user.LoginName,
          FullName: user.FullName,
          EmailPro: user.EmailPro,
          UserRole: user.UserRole,
          TelPro: user.TelPro,
          PosteOccupe: user.PosteOccupe,
          Departement: user.Departement,
          Gouvernorat: user.Gouvernorat,
          PhotoProfil: user.PhotoProfil,
          MustChangePassword: user.MustChangePassword
        }
      }
    });

    // Log Login
    await logAction(user.UserID, 'LOGIN', 'User', user.UserID, 'Connexion réussie');
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    next(error);
  }
};

/**
 * Rafraîchir le token d'accès
 */
exports.refreshToken = async (req, res, next) => {
  try {
    // On cherche d'abord dans les cookies, puis dans le body
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        status: 'error',
        message: 'Refresh token est requis'
      });
    }

    // 1. Vérifier le token
    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch (err) {
      return res.status(401).json({
        status: 'error',
        message: 'Refresh token invalide ou expiré'
      });
    }

    // 2. Trouver l'utilisateur.
    // RefreshToken n'étant pas stocké en base, on valide uniquement le JWT reçu.
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Refresh token invalide'
      });
    }

    if (!user.IsActive || !user.Enabled) {
      return res.status(403).json({
        status: 'error',
        message: 'Votre compte est désactivé'
      });
    }

    const refreshAccess = await resolveUserAccess(user.UserID, user.UserRole);
    user.setDataValue('UserRole', refreshAccess.role);

    // 3. Générer un nouveau token d'accès
    const newToken = signToken({ id: user.UserID, role: user.UserRole });

    res.status(200).json({
      status: 'success',
      data: {
        token: newToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Déconnexion
 */
exports.logout = async (req, res, next) => {
  try {
    const { UserID } = req.user || req.body || {};

    // Supprimer le cookie
    res.clearCookie('refreshToken', CLEAR_REFRESH_COOKIE_OPTIONS);

    res.status(200).json({
      status: 'success',
      message: 'Déconnexion réussie'
    });

    // Log Logout
    if (UserID) {
      await logAction(UserID, 'LOGOUT', 'User', UserID, 'Déconnexion réussie');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour le profil utilisateur
 */
exports.updateProfile = async (req, res, next) => {
  const t = await require('../config/database').sequelize.transaction();
  const fs = require('fs');
  const path = require('path');

  try {
    const { FullName, EmailPro, TelPro } = req.body;
    const userId = req.user.UserID;

    // 1. Trouver l'utilisateur
    const user = await User.findByPk(userId, { transaction: t });

    if (!user) {
      await t.rollback();
      return res.status(404).json({ status: 'error', message: 'Utilisateur non trouvé' });
    }

    // 2. Vérifier si l'email est changé et s'il est déjà pris
    if (EmailPro && EmailPro !== user.EmailPro) {
      const existingUser = await User.findOne({
        where: { EmailPro },
        transaction: t
      });

      if (existingUser) {
        await t.rollback();
        return res.status(400).json({ status: 'error', message: 'Cet email est déjà utilisé' });
      }
    }

    // 3. Handle profile picture upload
    let photoPath = user.PhotoProfil;
    console.log('🔍 [DEBUG] req.file:', req.file);
    console.log('🔍 [DEBUG] Current PhotoProfil:', user.PhotoProfil);

    if (req.file) {
      console.log('📸 [DEBUG] File received:', req.file.filename);
      // Delete old profile picture if exists
      if (user.PhotoProfil) {
        const oldPhotoPath = path.join(__dirname, '../../', user.PhotoProfil);
        console.log('🗑️ [DEBUG] Attempting to delete old photo:', oldPhotoPath);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
          console.log('✅ [DEBUG] Old photo deleted');
        }
      }
      // Set new photo path (relative to server root)
      photoPath = `/uploads/profiles/${req.file.filename}`;
      console.log('💾 [DEBUG] New photo path:', photoPath);
    }

    // 4. Mettre à jour l'utilisateur
    console.log('🔄 [DEBUG] Updating user with photoPath:', photoPath);
    await user.update({
      FullName: FullName || user.FullName,
      EmailPro: EmailPro || user.EmailPro,
      TelPro: TelPro || user.TelPro,
      PhotoProfil: photoPath
    }, { transaction: t });

    // 5. Si l'utilisateur est un client, mettre à jour aussi la table Tiers
    if (user.UserRole === 'Client') {
      const { Tiers } = require('../models');
      const tierToUpdate = await Tiers.findOne({
        where: { Email: req.user.EmailPro }, // Using old email from token
        transaction: t
      });

      if (tierToUpdate) {
        await tierToUpdate.update({
          Raisoc: FullName || tierToUpdate.Raisoc,
          Email: EmailPro || tierToUpdate.Email,
          Tel: TelPro || tierToUpdate.Tel
        }, { transaction: t });
      }
    }

    await t.commit();

    // Log Action
    await logAction(userId, 'UPDATE_PROFILE', 'User', userId, 'Mise à jour du profil');

    res.status(200).json({
      status: 'success',
      message: 'Profil mis à jour avec succès',
      data: {
        user: {
          UserID: user.UserID,
          LoginName: user.LoginName,
          FullName: user.FullName,
          EmailPro: user.EmailPro,
          UserRole: user.UserRole,
          TelPro: user.TelPro,
          PosteOccupe: user.PosteOccupe,
          Departement: user.Departement,
          PhotoProfil: user.PhotoProfil
        }
      }
    });

  } catch (error) {
    if (t) await t.rollback();
    next(error);
  }
};

/**
 * Changer le mot de passe
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.UserID;

    // 1. Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ status: 'error', message: 'Tous les champs sont requis' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ status: 'error', message: 'Les nouveaux mots de passe ne correspondent pas' });
    }

    // Validation complexité
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        status: 'error',
        message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.'
      });
    }

    // 2. Vérifier l'ancien mot de passe
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Utilisateur non trouvé' });
    }

    const isBcryptMatch = isBcryptHash(user.Password)
      ? await bcrypt.compare(currentPassword, user.Password)
      : false;
    const isPlainMatch = currentPassword === user.Password;

    if (!isBcryptMatch && !isPlainMatch) {
      return res.status(401).json({ status: 'error', message: 'Le mot de passe actuel est incorrect' });
    }

    // 3. Hasher et sauvegarder
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({
      Password: hashedPassword,
      MustChangePassword: false // On considère qu'il a changé son mot de passe initial
    });

    // Log Action
    await logAction(userId, 'CHANGE_PASSWORD', 'User', userId, 'Changement de mot de passe');

    res.status(200).json({
      status: 'success',
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer le profil de l'utilisateur connecté
 */
exports.getMe = async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: {
        UserID: req.user.UserID,
        LoginName: req.user.LoginName,
        FullName: req.user.FullName,
        EmailPro: req.user.EmailPro,
        UserRole: req.user.UserRole,
        TelPro: req.user.TelPro,
        PosteOccupe: req.user.PosteOccupe,
        Departement: req.user.Departement,
        Gouvernorat: req.user.Gouvernorat,
        PhotoProfil: req.user.PhotoProfil,
        MustChangePassword: req.user.MustChangePassword
      }
    }
  });
};
