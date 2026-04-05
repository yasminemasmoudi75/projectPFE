/**
 * 🔧 MODIFIED checkPermissions.js
 * ═════════════════════════════════════════════════════════════════
 * 
 * VERSION: Admin respecte AUSSI TabAWProfileAccess (pas de bypass)
 * 
 * Remplacer le fichier: backend/src/middleware/checkPermissions.js
 * avec ce contenu
 */

const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { resolveUserAccess } = require('../utils/userAccess');

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

const canFlag = (value) => value === true || value === 1 || value === '1';
const hasAnyModuleAccess = (permissions) => (
  canFlag(permissions?.Actif)
  || canFlag(permissions?.canAdd)
  || canFlag(permissions?.canEdit)
  || canFlag(permissions?.canDelt)
);

/**
 * Middleware pour vérifier les permissions module par rôle
 * Utilise TabAWProfileAccess pour contrôler canAdd, canEdit, canDelt
 * 
 * CHANGEMENT: Admin aussi doit respecter TabAWProfileAccess
 * (plus de bypass admin)
 * 
 * @param {number} codMod - Code du module (ex: 1=Objectifs, 2=Réclamations)
 * @param {string} action - Action demandée: 'create', 'read', 'update', 'delete'
 */
const checkPermission = (codMod, action) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || req.user?.UserID;
      
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Non authentifié'
        });
      }

      const access = await resolveUserAccess(userId, req.user?.UserRole);
      const userRole = access.normalizedRole;

      if (!userRole) {
        return res.status(403).json({
          status: 'error',
          message: 'Aucun rôle défini pour cet utilisateur (UCS_USERINFO/UCS_PROFILES)'
        });
      }

      // 🔸 MODIFICATION: Admin N'A PLUS DE BYPASS - respecte aussi TabAWProfileAccess
      // Ancien code (commenté):
      // if (access.isAdmin || userRole === 'admin') {
      //   return next();
      // }

      const aliases = roleAliases(userRole);

      // Récupérer les permissions du rôle pour ce module
      const permissionsResult = await sequelize.query(`
        SELECT TOP 1 canAdd, canEdit, canDelt, Actif, ProfileUser
        FROM TabAWProfileAccess
        WHERE LOWER(ProfileUser) IN (:aliases) AND CodMod = :codMod
        ORDER BY CASE WHEN LOWER(ProfileUser) = :preferredRole THEN 0 ELSE 1 END
      `, {
        replacements: { aliases, codMod, preferredRole: userRole },
        type: QueryTypes.SELECT
      });

      const permissions = permissionsResult[0];

      if (!permissions) {
        return res.status(403).json({
          status: 'error',
          message: `Accès refusé au module`,
          details: `Aucune permission configurée pour le rôle ${userRole} sur le module ${codMod}`
        });
      }

      const moduleAccessible = hasAnyModuleAccess(permissions);

      // Sur la base legacy, certains modules ont des flags CRUD renseignés alors que Actif=0.
      // On considère donc le module accessible si au moins un droit explicite existe.
      if (!moduleAccessible) {
        return res.status(403).json({
          status: 'error',
          message: 'Module désactivé pour votre rôle'
        });
      }

      // Vérifier la permission selon l'action
      let hasPermission = false;
      let permissionName = '';

      switch (action) {
        case 'create':
          hasPermission = canFlag(permissions.canAdd);
          permissionName = 'canAdd';
          break;
        case 'read':
          // La lecture est implicite dès qu'un accès module existe.
          hasPermission = moduleAccessible;
          break;
        case 'update':
          hasPermission = canFlag(permissions.canEdit);
          permissionName = 'canEdit';
          break;
        case 'delete':
          hasPermission = canFlag(permissions.canDelt);
          permissionName = 'canDelt';
          break;
        default:
          return res.status(400).json({
            status: 'error',
            message: 'Action non reconnue'
          });
      }

      if (!hasPermission) {
        return res.status(403).json({
          status: 'error',
          message: `Permission refusée`,
          details: `Votre rôle (${userRole}) n'a pas la permission ${permissionName} pour cette action`
        });
      }

      // Permission accordée
      next();

    } catch (error) {
      console.error('Erreur vérification permissions:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la vérification des permissions',
        error: error.message
      });
    }
  };
};

/**
 * Codes des modules
 */
const MODULES = {
  OBJECTIFS: 1,
  RECLAMATIONS: 2,
  INTERVENTIONS: 3,
  DEVIS: 4,
  PROJETS: 5,
  PRODUITS: 46,
  TIERS: 7,
  BCV: 8,
  ACTIVITES: 9,
  MESSAGES: 10
};

module.exports = {
  checkPermission,
  MODULES
};
