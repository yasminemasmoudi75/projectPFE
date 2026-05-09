const { Objectif, User } = require('../models');
const { Op } = require('sequelize');
const { normalizeRole, canFlag } = require('../utils/userAccess');

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

const extractWeekNumber = (value) => {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : null;
    const match = String(value).match(/([0-9]+)/);
    return match ? parseInt(match[1], 10) : null;
};

const getISOWeekRange = (weekNumber, year) => {
    const week = Number(weekNumber);
    const isoYear = Number(year);
    if (!Number.isInteger(week) || !Number.isInteger(isoYear) || week < 1 || week > 53) {
        return { startDate: null, endDate: null };
    }

    const fourthJanuary = new Date(Date.UTC(isoYear, 0, 4));
    const dayOfWeek = fourthJanuary.getUTCDay() || 7;
    const mondayWeek1 = new Date(fourthJanuary);
    mondayWeek1.setUTCDate(fourthJanuary.getUTCDate() - dayOfWeek + 1);

    const start = new Date(mondayWeek1);
    start.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);

    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);

    const toDateOnly = (date) => date.toISOString().split('T')[0];
    return { startDate: toDateOnly(start), endDate: toDateOnly(end) };
};

const buildWeeklyPeriod = ({ Semaine, Numsem, Annee, DateDebut, DateFin }) => {
    const weekNumber = extractWeekNumber(Numsem ?? Semaine);
    const year = normalizeInteger(Annee) || new Date().getFullYear();
    const computedRange = getISOWeekRange(weekNumber, year);

    return {
        Numsem: weekNumber,
        Semaine: weekNumber ? `Semaine ${weekNumber}` : (Semaine || null),
        DateDebut: normalizeDateOnly(DateDebut) || computedRange.startDate,
        DateFin: normalizeDateOnly(DateFin) || computedRange.endDate,
        Annee: year
    };
};

