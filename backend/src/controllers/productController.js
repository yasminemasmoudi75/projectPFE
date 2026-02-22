const { Product, Collection } = require('../models');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('✅ productController.js loaded');

/**
 * Normaliser les données numériques
 */
const normalizeNumber = (value, fallback = 0) => {
    if (value === '' || value === null || value === undefined) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Créer un nouveau produit
 */
exports.createProduct = async (req, res, next) => {
    try {
        console.log('--- [START] createProduct ---');
        console.log('Headers:', req.headers['content-type']);
        console.log('Body:', JSON.stringify(req.body, null, 2));
        console.log('File:', req.file ? `Received: ${req.file.originalname}` : 'No file received');

        const {
            CodArt,
            LibArt,
            Description,
            PrixVente,
            PrixAchat,
            Qte,
            Collection: collectionName,
            Marque,
            urlimg,
            Tva,
            imgArt,
            Unite
        } = req.body;

        // Validation LibArt
        if (!LibArt || LibArt.trim() === '') {
            console.log('⚠️ Validation failed: LibArt is missing or empty');
            return res.status(400).json({
                status: 'error',
                message: 'La désignation (LibArt) est obligatoire'
            });
        }

        // Validation CodArt
        let finalCodArt = CodArt;
        if (!finalCodArt || finalCodArt.trim() === '') {
            const timestamp = Date.now().toString().slice(-6);
            finalCodArt = `ART-${timestamp}`;
            console.log(`ℹ️ No CodArt provided, generated: ${finalCodArt}`);
        }

        const data = {
            IDArt: randomUUID(),
            CodArt: finalCodArt.trim().toUpperCase(),
            LibArt: LibArt.trim(),
            Description: Description || null,
            PrixVente: normalizeNumber(PrixVente),
            PrixAchat: normalizeNumber(PrixAchat),
            Qte: normalizeNumber(Qte),
            Tva: normalizeNumber(Tva, 19),
            Collection: collectionName || 'DIVERS',
            Marque: Marque || null,
            urlimg: req.file ? `/uploads/products/${req.file.filename}` : (urlimg || null),
            imgArt: null,
            Unite: Unite || 'UNI'
        };

        console.log('📝 Attempting to create product in database...');
        const newProduct = await Product.create(data, {
            fields: [
                'IDArt', 'CodArt', 'LibArt', 'Description', 'PrixVente',
                'PrixAchat', 'Qte', 'Collection', 'Marque', 'urlimg', 'Tva', 'Unite'
            ]
        });

        console.log('✅ Product created successfully:', newProduct.IDArt);

        // Récupérer le produit avec ses relations
        const product = await Product.findByPk(newProduct.IDArt, {
            include: [{
                model: Collection,
                as: 'collectionDetail',
                attributes: ['Collection']
            }]
        });

        res.status(201).json({
            status: 'success',
            message: 'Produit créé avec succès',
            data: product
        });
    } catch (error) {
        console.error('❌ [CREATE PRODUCT ERROR]:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                status: 'error',
                message: 'Un produit avec ce code article (CodArt) existe déjà'
            });
        }
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la création du produit',
            error: error.message
        });
    }
};

/**
 * Récupérer tous les produits avec pagination
 */
