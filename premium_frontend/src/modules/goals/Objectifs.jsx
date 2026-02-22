import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ChartBarIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    TrophyIcon,
    FlagIcon,
    ShoppingBagIcon,
    UserPlusIcon,
    UserGroupIcon,
    CalendarIcon,
    PlusIcon,
    SparklesIcon,
    ArrowRightIcon,
    ChevronDownIcon,
    CheckCircleIcon,
    BriefcaseIcon,
    ArrowTrendingUpIcon,
    BanknotesIcon,
    UsersIcon,
    DocumentTextIcon,
    ArrowPathIcon,
    EyeIcon,
    TagIcon
} from '@heroicons/react/24/outline';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchObjectifs, updateObjectif } from './objectifSlice';
import axios from '../../app/axios';
import { getImageUrl } from '../../utils/imageUrl';

// Icon Map helper
const ICON_MAP = {
    BanknotesIcon,
    UsersIcon,
    CalendarIcon,
    BriefcaseIcon,
    ChartBarIcon,
    FlagIcon
};

// Color Map helper for Tailwind
const COLOR_MAP = {
    blue: {
        bg: 'bg-blue-500',
        text: 'text-blue-600',
        border: 'hover:border-blue-300',
        light: 'bg-blue-50',
        glow: 'shadow-glow-blue'
    },
    emerald: {
        bg: 'bg-emerald-500',
        text: 'text-emerald-600',
        border: 'hover:border-emerald-300',
        light: 'bg-emerald-50',
        glow: 'shadow-glow-success'
    },
    indigo: {
        bg: 'bg-indigo-500',
        text: 'text-indigo-600',
        border: 'hover:border-indigo-300',
        light: 'bg-indigo-50',
        glow: 'shadow-glow-indigo'
    },
    rose: {
        bg: 'bg-rose-500',
        text: 'text-rose-600',
        border: 'hover:border-rose-300',
        light: 'bg-rose-50',
        glow: 'shadow-glow-rose'
    },
    amber: {
        bg: 'bg-amber-500',
        text: 'text-amber-600',
        border: 'hover:border-amber-300',
        light: 'bg-amber-50',
        glow: 'shadow-glow-warning'
    },
    slate: {
        bg: 'bg-slate-500',
        text: 'text-slate-600',
        border: 'hover:border-slate-300',
        light: 'bg-slate-50',
        glow: 'shadow-glow-slate'
    }
};

const getGoalVisuals = (type) => {
    switch (type) {
        case "Chiffre d'affaires":
            return { color: 'blue', icon: BanknotesIcon, unit: 'TND' };
        case 'Nouveaux Clients':
            return { color: 'emerald', icon: UsersIcon, unit: 'Clients' };
        case 'Nombre de Rendez-vous':
            return { color: 'indigo', icon: CalendarIcon, unit: 'RDV' };
        case 'Validation Devis':
            return { color: 'blue', icon: DocumentTextIcon, unit: 'TND' };
        case 'Volume de Ventes':
            return { color: 'rose', icon: ShoppingBagIcon, unit: 'Unités' };
        case 'Marge Brute':
            return { color: 'amber', icon: ChartBarIcon, unit: 'TND' };
        default:
            return { color: 'slate', icon: FlagIcon, unit: 'Unité' };
    }
};

