const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User, sequelize } = require('../models');
const { TableHints } = require('sequelize');
const { sendClientCredentials } = require('../utils/emailService');

const { sanitizeDate } = require('../utils/helpers');
const { allocateNextUserId } = require('../utils/userId');
const { attachAccessToUser, attachAccessToUsers, resolveUserAccess, upsertUserAccess } = require('../utils/userAccess');
const { QueryTypes } = require('sequelize');

const normalizeRole = (role) => String(role || '').trim().toLowerCase();

const roleAliases = (normalizedRole) => {
  const aliases = {
    admin: ['admin', 'administrateur'],
    commercial: ['commercial', 'commerciale'],
    agent: ['agent'],
    technicien: ['technicien', 'technicien sav'],
    client: ['client']
  };
  return aliases[normalizedRole] || [normalizedRole];
};

/**
 * Générer un LoginName unique à partir du nom complet
 */
const generateUniqueLoginName = async (fullName, transaction) => {
  if (!fullName) return null;

  const cleanName = fullName
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '.');

  let baseLogin = cleanName;
  let loginName = baseLogin;
  let counter = 1;
  let exists = true;

  while (exists) {
    const user = await User.findOne({
      where: { EmailPro: loginName },
      transaction
    });
    if (!user) {
      exists = false;
    } else {
      loginName = `${baseLogin}${counter}`;
      counter++;
    }
  }
  return loginName;
};

