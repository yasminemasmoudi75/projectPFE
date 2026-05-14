import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
    ArrowLeftIcon, 
    CheckIcon, 
    UserIcon, 
    CalendarIcon, 
    FlagIcon, 
    ChartBarIcon, 
    ArrowTrendingUpIcon, 
    SparklesIcon,
    IdentificationIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { createObjectif, updateObjectif } from './objectifSlice';
import axios from '../../app/axios';

const hasErpCommercialMapping = (candidate) => (
    candidate?.UserID !== undefined
    && candidate?.UserID !== null
    && Boolean(candidate?.GUID)
);

const extractWeekNumber = (value) => {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : null;
    const match = String(value).match(/([0-9]+)/);
    return match ? parseInt(match[1], 10) : null;
};

const getCurrentISOWeek = (date = new Date()) => {
    const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNumber = temp.getUTCDay() || 7;
    temp.setUTCDate(temp.getUTCDate() + 4 - dayNumber);
    const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
    return Math.ceil((((temp - yearStart) / 86400000) + 1) / 7);
};

const getISOWeekRange = (weekNumber, year) => {
    const week = Number(weekNumber);
    const isoYear = Number(year);

    if (!Number.isInteger(week) || !Number.isInteger(isoYear) || week < 1 || week > 53) {
        return { startDate: '', endDate: '' };
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

const ObjectifForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const isEditMode = !!id;
    const [users, setUsers] = useState([]);
    const [prevObjectives, setPrevObjectives] = useState([]);
    const [existingObjectifs, setExistingObjectifs] = useState([]);
    const [conflictError, setConflictError] = useState(null);
    const currentISOWeek = getCurrentISOWeek();

    const [formData, setFormData] = useState({
        ID_Utilisateur: location.state?.objectif?.ID_Utilisateur || location.state?.selectedUserId || user?.UserID || '',
        Mois: location.state?.objectif?.Mois || location.state?.selectedMonth || new Date().getMonth() + 1,
        Annee: location.state?.objectif?.Annee || location.state?.selectedYear || new Date().getFullYear(),
        Numsem: location.state?.objectif?.Numsem || extractWeekNumber(location.state?.objectif?.Semaine) || location.state?.selectedWeek || currentISOWeek,
        Semaine: location.state?.objectif?.Semaine || '',
        DateDebut: location.state?.objectif?.DateDebut || '',
        DateFin: location.state?.objectif?.DateFin || '',
        TypeObjectif: location.state?.objectif?.TypeObjectif || "Chiffre d'affaires",
        TypeObjectifCustom: location.state?.objectif?.TypeObjectifCustom || '',
        TypePeriode: location.state?.objectif?.TypePeriode || location.state?.typePeriode || 'Mensuel',
        MontantCible: location.state?.objectif?.MontantCible || '',
        Libelle_Indicateur: location.state?.objectif?.Libelle_Indicateur || '',
        Statut: location.state?.objectif?.Statut || 'En cours'
    });

    /**
     * Vérifier qu'un objectif avec le même TypeObjectif n'existe pas déjà pour la même période.
     * Autorise mensuel ET hebdomadaire simultanément — seul le doublon d'indicateur est bloqué.
     */
    const checkDuplicate = (userId, typePeriode, typeObjectif, mois, annee, numsem) => {
        if (!userId || !typeObjectif || !existingObjectifs.length) return null;

        const found = existingObjectifs.find(obj => {
            if (String(obj.ID_Utilisateur || obj.utilisateur?.UserID) !== String(userId)) return false;
            if (obj.TypeObjectif !== typeObjectif) return false;
            if (obj.TypePeriode !== typePeriode) return false;
            if (!['ACTIF', 'ATTEINT'].includes(String(obj.StatutObjectif || '').toUpperCase())) return false;

            if (typePeriode === 'Mensuel') {
                return parseInt(obj.Mois) === parseInt(mois) && parseInt(obj.Annee) === parseInt(annee);
            }
            if (typePeriode === 'Hebdomadaire') {
                return parseInt(obj.Numsem) === parseInt(numsem) && parseInt(obj.Annee) === parseInt(annee);
            }
            return false;
        });

        return found
            ? `Ce commercial a déjà un objectif actif avec l'indicateur "${typeObjectif}" pour cette période.`
            : null;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, objectifsRes] = await Promise.all([
                    axios.get('/users/commercials/objectifs-filter'),
                    axios.get('/objectifs')
                ]);

                                const eligibleUsersRaw = usersRes?.data || [];
                                // Uniformise la clé UserID et FullName pour compatibilité
                                const eligibleUsers = eligibleUsersRaw.map(u => ({
                                    ...u,
                                    UserID: u.UserID || u.userId,
                                    FullName: u.FullName || u.fullName || u.label || u.LoginName || u.login,
                                    GUID: u.GUID || u.guid
                                }));
                                setUsers(eligibleUsers);

                if (Array.isArray(objectifsRes?.data)) {
                    const uniqueTypes = [...new Set(objectifsRes.data.map(obj => obj.TypeObjectif).filter(Boolean))];
                    setPrevObjectives(uniqueTypes);
                    // Charger TOUS les objectifs pour la vérification de conflits (pas juste les filtres)
                    setExistingObjectifs(objectifsRes.data);
                }

                setFormData(prev => {
                    const hasValidSelection = eligibleUsers.some(
                        (candidate) => String(candidate.UserID) === String(prev.ID_Utilisateur)
                    );
                    return hasValidSelection ? prev : { ...prev, ID_Utilisateur: eligibleUsers[0]?.UserID || '' };
                });

                if (eligibleUsers.length === 0) {
                    toast.error('Aucun commercial n\'est disponible');
                }
            } catch (error) {
                console.error('Error fetching form data:', error);
                toast.error('Erreur lors du chargement des données');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Vérifier le doublon d'indicateur à chaque changement pertinent
    useEffect(() => {
        if (!isEditMode) {
            const typeObjectif = formData.TypeObjectif === 'Autre'
                ? formData.TypeObjectifCustom
                : formData.TypeObjectif;
            const error = checkDuplicate(
                formData.ID_Utilisateur,
                formData.TypePeriode,
                typeObjectif,
                parseInt(formData.Mois, 10),
                parseInt(formData.Annee, 10),
                formData.Numsem
            );
            setConflictError(error);
        } else {
            setConflictError(null);
        }
    }, [formData.ID_Utilisateur, formData.TypePeriode, formData.TypeObjectif, formData.TypeObjectifCustom, formData.Mois, formData.Annee, formData.Numsem, isEditMode, existingObjectifs]);

    useEffect(() => {
        if (formData.TypePeriode !== 'Hebdomadaire') {
            return;
        }

        const weekNumber = extractWeekNumber(formData.Numsem || formData.Semaine);
        const year = parseInt(formData.Annee, 10) || new Date().getFullYear();
        const range = getISOWeekRange(weekNumber, year);

        setFormData((prev) => {
            const next = {
                ...prev,
                Numsem: weekNumber || prev.Numsem,
                Semaine: weekNumber ? `Semaine ${String(weekNumber).padStart(2, '0')}` : prev.Semaine,
                DateDebut: range.startDate || prev.DateDebut,
                DateFin: range.endDate || prev.DateFin,
                Annee: year
            };

            if (
                next.Numsem === prev.Numsem
                && next.Semaine === prev.Semaine
                && next.DateDebut === prev.DateDebut
                && next.DateFin === prev.DateFin
                && next.Annee === prev.Annee
            ) {
                return prev;
            }

            return next;
        });
    }, [formData.TypePeriode, formData.Numsem, formData.Semaine, formData.Annee]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Vérifier les conflits avant de soumettre
        if (conflictError) {
            toast.error(conflictError);
            return;
        }

        const selectedUser = users.find(u => String(u.UserID) === String(formData.ID_Utilisateur));
        if (!selectedUser) {
            toast.error('Veuillez sélectionner un commercial');
            return;
        }
        if (formData.TypeObjectif === 'Autre' && !formData.TypeObjectifCustom?.trim()) {
            toast.error('Veuillez saisir le nom du nouvel objectif');
            return;
        }

        setSaving(true);
        try {
            const isWeekly = formData.TypePeriode === 'Hebdomadaire';
            const weekNumber = isWeekly ? extractWeekNumber(formData.Numsem || formData.Semaine) : null;
            const calculatedYear = parseInt(formData.Annee, 10) || new Date().getFullYear();
            const weeklyRange = isWeekly ? getISOWeekRange(weekNumber, calculatedYear) : null;

            if (isWeekly && !weekNumber) {
                toast.error('Veuillez sélectionner une semaine valide');
                setSaving(false);
                return;
            }

            const objectifData = {
                ...formData,
                TypeObjectif: formData.TypeObjectif === 'Autre' ? formData.TypeObjectifCustom : formData.TypeObjectif,
                Mois: isWeekly ? null : (parseInt(formData.Mois, 10) || null),
                Annee: calculatedYear,
                Numsem: isWeekly ? weekNumber : null,
                Semaine: isWeekly ? `Semaine ${String(weekNumber).padStart(2, '0')}` : null,
                DateDebut: isWeekly ? weeklyRange.startDate : null,
                DateFin: isWeekly ? weeklyRange.endDate : null,
                MontantCible: parseFloat(formData.MontantCible) || 0
            };

            if (isEditMode) {
                await dispatch(updateObjectif({ id, data: objectifData })).unwrap();
                toast.success('Objectif modifié avec succès');
            } else {
                await dispatch(createObjectif(objectifData)).unwrap();
                toast.success('Objectif créé avec succès');
            }
            navigate('/objectifs');
        } catch (error) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de l\'enregistrement';
            toast.error(errorMessage);
            console.error('❌ Erreur création/modification objectif:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header Moderne */}
            <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
                <div className="mx-auto max-w-5xl flex h-16 items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                        </button>
                        <div className="hidden md:flex items-center gap-2 text-sm">
                            <span className="text-slate-500 hover:text-slate-800 cursor-pointer" onClick={() => navigate('/objectifs')}>Objectifs</span>
                            <span className="text-slate-300">/</span>
                            <span className="font-semibold text-slate-800">{isEditMode ? 'Modifier' : 'Nouveau'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="h-9 px-4 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving || !!conflictError}
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            title={conflictError ? 'Résolvez le conflit d\'objectif pour continuer' : ''}
                        >
                            {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckIcon className="h-4 w-4" />}
                            <span>{isEditMode ? 'Sauvegarder' : 'Créer'}</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-4 md:px-6 py-8 md:py-12">
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold border border-blue-100">
                            <SparklesIcon className="h-3 w-3" />
                            {isEditMode ? 'Modification Objectif' : 'Nouvelle Performance'}
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                        {isEditMode ? 'Modifier l\'Objectif' : 'Définir un Nouvel Objectif'}
                    </h1>
                    <p className="text-sm text-slate-500">
                        Configurez les cibles de performance pour booster l'activité commerciale
                    </p>
                </div>

                {/* Message d'alerte - Conflit d'Objectif */}
                {conflictError && (
                    <div className="rounded-2xl border-l-4 border-l-amber-500 bg-amber-50 border border-amber-200 p-4 md:p-5 flex gap-4">
                        <div className="flex-shrink-0 pt-0.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                                <InformationCircleIcon className="h-5 w-5 text-amber-600" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-amber-900 mb-1">Indicateur déjà utilisé pour cette période</h3>
                            <p className="text-sm text-amber-800 leading-relaxed">
                                {conflictError}
                            </p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Section 1: Type & Commercial */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40 overflow-hidden">
                        <div className="p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
                                    <IdentificationIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-800">Configuration de base</h2>
                                    <p className="text-sm text-slate-500">Type de période et assignation</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="block text-sm font-semibold text-slate-700">Type d'Objectif</label>
                                    <div className="flex p-1 bg-slate-100 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, TypePeriode: 'Mensuel' }))}
                                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${formData.TypePeriode === 'Mensuel' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Mensuel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, TypePeriode: 'Hebdomadaire' }))}
                                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${formData.TypePeriode === 'Hebdomadaire' ? 'bg-green-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Hebdomadaire
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-slate-700">Assigné au Commercial</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <UserIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <select
                                            name="ID_Utilisateur"
                                            value={formData.ID_Utilisateur}
                                            onChange={handleChange}
                                            className="w-full h-11 pl-10 pr-10 text-sm rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                            required
                                        >
                                            <option value="">--- Choisir un commercial ---</option>
                                                                                        {users.map(u => (
                                                                                            <option key={u.UserID || u.userId} value={u.UserID || u.userId}>
                                                                                                {u.FullName || u.fullName || u.LoginName || u.login || u.label}
                                                                                            </option>
                                                                                        ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Période */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40 overflow-hidden">
                        <div className="p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                                    <CalendarIcon className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-800">Calendrier</h2>
                                    <p className="text-sm text-slate-500">Définition de la période cible</p>
                                </div>
                            </div>

                            {formData.TypePeriode === 'Mensuel' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-slate-700">Mois</label>
                                        <select name="Mois" value={formData.Mois} onChange={handleChange} className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" required>
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('fr', { month: 'long' })}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-slate-700">Année</label>
                                        <input type="number" name="Annee" value={formData.Annee} onChange={handleChange} className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" required />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-slate-700">Semaine</label>
                                        <select
                                            name="Numsem"
                                            value={formData.Numsem}
                                            onChange={handleChange}
                                            className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                                            required
                                        >
                                            {Array.from({ length: 53 }, (_, i) => i + 1).map((week) => (
                                                <option key={week} value={week}>
                                                    Semaine {String(week).padStart(2, '0')}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-slate-700">Année</label>
                                        <input
                                            type="number"
                                            name="Annee"
                                            value={formData.Annee}
                                            onChange={handleChange}
                                            className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-slate-700">Date de début</label>
                                        <input
                                            type="date"
                                            name="DateDebut"
                                            value={formData.DateDebut ? new Date(formData.DateDebut).toISOString().split('T')[0] : getISOWeekRange(formData.Numsem, formData.Annee).startDate}
                                            readOnly
                                            className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-slate-700">Date de fin</label>
                                        <input
                                            type="date"
                                            name="DateFin"
                                            value={formData.DateFin ? new Date(formData.DateFin).toISOString().split('T')[0] : getISOWeekRange(formData.Numsem, formData.Annee).endDate}
                                            readOnly
                                            className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 3: Cibles */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40 overflow-hidden">
                        <div className="p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
                                    <FlagIcon className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-800">Indicateurs de Performance</h2>
                                    <p className="text-sm text-slate-500">Objectifs financiers et opérationnels</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-slate-700">Type d'Indicateur</label>
                                    <select name="TypeObjectif" value={formData.TypeObjectif} onChange={handleChange} className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all" required>
                                        <option value="">--- Sélectionner un indicateur ---</option>
                                        {prevObjectives.map(obj => <option key={obj} value={obj}>{obj}</option>)}
                                        <option value="Autre">Autre (Saisie personnalisée)...</option>
                                    </select>
                                    {formData.TypeObjectif === 'Autre' && (
                                        <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                                            <input type="text" name="TypeObjectifCustom" value={formData.TypeObjectifCustom} onChange={handleChange} placeholder="Nom de l'indicateur personnalisé" className="w-full h-11 px-4 text-sm rounded-xl border-amber-200 bg-amber-50/30 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all" required />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-slate-700">Valeur Cible (TND)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <ChartBarIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input type="number" step="0.01" name="MontantCible" value={formData.MontantCible} onChange={handleChange} placeholder="0.00" className="w-full h-11 pl-10 px-4 text-sm rounded-xl border border-slate-200 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-mono" required />
                                    </div>
                                </div>


                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-slate-700">Notes / Libellé</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <InformationCircleIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input type="text" name="Libelle_Indicateur" value={formData.Libelle_Indicateur} onChange={handleChange} placeholder="Précisions sur l'objectif..." className="w-full h-11 pl-10 px-4 text-sm rounded-xl border border-slate-200 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default ObjectifForm;