const Objectifs = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { objectifs, loading: reduxLoading } = useSelector((state) => state.objectifs);

    const { user: currentUser } = useSelector(state => state.auth);
    const [users, setUsers] = useState([]);

    // Pas de filtres par défaut - afficher TOUS les objectifs de TOUS les utilisateurs
    const [selectedUserId, setSelectedUserId] = useState(location.state?.selectedUserId || 'all');
    const [selectedMonth, setSelectedMonth] = useState(location.state?.selectedMonth || 'all');
    const [selectedYear, setSelectedYear] = useState(location.state?.selectedYear || new Date().getFullYear());
    const [allObjectifs, setAllObjectifs] = useState([]); // Tous les objectifs pour le classement

    // Filtres pour les cards
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('progress-desc'); // Tri par défaut : progression décroissante

    const months = [
        { id: 1, name: 'Janvier' }, { id: 2, name: 'Février' }, { id: 3, name: 'Mars' },
        { id: 4, name: 'Avril' }, { id: 5, name: 'Mai' }, { id: 6, name: 'Juin' },
        { id: 7, name: 'Juillet' }, { id: 8, name: 'Août' }, { id: 9, name: 'Septembre' },
        { id: 10, name: 'Octobre' }, { id: 11, name: 'Novembre' }, { id: 12, name: 'Décembre' }
    ];

    const chartData = [
        { month: 'Oct', sales: 12000 },
        { month: 'Nov', sales: 15000 },
        { month: 'Déc', sales: 18000 },
        { month: 'Jan', sales: 21500 },
        { month: 'Fév', sales: 18450 },
    ];

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axios.get('/users');
                const usersData = res?.data ?? res ?? [];
                setUsers(usersData);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };
        fetchUsers();
    }, []);

    // Charger TOUS les objectifs de la base de données
    useEffect(() => {
        const fetchAllObjectifs = async () => {
            try {
                const params = {};

                // Filtrer par mois si sélectionné
                if (selectedMonth !== 'all') {
                    params.mois = selectedMonth;
                }

                // Filtrer par année
                params.annee = selectedYear;

                // Filtrer par utilisateur si sélectionné
                if (selectedUserId !== 'all') {
                    params.userId = selectedUserId;
                }

                const res = await axios.get('/objectifs', { params });
                console.log('📊 Objectifs chargés depuis la base:', res);
                setAllObjectifs(res?.data ?? res ?? []);
            } catch (error) {
                console.error('Erreur lors du chargement des objectifs:', error);
                setAllObjectifs([]);
            }
        };
        fetchAllObjectifs();
    }, [selectedUserId, selectedMonth, selectedYear]);

    // Recharger les objectifs quand on revient de la page de création
    useEffect(() => {
        // Si on revient de la page de création avec un state
        if (location.state?.refresh) {
            // Mettre à jour les filtres si nécessaire (le useEffect principal rechargera automatiquement)
            if (location.state.selectedUserId && location.state.selectedUserId !== selectedUserId) {
                setSelectedUserId(location.state.selectedUserId);
            }
            if (location.state.selectedMonth && location.state.selectedMonth !== selectedMonth) {
                setSelectedMonth(location.state.selectedMonth);
            }
            if (location.state.selectedYear && location.state.selectedYear !== selectedYear) {
                setSelectedYear(location.state.selectedYear);
            }

            // Nettoyer le state pour éviter les rechargements multiples
            window.history.replaceState({}, document.title);
        }
    }, [location.state?.refresh]);

    const handleUpdateProgress = async (id, val, inputElement) => {
        if (!val || isNaN(val)) {
            toast.error("Veuillez entrer un montant valide");
            return;
        }
        try {
            await dispatch(updateObjectif({
                id,
                data: { Montant_Realise_Actuel: parseFloat(val) }
            })).unwrap();

            toast.success("Montant mis à jour avec succès");

            // Réinitialiser le champ input
            if (inputElement) {
                inputElement.value = '';
            }

            // Recharger TOUS les objectifs depuis la base de données
            const params = {};
            if (selectedMonth !== 'all') params.mois = selectedMonth;
            params.annee = selectedYear;
            if (selectedUserId !== 'all') params.userId = selectedUserId;

            const res = await axios.get('/objectifs', { params });
            setAllObjectifs(res?.data ?? res ?? []);
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            toast.error(error.response?.data?.message || "Erreur lors de la mise à jour");
        }
    };

    // Logique de filtrage (sans tri - le tri s'applique au classement)
    // Utilise allObjectifs qui vient directement de la base de données
    const filteredObjectifs = useMemo(() => {
        let filtered = allObjectifs || [];

        // Filtre par type
        if (filterType !== 'all') {
            filtered = filtered.filter(obj => obj.TypeObjectif === filterType);
        }

        // Filtre par statut (progression)
        if (filterStatus !== 'all') {
            filtered = filtered.filter(obj => {
                const progress = ((obj.Montant_Realise_Actuel || 0) / (obj.MontantCible || 1)) * 100;
                if (filterStatus === 'completed') return progress >= 100;
                if (filterStatus === 'in-progress') return progress >= 50 && progress < 100;
                if (filterStatus === 'at-risk') return progress < 50;
                return true;
            });
        }

        // Filtre par recherche
        if (searchTerm) {
            filtered = filtered.filter(obj =>
                obj.TypeObjectif?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                obj.Description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return filtered;
    }, [allObjectifs, filterType, filterStatus, searchTerm]);

    const totalTarget = (filteredObjectifs || []).reduce((acc, curr) => acc + (curr.MontantCible || 0), 0);
    const totalRealised = (filteredObjectifs || []).reduce((acc, curr) => acc + (curr.Montant_Realise_Actuel || 0), 0);
    const globalProgress = totalTarget > 0 ? (totalRealised / totalTarget) * 100 : 0;

    const selectedUser = (users || []).find(u => u.UserID === parseInt(selectedUserId));

    // Types d'objectifs uniques pour le filtre
    const objectifTypes = useMemo(() => {
        const types = [...new Set((allObjectifs || []).map(obj => obj.TypeObjectif).filter(Boolean))];
        return types;
    }, [allObjectifs]);

    // Classement des commerciaux par avancement
    const commercialRanking = useMemo(() => {
        // Grouper les objectifs par commercial (utiliser TOUS les objectifs du mois)
        const groupedByUser = {};

        (allObjectifs || []).forEach(obj => {
            const userId = obj.ID_Utilisateur;
            if (!userId) return; // Ignorer les objectifs sans utilisateur

            if (!groupedByUser[userId]) {
                groupedByUser[userId] = {
                    userId,
                    user: users.find(u => u.UserID === userId),
                    objectifs: [],
                    totalTarget: 0,
                    totalRealised: 0,
                    progress: 0
                };
            }
            groupedByUser[userId].objectifs.push(obj);
            // IMPORTANT: Convertir en nombres pour éviter les problèmes de calcul
            const montantCible = parseFloat(obj.MontantCible) || 0;
            const montantRealise = parseFloat(obj.Montant_Realise_Actuel) || 0;
            groupedByUser[userId].totalTarget += montantCible;
            groupedByUser[userId].totalRealised += montantRealise;
        });

        // Calculer le pourcentage d'avancement pour chaque commercial
        const rankings = Object.values(groupedByUser).map(item => ({
            ...item,
            progress: item.totalTarget > 0 ? (item.totalRealised / item.totalTarget) * 100 : 0
        }));

        // Trier selon le critère sélectionné
        const sorted = [...rankings].sort((a, b) => {
            switch (sortBy) {
                case 'progress-desc': // Plus avancé en premier
                    return b.progress - a.progress;
                case 'progress-asc': // Moins avancé en premier
                    return a.progress - b.progress;
                case 'target-desc': // Objectif le plus élevé en premier
                    return b.totalTarget - a.totalTarget;
                case 'target-asc': // Objectif le plus bas en premier
                    return a.totalTarget - b.totalTarget;
                case 'name': // Tri alphabétique par nom
                    const nameA = a.user?.FullName || '';
                    const nameB = b.user?.FullName || '';
                    return nameA.localeCompare(nameB);
                default:
                    return b.progress - a.progress;
            }
        });

        console.log('🏆 Classement calculé:', sorted);

        return sorted;
    }, [allObjectifs, users, sortBy]);

    return (
        <div className="animate-fade-in space-y-8 pb-12">
            {/* Executive Top Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="badge badge-primary">
                            <SparklesIcon className="h-3 w-3 mr-1" />
                            Performances
                        </span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Objectifs Commerciaux</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                        Pilotage des indicateurs clés • Toutes les données de la base
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/objectifs/new', {
                            state: {
                                selectedUserId: selectedUserId !== 'all' ? selectedUserId : null,
                                selectedMonth: selectedMonth !== 'all' ? parseInt(selectedMonth) : new Date().getMonth() + 1,
                                selectedYear: parseInt(selectedYear)
                            }
                        })}
                        className="btn-soft-primary flex items-center gap-2 font-bold"
                    >
                        <PlusIcon className="h-4 w-4" /> Nouvel Objectif
                    </button>
                </div>
            </div>

            {/* Filtres Section */}
            <div className="card-luxury p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="flex flex-wrap gap-3 flex-1">
                        {/* Filtre par Commercial */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commercial</label>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                            >
                                <option value="all">Tous les commerciaux</option>
                                {users.map(u => (
                                    <option key={u.UserID} value={u.UserID}>{u.FullName || u.LoginName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filtre par Mois */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mois</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                            >
                                <option value="all">Tous les mois</option>
                                {months.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>

                        {/* Filtre par Type */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type d'objectif</label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                            >
                                <option value="all">Tous les types</option>
                                {objectifTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filtre par Statut */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Statut</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="completed">Complétés (≥100%)</option>
                                <option value="in-progress">En cours (50-99%)</option>
                                <option value="at-risk">À risque (&lt;50%)</option>
                            </select>
                        </div>

                        {/* Tri du Classement */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trier le classement</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                            >
                                <option value="progress-desc">🏆 Meilleur avancement d'abord</option>
                                <option value="progress-asc">📉 Moins avancé d'abord</option>
                                <option value="target-desc">💰 Objectif le plus élevé</option>
                                <option value="target-asc">💵 Objectif le plus bas</option>
                                <option value="name">🔤 Nom (A-Z)</option>
                            </select>
                        </div>

                        {/* Recherche */}
                        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recherche</label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Rechercher un objectif..."
                                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Compteur de résultats */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">
                            {filteredObjectifs.length} objectif{filteredObjectifs.length > 1 ? 's' : ''} trouvé{filteredObjectifs.length > 1 ? 's' : ''}
                        </span>
                        {(filterType !== 'all' || filterStatus !== 'all' || searchTerm) && (
                            <button
                                onClick={() => {
                                    setFilterType('all');
                                    setFilterStatus('all');
                                    setSearchTerm('');
                                }}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                            >
                                Réinitialiser filtres
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* KPI Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Atteinte Cible', value: `${Math.round(globalProgress)}%`, sub: 'Progress. Globale', color: 'blue', icon: ArrowTrendingUpIcon, gradient: 'bg-gradient-blue' },
                    { label: 'Objectif Mensuel', value: `${(totalTarget / 1000).toFixed(1)}k`, sub: 'TND / Période', color: 'cyan', icon: BanknotesIcon, gradient: 'bg-gradient-blue-cyan' },
                    { label: 'Réalisé à date', value: `${(totalRealised / 1000).toFixed(1)}k`, sub: 'TND cumulés', color: 'emerald', icon: CheckCircleIcon, gradient: 'bg-gradient-success' },
                    { label: 'Reste à faire', value: `${((totalTarget - totalRealised) / 1000).toFixed(1)}k`, sub: 'Écart restant', color: 'amber', icon: FlagIcon, gradient: 'bg-gradient-warning' },
                ].map((kpi, i) => (
                    <div key={i} className="card-luxury p-0 overflow-hidden group">
                        <div className="p-6 flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                                <div className="flex items-baseline gap-1.5">
                                    <h3 className="text-2xl font-extrabold text-slate-800">{kpi.value}</h3>
                                    <span className="text-[10px] font-bold text-slate-400">{kpi.sub}</span>
                                </div>
                            </div>
                            <div className={`icon-shape shadow-soft group-hover:scale-110 transition-transform ${kpi.gradient}`}>
                                <kpi.icon className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <div className={`h-1 ${kpi.gradient}`}></div>
                    </div>
                ))}
            </div>

            {/* Grid Layout for Objectifs - Similar to Projects */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {reduxLoading && filteredObjectifs.length === 0 ? (
                    <div className="col-span-full py-20 flex justify-center">
                        <LoadingSpinner />
                    </div>
                ) : filteredObjectifs.length > 0 ? filteredObjectifs.map((goal) => {
                            const progress = Math.min(((goal.Montant_Realise_Actuel || 0) / (goal.MontantCible || 1)) * 100, 100);
                            const visuals = getGoalVisuals(goal.TypeObjectif);
                            const config = COLOR_MAP[visuals.color] || COLOR_MAP.blue;
                            const Icon = visuals.icon;

                            return (
                                <div key={goal.ID_Objectif} className={`card-luxury p-8 group flex flex-col ${config.border}`}>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className={`icon-shape icon-shape-sm shadow-soft ${config.bg}`}>
                                            <Icon className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => navigate(`/objectifs/edit/${goal.ID_Objectif}`, {
                                                    state: { objectif: goal }
                                                })}
                                                className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all opacity-0 group-hover:opacity-100"
                                                title="Modifier l'objectif"
                                            >
                                                <EyeIcon className="h-4 w-4" />
                                            </button>
                                            <div className="text-right">
                                                <p className={`text-2xl font-black ${config.text} tracking-tight`}>{Math.round(progress)}%</p>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Achèvement</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-8">
                                        <h4 className="text-base font-bold text-slate-800 mb-1">{goal.TypeObjectif}</h4>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                                            {goal.Libelle_Indicateur && (
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{goal.Libelle_Indicateur}</p>
                                            )}
                                            {goal.Semaine && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-bold">
                                                    Semaine: {goal.Semaine}
                                                </span>
                                            )}
                                            {(goal.DateDebut || goal.DateFin) && (
                                                <span className="inline-flex items-center text-[9px] font-medium text-slate-400">
                                                    <CalendarIcon className="h-3 w-3 mr-1" />
                                                    {goal.DateDebut ? new Date(goal.DateDebut).toLocaleDateString('fr') : '...'} au {goal.DateFin ? new Date(goal.DateFin).toLocaleDateString('fr') : '...'}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-baseline gap-2 mt-4">
                                            <span className={`text-2xl font-black text-slate-800`}>{(goal.Montant_Realise_Actuel || 0).toLocaleString()}</span>
                                            <span className="text-xs font-bold text-slate-400">/ {(goal.MontantCible || 0).toLocaleString()} {visuals.unit}</span>
                                        </div>
                                        <div className="mt-2 text-[10px] font-bold">
                                            <span className={`px-2 py-0.5 rounded-full ${goal.Statut === 'Atteint' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {goal.Statut || 'En cours'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-auto space-y-6">
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${config.bg} ${config.glow}`}
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                placeholder="Nouveau montant..."
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleUpdateProgress(goal.ID_Objectif, e.target.value, e.target);
                                                    }
                                                }}
                                                className="input-modern px-4 py-2 text-xs h-10"
                                            />
                                            <button
                                                onClick={(e) => {
                                                    const input = e.currentTarget.previousSibling;
                                                    handleUpdateProgress(goal.ID_Objectif, input.value, input);
                                                }}
                                                className={`h-10 w-10 shrink-0 flex items-center justify-center text-white rounded-xl shadow-soft transition-all active:scale-95 ${config.bg} hover:brightness-110`}
                                                title="Mettre à jour le montant réalisé"
                                            >
                                                <PlusIcon className="h-4 w-4 stroke-[3]" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="col-span-full py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                                <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-soft mb-6">
                                    <FlagIcon className="h-8 w-8" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-500 mb-1">Aucun objectif trouvé</h3>
                                <p className="text-xs text-slate-400 mb-6">Aucun objectif ne correspond aux filtres sélectionnés</p>
                                <button
                                    onClick={() => {
                                        setFilterType('all');
                                        setFilterStatus('all');
                                        setSearchTerm('');
                                    }}
                                    className="btn-soft-primary px-8 font-bold"
                                >
                                    Réinitialiser les filtres
                                </button>
                            </div>
                        )}

                {/* Create New Objectif Card */}
                {filteredObjectifs.length > 0 && (
                    <button
                        onClick={() => navigate('/objectifs/new')}
                        className="card-luxury p-8 border-2 border-dashed border-slate-200 bg-slate-50/30 flex flex-col items-center justify-center text-center gap-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                    >
                        <div className="h-16 w-16 bg-white rounded-2xl shadow-soft flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                            <PlusIcon className="h-8 w-8 stroke-[3]" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Nouvel Objectif</h4>
                            <p className="text-xs text-slate-400 mt-1 font-medium">Définir une nouvelle cible</p>
                        </div>
                    </button>
                )}
            </div>

            {/* Classement Performance Équipe - Liste de tous les commerciaux classés par avancement */}
            {commercialRanking.length > 0 && (
                <div className="card-luxury p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="icon-shape icon-shape-sm bg-gradient-to-br from-blue-500 to-blue-600">
                            <TrophyIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800">Classement Performance Équipe</h2>
                            <p className="text-xs font-medium text-slate-500">
                                Liste de tous les commerciaux classés par avancement • Toutes les données
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rang</th>
                                    <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commercial</th>
                                    <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Poste</th>
                                    <th className="text-right py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Statut</th>
                                    <th className="text-right py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avancement</th>
                                </tr>
                            </thead>
                            <tbody>
                                {commercialRanking.map((item, index) => {
                                    const isCurrentUser = item.userId === currentUser?.UserID;
                                    const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Or, Argent, Bronze
                                    const medal = index < 3 ? medalColors[index] : null;

                                    return (
                                        <tr
                                            key={item.userId}
                                            className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isCurrentUser ? 'bg-blue-50' : ''}`}
                                        >
                                            <td className="py-4 px-4">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full font-black text-sm"
                                                    style={{
                                                        backgroundColor: medal ? medal : '#f1f5f9',
                                                        color: medal ? '#fff' : '#64748b'
                                                    }}
                                                >
                                                    #{index + 1}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    {item.user?.PhotoProfil ? (
                                                        <img
                                                            src={getImageUrl(item.user.PhotoProfil)}
                                                            alt={item.user.FullName}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                                            {item.user?.FullName?.charAt(0)?.toUpperCase() || 'U'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">
                                                            {item.user?.FullName || `Utilisateur #${item.userId}`}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {item.user?.EmailPro || 'Email non disponible'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-sm font-medium text-slate-600">
                                                    {item.user?.PosteOccupe || 'Non défini'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                {item.user ? (
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                        item.user.IsActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {item.user.IsActive ? 'Actif' : 'Inactif'}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                                                        Inconnu
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <div className="flex-1 max-w-[120px]">
                                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all ${
                                                                    item.progress >= 100 ? 'bg-green-500' :
                                                                    item.progress >= 50 ? 'bg-blue-500' :
                                                                    'bg-orange-500'
                                                                }`}
                                                                style={{ width: `${Math.min(item.progress, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <span className={`text-lg font-black min-w-[60px] ${
                                                        item.progress >= 100 ? 'text-green-600' :
                                                        item.progress >= 50 ? 'text-blue-600' :
                                                        'text-orange-600'
                                                    }`}>
                                                        {Math.round(item.progress)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Objectifs;
