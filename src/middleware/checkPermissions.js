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
 * @param {number|number[]} codMod - Code(s) du module (ex: 1=Objectifs, ou [8, 45])
 * @param {string} action - Action demandée: 'create', 'read', 'update', 'delete'
 */
const checkPermission = (codMod, action) => {
  return async (req, res, next) => {
    console.log(`🔐 [checkPermission] Entry: mod=${codMod}, action=${action}, user=${req.user?.LoginName}`);
    try {
      const codMods = Array.isArray(codMod) ? codMod : [codMod];
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

      // Les clients peuvent toujours lire leurs propres documents (modules 4/5/6/7)
      // Le filtrage par CodTiers est géré dans filterHelper — aucune config TabAWProfileAccess requise.
      const CLIENT_DOC_MODULES = [4, 5, 6, 7];
      if (userRole === 'client' && action === 'read' && codMods.some(m => CLIENT_DOC_MODULES.includes(Number(m)))) {
        req.grantedModule = codMods[0];
        req.permissions = {};
        return next();
      }

      const aliases = roleAliases(userRole);
      let granted = false;
      let lastErrorMessage = 'Accès refusé au module';
      let lastErrorDetails = `Aucune permission configurée`;
      let accessibleModule = null;
      let foundPermissions = null; // ← Declared OUTSIDE the loop

      for (const mod of codMods) {
        // Récupérer les permissions du rôle pour ce module
        const permissionsResult = await sequelize.query(`
          SELECT TOP 1 canAdd, canEdit, canDelt, Actif, ProfileUser, FiltreRepres
          FROM TabAWProfileAccess
          WHERE LOWER(ProfileUser) IN (:aliases) AND CodMod = :mod
        `, {
          replacements: { aliases, mod },
          type: QueryTypes.SELECT
        });

        const permissions = permissionsResult[0];

        if (!permissions) {
          if (userRole === 'admin') {
            granted = true;
            accessibleModule = mod;
            break;
          }
          lastErrorDetails = `Aucune permission configurée pour le rôle ${userRole} sur le module ${mod}`;
          continue;
        }

        const moduleAccessible = hasAnyModuleAccess(permissions);

        if (!moduleAccessible) {
          lastErrorMessage = 'Module désactivé pour votre rôle';
          continue;
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

        if (!hasPermission && Number(mod) === Number(MODULES.DEVIS)) {
          const isCommercial = userRole === 'commercial';
          const isAdmin = userRole === 'admin';

          if (action === 'update' && (isCommercial || isAdmin)) {
            hasPermission = moduleAccessible;
          }

          if (action === 'delete' && isAdmin) {
            hasPermission = moduleAccessible;
          }
        }

        if (hasPermission) {
          granted = true;
          accessibleModule = mod;
          foundPermissions = permissions; // ← Store the matched permissions
          break;
        } else {
          lastErrorDetails = `Votre rôle (${userRole}) n'a pas la permission ${permissionName} pour cette action sur le module ${mod}`;
        }
      }

      if (!granted) {
        return res.status(403).json({
          status: 'error',
          message: lastErrorMessage,
          details: lastErrorDetails
        });
      }

      // Store the module and specific permissions for the controller
      req.grantedModule = accessibleModule;
      req.permissions = foundPermissions || {}; // ← Use the outer-scoped variable
      
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
 * Codes des modules - MUST match CodMod values in TabAWProfileAccess
 */
const MODULES = {
  USERS: 1,              // Module Utilisateurs
  MESSAGES: 2,           // Module Messages (FIX: était 43)
  PROJETS: 3,            // Module Projets
  CALENDRIER: 8,         // Module Calendrier (Activités)
  DEVIS: 4,              // Module Devis
  BCV: 5,                // Module Commande
  LIVRAISONS: 6,         // Module Livraison
  FACTURES: 7,           // Module Facture
  CLIENTS: 30,           // Module Client
  REGLEMENT: 51,         // Module Reglement (nouveau code dédié)
  MENU: 32,              // Menu
  TOURNEE: 40,           // Module Tournée
  CHARGEMENT: 41,        // Module Chargement
  OBJECTIFS: 42,         // Module Objectif
  RECAP: 43,             // Module Recap
  RELEVE: 44,            // Module Relevé
  VISITES: 45,           // Module visite
  STOCK: 46,             // Stock / Produits
  CATEGORIES: 46,        // Categories/Collections (Stock)
  SOLDE_CLIENT: 47,      // soldeClient
  MAPS: 52,              // Maps

  // Legacy aliases
  RECLAMATIONS: 31,
  INTERVENTIONS: 31,
  PRODUITS: 46,
  TIERS: 30,
  ACTIVITES: 45
};

/**
 * Middleware dédié à la signature (BLV / FAV).
 * - Admin : toujours autorisé (la signature est séparée de la modification du contenu)
 * - Autres rôles : nécessitent la permission 'read' sur le module
 */
const checkSignaturePermission = (moduleCode) => {
  return async (req, res, next) => {
    try {
      const { resolveUserAccess } = require('../utils/userAccess');
      const userId = req.user?.id || req.user?.UserID;
      if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Non authentifié' });
      }
      const access = await resolveUserAccess(userId, req.user?.UserRole);
      if (access.normalizedRole === 'admin') {
        return next();
      }
      // Pour les autres rôles, déléguer à checkPermission 'read'
      return checkPermission(moduleCode, 'read')(req, res, next);
    } catch (error) {
      console.error('Erreur checkSignaturePermission:', error);
      return res.status(500).json({ status: 'error', message: 'Erreur vérification permission signature' });
    }
  };
};

module.exports = {
  checkPermission,
  checkSignaturePermission,
  MODULES
};
