const { Category, Collection } = require('../models');

// Category Controllers (TabCategorie)
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des catégories", error: error.message });
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) return res.status(404).json({ message: "Catégorie non trouvée" });
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération de la catégorie", error: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const category = await Category.create(req.body);
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la création de la catégorie", error: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const [updated] = await Category.update(req.body, { where: { ID: req.params.id } });
        if (updated) {
            const updatedCategory = await Category.findByPk(req.params.id);
            res.json(updatedCategory);
        } else {
            res.status(404).json({ message: "Catégorie non trouvée" });
        }
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la mise à jour de la catégorie", error: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const deleted = await Category.destroy({ where: { ID: req.params.id } });
        if (deleted) res.json({ message: "Catégorie supprimée" });
        else res.status(404).json({ message: "Catégorie non trouvée" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
    }
};

// Collection Controllers (TabCollection) - Often used as Product Family
exports.getAllCollections = async (req, res) => {
    try {
        const collections = await Collection.findAll();
        res.json(collections);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des collections", error: error.message });
    }
};

exports.createCollection = async (req, res) => {
    try {
        const collection = await Collection.create(req.body);
        res.status(201).json(collection);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la création de la collection", error: error.message });
    }
};
