import { useState, useEffect, useMemo } from 'react';
import {
  PlusIcon, CurrencyDollarIcon, CalendarDaysIcon,
  ChartBarIcon, BriefcaseIcon, ArrowPathIcon, RocketLaunchIcon,
  ArrowUpRightIcon, MagnifyingGlassIcon, FunnelIcon, XMarkIcon,
  ClockIcon, CheckCircleIcon, SparklesIcon, Squares2X2Icon,
  ListBulletIcon, UserIcon, ExclamationTriangleIcon,
  ViewColumnsIcon, ArrowsUpDownIcon, TrophyIcon,
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

/* ─── animation variants ────────────────────────────────────── */
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 28 } },
};

/* ─── KPI card ───────────────────────────────────────────────── */
const KpiCard = ({ label, value, sub, icon: Icon, accent, iconBg, valueColor, badge }) => (
  <motion.div
    variants={fadeUp}
    whileHover={{ y: -3, transition: { type: 'spring', stiffness: 400 } }}
    className="relative bg-white rounded-2xl border border-slate-200/70 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
  >
    <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent}`} />
    <div className="p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</p>
        <div className={`h-8 w-8 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${valueColor}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${valueColor} leading-none mb-1`}>{value}</p>
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-400 font-medium">{sub}</p>
        {badge != null && (
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${valueColor} bg-opacity-10 ${iconBg}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  </motion.div>
);

/* ─── helpers ───────────────────────────────────────────────── */
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

/* accent top-bar colors */
const accentColors = [
  { bar: 'bg-blue-500',    avatar: 'bg-blue-50 text-blue-700',    ring: 'ring-blue-100' },
  { bar: 'bg-emerald-500', avatar: 'bg-emerald-50 text-emerald-700', ring: 'ring-emerald-100' },
  { bar: 'bg-violet-500',  avatar: 'bg-violet-50 text-violet-700',  ring: 'ring-violet-100' },
  { bar: 'bg-amber-400',   avatar: 'bg-amber-50 text-amber-700',   ring: 'ring-amber-100' },
  { bar: 'bg-indigo-500',  avatar: 'bg-indigo-50 text-indigo-700', ring: 'ring-indigo-100' },
  { bar: 'bg-cyan-500',    avatar: 'bg-cyan-50 text-cyan-700',     ring: 'ring-cyan-100' },
];

/* ─── Pipeline steps ────────────────────────────────────────── */
const PipelineSteps = ({ projet }) => {
  const avancement = Number(projet.avancement_auto ?? projet.Avancement) || 0;
  const steps = [
    { label: 'Devis', done: !!projet.CodDev },
    { label: 'BC',    done: !!projet.CodBc },
    { label: 'BL',    done: !!projet.nf },
    { label: 'Payé',  done: avancement >= 100 },
  ];
  return (
    <div className="flex items-center gap-1" title={`${steps.filter(s=>s.done).length}/4 étapes`}>
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-0.5">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-colors ${
            s.done ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
          }`}>{s.label}</span>
          {i < steps.length - 1 && (
            <span className={`text-[9px] leading-none ${s.done ? 'text-blue-400' : 'text-slate-200'}`}>›</span>
          )}
        </div>
      ))}
    </div>
  );
};

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
  const avancement = Number(projet.avancement_auto ?? projet.Avancement) || 0;
  const phase = phaseConfig(projet.Phase);
  const priority = priorityConfig(projet.Priorite);
  const daysLeft = projet.Date_Echeance
    ? Math.ceil((new Date(projet.Date_Echeance) - Date.now()) / 86400000)
    : null;
  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  const isDueSoon = daysLeft !== null && daysLeft > 7 && daysLeft <= 14;
  const isComplete = avancement >= 100;
  const accent = accentColors[index % accentColors.length];

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4, boxShadow: '0 16px 40px -8px rgba(99,102,241,0.14)' }}
      className="group bg-white rounded-2xl border border-slate-200/70 shadow-sm hover:border-slate-300 transition-all duration-300 flex flex-col overflow-hidden"
    >
      {/* Color accent bar */}
      <div className={`h-0.5 w-full ${accent.bar}`} />

      <div className="p-5 flex-1 flex flex-col gap-4">

        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-xl ${accent.avatar} flex items-center justify-center text-xs font-black flex-none group-hover:scale-110 transition-transform duration-300 ring-2 ${accent.ring}`}>
            {getInitials(projet.Nom_Projet)}
          </div>
          <div className="flex-1 min-w-0">
            <Link to={`/projets/${projet.ID_Projet}`}>
              <h3 className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors leading-tight line-clamp-2">
                {projet.Nom_Projet}
              </h3>
            </Link>
            <div className="flex items-center gap-1 mt-1">
              <UserIcon className="h-3.5 w-3.5 text-blue-400 flex-none" />
              <span className="text-xs font-semibold text-slate-600 truncate">{projet.client?.Raisoc || 'Client non spécifié'}</span>
            </div>
          </div>
          {isComplete && <CheckCircleSolid className="h-5 w-5 text-emerald-500 flex-none" />}
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
            <ProgressRing value={avancement} size={68} />
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

        {/* Pipeline steps */}
        <div className="flex items-center justify-between">
          <PipelineSteps projet={projet} />
          {projet.Code_Pro && (
            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
              {projet.Code_Pro}
            </span>
          )}
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
        <div className="flex items-center gap-1.5">
          {projet.Date_Creation && (
            <span className="text-[10px] text-slate-400">{formatDate(projet.Date_Creation)}</span>
          )}
        </div>
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
  const avancement = Number(projet.avancement_auto ?? projet.Avancement) || 0;
  const phase = phaseConfig(projet.Phase);
  const priority = priorityConfig(projet.Priorite);
  const daysLeft = projet.Date_Echeance
    ? Math.ceil((new Date(projet.Date_Echeance) - Date.now()) / 86400000)
    : null;
  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  const accent = accentColors[index % accentColors.length];

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ x: 2 }}
      className="group bg-white border border-slate-200/70 rounded-xl hover:border-slate-300 hover:shadow-md transition-all duration-200 flex items-center gap-4 px-4 py-3.5"
    >
      {/* Avatar */}
      <div className={`h-9 w-9 rounded-lg ${accent.avatar} flex items-center justify-center text-xs font-black flex-none group-hover:scale-105 transition-transform ring-2 ${accent.ring}`}>
        {getInitials(projet.Nom_Projet)}
      </div>

      {/* Name + client */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link to={`/projets/${projet.ID_Projet}`}>
            <p className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors truncate">{projet.Nom_Projet}</p>
          </Link>
          <span className="hidden sm:inline text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md flex-none">
            {projet.Code_Pro || projet.ID_Projet?.slice(0, 8)}
          </span>
        </div>
        <p className="text-xs text-slate-500 truncate">{projet.client?.Raisoc || 'Client non spécifié'}</p>
      </div>

      {/* Phase badge */}
      <div className="hidden sm:flex items-center flex-none w-28">
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

      {/* Progress */}
      <div className="hidden lg:flex flex-none w-36 flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-semibold">{progressLabel(avancement)}</span>
          <span className="text-[10px] font-black text-slate-700">{avancement}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${avancement}%`, backgroundColor: progressColor(avancement) }}
          />
        </div>
      </div>

      {/* Pipeline */}
      <div className="hidden xl:flex flex-none">
        <PipelineSteps projet={projet} />
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

