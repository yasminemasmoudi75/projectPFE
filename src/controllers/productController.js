const { Product, Collection, TabStockD, sequelize } = require('../models');
const { randomUUID } = require('crypto');
const { Op, QueryTypes, TableHints } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { formatDateForMSSQL } = require('../utils/helpers');

console.log('✅ productController.js loaded');

/**
 * Normaliser les données numériques
 */
const normalizeNumber = (value, fallback = 0) => {
    if (value === '' || value === null || value === undefined) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const getCurrentMSSQLDate = () => formatDateForMSSQL(new Date());

const PRODUCT_UPDATE_COLUMN_MAP = {
    CodArt: 'CodArt',
    LibArt: 'LibArt',
    Description: 'ExLibArt',
    PrixVente: 'PrixVente',
    PrixAchat: 'PrixAvhat',
    Qte: 'Qte',
    MinStk: 'MinStk',
    Collection: 'Collection',
    Marque: 'Marque',
    LibFam: 'LibFam',
    LibFour: 'LibFour',
    urlimg: 'urlimg',
    Tva: 'Tva',
    Unite: 'Unite',
    LastDateUpdate: 'LastDateUpdate',
    DateUpdate: 'DateUpdate'
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
            MinStk,
            Collection: collectionName,
            Marque,
            LibFam,
            LibFour,
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

        const now = getCurrentMSSQLDate();

        const data = {
            IDArt: randomUUID(),
            CodArt: finalCodArt.trim().toUpperCase(),
            LibArt: LibArt.trim(),
            Description: Description || null,
            PrixVente: normalizeNumber(PrixVente),
            PrixAchat: normalizeNumber(PrixAchat),
            Qte: normalizeNumber(Qte),
            MinStk: normalizeNumber(MinStk),
            Tva: normalizeNumber(Tva, 19),
            Collection: collectionName || 'DIVERS',
            Marque: Marque || null,
            LibFam: LibFam || null,
            LibFour: LibFour || null,
            urlimg: req.file ? `/uploads/products/${req.file.filename}` : (urlimg || null),
            imgArt: null,
            DateUser: now,
            LastDateUpdate: now,
            DateUpdate: now,
            Unite: Unite || 'UNI'
        };

        console.log('📝 Attempting to create product in database...');
        await sequelize.query(`
            INSERT INTO [TabStock] (
                [IDArt], [CodArt], [LibArt], [ExLibArt], [PrixVente], [PrixAvhat],
                [Qte], [MinStk], [Collection], [Marque], [LibFam], [LibFour], [urlimg], [Tva], [Unite],
                [DateUser], [LastDateUpdate], [DateUpdate]
            ) VALUES (
                :IDArt, :CodArt, :LibArt, :Description, :PrixVente, :PrixAchat,
                :Qte, :MinStk, :Collection, :Marque, :LibFam, :LibFour, :urlimg, :Tva, :Unite,
                :DateUser, :LastDateUpdate, :DateUpdate
            )
        `, {
            replacements: data
        });

        console.log('✅ Product created successfully:', data.IDArt);

        // Récupérer le produit avec ses relations
        const product = await Product.findByPk(data.IDArt, {
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
        const { search, page: pageQuery, limit: limitQuery, sort = 'recent' } = req.query;
        const page = Math.max(parseInt(pageQuery, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(limitQuery, 10) || 100, 1), 200);
        const offset = (page - 1) * limit;

        console.log(`🔍 Fetching products: page=${page}, limit=${limit}, search=${search || 'none'}, sort=${sort}`);

        if (sort === 'recent' && page === 1) {
            const searchFilter = search
                ? 'WHERE ([LibArt] LIKE :search OR [CodArt] LIKE :search)'
                : '';

            const rows = await sequelize.query(`
                SELECT TOP ${limit}
                    [IDArt],
                    [CodArt],
                    [LibArt],
                    [ExLibArt] AS [Description],
                    [PrixVente],
                    [PrixAvhat] AS [PrixAchat],
                    [Qte],
                    [MinStk],
                    [Collection],
                    [Marque],
                    [LibFam],
                    [LibFour],
                    [urlimg],
                    [DateUser],
                    [LastDateUpdate],
                    [DateUpdate],
                    [Tva],
                    [Unite]
                FROM [TabStock] WITH (NOLOCK)
                ${searchFilter}
                ORDER BY [DateUser] DESC, [LastDateUpdate] DESC, [IDArt] DESC;
            `, {
                replacements: search ? { search: `%${search}%` } : {},
                type: QueryTypes.SELECT
            });

            return res.json({
                status: 'success',
                data: rows
            });
        }

        const where = {};
        if (search) {
            where[Op.or] = [
                { LibArt: { [Op.like]: `%${search}%` } },
                { CodArt: { [Op.like]: `%${search}%` } }
            ];
        }

        const order = sort === 'recent'
            ? [
                ['DateUser', 'DESC'],
                ['LastDateUpdate', 'DESC'],
                ['IDArt', 'DESC']
            ]
            : [['CodArt', 'ASC']];

        const rows = await Product.findAll({
            attributes: { exclude: ['imgArt'] },
            where,
            tableHint: TableHints.NOLOCK,
            order,
            limit: limit,
            offset: offset
        });

        res.json({
            status: 'success',
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
        if (updateData.MinStk !== undefined) updateData.MinStk = normalizeNumber(updateData.MinStk);
        if (updateData.Tva !== undefined) updateData.Tva = normalizeNumber(updateData.Tva, 19);
        updateData.LastDateUpdate = getCurrentMSSQLDate();
        updateData.DateUpdate = getCurrentMSSQLDate();

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

        if (updateData.CodArt !== undefined && updateData.CodArt !== null) {
            updateData.CodArt = String(updateData.CodArt).trim().toUpperCase();
        }

        if (updateData.LibArt !== undefined && updateData.LibArt !== null) {
            updateData.LibArt = String(updateData.LibArt).trim();
        }

        const updates = [];
        const replacements = { IDArt: id };

        Object.entries(PRODUCT_UPDATE_COLUMN_MAP).forEach(([field, column]) => {
            if (updateData[field] !== undefined) {
                updates.push(`[${column}] = :${field}`);
                replacements[field] = updateData[field];
            }
        });

        console.log('📝 Attempting to update product in database...');
        await sequelize.query(`
            UPDATE [TabStock]
            SET ${updates.join(', ')}
            WHERE [IDArt] = :IDArt
        `, {
            replacements
        });

        console.log('✅ Product updated successfully');

        const updatedProduct = await Product.findByPk(id);

        res.json({
            status: 'success',
            message: 'Produit mis à jour avec succès',
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

/**
 * Récupérer les variantes (TabStockD) d'un produit
 */
exports.getProductVariants = async (req, res) => {
    try {
        const { id } = req.params;
        const variants = await TabStockD.findAll({
            where: { IDArt: id },
            order: [['ID', 'ASC']]
        });
        res.json({ status: 'success', data: variants });
    } catch (error) {
        console.error('❌ getProductVariants error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Sauvegarder les variantes (TabStockD) d'un produit (remplace toutes les variantes)
 */
exports.saveProductVariants = async (req, res) => {
    try {
        const { id } = req.params;
        const { variants } = req.body;

        if (!Array.isArray(variants)) {
            return res.status(400).json({ status: 'error', message: 'variants doit être un tableau' });
        }

        // Vérifier que le produit existe
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ status: 'error', message: 'Produit non trouvé' });
        }

        // Supprimer les anciennes variantes
        await TabStockD.destroy({ where: { IDArt: id } });

        // Créer les nouvelles variantes
        const created = [];
        for (const v of variants) {
            if (!v.CodArtD && !v.CodColor && !v.Taille) continue; // Ignorer lignes vides
            const row = await TabStockD.create({
                IDArt: id,
                CodArt: product.CodArt,
                CodArtD: v.CodArtD || null,
                CodColor: v.CodColor || null,
                CodTaille: v.CodTaille || null,
                Taille: v.Taille || null,
                DesColor: v.DesColor || null,
                Qte: Number(v.Qte) || 0
            });
            created.push(row);
        }

        res.json({ status: 'success', data: created, message: `${created.length} variante(s) sauvegardée(s)` });
    } catch (error) {
        console.error('❌ saveProductVariants error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Supprimer une variante par ID
 */
exports.deleteProductVariant = async (req, res) => {
    try {
        const { variantId } = req.params;
        await TabStockD.destroy({ where: { ID: variantId } });
        res.json({ status: 'success', message: 'Variante supprimée' });
    } catch (error) {
        console.error('❌ deleteProductVariant error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};
