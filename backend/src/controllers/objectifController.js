const { Objectif, User } = require('../models');
const { sanitizeDate } = require('../utils/helpers');

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
            TypeObjectif
        } = req.body;

        // Validation
        if (!ID_Utilisateur || !Mois || !Annee || !MontantCible) {
            return res.status(400).json({
                status: 'error',
                message: 'L\'utilisateur, le mois, l\'année et le montant cible sont obligatoires'
            });
        }

        // Sanitize dates
        const sanitizedDateDebut = sanitizeDate(DateDebut);
        const sanitizedDateFin = sanitizeDate(DateFin);

        const newObjectif = await Objectif.create({
            ID_Utilisateur: ID_Utilisateur,
            Mois: parseInt(Mois),
            Annee: parseInt(Annee),
            Semaine: Semaine ? parseInt(Semaine) : null,
            DateDebut: sanitizedDateDebut,
            DateFin: sanitizedDateFin,
            MontantCible,
            Montant_Realise_Actuel: Montant_Realise_Actuel || 0,
            TypeObjectif
        });

        res.status(201).json({
            status: 'success',
            message: 'Objectif créé avec succès',
            data: newObjectif
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Récupérer tous les objectifs
 */
exports.getAllObjectifs = async (req, res, next) => {
    try {
        const { userId, mois, annee, semaine } = req.query;
        const where = {};
        if (userId) where.ID_Utilisateur = userId;
        if (mois) where.Mois = mois;
        if (annee) where.Annee = annee;
        if (semaine) where.Semaine = semaine;

        const objectifs = await Objectif.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'utilisateur',
                    attributes: ['UserID', 'FullName', 'LoginName']
                }
            ],
            order: [['Annee', 'DESC'], ['Mois', 'DESC'], ['Semaine', 'DESC']]
        });

        res.status(200).json({
            status: 'success',
            count: objectifs.length,
            data: objectifs
        });
    } catch (error) {
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
            TypeObjectif
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

        await objectif.update({
            Mois: Mois !== undefined ? parseInt(Mois) : objectif.Mois,
            Annee: Annee !== undefined ? parseInt(Annee) : objectif.Annee,
            Semaine: Semaine !== undefined ? parseInt(Semaine) : objectif.Semaine,
            DateDebut: sanitizedDateDebut,
            DateFin: sanitizedDateFin,
            MontantCible: MontantCible || objectif.MontantCible,
            Montant_Realise_Actuel: Montant_Realise_Actuel !== undefined ? Montant_Realise_Actuel : objectif.Montant_Realise_Actuel,
            TypeObjectif: TypeObjectif || objectif.TypeObjectif
        });

        res.status(200).json({
            status: 'success',
            message: 'Objectif mis à jour avec succès',
            data: objectif
        });
    } catch (error) {
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