/* ─── KanbanColumn ───────────────────────────────────────────── */
const KanbanColumn = ({ phase, projets, colIndex, onView, canCreate, navigate }) => {
  const cfg = phaseConfig(phase);
  const accent = accentColors[colIndex % accentColors.length];
  const totalBudget = projets.reduce((s, p) => s + (Number(p.Budget_Alloue) || 0), 0);

  return (
    <div className="flex-none w-72">
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl mb-3 ${cfg.bg}`}>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
          <span className="text-xs font-bold">{phase}</span>
        </div>
        <div className="flex items-center gap-2">
          {totalBudget > 0 && (
            <span className="text-[9px] font-bold opacity-70">
              {(totalBudget / 1000).toFixed(0)}k TND
            </span>
          )}
          <span className="text-xs font-black bg-white/60 px-2 py-0.5 rounded-full">{projets.length}</span>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1 pb-2">
        {projets.map((projet, i) => {
          const avancement = Number(projet.avancement_auto ?? projet.Avancement) || 0;
          const daysLeft = projet.Date_Echeance
            ? Math.ceil((new Date(projet.Date_Echeance) - Date.now()) / 86400000)
            : null;
          const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
          const priority = priorityConfig(projet.Priorite);

          return (
            <motion.div
              key={projet.ID_Projet}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -2, boxShadow: '0 8px 24px -4px rgba(0,0,0,0.10)' }}
              className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-3.5 cursor-pointer hover:border-blue-200 transition-all"
              onClick={() => onView(projet.ID_Projet)}
            >
              <div className={`h-0.5 w-full ${accent.bar} rounded-full mb-3`} />

              {/* Header */}
              <div className="flex items-start gap-2 mb-3">
                <div className={`h-7 w-7 rounded-lg ${accent.avatar} flex items-center justify-center text-[10px] font-black flex-none`}>
                  {getInitials(projet.Nom_Projet)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">{projet.Nom_Projet}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{projet.client?.Raisoc}</p>
                </div>
              </div>

              {/* Priority + urgent */}
              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${priority.cls}`}>
                  {priority.label}
                </span>
                {isUrgent && daysLeft !== null && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 animate-pulse">
                    J-{daysLeft}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400">Avancement</span>
                  <span className="text-[10px] font-black text-slate-700">{avancement}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${avancement}%`, backgroundColor: progressColor(avancement) }}
                  />
                </div>
              </div>

              {/* Pipeline + budget */}
              <div className="flex items-center justify-between">
                <PipelineSteps projet={projet} />
                {projet.Budget_Alloue > 0 && (
                  <span className="text-[9px] font-bold text-slate-400">
                    {(Number(projet.Budget_Alloue) / 1000).toFixed(0)}k
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Add placeholder */}
        {canCreate && (
          <button
            onClick={() => navigate('/projets/new')}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition-all group text-xs font-semibold text-slate-400 hover:text-blue-500"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Ajouter
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── ProjetsList ──────────────────────────────────────────────── */
const ProjetsList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { canCreate } = usePermission(MODULE_CODES.PROJETS);
  const { projets, loading } = useSelector((s) => s.projets);

  const [typeFilter, setTypeFilter]               = useState('All');
  const [priorityFilter, setPriorityFilter]       = useState('All');
  const [search, setSearch]                       = useState('');
  const [sortBy, setSortBy]                       = useState('date');
  const [commerciaux, setCommerciaux]             = useState([]);
  const [selectedCommercial, setSelectedCommercial] = useState('');
  const [dateFrom, setDateFrom]                   = useState('');
  const [dateTo, setDateTo]                       = useState('');
  const [showFilters, setShowFilters]             = useState(false);
  const [viewMode, setViewMode]                   = useState('grid');

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

  const availablePriorities = useMemo(() =>
    [...new Set(projets.map(p => p.Priorite).filter(Boolean))], [projets]);

  const filteredProjets = useMemo(() => projets.filter(p => {
    const s = search.trim().toLowerCase();
    const clientName = (p.client?.Raisoc || '').toLowerCase();
    const matchSearch    = !s || (p.Nom_Projet || '').toLowerCase().includes(s) || clientName.includes(s) || String(p.ID_Projet || '').includes(s);
    const matchType      = typeFilter === 'All' || (p.Phase || '').toLowerCase() === typeFilter.toLowerCase();
    const matchPriority  = priorityFilter === 'All' || (p.Priorite || '').toLowerCase() === priorityFilter.toLowerCase();
    const matchComm      = !selectedCommercial || String(p.client?.codRepresTiers || '').trim() === String(selectedCommercial).trim();
    const d = p.Date_Creation ? new Date(p.Date_Creation) : null;
    return matchSearch && matchType && matchPriority && matchComm
      && (!dateFrom || (d && d >= new Date(dateFrom)))
      && (!dateTo   || (d && d <= new Date(dateTo)));
  }), [projets, typeFilter, priorityFilter, selectedCommercial, dateFrom, dateTo, search]);

  const sortedProjets = useMemo(() => {
    const arr = [...filteredProjets];
    if (sortBy === 'name')     arr.sort((a, b) => (a.Nom_Projet || '').localeCompare(b.Nom_Projet || ''));
    if (sortBy === 'budget')   arr.sort((a, b) => (Number(b.Budget_Alloue) || 0) - (Number(a.Budget_Alloue) || 0));
    if (sortBy === 'progress') arr.sort((a, b) => (Number(b.avancement_auto ?? b.Avancement) || 0) - (Number(a.avancement_auto ?? a.Avancement) || 0));
    if (sortBy === 'deadline') arr.sort((a, b) => {
      if (!a.Date_Echeance) return 1;
      if (!b.Date_Echeance) return -1;
      return new Date(a.Date_Echeance) - new Date(b.Date_Echeance);
    });
    if (sortBy === 'date') arr.sort((a, b) => new Date(b.Date_Creation || 0) - new Date(a.Date_Creation || 0));
    return arr;
  }, [filteredProjets, sortBy]);

  const stats = useMemo(() => {
    const total = filteredProjets.length;
    const totalBudget = filteredProjets.reduce((a, p) => a + (Number(p.Budget_Alloue) || 0), 0);
    const avgProgress = total > 0
      ? Math.round(filteredProjets.reduce((a, p) => a + (Number(p.avancement_auto ?? p.Avancement) || 0), 0) / total)
      : 0;
    const dueSoon = filteredProjets.filter(p => {
      if (!p.Date_Echeance) return false;
      const d = Math.ceil((new Date(p.Date_Echeance) - Date.now()) / 86400000);
      return d >= 0 && d <= 14;
    }).length;
    const done = filteredProjets.filter(p => Number(p.avancement_auto ?? p.Avancement) >= 100).length;
    const urgent = filteredProjets.filter(p => {
      if (!p.Date_Echeance) return false;
      const d = Math.ceil((new Date(p.Date_Echeance) - Date.now()) / 86400000);
      return d >= 0 && d <= 7;
    }).length;
    return { total, totalBudget, avgProgress, dueSoon, done, urgent };
  }, [filteredProjets]);

  const resetFilters = () => {
    setSearch(''); setTypeFilter('All'); setPriorityFilter('All');
    setSelectedCommercial(''); setDateFrom(''); setDateTo('');
  };
  const hasFilters = !!(search || typeFilter !== 'All' || priorityFilter !== 'All' || selectedCommercial || dateFrom || dateTo);

  /* Kanban: group by phase */
  const kanbanColumns = useMemo(() => {
    const phases = availableTypes.length > 0 ? availableTypes : ['Nouveau'];
    return phases.map(phase => ({
      phase,
      projets: sortedProjets.filter(p => (p.Phase || 'Nouveau') === phase),
    })).filter(c => c.projets.length > 0 || availableTypes.includes(c.phase));
  }, [sortedProjets, availableTypes]);

  if (loading) return <LoadingSpinner />;

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6 pb-12">

      {/* ── Header ──────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/70 shadow-sm px-6 py-5"
      >
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-blue-50 opacity-70" />
        <div className="pointer-events-none absolute -bottom-8 -right-4 h-28 w-28 rounded-full bg-indigo-50 opacity-50" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left: title + subtitle + stat chips */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200 flex-none">
                <RocketLaunchIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Projets &amp; Opportunités
                  </h1>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">Pilotez vos chantiers, budgets et délais en temps réel</p>
              </div>
            </div>

            {/* Stat chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-blue-700">
                <BriefcaseIcon className="h-3.5 w-3.5" />
                {stats.total} projet{stats.total !== 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-700">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                {stats.done} terminé{stats.done !== 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-xs font-bold text-violet-700">
                <ChartBarIcon className="h-3.5 w-3.5" />
                {stats.avgProgress}% moy.
              </span>
              {stats.urgent > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-xs font-bold text-red-600 animate-pulse">
                  <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                  {stats.urgent} urgent{stats.urgent > 1 ? 's' : ''}
                </span>
              )}
              {stats.totalBudget > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600">
                  <CurrencyDollarIcon className="h-3.5 w-3.5" />
                  {(stats.totalBudget / 1000).toFixed(1)}k TND
                </span>
              )}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <motion.button
              whileHover={{ rotate: 180 }} whileTap={{ scale: 0.95 }}
              onClick={() => dispatch(fetchProjets({}))}
              className="h-9 w-9 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
              title="Actualiser"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </motion.button>
            {canCreate && (
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 8px 20px -4px rgba(37,99,235,0.40)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/projets/new')}
                className="flex items-center gap-2 h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-500/30 transition-colors"
              >
                <PlusIcon className="h-4 w-4 stroke-[2.5]" />
                Nouveau Projet
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── KPI cards ────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard
          label="Total Projets" sub={`${availableTypes.length} phase${availableTypes.length !== 1 ? 's' : ''}`}
          value={stats.total}
          icon={BriefcaseIcon} accent="bg-blue-500"
          iconBg="bg-blue-50" valueColor="text-blue-700"
        />
        <KpiCard
          label="Budget Total" sub="TND alloué"
          value={stats.totalBudget > 0 ? `${(stats.totalBudget / 1000).toFixed(1)}k` : '0'}
          icon={CurrencyDollarIcon} accent="bg-emerald-500"
          iconBg="bg-emerald-50" valueColor="text-emerald-700"
        />
        <KpiCard
          label="Avancement moyen" sub="tous projets actifs"
          value={`${stats.avgProgress}%`}
          icon={ChartBarIcon} accent="bg-violet-500"
          iconBg="bg-violet-50" valueColor="text-violet-700"
        />
        <KpiCard
          label="Terminés" sub="avancement 100%"
          value={stats.done}
          badge={stats.total > 0 ? `${Math.round((stats.done / stats.total) * 100)}%` : '0%'}
          icon={TrophyIcon} accent="bg-green-500"
          iconBg="bg-green-50" valueColor="text-green-700"
        />
        <KpiCard
          label="Échéances proches" sub="dans 14 jours"
          value={stats.dueSoon}
          badge={stats.urgent > 0 ? `${stats.urgent} urgent${stats.urgent > 1 ? 's' : ''}` : null}
          icon={CalendarDaysIcon} accent="bg-amber-400"
          iconBg="bg-amber-50" valueColor="text-amber-700"
        />
      </motion.div>

      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">

        {/* Row 1: search + sort + view toggle + filters btn */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-100">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher par projet, client, ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 h-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder:text-slate-400 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort */}
            <div className="flex items-center gap-1.5 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
              <ArrowsUpDownIcon className="h-3.5 w-3.5 text-slate-400 flex-none" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="text-xs font-semibold text-slate-600 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value="date">Plus récent</option>
                <option value="deadline">Échéance</option>
                <option value="progress">Avancement</option>
                <option value="budget">Budget ↓</option>
                <option value="name">Nom A→Z</option>
              </select>
            </div>

            {/* View toggle */}
            <div className="flex items-center h-10 bg-slate-50 border border-slate-200 rounded-xl p-1 gap-0.5">
              {[
                { mode: 'grid',   Icon: Squares2X2Icon,  title: 'Vue grille' },
                { mode: 'list',   Icon: ListBulletIcon,  title: 'Vue liste' },
                { mode: 'kanban', Icon: ViewColumnsIcon, title: 'Vue Kanban' },
              ].map(({ mode, Icon, title }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  title={title}
                  className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all ${
                    viewMode === mode
                      ? 'bg-white shadow text-blue-600 border border-slate-200'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            {/* Filters btn */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold border transition-all ${
                showFilters
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
              Filtres
              {hasFilters && (
                <span className={`h-2 w-2 rounded-full ${showFilters ? 'bg-white' : 'bg-blue-500'}`} />
              )}
            </button>

            {hasFilters && (
              <button
                onClick={resetFilters}
                title="Réinitialiser"
                className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Phase + Priority filter pills */}
        <div className="px-4 py-3 space-y-2.5 bg-slate-50/50">

          {/* Phase row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest w-14 flex-none">Phase</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setTypeFilter('All')}
                className={`h-6 px-2.5 rounded-full text-[11px] font-bold transition-all ${
                  typeFilter === 'All'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                Tous
              </button>
              {availableTypes.map(t => {
                const cfg = phaseConfig(t);
                const count = projets.filter(p => p.Phase === t).length;
                const active = typeFilter === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(prev => prev === t ? 'All' : t)}
                    className={`h-6 pl-2 pr-2.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 transition-all ${
                      active
                        ? `${cfg.bg} ring-1 ${cfg.ring}`
                        : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full flex-none ${cfg.dot}`} />
                    {t}
                    <span className={`text-[9px] font-extrabold px-1 rounded-full ${active ? 'bg-white/50' : 'bg-slate-100 text-slate-400'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority row */}
          {availablePriorities.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest w-14 flex-none">Priorité</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setPriorityFilter('All')}
                  className={`h-6 px-2.5 rounded-full text-[11px] font-bold transition-all ${
                    priorityFilter === 'All'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  Toutes
                </button>
                {availablePriorities.map(pr => {
                  const cfg = priorityConfig(pr);
                  const count = projets.filter(p => p.Priorite === pr).length;
                  const active = priorityFilter === pr;
                  return (
                    <button
                      key={pr}
                      onClick={() => setPriorityFilter(prev => prev === pr ? 'All' : pr)}
                      className={`h-6 pl-2.5 pr-2 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 transition-all ${
                        active ? `${cfg.cls} ring-1` : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {pr}
                      <span className={`text-[9px] font-extrabold px-1 rounded-full ${active ? 'bg-white/40' : 'bg-slate-100 text-slate-400'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
              <div className="px-4 pb-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
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

      {/* ── Count row ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-slate-500">
          <span className="font-bold text-slate-800">{sortedProjets.length}</span> projet{sortedProjets.length !== 1 ? 's' : ''} trouvé{sortedProjets.length !== 1 ? 's' : ''}
          {hasFilters && <span className="ml-1 text-blue-500 font-medium">(filtré{sortedProjets.length !== 1 ? 's' : ''})</span>}
        </p>
        {viewMode === 'list' && (
          <div className="hidden lg:flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-wide pr-2">
            <span className="w-28">Phase</span>
            <span className="w-20">Priorité</span>
            <span className="w-36">Avancement</span>
            <span className="hidden xl:block w-44">Pipeline</span>
            <span className="hidden xl:block w-28 text-right">Budget</span>
            <span>Échéance</span>
          </div>
        )}
        {viewMode === 'kanban' && (
          <p className="text-xs text-slate-400">
            {kanbanColumns.length} colonne{kanbanColumns.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {sortedProjets.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex flex-col items-center text-center"
          >
            <div className="h-20 w-20 rounded-3xl bg-blue-50 flex items-center justify-center mb-5 shadow-sm">
              <RocketLaunchIcon className="h-10 w-10 text-blue-400" />
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
                <button onClick={() => navigate('/projets/new')} className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-bold text-white shadow-md transition-all">
                  + Nouveau projet
                </button>
              )}
            </div>
          </motion.div>

        ) : viewMode === 'kanban' ? (
          <motion.div
            key="kanban"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="overflow-x-auto pb-4"
          >
            <div className="flex gap-5 min-w-max">
              {kanbanColumns.map((col, ci) => (
                <KanbanColumn
                  key={col.phase}
                  phase={col.phase}
                  projets={col.projets}
                  colIndex={ci}
                  onView={(id) => navigate(`/projets/${id}`)}
                  canCreate={canCreate}
                  navigate={navigate}
                />
              ))}
            </div>
          </motion.div>

        ) : viewMode === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          >
            {sortedProjets.map((projet, i) => (
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
                className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all group min-h-[220px]"
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
          </motion.div>

        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {sortedProjets.map((projet, i) => (
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProjetsList;