const resolveGouvernoratId = async (gouvernoratValue, { transaction } = {}) => {
  if (gouvernoratValue === undefined || gouvernoratValue === null || gouvernoratValue === '') {
    return null;
  }

  const raw = String(gouvernoratValue).trim();
  if (!raw) return null;

  const row = await sequelize.query(`
    SELECT TOP 1 id
    FROM tiersGouvernorat
    WHERE id = TRY_CONVERT(INT, :raw)
       OR LOWER(LTRIM(RTRIM(libelle))) = LOWER(LTRIM(RTRIM(:raw)))
    ORDER BY CASE WHEN id = TRY_CONVERT(INT, :raw) THEN 0 ELSE 1 END
  `, {
    replacements: { raw },
    type: QueryTypes.SELECT,
    transaction
  });

  return row[0]?.id ?? null;
};

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

    // Règle métier : Gouvernorat obligatoire si un rôle est assigné
    if (selectedRole && !Gouvernorat) {
      return res.status(400).json({
        status: 'error',
        message: 'Le champ Gouvernorat est obligatoire lorsqu\'un rôle est assigné.'
      });
    }

    // 1. Validation des champs obligatoires
    if (!FullName || !EmailPro || !TelPro) {
      return res.status(400).json({
        status: 'error',
        message: 'FullName, EmailPro et Téléphone sont obligatoires'
      });
    }

    // Validation du format du téléphone (8 chiffres)
    if (!/^\d{8}$/.test(TelPro)) {
      return res.status(400).json({
        status: 'error',
        message: 'Le numéro de téléphone doit contenir exactement 8 chiffres.'
      });
    }

    transaction = await sequelize.transaction();

    // 2. Vérifier l'unicité de l'Email et du Téléphone
    const existingEmail = await User.findOne({
      where: { EmailPro },
      transaction
    });

    if (existingEmail) {
      await transaction.rollback();
      transaction = null;
      return res.status(400).json({
        status: 'error',
        message: 'Cet email est déjà utilisé par un autre collaborateur.'
      });
    }

    const existingPhone = await User.findOne({
      where: { TelPro },
      transaction
    });

    if (existingPhone) {
      await transaction.rollback();
      transaction = null;
      return res.status(400).json({
        status: 'error',
        message: 'Ce numéro de téléphone est déjà utilisé par un autre collaborateur.'
      });
    }

    const gouvernoratId = await resolveGouvernoratId(Gouvernorat, { transaction });
    if (Gouvernorat !== undefined && Gouvernorat !== null && Gouvernorat !== '' && !gouvernoratId) {
      await transaction.rollback();
      transaction = null;
      return res.status(400).json({
        status: 'error',
        message: 'Gouvernorat invalide: valeur introuvable dans tiersGouvernorat'
      });
    }

    // 3. Générer un mot de passe aléatoire et hasher
    const clearPassword = Password || crypto.randomBytes(6).toString('base64').slice(0, 10);
    const hashedPassword = await bcrypt.hash(clearPassword, 10);
    const resolvedLoginName = LoginName || await generateUniqueLoginName(FullName, transaction);
    const nextUserId = await allocateNextUserId({ transaction });

    // 4. Création dans la base de données
    const newUser = await User.create({
      UserID: nextUserId,
      LoginName: resolvedLoginName,
      Password: hashedPassword,
      FullName,
      EmailPro,
      Gouvernorat: gouvernoratId,
      DateNaissance: sanitizeDate(DateNaissance),
      MustChangePassword: true
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

    // 6. Envoyer les identifiants par email
    let emailSent = false;
    try {
      emailSent = await sendClientCredentials(newUser.EmailPro, newUser.FullName, clearPassword);
    } catch (emailErr) {
      console.error('⚠️ Email envoi échoué:', emailErr.message);
    }

    res.status(201).json({
      status: 'success',
      message: 'Utilisateur créé avec succès',
      emailSent,
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
 * Renvoyer les identifiants de connexion par email
 */
exports.resendCredentials = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ status: 'error', message: 'Utilisateur introuvable' });
    if (!user.EmailPro) return res.status(400).json({ status: 'error', message: "Cet utilisateur n'a pas d'email enregistré" });

    const newPassword = crypto.randomBytes(6).toString('base64').slice(0, 10);
    user.Password = await bcrypt.hash(newPassword, 10);
    await user.save();

    const emailSent = await sendClientCredentials(user.EmailPro, user.FullName, newPassword);
    if (!emailSent) return res.status(500).json({ status: 'error', message: "Impossible d'envoyer l'email" });

    res.json({ status: 'success', message: 'Identifiants renvoyés par email' });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer tous les utilisateurs
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const filterHelper = require('../utils/filterHelper');

    // Module 19 = Users (Table-driven filters from TabRoleFilterVisibility)
    console.log('📋 [getAllUsers] Getting users with module code 19');
    const { where, limit, offset, page } = await filterHelper.applyTableDrivenFiltersWithPagination(
      '19',
      req.query,
      req.user
    );

    console.log('📋 [getAllUsers] where:', JSON.stringify(where, (key, value) => 
      typeof value === 'symbol' ? value.toString() : value
    , 2));

    // Filtre de recherche par nom ou email
    const searchTerm = req.query.search || req.query.q;
    if (searchTerm && searchTerm.trim()) {
      const { Op } = require('sequelize');
      const like = `%${searchTerm.trim()}%`;
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push({
        [Op.or]: [
          { FullName: { [Op.like]: like } },
          { EmailPro: { [Op.like]: like } },
        ]
      });
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [['UserID', 'DESC']]
    });

    console.log(`👥 [USERS] Found ${rows.length} users in DB for admin list`);
    console.log('👥 [USERS] count:', count);

    // Indispensable pour que le champ virtuel UserRole soit peuplé pour le Frontend
    const { attachAccessToUsers } = require('../utils/userAccess');
    await attachAccessToUsers(rows);


    res.status(200).json(
      filterHelper.formatPaginatedResponse(rows, count, page, limit)
    );
  } catch (error) {
    console.error('❌ [USERS ERROR]:', error.message);
    console.error('❌ Stack:', error.stack);
    next(error);
  }
};

/**
 * Récupérer un utilisateur par son ID (PK)
 */
