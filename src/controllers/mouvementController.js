const mouvementService = require('../services/mouvementService');

/**
 * ✅ Contrôleur pour MvtDocs - Table réelle de mouvement
 * Utilise les services centralisés du mouvementService
 */

/**
 * Récupérer l'historique/mouvements d'un document
 * GET /api/mouvements/historique?docType=DEV&nf=1
 */
exports.getHistorique = async (req, res, next) => {
    try {
        // Désactiver le cache
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.removeHeader('ETag');
        
        const { docType, nf } = req.query;

        if (!docType || !nf) {
            return res.status(400).json({
                status: 'error',
                message: 'Parameters docType et nf requis'
            });
        }

        const historique = await mouvementService.obtenirHistorique(docType, parseInt(nf));

        return res.status(200).json({
            status: 'success',
            data: historique,
            count: historique.length
        });
    } catch (error) {
        console.error('❌ Error getHistorique:', error);
        next(error);
    }
};

/**
 * Récupérer tous les mouvements avec filtres et pagination
 * GET /api/mouvements?page=1&limit=50&docType=BCV
 */
exports.getAllMouvements = async (req, res, next) => {
    try {
        // Désactiver le cache
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.removeHeader('ETag');
        
        const { page = 1, limit = 50, docType, nf, codTiers, dateDebut, dateFin } = req.query;
        
        const filters = {
            docType,
            nf: nf ? parseInt(nf) : undefined,
            codTiers,
            dateDebut,
            dateFin
        };
        
        const result = await mouvementService.obtenirTousMouvements(parseInt(page), parseInt(limit), filters);

        return res.status(200).json({
            status: 'success',
            pagination: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages
            },
            data: result.data
        });
    } catch (error) {
        console.error('❌ Error getAllMouvements:', error);
        next(error);
    }
};

/**
 * Obtenir les statistiques des mouvements
 * GET /api/mouvements/statistiques?dateDebut=2026-01-01&dateFin=2026-04-02
 */
exports.getStatistiques = async (req, res, next) => {
    try {
        // Désactiver le cache
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.removeHeader('ETag');
        
        const { dateDebut, dateFin } = req.query;

        if (!dateDebut || !dateFin) {
            return res.status(400).json({
                status: 'error',
                message: 'Parameters dateDebut et dateFin requis'
            });
        }

        const stats = await mouvementService.obtenirStatistiques(new Date(dateDebut), new Date(dateFin));

        return res.status(200).json({
            status: 'success',
            data: stats
        });
    } catch (error) {
        console.error('❌ Error getStatistiques:', error);
        next(error);
    }
};
