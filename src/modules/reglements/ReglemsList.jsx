import { useState, useEffect } from 'react';
import usePermission from '../../hooks/usePermission';
import axios from '../../app/axios';
import { formatDate, formatCurrency } from '../../utils/format';
import { MODULE_CODES } from '../../utils/constants';
import ReglemPaymentModal from './ReglemPaymentModal';
import ReglemForm from './ReglemForm';
import ReglemDetailModal from './ReglemDetailModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon, MagnifyingGlassIcon, ArrowPathIcon, CurrencyDollarIcon,
  CheckCircleIcon, DocumentTextIcon, EyeIcon, FunnelIcon,
  ChevronLeftIcon, ChevronRightIcon, BanknotesIcon, ClockIcon,
  SparklesIcon, XMarkIcon,
} from '@heroicons/react/24/outline';

/* ─── status config ─────────────────────────────────────────── */
const STATUS_CFG = {
  'Payé':               { dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-600 border border-emerald-200', bar: '#6ee7b7', rowHover: '#f0fdf4' },
  'Presque payé':       { dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600 border border-slate-200',     bar: '#94a3b8', rowHover: '#f8fafc' },
  'Partiellement payé': { dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-600 border border-amber-200',      bar: '#fcd34d', rowHover: '#fffbeb' },
  'Non payé':           { dot: 'bg-rose-400',    badge: 'bg-rose-50 text-rose-500 border border-rose-200',         bar: '#fda4af', rowHover: '#fff1f2' },
};
const getCfg = (s) => STATUS_CFG[s] || { dot: 'bg-slate-300', badge: 'bg-slate-50 text-slate-500 border border-slate-200', bar: '#e2e8f0', rowHover: '#f8fafc' };

const STATUS_TABS = ['', 'Payé', 'Presque payé', 'Partiellement payé', 'Non payé'];
const STATUS_LABEL = { '': 'Tous', 'Payé': 'Payé', 'Presque payé': 'Presque payé', 'Partiellement payé': 'Partiel', 'Non payé': 'Non payé' };

const getInitials = (name = '') => (name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

/* ─── Collection Rate Ring ───────────────────────────────────── */
const CollectionRing = ({ rate = 0 }) => {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (rate / 100) * circ;
  return (
    <div className="relative flex-none">
      <svg width="110" height="110" viewBox="0 0 110 110" className="-rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle cx="55" cy="55" r={r} fill="none" stroke="#34d399" strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-slate-700 leading-none">{rate}%</span>
        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">recouvré</span>
      </div>
    </div>
  );
};

/* ─── ReglemsList ────────────────────────────────────────────── */
const ReglemsList = () => {
  const { canCreate } = usePermission(MODULE_CODES.REGLEMENT);
  const [reglements, setReglements]   = useState([]);
  const [stats, setStats]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '', status: '', date: '', dateFrom: '', dateTo: '',
    codTiers: '', codRepres: '', page: 1, limit: 10,
  });
  const [clients, setClients]         = useState([]);
  const [commercials, setCommercials] = useState([]);
  const [pagination, setPagination]   = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [isModalOpen, setIsModalOpen]           = useState(false);
  const [selectedReglement, setSelectedReglement] = useState(null);
  const [isFormOpen, setIsFormOpen]             = useState(false);
  const [detailReglementId, setDetailReglementId] = useState(null);
  const [isDetailOpen, setIsDetailOpen]         = useState(false);

  const toDateOnly = (v) => {
    if (!v) return '';
    const d = v instanceof Date ? v : new Date(v);
    if (isNaN(d)) return String(v).slice(0, 10);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const loadReglements = async (override = null) => {
    try {
      setLoading(true);
      const f = override || filters;
      const p = new URLSearchParams({ search: f.search, status: f.status, page: f.page, limit: f.limit });
      if (f.date)      p.set('date', f.date);
      if (f.dateFrom)  p.set('dateFrom', f.dateFrom);
      if (f.dateTo)    p.set('dateTo', f.dateTo);
      if (f.codTiers)  p.set('codTiers', f.codTiers);
      if (f.codRepres) p.set('codRepres', f.codRepres);
      const res = await axios.get(`/reglements?${p}`);
      setReglements(res.data.data || res.data);
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 });
    } catch { setReglements([]); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try { const r = await axios.get('/reglements/stats'); setStats(r.data.data); } catch {}
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { loadReglements(); }, [filters]);
  useEffect(() => {
    (async () => {
      try {
        const [cr, comr] = await Promise.all([
          axios.get('/tiers?limit=10000&sort=recent'),
          axios.get('/users/commercials/assignable'),
        ]);
        const cd   = cr?.data?.data   || cr?.data   || [];
        const comd = comr?.data?.data || comr?.data || [];
        setClients(Array.isArray(cd) ? cd : []);
        setCommercials(Array.isArray(comd) ? comd : []);
      } catch { setClients([]); setCommercials([]); }
    })();
  }, []);

  const setFilter   = (k, v) => setFilters(f => ({ ...f, [k]: v, page: 1 }));
  const handlePage  = (p)    => setFilters(f => ({ ...f, page: p }));
  const resetFilters = ()    => setFilters(f => ({ ...f, search: '', status: '', date: '', dateFrom: '', dateTo: '', codTiers: '', codRepres: '', page: 1 }));
  const hasFilters = !!(filters.search || filters.status || filters.date || filters.dateFrom || filters.dateTo || filters.codTiers || filters.codRepres);

  const collectionRate = stats && stats.totalAmount > 0
    ? Math.round((stats.totalPaid / stats.totalAmount) * 100) : 0;

  const totalPages  = pagination?.totalPages || 0;
  const currentPage = pagination?.page || 1;
  const pageWindow  = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5 pb-12">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
        {/* Subtle tinted corner */}
        <div className="absolute top-0 right-0 w-72 h-full bg-gradient-to-l from-emerald-50/60 to-transparent pointer-events-none rounded-2xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Left: title */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-semibold mb-3">
              <SparklesIcon className="h-3.5 w-3.5" />
              Finance & Paiements
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">
              Gestion des Réglements
            </h1>
            <p className="text-slate-400 mt-1 text-sm">Suivi des paiements clients et versements en temps réel.</p>

            {stats && (
              <div className="flex flex-wrap items-center gap-6 mt-5">
                {[
                  { icon: DocumentTextIcon, value: stats.totalDocuments,               label: 'documents' },
                  { icon: CheckCircleIcon,  value: formatCurrency(stats.totalPaid),    label: 'encaissé' },
                  { icon: ClockIcon,        value: formatCurrency(stats.totalRemaining), label: 'restant' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {i > 0 && <div className="h-5 w-px bg-slate-200" />}
                    <s.icon className="h-4 w-4 text-slate-400 flex-none" />
                    <div>
                      <p className="text-sm font-bold text-slate-700 leading-none">{s.value}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Center: collection ring */}
          {stats && (
            <div className="hidden lg:flex flex-col items-center gap-1 px-4">
              <CollectionRing rate={collectionRate} />
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Taux de recouvrement</p>
            </div>
          )}

          {/* Right: actions */}
          <div className="flex items-center gap-2 lg:flex-col lg:items-end">
            <button
              onClick={fetchStats}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              title="Rafraîchir"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
            {canCreate && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors shadow-sm"
              >
                <PlusIcon className="h-4 w-4" />
                Nouveau Réglement
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Documents',        value: stats.totalDocuments,               sub: 'au total',    icon: DocumentTextIcon,   pct: null },
            { label: 'Total à recevoir', value: formatCurrency(stats.totalAmount),   sub: 'montant brut', icon: CurrencyDollarIcon, pct: 100 },
            { label: 'Encaissé',         value: formatCurrency(stats.totalPaid),     sub: 'déjà réglé',  icon: CheckCircleIcon,    pct: collectionRate },
            { label: 'Restant',          value: formatCurrency(stats.totalRemaining), sub: 'à percevoir', icon: BanknotesIcon,      pct: stats.totalAmount > 0 ? Math.round((stats.totalRemaining / stats.totalAmount) * 100) : 0 },
          ].map((k, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default"
            >
              <div className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-none">
                  <k.icon className="h-5 w-5 text-slate-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest truncate">{k.label}</p>
                  <p className="text-base font-bold text-slate-700 leading-tight truncate mt-0.5">{k.value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{k.sub}</p>
                </div>
                {k.pct !== null && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex-none">{k.pct}%</span>
                )}
              </div>
              {k.pct !== null && (
                <div className="h-0.5 bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${k.pct}%` }}
                    transition={{ duration: 1, delay: i * 0.1 + 0.3, ease: 'easeOut' }}
                    className="h-full bg-emerald-400 rounded-full"
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher par client, code…"
              className="w-full pl-10 pr-4 h-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:bg-white placeholder:text-slate-400 transition-all"
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium border transition-all ${
                showFilters
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                  : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
              Filtres
              {hasFilters && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
            </button>
            {hasFilters && (
              <button onClick={resetFilters}
                className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-rose-400 hover:border-rose-200 hover:bg-rose-50 transition-all">
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_TABS.map(s => {
            const cfg  = STATUS_CFG[s];
            const active = filters.status === s;
            return (
              <button key={s || 'all'} onClick={() => setFilter('status', s)}
                className={`h-7 px-3 rounded-full text-xs font-medium inline-flex items-center gap-1.5 border transition-all ${
                  active
                    ? s === '' ? 'bg-emerald-600 text-white border-emerald-600' : cfg?.badge
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {cfg && <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />}
                {STATUS_LABEL[s]}
              </button>
            );
          })}
        </div>

        {/* Advanced filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[{ label: 'Date exacte', type: 'date', key: 'date' }].map(({ label, type, key }) => (
                  <div key={key}>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1.5">{label}</label>
                    <input type={type} value={filters[key]} onChange={e => setFilter(key, e.target.value)}
                      className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-slate-600 transition-all" />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1.5">Client</label>
                  <select value={filters.codTiers} onChange={e => setFilter('codTiers', e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-slate-600 transition-all">
                    <option value="">Tous les clients</option>
                    {clients.map(c => (
                      <option key={c.CodTiers || c.id} value={c.CodTiers || c.id}>
                        {c.CodTiers || c.id} — {c.LibelleComplet || c.Nom || c.LibTiers || c.Raisoc || c.CodTiers}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1.5">Du</label>
                  <input type="date" value={filters.dateFrom} onChange={e => setFilter('dateFrom', e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-slate-600 transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1.5">Au</label>
                  <input type="date" value={filters.dateTo} onChange={e => setFilter('dateTo', e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-slate-600 transition-all" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/40">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-600">Liste des Réglements</span>
          </div>
          <span className="text-xs text-slate-400">
            <span className="font-semibold text-slate-600">{pagination?.total || 0}</span>
            {' '}document{(pagination?.total || 0) !== 1 ? 's' : ''}
            {hasFilters && <span className="ml-1 text-emerald-500 font-semibold">(filtrés)</span>}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 rounded-full border-[3px] border-slate-100" />
              <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-emerald-400 animate-spin" />
            </div>
            <p className="text-xs text-slate-400">Chargement…</p>
          </div>
        ) : !reglements?.length ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
              <DocumentTextIcon className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-500">Aucun réglement trouvé</p>
            <p className="text-xs text-slate-400">Modifiez vos filtres ou créez un nouveau réglement.</p>
            {hasFilters && (
              <button onClick={resetFilters} className="mt-1 text-xs text-emerald-600 font-semibold hover:underline underline-offset-2">
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100">
                  <th className="pl-5 pr-2 py-3.5 w-6" />
                  <th className="px-4 py-3.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-4 py-3.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Client</th>
                  <th className="px-4 py-3.5 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Total</th>
                  <th className="px-4 py-3.5 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Payé</th>
                  <th className="px-4 py-3.5 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Restant</th>
                  <th className="px-4 py-3.5 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-widest w-40">Progression</th>
                  <th className="px-4 py-3.5 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Statut</th>
                  <th className="px-4 py-3.5 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence mode="popLayout">
                  {reglements.map((reg, i) => {
                    const cfg = getCfg(reg.paymentStatus);
                    const pct = Math.min(100, Math.max(0, reg.paymentPercentage || 0));
                    const initials = getInitials(reg.client);
                    return (
                      <motion.tr
                        key={reg.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, delay: i * 0.025 }}
                        onClick={() => { setDetailReglementId(reg.id); setIsDetailOpen(true); }}
                        className="group cursor-pointer transition-colors duration-150"
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = cfg.rowHover; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; }}
                      >
                        <td className="pl-5 pr-2 py-4">
                          <div className="h-5 w-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-400" />
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-xs text-slate-500 tabular-nums">{formatDate(toDateOnly(reg.date))}</span>
                        </td>

                        {/* Client */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-[10px] font-bold flex-none">
                              {initials}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-700 leading-tight">{reg.client}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{reg.codTiers}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <span className="text-xs font-semibold text-slate-600 tabular-nums">{formatCurrency(reg.totalAmount)}</span>
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <span className="text-xs font-semibold text-emerald-600 tabular-nums">{formatCurrency(reg.paidAmount)}</span>
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <span className="text-xs font-semibold text-slate-500 tabular-nums">{formatCurrency(reg.remainingAmount)}</span>
                        </td>

                        {/* Progress */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: cfg.bar }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 tabular-nums w-7 text-right shrink-0">{pct}%</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium ${cfg.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} flex-none`} />
                            {reg.paymentStatus}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => { setDetailReglementId(reg.id); setIsDetailOpen(true); }}
                            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all"
                          >
                            <EyeIcon className="h-3.5 w-3.5" />
                            Voir
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-3.5 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            <span className="font-semibold text-slate-600">{(currentPage - 1) * (pagination?.limit || 10) + 1}</span>
            {' – '}
            <span className="font-semibold text-slate-600">{Math.min(currentPage * (pagination?.limit || 10), pagination?.total || 0)}</span>
            {' sur '}
            <span className="font-semibold text-slate-600">{pagination?.total || 0}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <button disabled={currentPage === 1} onClick={() => handlePage(currentPage - 1)}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            {pageWindow.map((p, i, arr) => (
              <span key={p} className="flex items-center gap-1.5">
                {i > 0 && arr[i - 1] !== p - 1 && <span className="text-slate-300 text-xs select-none">…</span>}
                <button onClick={() => handlePage(p)}
                  className={`h-8 min-w-[2rem] px-2 rounded-lg text-xs font-medium transition-all ${
                    currentPage === p
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}>{p}</button>
              </span>
            ))}
            <button disabled={currentPage === totalPages} onClick={() => handlePage(currentPage + 1)}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────── */}
      <ReglemPaymentModal
        reglement={selectedReglement} isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedReglement(null); }}
        onSuccess={updated => {
          setReglements(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
          fetchStats();
        }}
      />
      <ReglemForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={(n) => {
          setIsFormOpen(false);
          if (n?.id) setReglements(prev => prev.some(r => r.id === n.id) ? prev : [n, ...prev]);
          setFilters(f => ({ ...f, page: 1 }));
          loadReglements({ ...filters, page: 1 });
          fetchStats();
        }}
      />
      <ReglemDetailModal isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); setDetailReglementId(null); }} reglementId={detailReglementId} />
    </motion.div>
  );
};

export default ReglemsList;
