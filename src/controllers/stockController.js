const { Stock, Collection, sequelize } = require('../models');
const { randomUUID } = require('crypto');
const { Op, QueryTypes } = require('sequelize');
const { formatDateForMSSQL } = require('../utils/helpers');
const path = require('path');
const fs = require('fs').promises;

console.log('✅ stockController.js loaded');

/**
 * Récupérer tous les stocks/produits
 */
exports.getAllStocks = async (req, res, next) => {
    try {
        console.log('--- [START] getAllStocks ---');

        const stocks = await Stock.findAll({
            limit: 1000,
            order: [['LibArt', 'ASC']]
        });

        console.log(`✅ Found ${stocks.length} stocks`);

        return res.status(200).json({
            status: 'success',
            data: {
                stocks,
                count: stocks.length
            }
        });
    } catch (error) {
        console.error('❌ Error in getAllStocks:', error.message);
        next(error);
    }
};

/**
 * Récupérer un stock par ID
 */
exports.getStockById = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`--- [START] getStockById - ID: ${id} ---`);

        const stock = await Stock.findByPk(id);

        if (!stock) {
            return res.status(404).json({
                status: 'error',
                message: 'Stock non trouvé'
            });
        }

        return res.status(200).json({
            status: 'success',
            data: stock
        });
    } catch (error) {
        console.error('❌ Error in getStockById:', error.message);
        next(error);
    }
};

/**
 * Chercher des stocks par terme
 */
exports.searchStocks = async (req, res, next) => {
    try {
        const { q } = req.query;
        console.log(`--- [START] searchStocks - Query: ${q} ---`);

        if (!q || q.trim() === '') {
            return res.status(400).json({
                status: 'error',
                message: 'Le paramètre de recherche est obligatoire'
            });
        }

        const stocks = await Stock.findAll({
            where: {
                [Op.or]: [
                    { LibArt: { [Op.iLike]: `%${q}%` } },
                    { CodArt: { [Op.iLike]: `%${q}%` } },
                    { Description: { [Op.iLike]: `%${q}%` } }
                ]
            },
            limit: 100,
            order: [['LibArt', 'ASC']]
        });

        console.log(`✅ Found ${stocks.length} stocks matching "${q}"`);

        return res.status(200).json({
            status: 'success',
            data: {
                stocks,
                count: stocks.length
            }
        });
    } catch (error) {
        console.error('❌ Error in searchStocks:', error.message);
        next(error);
    }
};

/**
 * Récupérer les stocks low quantity (Qte < MinStk)
 */
exports.getLowStocks = async (req, res, next) => {
    try {
        console.log('--- [START] getLowStocks ---');

        const lowStocks = await sequelize.query(`
            SELECT *
            FROM TabStock
            WHERE Qte < MinStk OR (Qte IS NULL AND MinStk IS NOT NULL)
            ORDER BY LibArt ASC
        `, {
            type: QueryTypes.SELECT
        });

        console.log(`✅ Found ${lowStocks.length} low stocks`);

        return res.status(200).json({
            status: 'success',
            data: {
                stocks: lowStocks,
                count: lowStocks.length
            }
        });
    } catch (error) {
        console.error('❌ Error in getLowStocks:', error.message);
        next(error);
    }
};

/**
 * Upload une image pour un stock
 */
exports.uploadStockImage = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`--- [START] uploadStockImage - ID: ${id} ---`);

        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'Aucun fichier n\'a été téléchargé'
            });
        }

        // Find the stock
        const stock = await Stock.findByPk(id);
        if (!stock) {
            // Clean up uploaded file
            await fs.unlink(req.file.path).catch(() => {});
            return res.status(404).json({
                status: 'error',
                message: 'Stock non trouvé'
            });
        }

        // Delete old image if exists
        if (stock.urlimg) {
            try {
                const oldPath = path.join(__dirname, '../../uploads', stock.urlimg);
                await fs.unlink(oldPath).catch(() => {});
            } catch (err) {
                console.warn('Warning: Could not delete old image:', err.message);
            }
        }

        // Update stock with new image URL
        const imageUrl = `/uploads/products/${req.file.filename}`;
        await stock.update({ urlimg: imageUrl });

        console.log(`✅ Image uploaded for stock ${id}`);

        return res.status(200).json({
            status: 'success',
            message: 'Image téléchargée avec succès',
            data: {
                stock,
                imageUrl
            }
        });
    } catch (error) {
        // Clean up uploaded file on error
        if (req.file) {
            await fs.unlink(req.file.path).catch(() => {});
        }
        console.error('❌ Error in uploadStockImage:', error.message);
        next(error);
    }
};

module.exports = exports;
