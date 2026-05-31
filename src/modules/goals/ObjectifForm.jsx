import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
    ArrowLeftIcon,
    CheckIcon,
    UserIcon,
    CalendarIcon,
    FlagIcon,
    ChartBarIcon,
    TrophyIcon,
    ExclamationTriangleIcon,
    IdentificationIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { createObjectif, updateObjectif } from './objectifSlice';
import axios from '../../app/axios';

// Indicateurs métier avec leur valeur nf pour le calcul backend
const INDICATOR_TYPES = [
    { label: "Chiffre d'affaires",    nf: null, unit: 'TND', desc: 'Somme des règlements encaissés' },
    { label: 'Visites Privées',        nf: 1,    unit: '',    desc: 'Visites chez des sociétés privées' },
    { label: 'Visites Étatiques',      nf: 2,    unit: '',    desc: 'Visites chez des organismes étatiques' },
    { label: 'Toutes les Visites',     nf: 13,   unit: '',    desc: 'Total des visites effectuées' },
    { label: 'Total Projets',          nf: 10,   unit: '',    desc: 'Tous les projets créés' },
    { label: 'Contacts Étatiques',     nf: 6,    unit: '',    desc: 'Contacts dans des organismes étatiques du portefeuille' },
    { label: 'Contacts Privés',        nf: 7,    unit: '',    desc: 'Contacts dans des sociétés privées du portefeuille' },
    { label: 'Total Contacts',         nf: 8,    unit: '',    desc: 'Total des contacts du portefeuille' },
    { label: 'Sociétés Étatiques',     nf: 9,    unit: '',    desc: 'Sociétés étatiques dans le portefeuille' },
    { label: 'Tâches / Appels',        nf: 0,    unit: '',    desc: 'Tâches et appels effectués' },
];

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

    const [formData, setFormData] = useState(() => {
        const existingNf = location.state?.objectif?.nf;
        const existingTypeObj = location.state?.objectif?.TypeObjectif || "Chiffre d'affaires";
        // Retrouver nf depuis le label si non fourni directement
        const resolvedNf = existingNf !== undefined && existingNf !== null
            ? existingNf
            : (INDICATOR_TYPES.find(t => t.label === existingTypeObj)?.nf ?? null);
        return {
            ID_Utilisateur: location.state?.objectif?.ID_Utilisateur || location.state?.selectedUserId || user?.UserID || '',
            Mois: location.state?.objectif?.Mois || location.state?.selectedMonth || new Date().getMonth() + 1,
            Annee: location.state?.objectif?.Annee || location.state?.selectedYear || new Date().getFullYear(),
            Numsem: location.state?.objectif?.Numsem || extractWeekNumber(location.state?.objectif?.Semaine) || location.state?.selectedWeek || currentISOWeek,
            Semaine: location.state?.objectif?.Semaine || '',
            DateDebut: location.state?.objectif?.DateDebut || '',
            DateFin: location.state?.objectif?.DateFin || '',
            TypeObjectif: existingTypeObj,
            nf: resolvedNf,
            TypePeriode: location.state?.objectif?.TypePeriode || location.state?.typePeriode || 'Mensuel',
            MontantCible: location.state?.objectif?.MontantCible || '',
            Libelle_Indicateur: location.state?.objectif?.Libelle_Indicateur || '',
            Statut: location.state?.objectif?.Statut || 'En cours'
        };
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

    const selectedUser      = users.find(u => String(u.UserID) === String(formData.ID_Utilisateur));
    const selectedIndicator = INDICATOR_TYPES.find(t => t.label === formData.TypeObjectif);
    const INP = 'w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:border-[#0062AF] focus:ring-2 focus:ring-[#0062AF]/10 focus:outline-none transition-all';

    return (
        <div className="max-w-[1200px] mx-auto pb-16 space-y-5">

            {/* ── Top bar ── */}
            <div className="flex items-center justify-between">
                <button onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#0062AF] transition-colors group">
                    <span className="h-8 w-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:border-[#0062AF]/30 transition-all">
                        <ArrowLeftIcon className="h-4 w-4" />
                    </span>
                    <span className="hidden sm:inline">Retour aux objectifs</span>
                </button>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => navigate(-1)}
                        className="h-9 px-4 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                        Annuler
                    </button>
                    <button onClick={handleSubmit} disabled={saving || !!conflictError}
                        className="inline-flex items-center gap-1.5 h-9 px-5 bg-[#0062AF] hover:bg-[#004a85] text-white text-sm font-bold rounded-lg shadow-sm shadow-[#0062AF]/20 disabled:opacity-60 transition-all"
                        title={conflictError ? 'Résolvez le conflit pour continuer' : ''}>
                        {saving
                            ? <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <CheckIcon className="h-4 w-4" />}
                        {isEditMode ? 'Enregistrer' : "Créer l'objectif"}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                    {/* ══ Colonne principale 8/12 ══ */}
                    <div className="lg:col-span-8 space-y-5">

                        {/* ── Section 1 : Assignation ── */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <IdentificationIcon className="h-4 w-4 text-[#0062AF]" />
                                </div>
                                <span className="text-sm font-bold text-slate-800">Assignation</span>
                            </div>
                            <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                        Type de période <span className="text-rose-400">*</span>
                                    </p>
                                    <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
                                        {['Mensuel', 'Hebdomadaire'].map(t => (
                                            <button key={t} type="button"
                                                onClick={() => setFormData(p => ({ ...p, TypePeriode: t }))}
                                                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${formData.TypePeriode === t ? 'bg-[#0062AF] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                        Commercial <span className="text-rose-400">*</span>
                                    </p>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <UserIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <select name="ID_Utilisateur" value={formData.ID_Utilisateur} onChange={handleChange} required
                                            className={`${INP} pl-9 appearance-none cursor-pointer`}>
                                            <option value="">— Choisir —</option>
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

                        {/* ── Section 2 : Calendrier ── */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <CalendarIcon className="h-4 w-4 text-emerald-600" />
                                </div>
                                <span className="text-sm font-bold text-slate-800">Calendrier</span>
                                <span className="text-xs text-slate-400 ml-1">
                                    — {formData.TypePeriode === 'Mensuel' ? 'Objectif mensuel' : 'Objectif hebdomadaire'}
                                </span>
                            </div>
                            <div className="px-6 py-6">
                                {formData.TypePeriode === 'Mensuel' ? (
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Mois <span className="text-rose-400">*</span></p>
                                            <select name="Mois" value={formData.Mois} onChange={handleChange} required className={INP}>
                                                {Array.from({ length: 12 }, (_, i) => (
                                                    <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('fr', { month: 'long' })}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Année <span className="text-rose-400">*</span></p>
                                            <input type="number" name="Annee" value={formData.Annee} onChange={handleChange} required className={INP} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Semaine <span className="text-rose-400">*</span></p>
                                            <select name="Numsem" value={formData.Numsem} onChange={handleChange} required className={INP}>
                                                {Array.from({ length: 53 }, (_, i) => i + 1).map(w => (
                                                    <option key={w} value={w}>Semaine {String(w).padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Année <span className="text-rose-400">*</span></p>
                                            <input type="number" name="Annee" value={formData.Annee} onChange={handleChange} required className={INP} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Date de début</p>
                                            <input type="date" readOnly
                                                value={formData.DateDebut ? new Date(formData.DateDebut).toISOString().split('T')[0] : getISOWeekRange(formData.Numsem, formData.Annee).startDate}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-default" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Date de fin</p>
                                            <input type="date" readOnly
                                                value={formData.DateFin ? new Date(formData.DateFin).toISOString().split('T')[0] : getISOWeekRange(formData.Numsem, formData.Annee).endDate}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-default" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Section 3 : Indicateurs ── */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                                <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                    <FlagIcon className="h-4 w-4 text-amber-500" />
                                </div>
                                <span className="text-sm font-bold text-slate-800">Indicateur de performance</span>
                            </div>
                            <div className="px-6 py-6 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                            Type d'indicateur <span className="text-rose-400">*</span>
                                        </p>
                                        <select name="TypeObjectif" value={formData.TypeObjectif} required
                                            onChange={(e) => {
                                                const selected = INDICATOR_TYPES.find(t => t.label === e.target.value);
                                                setFormData(prev => ({ ...prev, TypeObjectif: e.target.value, nf: selected ? selected.nf : null }));
                                            }}
                                            className={INP}>
                                            <option value="">— Sélectionner —</option>
                                            {INDICATOR_TYPES.map(t => (
                                                <option key={t.label} value={t.label}>{t.label}</option>
                                            ))}
                                        </select>
                                        {selectedIndicator && (
                                            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{selectedIndicator.desc}</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                            Valeur cible {formData.nf !== null && formData.nf !== undefined ? '(nombre)' : '(TND)'} <span className="text-rose-400">*</span>
                                        </p>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <ChartBarIcon className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <input type="number" name="MontantCible" value={formData.MontantCible} onChange={handleChange} required
                                                step={formData.nf !== null && formData.nf !== undefined ? '1' : '0.01'} min="0"
                                                placeholder={formData.nf !== null && formData.nf !== undefined ? '0' : '0.00'}
                                                className={`${INP} pl-9 font-mono`} />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Notes / libellé</p>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <InformationCircleIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input type="text" name="Libelle_Indicateur" value={formData.Libelle_Indicateur} onChange={handleChange}
                                            placeholder="Précisions optionnelles sur cet objectif…"
                                            className={`${INP} pl-9`} />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ══ Sidebar 4/12 ══ */}
                    <div className="lg:col-span-4 space-y-4">

                        {/* Conflit */}
                        {conflictError && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
                                <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-amber-800 mb-0.5">Conflit détecté</p>
                                    <p className="text-xs text-amber-700 leading-relaxed">{conflictError}</p>
                                </div>
                            </div>
                        )}

                        {/* Récapitulatif */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
                            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/40">
                                <TrophyIcon className="h-4 w-4 text-[#0062AF]" />
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Récapitulatif</span>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Cible</p>
                                    <p className="text-3xl font-black text-[#0062AF]">
                                        {formData.MontantCible || '—'}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {formData.nf !== null && formData.nf !== undefined
                                            ? (selectedIndicator?.unit || 'unités')
                                            : 'TND'}
                                    </p>
                                </div>
                                <div className="space-y-3 divide-y divide-slate-100">
                                    <div className="flex items-start justify-between gap-2 pt-0">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pt-0.5 flex-shrink-0">Commercial</span>
                                        <span className="text-xs font-semibold text-slate-700 text-right">
                                            {selectedUser?.FullName || selectedUser?.LoginName || <span className="text-slate-300">—</span>}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-2 pt-3">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pt-0.5 flex-shrink-0">Période</span>
                                        <span className="text-xs font-semibold text-slate-700 text-right">
                                            {formData.TypePeriode === 'Mensuel'
                                                ? `${new Date(0, Number(formData.Mois) - 1).toLocaleString('fr', { month: 'long' })} ${formData.Annee}`
                                                : `Sem. ${String(formData.Numsem).padStart(2, '0')} · ${formData.Annee}`}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-2 pt-3">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pt-0.5 flex-shrink-0">Indicateur</span>
                                        <span className="text-xs font-semibold text-slate-700 text-right">
                                            {formData.TypeObjectif || <span className="text-slate-300">—</span>}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 pt-3">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex-shrink-0">Type</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${formData.TypePeriode === 'Mensuel' ? 'bg-blue-50 text-[#0062AF] border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                            {formData.TypePeriode}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="px-5 pb-5">
                                <button onClick={handleSubmit} disabled={saving || !!conflictError}
                                    className="w-full inline-flex items-center justify-center gap-2 h-10 bg-[#0062AF] hover:bg-[#004a85] text-white text-sm font-bold rounded-xl shadow-sm shadow-[#0062AF]/20 disabled:opacity-60 transition-all">
                                    {saving
                                        ? <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        : <CheckIcon className="h-4 w-4" />}
                                    {isEditMode ? 'Enregistrer' : "Créer l'objectif"}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </form>
        </div>
    );
};

export default ObjectifForm;
