import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ArrowUpRightIcon,
  XMarkIcon,
  FunnelIcon,
  ChevronDownIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { fetchMyFav, fetchFav } from './favSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import usePermission from '../../hooks/usePermission';
import useAuth from '../../hooks/useAuth';
import { MODULE_CODES } from '../../utils/constants';
import axios from '../../app/axios';
import DocumentReglementHistoryModal from '../reglements/DocumentReglementHistoryModal';
import toast from 'react-hot-toast';

// ─── Animation Variants ───────────────────────────────────────────────────────
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 28 } },
};
const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.04, type: 'spring', stiffness: 300, damping: 26 } }),
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15 } },
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft: { label: 'Brouillon', bar: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  valid: { label: 'Validé', bar: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  converted: { label: 'Transformé', bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
};

const getStatus = (item) => {
  if (item.IsConverted) return 'converted';
  if (item.Valid) return 'valid';
  return 'draft';
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, icon: Icon, accent, iconBg, valueColor }) => (
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
      <p className="text-[11px] text-slate-400 font-medium">{sub}</p>
    </div>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const FavList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { canCreate, canEdit, isModuleActive, isFilterRepresEnabled, loading: permissionLoading } = usePermission(MODULE_CODES.FACTURES);
  const { isClient, isAuthenticated, loading: authLoading, user: currentUser } = useAuth();
  const { favList: fav, loading } = useSelector((state) => state.fav);

  const normalizedUserRole = String(currentUser?.UserRole || '').trim().toLowerCase();
  const isCommercialUser = ['commercial', 'commerciale'].includes(normalizedUserRole);
  const isAdminUser = ['admin', 'administrateur'].includes(normalizedUserRole);
  const isAgentUser = normalizedUserRole === 'agent';
  const isClientUser = normalizedUserRole === 'client';
  const isTechnicienUser = ['technicien', 'technicien sav'].includes(normalizedUserRole);
  const adminId = currentUser?.UserID?.toString();
  const currentUserId = String(currentUser?.UserID || currentUser?.id || currentUser?.USER_ID || '');

  // ── Filters ────────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    search: '', minAmount: '', maxAmount: '',
    minProbability: '', dateFrom: '', dateTo: '', commercial: (isClientUser || isAgentUser) ? 'all' : 'mine',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [commercials, setCommercials] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const clientsFromVisibleFav = useMemo(() => {
    const map = new Map();
    (fav || []).forEach((item) => {
      const code = String(item.CodTiers || '').trim();
      if (!code || map.has(code)) return;
      map.set(code, {
        CodTiers: item.CodTiers,
        Raisoc: item.LibTiers || `Client ${item.CodTiers}`,
        codRepresTiers: item.CodRepres ? String(item.CodRepres) : '',
      });
    });
    return Array.from(map.values()).sort((a, b) =>
      String(a.Raisoc).localeCompare(String(b.Raisoc), 'fr', { sensitivity: 'base' })
    );
  }, [fav]);

  const filteredCommercials = useMemo(() => {
    if (isAgentUser && isFilterRepresEnabled && allClients.length > 0) {
      const ids = new Set(allClients.map((c) => c.codRepresTiers).filter(Boolean));
      return commercials.filter((c) => ids.has(String(c.UserID)));
    }
    return commercials;
  }, [commercials, isAgentUser, allClients, isFilterRepresEnabled]);

  const handleFilterChange = (key, value) => setFilters((p) => ({ ...p, [key]: value }));
  const resetFilters = () =>
    setFilters({ search: '', minAmount: '', maxAmount: '', minProbability: '', dateFrom: '', dateTo: '', commercial: (isClientUser || isAgentUser) ? 'all' : 'mine' });
  const activeFiltersCount = Object.values(filters).filter((v) => v !== 'all' && v !== '').length;

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filteredFav = useMemo(() => (fav || []).filter((item) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!(`${item.Prfx}${item.Nf}`.toLowerCase().includes(q) || (item.LibTiers || '').toLowerCase().includes(q))) return false;
    }
    const amount = item.TotTTC || 0;
    if (filters.minAmount && amount < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && amount > parseFloat(filters.maxAmount)) return false;
    if (filters.minProbability && (item.IA_Probabilite || 0) < parseFloat(filters.minProbability)) return false;
    if (filters.dateFrom && new Date(item.DatUser) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(item.DatUser) > new Date(filters.dateTo)) return false;
    
    // Filter by selected commercial; default to 'mine'
    // Commercial and client users: backend already scopes correctly, skip frontend re-filter.
    if (!isCommercialUser && !isClientUser) {
      if (filters.commercial === 'all') {
        // Show everything
      } else {
        const targetId = (filters.commercial === 'mine' || !filters.commercial) ? adminId : filters.commercial;
        if (String(item.CodRepres) !== String(targetId)) return false;
      }
    }

    return true;
  }), [fav, filters, adminId, isAdminUser, isCommercialUser, isClientUser]);

  // ── KPI metrics ────────────────────────────────────────────────────────────
  const totalCA = filteredFav.reduce((s, i) => s + (i.TotTTC || 0), 0);
  const convertedCount = filteredFav.filter((i) => i.IsConverted).length;
  const conversionRate = filteredFav.length > 0 ? ((convertedCount / filteredFav.length) * 100).toFixed(1) : '0';
  const avgAmount = filteredFav.length > 0 ? totalCA / filteredFav.length : 0;

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalItems = filteredFav.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedFav = filteredFav.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => setCurrentPage(1), [filters]);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const refreshData = () => {
    if (!isModuleActive && !isClient) return;
    const params = { page: 1, limit: 1000 };
    
    // Only admins/agents use selectedCommercial; commercial users are scoped server-side.
    if (!isCommercialUser) {
      if (filters.commercial && filters.commercial !== 'all') {
        params.selectedCommercial = filters.commercial === 'mine' ? adminId : filters.commercial;
      }
      if (filters.commercial === 'all') {
        params.includeAll = true;
      }
    }

    isClient
      ? dispatch(fetchMyFav(params))
      : dispatch(fetchFav(params));
  };

  const fetchCommercials = async () => {
    try {
      const res = await axios.get('/users/commercials/devis-filter', {
        params: { moduleCode: String(MODULE_CODES.FACTURES), includeAll: isFilterRepresEnabled ? 'false' : 'true' },
      });
      const raw = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setCommercials(raw.map((c) => ({ UserID: c.userId || c.UserID, FullName: c.fullName || c.FullName || c.label || c.login, LoginName: c.login || c.LoginName })));
    } catch (e) { console.error('fetchCommercials', e); }
  };

  const fetchClients = async () => {
    try {
      const res = await axios.get('/tiers?limit=10000');
      setAllClients(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (e) { console.error('fetchClients', e); }
  };

  useEffect(() => {
    refreshData();
  }, [filters.commercial, isModuleActive, isClientUser]);

  useEffect(() => {
    if (permissionLoading || authLoading || !isAuthenticated) return;
    if (!isCommercialUser) fetchCommercials();
    if (isFilterRepresEnabled) fetchClients();
  }, [dispatch, permissionLoading, authLoading, isAuthenticated, isModuleActive, isClient, isCommercialUser, isFilterRepresEnabled]);

  useEffect(() => {
    if (!isFilterRepresEnabled) setAllClients(clientsFromVisibleFav);
  }, [isFilterRepresEnabled, clientsFromVisibleFav]);

  if (loading) return <LoadingSpinner />;


  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6 pb-12">

      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Facturier de vente</h1>
            <span className="relative flex h-2.5 w-2.5 mt-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
            </span>
          </div>
          <p className="text-sm text-slate-500">Suivez votre performance commerciale et la facturation en temps réel.</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ rotate: 180 }} whileTap={{ scale: 0.95 }}
            onClick={refreshData}
            className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </motion.button>
          {canCreate && (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/fav/new')}
              className="flex items-center gap-2 h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-500/20 transition-colors"
            >
              <PlusIcon className="h-4 w-4 stroke-[2.5]" />
              Nouvelle facture
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* ── KPI Strip ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Chiffre d'affaires" sub="TND — filtré"
          value={totalCA > 0 ? `${(totalCA / 1000).toFixed(1)}k` : '0'}
          icon={CurrencyDollarIcon} accent="bg-blue-500"
          iconBg="bg-blue-50" valueColor="text-blue-700"
        />
        <KpiCard
          label="Factures émises" sub="documents trouvés"
          value={filteredFav.length}
          icon={DocumentTextIcon} accent="bg-emerald-500"
          iconBg="bg-emerald-50" valueColor="text-emerald-700"
        />
        <KpiCard
          label="Taux de conversion" sub="devis → facture"
          value={`${conversionRate}%`}
          icon={ArrowTrendingUpIcon} accent="bg-amber-400"
          iconBg="bg-amber-50" valueColor="text-amber-700"
        />
        <KpiCard
          label="Montant moyen" sub="TND par facture"
          value={avgAmount > 0 ? `${(avgAmount / 1000).toFixed(1)}k` : '0'}
          icon={ChartBarIcon} accent="bg-violet-500"
          iconBg="bg-violet-50" valueColor="text-violet-700"
        />
      </motion.div>

      {/* ── Filters ── */}
      <motion.div variants={fadeUp} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Main bar */}
        <div className="p-4 flex flex-col xl:flex-row gap-3 xl:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="N° pièce, client..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>

          {/* Advanced filters toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-semibold uppercase tracking-wider border transition-all',
              showFilters
                ? 'bg-slate-100 border-slate-300 text-slate-800'
                : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
            )}
          >
            <FunnelIcon className="h-4 w-4" />
            Filtres
            {activeFiltersCount > 0 && (
              <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDownIcon className={clsx('h-3 w-3 transition-transform', showFilters && 'rotate-180')} />
          </button>
        </div>

        {/* Advanced panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 pt-4 border-t border-slate-100 bg-slate-50/60">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { key: 'minAmount', label: 'Montant min (TND)', type: 'number', placeholder: '1 000' },
                    { key: 'maxAmount', label: 'Montant max (TND)', type: 'number', placeholder: '50 000' },
                    { key: 'dateFrom', label: 'Créé après le', type: 'date', placeholder: '' },
                    { key: 'dateTo', label: 'Créé avant le', type: 'date', placeholder: '' },
                  ].map(({ key, label, type, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
                      <input
                        type={type} placeholder={placeholder} min="0"
                        value={filters[key]}
                        onChange={(e) => handleFilterChange(key, e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                      />
                    </div>
                  ))}
                  {!isCommercialUser && !isClientUser && !isTechnicienUser && (
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Commercial</label>
                      <select
                        value={filters.commercial}
                        onChange={(e) => handleFilterChange('commercial', e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                      >
                        {!isAgentUser && <option value="mine">Mes factures</option>}
                        <option value="all">Tous</option>
                        {filteredCommercials.map((c) => (
                          <option key={c.UserID} value={c.UserID}>{c.FullName}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                    Réinitialiser
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Table ── */}
      <motion.div variants={fadeUp} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Table header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <CurrencyDollarIcon className="h-4 w-4 text-blue-500" />
            Ventes &amp; Facturation (FA)
          </div>
          <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-500 text-xs font-semibold rounded-lg">
            {totalItems} document{totalItems !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Document', 'Client', 'Région', 'Catégorie', 'Montant TTC', ''].map((h, i) => (
                  <th
                    key={i}
                    className={clsx(
                      'px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left',
                      i === 6 && 'text-right'
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {paginatedFav.length === 0 ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <td colSpan={7} className="py-24 text-center">
                      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                          <DocumentTextIcon className="h-8 w-8 text-slate-300" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700 mb-1">
                            {fav?.length > 0 ? 'Aucun résultat' : 'Dossier vide'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {fav?.length > 0 ? 'Ajustez vos filtres pour trouver ce que vous cherchez.' : "Aucune facture créée pour le moment."}
                          </p>
                        </div>
                        {(!fav || fav.length === 0) && canCreate && (
                          <button onClick={() => navigate('/fav/new')} className="mt-1 text-sm text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                            + Créer une facture
                          </button>
                        )}
                      </motion.div>
                    </td>
                  </motion.tr>
                ) : (
                  paginatedFav.map((item, i) => {
                    const status = getStatus(item);
                    const cfg = STATUS_CONFIG[status];
                    return (
                      <motion.tr
                        key={item.Guid || i}
                        custom={i}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={() => navigate(`/fav/${item.Guid}`)}
                        className="group relative border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        {/* Status bar */}
                        <td className="px-5 py-3.5 relative">
                          <div className={clsx('absolute left-0 top-0 bottom-0 w-[3px] opacity-0 group-hover:opacity-100 transition-opacity rounded-r', cfg.bar)} />
                          <div className="font-semibold text-blue-700 text-sm">{item.Prfx}{item.Nf}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <CalendarIcon className="h-3 w-3 text-slate-300" />
                            <span className="text-[10px] text-slate-400">{formatDate(item.DatUser)}</span>
                          </div>
                        </td>

                        {/* Client */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                              {(item.LibTiers || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate max-w-[150px] group-hover:text-blue-700 transition-colors">
                                {item.LibTiers || 'Inconnu'}
                              </p>
                              <p className="text-[10px] text-slate-400">Client prospect</p>
                            </div>
                          </div>
                        </td>

                        {/* Région */}
                        <td className="px-5 py-3.5">
                          {(item?.client?.MapsRegion || item.MapsRegion || item.Gouvernorat) ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 uppercase tracking-wide">
                              {item?.client?.MapsRegion || item.MapsRegion || item.Gouvernorat}
                            </span>
                          ) : <span className="text-slate-200">—</span>}
                        </td>

                        {/* Catégorie */}
                        <td className="px-5 py-3.5">
                          {(item?.client?.tiersCategorieObj?.libelle || item.Categorie) ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 uppercase tracking-wide">
                              {item?.client?.tiersCategorieObj?.libelle || item.Categorie}
                            </span>
                          ) : <span className="text-slate-200">—</span>}
                        </td>

                        {/* Montant */}
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(item.TotTTC)}</span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canEdit && (
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/fav/edit/${item.Guid}`); }}
                                title="Modifier"
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-all"
                              >
                                <PencilSquareIcon className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setHistoryTarget({ id: item.Guid, type: 'FA', label: `${item.Prfx || ''}${item.Nf || ''}` });
                              }}
                              title="Historique règlements"
                              className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50 transition-all"
                            >
                              <DocumentTextIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/fav/${item.Guid}`); }}
                              title="Ouvrir"
                              className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                            >
                              <ArrowUpRightIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-400 font-medium">
              {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} sur {totalItems}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-500 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-blue-600 transition-colors"
              >
                ← Préc.
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const p = idx + 1;
                if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={clsx(
                        'h-8 w-8 rounded-lg text-xs font-semibold transition-colors',
                        currentPage === p
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                          : 'text-slate-500 hover:bg-slate-100'
                      )}
                    >
                      {p}
                    </button>
                  );
                } else if (p === currentPage - 2 || p === currentPage + 2) {
                  return <span key={`e${p}`} className="text-slate-300 text-xs px-1">…</span>;
                }
                return null;
              })}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-500 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-blue-600 transition-colors"
              >
                Suiv. →
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Modal règlements ── */}
      <DocumentReglementHistoryModal
        isOpen={Boolean(historyTarget)}
        onClose={() => setHistoryTarget(null)}
        documentId={historyTarget?.id}
        documentType={historyTarget?.type}
        documentLabel={historyTarget?.label}
      />

    </motion.div>
  );
};

export default FavList;
