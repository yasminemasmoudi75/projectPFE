import { useState, useEffect, useMemo } from 'react';
import {
  PlusIcon, CurrencyDollarIcon, CalendarDaysIcon, ChartBarIcon,
  BriefcaseIcon, ArrowPathIcon, MagnifyingGlassIcon, XMarkIcon,
  ArrowUpRightIcon, Squares2X2Icon, ListBulletIcon, ClockIcon,
  CheckCircleIcon, TrophyIcon, ViewColumnsIcon, ChevronRightIcon,
  ArrowsUpDownIcon, FunnelIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjets } from './projetSlice';
import usePermission from '../../hooks/usePermission';
import { MODULE_CODES } from '../../utils/constants';
import axios from '../../app/axios';

/* ── motion ──────────────────────────────────────────────────── */
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 26 } } };
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };

/* ── phase config ────────────────────────────────────────────── */
const phaseColor = (phase) => {
  const p = (phase || '').toLowerCase();
  if (p.includes('cours') || p === 'production')    return { pill: 'bg-blue-50 text-[#0062AF] border-blue-200',   dot: 'bg-[#0062AF]',   bar: '#0062AF' };
  if (p.includes('termin') || p.includes('clôtur'))  return { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', bar: '#10b981' };
  if (p === 'planification' || p === 'analyse')      return { pill: 'bg-indigo-50 text-indigo-700 border-indigo-200',   dot: 'bg-indigo-500',  bar: '#4338ca' };
  if (p === 'nouveau' || p === 'new')                return { pill: 'bg-sky-50 text-sky-700 border-sky-200',             dot: 'bg-sky-500',     bar: '#0284c7' };
  if (p === 'tests' || p === 'test' || p === 'recette') return { pill: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-500',   bar: '#d97706' };
  return { pill: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400', bar: '#94a3b8' };
};

const priorityColor = (p) => {
  const v = (p || '').toLowerCase();
  if (v === 'haute' || v === 'high')    return 'bg-rose-50 text-rose-600 border-rose-200';
  if (v === 'moyenne' || v === 'medium') return 'bg-amber-50 text-amber-600 border-amber-200';
  return 'bg-slate-100 text-slate-500 border-slate-200';
};

const progressPct = (p) => Number(p.avancement_auto ?? p.Avancement) || 0;

/* ── ProjectCard ─────────────────────────────────────────────── */
const ProjectCard = ({ projet, onView }) => {
  const pct   = progressPct(projet);
  const phase = phaseColor(projet.Phase);
  const daysLeft = projet.Date_Echeance
    ? Math.ceil((new Date(projet.Date_Echeance) - Date.now()) / 86400000) : null;
  const overdue = daysLeft !== null && daysLeft < 0;
  const urgent  = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  return (
    <motion.div variants={fadeUp}
      className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden flex flex-col">

      {/* colour strip */}
      <div className="h-[3px]" style={{ background: phase.bar }} />

      <div className="p-5 flex-1 flex flex-col gap-3">

        {/* name + client */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link to={`/projets/${projet.ID_Projet}`}
              className="text-sm font-bold text-slate-900 hover:text-[#0062AF] transition-colors line-clamp-1 leading-snug">
              {projet.Nom_Projet}
            </Link>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {projet.client?.Raisoc || 'Client non spécifié'}
            </p>
          </div>
          {pct >= 100 && (
            <CheckCircleIcon className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
          )}
        </div>

        {/* badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${phase.pill}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${phase.dot}`} />
            {projet.Phase || 'Nouveau'}
          </span>
          {projet.Priorite && (
            <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${priorityColor(projet.Priorite)}`}>
              {projet.Priorite}
            </span>
          )}
        </div>

        {/* progress */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] text-slate-400">Avancement</span>
            <span className="text-[11px] font-bold text-slate-700">{pct}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: phase.bar }} />
          </div>
        </div>

        {/* budget + deadline */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-1.5">
            <CalendarDaysIcon className={`h-3.5 w-3.5 ${overdue ? 'text-red-500' : urgent ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className={`text-xs ${overdue ? 'text-red-600 font-semibold' : urgent ? 'text-amber-600 font-semibold' : 'text-slate-500'}`}>
              {projet.Date_Echeance ? formatDate(projet.Date_Echeance) : 'Sans échéance'}
            </span>
          </div>
          <span className="text-xs font-bold text-slate-700 tabular-nums">
            {formatCurrency(projet.Budget_Alloue || 0)}
          </span>
        </div>
      </div>

      {/* footer */}
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">{projet.Date_Creation ? formatDate(projet.Date_Creation) : '—'}</span>
        <button onClick={onView}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0062AF] hover:text-[#004a85] transition-colors">
          Voir détails <ArrowUpRightIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

/* ── ProjectRow (list) ───────────────────────────────────────── */
const ProjectRow = ({ projet, onView }) => {
  const pct   = progressPct(projet);
  const phase = phaseColor(projet.Phase);
  const daysLeft = projet.Date_Echeance
    ? Math.ceil((new Date(projet.Date_Echeance) - Date.now()) / 86400000) : null;
  const urgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  return (
    <motion.div variants={fadeUp}
      className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex items-center gap-4 hover:shadow-sm hover:border-slate-300 transition-all">
      {/* dot accent */}
      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: phase.bar }} />

      {/* name + client */}
      <div className="flex-1 min-w-0">
        <Link to={`/projets/${projet.ID_Projet}`}
          className="text-sm font-semibold text-slate-800 hover:text-[#0062AF] transition-colors truncate block">
          {projet.Nom_Projet}
        </Link>
        <p className="text-xs text-slate-400 truncate">{projet.client?.Raisoc || '—'}</p>
      </div>

      {/* phase */}
      <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold flex-shrink-0 ${phase.pill}`}>
        {projet.Phase || 'Nouveau'}
      </span>

      {/* progress */}
      <div className="hidden lg:flex flex-col gap-1 w-36 flex-shrink-0">
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: phase.bar }} />
        </div>
      </div>

      {/* budget */}
      <span className="hidden xl:block text-xs font-bold text-slate-700 w-28 text-right flex-shrink-0 tabular-nums">
        {formatCurrency(projet.Budget_Alloue || 0)}
      </span>

      {/* deadline */}
      <div className="hidden md:flex items-center gap-1 flex-shrink-0">
        <CalendarDaysIcon className={`h-3.5 w-3.5 ${urgent ? 'text-amber-500' : 'text-slate-400'}`} />
        <span className={`text-xs ${urgent ? 'text-amber-600 font-semibold' : 'text-slate-500'}`}>
          {projet.Date_Echeance ? formatDate(projet.Date_Echeance) : '—'}
        </span>
      </div>

      {/* action */}
      <button onClick={onView}
        className="flex-shrink-0 h-8 px-4 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-[#0062AF] hover:text-white hover:border-[#0062AF] transition-all">
        Voir
      </button>
    </motion.div>
  );
};

/* ── KanbanCard ──────────────────────────────────────────────── */
const KanbanCard = ({ projet, onView }) => {
  const pct   = progressPct(projet);
  const phase = phaseColor(projet.Phase);
  const daysLeft = projet.Date_Echeance
    ? Math.ceil((new Date(projet.Date_Echeance) - Date.now()) / 86400000) : null;
  const urgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  return (
    <div onClick={() => onView(projet.ID_Projet)}
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all">
      <div className="h-0.5 w-full rounded-full mb-3" style={{ background: phase.bar }} />
      <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug mb-1">{projet.Nom_Projet}</p>
      <p className="text-[10px] text-slate-400 mb-3 truncate">{projet.client?.Raisoc}</p>
      <div>
        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
          <span>Avancement</span><span className="font-bold text-slate-600">{pct}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: phase.bar }} />
        </div>
      </div>
      {(urgent || projet.Budget_Alloue > 0) && (
        <div className="flex items-center justify-between mt-3">
          {urgent && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">J-{daysLeft}</span>}
          {projet.Budget_Alloue > 0 && (
            <span className="text-[10px] font-bold text-slate-500 ml-auto tabular-nums">
              {(Number(projet.Budget_Alloue)/1000).toFixed(0)}k TND
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/* ── KanbanColumn ────────────────────────────────────────────── */
const KanbanColumn = ({ phase, projets, canCreate, navigate }) => {
  const cfg = phaseColor(phase);
  return (
    <div className="flex-none w-64">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
          <span className="text-xs font-bold text-slate-700">{phase}</span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{projets.length}</span>
      </div>
      <div className="space-y-2.5 max-h-[calc(100vh-300px)] overflow-y-auto pr-0.5">
        {projets.map(p => <KanbanCard key={p.ID_Projet} projet={p} onView={id => navigate(`/projets/${id}`)} />)}
        {canCreate && (
          <button onClick={() => navigate('/projets/new')}
            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs font-semibold text-slate-400 hover:border-[#0062AF]/30 hover:text-[#0062AF] hover:bg-[#0062AF]/5 transition-all flex items-center justify-center gap-1.5">
            <PlusIcon className="h-3.5 w-3.5" /> Ajouter
          </button>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════ */
const ProjetsList = () => {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const { canCreate } = usePermission(MODULE_CODES.PROJETS);
  const { projets, loading } = useSelector(s => s.projets);

  const [search, setSearch]                   = useState('');
  const [typeFilter, setTypeFilter]           = useState('All');
  const [sortBy, setSortBy]                   = useState('date');
  const [viewMode, setViewMode]               = useState('grid');
  const [showFilters, setShowFilters]         = useState(false);
  const [commerciaux, setCommerciaux]         = useState([]);
  const [selectedCommercial, setSelectedCommercial] = useState('');
  const [dateFrom, setDateFrom]               = useState('');
  const [dateTo, setDateTo]                   = useState('');

  useEffect(() => { dispatch(fetchProjets({})); }, [dispatch]);
  useEffect(() => {
    axios.get('/users/commercials/projets-filter')
      .then(r => {
        const raw = Array.isArray(r.data) ? r.data : (r.data?.data || []);
        const mapped = raw.map(c => ({ value: String(c.userId||c.value||c.UserID), label: (c.fullName||c.label||c.login||`Commercial ${c.userId}`).trim() }));
        const seenValues = new Set();
        const seenLabels = new Set();
        const unique = mapped.filter(c => {
          if (seenValues.has(c.value) || seenLabels.has(c.label)) return false;
          seenValues.add(c.value);
          seenLabels.add(c.label);
          return true;
        });
        setCommerciaux(unique.sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' })));
      }).catch(() => {});
  }, []);

  const phases = useMemo(() => [...new Set(projets.map(p => p.Phase).filter(Boolean))], [projets]);

  const filtered = useMemo(() => projets.filter(p => {
    const s   = search.trim().toLowerCase();
    const ok  = !s || (p.Nom_Projet||'').toLowerCase().includes(s) || (p.client?.Raisoc||'').toLowerCase().includes(s);
    const okT = typeFilter === 'All' || (p.Phase||'') === typeFilter;
    const okC = !selectedCommercial || String(p.client?.codRepresTiers||'').trim() === String(selectedCommercial).trim();
    const d   = p.Date_Creation ? new Date(p.Date_Creation) : null;
    return ok && okT && okC && (!dateFrom||(d&&d>=new Date(dateFrom))) && (!dateTo||(d&&d<=new Date(dateTo)));
  }), [projets, search, typeFilter, selectedCommercial, dateFrom, dateTo]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === 'name')     arr.sort((a,b) => (a.Nom_Projet||'').localeCompare(b.Nom_Projet||''));
    if (sortBy === 'budget')   arr.sort((a,b) => (Number(b.Budget_Alloue)||0)-(Number(a.Budget_Alloue)||0));
    if (sortBy === 'progress') arr.sort((a,b) => progressPct(b)-progressPct(a));
    if (sortBy === 'deadline') arr.sort((a,b) => !a.Date_Echeance?1:!b.Date_Echeance?-1:new Date(a.Date_Echeance)-new Date(b.Date_Echeance));
    if (sortBy === 'date')     arr.sort((a,b) => new Date(b.Date_Creation||0)-new Date(a.Date_Creation||0));
    return arr;
  }, [filtered, sortBy]);

  const stats = useMemo(() => {
    const total  = filtered.length;
    const budget = filtered.reduce((a,p) => a+(Number(p.Budget_Alloue)||0), 0);
    const avg    = total > 0 ? Math.round(filtered.reduce((a,p) => a+progressPct(p), 0)/total) : 0;
    const done   = filtered.filter(p => progressPct(p) >= 100).length;
    const urgent = filtered.filter(p => {
      if (!p.Date_Echeance) return false;
      const d = Math.ceil((new Date(p.Date_Echeance)-Date.now())/86400000);
      return d >= 0 && d <= 7;
    }).length;
    return { total, budget, avg, done, urgent };
  }, [filtered]);

  const kanbanCols = useMemo(() =>
    phases.map(ph => ({ phase: ph, projets: sorted.filter(p => (p.Phase||'Nouveau') === ph) })).filter(c => c.projets.length > 0),
  [sorted, phases]);

  const hasFilters = !!(search || typeFilter !== 'All' || selectedCommercial || dateFrom || dateTo);
  const reset = () => { setSearch(''); setTypeFilter('All'); setSelectedCommercial(''); setDateFrom(''); setDateTo(''); };

  if (loading) return <LoadingSpinner />;

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6 pb-12">

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Projets</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {stats.total} projet{stats.total !== 1 ? 's' : ''} · {stats.avg}% d'avancement moyen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => dispatch(fetchProjets({}))} title="Actualiser"
            className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-[#0062AF] hover:border-[#0062AF]/30 transition-all shadow-sm">
            <ArrowPathIcon className="h-4 w-4" />
          </button>
          {canCreate && (
            <button onClick={() => navigate('/projets/new')}
              className="flex items-center gap-2 h-9 px-5 bg-[#0062AF] hover:bg-[#004a85] text-white text-sm font-semibold rounded-xl shadow-sm transition-all">
              <PlusIcon className="h-4 w-4" />
              Nouveau projet
            </button>
          )}
        </div>
      </motion.div>

      {/* ── KPI STRIP ───────────────────────────────────────────── */}
      <motion.div variants={fadeUp}
        className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total',    value: stats.total, sub: `${phases.length} phase${phases.length !== 1 ? 's' : ''}`, icon: BriefcaseIcon,     color: '#0062AF' },
          { label: 'Budget',   value: stats.budget > 0 ? `${(stats.budget/1000).toFixed(0)}k` : '0', sub: 'TND alloué', icon: CurrencyDollarIcon, color: '#059669' },
          { label: 'Terminés', value: stats.done,  sub: 'avancement 100%',   icon: TrophyIcon,        color: '#10b981' },
          { label: 'Urgents',  value: stats.urgent, sub: 'échéance < 7 j',   icon: ClockIcon,         color: stats.urgent > 0 ? '#d97706' : '#94a3b8' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${k.color}15` }}>
              <k.icon className="h-5 w-5" style={{ color: k.color }} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900 tabular-nums leading-none">{k.value}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{k.label} · {k.sub}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── TOOLBAR ─────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200 shadow-sm">

        {/* search + controls */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input type="text" placeholder="Rechercher un projet ou un client…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 h-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0062AF]/20 focus:border-[#0062AF] focus:bg-white placeholder:text-slate-400 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* sort */}
            <div className="flex items-center h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl gap-1.5">
              <ArrowsUpDownIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="text-xs font-medium text-slate-600 bg-transparent border-none focus:outline-none cursor-pointer">
                <option value="date">Plus récent</option>
                <option value="progress">Avancement</option>
                <option value="budget">Budget</option>
                <option value="deadline">Échéance</option>
                <option value="name">Nom A→Z</option>
              </select>
            </div>

            {/* view */}
            <div className="flex h-10 bg-slate-50 border border-slate-200 rounded-xl p-1 gap-0.5">
              {[{ v: 'grid', I: Squares2X2Icon }, { v: 'list', I: ListBulletIcon }, { v: 'kanban', I: ViewColumnsIcon }].map(({ v, I }) => (
                <button key={v} onClick={() => setViewMode(v)}
                  className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all ${viewMode === v ? 'bg-white shadow-sm text-[#0062AF] border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                  <I className="h-4 w-4" />
                </button>
              ))}
            </div>

            {/* filters */}
            <button onClick={() => setShowFilters(v => !v)}
              className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-medium border transition-all ${showFilters ? 'bg-[#0062AF] border-[#0062AF] text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              <FunnelIcon className="h-4 w-4" />
              Filtres
              {hasFilters && <span className={`h-1.5 w-1.5 rounded-full ${showFilters ? 'bg-white' : 'bg-[#0062AF]'}`} />}
            </button>

            {hasFilters && (
              <button onClick={reset} className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors">
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* phase pills */}
        <div className="flex items-center gap-2 px-4 py-3 flex-wrap">
          <button onClick={() => setTypeFilter('All')}
            className={`h-7 px-3 rounded-full text-xs font-semibold border transition-all ${typeFilter === 'All' ? 'bg-[#0062AF] border-[#0062AF] text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
            Tous
          </button>
          {phases.map(t => {
            const cfg = phaseColor(t);
            const n = projets.filter(p => p.Phase === t).length;
            return (
              <button key={t} onClick={() => setTypeFilter(prev => prev === t ? 'All' : t)}
                className={`h-7 px-3 rounded-full text-xs font-semibold border transition-all inline-flex items-center gap-1.5 ${typeFilter === t ? cfg.pill : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                {t}
                <span className="text-[9px] font-bold">{n}</span>
              </button>
            );
          })}
        </div>

        {/* advanced filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
              <div className="px-4 pb-4 pt-3 border-t border-slate-100 grid sm:grid-cols-3 gap-3">
                {[
                  { lbl: 'Commercial', el: <select value={selectedCommercial} onChange={e => setSelectedCommercial(e.target.value)} className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0062AF]/20 focus:border-[#0062AF] text-slate-700"><option value="">Tous</option>{commerciaux.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select> },
                  { lbl: 'Créé après', el: <input type="date" value={dateFrom} max={dateTo || undefined} onChange={e => { const v = e.target.value; setDateFrom(v); if (dateTo && v > dateTo) setDateTo(''); }} className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0062AF]/20 focus:border-[#0062AF] text-slate-700" /> },
                  { lbl: 'Créé avant', el: <input type="date" value={dateTo}   min={dateFrom || undefined} onChange={e => setDateTo(e.target.value)}   className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0062AF]/20 focus:border-[#0062AF] text-slate-700" /> },
                ].map(({ lbl, el }) => (
                  <div key={lbl}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">{lbl}</label>
                    {el}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── RESULTS COUNT ───────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-slate-500">
          <span className="font-bold text-slate-800">{sorted.length}</span>{' '}
          projet{sorted.length !== 1 ? 's' : ''} trouvé{sorted.length !== 1 ? 's' : ''}
          {hasFilters && <span className="text-[#0062AF] font-medium ml-1">(filtré)</span>}
        </p>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {sorted.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <BriefcaseIcon className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-base font-bold text-slate-700 mb-1">Aucun projet trouvé</p>
            <p className="text-sm text-slate-400 mb-5">Essayez d'autres filtres ou créez un projet.</p>
            <div className="flex gap-2">
              {hasFilters && <button onClick={reset} className="h-9 px-5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Réinitialiser</button>}
              {canCreate  && <button onClick={() => navigate('/projets/new')} className="h-9 px-5 rounded-xl bg-[#0062AF] hover:bg-[#004a85] text-sm font-semibold text-white shadow-sm transition-all">+ Nouveau projet</button>}
            </div>
          </motion.div>

        ) : viewMode === 'grid' ? (
          <motion.div key="grid" variants={stagger} initial="hidden" animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {sorted.map(p => <ProjectCard key={p.ID_Projet} projet={p} onView={() => navigate(`/projets/${p.ID_Projet}`)} />)}
            {canCreate && (
              <button onClick={() => navigate('/projets/new')}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 min-h-[200px] hover:border-[#0062AF]/30 hover:bg-[#0062AF]/5 transition-all group">
                <div className="h-11 w-11 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center group-hover:border-[#0062AF]/30 transition-all">
                  <PlusIcon className="h-5 w-5 text-slate-300 group-hover:text-[#0062AF] transition-colors" />
                </div>
                <p className="text-sm font-semibold text-slate-400 group-hover:text-[#0062AF] transition-colors">Nouveau projet</p>
              </button>
            )}
          </motion.div>

        ) : viewMode === 'list' ? (
          <motion.div key="list" variants={stagger} initial="hidden" animate="visible" className="space-y-2">
            {sorted.map(p => <ProjectRow key={p.ID_Projet} projet={p} onView={() => navigate(`/projets/${p.ID_Projet}`)} />)}
            {canCreate && (
              <button onClick={() => navigate('/projets/new')}
                className="w-full flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl hover:border-[#0062AF]/30 hover:bg-[#0062AF]/5 transition-all group">
                <PlusIcon className="h-4 w-4 text-slate-300 group-hover:text-[#0062AF] transition-colors" />
                <span className="text-sm font-medium text-slate-400 group-hover:text-[#0062AF] transition-colors">Nouveau projet</span>
              </button>
            )}
          </motion.div>

        ) : (
          <motion.div key="kanban" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {kanbanCols.map(col => (
                <KanbanColumn key={col.phase} phase={col.phase} projets={col.projets} canCreate={canCreate} navigate={navigate} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProjetsList;
