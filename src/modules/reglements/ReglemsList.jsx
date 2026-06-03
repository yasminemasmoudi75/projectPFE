import { useState, useEffect } from 'react';
import usePermission from '../../hooks/usePermission';
import useAuth from '../../hooks/useAuth';
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
  XMarkIcon,
} from '@heroicons/react/24/outline';

/* ─── status config ─────────────────────────────────────────── */
const STATUS_CFG = {
  'Payé':               { dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200', bar: '#34d399' },
  'Presque payé':       { dot: 'bg-sky-400',     badge: 'bg-sky-50 text-sky-700 border border-sky-200',            bar: '#38bdf8' },
  'Partiellement payé': { dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border border-amber-200',      bar: '#fbbf24' },
  'Non payé':           { dot: 'bg-rose-400',    badge: 'bg-rose-50 text-rose-600 border border-rose-200',         bar: '#fb7185' },
};
const getCfg = (s) => STATUS_CFG[s] || { dot: 'bg-slate-300', badge: 'bg-slate-50 text-slate-500 border border-slate-200', bar: '#cbd5e1' };

const STATUS_TABS = ['', 'Payé', 'Presque payé', 'Partiellement payé', 'Non payé'];
const STATUS_LABEL = { '': 'Tous', 'Payé': 'Payé', 'Presque payé': 'Presque payé', 'Partiellement payé': 'Partiel', 'Non payé': 'Non payé' };

const getInitials = (name = '') => (name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

/* ─── Collection Ring ────────────────────────────────────────── */
const CollectionRing = ({ rate = 0 }) => {
  const r = 38, circ = 2 * Math.PI * r;
  return (
    <div className="relative flex-none w-24 h-24">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#f1f5f9" strokeWidth="7" />
        <circle cx="48" cy="48" r={r} fill="none" stroke="#0062AF" strokeWidth="7"
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={circ - (rate / 100) * circ}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black text-slate-800 leading-none">{rate}%</span>
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">recouvré</span>
      </div>
    </div>
  );
};

/* ─── ReglemsList ────────────────────────────────────────────── */
const ReglemsList = () => {
  const { isClient } = useAuth();
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
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
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
      // axios interceptor returns response.data directly, so res = { status, data:[], pagination:{} }
      setReglements(res?.data || []);
      setPagination(res?.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 });
    } catch { setReglements([]); }
    finally  { setLoading(false); }
  };

  const fetchStats = async () => {
    try { const r = await axios.get('/reglements/stats'); setStats(r.data?.data); } catch {}
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { loadReglements(); }, [filters]);
  useEffect(() => {
    if (isClient) return;
    (async () => {
      try {
        const cr = await axios.get('/tiers?limit=10000&sort=recent');
        const cd = cr?.data?.data || cr?.data || [];
        setClients(Array.isArray(cd) ? cd : []);
      } catch { setClients([]); }
    })();
  }, [isClient]);

  const setFilter    = (k, v) => setFilters(f => ({ ...f, [k]: v, page: 1 }));
  const handlePage   = (p)    => setFilters(f => ({ ...f, page: p }));
  const resetFilters = ()     => setFilters(f => ({ ...f, search: '', status: '', date: '', dateFrom: '', dateTo: '', codTiers: '', codRepres: '', page: 1 }));
  const hasFilters = !!(filters.search || filters.status || filters.date || filters.dateFrom || filters.dateTo || filters.codTiers || filters.codRepres);

  const collectionRate = stats?.totalAmount > 0 ? Math.round((stats.totalPaid / stats.totalAmount) * 100) : 0;
  const totalPages  = pagination?.totalPages || 0;
  const currentPage = pagination?.page || 1;
  const pageWindow  = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
      className="space-y-5 pb-12">

      {/* ── Page Header ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 flex flex-col lg:flex-row lg:items-center gap-5">

          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#0062AF] to-sky-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
              <BanknotesIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {isClient ? 'Mes Paiements' : 'Réglements'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {isClient ? 'Votre situation financière' : 'Suivi des paiements clients et versements'}
              </p>
            </div>
          </div>
          {stats && !isClient && (
            <div className="hidden lg:flex flex-col items-center gap-1.5">
              <CollectionRing rate={collectionRate} />
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Taux de recouvrement</p>
            </div>
          )}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={fetchStats}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all">
              <ArrowPathIcon className="h-4 w-4" />
            </button>
            {canCreate && (
              <button onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#0062AF] hover:bg-[#004a85] text-white text-sm font-semibold transition-colors shadow-sm shadow-blue-500/20">
                <PlusIcon className="h-4 w-4" />
                Nouveau Réglement
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Bandeau Client ────────────────────────────────────── */}
      {isClient && stats && (
        <div className="bg-gradient-to-r from-[#0062AF] to-sky-500 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
          <p className="text-blue-200/80 text-[10px] font-bold uppercase tracking-widest mb-4">Votre situation financière</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-1">Montant total</p>
              <p className="text-2xl font-black tabular-nums">{formatCurrency(stats.totalAmount)}</p>
              <p className="text-blue-200 text-[11px] mt-0.5">Total de vos factures</p>
            </div>
            <div className="bg-emerald-400/20 rounded-xl p-4 border border-emerald-300/30">
              <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mb-1">Montant réglé</p>
              <p className="text-2xl font-black tabular-nums text-emerald-100">{formatCurrency(stats.totalPaid)}</p>
              <p className="text-emerald-200 text-[11px] mt-0.5">{collectionRate}% de vos factures</p>
            </div>
            <div className={`rounded-xl p-4 border ${(stats.totalRemaining || 0) > 0 ? 'bg-amber-400/20 border-amber-300/30' : 'bg-emerald-400/20 border-emerald-300/30'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${(stats.totalRemaining || 0) > 0 ? 'text-amber-200' : 'text-emerald-200'}`}>
                Montant restant
              </p>
              <p className={`text-2xl font-black tabular-nums ${(stats.totalRemaining || 0) > 0 ? 'text-amber-100' : 'text-emerald-100'}`}>
                {formatCurrency(stats.totalRemaining || 0)}
              </p>
              <p className={`text-[11px] mt-0.5 ${(stats.totalRemaining || 0) > 0 ? 'text-amber-200' : 'text-emerald-200'}`}>
                {(stats.totalRemaining || 0) > 0 ? `${100 - collectionRate}% restant à régler` : 'Tout est réglé ✓'}
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-blue-200/80 uppercase tracking-widest">
              <span>Progression du paiement</span>
              <span className="text-white font-black">{collectionRate}%</span>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${collectionRate}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-emerald-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Cards (admin/commercial only) ─────────────────── */}
      {stats && !isClient && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Documents',
              value: stats.totalDocuments,
              sub: 'au total',
              icon: DocumentTextIcon,
              iconBg: 'from-slate-400 to-slate-500',
              pct: null,
              barColor: null,
            },
            {
              label: 'Total à recevoir',
              value: formatCurrency(stats.totalAmount),
              sub: 'montant brut',
              icon: CurrencyDollarIcon,
              iconBg: 'from-blue-500 to-sky-500',
              pct: 100,
              barColor: 'bg-sky-400',
            },
            {
              label: 'Encaissé',
              value: formatCurrency(stats.totalPaid),
              sub: 'déjà réglé',
              icon: CheckCircleIcon,
              iconBg: 'from-[#0062AF] to-sky-500',
              pct: collectionRate,
              barColor: 'bg-[#0062AF]',
            },
            {
              label: 'Restant',
              value: formatCurrency(stats.totalRemaining),
              sub: 'à percevoir',
              icon: ClockIcon,
              iconBg: 'from-amber-400 to-orange-400',
              pct: stats.totalAmount > 0 ? Math.round((stats.totalRemaining / stats.totalAmount) * 100) : 0,
              barColor: 'bg-amber-400',
            },
          ].map((k, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${k.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <k.icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{k.label}</p>
                  <p className="text-base font-black text-slate-800 leading-tight truncate mt-0.5">{k.value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{k.sub}</p>
                </div>
                {k.pct !== null && (
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex-none">{k.pct}%</span>
                )}
              </div>
              {k.pct !== null && (
                <div className="h-1 bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${k.pct}%` }}
                    transition={{ duration: 1, delay: i * 0.1 + 0.3, ease: 'easeOut' }}
                    className={`h-full ${k.barColor}`}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Toolbar ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">

        {/* Search + filter toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input type="text"
              placeholder="Rechercher par client, code…"
              className="w-full pl-10 pr-4 h-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0062AF]/10 focus:border-[#0062AF]/40 focus:bg-white placeholder:text-slate-400 transition-all"
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters(v => !v)}
              className={`inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium border transition-all ${
                showFilters
                  ? 'bg-[#e0f0ff] border-[#0062AF]/30 text-[#0062AF]'
                  : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
              }`}>
              <FunnelIcon className="h-4 w-4" />
              Filtres
              {hasFilters && <span className="h-2 w-2 rounded-full bg-[#0062AF]" />}
            </button>
            {hasFilters && (
              <button onClick={resetFilters}
                className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all">
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_TABS.map(s => {
            const cfg = STATUS_CFG[s];
            const active = filters.status === s;
            return (
              <button key={s || 'all'} onClick={() => setFilter('status', s)}
                className={`h-7 px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border transition-all ${
                  active
                    ? s === '' ? 'bg-[#0062AF] text-white border-[#0062AF]' : cfg?.badge + ' font-bold'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}>
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
              className="overflow-hidden">
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Date exacte</label>
                  <input type="date" value={filters.date} onChange={e => setFilter('date', e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0062AF]/10 focus:border-[#0062AF]/40 text-slate-600 transition-all" />
                </div>
                {!isClient && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Client</label>
                    <select value={filters.codTiers} onChange={e => setFilter('codTiers', e.target.value)}
                      className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0062AF]/10 focus:border-[#0062AF]/40 text-slate-600 transition-all">
                      <option value="">Tous les clients</option>
                      {clients.map(c => (
                        <option key={c.CodTiers || c.id} value={c.CodTiers || c.id}>
                          {c.CodTiers || c.id} — {c.Raisoc || c.LibelleComplet || c.Nom || c.CodTiers}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Du</label>
                  <input type="date" value={filters.dateFrom} onChange={e => setFilter('dateFrom', e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0062AF]/10 focus:border-[#0062AF]/40 text-slate-600 transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Au</label>
                  <input type="date" value={filters.dateTo} onChange={e => setFilter('dateTo', e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0062AF]/10 focus:border-[#0062AF]/40 text-slate-600 transition-all" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Table header bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-[#e0f0ff] flex items-center justify-center">
              <DocumentTextIcon className="h-3.5 w-3.5 text-[#0062AF]" />
            </div>
            <span className="text-sm font-bold text-slate-700">Liste des Réglements</span>
            {pagination?.total > 0 && (
              <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center">
                {pagination.total}
              </span>
            )}
          </div>
          {hasFilters && (
            <span className="text-[11px] text-[#0062AF] font-semibold bg-[#e0f0ff] border border-[#0062AF]/20 px-2.5 py-0.5 rounded-full">
              Filtrés
            </span>
          )}
        </div>

        {/* States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 rounded-full border-[3px] border-slate-100" />
              <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#0062AF] animate-spin" />
            </div>
            <p className="text-xs text-slate-400 font-medium">Chargement…</p>
          </div>
        ) : !reglements?.length ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
              <DocumentTextIcon className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-600">Aucun réglement trouvé</p>
            <p className="text-xs text-slate-400">Modifiez vos filtres ou créez un nouveau réglement.</p>
            {hasFilters && (
              <button onClick={resetFilters}
                className="mt-1 text-xs text-[#0062AF] font-semibold hover:underline underline-offset-2">
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client</th>
                  <th className="px-5 py-3.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</th>
                  <th className="px-5 py-3.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payé</th>
                  <th className="px-5 py-3.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Restant</th>
                  <th className="px-5 py-3.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest w-40">Progression</th>
                  <th className="px-5 py-3.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Statut</th>
                  <th className="px-5 py-3.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
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
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12, delay: i * 0.02 }}
                        onClick={() => { setDetailReglementId(reg.id); setIsDetailOpen(true); }}
                        className="group cursor-pointer hover:bg-slate-50/70 transition-colors duration-100"
                      >
                        {/* Date */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-xs text-slate-500 tabular-nums">{formatDate(toDateOnly(reg.date))}</span>
                        </td>

                        {/* Client */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-black flex-shrink-0 border border-slate-200">
                              {initials}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-800 leading-tight">{reg.client}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{reg.codTiers}</p>
                            </div>
                          </div>
                        </td>

                        {/* Amounts */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <span className="text-xs font-semibold text-slate-600 tabular-nums">{formatCurrency(reg.totalAmount)}</span>
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <span className="text-xs font-bold text-emerald-600 tabular-nums">{formatCurrency(reg.paidAmount)}</span>
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <span className={`text-xs font-semibold tabular-nums ${(reg.remainingAmount || 0) > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                            {formatCurrency(reg.remainingAmount || 0)}
                          </span>
                        </td>

                        {/* Progress */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, type: 'spring', stiffness: 80 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: cfg.bar }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 tabular-nums w-8 text-right shrink-0">{pct}%</span>
                          </div>
                        </td>

                        {/* Status badge */}
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${cfg.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} flex-shrink-0`} />
                            {reg.paymentStatus}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4 text-center" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => { setDetailReglementId(reg.id); setIsDetailOpen(true); }}
                            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-500 hover:bg-[#e0f0ff] hover:text-[#0062AF] hover:border-[#0062AF]/30 transition-all shadow-sm">
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

      {/* ── Pagination ────────────────────────────────────────── */}
      {(pagination?.total || 0) > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-3.5 flex items-center justify-between gap-4 flex-wrap">
          {/* Info + per-page */}
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-400">
              <span className="font-bold text-slate-700">{(currentPage - 1) * (pagination?.limit || 10) + 1}</span>
              {' – '}
              <span className="font-bold text-slate-700">{Math.min(currentPage * (pagination?.limit || 10), pagination?.total || 0)}</span>
              {' sur '}
              <span className="font-bold text-slate-700">{pagination?.total || 0}</span>
              {' réglements'}
            </p>
            <select
              value={filters.limit}
              onChange={e => setFilters(f => ({ ...f, limit: Number(e.target.value), page: 1 }))}
              className="h-7 px-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0062AF]/20 transition-all"
            >
              {[10, 20, 50, 100].map(n => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
          </div>

          {/* Page buttons */}
          <div className="flex items-center gap-1">
            <button disabled={currentPage <= 1} onClick={() => handlePage(currentPage - 1)}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            {pageWindow.map((p, i, arr) => (
              <span key={p} className="flex items-center gap-1">
                {i > 0 && arr[i-1] !== p - 1 && <span className="text-slate-300 text-xs px-1">…</span>}
                <button onClick={() => handlePage(p)}
                  className={`h-8 min-w-[2rem] px-2 rounded-lg text-xs font-bold transition-all ${
                    currentPage === p
                      ? 'bg-[#0062AF] text-white shadow-sm shadow-blue-500/20'
                      : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}>{p}</button>
              </span>
            ))}
            <button disabled={currentPage >= totalPages} onClick={() => handlePage(currentPage + 1)}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────── */}
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
      <ReglemDetailModal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setDetailReglementId(null); }}
        reglementId={detailReglementId}
      />
    </motion.div>
  );
};

export default ReglemsList;
