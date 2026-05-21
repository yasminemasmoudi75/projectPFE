import { useState, useEffect, useMemo } from 'react';
import {
  PlusIcon, CurrencyDollarIcon, CalendarDaysIcon,
  ChartBarIcon, BriefcaseIcon, ArrowPathIcon, RocketLaunchIcon,
  ArrowUpRightIcon, MagnifyingGlassIcon, FunnelIcon, XMarkIcon,
  ClockIcon, CheckCircleIcon, SparklesIcon, Squares2X2Icon,
  ListBulletIcon, UserIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjets } from './projetSlice';
import usePermission from '../../hooks/usePermission';
import { MODULE_CODES } from '../../utils/constants';
import axios from '../../app/axios';

/* ─── helpers ──────────────────────────────────────────────── */
const getInitials = (name = '') => (name || 'PR').substring(0, 2).toUpperCase();

const phaseConfig = (phase) => {
  const p = (phase || '').toLowerCase();
  if (p === 'clôture' || p === 'cloture' || p === 'terminé')
    return { bg: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-200' };
  if (p.includes('cours'))
    return { bg: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', ring: 'ring-blue-200' };
  if (p === 'planification' || p === 'analyse')
    return { bg: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500', ring: 'ring-violet-200' };
  return { bg: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', ring: 'ring-slate-200' };
};

const priorityConfig = (p) => {
  const v = (p || '').toLowerCase();
  if (v === 'haute' || v === 'high')
    return { label: p || 'Haute', cls: 'text-rose-600 bg-rose-50 border border-rose-200', icon: ExclamationTriangleIcon };
  if (v === 'moyenne' || v === 'medium')
    return { label: p || 'Moyenne', cls: 'text-amber-600 bg-amber-50 border border-amber-200', icon: null };
  return { label: p || 'Normale', cls: 'text-slate-500 bg-slate-50 border border-slate-200', icon: null };
};

const progressLabel = (v) =>
  v === 0 ? 'Non démarré' : v < 30 ? 'Démarrage' : v < 70 ? 'En cours' : v < 100 ? 'Phase finale' : 'Terminé';

const progressColor = (v) =>
  v >= 100 ? '#22c55e' : v >= 70 ? '#3b82f6' : v >= 30 ? '#6366f1' : '#94a3b8';

const gradients = [
  'from-blue-500 to-cyan-500',
  'from-indigo-500 to-blue-500',
  'from-blue-600 to-violet-500',
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-indigo-500',
  'from-blue-500 to-indigo-600',
];

/* ─── Circular SVG progress ─────────────────────────────────── */
const ProgressRing = ({ value = 0, size = 72 }) => {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = progressColor(value);
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" className="-rotate-90">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#f1f5f9" strokeWidth="5" />
      <circle
        cx="36" cy="36" r={r} fill="none"
        stroke={color} strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  );
};

/* ─── ProjetCard (grid view) ─────────────────────────────────── */
const ProjetCard = ({ projet, index, onView }) => {
  const avancement = Number(projet.Avancement) || 0;
  const phase = phaseConfig(projet.Phase);
  const priority = priorityConfig(projet.Priorite);
  const daysLeft = projet.Date_Echeance
    ? Math.ceil((new Date(projet.Date_Echeance) - Date.now()) / 86400000)
    : null;
  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  const isDueSoon = daysLeft !== null && daysLeft > 7 && daysLeft <= 14;
  const isComplete = avancement >= 100;
  const gradient = gradients[index % gradients.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -3 }}
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-100/50 hover:border-blue-100 transition-all duration-300 flex flex-col overflow-hidden"
    >
      {/* Color accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />

      <div className="p-5 flex-1 flex flex-col gap-4">

        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-black shadow flex-none group-hover:scale-110 transition-transform duration-300`}>
            {getInitials(projet.Nom_Projet)}
          </div>
          <div className="flex-1 min-w-0">
            <Link to={`/projets/${projet.ID_Projet}`}>
              <h3 className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors leading-tight line-clamp-2">
                {projet.Nom_Projet}
              </h3>
            </Link>
            <div className="flex items-center gap-1 mt-0.5">
              <UserIcon className="h-3 w-3 text-slate-400 flex-none" />
              <span className="text-xs text-slate-400 truncate">{projet.client?.Raisoc || 'Client non spécifié'}</span>
            </div>
          </div>
          {isComplete && (
            <CheckCircleSolid className="h-5 w-5 text-emerald-500 flex-none" />
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${phase.bg}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${phase.dot}`} />
            {projet.Phase || 'Nouveau'}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${priority.cls}`}>
            {priority.label}
          </span>
          {isUrgent && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 animate-pulse">
              <ClockIcon className="h-2.5 w-2.5" /> Urgent
            </span>
          )}
        </div>

        {/* Progress ring + stats */}
        <div className="flex items-center gap-4">
          <div className="relative flex-none">
            <ProgressRing value={avancement} size={72} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-black text-slate-800 leading-none">{avancement}%</span>
              <span className="text-[8px] font-semibold text-slate-400 uppercase leading-none mt-0.5">avct.</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Statut</span>
              <span className="text-xs font-bold text-slate-700">{progressLabel(avancement)}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${avancement}%`, backgroundColor: progressColor(avancement) }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Budget</span>
              <span className="text-xs font-bold text-slate-700">{formatCurrency(projet.Budget_Alloue || 0)}</span>
            </div>
          </div>
        </div>

        {/* Deadline */}
        <div className={`flex items-center justify-between px-3 py-2 rounded-xl mt-auto ${
          isUrgent    ? 'bg-red-50 border border-red-200'
          : isDueSoon ? 'bg-amber-50 border border-amber-200'
          : 'bg-slate-50 border border-slate-100'
        }`}>
          <div className="flex items-center gap-1.5">
            <CalendarDaysIcon className={`h-3.5 w-3.5 flex-none ${isUrgent ? 'text-red-500' : isDueSoon ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className={`text-xs font-semibold ${isUrgent ? 'text-red-700' : isDueSoon ? 'text-amber-700' : 'text-slate-600'}`}>
              {projet.Date_Echeance ? formatDate(projet.Date_Echeance) : 'Pas d\'échéance'}
            </span>
          </div>
          {daysLeft !== null && daysLeft >= 0 && daysLeft <= 14 && (
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${isUrgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              J-{daysLeft}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-medium">
          #{projet.ID_Projet}
          {projet.Date_Creation && ` · ${formatDate(projet.Date_Creation)}`}
        </span>
        <button
          onClick={onView}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors group/btn"
        >
          Voir détails
          <ArrowUpRightIcon className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};

/* ─── ProjetRow (list view) ──────────────────────────────────── */
const ProjetRow = ({ projet, index, onView }) => {
  const avancement = Number(projet.Avancement) || 0;
  const phase = phaseConfig(projet.Phase);
  const priority = priorityConfig(projet.Priorite);
  const daysLeft = projet.Date_Echeance
    ? Math.ceil((new Date(projet.Date_Echeance) - Date.now()) / 86400000)
    : null;
  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  const gradient = gradients[index % gradients.length];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="group bg-white border border-slate-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all duration-200 flex items-center gap-4 px-4 py-3.5"
    >
      {/* Avatar */}
      <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-black flex-none group-hover:scale-105 transition-transform`}>
        {getInitials(projet.Nom_Projet)}
      </div>

      {/* Name + client */}
      <div className="flex-1 min-w-0">
        <Link to={`/projets/${projet.ID_Projet}`}>
          <p className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors truncate">{projet.Nom_Projet}</p>
        </Link>
        <p className="text-xs text-slate-400 truncate">{projet.client?.Raisoc || 'Client non spécifié'}</p>
      </div>

      {/* Phase badge */}
      <div className="hidden sm:flex items-center gap-1.5 flex-none w-28">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${phase.bg}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${phase.dot}`} />
          {projet.Phase || 'Nouveau'}
        </span>
      </div>

      {/* Priority */}
      <div className="hidden md:flex flex-none w-20">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${priority.cls}`}>
          {priority.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="hidden lg:flex flex-none w-32 flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-semibold">{progressLabel(avancement)}</span>
          <span className="text-[10px] font-black text-slate-700">{avancement}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${avancement}%`, backgroundColor: progressColor(avancement) }}
          />
        </div>
      </div>

      {/* Budget */}
      <div className="hidden xl:block flex-none w-28 text-right">
        <p className="text-xs font-bold text-slate-700">{formatCurrency(projet.Budget_Alloue || 0)}</p>
      </div>

      {/* Deadline */}
      <div className="flex-none text-right hidden md:flex items-center gap-1.5">
        <CalendarDaysIcon className={`h-3.5 w-3.5 ${isUrgent ? 'text-red-500' : 'text-slate-400'}`} />
        <span className={`text-xs font-semibold ${isUrgent ? 'text-red-600' : 'text-slate-500'}`}>
          {projet.Date_Echeance ? formatDate(projet.Date_Echeance) : '—'}
        </span>
        {daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 && (
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-red-100 text-red-700">J-{daysLeft}</span>
        )}
      </div>

      {/* Action */}
      <button
        onClick={onView}
        className="flex-none h-7 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
      >
        Voir
      </button>
    </motion.div>
  );
};

/* ─── ProjetsList ──────────────────────────────────────────────── */
const ProjetsList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { canCreate } = usePermission(MODULE_CODES.PROJETS);
  const { projets, loading } = useSelector((s) => s.projets);

  const [typeFilter, setTypeFilter]             = useState('All');
  const [search, setSearch]                     = useState('');
  const [commerciaux, setCommerciaux]           = useState([]);
  const [selectedCommercial, setSelectedCommercial] = useState('');
  const [dateFrom, setDateFrom]                 = useState('');
  const [dateTo, setDateTo]                     = useState('');
  const [showFilters, setShowFilters]           = useState(false);
  const [viewMode, setViewMode]                 = useState('grid'); // 'grid' | 'list'

  useEffect(() => { dispatch(fetchProjets({})); }, [dispatch]);

  useEffect(() => {
    axios.get('/users/commercials/projets-filter').then(r => {
      const raw = Array.isArray(r.data) ? r.data : r.data?.data || [];
      setCommerciaux(raw.map(c => ({
        value: String(c.userId || c.value || c.UserID),
        label: c.fullName || c.label || c.login || `Commercial ${c.userId}`
      })));
    }).catch(() => {});
  }, []);

  const availableTypes = useMemo(() =>
    [...new Set(projets.map(p => p.Phase).filter(Boolean))], [projets]);

  const filteredProjets = useMemo(() => projets.filter(p => {
    const s = search.trim().toLowerCase();
    const clientName = (p.client?.Raisoc || '').toLowerCase();
    const matchSearch  = !s || (p.Nom_Projet || '').toLowerCase().includes(s) || clientName.includes(s) || String(p.ID_Projet || '').includes(s);
    const matchType    = typeFilter === 'All' || (p.Phase || '').toLowerCase() === typeFilter.toLowerCase();
    const matchComm    = !selectedCommercial || String(p.client?.codRepresTiers || '').trim() === String(selectedCommercial).trim();
    const d = p.Date_Creation ? new Date(p.Date_Creation) : null;
    return matchSearch && matchType && matchComm
      && (!dateFrom || (d && d >= new Date(dateFrom)))
      && (!dateTo   || (d && d <= new Date(dateTo)));
  }), [projets, typeFilter, selectedCommercial, dateFrom, dateTo, search]);

  const stats = useMemo(() => {
    const total = filteredProjets.length;
    const totalBudget = filteredProjets.reduce((a, p) => a + (Number(p.Budget_Alloue) || 0), 0);
    const avgProgress = total > 0
      ? Math.round(filteredProjets.reduce((a, p) => a + (Number(p.Avancement) || 0), 0) / total)
      : 0;
    const dueSoon = filteredProjets.filter(p => {
      if (!p.Date_Echeance) return false;
      const d = Math.ceil((new Date(p.Date_Echeance) - Date.now()) / 86400000);
      return d >= 0 && d <= 14;
    }).length;
    const done = filteredProjets.filter(p => Number(p.Avancement) >= 100).length;
    return { total, totalBudget, avgProgress, dueSoon, done };
  }, [filteredProjets]);

  const resetFilters = () => { setSearch(''); setTypeFilter('All'); setSelectedCommercial(''); setDateFrom(''); setDateTo(''); };
  const hasFilters = !!(search || typeFilter !== 'All' || selectedCommercial || dateFrom || dateTo);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in space-y-5 pb-12">

      {/* ── Hero Header ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/60 to-indigo-50/80 border border-slate-200/80 p-7 shadow-sm">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-100/40" />
          <div className="absolute right-20 bottom-0 h-32 w-32 rounded-full bg-indigo-100/50" />
          <div className="absolute left-0 bottom-0 h-20 w-48 rounded-full bg-sky-100/40 blur-xl" />
        </div>

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
              <SparklesIcon className="h-3.5 w-3.5" />
              CRM & Opérations
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">
              Projets & Opportunités
            </h1>
            <p className="text-slate-500 mt-1.5 text-sm font-medium">
              Pilotez vos chantiers, budgets et délais en temps réel.
            </p>

            {/* Mini stats */}
            <div className="flex items-center gap-5 mt-5">
              {[
                { icon: BriefcaseIcon, value: stats.total, label: 'projets', color: 'bg-blue-100 text-blue-600' },
                { icon: CheckCircleIcon, value: stats.done, label: 'terminés', color: 'bg-emerald-100 text-emerald-600' },
                { icon: ChartBarIcon, value: `${stats.avgProgress}%`, label: 'avancement', color: 'bg-indigo-100 text-indigo-600' },
                { icon: ClockIcon, value: stats.dueSoon, label: 'échéances', color: 'bg-amber-100 text-amber-600' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 && <div className="h-7 w-px bg-slate-200" />}
                  <div className={`h-8 w-8 rounded-lg ${s.color} flex items-center justify-center flex-none`}>
                    <s.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-800 leading-none">{s.value}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => dispatch(fetchProjets({}))}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors shadow-sm"
              title="Rafraîchir"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
            {canCreate && (
              <button
                onClick={() => navigate('/projets/new')}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
              >
                <PlusIcon className="h-4 w-4" />
                Nouveau Projet
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Projets',     value: stats.total,                       sub: 'actifs',        icon: BriefcaseIcon,      color: 'bg-blue-500',   glow: 'shadow-blue-100' },
          { label: 'Budget Total',      value: formatCurrency(stats.totalBudget),  sub: 'alloué',        icon: CurrencyDollarIcon,  color: 'bg-indigo-500', glow: 'shadow-indigo-100' },
          { label: 'Avancement moyen',  value: `${stats.avgProgress}%`,            sub: 'progression',   icon: ChartBarIcon,        color: 'bg-cyan-500',   glow: 'shadow-cyan-100' },
          { label: 'Échéances proches', value: stats.dueSoon,                      sub: 'dans 14 jours', icon: CalendarDaysIcon,    color: 'bg-amber-500',  glow: 'shadow-amber-100' },
        ].map((k, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-lg hover:${k.glow} hover:border-slate-200 transition-all group cursor-default`}
          >
            <div className={`h-11 w-11 rounded-xl ${k.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform flex-none`}>
              <k.icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{k.label}</p>
              <p className="text-xl font-black text-slate-800 leading-tight">{k.value}</p>
              <p className="text-xs text-slate-400">{k.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        {/* Search + toggle row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par projet, client, ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 h-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 transition-shadow"
            />
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center h-10 bg-slate-50 border border-slate-200 rounded-xl p-1 gap-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow text-blue-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                title="Vue grille"
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                title="Vue liste"
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold border transition-all ${
                showFilters
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
              Filtres
              {hasFilters && <span className={`h-2 w-2 rounded-full ${showFilters ? 'bg-white' : 'bg-blue-600'}`} />}
            </button>
            {hasFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl text-sm font-medium border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                title="Réinitialiser les filtres"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Phase quick-tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setTypeFilter('All')}
            className={`h-7 px-3 rounded-lg text-xs font-bold transition-all ${
              typeFilter === 'All'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tous
          </button>
          {availableTypes.map(t => {
            const cfg = phaseConfig(t);
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(prev => prev === t ? 'All' : t)}
                className={`h-7 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
                  typeFilter === t
                    ? `${cfg.bg} ring-2 ${cfg.ring}`
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                {t}
              </button>
            );
          })}
        </div>

        {/* Advanced filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Commercial</label>
                  <select value={selectedCommercial} onChange={e => setSelectedCommercial(e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700">
                    <option value="">Tous les commerciaux</option>
                    {commerciaux.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Créé après</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Créé avant</label>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Count row ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-slate-500">
          <span className="font-bold text-slate-800">{filteredProjets.length}</span> projet{filteredProjets.length !== 1 ? 's' : ''} trouvé{filteredProjets.length !== 1 ? 's' : ''}
          {hasFilters && <span className="ml-1 text-blue-500 font-medium">(filtré{filteredProjets.length !== 1 ? 's' : ''})</span>}
        </p>
        {viewMode === 'list' && (
          <div className="hidden lg:flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-wide pr-2">
            <span className="w-28">Phase</span>
            <span className="w-20">Priorité</span>
            <span className="w-32">Avancement</span>
            <span className="w-28 text-right">Budget</span>
            <span>Échéance</span>
          </div>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      {filteredProjets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex flex-col items-center text-center"
        >
          <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center mb-5 shadow-sm">
            <RocketLaunchIcon className="h-10 w-10 text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Aucun projet trouvé</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-xs">Modifiez vos filtres de recherche ou créez un nouveau projet.</p>
          <div className="flex items-center gap-3">
            {hasFilters && (
              <button onClick={resetFilters} className="h-9 px-5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Réinitialiser
              </button>
            )}
            {canCreate && (
              <button onClick={() => navigate('/projets/new')} className="h-9 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all">
                + Nouveau projet
              </button>
            )}
          </div>
        </motion.div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProjets.map((projet, i) => (
            <ProjetCard
              key={projet.ID_Projet}
              projet={projet}
              index={i}
              onView={() => navigate(`/projets/${projet.ID_Projet}`)}
            />
          ))}
          {canCreate && (
            <motion.button
              whileHover={{ y: -3, scale: 1.01 }}
              onClick={() => navigate('/projets/new')}
              className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/30 p-8 text-center hover:border-blue-400 hover:from-blue-50/50 hover:to-indigo-50/30 transition-all group min-h-[220px]"
            >
              <div className="h-14 w-14 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm group-hover:border-blue-400 group-hover:shadow-md transition-all">
                <PlusIcon className="h-7 w-7 text-slate-300 group-hover:text-blue-500 stroke-[2.5] transition-colors" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 group-hover:text-blue-600 transition-colors">Lancer un chantier</p>
                <p className="text-xs text-slate-400 mt-0.5">Créer un nouveau suivi projet</p>
              </div>
            </motion.button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProjets.map((projet, i) => (
            <ProjetRow
              key={projet.ID_Projet}
              projet={projet}
              index={i}
              onView={() => navigate(`/projets/${projet.ID_Projet}`)}
            />
          ))}
          {canCreate && (
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => navigate('/projets/new')}
              className="w-full flex items-center gap-4 px-4 py-3.5 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
            >
              <div className="h-9 w-9 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center group-hover:border-blue-400 transition-colors">
                <PlusIcon className="h-4 w-4 text-slate-300 group-hover:text-blue-500 stroke-[2.5] transition-colors" />
              </div>
              <span className="text-sm font-bold text-slate-400 group-hover:text-blue-600 transition-colors">Lancer un nouveau chantier</span>
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjetsList;
