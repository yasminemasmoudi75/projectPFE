/**
 * 🔐 MIDDLEWARE D'ACCÈS AUTOMATIQUE AUX DONNÉES
 * 
 * Applique les filtres selon le rôle/permissions automatiquement
 * Admin: Pas de filtre (voir tout)
 * Commercial/Agent: Filtre FiltreRepres (ses données)
 * Client: Filtre CodTiers (ses documents)
 * Technicien: Filtre selon statut SAV
 * 
 * Usage:
 * router.get('/', applyAccessControl(findAllData), controller.getAll);
 */

const { Op } = require('sequelize');
const PermissionService = require('../services/permissionService');

/**
 * Normaliser le rôle en minuscule
 */
const normalizeRole = (role) => (role || '').toString().trim().toLowerCase();

/**
 * ✅ MIDDLEWARE: Appliquer contrôle d'accès automatiquement
 * 
 * Ajoute `req.accessControl` avec la logique de filtrage
 */
const applyAccessControl = async (req, res, next) => {
  try {
    const user = req.user;
    const userRole = normalizeRole(user?.UserRole);
    
    // Initialiser objet d'accès
    req.accessControl = {
      role: userRole,
      userId: user?.UserID,
      codRepres: user?.CodRepres || user?.codRepres,
      codTiers: user?.CodTiers || user?.codTiers,
      email: user?.EmailPro || user?.EmailPers,
      canViewAll: userRole === 'admin',
      shouldApplyFilter: ['commercial', 'agent', 'client', 'technicien'].includes(userRole),
    };
    
    // Pour les rôles nécessitant un filtre, récupérer les infos
    if (req.accessControl.shouldApplyFilter && userRole !== 'admin') {
      // Récupérer permissions détaillées
      const permissions = await PermissionService.getUserPermissions(user.UserID);
      req.accessControl.permissions = permissions;
    }
    
    next();
  } catch (error) {
    console.error('❌ Access control error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erreur contrôle d\'accès: ' + error.message 
    });
  }
};

/**
 * ✅ CONSTRUCTEUR DE FILTRE: Génère filtre Sequelize selon rôle
 * 
 * @param {Object} user - Objet utilisateur (req.user)
 * @param {Object} options - Options avancées
 * @returns {Object} Filtre Sequelize à passer à findAll()
 * 
 * USAGE:
 * const filter = buildDataAccessFilter(req.user);
 * const results = await Model.findAll({ where: filter });
 */
const buildDataAccessFilter = (user = {}, options = {}) => {
  const userRole = normalizeRole(user?.UserRole);
  const { sequelize, customFilters = [] } = options;
  
  // ✅ ADMIN: Pas de filtre
  if (userRole === 'admin') {
    return customFilters.length > 0 ? { [Op.and]: customFilters } : {};
  }
  
  const filters = [...customFilters];
  
  // ⭐ COMMERCIAL/AGENT: Filtre par FiltreRepres (CodRepres)
  if (['commercial', 'agent'].includes(userRole)) {
    const codRepres = user?.CodRepres || user?.codRepres;
    
    if (codRepres) {
      // Chercher colonnes possibles pour CodRepres
      filters.push({
        [Op.or]: [
          { CodRepres: codRepres },
          { codRepres: codRepres },
          // Pour structures imbriquées: Tiers.CodRepres = current user
        ]
      });
    }
  }
  
  // ⭐ CLIENT: Filtre par CodTiers (ses données)
  if (userRole === 'client') {
    const codTiers = user?.CodTiers || user?.codTiers;
    
    if (codTiers) {
      filters.push({
        [Op.or]: [
          { CodTiers: codTiers },
          { codTiers: codTiers },
          // Pour clients cherchant par email
          sequelize?.where?.(
            sequelize?.fn?.('LOWER', sequelize?.col?.('CUser')), 
            user?.EmailPro?.toLowerCase()
          ),
        ]
      });
    }
  }
  
  // ⭐ TECHNICIEN: Filtre par SAV/Support
  if (userRole === 'technicien') {
    // Technicien voit TOUS les SAV (pas de filtre personnel)
    // Mais peut avoir restriction sur statut ou type de SAV
    // À personnaliser selon logique métier
  }
  
  // Retourner le filtre compiled
  if (filters.length === 0) {
    return {};
  }
  
  return filters.length === 1 ? filters[0] : { [Op.and]: filters };
};

/**
 * ✅ HELPER: Ajouter filtre d'accès à une requête
 * 
 * Wrapper autour de buildDataAccessFilter
 * Utilise req.user et req.accessControl
 */
const withAccessControl = (req, baseFilter = {}) => {
  if (req.accessControl?.canViewAll) {
    return baseFilter;
  }
  
  const accessFilter = buildDataAccessFilter(req.user);
  
  if (Object.keys(baseFilter).length === 0) {
    return accessFilter;
  }
  
  return {
    [Op.and]: [
      baseFilter,
      accessFilter
    ]
  };
};

/**
 * 📝 EXEMPLE D'UTILISATION DANS UN CONTROLLER
 * 
 * exports.getAllDevis = async (req, res, next) => {
 *   try {
 *     const { search = '', page = 1, limit = 10 } = req.query;
 *     const offset = (parseInt(page) - 1) * parseInt(limit);
 *     
 *     // ✅ Appliquer filtre d'accès automatiquement
 *     const where = withAccessControl(req, {
 *       [Op.or]: search ? [
 *         { LibTiers: { [Op.like]: `%${search}%` } },
 *         { Nf: { [Op.like]: `%${search}%` } }
 *       ] : []
 *     });
 *     
 *     const { count, rows } = await DevisMaster.findAndCountAll({
 *       where,
 *       include: [{ model: Tiers, as: 'client' }],
 *       order: [['DatUser', 'DESC']],
 *       limit: parseInt(limit),
 *       offset,
 *     });
 *     
 *     return res.json({
 *       status: 'success',
 *       pagination: { total: count, page: parseInt(page), limit: parseInt(limit) },
 *       data: rows
 *     });
 *   } catch (error) {
 *     next(error);
 *   }
 * };
 */

module.exports = {
  applyAccessControl,
  buildDataAccessFilter,
  withAccessControl,
};
