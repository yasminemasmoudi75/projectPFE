const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { sanitizeDate } = require('../utils/helpers');

/**
 * Créer un utilisateur
 * Gère la sécurité (hashing) et les contraintes SQL Server
 */
exports.createUser = async (req, res, next) => {
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
      IsActive,
      DateNaissance
    } = req.body;

    // 1. Validation des champs obligatoires
    if (!LoginName || !Password || !FullName || !EmailPro) {
      return res.status(400).json({
        status: 'error',
        message: 'LoginName, Password, FullName et EmailPro sont obligatoires'
      });
    }

    // 2. Vérifier l'unicité du LoginName
    const existingUser = await User.findOne({ where: { LoginName } });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Un utilisateur avec ce LoginName existe déjà'
      });
    }

    // 3. Sécurité : Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(Password, 10);

    // 4. Création dans la base de données
    // NOTE : On ne passe pas CreatedDate ici pour éviter l'erreur de conversion de date MSSQL
    const newUser = await User.create({
      LoginName,
      Password: hashedPassword,
      FullName,
      EmailPro,
      UserRole: UserRole || 'User',
      TelPro,
      PosteOccupe: Poste,
      Departement,
      IsActive: IsActive !== undefined ? IsActive : true,
      DateNaissance: sanitizeDate(DateNaissance)
    });

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
      IsActive: newUser.IsActive
    };

    res.status(201).json({
      status: 'success',
      message: 'Utilisateur créé avec succès',
      data: userResponse
    });
  } catch (error) {
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
  try {
    const { id } = req.params;
    const {
      FullName,
      EmailPro,
      UserRole,
      TelPro,
      Poste,
      Departement,
      IsActive,
      Password
    } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    }

    // Construction dynamique de l'objet de mise à jour
    const updateData = {};
    if (FullName) updateData.FullName = FullName;
    if (EmailPro) updateData.EmailPro = EmailPro;
    if (UserRole) updateData.UserRole = UserRole;
    if (TelPro) updateData.TelPro = TelPro;
    if (Poste) updateData.PosteOccupe = Poste;
    if (Departement) updateData.Departement = Departement;
    if (IsActive !== undefined) updateData.IsActive = IsActive;

    // Si le mot de passe est modifié, on le re-hashe
    if (Password) {
      updateData.Password = await bcrypt.hash(Password, 10);
    }

    await user.update(updateData);

    const userResponse = await User.findByPk(id, {
      attributes: { exclude: ['Password', 'RefreshToken'] }
    });

    res.status(200).json({
      status: 'success',
      message: 'Utilisateur mis à jour avec succès',
      data: userResponse
    });
  } catch (error) {
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