const bcrypt = require('bcryptjs');
const { User, sequelize } = require('../models');
const { sanitizeDate } = require('../utils/helpers');
const { allocateNextUserId } = require('../utils/userId');
const { attachAccessToUser, attachAccessToUsers, resolveUserAccess, upsertUserAccess } = require('../utils/userAccess');

/**
 * Créer un utilisateur
 * Gère la sécurité (hashing) et les contraintes SQL Server
 */
exports.createUser = async (req, res, next) => {
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
      Gouvernorat,
      IsActive,
      DateNaissance
    } = req.body;
    const selectedRole = UserRole || 'User';
    const selectedIsActive = IsActive !== undefined ? IsActive : true;

    // 1. Validation des champs obligatoires
    if (!LoginName || !Password || !FullName || !EmailPro) {
      return res.status(400).json({
        status: 'error',
        message: 'LoginName, Password, FullName et EmailPro sont obligatoires'
      });
    }

    transaction = await sequelize.transaction();

    // 2. Vérifier l'unicité du LoginName
    const existingUser = await User.findOne({
      where: { EmailPro },
      transaction
    });

    if (existingUser) {
      await transaction.rollback();
      transaction = null;
      return res.status(400).json({
        status: 'error',
        message: 'Un utilisateur avec ce LoginName existe déjà'
      });
    }

    // 3. Sécurité : Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(Password, 10);
    const nextUserId = await allocateNextUserId({ transaction });

    // 4. Création dans la base de données
    // NOTE : On ne passe pas CreatedDate ici pour éviter l'erreur de conversion de date MSSQL
    const newUser = await User.create({
      UserID: nextUserId,
      LoginName,
      Password: hashedPassword,
      FullName,
      EmailPro,
      TelPro,
      PosteOccupe: Poste,
      Departement,
      Gouvernorat,
      DateNaissance: sanitizeDate(DateNaissance)
    }, { transaction });

    await upsertUserAccess(newUser.UserID, selectedRole, {
      transaction,
      isActive: selectedIsActive
    });

    await attachAccessToUser(newUser, { transaction });

    await transaction.commit();
    transaction = null;

    // 5. Préparer la réponse (Exclure les données sensibles)
    const userResponse = {
      UserID: newUser.UserID,
      LoginName: newUser.LoginName,
      FullName: newUser.FullName,
      EmailPro: newUser.EmailPro,
      UserRole: newUser.UserRole,
      TelPro: newUser.TelPro,
      PosteOccupe: newUser.PosteOccupe,
      Departement: newUser.Departement,
      Gouvernorat: newUser.Gouvernorat,
      IsActive: newUser.IsActive
    };

    res.status(201).json({
      status: 'success',
      message: 'Utilisateur créé avec succès',
      data: userResponse
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    // Transmet l'erreur au middleware errorHandler
    next(error);
  }
};

/**
 * Récupérer tous les utilisateurs
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['Password', 'RefreshToken'] },
      order: [['UserID', 'DESC']]
    });

    await attachAccessToUsers(users);

    res.status(200).json({
      status: 'success',
      message: 'Liste des utilisateurs récupérée avec succès',
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer un utilisateur par son ID (PK)
 */
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['Password', 'RefreshToken'] }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    }

    await attachAccessToUser(user);

    res.status(200).json({
      status: 'success',
      message: 'Utilisateur récupéré avec succès',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour les informations d'un utilisateur
 */
exports.updateUser = async (req, res, next) => {
  let transaction;

  try {
    const { id } = req.params;
    const {
      FullName,
      EmailPro,
      UserRole,
      TelPro,
      Poste,
      Departement,
      Gouvernorat,
      IsActive,
      Password
    } = req.body;

    transaction = await sequelize.transaction();

    const user = await User.findByPk(id, { transaction });

    if (!user) {
      await transaction.rollback();
      transaction = null;
      return res.status(404).json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    }

    const currentAccess = await resolveUserAccess(user.UserID, user.UserRole, { transaction });
    const targetRole = UserRole || currentAccess.role;
    const targetIsActive = IsActive !== undefined ? IsActive : currentAccess.isActive;

    // Construction dynamique de l'objet de mise à jour
    const updateData = {};
    if (FullName) updateData.FullName = FullName;
    if (EmailPro) updateData.EmailPro = EmailPro;
    if (TelPro) updateData.TelPro = TelPro;
    if (Poste) updateData.PosteOccupe = Poste;
    if (Departement) updateData.Departement = Departement;
    if (Gouvernorat) updateData.Gouvernorat = Gouvernorat;

    // Si le mot de passe est modifié, on le re-hashe
    if (Password) {
      updateData.Password = await bcrypt.hash(Password, 10);
    }

    await user.update(updateData, { transaction });

    await upsertUserAccess(user.UserID, targetRole, {
      transaction,
      isActive: targetIsActive
    });

    await transaction.commit();
    transaction = null;

    const userResponse = await User.findByPk(id, {
      attributes: { exclude: ['Password', 'RefreshToken'] }
    });

    await attachAccessToUser(userResponse);

    res.status(200).json({
      status: 'success',
      message: 'Utilisateur mis à jour avec succès',
      data: userResponse
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    next(error);
  }
};

/**
 * Supprimer définitivement un utilisateur
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    }

    await user.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
};