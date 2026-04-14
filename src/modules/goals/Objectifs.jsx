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
    TagIcon,
    MagnifyingGlassIcon,
    XMarkIcon
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

// Color Map helper for Tailwind - Updated for new design
const COLOR_MAP = {
    blue: {
        bg: 'bg-blue-500',
        text: 'text-blue-600',
        border: 'border-blue-100',
        light: 'bg-blue-50',
        glow: 'shadow-glow-blue',
        gradient: 'from-blue-400 to-blue-500',
        fill: '#3b82f6'
    },
    emerald: {
        bg: 'bg-emerald-500',
        text: 'text-emerald-600',
        border: 'border-emerald-100',
        light: 'bg-emerald-50',
        glow: 'shadow-glow-success',
        gradient: 'from-emerald-400 to-emerald-500',
        fill: '#10b981'
    },
    indigo: {
        bg: 'bg-indigo-500',
        text: 'text-indigo-600',
        border: 'border-indigo-100',
        light: 'bg-indigo-50',
        glow: 'shadow-glow-indigo',
        gradient: 'from-indigo-400 to-indigo-500',
        fill: '#6366f1'
    },
    violet: {
        bg: 'bg-violet-500',
        text: 'text-violet-600',
        border: 'border-violet-100',
        light: 'bg-violet-50',
        glow: 'shadow-glow-violet',
        gradient: 'from-violet-400 to-violet-500',
        fill: '#8b5cf6'
    },
    cyan: {
        bg: 'bg-cyan-500',
        text: 'text-cyan-600',
        border: 'border-cyan-100',
        light: 'bg-cyan-50',
        glow: 'shadow-glow-cyan',
        gradient: 'from-cyan-400 to-cyan-500',
        fill: '#06b6d4'
    },
    rose: {
        bg: 'bg-rose-500',
        text: 'text-rose-600',
        border: 'border-rose-100',
        light: 'bg-rose-50',
        glow: 'shadow-glow-rose',
        gradient: 'from-rose-400 to-rose-500',
        fill: '#f43f5e'
    },
    amber: {
        bg: 'bg-amber-500',
        text: 'text-amber-600',
        border: 'border-amber-100',
        light: 'bg-amber-50',
        glow: 'shadow-glow-warning',
        gradient: 'from-amber-400 to-amber-500',
        fill: '#f59e0b'
    },
    slate: {
        bg: 'bg-slate-500',
        text: 'text-slate-600',
        border: 'border-slate-100',
        light: 'bg-slate-50',
        glow: 'shadow-glow-slate',
        gradient: 'from-slate-400 to-slate-500',
        fill: '#64748b'
    }
};