exports.getUserById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ status: 'error', message: 'ID utilisateur invalide' });
    }

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

    // S'assurer que le Gouvernorat renvoyé est un ID (pour le select du Front)
    if (user.Gouvernorat && isNaN(parseInt(user.Gouvernorat))) {
      const govId = await resolveGouvernoratId(user.Gouvernorat);
      if (govId) user.Gouvernorat = String(govId);
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
  let transaction;

  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ status: 'error', message: 'ID utilisateur invalide' });
    }

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

    // Validation du format du téléphone (8 chiffres)
    if (TelPro && !/^\d{8}$/.test(TelPro)) {
      return res.status(400).json({
        status: 'error',
        message: 'Le numéro de téléphone doit contenir exactement 8 chiffres.'
      });
    }

    transaction = await sequelize.transaction();

    const { Op } = require('sequelize');

    // Vérifier l'unicité de l'email s'il a changé
    if (EmailPro) {
      const existingEmail = await User.findOne({
        where: { 
          EmailPro,
          UserID: { [Op.ne]: id }
        },
        transaction
      });

      if (existingEmail) {
        await transaction.rollback();
        transaction = null;
        return res.status(400).json({
          status: 'error',
          message: 'Cet email est déjà utilisé par un autre collaborateur.'
        });
      }
    }

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
    if (Gouvernorat !== undefined) {
      const gouvernoratId = await resolveGouvernoratId(Gouvernorat, { transaction });
      if (Gouvernorat !== null && Gouvernorat !== '' && !gouvernoratId) {
        await transaction.rollback();
        transaction = null;
        return res.status(400).json({
          status: 'error',
          message: 'Gouvernorat invalide: valeur introuvable dans tiersGouvernorat'
        });
      }
      updateData.Gouvernorat = gouvernoratId;
    }

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
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ status: 'error', message: 'ID utilisateur invalide' });
    }

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

/**
 * Récupérer la liste des commerciaux assignables (pour formulaire client)
 * - Si FiltreRepres activé pour l'agent: commerciaux de sa région uniquement
 * - Sinon: tous les commerciaux
 */
/**
 * Récupère tous les membres internes (toutes rôles sauf client) — pour le filtre calendrier admin
 */
exports.getCalendarMembers = async (req, res, next) => {
  try {
    const rows = await sequelize.query(`
      SELECT
        u.USER_ID  AS UserID,
        u.USER_NAME AS LoginName,
        u.REAL_NAME AS FullName,
        u.PhotoProfil AS PhotoProfil,
        u.Gouvernorat AS Gouvernorat,
        u.GUID AS GUID,
        p.PROF_DESCRIPTION AS Role
      FROM UCS_USERS u
      INNER JOIN UCS_USERINFO ui ON ui.USER_ID = u.USER_ID AND ui.APP_ID = 1
      INNER JOIN UCS_PROFILES p ON p.PROF_ID = ui.PROF_ID
      WHERE LOWER(p.PROF_DESCRIPTION) NOT IN ('client')
        AND ui.USER_ACTIVE = '1'
      ORDER BY p.PROF_DESCRIPTION ASC, u.REAL_NAME ASC
    `, { type: QueryTypes.SELECT });

    res.status(200).json({
      status: 'success',
      data: (rows || []).map((row) => ({
        value: String(row.UserID),
        userId: row.UserID,
        login: row.LoginName,
        fullName: row.FullName,
        PhotoProfil: row.PhotoProfil,
        gouvernorat: row.Gouvernorat,
        guid: row.GUID,
        role: row.Role,
        label: row.FullName || row.LoginName || `Utilisateur ${row.UserID}`
      }))
    });
  } catch (error) {
    next(error);
  }
};

