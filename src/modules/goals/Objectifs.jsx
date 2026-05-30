import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ChartBarIcon, ArrowUpIcon, ArrowDownIcon, TrophyIcon, FlagIcon,
    UserGroupIcon, CalendarIcon, PlusIcon, SparklesIcon,
    CheckCircleIcon, BriefcaseIcon, ArrowTrendingUpIcon, BanknotesIcon,
    UsersIcon, ArrowPathIcon, EyeIcon, TagIcon,
    MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon,
    ChevronLeftIcon, ChevronRightIcon, ExclamationTriangleIcon, ClockIcon, FunnelIcon
} from '@heroicons/react/24/outline';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchObjectifs, updateObjectif } from './objectifSlice';
import axios from '../../app/axios';
import { getImageUrl } from '../../utils/imageUrl';
import useAuth from '../../hooks/useAuth';
import usePermission from '../../hooks/usePermission';

/* ─── helpers ─────────────────────────────────────────────── */
const NF_META = {
    0:  { icon: CalendarIcon,  unit: 'appels',   isCount: true },
    1:  { icon: UserGroupIcon, unit: 'visites',  isCount: true },
    2:  { icon: UserGroupIcon, unit: 'visites',  isCount: true },
    6:  { icon: UsersIcon,     unit: 'contacts', isCount: true },
    7:  { icon: UsersIcon,     unit: 'contacts', isCount: true },
    8:  { icon: UsersIcon,     unit: 'contacts', isCount: true },
    9:  { icon: UsersIcon,     unit: 'sociétés', isCount: true },
    10: { icon: BriefcaseIcon, unit: 'projets',  isCount: true },
    13: { icon: CalendarIcon,  unit: 'visites',  isCount: true },
};

const getGoalMeta = (goal) => {
    if (goal?.nf !== null && goal?.nf !== undefined && NF_META[goal.nf])
        return NF_META[goal.nf];
    return { icon: BanknotesIcon, unit: 'TND', isCount: false };
};