exports.getAllProducts = async (req, res) => {
    try {
        const { search, page: pageQuery, limit: limitQuery } = req.query;
        const page = parseInt(pageQuery) || 1;
        const limit = parseInt(limitQuery) || 100;
        const offset = (page - 1) * limit;

        console.log(`🔍 Fetching products: page=${page}, limit=${limit}, search=${search || 'none'}`);

        const { Op } = require('sequelize');
        const where = {};
        if (search) {
            where[Op.or] = [
                { LibArt: { [Op.like]: `%${search}%` } },
                { CodArt: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await Product.findAndCountAll({
            attributes: { exclude: ['imgArt'] },
            where,
            include: [{
                model: Collection,
                as: 'collectionDetail',
                attributes: ['Collection']
            }],
            order: [['IDArt', 'DESC']],
            limit: limit,
            offset: offset,
            distinct: true
        });

        res.json({
            status: 'success',
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit)
            },
            data: rows
        });
    } catch (error) {
        console.error('❌ Product list error:', error);
        res.status(500).json({
            status: 'error',
            message: "Erreur lors de la récupération des produits",
            error: error.message
        });
    }
};

/**
 * Récupérer un produit par ID
 */
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            attributes: { exclude: ['imgArt'] },
            include: [{
                model: Collection,
                as: 'collectionDetail'
            }]
        });

        if (!product) {
            return res.status(404).json({
                status: 'error',
                message: "Produit non trouvé"
            });
        }

        res.json({
            status: 'success',
            data: product
        });
    } catch (error) {
        console.error('❌ Product get error:', error);
        res.status(500).json({
            status: 'error',
            message: "Erreur lors de la récupération du produit",
            error: error.message
        });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({
                status: 'error',
                message: "Produit non trouvé"
            });
        }

        console.log('--- [START] updateProduct ---');
        console.log('ID:', id);
        console.log('Headers:', req.headers['content-type']);
        console.log('File:', req.file ? `Received: ${req.file.originalname}` : 'No file received');

        fs.appendFileSync('debug_upload.log', `\n[${new Date().toISOString()}] Update ID: ${id}\nHeaders: ${req.headers['content-type']}\nFile: ${req.file ? req.file.originalname : 'NONE'}\nBody Keys: ${Object.keys(req.body).join(', ')}\n`);

        const updateData = { ...req.body };

        // Normaliser les nombres si présents
        if (updateData.PrixVente !== undefined) updateData.PrixVente = normalizeNumber(updateData.PrixVente);
        if (updateData.PrixAchat !== undefined) updateData.PrixAchat = normalizeNumber(updateData.PrixAchat);
        if (updateData.Qte !== undefined) updateData.Qte = normalizeNumber(updateData.Qte);
        if (updateData.Tva !== undefined) updateData.Tva = normalizeNumber(updateData.Tva, 19);

        // Gérer l'upload d'image
        if (req.file) {
            console.log('🖼️ New image file detected, setting urlimg...');
            // Supprimer l'ancienne image si c'est un fichier local
            if (product.urlimg && product.urlimg.startsWith('/uploads/products/')) {
                const oldImagePath = path.join(__dirname, '../../', product.urlimg);
                if (fs.existsSync(oldImagePath)) {
                    try {
                        fs.unlinkSync(oldImagePath);
                        console.log('🗑️ Deleted old image:', product.urlimg);
                    } catch (err) {
                        console.error('Erreur lors de la suppression de l\'ancienne image:', err);
                    }
                }
            }
            updateData.urlimg = `/uploads/products/${req.file.filename}`;
            console.log('✅ Final urlimg to save:', updateData.urlimg);
        }

        // S'assurer que imgArt n'est pas envoyé (cause des erreurs SQL)
        delete updateData.imgArt;

        console.log('📝 Attempting to update product in database...');
        const [rowsAffected] = await Product.update(updateData, {
            where: { IDArt: id },
            fields: [
                'CodArt', 'LibArt', 'Description', 'PrixVente',
                'PrixAchat', 'Qte', 'Collection', 'Marque', 'urlimg', 'Tva', 'Unite'
            ]
        });

        console.log(`✅ Update result: ${rowsAffected} row(s) affected`);

        if (rowsAffected === 0) {
            console.log('⚠️ No product was updated. Checking if it exists...');
            const exists = await Product.findByPk(id);
            console.log(exists ? 'ℹ️ Product exists but no changes were detected or fields matched' : '❌ Product does not exist');
        }

        const updatedProduct = await Product.findByPk(id);

        res.json({
            status: 'success',
            message: rowsAffected > 0 ? 'Produit mis à jour avec succès' : 'Aucune modification apportée',
            data: updatedProduct
        });
    } catch (error) {
        console.error('❌ Product update error:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                status: 'error',
                message: 'Un produit avec ce code article (CodArt) existe déjà'
            });
        }
        res.status(500).json({
            status: 'error',
            message: "Erreur lors de la mise à jour du produit",
            error: error.message
        });
    }
};

/**
 * Supprimer un produit
 */
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Product.destroy({
            where: { IDArt: id }
        });

        if (deleted) {
            res.json({
                status: 'success',
                message: "Produit supprimé avec succès"
            });
        } else {
            res.status(404).json({
                status: 'error',
                message: "Produit non trouvé"
            });
        }
    } catch (error) {
        console.error('❌ Product delete error:', error);
        res.status(500).json({
            status: 'error',
            message: "Erreur lors de la suppression du produit",
            error: error.message
        });
    }
};