const calculateRealisedForObjectif = async (objectif) => {
    try {
        if (!objectif || !objectif.IdCont) return 0;

        const { sequelize } = require('../models');

        // Resolve commercial identifier: IdCont may be a GUID (User.GUID) or a numeric rep id
        let commercialIdForQuery = objectif.IdCont;
        try {
            const { User } = require('../models');
            if (isValidUUID(String(objectif.IdCont || ''))) {
                const user = await User.findOne({ where: { GUID: String(objectif.IdCont).trim() } });
                if (user && user.UserID) commercialIdForQuery = String(user.UserID);
            }
        } catch (e) {
            // ignore resolution errors and fall back to raw IdCont
        }

        let startDate, endDate;
        if (objectif.TypePeriode === 'Mensuel' || (!objectif.TypePeriode && objectif.Mois)) {
            const year  = parseInt(objectif.Annee, 10);
            const month = parseInt(objectif.Mois,  10);
            if (!year || !month) return 0;

            // startDate = MAX(1er du mois, date de création de l'objectif)
            const firstOfMonth = new Date(year, month - 1, 1);
            
            // Handle DateCreation - could be Date object or string
            let dateCreation = null;
            if (objectif.DateCreation) {
                if (objectif.DateCreation instanceof Date) {
                    dateCreation = new Date(objectif.DateCreation.getTime());
                } else {
                    dateCreation = new Date(objectif.DateCreation);
                }
                // Validate the date
                if (!isNaN(dateCreation.getTime())) {
                    // Do not strip the time, keep exact DateCreation time
                } else {
                    dateCreation = null;
                }
            }

            startDate = (dateCreation && dateCreation > firstOfMonth)
                ? dateCreation
                : firstOfMonth;

            endDate = new Date(year, month, 0, 23, 59, 59, 999);
        } else if (objectif.TypePeriode === 'Hebdomadaire') {
            if (!objectif.DateDebut || !objectif.DateFin) return 0;

            const weekStart = new Date(objectif.DateDebut);
            
            // Handle DateCreation - could be Date object or string
            let dateCreation = null;
            if (objectif.DateCreation) {
                if (objectif.DateCreation instanceof Date) {
                    dateCreation = new Date(objectif.DateCreation.getTime());
                } else {
                    dateCreation = new Date(objectif.DateCreation);
                }
                // Validate the date
                if (!isNaN(dateCreation.getTime())) {
                    // Do not strip the time, keep exact DateCreation time
                } else {
                    dateCreation = null;
                }
            }

            startDate = (dateCreation && dateCreation > weekStart)
                ? dateCreation
                : weekStart;

            endDate = new Date(objectif.DateFin);
            endDate.setHours(23, 59, 59, 999);
        } else {
            return 0; // TypePeriode invalide ou non supporté
        }

        // Règle métier : 
        // 1. Si l'objectif est ARCHIVÉ et a une DateArchivage, il s'arrête à cette date.
        // 2. S'il n'est pas ARCHIVÉ, il accumule indéfiniment jusqu'à ce qu'un nouvel objectif soit créé (qui l'archivera).
        if (String(objectif.StatutObjectif || '').toUpperCase() === 'ARCHIVÉ' && objectif.DateArchivage) {
            endDate = new Date(objectif.DateArchivage);
        } else if (String(objectif.StatutObjectif || '').toUpperCase() !== 'ARCHIVÉ') {
            endDate = new Date(2100, 11, 31, 23, 59, 59, 999);
        }

        const fmt = (d) => {
            if (!d || !(d instanceof Date) || isNaN(d.getTime())) {
                console.error('❌ Invalid date passed to fmt:', d);
                throw new Error(`Invalid date object: ${d}`);
            }
            const z = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
        };
        
        try {
            var sd = (startDate instanceof Date && !isNaN(startDate.getTime())) ? fmt(startDate) : String(startDate);
            var ed = (endDate instanceof Date && !isNaN(endDate.getTime())) ? fmt(endDate) : String(endDate);
        } catch (dateError) {
            console.error('❌ Date formatting error for objectif', objectif.ID_Objectif, ':', dateError.message);
            console.error('   startDate:', startDate, 'endDate:', endDate);
            throw dateError;
        }

        const codTiers = objectif.CodTiers
            || objectif.getDataValue?.('CodTiers')
            || null;

        if (codTiers && String(codTiers).trim() !== '') {
            const queryByTiers = `
                SELECT SUM(r.MntReg) AS total
                FROM TabReg r
                WHERE r.CodTiers = :codTiers
                    AND r.Payed = 1
                    AND r.DatReg >= :startDate
                    AND r.DatReg <= :endDate
            `;

            const results = await sequelize.query(queryByTiers, {
                replacements: {
                    codTiers: String(codTiers).trim(),
                    startDate: sd,
                    endDate: ed
                },
                type: sequelize.QueryTypes.SELECT
            });

            const total = results?.[0]?.total ?? results?.[0]?.TOTAL ?? results?.[0]?.Total ?? 0;
            console.log('Calcul réalisé pour objectif', objectif.ID_Objectif, 'commercial:', commercialIdForQuery, 'CodTiers:', String(codTiers).trim(), 'période:', sd, '->', ed, 'résultat:', total);
            return Number.isFinite(Number(total)) ? parseFloat(total) : 0;
        }

                const query = `
                    SELECT SUM(r.MntReg) AS total
                    FROM TabReg r
                    LEFT JOIN TabTiers t ON r.CodTiers = t.CodTiers
                    WHERE (
                        LOWER(LTRIM(RTRIM(CONVERT(NVARCHAR(200), t.codRepresTiers)))) = LOWER(LTRIM(RTRIM(:commercialId)))
                        OR (
                            TRY_CONVERT(INT, t.codRepresTiers) IS NOT NULL
                            AND TRY_CONVERT(INT, :commercialId) IS NOT NULL
                            AND TRY_CONVERT(INT, t.codRepresTiers) = TRY_CONVERT(INT, :commercialId)
                        )
                    )
                        AND r.Payed = 1
                        AND r.DatReg >= :startDate
                        AND r.DatReg <= :endDate
                `;

                const results = await sequelize.query(query, {
                    replacements: {
                        commercialId: String(commercialIdForQuery || ''),
                        startDate: sd,
                        endDate: ed
                    },
                    type: sequelize.QueryTypes.SELECT
                });

                const total = results?.[0]?.total ?? results?.[0]?.TOTAL ?? results?.[0]?.Total ?? 0;
                console.log('Calcul réalisé pour objectif', objectif.ID_Objectif, 'commercial:', commercialIdForQuery, 'période:', sd, '->', ed, 'résultat:', total);
                return Number.isFinite(Number(total)) ? parseFloat(total) : 0;
    } catch (err) {
        console.error('Erreur lors du calcul du réalisé:', err);
        return 0;
    }
};