const getGoalVisuals = (type) => {
    switch (type) {
        case "Chiffre d'affaires":
            return { color: 'blue', icon: BanknotesIcon, unit: 'TND' };
        case 'Nouveaux Clients':
            return { color: 'emerald', icon: UsersIcon, unit: 'Clients' };
        case 'Nombre de Rendez-vous':
            return { color: 'violet', icon: CalendarIcon, unit: 'RDV' };
        case 'Validation Devis':
            return { color: 'cyan', icon: DocumentTextIcon, unit: 'TND' };
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

    const months = [
        { id: 1, name: 'Janvier' }, { id: 2, name: 'Février' }, { id: 3, name: 'Mars' },
        { id: 4, name: 'Avril' }, { id: 5, name: 'Mai' }, { id: 6, name: 'Juin' },
        { id: 7, name: 'Juillet' }, { id: 8, name: 'Août' }, { id: 9, name: 'Septembre' },
        { id: 10, name: 'Octobre' }, { id: 11, name: 'Novembre' }, { id: 12, name: 'Décembre' }
    ];

    const chartData = useMemo(() => {
        if (!allObjectifs || allObjectifs.length === 0) return [];

        const monthNames = ['Jan', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
        
        // Initialiser les données pour tous les mois
        const monthlyData = Array(12).fill(0).map((_, index) => ({
            month: monthNames[index],
            sales: 0,
            originalIndex: index // Pour le tri
        }));

        allObjectifs.forEach(obj => {
            if (obj.DateDebut) {
                const date = new Date(obj.DateDebut);
                const monthIndex = date.getMonth();
                const realised = parseFloat(obj.Montant_Realise_Actuel) || 0;
                monthlyData[monthIndex].sales += realised;
            }
        });

        // Filtrer pour ne garder que les mois avec des données
        return monthlyData.filter(d => d.sales > 0);
    }, [allObjectifs]);

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
                setAllObjectifs(res?.data ?? res ?? []);
            } catch (error) {
                console.error('Erreur lors du chargement des objectifs:', error);
                setAllObjectifs([]);
            }
        };
        fetchAllObjectifs();
    }, [selectedUserId, selectedMonth, selectedYear]);

    
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

            toast.success("Montant mis à jour avec succés");

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
            // IMPORTANT: Convertir en nombres pour éviter les problémes de calcul
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

        // Trier par avancement décroissant (toujours)
        const sorted = [...rankings].sort((a, b) => b.progress - a.progress);

        return sorted;
    }, [allObjectifs, users]);

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

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: "Atteinte Cible",
                        value: `${Math.round(globalProgress)}%`,
                        sub: "Progression globale",
                        color: "blue",
                        icon: ArrowTrendingUpIcon,
                        trend: globalProgress > 50 ? "up" : "down",
                    },
                    {
                        label: "Objectif Total",
                        value: `${(totalTarget / 1000).toFixed(1)}k`,
                        sub: "TND / Période",
                        color: "cyan",
                        icon: FlagIcon,
                    },
                    {
                        label: "Réalisé",
                        value: `${(totalRealised / 1000).toFixed(1)}k`,
                        sub: "TND cumulés",
                        color: "emerald",
                        icon: ChartBarIcon,
                        trend: "up",
                    },
                    {
                        label: "Écart",
                        value: `${((totalTarget - totalRealised) / 1000).toFixed(1)}k`,
                        sub: "Reste à faire",
                        color: "amber",
                        icon: FlagIcon,
                    },
                ].map((kpi, i) => {
                    const config = COLOR_MAP[kpi.color];
                    return (
                        <div
                            key={i}
                            className="card-luxury p-5 hover:border-blue-300/50 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-2.5 rounded-xl ${config.light} border ${config.border}`}>
                                    <kpi.icon className={`h-5 w-5 ${config.text}`} />
                                </div>
                                {kpi.trend && (
                                    <div
                                        className={`flex items-center gap-1 text-xs font-medium ${
                                            kpi.trend === "up" ? "text-emerald-500" : "text-rose-500"
                                        }`}
                                    >
                                        {kpi.trend === "up" ? (
                                            <ArrowUpIcon className="h-3 w-3" />
                                        ) : (
                                            <ArrowDownIcon className="h-3 w-3" />
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                {kpi.label}
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-slate-800">{kpi.value}</span>
                                <span className="text-xs text-slate-400">{kpi.sub}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Chart + Ranking Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Area Chart */}
                <div className="card-luxury p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800">Évolution CA</h2>
                            <p className="text-xs text-slate-400">Performance mensuelle</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Réalisé
                            </span>
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                                    tickFormatter={(value) => `${value / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "white",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "0.75rem",
                                        padding: "0.75rem",
                                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                    }}
                                    formatter={(value) => [`${value.toLocaleString()} TND`]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Team Ranking */}
                <div className="card-luxury p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                            <TrophyIcon className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800">Classement Équipe</h2>
                            <p className="text-xs text-slate-400">Par avancement des objectifs</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {commercialRanking.slice(0, 5).map((item, index) => {
                            const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
                            const medal = index < 3 ? medalColors[index] : null;

                            return (
                                <div
                                    key={item.userId}
                                    className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                                >
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                        style={{
                                            backgroundColor: medal || "#f1f5f9",
                                            color: medal ? "#fff" : "#64748b",
                                        }}
                                    >
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">
                                            {item.user?.FullName || `User #${item.userId}`}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate">
                                            {item.user?.PosteOccupe || "Non défini"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${
                                                    item.progress >= 100
                                                        ? "bg-emerald-500"
                                                        : item.progress >= 50
                                                        ? "bg-blue-500"
                                                        : "bg-amber-500"
                                                }`}
                                                style={{ width: `${Math.min(item.progress, 100)}%` }}
                                            />
                                        </div>
                                        <span
                                            className={`text-sm font-bold min-w-[50px] text-right ${
                                                item.progress >= 100
                                                    ? "text-emerald-500"
                                                    : item.progress >= 50
                                                    ? "text-blue-500"
                                                    : "text-amber-500"
                                            }`}
                                        >
                                            {Math.round(item.progress)}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Section Objectifs Mensuels */}
            <div className="card-luxury p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-slate-800">Objectifs Mensuels</h2>
                    <button
                        onClick={() => navigate('/objectifs/new', {
                            state: {
                                typePeriode: 'Mensuel',
                                selectedUserId: selectedUserId !== 'all' ? selectedUserId : null,
                                selectedMonth: selectedMonth !== 'all' ? parseInt(selectedMonth) : new Date().getMonth() + 1,
                                selectedYear: parseInt(selectedYear)
                            }
                        })}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                        <PlusIcon className="h-4 w-4" /> Ajouter
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reduxLoading && filteredObjectifs.filter(o => o.TypePeriode === 'Mensuel' || !o.TypePeriode).length === 0 ? (
                        <div className="col-span-full py-20 flex justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : filteredObjectifs.filter(o => o.TypePeriode === 'Mensuel' || !o.TypePeriode).length > 0 ? filteredObjectifs.filter(o => o.TypePeriode === 'Mensuel' || !o.TypePeriode).map((goal) => {
                            const progress = Math.min(((goal.Montant_Realise_Actuel || 0) / (goal.MontantCible || 1)) * 100, 100);
                            const visuals = getGoalVisuals(goal.TypeObjectif);
                            const config = COLOR_MAP[visuals.color] || COLOR_MAP.blue;
                            const Icon = visuals.icon;

                            return (
                                <div key={goal.ID_Objectif} className={`card-luxury p-5 group flex flex-col border ${config.border} hover:border-blue-300 transition-all`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-2 rounded-lg ${config.light} border ${config.border}`}>
                                            <Icon className={`h-4 w-4 ${config.text}`} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => navigate(`/objectifs/edit/${goal.ID_Objectif}`, {
                                                    state: { objectif: goal }
                                                })}
                                                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all opacity-0 group-hover:opacity-100"
                                                title="Modifier"
                                            >
                                                <EyeIcon className="h-4 w-4" />
                                            </button>
                                            <div className="text-right">
                                                <p className={`text-xl font-bold ${config.text}`}>{Math.round(progress)}%</p>
                                            </div>
                                        </div>
                                    </div>

                                    <h4 className="text-sm font-semibold text-slate-800 mb-1">{goal.TypeObjectif}</h4>
                                    {goal.Libelle_Indicateur && (
                                        <p className="text-xs text-slate-400 mb-3">{goal.Libelle_Indicateur}</p>
                                    )}

                                    <div className="flex items-baseline gap-2 mb-3">
                                        <span className="text-lg font-bold text-slate-800">
                                            {(goal.Montant_Realise_Actuel || 0).toLocaleString()}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            / {(goal.MontantCible || 0).toLocaleString()} {visuals.unit}
                                        </span>
                                    </div>

                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${config.bg}`}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-auto">
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${goal.Statut === 'Atteint' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
                                            {goal.Statut || 'En cours'}
                                        </span>
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <CalendarIcon className="h-3 w-3" />
                                            {goal.DateDebut ? new Date(goal.DateDebut).toLocaleDateString('fr') : '...'} - {goal.DateFin ? new Date(goal.DateFin).toLocaleDateString('fr') : '...'}
                                        </span>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="col-span-full py-16 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                                <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 mb-4">
                                    <FlagIcon className="h-6 w-6" />
                                </div>
                                <h3 className="text-xs font-bold text-slate-500 mb-1">Aucun objectif trouvé</h3>
                                <p className="text-[10px] text-slate-400 mb-4">Modifiez les filtres pour afficher les résultats</p>
                                <button
                                    onClick={() => {
                                        setFilterType('all');
                                        setFilterStatus('all');
                                        setSearchTerm('');
                                    }}
                                    className="btn-soft-primary px-6 text-[10px] font-bold py-2"
                                >
                                    Réinitialiser
                                </button>
                            </div>
                        )}

                    {/* Add New Card */}
                    <button
                        onClick={() => navigate('/objectifs/new')}
                        className="rounded-2xl p-5 border-2 border-dashed border-slate-200 bg-slate-50/30 flex flex-col items-center justify-center text-center gap-3 hover:border-blue-300 hover:bg-blue-50/20 transition-all group min-h-[180px]"
                    >
                        <div className="h-10 w-10 bg-white rounded-xl shadow-soft flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                            <PlusIcon className="h-5 w-5 stroke-[3]" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nouvel Objectif</p>
                    </button>
                </div>
            </div>

            {/* Section Objectifs Hebdomadaires */}
            <div className="card-luxury p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-slate-800">Objectifs Hebdomadaires</h2>
                    <button
                        onClick={() => navigate('/objectifs/new', {
                            state: {
                                typePeriode: 'Hebdomadaire',
                                selectedUserId: selectedUserId !== 'all' ? selectedUserId : null,
                                selectedMonth: selectedMonth !== 'all' ? parseInt(selectedMonth) : new Date().getMonth() + 1,
                                selectedYear: parseInt(selectedYear)
                            }
                        })}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                        <PlusIcon className="h-4 w-4" /> Ajouter
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {reduxLoading && filteredObjectifs.filter(o => o.TypePeriode === 'Hebdomadaire').length === 0 ? (
                        <div className="col-span-full py-20 flex justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : filteredObjectifs.filter(o => o.TypePeriode === 'Hebdomadaire').length > 0 ? filteredObjectifs.filter(o => o.TypePeriode === 'Hebdomadaire').map((goal) => {
                            const progress = Math.min(((goal.Montant_Realise_Actuel || 0) / (goal.MontantCible || 1)) * 100, 100);
                            const visuals = getGoalVisuals(goal.TypeObjectif);
                            const config = COLOR_MAP[visuals.color] || COLOR_MAP.blue;

                            return (
                                <div key={goal.ID_Objectif} className="card-luxury p-4 border border-slate-100 hover:border-blue-300 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-medium text-slate-500">
                                            {goal.Semaine || "Semaine"}
                                        </span>
                                        <span
                                            className={`text-sm font-bold ${
                                                progress >= 100
                                                    ? "text-emerald-500"
                                                    : progress >= 50
                                                    ? "text-blue-500"
                                                    : "text-amber-500"
                                            }`}
                                        >
                                            {Math.round(progress)}%
                                        </span>
                                    </div>

                                    <h4 className="text-sm font-medium text-slate-800 mb-2">{goal.TypeObjectif}</h4>

                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                                        <div
                                            className={`h-full rounded-full transition-all ${config.bg}`}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-slate-400">
                                        <span>
                                            {goal.Montant_Realise_Actuel || 0} / {goal.MontantCible || 0}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <CalendarIcon className="h-3 w-3" />
                                            {goal.DateDebut ? new Date(goal.DateDebut).toLocaleDateString('fr') : "..."}
                                        </span>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="col-span-full py-12 text-center">
                                <div className="inline-flex flex-col items-center gap-3">
                                    <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                                        <CalendarIcon className="h-8 w-8" />
                                    </div>
                                    <p className="text-slate-500 font-medium">Aucun objectif hebdomadaire trouvé</p>
                                    <button
                                        onClick={() => navigate('/objectifs/new', {
                                            state: { typePeriode: 'Hebdomadaire' }
                                        })}
                                        className="btn-soft-primary text-xs"
                                    >
                                        Créer un objectif hebdomadaire
                                    </button>
                                </div>
                            </div>
                        )}
                </div>
            </div>

        </div>
    );
};

export default Objectifs;
