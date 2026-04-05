const { Objectif, User } = require('../models');
const { Op } = require('sequelize');

const normalizeInteger = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
};

const normalizeDecimal = (value, fallback = 0) => {
    if (value === undefined || value === null || value === '') return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeDateOnly = (value) => {
    if (!value || value === 'null' || value === 'undefined') return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
};

const resolveUserForObjectif = async (userId) => {
    const normalizedUserId = normalizeInteger(userId);
    if (!normalizedUserId) return null;

    const user = await User.findByPk(normalizedUserId);
    if (!user) {
        return { error: `Utilisateur introuvable pour ID_Utilisateur=${userId}` };
    }
    if (!user.GUID) {
        return { error: `Le commercial #${normalizedUserId} ne possède pas de GUID ERP` };
    }

    return { user, normalizedUserId };
};

const objectifInclude = [
    {
        model: User,
        as: 'utilisateur',
        attributes: ['UserID', 'FullName', 'EmailPro', 'GUID'],
        required: false
    }
];

const hydrateObjectif = async (id) => Objectif.findByPk(id, {
    include: objectifInclude
});

const isCommercialRole = (role) => {
    const normalized = String(role || '').trim().toLowerCase();
    return normalized === 'commercial' || normalized === 'commerciale';
};

const buildCommercialObjectifScope = (user = {}) => {
    const userId = normalizeInteger(user?.UserID || user?.id);
    const guid = user?.GUID ? String(user.GUID) : null;

    if (!userId && !guid) {
        return { ID_Objectif: '__NO_MATCH__' };
    }

    const scopes = [];
    if (userId) scopes.push({ ID_Utilisateur: userId });
    if (guid) scopes.push({ IdCont: guid });

    return scopes.length === 1 ? scopes[0] : { [Op.or]: scopes };
};

const isObjectifRelatedToCommercial = (objectif, user = {}) => {
    const userId = normalizeInteger(user?.UserID || user?.id);
    const objectifUserId = normalizeInteger(objectif?.ID_Utilisateur);
    const userGuid = user?.GUID ? String(user.GUID).toLowerCase() : null;
    const objectifGuid = objectif?.IdCont ? String(objectif.IdCont).toLowerCase() : null;

    return (userId && objectifUserId && userId === objectifUserId)
        || (userGuid && objectifGuid && userGuid === objectifGuid);
};

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

        const effectiveUserId = isCommercialRole(req.user?.UserRole)
            ? (req.user?.UserID || req.user?.id)
            : ID_Utilisateur;

        void ID_Objectif_Parent;

        // Validation selon le type de période
        if (TypePeriode === 'Mensuel') {
            if (!effectiveUserId || !Mois || !Annee || MontantCible === undefined || MontantCible === null) {
                return res.status(400).json({
                    status: 'error',
                    message: 'L\'utilisateur, le mois, l\'année et le montant cible sont obligatoires pour un objectif mensuel'
                });
            }
        } else if (TypePeriode === 'Hebdomadaire') {
            if (!effectiveUserId || !Semaine || !DateDebut || !DateFin) {
                return res.status(400).json({
                    status: 'error',
                    message: 'L\'utilisateur, la semaine, la date de début et la date de fin sont obligatoires pour un objectif hebdomadaire'
                });
            }
        }

        const resolvedUser = await resolveUserForObjectif(effectiveUserId);
        if (resolvedUser?.error) {
            return res.status(400).json({
                status: 'error',
                message: resolvedUser.error
            });
        }

        const sanitizedDateDebut = normalizeDateOnly(DateDebut);
        const sanitizedDateFin = normalizeDateOnly(DateFin);

        const newObjectif = await Objectif.create({
            IdCont: resolvedUser?.user?.GUID || null,
            ID_Utilisateur: resolvedUser?.normalizedUserId || null,
            Mois: TypePeriode === 'Mensuel' ? normalizeInteger(Mois) : null,
            Annee: TypePeriode === 'Mensuel'
                ? normalizeInteger(Annee)
                : normalizeInteger(Annee) || normalizeInteger(sanitizedDateDebut?.slice(0, 4)),
            Semaine: TypePeriode === 'Hebdomadaire' ? Semaine : null,
            DateDebut: TypePeriode === 'Hebdomadaire' ? sanitizedDateDebut : null,
            DateFin: TypePeriode === 'Hebdomadaire' ? sanitizedDateFin : null,
            MontantCible: normalizeDecimal(MontantCible, 0),
            Montant_Realise_Actuel: normalizeDecimal(Montant_Realise_Actuel, 0),
            TypeObjectif: TypeObjectif || null,
            TypePeriode: TypePeriode || 'Mensuel',
            Libelle_Indicateur: Libelle_Indicateur || null
        });

        const hydratedObjectif = await hydrateObjectif(newObjectif.ID_Objectif);

        res.status(201).json({
            status: 'success',
            message: 'Objectif créé avec succès',
            data: hydratedObjectif || newObjectif
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
        const { userId, mois, annee, semaine, tiersId, projetId } = req.query;
        const where = isCommercialRole(req.user?.UserRole)
            ? buildCommercialObjectifScope(req.user)
            : {};

        void tiersId;
        void projetId;

        if (userId && !isCommercialRole(req.user?.UserRole)) {
            const resolvedUser = await resolveUserForObjectif(userId);
            if (resolvedUser?.error) {
                return res.status(200).json({
                    status: 'success',
                    count: 0,
                    data: []
                });
            }
            where.IdCont = resolvedUser.user.GUID;
        }
        if (mois) where.Mois = String(mois);
        if (annee) where.Annee = String(annee);
        if (semaine) where.Numsem = normalizeInteger(semaine);

        const objectifs = await Objectif.findAll({
            where,
            include: objectifInclude,
            order: [
                ['DateDebut', 'DESC'],
                ['ID_Objectif', 'DESC']
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
        const objectif = await hydrateObjectif(id);

        if (!objectif) {
            return res.status(404).json({
                status: 'error',
                message: 'Objectif non trouvé'
            });
        }

        if (isCommercialRole(req.user?.UserRole) && !isObjectifRelatedToCommercial(objectif, req.user)) {
            return res.status(403).json({
                status: 'error',
                message: 'Accès refusé à cet objectif'
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
            // ID_Objectif_Parent
        } = req.body;

        void Statut;

        const objectif = await Objectif.findByPk(id);

        if (!objectif) {
            return res.status(404).json({
                status: 'error',
                message: 'Objectif non trouvé'
            });
        }

        if (isCommercialRole(req.user?.UserRole) && !isObjectifRelatedToCommercial(objectif, req.user)) {
            return res.status(403).json({
                status: 'error',
                message: 'Accès refusé à cet objectif'
            });
        }

        let resolvedUser = null;
        if (ID_Utilisateur !== undefined && !isCommercialRole(req.user?.UserRole)) {
            resolvedUser = await resolveUserForObjectif(ID_Utilisateur);
            if (resolvedUser?.error) {
                return res.status(400).json({
                    status: 'error',
                    message: resolvedUser.error
                });
            }
        }

        const nextTypePeriode = TypePeriode || objectif.TypePeriode || 'Mensuel';
        const sanitizedDateDebut = DateDebut !== undefined ? normalizeDateOnly(DateDebut) : objectif.DateDebut;
        const sanitizedDateFin = DateFin !== undefined ? normalizeDateOnly(DateFin) : objectif.DateFin;

        await objectif.update({
            IdCont: resolvedUser?.user?.GUID || objectif.IdCont,
            ID_Utilisateur: resolvedUser?.normalizedUserId ?? objectif.ID_Utilisateur,
            Mois: nextTypePeriode === 'Mensuel'
                ? (Mois !== undefined ? normalizeInteger(Mois) : objectif.Mois)
                : null,
            Annee: Annee !== undefined
                ? normalizeInteger(Annee)
                : (nextTypePeriode === 'Hebdomadaire'
                    ? (normalizeInteger(sanitizedDateDebut?.slice(0, 4)) || objectif.Annee)
                    : objectif.Annee),
            Semaine: nextTypePeriode === 'Hebdomadaire'
                ? (Semaine !== undefined ? Semaine : objectif.Semaine)
                : null,
            DateDebut: nextTypePeriode === 'Hebdomadaire' ? sanitizedDateDebut : null,
            DateFin: nextTypePeriode === 'Hebdomadaire' ? sanitizedDateFin : null,
            MontantCible: MontantCible !== undefined ? normalizeDecimal(MontantCible, 0) : objectif.MontantCible,
            Montant_Realise_Actuel: Montant_Realise_Actuel !== undefined ? normalizeDecimal(Montant_Realise_Actuel, 0) : objectif.Montant_Realise_Actuel,
            TypeObjectif: TypeObjectif || objectif.TypeObjectif,
            TypePeriode: nextTypePeriode,
            Libelle_Indicateur: Libelle_Indicateur !== undefined ? Libelle_Indicateur : objectif.Libelle_Indicateur,
            // ID_Objectif_Parent: ID_Objectif_Parent !== undefined ? safeInt(ID_Objectif_Parent) : objectif.ID_Objectif_Parent
        });

        const hydratedObjectif = await hydrateObjectif(id);

        res.status(200).json({
            status: 'success',
            message: 'Objectif mis à jour avec succès',
            data: hydratedObjectif || objectif
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

        if (isCommercialRole(req.user?.UserRole) && !isObjectifRelatedToCommercial(objectif, req.user)) {
            return res.status(403).json({
                status: 'error',
                message: 'Accès refusé à cet objectif'
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
