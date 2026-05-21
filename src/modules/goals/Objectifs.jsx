import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ChartBarIcon, ArrowUpIcon, ArrowDownIcon, TrophyIcon, FlagIcon,
    ShoppingBagIcon, UserGroupIcon, CalendarIcon, PlusIcon, SparklesIcon,
    CheckCircleIcon, BriefcaseIcon, ArrowTrendingUpIcon, BanknotesIcon,
    UsersIcon, DocumentTextIcon, ArrowPathIcon, EyeIcon, TagIcon,
    MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
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

/* ─── helpers ──────────────────────────────────────────────── */
const ICON_MAP = { BanknotesIcon, UsersIcon, CalendarIcon, BriefcaseIcon, ChartBarIcon, FlagIcon };

// Méta par nf : icône + unité + mode d'affichage (count vs TND)
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
    if (goal?.nf !== null && goal?.nf !== undefined && NF_META[goal.nf]) {
        return NF_META[goal.nf];
    }
    return { icon: BanknotesIcon, unit: 'TND', isCount: false };
};

const parseMoney = (v) => {
    if (v === undefined || v === null || v === '') return 0;
    const n = Number(String(v).replace(/\s/g,'').replace(',','.').replace(/[^0-9.-]/g,''));
    return Number.isFinite(n) ? n : 0;
};
const formatMoney = (v) => parseMoney(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatCount = (v) => Math.round(parseMoney(v)).toLocaleString('fr-FR');
const formatValue = (v, isCount) => isCount ? formatCount(v) : formatMoney(v);
const getObjectifRealised = (o) => { const d = parseMoney(o?.Montant_Realise_Actuel); return d > 0 ? d : parseMoney(o?.autVal); };
const getObjectifTarget   = (o) => { const v = parseMoney(o?.MontantCible); return v > 0 ? v : parseMoney(o?.autObj); };
const getProgress = (o) => { const t = getObjectifTarget(o); return t > 0 ? Math.min((getObjectifRealised(o)/t)*100,100) : 0; };

const progressColor = (p) => p >= 100 ? '#22c55e' : p >= 50 ? '#3b82f6' : '#94a3b8';
const progressBg    = (p) => p >= 100 ? 'bg-emerald-500' : p >= 50 ? 'bg-blue-500' : 'bg-slate-400';
const progressLabel = (p) => p >= 100 ? { bg:'bg-emerald-50 text-emerald-700 border-emerald-200', label:'Atteint' }
                           : p >= 50  ? { bg:'bg-blue-50 text-blue-700 border-blue-200',     label:'En cours' }
                           :             { bg:'bg-slate-100 text-slate-500 border-slate-200', label:'À risque' };

/* ─── ObjectifCard ──────────────────────────────────────────── */
const ObjectifCard = ({ goal, onEdit, onClose, isAdmin }) => {
    const progress = getProgress(goal);
    const { icon: Icon, unit, isCount } = getGoalMeta(goal);
    const pl = progressLabel(progress);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 p-6 flex flex-col"
        >
            {/* top row */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-none">
                        <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 leading-tight">{goal.TypeObjectif}</h4>
                        {goal.utilisateur && (
                            <p className="text-xs text-slate-400 truncate max-w-[120px]">
                                {goal.utilisateur.FullName || goal.utilisateur.LoginName}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                        <button onClick={onEdit} className="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors" title="Modifier">
                            <EyeIcon className="h-3.5 w-3.5" />
                        </button>
                    )}
                    {isAdmin && onClose && (
                        <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors" title="Clôturer">
                            <XMarkIcon className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* amounts */}
            <div className="mb-4">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-slate-800">{formatValue(getObjectifRealised(goal), isCount)}</span>
                    <span className="text-xs text-slate-400">/ {formatValue(getObjectifTarget(goal), isCount)} {unit}</span>
                </div>
                {(goal.DateDebut || goal.DateFin) && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {goal.DateDebut ? new Date(goal.DateDebut).toLocaleDateString('fr') : '…'} → {goal.DateFin ? new Date(goal.DateFin).toLocaleDateString('fr') : '…'}
                    </p>
                )}
            </div>

            {/* progress */}
            <div className="mt-auto space-y-2">
                <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${pl.bg}`}>{pl.label}</span>
                    <span className="text-sm font-black text-slate-700">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${progressBg(progress)}`} style={{ width: `${progress}%` }} />
                </div>
            </div>
        </motion.div>
    );
};

