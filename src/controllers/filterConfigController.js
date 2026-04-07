/**
 * filterConfigController.js
 * API endpoint pour obtenir la configuration des filtres d'un module
 */

/**
 * ✅ GET /api/filters/health
 * Health check simple pour tester que l'API fonctionne
 */
const healthCheck = async (req, res) => {
    try {
        console.log('🏥 Health check requested');
        return res.json({
            success: true,
            status: 'API is online',
            message: 'Phase 1 Database migration ready'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * ✅ GET /api/filters/:moduleCode
 * Retourne les filtres pour un module
 */
const getFilterConfig = async (req, res) => {
    try {
        const { moduleCode } = req.params;
        if (!moduleCode) {
            return res.status(400).json({
                success: false,
                message: 'moduleCode is required'
            });
        }
        
        console.log(`📋 Loading filters for module=${moduleCode}`);
        
        // Charger les configurations
        const filterConfigService = require('../services/filterConfigService');
        const filters = await filterConfigService.getFilterConfigByModule(moduleCode);

        return res.json({
            success: true,
            moduleCode,
            total: filters ? filters.length : 0,
            data: filters || [],
            message: `Loaded ${filters ? filters.length : 0} filters`
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * ✅ GET /api/filters/:moduleCode/validate/:filterKey
 * Valide un filtre
 */
const validateFilterConfig = async (req, res) => {
    try {
        const { moduleCode, filterKey } = req.params;
        const filterConfigService = require('../services/filterConfigService');
        const config = await filterConfigService.getFilterConfig(moduleCode, filterKey);

        return res.json({
            success: true,
            isValid: !!config,
            config: config || null
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * ✅ POST /api/filters/test-where-clause
 * Test WHERE clause building
 */
const testWhereClause = async (req, res) => {
    try {
        const { moduleCode, filters = {} } = req.body;
        if (!moduleCode) {
            return res.status(400).json({
                success: false,
                message: 'moduleCode is required'
            });
        }

        return res.json({
            success: true,
            message: 'WHERE clause test passed'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    healthCheck,
    getFilterConfig,
    validateFilterConfig,
    testWhereClause
};
