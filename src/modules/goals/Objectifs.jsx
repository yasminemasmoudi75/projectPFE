import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ChartBarIcon, ArrowUpIcon, ArrowDownIcon, TrophyIcon, FlagIcon,
    UserGroupIcon, CalendarIcon, PlusIcon,
    CheckCircleIcon, BriefcaseIcon, ArrowTrendingUpIcon, BanknotesIcon,
    UsersIcon, ArrowPathIcon, EyeIcon, TagIcon,
    MagnifyingGlassIcon, XMarkIcon,
    ChevronLeftIcon, ChevronRightIcon, FunnelIcon
} from '@heroicons/react/24/outline';
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

/* Status-based colors — même palette que GestionProjets */
const progressColor   = (p) => p >= 100 ? '#10b981' : p >= 50 ? '#3b82f6' : '#f87171';
const progressBgClass = (p) => p >= 100 ? 'bg-emerald-500' : p >= 50 ? 'bg-blue-500' : 'bg-red-400';
const progressLabel   = (p) => p >= 100
    ? { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Atteint'  }
    : p >= 50
    ? { bg: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-500',    label: 'En cours' }
    :   { bg: 'bg-red-50 text-red-700 border-red-200',           dot: 'bg-red-400',     label: 'À risque' };

/* ─── CircleProgress SVG ────────────────────────────────────── */
const CircleProgress = ({ progress, size = 56 }) => {
    const r = size * 0.37;
    const circ = 2 * Math.PI * r;
    const offset = circ - (Math.min(progress, 100) / 100) * circ;
    const color = progressColor(progress);
    const cx = size / 2, cy = size / 2;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={size * 0.065} />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={size * 0.065}
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
                style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
            <text x={cx} y={cy + 1} textAnchor="middle" fontSize={size * 0.19}
                fontWeight="700" fill={color} fontFamily="system-ui, sans-serif">
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

    const accent = progress >= 100
        ? { border: 'border-l-emerald-300', iconBg: 'bg-emerald-50', iconText: 'text-emerald-500', stripe: 'linear-gradient(90deg,#6ee7b7,#a7f3d0)', valColor: '#10b981' }
        : progress >= 50
        ? { border: 'border-l-blue-300',    iconBg: 'bg-blue-50',    iconText: 'text-blue-500',    stripe: 'linear-gradient(90deg,#93c5fd,#bfdbfe)', valColor: '#3b82f6' }
        : { border: 'border-l-rose-300',    iconBg: 'bg-rose-50',    iconText: 'text-rose-400',    stripe: 'linear-gradient(90deg,#fca5a5,#fecdd3)', valColor: '#f87171' };

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`group bg-white rounded-2xl border border-slate-100 border-l-4 ${accent.border} shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden`}
        >
            {/* ── Bande colorée top ── */}
            <div style={{ background: accent.stripe, height: 3 }} />

            {/* ── Header ── */}
            <div className="px-5 pt-4 pb-4 flex items-start justify-between gap-3 border-b border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-10 w-10 rounded-xl ${accent.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <Icon className={`h-5 w-5 ${accent.iconText}`} />
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 truncate">{goal.TypeObjectif}</h4>
                        {goal.utilisateur && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                                {goal.utilisateur.FullName || goal.utilisateur.LoginName}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
                    {onEdit && (
                        <button onClick={onEdit} className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-500 hover:bg-blue-100 hover:text-blue-700 transition-colors shadow-sm">
                            <EyeIcon className="h-4 w-4" />
                        </button>
                    )}
                    {isAdmin && onClose && (
                        <button onClick={onClose} className="p-1.5 rounded-lg bg-red-50 border border-red-200 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors shadow-sm">
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Body : cercle + barre ── */}
            <div className="px-5 pt-4 pb-4 flex items-center gap-4">
                <CircleProgress progress={progress} size={66} />
                <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.05 + 0.1 }}
                            className={`h-full rounded-full ${progressBgClass(progress)}`}
                        />
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${pl.bg}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${pl.dot}`} />
                        {pl.label}
                    </span>
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="px-5 pb-5 border-t border-slate-100 pt-4 mt-auto">
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Réalisé</p>
                        <p className="text-lg font-semibold mt-0.5" style={{ color: accent.valColor }}>{formatValue(getObjectifRealised(goal), isCount)}</p>
                        <p className="text-[10px] text-slate-400">{unit}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Objectif</p>
                        <p className="text-lg font-medium text-slate-400 mt-0.5">{formatValue(getObjectifTarget(goal), isCount)}</p>
                        <p className="text-[10px] text-slate-400">{unit}</p>
                    </div>
                </div>
                {(goal.DateDebut || goal.DateFin) && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
                        <CalendarIcon className="h-3 w-3 text-slate-300 flex-shrink-0" />
                        {goal.DateDebut ? new Date(goal.DateDebut).toLocaleDateString('fr') : '…'}
                        <span className="text-slate-300 mx-1">→</span>
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
        rose:    active ? 'bg-red-50 text-red-600 border-red-200 shadow-sm'             : 'bg-white text-slate-500 border-slate-200 hover:border-red-200 hover:text-red-500 hover:bg-red-50',
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
            border: 'border-l-orange-300',
            bg: 'bg-orange-50',
            text: 'text-orange-500',
            ring: 'ring-orange-100',
        },
    ];

    return (
        <div className="space-y-5 pb-12">

            {/* ── Header — même pattern que GestionProduits / ActivitesListProMax ── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-[#0062AF] flex items-center justify-center flex-shrink-0">
                            <TrophyIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Objectifs Commerciaux</h1>
                            <p className="text-sm text-slate-500">
                                {isAdmin ? 'Pilotage des performances — toutes les équipes' : 'Suivi de vos performances personnelles'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isAdmin && (
                            <button onClick={() => setShowArchived(v => !v)}
                                className={`h-9 px-4 rounded-xl text-sm font-semibold border transition-all ${showArchived ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                                Archivés
                            </button>
                        )}
                        {canCreate && (
                            <button onClick={() => navToNew()}
                                className="flex items-center gap-2 px-4 py-2 bg-[#0062AF] hover:bg-[#004a85] text-white rounded-xl text-sm font-medium transition-colors">
                                <PlusIcon className="h-4 w-4" /> Nouvel objectif
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Stats — même pattern que GestionProjets ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Atteinte globale', value: `${Math.round(globalProgress)}%`,  sub: 'progression',   Icon: ArrowTrendingUpIcon },
                    { label: 'Objectif total',   value: totalTarget   >= 1000 ? `${(totalTarget/1000).toFixed(1)}k TND`   : `${Math.round(totalTarget).toLocaleString()} TND`,   sub: `/ ${selectedYear}`, Icon: FlagIcon      },
                    { label: 'Réalisé',          value: totalRealised >= 1000 ? `${(totalRealised/1000).toFixed(1)}k TND` : `${Math.round(totalRealised).toLocaleString()} TND`, sub: 'TND cumulés',    Icon: ChartBarIcon  },
                    { label: 'Écart restant',    value: (totalTarget - totalRealised) >= 1000 ? `${((totalTarget-totalRealised)/1000).toFixed(1)}k TND` : `${Math.round(Math.max(0,totalTarget-totalRealised)).toLocaleString()} TND`, sub: 'TND à faire', Icon: ArrowPathIcon },
                ].map((s, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{s.label}</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 flex-shrink-0">
                                <s.Icon className="w-5 h-5 text-[#0062AF]" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Filters ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <FunnelIcon className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700">Filtres</span>
                        {activeFiltersCount > 0 && (
                            <span className="h-5 min-w-[1.25rem] px-1.5 rounded-full bg-[#0062AF] text-white text-[10px] font-bold flex items-center justify-center">
                                {activeFiltersCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-0.5 bg-slate-50 rounded-lg border border-slate-200 px-1 py-1">
                            <button onClick={() => setSelectedYear(y => y - 1)} className="h-6 w-6 flex items-center justify-center rounded hover:bg-white text-slate-500 transition-colors">
                                <ChevronLeftIcon className="h-3.5 w-3.5" />
                            </button>
                            <span className="px-2 text-sm font-bold text-slate-700">{selectedYear}</span>
                            <button onClick={() => setSelectedYear(y => y + 1)} className="h-6 w-6 flex items-center justify-center rounded hover:bg-white text-slate-500 transition-colors">
                                <ChevronRightIcon className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">{visibleObjectifs.length} objectif{visibleObjectifs.length!==1?'s':''}</span>
                        {activeFiltersCount > 0 && (
                            <button onClick={() => { setFilterType('all'); setFilterStatus('all'); setSearchTerm(''); setSelectedMonth('all'); }}
                                className="text-xs text-slate-400 hover:text-rose-500 font-semibold flex items-center gap-1 transition-colors">
                                <XMarkIcon className="h-3.5 w-3.5" /> Réinitialiser
                            </button>
                        )}
                    </div>
                </div>
                <div className="p-4 space-y-3">
                    {/* Search + selects */}
                    <div className="flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Rechercher un objectif…"
                                className="w-full pl-9 pr-4 h-9 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#0062AF] focus:ring-2 focus:ring-blue-100 transition-all" />
                        </div>
                        {isAdmin && (
                            <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}
                                className="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#0062AF] text-slate-700 min-w-[180px] bg-white">
                                <option value="all">Tous les commerciaux</option>
                                {users.map((u,i) => <option key={u.UserID||u.userId||i} value={u.UserID||u.userId}>{u.FullName||u.fullName||u.LoginName||u.login}</option>)}
                            </select>
                        )}
                        {objectifTypes.length > 0 && (
                            <select value={filterType} onChange={e => setFilterType(e.target.value)}
                                className="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#0062AF] text-slate-700 bg-white">
                                <option value="all">Tous les types</option>
                                {objectifTypes.map((t,i) => <option key={t||i} value={t}>{t}</option>)}
                            </select>
                        )}
                    </div>
                    {/* Month pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Mois :</span>
                        <FilterPill active={selectedMonth === 'all'} onClick={() => setSelectedMonth('all')} color="indigo">Tous</FilterPill>
                        {months.map(m => (
                            <FilterPill key={m.id} active={String(selectedMonth) === String(m.id)} onClick={() => setSelectedMonth(m.id)} color="indigo">
                                {m.name}
                            </FilterPill>
                        ))}
                    </div>
                    {/* Status pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Statut :</span>
                        <FilterPill active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} color="indigo">Tous</FilterPill>
                        <FilterPill active={filterStatus === 'completed'} onClick={() => setFilterStatus('completed')} color="emerald">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Atteints
                        </FilterPill>
                        <FilterPill active={filterStatus === 'in-progress'} onClick={() => setFilterStatus('in-progress')} color="amber">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> En cours
                        </FilterPill>
                        <FilterPill active={filterStatus === 'at-risk'} onClick={() => setFilterStatus('at-risk')} color="rose">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> À risque
                        </FilterPill>
                    </div>
                </div>
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
                            <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                                <CalendarIcon className="h-5 w-5 text-[#0062AF]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-bold text-slate-800">Objectifs Mensuels</h2>
                                    {total > 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                                            {total}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">Performances du mois en cours</p>
                            </div>
                        </div>
                        {canCreate && (
                            <button onClick={() => navToNew({ typePeriode: 'Mensuel' })}
                                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-xl bg-[#0062AF] hover:bg-[#004a85] text-white text-xs font-semibold transition-all shadow-sm">
                                <PlusIcon className="h-3.5 w-3.5" /> Ajouter
                            </button>
                        )}
                    </div>

                    {/* ── Barre de répartition ── */}
                    {total > 0 && (
                        <div className="px-6 py-3 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between gap-6">
                            {/* Légende */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="h-2 w-2 rounded-full bg-emerald-400 flex-none" />{atteints} atteint{atteints !== 1 ? 's' : ''}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    <span className="h-2 w-2 rounded-full bg-blue-400 flex-none" />{enCours} en cours
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                    <span className="h-2 w-2 rounded-full bg-slate-400 flex-none" />{aRisque} à risque
                                </span>
                            </div>
                            {/* Mini barre de répartition */}
                            <div className="flex h-2.5 w-40 rounded-full overflow-hidden gap-0.5 flex-none">
                                {atteints  > 0 && <div className="bg-emerald-400 rounded-full transition-all" style={{ flex: atteints  }} />}
                                {enCours   > 0 && <div className="bg-blue-400    rounded-full transition-all" style={{ flex: enCours   }} />}
                                {aRisque   > 0 && <div className="bg-slate-300   rounded-full transition-all" style={{ flex: aRisque   }} />}
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
                            <div className="py-12 flex flex-col items-center text-center">
                                <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-3">
                                    <FlagIcon className="h-7 w-7 text-[#0062AF]" />
                                </div>
                                <p className="text-sm font-bold text-slate-700 mb-1">Aucun objectif mensuel</p>
                                <p className="text-xs text-slate-400 mb-5">Aucun résultat pour les filtres sélectionnés.</p>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => { setFilterType('all'); setFilterStatus('all'); setSearchTerm(''); setSelectedMonth('all'); }}
                                        className="h-8 px-4 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
                                        Réinitialiser
                                    </button>
                                    {canCreate && (
                                        <button onClick={() => navToNew({ typePeriode: 'Mensuel' })}
                                            className="h-8 px-4 rounded-lg bg-[#0062AF] hover:bg-[#004a85] text-white text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5">
                                            <PlusIcon className="h-3.5 w-3.5" /> Créer un objectif
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
                            <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                                <CalendarIcon className="h-5 w-5 text-[#0062AF]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-bold text-slate-800">Objectifs Hebdomadaires</h2>
                                    {total > 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                                            {total}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">Performances de la semaine en cours</p>
                            </div>
                        </div>
                        {canCreate && (
                            <button onClick={() => navToNew({ typePeriode: 'Hebdomadaire' })}
                                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-xl bg-[#0062AF] hover:bg-[#004a85] text-white text-xs font-semibold transition-all shadow-sm">
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
                            <div className="py-12 flex flex-col items-center text-center">
                                <div className="h-14 w-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-3">
                                    <CalendarIcon className="h-7 w-7 text-violet-500" />
                                </div>
                                <p className="text-sm font-bold text-slate-700 mb-1">Aucun objectif hebdomadaire</p>
                                <p className="text-xs text-slate-400 mb-5">Aucun objectif défini pour cette période.</p>
                                {canCreate && (
                                    <button onClick={() => navToNew({ typePeriode: 'Hebdomadaire' })}
                                        className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold transition-colors shadow-sm">
                                        <PlusIcon className="h-3.5 w-3.5" /> Créer un objectif
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
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                                <TrophyIcon className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-800">Classement de l'équipe</h2>
                                <p className="text-xs text-slate-400">Commerciaux classés par avancement global</p>
                            </div>
                        </div>
                        <span className="text-xs font-semibold text-slate-400">{commercialRanking.length} commercial{commercialRanking.length > 1 ? 'aux' : ''}</span>
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