const parseMoney   = (v) => { if (!v && v !== 0) return 0; const n = Number(String(v).replace(/\s/g,'').replace(',','.').replace(/[^0-9.-]/g,'')); return Number.isFinite(n) ? n : 0; };
const formatMoney  = (v) => parseMoney(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatCount  = (v) => Math.round(parseMoney(v)).toLocaleString('fr-FR');
const formatValue  = (v, isCount) => isCount ? formatCount(v) : formatMoney(v);
const getObjectifRealised = (o) => { const d = parseMoney(o?.Montant_Realise_Actuel); return d > 0 ? d : parseMoney(o?.autVal); };
const getObjectifTarget   = (o) => { const v = parseMoney(o?.MontantCible); return v > 0 ? v : parseMoney(o?.autObj); };
const getProgress  = (o) => { const t = getObjectifTarget(o); return t > 0 ? Math.min((getObjectifRealised(o)/t)*100, 100) : 0; };

/* Status-based colors — soft pastels */
const progressColor   = (p) => p >= 100 ? '#34d399' : p >= 50 ? '#fbbf24' : '#cbd5e1';
const progressBgClass = (p) => p >= 100 ? 'bg-emerald-400' : p >= 50 ? 'bg-amber-400' : 'bg-slate-300';
const progressLabel   = (p) => p >= 100
    ? { bg: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-400', label: 'Atteint'  }
    : p >= 50
    ? { bg: 'bg-amber-50 text-amber-600 border-amber-100',       dot: 'bg-amber-400',   label: 'En cours' }
    :   { bg: 'bg-slate-50 text-slate-500 border-slate-200',     dot: 'bg-slate-300',   label: 'À risque' };

/* ─── CircleProgress SVG ────────────────────────────────────── */
const CircleProgress = ({ progress, size = 56 }) => {
    const r = size * 0.38;
    const circ = 2 * Math.PI * r;
    const offset = circ - (Math.min(progress, 100) / 100) * circ;
    const color = progressColor(progress);
    const cx = size / 2, cy = size / 2;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={size * 0.07} />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={size * 0.07}
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
                style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize={size * 0.18}
                fontWeight="900" fill={color} fontFamily="system-ui, sans-serif">
                {Math.round(progress)}%
            </text>
        </svg>
    );
};

/* ─── ObjectifCard ──────────────────────────────────────────── */
const ObjectifCard = ({ goal, onEdit, onClose, isAdmin, index = 0 }) => {
    const progress = getProgress(goal);
    const { icon: Icon, unit, isCount } = getGoalMeta(goal);
    const pl = progressLabel(progress);

    /* Only the accent (left border + bar + %) carries color — card stays white */
    const accent = progress >= 100
        ? { leftBar: 'border-l-emerald-400', pct: 'text-emerald-500', iconBg: 'bg-slate-50', iconText: 'text-slate-500' }
        : progress >= 50
        ? { leftBar: 'border-l-amber-400',   pct: 'text-amber-500',   iconBg: 'bg-slate-50', iconText: 'text-slate-500' }
        : { leftBar: 'border-l-slate-300',   pct: 'text-slate-500',   iconBg: 'bg-slate-50', iconText: 'text-slate-400' };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className={`group bg-white rounded-2xl border border-slate-200 border-l-[3px] ${accent.leftBar} shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden`}
        >
            {/* ── Header : toujours blanc/neutre ── */}
            <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-2 border-b border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-10 w-10 rounded-xl ${accent.iconBg} border border-slate-200 flex items-center justify-center flex-none`}>
                        <Icon className={`h-5 w-5 ${accent.iconText}`} />
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-800 leading-snug truncate max-w-[160px]">{goal.TypeObjectif}</h4>
                        {goal.utilisateur && (
                            <p className="text-xs text-slate-400 truncate max-w-[160px] mt-0.5">
                                {goal.utilisateur.FullName || goal.utilisateur.LoginName}
                            </p>
                        )}
                    </div>
                </div>
                {/* Actions on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-none pt-0.5">
                    {onEdit && (
                        <button onClick={onEdit}
                            className="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 border border-slate-200 transition-colors">
                            <EyeIcon className="h-3.5 w-3.5" />
                        </button>
                    )}
                    {isAdmin && onClose && (
                        <button onClick={onClose}
                            className="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-400 border border-slate-200 transition-colors">
                            <XMarkIcon className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Body ── */}
            <div className="px-5 pt-4 pb-5 flex flex-col gap-4 flex-1">

                {/* Status badge + pourcentage + barre */}
                <div>
                    <div className="flex items-center justify-between mb-2.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${pl.bg}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${pl.dot}`} />
                            {pl.label}
                        </span>
                        <span className={`text-2xl font-black leading-none ${accent.pct}`}>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.9, ease: 'easeOut', delay: index * 0.06 + 0.15 }}
                            className={`h-full rounded-full ${progressBgClass(progress)}`}
                        />
                    </div>
                </div>

                {/* Stat tiles */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Réalisé</p>
                        <p className="text-base font-black text-slate-800 leading-none">{formatValue(getObjectifRealised(goal), isCount)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{unit}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Objectif</p>
                        <p className="text-base font-black text-slate-800 leading-none">{formatValue(getObjectifTarget(goal), isCount)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{unit}</p>
                    </div>
                </div>

                {/* Date range */}
                {(goal.DateDebut || goal.DateFin) && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-auto pt-1">
                        <CalendarIcon className="h-3 w-3 flex-none text-slate-300" />
                        {goal.DateDebut ? new Date(goal.DateDebut).toLocaleDateString('fr') : '…'}
                        <span className="text-slate-300 mx-0.5">→</span>
                        {goal.DateFin ? new Date(goal.DateFin).toLocaleDateString('fr') : '…'}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

/* ─── FilterPill ─── soft pastel active states ──────────────── */
const FilterPill = ({ active, onClick, children, color = 'indigo' }) => {
    const colors = {
        indigo:  active ? 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm'  : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50',
        emerald: active ? 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-200 hover:text-emerald-600 hover:bg-emerald-50',
        amber:   active ? 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm'    : 'bg-white text-slate-500 border-slate-200 hover:border-amber-200 hover:text-amber-600 hover:bg-amber-50',
        rose:    active ? 'bg-rose-100 text-rose-600 border-rose-200 shadow-sm'       : 'bg-white text-slate-500 border-slate-200 hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50',
    };
    return (
        <button onClick={onClick} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border text-xs font-semibold transition-all duration-150 ${colors[color]}`}>
            {children}
        </button>
    );
};

/* ─── Main page ─────────────────────────────────────────────── */
const Objectifs = () => {
    const navigate  = useNavigate();
    const location  = useLocation();
    const dispatch  = useDispatch();
    const { objectifs, loading: reduxLoading } = useSelector((s) => s.objectifs);
    const { user: currentUser, isAdmin } = useAuth();
    const { canCreate } = usePermission(42);

    const [users, setUsers]               = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(location.state?.selectedUserId || 'all');
    const [selectedMonth,  setSelectedMonth]  = useState(location.state?.selectedMonth  || 'all');
    const [selectedYear,   setSelectedYear]   = useState(location.state?.selectedYear   || new Date().getFullYear());
    const [allObjectifs,   setAllObjectifs]   = useState([]);
    const [showArchived,   setShowArchived]   = useState(false);
    const [archivedObjectifs, setArchivedObjectifs] = useState([]);
    const [archivedLoading,   setArchivedLoading]   = useState(false);
    const [filterType,   setFilterType]   = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm,   setSearchTerm]   = useState('');
    const [showFilters,  setShowFilters]  = useState(true);

    const months = [
        { id:1,name:'Jan' },{ id:2,name:'Fév' },{ id:3,name:'Mar' },
        { id:4,name:'Avr' },{ id:5,name:'Mai' },{ id:6,name:'Juin' },
        { id:7,name:'Juil'},{ id:8,name:'Août'},{ id:9,name:'Sep'  },
        { id:10,name:'Oct'},{ id:11,name:'Nov'},{ id:12,name:'Déc' }
    ];

    const chartData = useMemo(() => {
        const names = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
        const monthly = names.map((m, i) => ({ month: m, sales: 0, i }));
        allObjectifs.forEach(o => {
            if (o.DateDebut) monthly[new Date(o.DateDebut).getMonth()].sales += getObjectifRealised(o);
        });
        return monthly.filter(d => d.sales > 0);
    }, [allObjectifs]);

    useEffect(() => {
        axios.get('/users/commercials/objectifs-filter').then(r => setUsers(r?.data || [])).catch(() => {});
    }, []);

    useEffect(() => {
        const p = { annee: selectedYear, statut: 'actif' };
        if (selectedMonth !== 'all') p.mois = selectedMonth;
        if (selectedUserId !== 'all') p.userId = selectedUserId;
        axios.get('/objectifs', { params: p }).then(r => setAllObjectifs(r?.data || [])).catch(() => setAllObjectifs([]));
    }, [selectedUserId, selectedMonth, selectedYear]);

    const fetchArchivedObjectifs = async () => {
        setArchivedLoading(true);
        try {
            const p = { annee: selectedYear, statut: 'archive' };
            if (selectedMonth !== 'all') p.mois = selectedMonth;
            if (selectedUserId !== 'all') p.userId = selectedUserId;
            const r = await axios.get('/objectifs', { params: p });
            setArchivedObjectifs(r?.data || []);
        } catch { setArchivedObjectifs([]); } finally { setArchivedLoading(false); }
    };

    useEffect(() => { if (showArchived) fetchArchivedObjectifs(); }, [showArchived, selectedUserId, selectedMonth, selectedYear]);
    useEffect(() => { if (location.state?.refresh) window.history.replaceState({}, document.title); }, [location.state?.refresh]);

    const filteredObjectifs = useMemo(() => {
        let f = allObjectifs;
        if (filterType !== 'all') f = f.filter(o => o.TypeObjectif === filterType);
        if (filterStatus !== 'all') f = f.filter(o => {
            const p = getProgress(o);
            if (filterStatus === 'completed')   return p >= 100;
            if (filterStatus === 'in-progress') return p >= 50 && p < 100;
            if (filterStatus === 'at-risk')     return p < 50;
            return true;
        });
        if (searchTerm) f = f.filter(o =>
            o.TypeObjectif?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.Description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return f;
    }, [allObjectifs, filterType, filterStatus, searchTerm]);

    const visibleObjectifs  = useMemo(() => filteredObjectifs.filter(o => !['ARCHIVÉ','INACTIF'].includes(String(o?.StatutObjectif||'').toUpperCase())), [filteredObjectifs]);
    const monthlyObjectifs  = useMemo(() => visibleObjectifs.filter(o => o.TypePeriode === 'Mensuel' || !o.TypePeriode), [visibleObjectifs]);
    const weeklyObjectifs   = useMemo(() => visibleObjectifs.filter(o => o.TypePeriode === 'Hebdomadaire'), [visibleObjectifs]);

    const totalTarget    = visibleObjectifs.reduce((a,o) => a + getObjectifTarget(o), 0);
    const totalRealised  = visibleObjectifs.reduce((a,o) => a + getObjectifRealised(o), 0);
    const globalProgress = totalTarget > 0 ? (totalRealised / totalTarget) * 100 : 0;

    const objectifTypes = useMemo(() => [...new Set(allObjectifs.map(o => o.TypeObjectif).filter(Boolean))], [allObjectifs]);

    const commercialRanking = useMemo(() => {
        const grouped = {};
        allObjectifs.forEach(o => {
            const uid = o.utilisateur?.UserID || o.ID_Utilisateur;
            if (!uid) return;
            if (!grouped[uid]) grouped[uid] = { userId:uid, user: users.find(u=>String(u.userId||u.UserID)===String(uid)), totalTarget:0, totalRealised:0 };
            grouped[uid].totalTarget   += parseFloat(o.MontantCible ?? o.autObj) || 0;
            grouped[uid].totalRealised += getObjectifRealised(o);
        });
        return Object.values(grouped)
            .map(it => ({ ...it, progress: it.totalTarget > 0 ? (it.totalRealised/it.totalTarget)*100 : 0 }))
            .sort((a,b) => b.progress - a.progress);
    }, [allObjectifs, users]);

    const handleAdminCloseObjectif = async (goal) => {
        if (!goal?.ID_Objectif) return;
        if (!window.confirm(`Clôturer cet objectif ?\n\nType: ${goal.TypeObjectif}`)) return;
        try {
            const r = await axios.post(`/objectifs/${goal.ID_Objectif}/fermer-admin`);
            const updated = r?.data?.data?.objectif;
            setAllObjectifs(prev => prev.map(it => String(it.ID_Objectif)===String(goal.ID_Objectif)
                ? { ...it, ...(updated||{}), StatutObjectif: updated?.StatutObjectif||'INACTIF' } : it));
            toast.success(r?.data?.data?.message || "Objectif clôturé");
            if (showArchived) fetchArchivedObjectifs();
        } catch (e) { toast.error(e?.response?.data?.message || "Erreur lors de la clôture"); }
    };

    const navToNew = (extra={}) => navigate('/objectifs/new', { state: {
        selectedUserId: selectedUserId !== 'all' ? selectedUserId : null,
        selectedMonth:  selectedMonth  !== 'all' ? parseInt(selectedMonth) : new Date().getMonth()+1,
        selectedYear:   parseInt(selectedYear), ...extra
    }});

    const activeFiltersCount = [filterType!=='all', filterStatus!=='all', !!searchTerm, selectedMonth!=='all'].filter(Boolean).length;
    const medals = ['#F59E0B','#94A3B8','#B45309'];

    /* KPI cards — soft pastel accents */
    const kpis = [
        {
            label: 'Atteinte globale',
            value: `${Math.round(globalProgress)}%`,
            sub: 'progression',
            icon: ArrowTrendingUpIcon,
            trend: globalProgress >= 50 ? 'up' : 'down',
            border: 'border-l-indigo-300',
            bg: 'bg-indigo-50',
            text: 'text-indigo-500',
            ring: 'ring-indigo-100',
        },
        {
            label: 'Objectif total',
            value: totalTarget >= 1000 ? `${(totalTarget/1000).toFixed(1)}k` : Math.round(totalTarget).toLocaleString(),
            sub: 'TND / période',
            icon: FlagIcon,
            border: 'border-l-sky-300',
            bg: 'bg-sky-50',
            text: 'text-sky-500',
            ring: 'ring-sky-100',
        },
        {
            label: 'Réalisé',
            value: totalRealised >= 1000 ? `${(totalRealised/1000).toFixed(1)}k` : Math.round(totalRealised).toLocaleString(),
            sub: 'TND cumulés',
            icon: ChartBarIcon,
            trend: 'up',
            border: 'border-l-emerald-300',
            bg: 'bg-emerald-50',
            text: 'text-emerald-500',
            ring: 'ring-emerald-100',
        },
        {
            label: 'Écart restant',
            value: (totalTarget-totalRealised) >= 1000 ? `${((totalTarget-totalRealised)/1000).toFixed(1)}k` : Math.round(Math.max(0, totalTarget-totalRealised)).toLocaleString(),
            sub: 'TND à faire',
            icon: ArrowPathIcon,
            border: 'border-l-amber-300',
            bg: 'bg-amber-50',
            text: 'text-amber-500',
            ring: 'ring-amber-100',
        },
    ];

    return (
        <div className="animate-fade-in space-y-5 pb-12">

            {/* ── Hero header ─────────────────────────── */}
            <div className="rounded-2xl relative overflow-hidden bg-white border border-slate-200/80 shadow-sm p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                {/* Subtle pastel gradient wash */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white to-violet-50/30 pointer-events-none" />
                <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-indigo-50/40 to-transparent pointer-events-none" />

                <div className="relative">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-500 text-xs font-semibold mb-3">
                        <SparklesIcon className="h-3.5 w-3.5" /> Performances commerciales
                    </span>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Objectifs Commerciaux</h1>
                    <p className="text-slate-400 mt-1 text-sm">
                        {isAdmin ? 'Pilotage des indicateurs clés — toutes les équipes' : 'Suivi de vos performances personnelles'}
                    </p>
                    <div className="flex items-center gap-2.5 mt-5 flex-wrap">
                        {isAdmin && (
                            <button onClick={() => setShowArchived(v => !v)}
                                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium border border-slate-200 shadow-sm transition-all">
                                <TagIcon className="h-4 w-4 text-slate-400" />
                                {showArchived ? 'Masquer archivés' : 'Voir archivés'}
                            </button>
                        )}
                        {canCreate && (
                            <button onClick={() => navToNew()}
                                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[#0062AF] hover:bg-[#004a85] text-white text-sm font-semibold shadow-sm transition-all active:scale-95">
                                <PlusIcon className="h-4 w-4" /> Nouvel Objectif
                            </button>
                        )}
                    </div>
                </div>

                {/* Global progress ring */}
                <div className="relative flex items-center gap-5 bg-slate-50/80 rounded-2xl px-6 py-4 border border-slate-200/80 flex-shrink-0">
                    <div className="relative">
                        <svg width="84" height="84" viewBox="0 0 84 84">
                            <circle cx="42" cy="42" r="32" fill="none" stroke="#e2e8f0" strokeWidth="7" />
                            <circle cx="42" cy="42" r="32" fill="none" stroke="#a5b4fc" strokeWidth="7"
                                strokeDasharray={2 * Math.PI * 32}
                                strokeDashoffset={2 * Math.PI * 32 - (Math.min(globalProgress,100)/100) * 2 * Math.PI * 32}
                                strokeLinecap="round" transform="rotate(-90 42 42)"
                                style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                            <text x="42" y="47" textAnchor="middle" fontSize="14" fontWeight="900" fill="#6366f1" fontFamily="system-ui">
                                {Math.round(globalProgress)}%
                            </text>
                        </svg>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Progression</p>
                        <p className="text-slate-700 font-bold text-lg leading-tight">{visibleObjectifs.length} objectif{visibleObjectifs.length !== 1 ? 's' : ''}</p>
                        <p className="text-indigo-400 text-xs mt-0.5">{selectedYear}</p>
                    </div>
                </div>
            </div>

            {/* ── KPI Cards ──────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((k, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`bg-white rounded-2xl border border-slate-100 border-l-4 ${k.border} shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-200`}
                    >
                        <div className="flex items-center justify-between">
                            <div className={`h-10 w-10 rounded-xl ${k.bg} ring-4 ${k.ring} flex items-center justify-center`}>
                                <k.icon className={`h-5 w-5 ${k.text}`} />
                            </div>
                            {k.trend && (
                                <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-lg ${k.bg} ${k.text}`}>
                                    {k.trend === 'up' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
                            <div className="flex items-baseline gap-1.5">
                                <span className={`text-2xl font-black ${k.text}`}>{k.value}</span>
                                <span className="text-xs text-slate-400">{k.sub}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Filters ────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Filter header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                    <div className="flex items-center gap-2">
                        <FunnelIcon className="h-4 w-4 text-indigo-500" />
                        <span className="text-sm font-semibold text-slate-700">Filtres & Recherche</span>
                        {activeFiltersCount > 0 && (
                            <span className="h-5 min-w-[1.25rem] px-1.5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center justify-center border border-indigo-200">
                                {activeFiltersCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Year nav */}
                        <div className="flex items-center gap-0.5 bg-white rounded-xl border border-slate-200 px-1 py-1 shadow-sm">
                            <button onClick={() => setSelectedYear(y => y - 1)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                                <ChevronLeftIcon className="h-4 w-4" />
                            </button>
                            <span className="px-2.5 text-sm font-bold text-slate-700">{selectedYear}</span>
                            <button onClick={() => setSelectedYear(y => y + 1)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                                <ChevronRightIcon className="h-4 w-4" />
                            </button>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">{visibleObjectifs.length} objectif{visibleObjectifs.length!==1?'s':''}</span>
                        {activeFiltersCount > 0 && (
                            <button onClick={() => { setFilterType('all'); setFilterStatus('all'); setSearchTerm(''); setSelectedMonth('all'); }}
                                className="text-xs text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1">
                                <XMarkIcon className="h-3.5 w-3.5" /> Réinitialiser
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {/* Row 1: Search + user select + type */}
                    <div className="flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-[180px]">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Rechercher un objectif…"
                                className="w-full pl-9 pr-4 h-9 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all" />
                        </div>
                        {isAdmin && (
                            <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}
                                className="h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 min-w-[180px]">
                                <option value="all">Tous les commerciaux</option>
                                {users.map((u,i) => <option key={u.UserID||u.userId||i} value={u.UserID||u.userId}>{u.FullName||u.fullName||u.LoginName||u.login}</option>)}
                            </select>
                        )}
                        {objectifTypes.length > 0 && (
                            <select value={filterType} onChange={e => setFilterType(e.target.value)}
                                className="h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700">
                                <option value="all">Tous les types</option>
                                {objectifTypes.map((t,i) => <option key={t||i} value={t}>{t}</option>)}
                            </select>
                        )}
                    </div>

                    {/* Row 2: Month pills + Status pills */}
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Month filter */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mois :</span>
                            <FilterPill active={selectedMonth === 'all'} onClick={() => setSelectedMonth('all')} color="indigo">Tous</FilterPill>
                            {months.map(m => (
                                <FilterPill key={m.id} active={String(selectedMonth) === String(m.id)} onClick={() => setSelectedMonth(m.id)} color="indigo">
                                    {m.name}
                                </FilterPill>
                            ))}
                        </div>
                    </div>

                    {/* Row 3: Status pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Statut :</span>
                        <FilterPill active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} color="indigo">Tous</FilterPill>
                        <FilterPill active={filterStatus === 'completed'} onClick={() => setFilterStatus('completed')} color="emerald">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Atteints (≥ 100%)
                        </FilterPill>
                        <FilterPill active={filterStatus === 'in-progress'} onClick={() => setFilterStatus('in-progress')} color="amber">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            En cours (50–99%)
                        </FilterPill>
                        <FilterPill active={filterStatus === 'at-risk'} onClick={() => setFilterStatus('at-risk')} color="rose">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                            À risque (&lt; 50%)
                        </FilterPill>
                    </div>
                </div>
            </div>

            {/* ── Charts row ─────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Area chart */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-sm font-bold text-slate-800">Évolution CA réalisé</h2>
                            <p className="text-xs text-slate-400">Par mois (somme des objectifs)</p>
                        </div>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            <span className="h-2 w-2 rounded-full bg-emerald-300" /> Réalisé
                        </span>
                    </div>
                    {chartData.length === 0 ? (
                        <div className="h-52 flex flex-col items-center justify-center gap-2">
                            <ChartBarIcon className="h-8 w-8 text-slate-200" />
                            <p className="text-sm text-slate-400 italic">Aucune donnée pour cette période</p>
                        </div>
                    ) : (
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top:5, right:5, left:0, bottom:0 }}>
                                    <defs>
                                        <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill:'#94a3b8', fontSize:11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill:'#94a3b8', fontSize:11 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                                    <Tooltip contentStyle={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:'0.75rem', fontSize:12 }}
                                        formatter={v => [`${v.toLocaleString()} TND`]} />
                                    <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2.5} fill="url(#gradCA)" dot={{ r:3, fill:'#10b981' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Ranking card */}
                {isAdmin && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                                <TrophyIcon className="h-5 w-5 text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-800">Top 5 — Classement Équipe</h2>
                                <p className="text-xs text-slate-400">Par avancement des objectifs</p>
                            </div>
                        </div>
                        {commercialRanking.length === 0 ? (
                            <p className="text-sm text-slate-400 italic text-center py-8">Aucune donnée</p>
                        ) : (
                            <div className="space-y-1.5">
                                {commercialRanking.slice(0, 5).map((item, i) => (
                                    <div key={item.userId} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-black flex-none"
                                            style={{ background: medals[i] || '#f1f5f9', color: i < 3 ? '#fff' : '#64748b' }}>
                                            {i+1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{item.user?.FullName || `User #${item.userId}`}</p>
                                        </div>
                                        <div className="flex items-center gap-2.5 flex-none">
                                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${progressBgClass(item.progress)}`}
                                                    style={{ width: `${Math.min(item.progress, 100)}%` }} />
                                            </div>
                                            <span className="text-sm font-black text-slate-700 min-w-[44px] text-right">
                                                {Math.round(item.progress)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Objectifs Mensuels ─────────────────── */}
            {(() => {
                const atteints   = monthlyObjectifs.filter(o => getProgress(o) >= 100).length;
                const enCours    = monthlyObjectifs.filter(o => getProgress(o) >= 50 && getProgress(o) < 100).length;
                const aRisque    = monthlyObjectifs.filter(o => getProgress(o) < 50).length;
                const total      = monthlyObjectifs.length;
                return (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">

                    {/* ── En-tête ── */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                <CalendarIcon className="h-5 w-5 text-indigo-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold text-slate-800">Objectifs Mensuels</h2>
                                    {total > 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                                            {total}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">Suivi de vos performances du mois</p>
                            </div>
                        </div>
                        {canCreate && (
                            <button onClick={() => navToNew({ typePeriode: 'Mensuel' })}
                                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-xl bg-[#0062AF] text-white text-xs font-semibold hover:bg-indigo-600 transition-all shadow-sm active:scale-95">
                                <PlusIcon className="h-3.5 w-3.5" /> Ajouter
                            </button>
                        )}
                    </div>

                    {/* ── Barre de répartition ── */}
                    {total > 0 && (
                        <div className="px-6 py-3 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between gap-6">
                            {/* Légende */}
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 flex-none" />
                                    <span className="text-xs text-slate-500 font-medium">{atteints} atteint{atteints !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400 flex-none" />
                                    <span className="text-xs text-slate-500 font-medium">{enCours} en cours</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300 flex-none" />
                                    <span className="text-xs text-slate-500 font-medium">{aRisque} à risque</span>
                                </div>
                            </div>
                            {/* Mini barre de répartition */}
                            <div className="flex h-2 w-40 rounded-full overflow-hidden gap-0.5 flex-none">
                                {atteints  > 0 && <div className="bg-emerald-400 rounded-full transition-all" style={{ flex: atteints  }} />}
                                {enCours   > 0 && <div className="bg-amber-400  rounded-full transition-all" style={{ flex: enCours   }} />}
                                {aRisque   > 0 && <div className="bg-slate-200  rounded-full transition-all" style={{ flex: aRisque   }} />}
                            </div>
                        </div>
                    )}

                    {/* ── Grille de cartes ── */}
                    <div className="p-5">
                        {reduxLoading && total === 0 ? (
                            <div className="py-16 flex justify-center"><LoadingSpinner /></div>
                        ) : total > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {monthlyObjectifs.map((goal, idx) => (
                                        <ObjectifCard key={goal.ID_Objectif} goal={goal} index={idx} isAdmin={isAdmin}
                                            onEdit={() => navigate(`/objectifs/edit/${goal.ID_Objectif}`, { state: { objectif: goal } })}
                                            onClose={() => handleAdminCloseObjectif(goal)} />
                                    ))}
                                </div>
                                {/* ── Footer d'action ── */}
                                {canCreate && (
                                    <button onClick={() => navToNew({ typePeriode: 'Mensuel' })}
                                        className="group mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-all">
                                        <PlusIcon className="h-4 w-4" />
                                        Ajouter un objectif mensuel
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="py-14 flex flex-col items-center text-center">
                                <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
                                    <FlagIcon className="h-8 w-8 text-indigo-300" />
                                </div>
                                <p className="text-sm font-semibold text-slate-600 mb-1">Aucun objectif mensuel</p>
                                <p className="text-xs text-slate-400 mb-5 max-w-[200px]">Aucun résultat pour les filtres sélectionnés</p>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => { setFilterType('all'); setFilterStatus('all'); setSearchTerm(''); setSelectedMonth('all'); }}
                                        className="h-8 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 bg-white hover:bg-slate-50 transition-colors">
                                        Réinitialiser
                                    </button>
                                    {canCreate && (
                                        <button onClick={() => navToNew({ typePeriode: 'Mensuel' })}
                                            className="h-8 px-4 rounded-xl bg-[#0062AF] text-white text-xs font-semibold hover:bg-indigo-600 transition-colors shadow-sm flex items-center gap-1.5">
                                            <PlusIcon className="h-3.5 w-3.5" /> Créer
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                );
            })()}

            {/* ── Objectifs Hebdomadaires ────────────── */}
            {(() => {
                const atteints = weeklyObjectifs.filter(o => getProgress(o) >= 100).length;
                const enCours  = weeklyObjectifs.filter(o => getProgress(o) >= 50 && getProgress(o) < 100).length;
                const aRisque  = weeklyObjectifs.filter(o => getProgress(o) < 50).length;
                const total    = weeklyObjectifs.length;
                return (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">

                    {/* ── En-tête ── */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                                <CalendarIcon className="h-5 w-5 text-violet-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold text-slate-800">Objectifs Hebdomadaires</h2>
                                    {total > 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                                            {total}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">Suivi de vos objectifs de la semaine</p>
                            </div>
                        </div>
                        {canCreate && (
                            <button onClick={() => navToNew({ typePeriode: 'Hebdomadaire' })}
                                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-xl bg-violet-400 text-white text-xs font-semibold hover:bg-violet-500 transition-all shadow-sm active:scale-95">
                                <PlusIcon className="h-3.5 w-3.5" /> Ajouter
                            </button>
                        )}
                    </div>

                    {/* ── Barre de répartition ── */}
                    {total > 0 && (
                        <div className="px-6 py-3 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between gap-6">
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 flex-none" />
                                    <span className="text-xs text-slate-500 font-medium">{atteints} atteint{atteints !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400 flex-none" />
                                    <span className="text-xs text-slate-500 font-medium">{enCours} en cours</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300 flex-none" />
                                    <span className="text-xs text-slate-500 font-medium">{aRisque} à risque</span>
                                </div>
                            </div>
                            <div className="flex h-2 w-40 rounded-full overflow-hidden gap-0.5 flex-none">
                                {atteints > 0 && <div className="bg-emerald-400 rounded-full transition-all" style={{ flex: atteints }} />}
                                {enCours  > 0 && <div className="bg-amber-400  rounded-full transition-all" style={{ flex: enCours  }} />}
                                {aRisque  > 0 && <div className="bg-slate-200  rounded-full transition-all" style={{ flex: aRisque  }} />}
                            </div>
                        </div>
                    )}

                    {/* ── Grille de cartes ── */}
                    <div className="p-5">
                        {reduxLoading && total === 0 ? (
                            <div className="py-16 flex justify-center"><LoadingSpinner /></div>
                        ) : total > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {weeklyObjectifs.map((goal, idx) => (
                                        <ObjectifCard key={goal.ID_Objectif} goal={goal} index={idx} isAdmin={isAdmin}
                                            onEdit={() => navigate(`/objectifs/edit/${goal.ID_Objectif}`, { state: { objectif: goal } })}
                                            onClose={() => handleAdminCloseObjectif(goal)} />
                                    ))}
                                </div>
                                {canCreate && (
                                    <button onClick={() => navToNew({ typePeriode: 'Hebdomadaire' })}
                                        className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-slate-200 hover:border-violet-300 hover:bg-violet-50/30 text-xs font-semibold text-slate-400 hover:text-violet-600 transition-all">
                                        <PlusIcon className="h-4 w-4" />
                                        Ajouter un objectif hebdomadaire
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="py-14 flex flex-col items-center text-center">
                                <div className="h-16 w-16 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-4">
                                    <CalendarIcon className="h-8 w-8 text-violet-300" />
                                </div>
                                <p className="text-sm font-semibold text-slate-600 mb-1">Aucun objectif hebdomadaire</p>
                                <p className="text-xs text-slate-400 mb-5 max-w-[200px]">Aucun objectif défini pour cette semaine</p>
                                {canCreate && (
                                    <button onClick={() => navToNew({ typePeriode: 'Hebdomadaire' })}
                                        className="inline-flex items-center gap-1.5 h-8 px-5 rounded-xl bg-violet-50 border border-violet-200 text-xs font-semibold text-violet-600 hover:bg-violet-100 transition-colors">
                                        <PlusIcon className="h-3.5 w-3.5" /> Créer un objectif hebdomadaire
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                );
            })()}

            {/* ── Archived ───────────────────────────── */}
            <AnimatePresence>
            {showArchived && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-slate-50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-200 flex items-center justify-center">
                            <TagIcon className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-700">Objectifs archivés</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Historique des objectifs clôturés</p>
                        </div>
                    </div>
                    <div className="p-5">
                        {archivedLoading ? (
                            <div className="py-12 flex justify-center"><LoadingSpinner /></div>
                        ) : archivedObjectifs.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {archivedObjectifs.map(goal => {
                                    const progress = getProgress(goal);
                                    const { icon: Icon } = getGoalMeta(goal);
                                    return (
                                        <motion.div key={`arch-${goal.ID_Objectif}`}
                                            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                                            className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col opacity-75 hover:opacity-100 transition-opacity">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center flex-none">
                                                    <Icon className="h-4 w-4 text-slate-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-700 truncate">{goal.TypeObjectif}</p>
                                                    <span className="text-[10px] font-semibold text-slate-400 uppercase">{goal.StatutObjectif || 'ARCHIVÉ'}</span>
                                                </div>
                                                <span className="text-sm font-black text-slate-500">{Math.round(progress)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mb-3">
                                                <div className={`h-full rounded-full ${progressBgClass(progress)}`} style={{ width: `${progress}%` }} />
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-slate-500">
                                                <span>{formatMoney(getObjectifRealised(goal))} TND</span>
                                                {goal.DateArchivage && (
                                                    <span>Clôt. {new Date(goal.DateArchivage).toLocaleDateString('fr')}</span>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-center text-sm text-slate-400 py-8">Aucun objectif archivé pour ces filtres.</p>
                        )}
                    </div>
                </motion.div>
            )}
            </AnimatePresence>

            {/* ── Full Ranking Table ─────────────────── */}
            {isAdmin && commercialRanking.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
                        <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                            <TrophyIcon className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800">Classement complet de l'équipe</h2>
                            <p className="text-xs text-slate-400">Tous les commerciaux classés par avancement</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60">
                                    {['Rang','Commercial','Poste','Statut','Avancement'].map(h => (
                                        <th key={h} className={`py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest ${h==='Avancement'||h==='Statut'?'text-right':'text-left'}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {commercialRanking.map((item, i) => {
                                    const isCurrent = item.userId === currentUser?.UserID;
                                    return (
                                        <tr key={item.userId} className={`hover:bg-slate-50 transition-colors ${isCurrent ? 'bg-indigo-50/30' : ''}`}>
                                            <td className="py-3.5 px-5">
                                                <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-black"
                                                    style={{ background: medals[i]||'#f1f5f9', color: i<3?'#fff':'#64748b' }}>
                                                    #{i+1}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center gap-3">
                                                    {item.user?.PhotoProfil
                                                        ? <img src={getImageUrl(item.user.PhotoProfil)} alt="" className="h-8 w-8 rounded-full object-cover" />
                                                        : <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-300 to-violet-300 flex items-center justify-center text-white text-xs font-bold">
                                                            {item.user?.FullName?.charAt(0)?.toUpperCase() || 'U'}
                                                          </div>
                                                    }
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">{item.user?.FullName || `Utilisateur #${item.userId}`}</p>
                                                        <p className="text-xs text-slate-400">{item.user?.EmailPro || ''}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-5 text-sm text-slate-500">{item.user?.PosteOccupe || '—'}</td>
                                            <td className="py-3.5 px-5 text-right">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${item.user?.IsActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${item.user?.IsActive ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                                                    {item.user?.IsActive ? 'Actif' : 'Inactif'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center justify-end gap-3">
                                                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${progressBgClass(item.progress)}`} style={{ width: `${Math.min(item.progress,100)}%` }} />
                                                    </div>
                                                    <span className="text-sm font-black text-slate-700 min-w-[48px] text-right">
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