exports.getAssignableCommercials = async (req, res, next) => {
  try {
    const requesterId = req.user?.UserID || req.user?.id;
    const requesterRole = normalizeRole(req.user?.UserRole);
    const requesterRegion = req.user?.Gouvernorat || null;
    const moduleCode = String(req.query?.moduleCode || '30').trim();
    const includeAll = req.query?.includeAll === 'true' || req.query?.includeAll === '1';

    const moduleCandidates = [moduleCode];
    if (moduleCode === '11' || moduleCode === '30') {
      moduleCandidates.push('11', '30');
    }

    const aliases = roleAliases(requesterRole);

    const filtreRepresRows = await sequelize.query(`
      SELECT TOP 1 FiltreRepres
      FROM TabAWProfileAccess
      WHERE LOWER(ProfileUser) IN (:aliases)
        AND CAST(CodMod AS NVARCHAR(20)) IN (:moduleCandidates)
      ORDER BY CASE WHEN CAST(CodMod AS NVARCHAR(20)) = :moduleCode THEN 0 ELSE 1 END
    `, {
      replacements: {
        aliases,
        moduleCandidates: Array.from(new Set(moduleCandidates)),
        moduleCode
      },
      type: QueryTypes.SELECT
    });

    const filtreRepresEnabled = filtreRepresRows[0]?.FiltreRepres === 1
      || filtreRepresRows[0]?.FiltreRepres === true
      || filtreRepresRows[0]?.FiltreRepres === '1';

    // Si FiltreRepres est OFF ou includeAll est explicité, retourner TOUS les commerciaux
    // Sinon si agent ET FiltreRepres ON, filtrer par région
    const whereRegionClause = (!filtreRepresEnabled || includeAll)
      ? ''
      : (requesterRole === 'agent' && requesterRegion)
        ? `AND EXISTS (
             SELECT 1
             FROM tiersGouvernorat tgReq
             INNER JOIN tiersGouvernorat tgUser ON tgUser.id = tgReq.id
             WHERE (
               tgReq.id = TRY_CONVERT(INT, :requesterRegion)
               OR LOWER(LTRIM(RTRIM(tgReq.libelle))) = LOWER(LTRIM(RTRIM(CONVERT(NVARCHAR(100), :requesterRegion))))
             )
             AND (
               tgUser.id = TRY_CONVERT(INT, u.Gouvernorat)
               OR LOWER(LTRIM(RTRIM(tgUser.libelle))) = LOWER(LTRIM(RTRIM(CONVERT(NVARCHAR(100), u.Gouvernorat))))
             )
           )`
        : '';

    const rows = await sequelize.query(`
      SELECT
        u.USER_ID AS UserID,
        u.USER_NAME AS LoginName,
        u.REAL_NAME AS FullName,
        u.PhotoProfil AS PhotoProfil,
        u.Gouvernorat AS Gouvernorat,
        u.GUID AS GUID
      FROM UCS_USERS u
      INNER JOIN UCS_USERINFO ui ON ui.USER_ID = u.USER_ID AND ui.APP_ID = 1
      INNER JOIN UCS_PROFILES p ON p.PROF_ID = ui.PROF_ID
      WHERE LOWER(p.PROF_DESCRIPTION) IN ('commercial', 'commerciale')
      ${whereRegionClause}
      ORDER BY u.REAL_NAME ASC
    `, {
      replacements: { requesterRegion: requesterRegion ? String(requesterRegion) : null },
      type: QueryTypes.SELECT
    });

    // Defensive fallback: if agent + FiltreRepres and no regional match, return current user only when commercial.
    let data = rows;
    if (requesterRole === 'agent' && filtreRepresEnabled && (!rows || rows.length === 0) && requesterId) {
      const selfCommercial = await sequelize.query(`
        SELECT
          u.USER_ID AS UserID,
          u.USER_NAME AS LoginName,
          u.REAL_NAME AS FullName,
          u.Gouvernorat AS Gouvernorat,
          u.GUID AS GUID
        FROM UCS_USERS u
        INNER JOIN UCS_USERINFO ui ON ui.USER_ID = u.USER_ID AND ui.APP_ID = 1
        INNER JOIN UCS_PROFILES p ON p.PROF_ID = ui.PROF_ID
        WHERE u.USER_ID = :requesterId
          AND LOWER(p.PROF_DESCRIPTION) IN ('commercial', 'commerciale')
      `, {
        replacements: { requesterId },
        type: QueryTypes.SELECT
      });
      data = selfCommercial;
    }

    res.status(200).json({
      status: 'success',
      data: (data || []).map((row) => ({
        value: String(row.UserID),
        userId: row.UserID,
        login: row.LoginName,
        fullName: row.FullName,
        PhotoProfil: row.PhotoProfil,
        gouvernorat: row.Gouvernorat,
        guid: row.GUID,
        label: row.FullName || row.LoginName || `Commercial ${row.UserID}`
      })),
      meta: {
        filtreRepresEnabled,
        requesterRole,
        requesterRegion,
        moduleCode
      }
    });
  } catch (error) {
    next(error);
  }
};