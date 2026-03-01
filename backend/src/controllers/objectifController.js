const { Objectif, User, Tiers, Projet } = require('../models');
const { sanitizeDate } = require('../utils/helpers');
const { sequelize } = require('../config/database');

/**
 * Créer un nouvel objectif
 */
exports.createObjectif = async (req, res, next) => {
    try {
        const {
            ID_Utilisateur,
            Mois,
            Annee,
            Semaine,
            DateDebut,
            DateFin,
            MontantCible,
            Montant_Realise_Actuel,
            TypeObjectif,
            TypePeriode,
            Libelle_Indicateur,
            Statut,
            ID_Objectif_Parent
        } = req.body;

        // Validation selon le type de période
        if (TypePeriode === 'Mensuel') {
            if (!ID_Utilisateur || !Mois || !Annee || MontantCible === undefined || MontantCible === null) {
                return res.status(400).json({
                    status: 'error',
                    message: 'L\'utilisateur, le mois, l\'année et le montant cible sont obligatoires pour un objectif mensuel'
                });
            }
        } else if (TypePeriode === 'Hebdomadaire') {
            if (!ID_Utilisateur || !Semaine || !DateDebut || !DateFin) {
                return res.status(400).json({
                    status: 'error',
                    message: 'L\'utilisateur, la semaine, la date de début et la date de fin sont obligatoires pour un objectif hebdomadaire'
                });
            }
        }

        // Sanitize dates
        const sanitizedDateDebut = sanitizeDate(DateDebut);
        const sanitizedDateFin = sanitizeDate(DateFin);

        const newObjectif = await Objectif.create({
            ID_Utilisateur: ID_Utilisateur,
            Mois: Mois ? parseInt(Mois) : null,
            Annee: Annee ? parseInt(Annee) : null,
            Semaine: Semaine || null,
            DateDebut: sanitizedDateDebut,
            DateFin: sanitizedDateFin,
            MontantCible: MontantCible !== undefined ? parseFloat(MontantCible) : 0,
            Montant_Realise_Actuel: Montant_Realise_Actuel !== undefined ? parseFloat(Montant_Realise_Actuel) : 0,
            TypeObjectif: TypeObjectif || null,
            TypePeriode: TypePeriode || 'Mensuel',
            Libelle_Indicateur,
            Statut: Statut || 'En cours',
            ID_Objectif_Parent: ID_Objectif_Parent || null
        });

        res.status(201).json({
            status: 'success',
            message: 'Objectif créé avec succès',
            data: newObjectif
        });
    } catch (error) {
        console.error('❌ Erreur création objectif:', error);
        next(error);
    }
};

/**
 * Récupérer tous les objectifs
 */
exports.getAllObjectifs = async (req, res, next) => {
    try {
        const { userId, mois, annee, semaine, tiersId, projetId, typePeriode } = req.query;
        const where = {};
        if (userId) where.ID_Utilisateur = userId;
        if (mois) where.Mois = mois;
        if (annee) where.Annee = annee;
        if (semaine) where.Semaine = semaine;
        if (typePeriode) where.TypePeriode = typePeriode;

        const objectifs = await Objectif.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'utilisateur',
                    attributes: ['UserID', 'FullName', 'LoginName'],
                    required: false // LEFT JOIN to avoid errors if user not found
                }
            ],
            order: [
                ['ID_Objectif', 'DESC'] // Tri simple par ID décroissant
            ]
        });

        res.status(200).json({
            status: 'success',
            count: objectifs.length,
            data: objectifs
        });
    } catch (error) {
        console.error('❌ Erreur récupération objectifs:', error);
        next(error);
    }
};

/**
 * Récupérer un objectif par ID
 */
exports.getObjectifById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const objectif = await Objectif.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'utilisateur',
                    attributes: ['UserID', 'FullName', 'LoginName']
                }
            ]
        });

        if (!objectif) {
            return res.status(404).json({
                status: 'error',
                message: 'Objectif non trouvé'
            });
        }

        res.status(200).json({
            status: 'success',
            data: objectif
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Mettre à jour un objectif
 */
exports.updateObjectif = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            Mois,
            Annee,
            Semaine,
            DateDebut,
            DateFin,
            MontantCible,
            Montant_Realise_Actuel,
            TypeObjectif,
            TypePeriode,
            Libelle_Indicateur,
            Statut,
            ID_Objectif_Parent
        } = req.body;

        const objectif = await Objectif.findByPk(id);

        if (!objectif) {
            return res.status(404).json({
                status: 'error',
                message: 'Objectif non trouvé'
            });
        }

        // Sanitize dates if provided
        const sanitizedDateDebut = DateDebut !== undefined ? sanitizeDate(DateDebut) : objectif.DateDebut;
        const sanitizedDateFin = DateFin !== undefined ? sanitizeDate(DateFin) : objectif.DateFin;

        // Helper to safely parse int or return null
        const safeInt = (val) => {
            if (val === null || val === undefined || val === '') return null;
            const parsed = parseInt(val);
            return isNaN(parsed) ? null : parsed;
        };

        await objectif.update({
            Mois: Mois !== undefined ? safeInt(Mois) : objectif.Mois,
            Annee: Annee !== undefined ? safeInt(Annee) : objectif.Annee,
            Semaine: Semaine !== undefined ? Semaine : objectif.Semaine,
            DateDebut: sanitizedDateDebut,
            DateFin: sanitizedDateFin,
            MontantCible: MontantCible !== undefined ? MontantCible : objectif.MontantCible,
            Montant_Realise_Actuel: Montant_Realise_Actuel !== undefined ? Montant_Realise_Actuel : objectif.Montant_Realise_Actuel,
            TypeObjectif: TypeObjectif || objectif.TypeObjectif,
            TypePeriode: TypePeriode || objectif.TypePeriode,
            Libelle_Indicateur: Libelle_Indicateur !== undefined ? Libelle_Indicateur : objectif.Libelle_Indicateur,
            Statut: Statut !== undefined ? Statut : objectif.Statut,
            ID_Objectif_Parent: ID_Objectif_Parent !== undefined ? safeInt(ID_Objectif_Parent) : objectif.ID_Objectif_Parent
        });

        res.status(200).json({
            status: 'success',
            message: 'Objectif mis à jour avec succès',
            data: objectif
        });
    } catch (error) {
        console.error('❌ Erreur updateObjectif:', error);
        next(error);
    }
};

/**
 * Supprimer un objectif
 */
exports.deleteObjectif = async (req, res, next) => {
    try {
        const { id } = req.params;
        const objectif = await Objectif.findByPk(id);

        if (!objectif) {
            return res.status(404).json({
                status: 'error',
                message: 'Objectif non trouvé'
            });
        }

        await objectif.destroy();

        res.status(200).json({
            status: 'success',
            message: 'Objectif supprimé avec succès'
        });
    } catch (error) {
        next(error);
    }
};
