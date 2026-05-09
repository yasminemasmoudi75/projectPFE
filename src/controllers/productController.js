const { Product, Collection, TabStockD, sequelize } = require('../models');
const { randomUUID } = require('crypto');
const { Op, QueryTypes, TableHints } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { formatDateForMSSQL } = require('../utils/helpers');
const filterService = require('../services/filterService');

console.log('productController.js loaded');

const normalizeNumber = (value, fallback = 0) => {
    if (value === '' || value === null || value === undefined) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const getCurrentMSSQLDate = () => formatDateForMSSQL(new Date());
const toBool = (value) => value === true || value === 1 || value === '1';

const getFilterVisibilityByRole = async (userRole = 'client') => {
    try {
        const allFilters = await filterService.getFilterVisibilityByRoleAndModule(userRole, 'STOCK');
        console.log('[getFilterVisibilityByRole] filters for ' + userRole + '/STOCK:', JSON.stringify(allFilters, null, 2));
        
        const visibilityMap = {};
        allFilters.forEach(f => {
            visibilityMap[f.key] = f.visible;
        });
        
        const result = {
            all: visibilityMap['all'] === true,
            ok: visibilityMap['ok'] === true,
            low: visibilityMap['low'] === true,
            rupture: visibilityMap['rupture'] === true
        };
        
        console.log('[getFilterVisibilityByRole] Final visibility for ' + userRole + ':', result);
        return result;
    } catch (error) {
        console.error('[getFilterVisibilityByRole] Error:', error.message);
        return { all: true, ok: true, low: true, rupture: true };
    }
};

const buildStockFilterMeta = (rows = [], visibilityOverrides = {}) => {
    const counts = rows.reduce(
        (acc, item) => {
            const q = Number(item?.Qte) || 0;
            if (q === 0) acc.rupture += 1;
            else if (q <= 5) acc.low += 1;
            else acc.ok += 1;
            acc.all += 1;
            return acc;
        },
        { all: 0, ok: 0, low: 0, rupture: 0 }
    );

    console.log('[buildStockFilterMeta] visibilityOverrides:', visibilityOverrides);
    console.log('[buildStockFilterMeta] counts:', counts);

    const getVisible = (key) => {
        const hasOverride = Object.prototype.hasOwnProperty.call(visibilityOverrides, key);
        return hasOverride ? visibilityOverrides[key] === true : false;
    };

    const filterMeta = {
        all: { id: 'all', label: 'Tous', count: counts.all, visible: getVisible('all') },
        ok: { id: 'ok', label: 'Dispo', count: counts.ok, visible: getVisible('ok') },
        low: { id: 'low', label: 'Faible', count: counts.low, visible: getVisible('low') },
        rupture: { id: 'rupture', label: 'Rupture', count: counts.rupture, visible: getVisible('rupture') },
    };

    console.log('[buildStockFilterMeta] Final filterMeta:', JSON.stringify(filterMeta, null, 2));
    return filterMeta;
};

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

exports.createProduct = async (req, res, next) => {
    try {
        console.log('--- [START] createProduct ---');
        const {
            CodArt, LibArt, Description, PrixVente, PrixAchat, Qte, MinStk,
            Collection: collectionName, Marque, LibFam, LibFour, urlimg, Tva, imgArt, Unite
        } = req.body;

        if (!LibArt || LibArt.trim() === '') {
            return res.status(400).json({ status: 'error', message: 'La designation (LibArt) est obligatoire' });
        }

        let finalCodArt = CodArt;
        if (!finalCodArt || finalCodArt.trim() === '') {
            finalCodArt = 'ART-' + Date.now().toString().slice(-6);
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
            urlimg: req.file ? '/uploads/products/' + req.file.filename : (urlimg || null),
            imgArt: null,
            DateUser: now,
            LastDateUpdate: now,
            DateUpdate: now,
            Unite: Unite || 'UNI'
        };

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
        `, { replacements: data });

        const product = await Product.findByPk(data.IDArt, {
            include: [{ model: Collection, as: 'collectionDetail', attributes: ['Collection'] }]
        });

        res.status(201).json({ status: 'success', message: 'Produit cree avec succes', data: product });
    } catch (error) {
        console.error('[CREATE PRODUCT ERROR]:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ status: 'error', message: 'Un produit avec ce code article existe deja' });
        }
        res.status(500).json({ status: 'error', message: 'Erreur lors de la creation du produit', error: error.message });
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        console.log('🚀 [getAllProducts] START');
        console.log('   User:', { id: req.user?.id, role: req.user?.UserRole, email: req.user?.EmailPro });
        
        const filterHelper = require('../utils/filterHelper');
        
        // Module 12 = Products (Table-driven filters from TabRoleFilterVisibility)
        const { where, limit, offset, page } = await filterHelper.applyTableDrivenFiltersWithPagination(
            '12',
            req.query,
            req.user
        );

        console.log('📋 Filter WHERE clause:', JSON.stringify(where, (key, value) => {
            if (typeof value === 'symbol') return value.toString();
            return value;
        }));

        const { count, rows } = await Product.findAndCountAll({
            attributes: { exclude: ['imgArt'] },
            where,
            tableHint: TableHints.NOLOCK,
            limit,
            offset
        });

        console.log(`✅ Found ${rows.length} products (total: ${count})`);
        
        if (rows.length === 0) {
            console.warn('⚠️ ATTENTION: Aucun produit retourné!');
            console.warn('   - Vérifiez les produits en base (SELECT COUNT(*) FROM TabStock)');
            console.warn('   - Vérifiez les filtres de permissions');
            console.warn('   - Vérifiez le rôle utilisateur et ses permissions');
        }

        res.json(
            filterHelper.formatPaginatedResponse(rows, count, page, limit)
        );
    } catch (error) {
        console.error('[Product list error]:', error.message);
        console.error('   Stack:', error.stack);
        console.error('   SQL:', error.sql || 'N/A');
        res.status(500).json({ status: 'error', message: 'Erreur lors de la recuperation des produits', error: error.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            attributes: { exclude: ['imgArt'] },
            include: [{ model: Collection, as: 'collectionDetail' }]
        });

        if (!product) {
            return res.status(404).json({ status: 'error', message: 'Produit non trouve' });
        }

        res.json({ status: 'success', data: product });
    } catch (error) {
        console.error('[Product get error]:', error);
        res.status(500).json({ status: 'error', message: 'Erreur lors de la recuperation du produit', error: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({ status: 'error', message: 'Produit non trouve' });
        }

        const updateData = { ...req.body };

        if (updateData.PrixVente !== undefined) updateData.PrixVente = normalizeNumber(updateData.PrixVente);
        if (updateData.PrixAchat !== undefined) updateData.PrixAchat = normalizeNumber(updateData.PrixAchat);
        if (updateData.Qte !== undefined) updateData.Qte = normalizeNumber(updateData.Qte);
        if (updateData.MinStk !== undefined) updateData.MinStk = normalizeNumber(updateData.MinStk);
        if (updateData.Tva !== undefined) updateData.Tva = normalizeNumber(updateData.Tva, 19);
        updateData.LastDateUpdate = getCurrentMSSQLDate();
        updateData.DateUpdate = getCurrentMSSQLDate();

        if (req.file) {
            if (product.urlimg && product.urlimg.startsWith('/uploads/products/')) {
                const oldImagePath = path.join(__dirname, '../../', product.urlimg);
                if (fs.existsSync(oldImagePath)) {
                    try { fs.unlinkSync(oldImagePath); } catch (err) { console.error('Error deleting old image:', err); }
                }
            }
            updateData.urlimg = '/uploads/products/' + req.file.filename;
        }

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
                updates.push('[' + column + '] = :' + field);
                replacements[field] = updateData[field];
            }
        });

        await sequelize.query('UPDATE [TabStock] SET ' + updates.join(', ') + ' WHERE [IDArt] = :IDArt', { replacements });

        const updatedProduct = await Product.findByPk(id);

        res.json({ status: 'success', message: 'Produit mis a jour avec succes', data: updatedProduct });
    } catch (error) {
        console.error('[Product update error]:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ status: 'error', message: 'Un produit avec ce code article existe deja' });
        }
        res.status(500).json({ status: 'error', message: 'Erreur lors de la mise a jour du produit', error: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Product.destroy({ where: { IDArt: id } });

        if (deleted) {
            res.json({ status: 'success', message: 'Produit supprime avec succes' });
        } else {
            res.status(404).json({ status: 'error', message: 'Produit non trouve' });
        }
    } catch (error) {
        console.error('[Product delete error]:', error);
        res.status(500).json({ status: 'error', message: 'Erreur lors de la suppression du produit', error: error.message });
    }
};

exports.getProductVariants = async (req, res) => {
    try {
        const { id } = req.params;
        const variants = await TabStockD.findAll({ where: { IDArt: id }, order: [['ID', 'ASC']] });
        res.json({ status: 'success', data: variants });
    } catch (error) {
        console.error('[getProductVariants error]:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.saveProductVariants = async (req, res) => {
    try {
        const { id } = req.params;
        const { variants } = req.body;

        if (!Array.isArray(variants)) {
            return res.status(400).json({ status: 'error', message: 'variants doit etre un tableau' });
        }

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ status: 'error', message: 'Produit non trouve' });
        }

        await TabStockD.destroy({ where: { IDArt: id } });

        const created = [];
        for (const v of variants) {
            if (!v.CodArtD && !v.CodColor && !v.Taille) continue;
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

        res.json({ status: 'success', data: created, message: created.length + ' variante(s) sauvegardee(s)' });
    } catch (error) {
        console.error('[saveProductVariants error]:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.deleteProductVariant = async (req, res) => {
    try {
        const { variantId } = req.params;
        await TabStockD.destroy({ where: { ID: variantId } });
        res.json({ status: 'success', message: 'Variante supprimee' });
    } catch (error) {
        console.error('[deleteProductVariant error]:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};
