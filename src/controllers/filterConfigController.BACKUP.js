/**
 * filterConfigController.js - BACKUP du contrôleur original
 * Gardé pour référence en cas de problème
 */

const filterConfigService = require('../services/filterConfigService');
const buildWhereClauseService = require('../services/buildWhereClauseService');

const getFilterConfig = async (req, res) => {
    try {
        const { moduleCode } = req.params;
        const { roleId } = req.query;

        if (!moduleCode) {
            return res.status(400).json({
                success: false,
                message: 'moduleCode is required'
            });
        }

        console.log(`📋 API: Loading filter config for module=${moduleCode}, roleId=${roleId}`);

        const filters = await filterConfigService.getFilterConfigByModule(moduleCode, roleId);

        if (!filters || filters.length === 0) {
            return res.json({
                success: true,
                data: [],
                message: `No filters configured for module ${moduleCode}`
            });
        }

        const filterMap = {};
        filters.forEach(filter => {
            filterMap[filter.key] = filter;
        });

        return res.json({
            success: true,
            moduleCode: moduleCode,
            total: filters.length,
            data: filters,
            filterMap: filterMap,
            message: `Loaded ${filters.length} filters`
        });

    } catch (error) {
        console.error('❌ Error in getFilterConfig:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const validateFilterConfig = async (req, res) => {
    try {
        const { moduleCode, filterKey } = req.params;

        const config = await filterConfigService.getFilterConfig(moduleCode, filterKey);

        if (!config) {
            return res.status(404).json({
                success: false,
                message: `Filter ${filterKey} not found in module ${moduleCode}`
            });
        }

        const isValid = filterConfigService.validateFilterConfig(config);

        return res.json({
            success: true,
            isValid: isValid,
            config: config
        });

    } catch (error) {
        console.error('❌ Error validating filter:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const testWhereClause = async (req, res) => {
    try {
        const { moduleCode, filters = {}, userData = {} } = req.body;

        if (!moduleCode) {
            return res.status(400).json({
                success: false,
                message: 'moduleCode is required'
            });
        }

        console.log(`🧪 Testing WHERE clause for module=${moduleCode}, filters=${JSON.stringify(filters)}`);

        const filterConfigs = await filterConfigService.getFilterConfigByModule(moduleCode);

        const normalizedFilters = buildWhereClauseService.normalizeFrontendFilters(filters, filterConfigs);

        const whereClause = await buildWhereClauseService.buildWhereClause(normalizedFilters, userData);

        return res.json({
            success: true,
            appliedFilters: normalizedFilters.map(f => ({
                key: f.config.key,
                label: f.config.label,
                value: f.value,
                operator: f.config.dataFilterOperator
            })),
            whereClause: whereClause,
            message: `Built WHERE clause with ${normalizedFilters.length} active filters`
        });

    } catch (error) {
        console.error('❌ Error testing WHERE clause:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const healthCheck = async (req, res) => {
    try {
        console.log('🏥 Health check requested');

        const { sequelize } = require('../models');
        const { QueryTypes } = require('sequelize');

        const result = await sequelize.query(`
            SELECT 
                COUNT(*) as TotalFilters,
                COUNT(DISTINCT ModuleCode) as TotalModules,
                SUM(CASE WHEN FilterDisplayType IS NOT NULL THEN 1 ELSE 0 END) as ConfiguredFilters,
                SUM(CASE WHEN DataFilterEnabled = 1 THEN 1 ELSE 0 END) as ActiveFilters,
                SUM(CASE WHEN FilterDependsOn IS NOT NULL THEN 1 ELSE 0 END) as CascadeFilters
            FROM TabRoleFilterVisibility
            WHERE FilterDisplayType IS NOT NULL
        `, { type: QueryTypes.SELECT });

        const stats = result[0] || {};

        return res.json({
            success: true,
            status: 'Database migration successful',
            moduleCode: '✓ Phase 1 Complete',
            stats: {
                totalFilters: stats.TotalFilters || 0,
                totalModules: stats.TotalModules || 0,
                configuredFilters: stats.ConfiguredFilters || 0,
                activeFilters: stats.ActiveFilters || 0,
                cascadeFilters: stats.CascadeFilters || 0
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        return res.status(500).json({
            success: false,
            status: 'Database migration incomplete',
            error: error.message
        });
    }
};

module.exports = {
    getFilterConfig,
    validateFilterConfig,
    testWhereClause,
    healthCheck
};
