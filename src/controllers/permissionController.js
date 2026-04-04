const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

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

    if (!userId || !userRole) {
      return res.status(401).json({
        status: 'error',
        message: 'Non authentifié'
      });
    }

    // Récupérer les permissions du rôle depuis la BD
    const permissions = await sequelize.query(`
      SELECT 
        CodMod as moduleCode,
        LibMod as moduleName,
        CASE WHEN Actif = 1 THEN 1 ELSE 0 END as isActive,
        CASE WHEN canAdd = 1 THEN 1 ELSE 0 END as canCreate,
        CASE WHEN canEdit = 1 THEN 1 ELSE 0 END as canEdit,
        CASE WHEN canDelt = 1 THEN 1 ELSE 0 END as canDelete,
        CASE WHEN canValid = 1 THEN 1 ELSE 0 END as canValidate,
        CASE WHEN CanImp = 1 THEN 1 ELSE 0 END as canExport,
        CASE WHEN canPDF = 1 THEN 1 ELSE 0 END as canPDF
      FROM TabAWProfileAccess
      WHERE LOWER(ProfileUser) = LOWER(:userRole)
      ORDER BY CodMod
    `, {
      replacements: { userRole },
      type: QueryTypes.SELECT
    });

    console.log(`✅ Permissions trouvées: ${permissions.length} pour rôle ${userRole}`);

    const response = {
      status: 'success',
      data: {
        userRole,
        totalPermissions: permissions.length,
        activeModules: permissions.filter(p => p.isActive === 1).length,
        permissions: permissions.map(p => ({
          moduleCode: p.moduleCode,
          moduleName: p.moduleName,
          isActive: p.isActive === 1,
          canCreate: p.canCreate === 1,
          canEdit: p.canEdit === 1,
          canDelete: p.canDelete === 1,
          canValidate: p.canValidate === 1,
          canExport: p.canExport === 1,
          canPDF: p.canPDF === 1
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

    console.log('🔐 getModulePermission - Role:', userRole, 'Module:', codMod);

    if (!userRole || !codMod) {
      return res.status(400).json({
        status: 'error',
        message: 'Paramètres manquants'
      });
    }

    const permission = await sequelize.query(`
      SELECT 
        CodMod as moduleCode,
        LibMod as moduleName,
        CASE WHEN Actif = 1 THEN 1 ELSE 0 END as isActive,
        CASE WHEN canAdd = 1 THEN 1 ELSE 0 END as canCreate,
        CASE WHEN canEdit = 1 THEN 1 ELSE 0 END as canEdit,
        CASE WHEN canDelt = 1 THEN 1 ELSE 0 END as canDelete
      FROM TabAWProfileAccess
      WHERE LOWER(ProfileUser) = LOWER(:userRole) AND CodMod = :codMod
      LIMIT 1
    `, {
      replacements: { userRole, codMod: parseInt(codMod) },
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
