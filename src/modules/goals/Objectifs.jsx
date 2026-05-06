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
import { motion } from 'framer-motion';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchObjectifs, updateObjectif } from './objectifSlice';
import axios from '../../app/axios';
import { getImageUrl } from '../../utils/imageUrl';
import useAuth from '../../hooks/useAuth';
import usePermission from '../../hooks/usePermission';
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
const parseMoney = (value) => {
    if (value === undefined || value === null || value === '') return 0;
    const normalized = String(value)
        .replace(/\s/g, '')
        .replace(',', '.')
        .replace(/[^0-9.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
};
const formatMoney = (value) => {
    const amount = parseMoney(value);
    return amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const getObjectifRealised = (objectif) => {
    const dynamic = parseMoney(objectif?.Montant_Realise_Actuel);
    const stored = parseMoney(objectif?.autVal);
    return dynamic > 0 ? dynamic : stored;
};
const getObjectifTarget = (objectif) => {
    const v1 = parseMoney(objectif?.MontantCible);
    const v2 = parseMoney(objectif?.autObj);
    return v1 > 0 ? v1 : v2;
};
const getObjectifDisplay = (objectif) => {
    const realised = formatMoney(getObjectifRealised(objectif));
    const target = formatMoney(getObjectifTarget(objectif));
    return `Réalisé: ${realised} / Cible: ${target} TND`;
};
const Objectifs = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { objectifs, loading: reduxLoading } = useSelector((state) => state.objectifs);
    const { user: currentUser, isAdmin, isCommercial, isAgent, isTechnicien } = useAuth();
    const { canCreate, canEdit, canDelete } = usePermission(42);
    const isStaffRole = isCommercial || isAgent || isTechnicien;
    const [users, setUsers] = useState([]);
    // Pas de filtres par défaut - afficher TOUS les objectifs de TOUS les utilisateurs
    const [selectedUserId, setSelectedUserId] = useState(location.state?.selectedUserId || 'all');
    const [selectedMonth, setSelectedMonth] = useState(location.state?.selectedMonth || 'all');
    const [selectedYear, setSelectedYear] = useState(location.state?.selectedYear || new Date().getFullYear());
    const [allObjectifs, setAllObjectifs] = useState([]); // Tous les objectifs pour le classement
    const [showArchived, setShowArchived] = useState(false);
    const [archivedObjectifs, setArchivedObjectifs] = useState([]);
    const [archivedLoading, setArchivedLoading] = useState(false);
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
        const monthlyData = Array(12).fill(0).map((_, index) => ({
            month: monthNames[index],
            sales: 0,
            originalIndex: index
        }));
        allObjectifs.forEach(obj => {
            if (obj.DateDebut) {
                const date = new Date(obj.DateDebut);
                const monthIndex = date.getMonth();
                const realised = getObjectifRealised(obj);
                monthlyData[monthIndex].sales += realised;
            }
        });
        return monthlyData.filter(d => d.sales > 0);
    }, [allObjectifs]);
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axios.get('/users/commercials/objectifs-filter');
                const usersData = res?.data || [];
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
                params.statut = 'actif';
                const res = await axios.get('/objectifs', { params });
                const objectivesData = res?.data || [];
                setAllObjectifs(objectivesData);
            } catch (error) {
                console.error('Erreur lors du chargement des objectifs:', error);
                setAllObjectifs([]);
            }
        };
        fetchAllObjectifs();
    }, [selectedUserId, selectedMonth, selectedYear]);

    const fetchArchivedObjectifs = async () => {
        setArchivedLoading(true);
        try {
            const params = {
                annee: selectedYear,
                statut: 'archive'
            };

            if (selectedMonth !== 'all') {
                params.mois = selectedMonth;
            }

            if (selectedUserId !== 'all') {
                params.userId = selectedUserId;
            }

            const res = await axios.get('/objectifs', { params });
            setArchivedObjectifs(res?.data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des objectifs archivés:', error);
            setArchivedObjectifs([]);
        } finally {
            setArchivedLoading(false);
        }
    };

    useEffect(() => {
        if (!showArchived) {
            return;
        }

        fetchArchivedObjectifs();
    }, [showArchived, selectedUserId, selectedMonth, selectedYear]);
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
                const progress = (getObjectifRealised(obj) / (getObjectifTarget(obj) || 1)) * 100;
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
    const visibleObjectifs = useMemo(() => (
        (filteredObjectifs || []).filter((objectif) => {
            const status = String(objectif?.StatutObjectif || '').toUpperCase();
            return status !== 'ARCHIVÉ' && status !== 'INACTIF';
        })
    ), [filteredObjectifs]);
    const monthlyObjectifs = useMemo(() => visibleObjectifs.filter((objectif) => objectif.TypePeriode === 'Mensuel' || !objectif.TypePeriode), [visibleObjectifs]);
    const weeklyObjectifs = useMemo(() => visibleObjectifs.filter((objectif) => objectif.TypePeriode === 'Hebdomadaire'), [visibleObjectifs]);
    const totalTarget = visibleObjectifs.reduce((acc, curr) => acc + getObjectifTarget(curr), 0);
    const totalRealised = visibleObjectifs.reduce((acc, curr) => acc + getObjectifRealised(curr), 0);
    const globalProgress = totalTarget > 0 ? (totalRealised / totalTarget) * 100 : 0;
    const selectedUser = (users || []).find(u => String(u.userId || u.UserID) === String(selectedUserId));
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
            const userId = obj.utilisateur?.UserID || obj.ID_Utilisateur;
            if (!userId) return; // Ignorer les objectifs sans utilisateur
            if (!groupedByUser[userId]) {
                groupedByUser[userId] = {
                    userId,
                    user: users.find(u => String(u.userId || u.UserID) === String(userId)),
                    objectifs: [],
                    totalTarget: 0,
                    totalRealised: 0,
                    progress: 0
                };
            }
            groupedByUser[userId].objectifs.push(obj);
            // IMPORTANT: Convertir en nombres pour éviter les problémes de calcul
            const montantCible = parseFloat(obj.MontantCible ?? obj.autObj) || 0;
            const montantRealise = getObjectifRealised(obj);
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

    const handleAdminCloseObjectif = async (objectif) => {
        if (!objectif?.ID_Objectif) return;

        const confirmed = window.confirm(
            `Clôturer cet objectif ?\n\nType: ${objectif.TypeObjectif || 'Objectif'}\nMontant actuel: ${getObjectifDisplay(objectif)}`
        );

        if (!confirmed) return;

        try {
            const response = await axios.post(`/objectifs/${objectif.ID_Objectif}/fermer-admin`);
            const updatedObjectif = response?.data?.data?.objectif;

            setAllObjectifs((prev) =>
                prev.map((item) =>
                    String(item.ID_Objectif) === String(objectif.ID_Objectif)
                        ? {
                            ...item,
                            ...(updatedObjectif || {}),
                            StatutObjectif: updatedObjectif?.StatutObjectif || 'INACTIF'
                          }
                        : item
                )
            );

            toast.success(response?.data?.data?.message || 'Objectif clôturé par l\'admin');

            if (showArchived) {
                await fetchArchivedObjectifs();
            }
        } catch (error) {
            const message = error?.response?.data?.message || error.message || 'Erreur lors de la clôture de l\'objectif';
            toast.error(message);
        }
    };
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
                        {isAdmin ? 'Pilotage des indicateurs clés • Toutes les données de la base' : 'Suivi de vos performances personnelles'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isAdmin && (
                        <button
                            onClick={() => setShowArchived((value) => !value)}
                            className="btn-soft-primary flex items-center gap-2 font-bold"
                        >
                            <TagIcon className="h-4 w-4" />
                            {showArchived ? 'Masquer archivés' : 'Afficher archivés'}
                        </button>
                    )}
                    {canCreate && (
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
                    )}
                </div>
            </div>
            {/* Filtres Section */}
            <div className="card-luxury p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="flex flex-wrap gap-3 flex-1">
                        {/* Filtre par Commercial - Admin uniquement */}
                        {isAdmin && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commercial</label>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                            >
                                <option key="user-all" value="all">Tous les commerciaux</option>
                                {users.map((u, i) => (
                                    <option key={u.UserID || u.userId || `user-${i}`} value={u.UserID || u.userId}>{u.FullName || u.fullName || u.label || u.LoginName || u.login}</option>
                                ))}
                            </select>
                        </div>
                        )}
                        {/* Filtre par Mois */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mois</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                            >
                                <option key="month-all" value="all">Tous les mois</option>
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
                                <option key="type-all" value="all">Tous les types</option>
                                {objectifTypes.map((type, i) => (
                                    <option key={type || `type-${i}`} value={type}>{type}</option>
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
                                <option key="status-all" value="all">Tous les statuts</option>
                                <option key="status-completed" value="completed">Complétés (≥100%)</option>
                                <option key="status-in-progress" value="in-progress">En cours (50-99%)</option>
                                <option key="status-at-risk" value="at-risk">À risque (&lt;50%)</option>
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
                            {visibleObjectifs.length} objectif{visibleObjectifs.length > 1 ? 's' : ''} trouvé{visibleObjectifs.length > 1 ? 's' : ''}
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
                {/* Team Ranking - Admin uniquement */}
                {isAdmin && (
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
                )}
            </div>
            {/* Section Objectifs Mensuels */}
            <div className="card-luxury p-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-extrabold text-slate-800">Objectif Mensuelle</h2>
                    {canCreate && (
                        <button
                            onClick={() => navigate('/objectifs/new', {
                                state: {
                                    typePeriode: 'Mensuel',
                                    selectedUserId: selectedUserId !== 'all' ? selectedUserId : null,
                                    selectedMonth: selectedMonth !== 'all' ? parseInt(selectedMonth) : new Date().getMonth() + 1,
                                    selectedYear: parseInt(selectedYear)
                                }
                            })}
                            className="btn-soft-primary flex items-center gap-2 text-sm font-bold"
                        >
                            <PlusIcon className="h-4 w-4" /> Ajouter Objectif
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reduxLoading && monthlyObjectifs.length === 0 ? (
                        <div className="col-span-full py-20 flex justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : monthlyObjectifs.length > 0 ? monthlyObjectifs.map((goal) => {
                            const progress = Math.min((getObjectifRealised(goal) / (getObjectifTarget(goal) || 1)) * 100, 100);
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
                                            {isAdmin && goal.StatutObjectif !== 'INACTIF' && (
                                                <button
                                                    onClick={() => handleAdminCloseObjectif(goal)}
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all opacity-0 group-hover:opacity-100"
                                                    title="Clôturer l'objectif"
                                                >
                                                    <XMarkIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                            <div className="text-right">
                                                <p className={`text-2xl font-black ${config.text} tracking-tight`}>{Math.round(progress)}%</p>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Achévement</span>
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
                                            <span className={`text-2xl font-black text-slate-800`}>{formatMoney(getObjectifRealised(goal))}</span>
                                            <span className="text-xs font-bold text-slate-400">/ {formatMoney(getObjectifTarget(goal))} {visuals.unit}</span>
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
                {canCreate && visibleObjectifs.length > 0 && (
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
            </div>
            {/* Section Objectifs Hebdomadaires */}
            <div className="card-luxury p-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-extrabold text-slate-800">Objectif hebdomadaire</h2>
                    {canCreate && (
                        <button
                            onClick={() => navigate('/objectifs/new', {
                                state: {
                                    typePeriode: 'Hebdomadaire',
                                    selectedUserId: selectedUserId !== 'all' ? selectedUserId : null,
                                    selectedMonth: selectedMonth !== 'all' ? parseInt(selectedMonth) : new Date().getMonth() + 1,
                                    selectedYear: parseInt(selectedYear)
                                }
                            })}
                            className="btn-soft-primary flex items-center gap-2 text-sm font-bold"
                        >
                            <PlusIcon className="h-4 w-4" /> Ajouter Période
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reduxLoading && weeklyObjectifs.length === 0 ? (
                        <div className="col-span-full py-20 flex justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : weeklyObjectifs.length > 0 ? weeklyObjectifs.map((goal) => {
                            const progress = Math.min((getObjectifRealised(goal) / (getObjectifTarget(goal) || 1)) * 100, 100);
                            const visuals = getGoalVisuals(goal.TypeObjectif);
                            const config = COLOR_MAP[visuals.color] || COLOR_MAP.blue;
                            const Icon = visuals.icon;
                            return (
                                <div key={goal.ID_Objectif} className={`card-luxury p-6 group flex flex-col ${config.border}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`icon-shape icon-shape-sm shadow-soft ${config.bg}`}>
                                            <CalendarIcon className="h-5 w-5 text-white" />
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
                                            {isAdmin && goal.StatutObjectif !== 'INACTIF' && (
                                                <button
                                                    onClick={() => handleAdminCloseObjectif(goal)}
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all opacity-0 group-hover:opacity-100"
                                                    title="Clôturer l'objectif"
                                                >
                                                    <XMarkIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <h4 className="text-sm font-bold text-slate-800 mb-2">{goal.Semaine || 'Semaine non définie'}</h4>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <CalendarIcon className="h-3 w-3" />
                                            <span>
                                                {goal.DateDebut ? new Date(goal.DateDebut).toLocaleDateString('fr-FR') : '...'}
                                                {' → '}
                                                {goal.DateFin ? new Date(goal.DateFin).toLocaleDateString('fr-FR') : '...'}
                                            </span>
                                        </div>
                                        {goal.utilisateur && (
                                            <p className="text-xs text-slate-400 mt-1">
                                                {goal.utilisateur.FullName || goal.utilisateur.LoginName}
                                            </p>
                                        )}
                                    </div>
                                    <div className="mt-auto">
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${config.bg}`}
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-600">{Math.round(progress)}%</span>
                                            <span className="text-slate-400">
                                                {getObjectifDisplay(goal)}
                                            </span>
                                        </div>
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
            {showArchived && (
                <div className="card-luxury p-8 border border-dashed border-slate-300 bg-slate-50/80">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-700">Objectifs archivés</h2>
                            <p className="text-sm text-slate-500">Historique des objectifs clôturés ou archivés automatiquement</p>
                        </div>
                    </div>
                    {archivedLoading ? (
                        <div className="py-12 flex justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : archivedObjectifs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {archivedObjectifs.map((goal) => {
                                const progress = Math.min((getObjectifRealised(goal) / (getObjectifTarget(goal) || 1)) * 100, 100);
                                const visuals = getGoalVisuals(goal.TypeObjectif);
                                const config = COLOR_MAP[visuals.color] || COLOR_MAP.slate;
                                const Icon = visuals.icon;

                                return (
                                    <motion.div 
                                        key={`archived-${goal.ID_Objectif}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileHover={{ y: -5 }}
                                        className="relative group"
                                    >
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-200 to-slate-300 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                                        <div className="relative flex flex-col h-full bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden">
                                            {/* Decoration background */}
                                            <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-700 ${config.bg}`}></div>
                                            
                                            <div className="flex items-start justify-between mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`flex items-center justify-center h-12 w-12 rounded-2xl shadow-lg shadow-${visuals.color}-100/50 transition-transform group-hover:rotate-12 duration-500 bg-gradient-to-br ${config.gradient}`}>
                                                        <Icon className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-black text-slate-800 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                                                            {goal.TypeObjectif}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                                                {goal.TypePeriode || 'Mensuel'}
                                                            </span>
                                                            {isAdmin && goal.utilisateur && (
                                                                <span className="text-[10px] font-bold text-blue-500/80 italic">
                                                                    by {goal.utilisateur.FullName.split(' ')[0]}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-500 ${
                                                    goal.StatutObjectif === 'ARCHIVÉ' 
                                                        ? 'bg-amber-50 text-amber-600 border-amber-100 shadow-sm shadow-amber-100' 
                                                        : 'bg-slate-50 text-slate-400 border-slate-100'
                                                }`}>
                                                    {goal.StatutObjectif || 'ARCHIVÉ'}
                                                </div>
                                            </div>

                                            <div className="space-y-4 flex-1">
                                                <div className="p-3.5 rounded-2xl bg-slate-50/50 border border-slate-100/50 space-y-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5 text-slate-400">
                                                            <CalendarIcon className="h-3.5 w-3.5" />
                                                            <span className="text-[10px] font-bold uppercase tracking-wider">Durée</span>
                                                        </div>
                                                        <span className="text-xs font-black text-slate-700">
                                                            {goal.DateDebut ? new Date(goal.DateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '...'}
                                                            <span className="mx-1.5 text-slate-300">→</span>
                                                            {goal.DateFin ? new Date(goal.DateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '...'}
                                                        </span>
                                                    </div>

                                                    {goal.DateArchivage && (
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5 text-amber-400">
                                                                <ArrowPathIcon className="h-3.5 w-3.5" />
                                                                <span className="text-[10px] font-bold uppercase tracking-wider">Fermé le</span>
                                                            </div>
                                                            <span className="text-xs font-black text-amber-600">
                                                                {new Date(goal.DateArchivage).toLocaleDateString('fr-FR')}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5 text-blue-400">
                                                            <BanknotesIcon className="h-3.5 w-3.5" />
                                                            <span className="text-[10px] font-bold uppercase tracking-wider">Actes</span>
                                                        </div>
                                                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-blue-50 text-xs font-black text-blue-600 border border-blue-100">
                                                            {goal.NombreReglementsLies || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6">
                                                <div className="flex items-end justify-between mb-3">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Performance</p>
                                                        <p className={`text-2xl font-black tracking-tight ${progress >= 100 ? 'text-emerald-600' : 'text-slate-700'}`}>
                                                            {Math.round(progress)}<span className="text-sm ml-0.5 opacity-60">%</span>
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-bold text-slate-400 mb-0.5">Valeur finale</p>
                                                        <p className="text-sm font-black text-slate-800 tracking-tight">
                                                            {formatMoney(getObjectifRealised(goal))} <span className="text-[10px] text-slate-400">TND</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                        className={`absolute inset-y-0 left-0 rounded-full shadow-lg ${
                                                            progress >= 100 
                                                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-emerald-200' 
                                                                : 'bg-gradient-to-r from-slate-400 to-slate-500 shadow-slate-200'
                                                        }`}
                                                    />
                                                </div>
                                                
                                                <p className="mt-3 text-center text-[10px] font-bold text-slate-400 italic">
                                                    Cible initiale: {formatMoney(getObjectifTarget(goal))} TND
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-slate-500">
                            Aucun objectif archivé pour les filtres sélectionnés.
                        </div>
                    )}
                </div>
            )}
            {/* Classement Performance équipe - Admin uniquement */}
            {isAdmin && commercialRanking.length > 0 && (
                <div className="card-luxury p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="icon-shape icon-shape-sm bg-gradient-to-br from-blue-500 to-blue-600">
                            <TrophyIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800">Classement Performance équipe</h2>
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
