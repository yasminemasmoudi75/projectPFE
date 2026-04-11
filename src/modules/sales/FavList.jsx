import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  EyeIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ArrowUpRightIcon,
  ArrowTrendingUpIcon,
  XMarkIcon,
  FunnelIcon,
  ChevronDownIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  UserIcon,
  BuildingOfficeIcon
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

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", bounce: 0, duration: 0.4 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

const FavList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { canCreate, canEdit, isModuleActive, isFilterRepresEnabled, loading: permissionLoading } = usePermission(MODULE_CODES.FACTURES);
  const { isClient, isAuthenticated, loading: authLoading, user: currentUser } = useAuth();
  const { favList: fav, loading, pagination } = useSelector((state) => state.fav);
  const normalizedUserRole = String(currentUser?.UserRole || '').trim().toLowerCase();
  const isCommercialUser = ['commercial', 'commerciale'].includes(normalizedUserRole);
  const isAgentUser = normalizedUserRole === 'agent';
  const currentUserId = String(currentUser?.UserID || currentUser?.id || currentUser?.USER_ID || '');

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: 'all', // all, draft, valid, converted
    minAmount: '',
    maxAmount: '',
    minProbability: '',
    dateFrom: '',
    dateTo: '',
    commercial: '',
    client: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [commercials, setCommercials] = useState([]);
  const [allClients, setAllClients] = useState([]);

  const clientsFromVisibleFav = useMemo(() => {
    const uniqueClients = new Map();

    (fav || []).forEach((item) => {
      const codTiers = String(item.CodTiers || '').trim();
      if (!codTiers || uniqueClients.has(codTiers)) return;

      uniqueClients.set(codTiers, {
        CodTiers: item.CodTiers,
        Raisoc: item.LibTiers || `Client ${item.CodTiers}`,
        codRepresTiers: item.CodRepres ? String(item.CodRepres) : ''
      });
    });

    return Array.from(uniqueClients.values()).sort((a, b) =>
      String(a.Raisoc || '').localeCompare(String(b.Raisoc || ''), 'fr', { sensitivity: 'base' })
    );
  }, [fav]);

  const filteredCommercials = useMemo(() => {
    if (isAgentUser && isFilterRepresEnabled && allClients.length > 0) {
      const commercialIdsInRegion = new Set();
      allClients.forEach((client) => {
        if (client.codRepresTiers) {
          commercialIdsInRegion.add(String(client.codRepresTiers));
        }
      });

      return commercials.filter((com) => commercialIdsInRegion.has(String(com.UserID)));
    }

    return commercials;
  }, [commercials, isAgentUser, allClients, isFilterRepresEnabled]);

  const filteredClientsForDropdown = useMemo(() => {
    if (isCommercialUser && isFilterRepresEnabled) {
      return allClients.filter((client) => String(client.codRepresTiers || '') === currentUserId);
    }

    return filters.commercial
      ? allClients.filter((client) => String(client.codRepresTiers || '') === String(filters.commercial))
      : allClients;
  }, [filters.commercial, allClients, isCommercialUser, currentUserId, isFilterRepresEnabled]);

  // Filter handler
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      minAmount: '',
      maxAmount: '',
      minProbability: '',
      dateFrom: '',
      dateTo: '',
      commercial: '',
      client: ''
    });
  };

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(v => v !== 'all' && v !== '').length;

  // Apply filters to Fav list
  const filteredFav = fav?.filter(item => {
    // Search filter
    if (filters.search && !(`${item.Prfx}${item.Nf}`.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.LibTiers?.toLowerCase().includes(filters.search.toLowerCase()))) {
      return false;
    }

    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'draft' && (item.Valid || item.IsConverted)) return false;
      if (filters.status === 'valid' && (!item.Valid || item.IsConverted)) return false;
      if (filters.status === 'converted' && !item.IsConverted) return false;
    }

    // Amount filter
    const amount = item.TotTTC || 0;
    if (filters.minAmount && amount < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && amount > parseFloat(filters.maxAmount)) return false;

    // Probability filter
    if (filters.minProbability && (item.IA_Probabilite || 0) < parseFloat(filters.minProbability)) {
      return false;
    }

    // Date range filter
    if (filters.dateFrom) {
      const itemDate = new Date(item.DatUser);
      const filterDate = new Date(filters.dateFrom);
      if (itemDate < filterDate) return false;
    }
    if (filters.dateTo) {
      const itemDate = new Date(item.DatUser);
      const filterDate = new Date(filters.dateTo);
      if (itemDate > filterDate) return false;
    }

    if (filters.commercial) {
      if (item.CodRepres !== filters.commercial) return false;
    }

    if (filters.client) {
      if (item.CodTiers !== filters.client) return false;
    }

    return true;
  }) || [];

  const fetchCommercials = async () => {
    try {
      const params = {
        moduleCode: String(MODULE_CODES.FACTURES),
        includeAll: isFilterRepresEnabled ? 'false' : 'true'
      };
      const response = await axios.get('/users/commercials/devis-filter', { params });
      const data = response.data;
      const rawList = Array.isArray(data) ? data : data.data || [];
      const commercialsList = rawList.map((c) => ({
        UserID: c.userId || c.UserID,
        FullName: c.fullName || c.FullName || c.label || c.login,
        LoginName: c.login || c.LoginName
      }));
      setCommercials(commercialsList);
    } catch (error) {
      console.error('Error fetching commercials:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get('/tiers?limit=10000');
      const data = response.data;
      const clientsData = Array.isArray(data) ? data : data.data || [];
      setAllClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const refreshData = () => {
    if (!isModuleActive) return;
    if (isClient) {
      dispatch(fetchMyFav({ page: 1, limit: 1000 }));
    } else {
      dispatch(fetchFav({ page: 1, limit: 1000 }));
    }
  };

  useEffect(() => {
    if (permissionLoading || authLoading || !isAuthenticated) return;
    refreshData();
    if (!isCommercialUser) {
      fetchCommercials();
    } else {
      setCommercials([]);
    }
    if (isFilterRepresEnabled) {
      fetchClients();
    }
  }, [dispatch, permissionLoading, authLoading, isAuthenticated, isModuleActive, isClient, isCommercialUser, isFilterRepresEnabled]);

  useEffect(() => {
    if (!isFilterRepresEnabled) {
      setAllClients(clientsFromVisibleFav);
    }
  }, [isFilterRepresEnabled, clientsFromVisibleFav]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Derived metrics for stats overlay
  const totalFavTTC = filteredFav?.reduce((acc, curr) => acc + (curr.TotTTC || 0), 0) || 0;
  const convertedCount = filteredFav?.filter(item => item.IsConverted).length || 0;
  const conversionRate = filteredFav?.length > 0 ? ((convertedCount / filteredFav.length) * 100).toFixed(1) : 0;

  // Calculate Pagination
  const totalItems = filteredFav.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFav = filteredFav.slice(startIndex, startIndex + itemsPerPage);

  if (loading) return <LoadingSpinner />;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            Facturier de Vente
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Suivez votre performance commerciale et la facturation en temps réel.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={refreshData}
            className="p-3 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 hover:border-blue-300 transition-colors shadow-sm"
            title="Rafraîchir"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Quick Stats Overlay */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div whileHover={{ y: -5 }} className="card-luxury p-0 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-6 flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Chiffre d'Affaires (Filtré)</p>
              <p className="text-3xl font-extrabold text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                {totalFavTTC > 0 ? (totalFavTTC / 1000).toFixed(1) + 'k' : '0'} <span className="text-sm text-slate-400 font-bold ml-1">TND</span>
              </p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
              <CurrencyDollarIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="card-luxury p-0 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-6 flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Taux Conversion (Filtré)</p>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-extrabold text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-600">
                  {filteredFav.length}
                </p>
                <span className="mb-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center gap-1">
                  <DocumentTextIcon className="h-3 w-3" /> Factures Émises
                </span>
              </div>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center transform group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500"></div>
        </motion.div>
      </motion.div>

      {/* Filters Card */}
      <motion.div variants={itemVariants} className="card-luxury p-0 overflow-hidden bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-xl shadow-slate-200/40 rounded-3xl">
        {/* Main Filter Bar */}
        <div className="p-4 sm:p-6 flex flex-col xl:flex-row gap-4 xl:items-center">
          {/* Search Input */}
          <div className="relative flex-1 w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform group-focus-within:scale-110 group-focus-within:text-blue-500">
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher par N° de pièce, client, entreprise..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border-2 border-slate-100 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>

          {/* Quick Status Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'Tous' },
              { id: 'draft', label: 'Brouillon', color: 'yellow' },
              { id: 'valid', label: 'Validés', color: 'blue' },
              { id: 'converted', label: 'Transformés', color: 'emerald' }
            ].map(status => {
              const isActive = filters.status === status.id;
              let colors = "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50";
              if (isActive) {
                if (status.color === 'yellow') colors = "bg-yellow-50 text-yellow-700 border-yellow-300 shadow-sm shadow-yellow-200/50";
                else if (status.color === 'blue') colors = "bg-blue-50 text-blue-700 border-blue-300 shadow-sm shadow-blue-200/50";
                else if (status.color === 'emerald') colors = "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm shadow-emerald-200/50";
                else colors = "bg-slate-800 text-white border-slate-800 shadow-sm shadow-slate-400/50"; // all
              }
              return (
                <button
                  key={status.id}
                  onClick={() => handleFilterChange('status', status.id)}
                  className={clsx(
                    "px-5 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest border-2 transition-all duration-200 active:scale-95",
                    colors
                  )}
                >
                  {status.label}
                </button>
              );
            })}
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              "px-5 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap border-2 active:scale-95",
              showFilters
                ? "bg-slate-100 border-slate-300 text-slate-800"
                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
            )}
          >
            <FunnelIcon className="h-4 w-4" />
            Filtres Avancés
            {activeFiltersCount > 0 && (
              <span className="flex items-center justify-center h-5 w-5 bg-indigo-500 text-white text-[10px] rounded-full shadow-sm">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDownIcon className={clsx("h-3 w-3 transition-transform duration-300", showFilters && "rotate-180")} />
          </button>
        </div>

        {/* Advanced Filters Section */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 pt-0 border-t border-slate-100/80 bg-slate-50/30">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                  {/* Min Amount */}
                  <div className="group">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                      <CurrencyDollarIcon className="h-3.5 w-3.5" />
                      Montant Min (TND)
                    </label>
                    <input
                      type="number" min="0" placeholder="Ex: 1000"
                      value={filters.minAmount} onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                  {/* Max Amount */}
                  <div className="group">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                      <CurrencyDollarIcon className="h-3.5 w-3.5" />
                      Montant Max (TND)
                    </label>
                    <input
                      type="number" min="0" placeholder="Ex: 50000"
                      value={filters.maxAmount} onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                  {/* Date From */}
                  <div className="group">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      Créé Après Le
                    </label>
                    <input
                      type="date"
                      value={filters.dateFrom} onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                  {/* Date To */}
                  <div className="group">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      Créé Avant Le
                    </label>
                    <input
                      type="date"
                      value={filters.dateTo} onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                  {!isCommercialUser && (
                    <div className="group">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                        <UserIcon className="h-3.5 w-3.5" />
                        Commerciale
                      </label>
                      <select
                        value={filters.commercial}
                        onChange={(e) => handleFilterChange('commercial', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                      >
                        <option value="">-- Tous les commerciales --</option>
                        {filteredCommercials.map(com => (
                          <option key={com.UserID} value={com.UserID}>
                            {com.FullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="group">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                      <BuildingOfficeIcon className="h-3.5 w-3.5" />
                      Client
                    </label>
                    <select
                      value={filters.client}
                      onChange={(e) => handleFilterChange('client', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    >
                      <option value="">-- Tous les clients --</option>
                      {filteredClientsForDropdown.map(client => (
                        <option key={client.CodTiers} value={client.CodTiers}>
                          {client.Raisoc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={resetFilters}
                    className="px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2"
                  >
                    <XMarkIcon className="h-4 w-4 stroke-[3]" />
                    Réinitialiser
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Table Section */}
      <motion.div variants={itemVariants} className="card-luxury p-0 overflow-hidden border border-slate-200/50 shadow-xl shadow-slate-200/30 rounded-3xl">
        <div className="px-8 py-6 border-b border-slate-100 bg-white flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <CurrencyDollarIcon className="h-5 w-5 text-blue-500" />
            Ventes & Facturation (FA)
          </h3>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold shadow-sm border border-slate-200/60">
            {totalItems} documents trouvés
          </span>
        </div>
        
        <div className="overflow-x-auto bg-slate-50/30">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/80 backdrop-blur-sm border-b border-slate-200/80 shadow-sm">
                <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest group cursor-pointer hover:text-slate-700 transition-colors">Document</th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Client</th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Région</th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Catégorie</th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Classe</th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Montant TTC</th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Statut</th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 bg-white">
              <AnimatePresence>
                {(!filteredFav || filteredFav.length === 0) ? (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan="9" className="px-8 py-32 text-center">
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center gap-4 max-w-xs mx-auto"
                      >
                        <div className="h-20 w-20 bg-gradient-to-tr from-slate-100 to-slate-50 rounded-full flex items-center justify-center text-slate-300 shadow-inner border border-slate-200/50">
                          <DocumentTextIcon className="h-10 w-10" />
                        </div>
                        <div>
                          <p className="text-slate-800 font-bold mb-1">
                            {fav && fav.length > 0 ? 'Aucun résultat trouvé' : 'Dossier vide'}
                          </p>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            {fav && fav.length > 0 
                              ? "Ajustez vos filtres de recherche pour trouver ce que vous cherchez." 
                              : "Vous n'avez pas encore créé de proposition commerciale. Commencez dès maintenant."}
                          </p>
                        </div>
                        {(!fav || fav.length === 0) && canCreate && (
                          <button onClick={() => navigate('/fav/new')} className="mt-2 text-sm text-blue-600 font-bold hover:text-blue-700">
                            + Créer un Fav
                          </button>
                        )}
                      </motion.div>
                    </td>
                  </motion.tr>
                ) : (
                  paginatedFav.map((item, i) => (
                    <motion.tr
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      custom={i}
                      // Staggered delay for list items
                      transition={{ delay: i * 0.05 }}
                      key={item.Guid || i}
                      className="group hover:bg-slate-50/80 transition-colors cursor-pointer relative"
                      onClick={() => navigate(`/fav/${item.Guid}`)}
                    >
                      <td className="px-8 py-4 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-blue-500 transition-colors" />
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-extrabold text-blue-700 tracking-tight transition-colors group-hover:text-blue-900">
                            {item.Prfx}{item.Nf}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {formatDate(item.DatUser)}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-100 to-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-black text-sm shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all">
                            {item.LibTiers?.charAt(0) || '?'}
                          </div>
                          <div className="max-w-[160px]">
                            <p className="text-sm font-bold text-slate-800 leading-tight mb-0.5 group-hover:text-blue-700 transition-colors truncate">
                              {item.LibTiers || 'Inconnu'}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Client Prospect</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        {(item?.client?.region?.libelle || item?.client?.MapsRegion || item?.client?.Ville || item?.client?.Gouvernorat || item?.client?.gouvernorat || item.MapsRegion || item.Gouvernorat) ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 uppercase tracking-widest shadow-sm">
                            {item?.client?.region?.libelle || item?.client?.MapsRegion || item?.client?.Ville || item?.client?.Gouvernorat || item?.client?.gouvernorat || item.MapsRegion || item.Gouvernorat}
                          </span>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">
                          {item.TypeFav || 'Standard'}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                         {(item?.client?.tiersCategorieObj?.libelle || item.Categorie) ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 uppercase tracking-widest shadow-sm">
                            {item?.client?.tiersCategorieObj?.libelle || item.Categorie}
                          </span>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="px-8 py-4">
                         {(item?.client?.tiersClasse?.libelle || item.Classe) ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black text-slate-700 bg-white border border-slate-300 uppercase tracking-widest shadow-sm">
                            {item?.client?.tiersClasse?.libelle || item.Classe}
                          </span>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-sm font-black text-slate-900 tabular-nums">
                          {formatCurrency(item.TotTTC)}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <span className={clsx(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border",
                          item.IsConverted ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            item.Valid ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-slate-500 border-slate-200"
                        )}>
                          {item.IsConverted && <CheckCircleIcon className="h-3.5 w-3.5" />}
                          {!item.IsConverted && item.Valid && <SparklesIcon className="h-3.5 w-3.5" />}
                          {item.IsConverted ? "Transformé" : item.Valid ? "Validé" : "Brouillon"}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canEdit && (
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/fav/edit/${item.Guid}`); }}
                              className="p-2.5 text-slate-400 bg-white border border-slate-200 shadow-sm hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 rounded-xl transition-all hover:-translate-y-0.5"
                              title="Modifier"
                            >
                              <PencilSquareIcon className="h-4 w-4 stroke-[2.5]" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/fav/${item.Guid}`); }}
                            className="p-2.5 text-slate-400 bg-white border border-slate-200 shadow-sm hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 rounded-xl transition-all hover:-translate-y-0.5"
                            title="Détails"
                          >
                            <ArrowUpRightIcon className="h-4 w-4 stroke-[2.5]" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {/* Footer - Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-4 bg-slate-50/80 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Affichage {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} sur {totalItems}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-blue-600 transition-colors"
              >
                Précédent
              </button>
              
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNumber = idx + 1;
                  // Show current page, first, last, and immediate neighbors
                  if (pageNumber === 1 || pageNumber === totalPages || (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={clsx(
                          "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors",
                          currentPage === pageNumber 
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                            : "bg-transparent text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                    return <span key={`ellipsis-${pageNumber}`} className="text-slate-400 text-xs">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-blue-600 transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default FavList;

