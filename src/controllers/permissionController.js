const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { resolveUserAccess, getRoleAliases } = require('../utils/userAccess');

/**
 * Récupère toutes les permissions de l'utilisateur connecté
 * @route GET /api/permissions/my-permissions
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getMyPermissions = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.UserID;
    const userRole = req.user?.UserRole;

    console.log('🔐 getMyPermissions - User:', { userId, userRole });

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Non authentifié'
      });
    }

    const access = await resolveUserAccess(userId, userRole);
    const effectiveRole = access?.normalizedRole || String(userRole || '').toLowerCase();
    const aliases = getRoleAliases(effectiveRole);

    // Récupérer les permissions du rôle depuis la BD
    const permissions = await sequelize.query(`
      SELECT 
        CodMod as moduleCode,
        LibMod as moduleName,
        CASE WHEN Actif = 1 THEN 1 ELSE 0 END as isActive,
        CASE WHEN FiltreRepres = 1 THEN 1 ELSE 0 END as filterRepres,
        CASE WHEN canAdd = 1 THEN 1 ELSE 0 END as canCreate,
        CASE WHEN canEdit = 1 THEN 1 ELSE 0 END as canEdit,
        CASE WHEN canDelt = 1 THEN 1 ELSE 0 END as canDelete,
        CASE WHEN canValid = 1 THEN 1 ELSE 0 END as canValidate,
        CASE WHEN CanImp = 1 THEN 1 ELSE 0 END as canExport,
        CASE WHEN canPDF = 1 THEN 1 ELSE 0 END as canPDF
      FROM TabAWProfileAccess
      WHERE LOWER(ProfileUser) IN (:aliases)
      ORDER BY CASE WHEN LOWER(ProfileUser) = :preferredRole THEN 0 ELSE 1 END, CodMod
    `, {
      replacements: { aliases, preferredRole: effectiveRole },
      type: QueryTypes.SELECT
    });

    console.log(`✅ Permissions trouvées: ${permissions.length} pour rôle ${effectiveRole}`);

    const response = {
      status: 'success',
      data: {
        userRole,
        normalizedRole: effectiveRole,
        totalPermissions: permissions.length,
        activeModules: permissions.filter(p => p.isActive == 1 || p.isActive === true).length,
        permissions: permissions.map(p => ({
          moduleCode: p.moduleCode,
          moduleName: p.moduleName,
          isActive: p.isActive == 1 || p.isActive === true,
          filterRepres: p.filterRepres == 1 || p.filterRepres === true,
          canCreate: p.canCreate == 1 || p.canCreate === true,
          canEdit: p.canEdit == 1 || p.canEdit === true,
          canDelete: p.canDelete == 1 || p.canDelete === true,
          canValidate: p.canValidate == 1 || p.canValidate === true,
          canExport: p.canExport == 1 || p.canExport === true,
          canPDF: p.canPDF == 1 || p.canPDF === true
        }))
      }
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Erreur getMyPermissions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors du chargement des permissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Récupère la permission pour un module spécifique
 * @route GET /api/permissions/module/:codMod
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getModulePermission = async (req, res) => {
  try {
    const { codMod } = req.params;
    const userRole = req.user?.UserRole;
    const userId = req.user?.id || req.user?.UserID;

    console.log('🔐 getModulePermission - Role:', userRole, 'Module:', codMod);

    if (!userId || !codMod) {
      return res.status(400).json({
        status: 'error',
        message: 'Paramètres manquants'
      });
    }

    const access = await resolveUserAccess(userId, userRole);
    const effectiveRole = access?.normalizedRole || String(userRole || '').toLowerCase();
    const aliases = getRoleAliases(effectiveRole);

    const permission = await sequelize.query(`
      SELECT TOP 1
        CodMod as moduleCode,
        LibMod as moduleName,
        CASE WHEN Actif = 1 THEN 1 ELSE 0 END as isActive,
        CASE WHEN canAdd = 1 THEN 1 ELSE 0 END as canCreate,
        CASE WHEN canEdit = 1 THEN 1 ELSE 0 END as canEdit,
        CASE WHEN canDelt = 1 THEN 1 ELSE 0 END as canDelete
      FROM TabAWProfileAccess
      WHERE LOWER(ProfileUser) IN (:aliases) AND CodMod = :codMod
      ORDER BY CASE WHEN LOWER(ProfileUser) = :preferredRole THEN 0 ELSE 1 END
    `, {
      replacements: { aliases, preferredRole: effectiveRole, codMod: parseInt(codMod) },
      type: QueryTypes.SELECT
    });

    if (!permission || permission.length === 0) {
      console.warn(`⚠️ Pas de permission: ${userRole} sur module ${codMod}`);
      return res.status(403).json({
        status: 'error',
        message: 'Permission refusée pour ce module'
      });
    }

    const perm = permission[0];
    res.json({
      status: 'success',
      data: {
        moduleCode: perm.moduleCode,
        moduleName: perm.moduleName,
        isActive: perm.isActive === 1,
        canCreate: perm.canCreate === 1,
        canEdit: perm.canEdit === 1,
        canDelete: perm.canDelete === 1
      }
    });

  } catch (error) {
    console.error('❌ Erreur getModulePermission:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la vérification de la permission'
    });
  }
};

/**
 * Récupère toutes les permissions (admin seulement)
 * @route GET /api/permissions/all
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getAllPermissions = async (req, res) => {
  try {
    const userRole = req.user?.UserRole;

    // Vérifier si admin
    if (userRole?.toLowerCase() !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Accès réservé aux administrateurs'
      });
    }

    const allPermissions = await sequelize.query(`
      SELECT 
        ProfileUser as role,
        CodMod as moduleCode,
        LibMod as moduleName,
        Actif as isActive,
        canAdd,
        canEdit,
        canDelt,
        canValid,
        CanImp,
        canPDF
      FROM TabAWProfileAccess
      ORDER BY ProfileUser, CodMod
    `, {
      type: QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: {
        totalPermissions: allPermissions.length,
        roleCount: [...new Set(allPermissions.map(p => p.role))].length,
        permissions: allPermissions
      }
    });

  } catch (error) {
    console.error('❌ Erreur getAllPermissions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors du chargement des permissions'
    });
  }
};

module.exports = exports;