const isValidUUID = (str) => {
    if (!str || typeof str !== 'string') return false;
    // Regex for UUID (optional braces)
    const uuidRegex = /^\{?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}?$/i;
    return uuidRegex.test(str.trim());
};

const resolveUserForObjectif = async (userId) => {
    const normalizedUserId = normalizeInteger(userId);
    if (!normalizedUserId) return null;

    const user = await User.findByPk(normalizedUserId);
    if (!user) {
        return { error: `Utilisateur introuvable pour ID_Utilisateur=${userId}` };
    }
    if (!user.GUID || !isValidUUID(user.GUID)) {
        const crypto = require('crypto');
        const newGuid = crypto.randomUUID().toUpperCase();
        
        try {
            const { sequelize } = require('../models');
            await sequelize.query('UPDATE UCS_USERS SET GUID = :guid WHERE USER_ID = :id', {
                replacements: { guid: newGuid, id: user.UserID }
            });
            user.GUID = newGuid;
            console.log(`✅ Assigned new GUID ${newGuid} to user ${user.UserID}`);
        } catch (err) {
            console.error(`❌ Failed to assign GUID to user ${user.UserID}:`, err);
            return { error: `Impossible d'assigner un identifiant unique au commercial #${normalizedUserId}` };
        }
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

const isStaffRole = (role) => {
    const normalized = normalizeRole(role);
    return ['commercial', 'agent', 'technicien'].includes(normalized);
};

const buildCommercialObjectifScope = (user = {}) => {
    const guid = user?.GUID ? String(user.GUID).trim() : null;

    if (!guid || !isValidUUID(guid)) {
        console.warn(`⚠️ User ${user?.UserID} has invalid or missing GUID: "${guid}". Falling back to NIL UUID.`);
        return { IdCont: '00000000-0000-0000-0000-000000000000' };
    }

    return { IdCont: guid };
};

const isObjectifRelatedToCommercial = (objectif, user = {}) => {
    const userGuid = user?.GUID ? String(user.GUID).toLowerCase() : null;
    const objectifGuid = objectif?.IdCont ? String(objectif.IdCont).toLowerCase() : null;

    return userGuid && objectifGuid && userGuid === objectifGuid;
};

/**
 * Vérifier les conflits entre objectifs Mensuel et Hebdomadaire
 * Un commercial ne peut pas avoir simultanément un Mensuel et un Hebdomadaire ACTIFS/ATTEINTS pour la même période
 */
const checkObjectifConflict = async (userGuid, typePeriode, mois, annee, dateDebut) => {
    if (!userGuid) return null;

    // Déterminer le mois/année cible
    let targetMois = mois;
    let targetAnnee = annee;

    if (typePeriode === 'Hebdomadaire' && dateDebut) {
        const dateObj = new Date(dateDebut);
        targetMois = dateObj.getMonth() + 1; // 1-12
        targetAnnee = dateObj.getFullYear();
    }

    if (!targetMois || !targetAnnee) return null;

    try {
        if (typePeriode === 'Mensuel') {
            // Vérifier s'il existe un Hebdomadaire ACTIF ou ATTEINT pour le même mois/année
            // Pour un Hebdomadaire, on vérifie que sa DateDebut tombe dans le mois cible
            const firstDayOfMonth = new Date(targetAnnee, targetMois - 1, 1);
            const lastDayOfMonth = new Date(targetAnnee, targetMois, 0, 23, 59, 59, 999);

            const conflictingWeekly = await Objectif.findOne({
                where: {
                    IdCont: userGuid,
                    TypePeriode: 'Hebdomadaire',
                    StatutObjectif: { [Op.in]: ['ACTIF', 'ATTEINT'] },
                    DateDebut: {
                        [Op.between]: [firstDayOfMonth, lastDayOfMonth]
                    }
                }
            });

            if (conflictingWeekly) {
                return {
                    error: 'Ce commercial a déjà un objectif hebdomadaire en cours pour cette période. Terminez ou clôturez l\'objectif hebdomadaire avant de créer un objectif mensuel.'
                };
            }
        } else if (typePeriode === 'Hebdomadaire') {
            // Vérifier s'il existe un Mensuel ACTIF ou ATTEINT pour le même mois/année
            const conflictingMonthly = await Objectif.findOne({
                where: {
                    IdCont: userGuid,
                    TypePeriode: 'Mensuel',
                    StatutObjectif: { [Op.in]: ['ACTIF', 'ATTEINT'] },
                    Mois: targetMois,
                    Annee: targetAnnee
                }
            });

            if (conflictingMonthly) {
                return {
                    error: 'Ce commercial a déjà un objectif mensuel en cours pour cette période. Terminez ou clôturez l\'objectif mensuel avant de créer un objectif hebdomadaire.'
                };
            }
        }

        return null;
    } catch (error) {
        console.error('❌ Erreur vérification conflit objectif:', error);
        // En cas d'erreur, on laisse la création procéder (fail-safe)
        return null;
    }
};

/**
 * Créer un nouvel objectif
 */
exports.createObjectif = async (req, res, next) => {
    try {
        const {
            ID_Utilisateur,
            CodTiers,
            Mois,
            Annee,
            Semaine,
            Numsem,
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

        const shouldFilterByCommercial = canFlag(req.permissions?.FiltreRepres);
        const effectiveUserId = shouldFilterByCommercial
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
            if (!effectiveUserId || (!Semaine && !Numsem) || !DateDebut || !DateFin) {
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

        // Vérifier les conflits entre Mensuel et Hebdomadaire
        const conflictCheck = await checkObjectifConflict(
            resolvedUser?.user?.GUID,
            TypePeriode,
            normalizeInteger(Mois),
            normalizeInteger(Annee),
            DateDebut
        );

        if (conflictCheck?.error) {
            return res.status(409).json({
                status: 'error',
                message: conflictCheck.error
            });
        }

        const weeklyPeriod = TypePeriode === 'Hebdomadaire'
            ? buildWeeklyPeriod({ Semaine, Numsem, Annee, DateDebut, DateFin })
            : null;

        const { sequelize } = require('../models');

        // Archiver les anciens objectifs actifs pour ce commercial
        if (resolvedUser?.user?.GUID) {
            await Objectif.update(
                { StatutObjectif: 'ARCHIVÉ', DateArchivage: sequelize.fn('GETDATE') },
                { where: { IdCont: resolvedUser.user.GUID, StatutObjectif: 'ACTIF' } }
            );
        }

        const newObjectif = await Objectif.create({
            IdCont: resolvedUser?.user?.GUID || null,
            ID_Utilisateur: resolvedUser?.normalizedUserId || null,
            CodTiers: CodTiers ? String(CodTiers).trim() : null,
            Mois: TypePeriode === 'Mensuel' ? normalizeInteger(Mois) : null,
            Annee: TypePeriode === 'Mensuel'
                ? normalizeInteger(Annee)
                : weeklyPeriod?.Annee || normalizeInteger(DateDebut ? String(DateDebut).slice(0, 4) : null),
            Numsem: TypePeriode === 'Hebdomadaire' ? weeklyPeriod?.Numsem : null,
            Semaine: TypePeriode === 'Hebdomadaire' ? weeklyPeriod?.Semaine : null,
            DateDebut: TypePeriode === 'Hebdomadaire' ? weeklyPeriod?.DateDebut : null,
            DateFin: TypePeriode === 'Hebdomadaire' ? weeklyPeriod?.DateFin : null,
            DateCreation: sequelize.fn('GETDATE'),
            MontantCible: normalizeDecimal(MontantCible, 0),
            Montant_Realise_Actuel: normalizeDecimal(Montant_Realise_Actuel, 0),
            TypeObjectif: TypeObjectif || null,
            TypePeriode: TypePeriode || 'Mensuel',
            Libelle_Indicateur: Libelle_Indicateur || null,
            StatutObjectif: 'ACTIF'
        });

        const hydratedObjectif = await hydrateObjectif(newObjectif.ID_Objectif);
        if (hydratedObjectif) {
            try { hydratedObjectif.setDataValue('AutObjAffiche', hydratedObjectif.get('AutObjAffiche')); } catch (e) { }
        }

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
        const { userId, mois, annee, semaine, tiersId, projetId, statut } = req.query;
        
        // On détecte si l'utilisateur est commercial (rôle)
        const normalizedRole = normalizeRole(req.user?.UserRole);
        const isCommercial = normalizedRole === 'commercial';
        const shouldFilterByCommercial = canFlag(req.permissions?.FiltreRepres) || isCommercial;
        const where = shouldFilterByCommercial
            ? buildCommercialObjectifScope(req.user)
            : {};

        void tiersId;
        void projetId;

        // Un commercial (rôle ou FiltreRepres) ne peut voir QUE ses propres objectifs, jamais ceux d'un autre
        if (shouldFilterByCommercial) {
            // On ignore totalement userId passé en paramètre
            // where.IdCont est déjà forcé à l'utilisateur courant via buildCommercialObjectifScope
        } else if (userId && userId !== 'null') {
            // Pour les autres rôles (admin, manager...), on peut filtrer sur userId
            const resolvedUser = await resolveUserForObjectif(userId);
            if (!resolvedUser || resolvedUser.error) {
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

        const rawObjectifs = await Objectif.findAll({
            where,
            include: objectifInclude,
            order: [
                ['DateDebut', 'DESC'],
                ['ID_Objectif', 'DESC']
            ]
        });

        const objectifs = await Promise.all(rawObjectifs.map(async (obj) => {
            const realized = await calculateRealisedForObjectif(obj);
            const storedRealized = Number(obj.getDataValue('Montant_Realise_Actuel')) || Number(obj.autVal) || 0;
            const storedAutVal = Number(obj.getDataValue('autVal')) || 0;
            if (
                String(obj.StatutObjectif || '').toUpperCase() === 'ACTIF'
                && (storedRealized !== Number(realized) || storedAutVal !== Number(realized))
            ) {
                await obj.update({
                    Montant_Realise_Actuel: realized,
                    autVal: realized
                });
            }
            obj.setDataValue('autVal', realized);
            obj.setDataValue('Montant_Realise_Actuel', realized);
            obj.setDataValue('CodTiers', obj.getDataValue('CodTiers') || null);
            try {
                obj.setDataValue('AutObjAffiche', obj.get('AutObjAffiche'));
            } catch (e) {
                // virtual may not be present in older models
            }
            return obj;
        }));

        const normalizedStatut = String(statut || 'actif').toLowerCase();
        const hiddenStatuses = new Set(['ARCHIVÉ', 'INACTIF']);
        const filteredObjectifs = objectifs.filter((obj) => {
            const currentStatus = String(obj.StatutObjectif || '').toUpperCase();
            if (normalizedStatut === 'archive') {
                return hiddenStatuses.has(currentStatus);
            }
            if (normalizedStatut === 'all') {
                return true;
            }
            return !hiddenStatuses.has(currentStatus);
        });

        res.status(200).json({
            status: 'success',
            count: filteredObjectifs.length,
            data: filteredObjectifs
        });
    } catch (error) {
        // Log ultra détaillé pour debug
        console.error('❌ Erreur récupération objectifs (full):', error);
        if (error && error.stack) {
            console.error('❌ Stacktrace:', error.stack);
        }
        if (error && error.original) {
            console.error('❌ Erreur SQL (original):', error.original);
        }
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

        const shouldFilter = canFlag(req.permissions?.FiltreRepres);
        if (shouldFilter && !isObjectifRelatedToCommercial(objectif, req.user)) {
            return res.status(403).json({
                status: 'error',
                message: 'Accès refusé à cet objectif'
            });
        }

        const realized = await calculateRealisedForObjectif(objectif);
        objectif.setDataValue('autVal', realized);
        objectif.setDataValue('Montant_Realise_Actuel', realized);
        try {
            objectif.setDataValue('AutObjAffiche', objectif.get('AutObjAffiche'));
        } catch (e) {
            // ignore if virtual not available
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
        const shouldFilterByCommercial = canFlag(req.permissions?.FiltreRepres);
        
        const {
            ID_Utilisateur,
            Mois,
            Annee,
            Semaine,
            Numsem,
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

        if (shouldFilterByCommercial && !isObjectifRelatedToCommercial(objectif, req.user)) {
            return res.status(403).json({
                status: 'error',
                message: 'Accès refusé à cet objectif'
            });
        }

        let resolvedUser = null;
        if (ID_Utilisateur !== undefined && !shouldFilterByCommercial) {
            resolvedUser = await resolveUserForObjectif(ID_Utilisateur);
            if (resolvedUser?.error) {
                return res.status(400).json({
                    status: 'error',
                    message: resolvedUser.error
                });
            }
        }

        const nextTypePeriode = TypePeriode || objectif.TypePeriode || 'Mensuel';
        const weeklyPeriod = nextTypePeriode === 'Hebdomadaire'
            ? buildWeeklyPeriod({
                Semaine: Semaine !== undefined ? Semaine : objectif.Semaine,
                Numsem: Numsem !== undefined ? Numsem : objectif.Numsem,
                Annee: Annee !== undefined ? Annee : objectif.Annee,
                DateDebut: DateDebut !== undefined ? DateDebut : objectif.DateDebut,
                DateFin: DateFin !== undefined ? DateFin : objectif.DateFin
            })
            : null;

        await objectif.update({
            IdCont: resolvedUser?.user?.GUID || objectif.IdCont,
            ID_Utilisateur: resolvedUser?.normalizedUserId ?? objectif.ID_Utilisateur,
            Mois: nextTypePeriode === 'Mensuel'
                ? (Mois !== undefined ? normalizeInteger(Mois) : objectif.Mois)
                : null,
            Annee: nextTypePeriode === 'Hebdomadaire'
                ? weeklyPeriod?.Annee
                : (Annee !== undefined ? normalizeInteger(Annee) : objectif.Annee),
            Numsem: nextTypePeriode === 'Hebdomadaire' ? weeklyPeriod?.Numsem : null,
            Semaine: nextTypePeriode === 'Hebdomadaire'
                ? weeklyPeriod?.Semaine
                : null,
            DateDebut: nextTypePeriode === 'Hebdomadaire' ? weeklyPeriod?.DateDebut : null,
            DateFin: nextTypePeriode === 'Hebdomadaire' ? weeklyPeriod?.DateFin : null,
            MontantCible: MontantCible !== undefined ? normalizeDecimal(MontantCible, 0) : objectif.MontantCible,
            Montant_Realise_Actuel: Montant_Realise_Actuel !== undefined ? normalizeDecimal(Montant_Realise_Actuel, 0) : objectif.Montant_Realise_Actuel,
            TypeObjectif: TypeObjectif || objectif.TypeObjectif,
            TypePeriode: nextTypePeriode,
            Libelle_Indicateur: Libelle_Indicateur !== undefined ? Libelle_Indicateur : objectif.Libelle_Indicateur,
            // ID_Objectif_Parent: ID_Objectif_Parent !== undefined ? safeInt(ID_Objectif_Parent) : objectif.ID_Objectif_Parent
        });

        const hydratedObjectif = await hydrateObjectif(id);
        if (hydratedObjectif) {
            try { hydratedObjectif.setDataValue('AutObjAffiche', hydratedObjectif.get('AutObjAffiche')); } catch (e) { }
        }

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

        const shouldFilter = canFlag(req.permissions?.FiltreRepres);
        if (shouldFilter && !isObjectifRelatedToCommercial(objectif, req.user)) {
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