/* ─── Main page ─────────────────────────────────────────────── */
const Objectifs = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { objectifs, loading: reduxLoading } = useSelector((s) => s.objectifs);
    const { user: currentUser, isAdmin } = useAuth();
    const { canCreate } = usePermission(42);

    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(location.state?.selectedUserId || 'all');
    const [selectedMonth, setSelectedMonth]   = useState(location.state?.selectedMonth  || 'all');
    const [selectedYear, setSelectedYear]     = useState(location.state?.selectedYear   || new Date().getFullYear());
    const [allObjectifs, setAllObjectifs]     = useState([]);
    const [showArchived, setShowArchived]     = useState(false);
    const [archivedObjectifs, setArchivedObjectifs] = useState([]);
    const [archivedLoading, setArchivedLoading]     = useState(false);
    const [filterType,   setFilterType]   = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm,   setSearchTerm]   = useState('');
    const [showFilters,  setShowFilters]  = useState(false);

    const months = [
        { id:1,'name':'Janvier' },{ id:2,'name':'Février' },{ id:3,'name':'Mars' },
        { id:4,'name':'Avril'   },{ id:5,'name':'Mai'     },{ id:6,'name':'Juin'  },
        { id:7,'name':'Juillet' },{ id:8,'name':'Août'    },{ id:9,'name':'Septembre' },
        { id:10,'name':'Octobre'},{ id:11,'name':'Novembre'},{ id:12,'name':'Décembre' }
    ];

    const chartData = useMemo(() => {
        const names = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
        const monthly = names.map((m,i) => ({ month:m, sales:0, i }));
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

    useEffect(() => {
        if (location.state?.refresh) window.history.replaceState({}, document.title);
    }, [location.state?.refresh]);

    const filteredObjectifs = useMemo(() => {
        let f = allObjectifs;
        if (filterType !== 'all') f = f.filter(o => o.TypeObjectif === filterType);
        if (filterStatus !== 'all') f = f.filter(o => {
            const p = getProgress(o);
            if (filterStatus === 'completed')  return p >= 100;
            if (filterStatus === 'in-progress') return p >= 50 && p < 100;
            if (filterStatus === 'at-risk')    return p < 50;
            return true;
        });
        if (searchTerm) f = f.filter(o =>
            o.TypeObjectif?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.Description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return f;
    }, [allObjectifs, filterType, filterStatus, searchTerm]);

    const visibleObjectifs = useMemo(() =>
        filteredObjectifs.filter(o => !['ARCHIVÉ','INACTIF'].includes(String(o?.StatutObjectif||'').toUpperCase())),
    [filteredObjectifs]);

    const monthlyObjectifs = useMemo(() => visibleObjectifs.filter(o => o.TypePeriode === 'Mensuel' || !o.TypePeriode), [visibleObjectifs]);
    const weeklyObjectifs  = useMemo(() => visibleObjectifs.filter(o => o.TypePeriode === 'Hebdomadaire'), [visibleObjectifs]);

    const totalTarget   = visibleObjectifs.reduce((a,o) => a + getObjectifTarget(o), 0);
    const totalRealised = visibleObjectifs.reduce((a,o) => a + getObjectifRealised(o), 0);
    const globalProgress = totalTarget > 0 ? (totalRealised/totalTarget)*100 : 0;

    const objectifTypes = useMemo(() => [...new Set(allObjectifs.map(o=>o.TypeObjectif).filter(Boolean))], [allObjectifs]);

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
        if (!window.confirm(`Clôturer cet objectif ?\n\nType: ${goal.TypeObjectif}\nMontant: ${formatMoney(getObjectifRealised(goal))} / ${formatMoney(getObjectifTarget(goal))} TND`)) return;
        try {
            const r = await axios.post(`/objectifs/${goal.ID_Objectif}/fermer-admin`);
            const updated = r?.data?.data?.objectif;
            setAllObjectifs(prev => prev.map(it => String(it.ID_Objectif)===String(goal.ID_Objectif) ? { ...it, ...(updated||{}), StatutObjectif: updated?.StatutObjectif||'INACTIF' } : it));
            toast.success(r?.data?.data?.message || "Objectif clôturé");
            if (showArchived) await fetchArchivedObjectifs();
        } catch (e) { toast.error(e?.response?.data?.message || "Erreur lors de la clôture"); }
    };

    const kpis = [
        { label:'Atteinte globale', value:`${Math.round(globalProgress)}%`, sub:'progression', icon:ArrowTrendingUpIcon, trend: globalProgress >= 50 ? 'up' : 'down' },
        { label:'Objectif total',   value:`${(totalTarget/1000).toFixed(1)}k`,   sub:'TND / période', icon:FlagIcon },
        { label:'Réalisé',          value:`${(totalRealised/1000).toFixed(1)}k`,  sub:'TND cumulés',   icon:ChartBarIcon, trend:'up' },
        { label:'Écart restant',    value:`${((totalTarget-totalRealised)/1000).toFixed(1)}k`, sub:'TND à faire', icon:ArrowPathIcon },
    ];

    const navToNew = (extra={}) => navigate('/objectifs/new', { state: {
        selectedUserId: selectedUserId !== 'all' ? selectedUserId : null,
        selectedMonth:  selectedMonth  !== 'all' ? parseInt(selectedMonth) : new Date().getMonth()+1,
        selectedYear:   parseInt(selectedYear), ...extra
    }});

    return (
        <div className="animate-fade-in space-y-6 pb-12">

            {/* ── Header ─────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold">
                            <SparklesIcon className="h-3 w-3" /> Performances
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Objectifs Commerciaux</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {isAdmin ? 'Pilotage des indicateurs clés — toutes les équipes' : 'Suivi de vos performances personnelles'}
                    </p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                    {isAdmin && (
                        <button onClick={()=>setShowArchived(v=>!v)} className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                            <TagIcon className="h-4 w-4" />
                            {showArchived ? 'Masquer archivés' : 'Archivés'}
                        </button>
                    )}
                    {canCreate && (
                        <button onClick={()=>navToNew()} className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all">
                            <PlusIcon className="h-4 w-4" /> Nouvel Objectif
                        </button>
                    )}
                </div>
            </div>

            {/* ── KPI Cards ──────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((k,i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                                <k.icon className="h-4.5 w-4.5 text-blue-600 h-5 w-5" />
                            </div>
                            {k.trend && (
                                <span className={`flex items-center gap-0.5 text-xs font-semibold ${k.trend==='up'?'text-emerald-500':'text-slate-400'}`}>
                                    {k.trend==='up' ? <ArrowUpIcon className="h-3 w-3"/> : <ArrowDownIcon className="h-3 w-3"/>}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{k.label}</p>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black text-slate-800">{k.value}</span>
                                <span className="text-xs text-slate-400">{k.sub}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Filters ────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <AdjustmentsHorizontalIcon className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700">Filtres</span>
                        {(filterType!=='all'||filterStatus!=='all'||searchTerm) && (
                            <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                                {[filterType!=='all',filterStatus!=='all',!!searchTerm].filter(Boolean).length}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{visibleObjectifs.length} objectif{visibleObjectifs.length!==1?'s':''}</span>
                        {(filterType!=='all'||filterStatus!=='all'||searchTerm) && (
                            <button onClick={()=>{setFilterType('all');setFilterStatus('all');setSearchTerm('');}} className="text-xs text-blue-600 hover:text-blue-800 font-medium underline">
                                Réinitialiser
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    {/* Recherche */}
                    <div className="relative flex-1 min-w-[180px]">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                            placeholder="Rechercher…"
                            className="w-full pl-9 pr-4 h-9 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    {/* Commercial */}
                    {isAdmin && (
                        <select value={selectedUserId} onChange={e=>setSelectedUserId(e.target.value)}
                            className="h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700">
                            <option value="all">Tous les commerciaux</option>
                            {users.map((u,i) => <option key={u.UserID||u.userId||i} value={u.UserID||u.userId}>{u.FullName||u.fullName||u.LoginName||u.login}</option>)}
                        </select>
                    )}
                    {/* Mois */}
                    <select value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)}
                        className="h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700">
                        <option value="all">Tous les mois</option>
                        {months.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    {/* Type */}
                    <select value={filterType} onChange={e=>setFilterType(e.target.value)}
                        className="h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700">
                        <option value="all">Tous les types</option>
                        {objectifTypes.map((t,i)=><option key={t||i} value={t}>{t}</option>)}
                    </select>
                    {/* Statut */}
                    <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
                        className="h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700">
                        <option value="all">Tous les statuts</option>
                        <option value="completed">Atteints (≥100%)</option>
                        <option value="in-progress">En cours (50-99%)</option>
                        <option value="at-risk">À risque (&lt;50%)</option>
                    </select>
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
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                            <span className="h-2 w-2 rounded-full bg-blue-500" /> Réalisé
                        </span>
                    </div>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top:5, right:5, left:0, bottom:0 }}>
                                <defs>
                                    <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill:'#94a3b8', fontSize:11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill:'#94a3b8', fontSize:11 }} tickFormatter={v=>`${v/1000}k`} />
                                <Tooltip
                                    contentStyle={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:'0.75rem', fontSize:12 }}
                                    formatter={v=>[`${v.toLocaleString()} TND`]}
                                />
                                <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} fill="url(#gradCA)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Ranking */}
                {isAdmin && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                                <TrophyIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-800">Classement Équipe</h2>
                                <p className="text-xs text-slate-400">Par avancement des objectifs</p>
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            {commercialRanking.slice(0,5).map((item,i) => {
                                const medals = ['#F59E0B','#94A3B8','#B45309'];
                                return (
                                    <div key={item.userId} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                                        <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-black flex-none"
                                            style={{ background: medals[i]||'#f1f5f9', color: i<3?'#fff':'#64748b' }}>
                                            {i+1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{item.user?.FullName||`User #${item.userId}`}</p>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${progressBg(item.progress)}`}
                                                    style={{ width:`${Math.min(item.progress,100)}%` }} />
                                            </div>
                                            <span className="text-sm font-black text-slate-700 min-w-[42px] text-right">
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

            {/* ── Objectifs Mensuels ─────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-base font-bold text-slate-800">Objectifs Mensuels</h2>
                        <p className="text-xs text-slate-400">{monthlyObjectifs.length} objectif{monthlyObjectifs.length!==1?'s':''} actif{monthlyObjectifs.length!==1?'s':''}</p>
                    </div>
                    {canCreate && (
                        <button onClick={()=>navToNew({typePeriode:'Mensuel'})} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors">
                            <PlusIcon className="h-3.5 w-3.5" /> Ajouter
                        </button>
                    )}
                </div>

                {reduxLoading && monthlyObjectifs.length === 0 ? (
                    <div className="py-16 flex justify-center"><LoadingSpinner /></div>
                ) : monthlyObjectifs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {monthlyObjectifs.map(goal => (
                            <ObjectifCard
                                key={goal.ID_Objectif} goal={goal}
                                isAdmin={isAdmin}
                                onEdit={() => navigate(`/objectifs/edit/${goal.ID_Objectif}`, { state:{ objectif:goal } })}
                                onClose={() => handleAdminCloseObjectif(goal)}
                            />
                        ))}
                        {canCreate && (
                            <button onClick={()=>navToNew({typePeriode:'Mensuel'})}
                                className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-all group min-h-[160px]">
                                <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-blue-300 group-hover:text-blue-500 text-slate-300 transition-all">
                                    <PlusIcon className="h-6 w-6 stroke-[2.5]" />
                                </div>
                                <p className="text-xs font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">Nouvel objectif</p>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="py-16 flex flex-col items-center text-center">
                        <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                            <FlagIcon className="h-7 w-7 text-slate-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-500 mb-1">Aucun objectif mensuel</p>
                        <p className="text-xs text-slate-400 mb-4">Aucun résultat pour les filtres sélectionnés</p>
                        <button onClick={()=>{setFilterType('all');setFilterStatus('all');setSearchTerm('');}}
                            className="h-8 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors">
                            Réinitialiser les filtres
                        </button>
                    </div>
                )}
            </div>

            {/* ── Objectifs Hebdomadaires ────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-base font-bold text-slate-800">Objectifs Hebdomadaires</h2>
                        <p className="text-xs text-slate-400">{weeklyObjectifs.length} objectif{weeklyObjectifs.length!==1?'s':''} cette période</p>
                    </div>
                    {canCreate && (
                        <button onClick={()=>navToNew({typePeriode:'Hebdomadaire'})} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors">
                            <PlusIcon className="h-3.5 w-3.5" /> Ajouter
                        </button>
                    )}
                </div>

                {reduxLoading && weeklyObjectifs.length === 0 ? (
                    <div className="py-16 flex justify-center"><LoadingSpinner /></div>
                ) : weeklyObjectifs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {weeklyObjectifs.map(goal => (
                            <ObjectifCard
                                key={goal.ID_Objectif} goal={goal}
                                isAdmin={isAdmin}
                                onEdit={() => navigate(`/objectifs/edit/${goal.ID_Objectif}`, { state:{ objectif:goal } })}
                                onClose={() => handleAdminCloseObjectif(goal)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-12 flex flex-col items-center text-center">
                        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                            <CalendarIcon className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-500 mb-3">Aucun objectif hebdomadaire</p>
                        {canCreate && (
                            <button onClick={()=>navToNew({typePeriode:'Hebdomadaire'})} className="h-8 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors">
                                Créer un objectif hebdomadaire
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ── Archived ───────────────────────────── */}
            {showArchived && (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm p-6">
                    <div className="mb-5">
                        <h2 className="text-base font-bold text-slate-700">Objectifs archivés</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Historique des objectifs clôturés</p>
                    </div>
                    {archivedLoading ? (
                        <div className="py-12 flex justify-center"><LoadingSpinner /></div>
                    ) : archivedObjectifs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {archivedObjectifs.map(goal => {
                                const progress = getProgress(goal);
                                const { icon:Icon, unit } = getGoalIcon(goal.TypeObjectif);
                                return (
                                    <motion.div key={`arch-${goal.ID_Objectif}`}
                                        initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                                        className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col opacity-75 hover:opacity-100 transition-opacity">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="h-9 w-9 rounded-xl bg-slate-200 flex items-center justify-center flex-none">
                                                <Icon className="h-4 w-4 text-slate-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-700 truncate">{goal.TypeObjectif}</p>
                                                <span className="text-[10px] font-semibold text-slate-400 uppercase">{goal.StatutObjectif||'ARCHIVÉ'}</span>
                                            </div>
                                            <span className={`text-sm font-black ${progress>=100?'text-emerald-600':'text-slate-500'}`}>{Math.round(progress)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mb-3">
                                            <div className={`h-full rounded-full ${progress>=100?'bg-emerald-400':'bg-slate-400'}`} style={{ width:`${progress}%` }} />
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>{formatMoney(getObjectifRealised(goal))} TND réalisé</span>
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
            )}

            {/* ── Full Ranking Table ─────────────────── */}
            {isAdmin && commercialRanking.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                            <TrophyIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800">Classement complet de l'équipe</h2>
                            <p className="text-xs text-slate-400">Tous les commerciaux classés par avancement</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    {['Rang','Commercial','Poste','Statut','Avancement'].map(h => (
                                        <th key={h} className={`py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest ${h==='Avancement'||h==='Statut'?'text-right':'text-left'}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {commercialRanking.map((item, i) => {
                                    const isCurrent = item.userId === currentUser?.UserID;
                                    const medals = ['#F59E0B','#94A3B8','#B45309'];
                                    return (
                                        <tr key={item.userId} className={`hover:bg-slate-50 transition-colors ${isCurrent?'bg-blue-50/50':''}`}>
                                            <td className="py-3.5 px-4">
                                                <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-black"
                                                    style={{ background:medals[i]||'#f1f5f9', color:i<3?'#fff':'#64748b' }}>
                                                    #{i+1}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    {item.user?.PhotoProfil
                                                        ? <img src={getImageUrl(item.user.PhotoProfil)} alt="" className="h-8 w-8 rounded-full object-cover" />
                                                        : <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                                            {item.user?.FullName?.charAt(0)?.toUpperCase()||'U'}
                                                          </div>
                                                    }
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">{item.user?.FullName||`Utilisateur #${item.userId}`}</p>
                                                        <p className="text-xs text-slate-400">{item.user?.EmailPro||''}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-sm text-slate-500">{item.user?.PosteOccupe||'—'}</td>
                                            <td className="py-3.5 px-4 text-right">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.user?.IsActive?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-500'}`}>
                                                    {item.user?.IsActive?'Actif':'Inactif'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center justify-end gap-3">
                                                    <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${progressBg(item.progress)}`} style={{ width:`${Math.min(item.progress,100)}%` }} />
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
