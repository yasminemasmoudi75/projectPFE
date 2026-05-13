import { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import usePermission from '../../hooks/usePermission';
import axios from '../../app/axios';
import { formatDate, formatCurrency } from '../../utils/format';
import { MODULE_CODES } from '../../utils/constants';
import ReglemPaymentModal from './ReglemPaymentModal';
import ReglemForm from './ReglemForm';
import ReglemDetailModal from './ReglemDetailModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

const ReglemsList = () => {
  const { user } = useAuth();
  const { canCreate } = usePermission(MODULE_CODES.REGLEMENT);
  const [reglements, setReglements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    date: '',
    dateFrom: '',
    dateTo: '',
    codTiers: '',
    codRepres: '',
    page: 1,
    limit: 10,
  });
  const [clients, setClients] = useState([]);
  const [commercials, setCommercials] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [selectedReglement, setSelectedReglement] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [detailReglementId, setDetailReglementId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const toDateOnly = (value) => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadReglements = async (overrideFilters = null) => {
    try {
      setLoading(true);
      const activeFilters = overrideFilters || filters;
      const params = new URLSearchParams({
        search: activeFilters.search,
        status: activeFilters.status,
        page: activeFilters.page,
        limit: activeFilters.limit,
      });

      if (activeFilters.date) params.set('date', activeFilters.date);
      if (activeFilters.dateFrom) params.set('dateFrom', activeFilters.dateFrom);
      if (activeFilters.dateTo) params.set('dateTo', activeFilters.dateTo);
      if (activeFilters.codTiers) params.set('codTiers', activeFilters.codTiers);
      if (activeFilters.codRepres) params.set('codRepres', activeFilters.codRepres);

      const res = await axios.get(`/reglements?${params}`);
      setReglements(res.data.data || res.data);
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 });
    } catch (err) {
      console.error('❌ Error fetching reglements:', err.response?.status, err.message);
      console.error('Response data:', err.response?.data);
      setReglements([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch reglements
  useEffect(() => {
    loadReglements();
  }, [filters]);

  useEffect(() => {
    const loadFilterSources = async () => {
      try {
        const [clientsRes, commercialsRes] = await Promise.all([
          axios.get('/tiers?limit=10000&sort=recent'),
          axios.get('/users/commercials/assignable'),
        ]);

        const clientData = clientsRes?.data?.data || clientsRes?.data || [];
        const commercialData = commercialsRes?.data?.data || commercialsRes?.data || [];

        setClients(Array.isArray(clientData) ? clientData : []);
        setCommercials(Array.isArray(commercialData) ? commercialData : []);
      } catch (err) {
        console.error('Error loading filter sources:', err);
        setClients([]);
        setCommercials([]);
      }
    };

    loadFilterSources();
  }, []);

  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleStatusChange = (e) => {
    setFilters({ ...filters, status: e.target.value, page: 1 });
  };

  const handleDateChange = (e) => {
    setFilters({ ...filters, date: e.target.value, page: 1 });
  };

  const handleDateFromChange = (e) => {
    setFilters({ ...filters, dateFrom: e.target.value, page: 1 });
  };

  const handleDateToChange = (e) => {
    setFilters({ ...filters, dateTo: e.target.value, page: 1 });
  };

  const handleClientFilterChange = (e) => {
    setFilters({ ...filters, codTiers: e.target.value, page: 1 });
  };

  const handleCommercialFilterChange = (e) => {
    setFilters({ ...filters, codRepres: e.target.value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  // Open modal to record payment
  const openPaymentModal = (reglement) => {
    setSelectedReglement(reglement);
    setIsModalOpen(true);
  };

  // Close modal
  const closePaymentModal = () => {
    setIsModalOpen(false);
    setSelectedReglement(null);
  };

  // Open detail modal
  const openDetailModal = (reglement) => {
    setDetailReglementId(reglement.id);
    setIsDetailOpen(true);
  };

  // Close detail modal
  const closeDetailModal = () => {
    setIsDetailOpen(false);
    setDetailReglementId(null);
  };

  // Handle successful payment recording
  const handlePaymentSuccess = (updatedReglement) => {
    // Update the reglement in the list
    setReglements(prevReglements =>
      prevReglements.map(reg =>
        reg.id === updatedReglement.id ? {
          ...reg,
          paidAmount: updatedReglement.paidAmount,
          remainingAmount: updatedReglement.remainingAmount,
          isPayed: updatedReglement.isPayed,
          paymentStatus: updatedReglement.paymentStatus,
          paymentPercentage: updatedReglement.paymentPercentage,
        } : reg
      )
    );

    // Refresh stats
    fetchStats();
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const res = await axios.get('/reglements/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error('❌ Error fetching reglement stats:', err.response?.status, err.message);
      console.error('Response data:', err.response?.data);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Payé':
        return 'bg-green-100 text-green-800';
      case 'Partiellement payé':
        return 'bg-yellow-100 text-yellow-800';
      case 'Presque payé':
        return 'bg-blue-100 text-blue-800';
      case 'Non payé':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12"
    >
      {/* Header Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            Gestion des Réglement
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Suivi des paiements clients et versements
          </p>
        </div>
        <div className="flex gap-3">
          {canCreate && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsFormOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all shadow-md font-medium text-sm"
              title="Créer un réglement"
            >
              <PlusIcon className="h-4 w-4" />
              Créer
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchStats()}
            className="p-3 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 hover:border-blue-300 transition-colors shadow-sm"
            title="Rafraîchir"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Quick Stats Cards */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ staggerChildren: 0.1, delayChildren: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          {/* Card 1: Documents */}
          <motion.div
            whileHover={{ y: -5 }}
            className="card-luxury p-0 overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-6 flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Documents</p>
                <p className="text-3xl font-extrabold text-slate-900">
                  {stats.totalDocuments}
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-12 transition-all">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          </motion.div>

          {/* Card 2: Montant Total */}
          <motion.div
            whileHover={{ y: -5 }}
            className="card-luxury p-0 overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-6 flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total à Recevoir</p>
                <p className="text-2xl font-extrabold text-slate-900">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/30 flex items-center justify-center transform group-hover:scale-110 group-hover:-rotate-12 transition-all">
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 to-pink-600"></div>
          </motion.div>

          {/* Card 3: Montant Payé */}
          <motion.div
            whileHover={{ y: -5 }}
            className="card-luxury p-0 overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-6 flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Déjà Payé</p>
                <p className="text-2xl font-extrabold text-slate-900">
                  {formatCurrency(stats.totalPaid)}
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-12 transition-all">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-600"></div>
          </motion.div>

          {/* Card 4: Montant Restant */}
          <motion.div
            whileHover={{ y: -5 }}
            className="card-luxury p-0 overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-6 flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">À Recevoir</p>
                <p className="text-2xl font-extrabold text-slate-900">
                  {formatCurrency(stats.totalRemaining)}
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 shadow-lg shadow-orange-500/30 flex items-center justify-center transform group-hover:scale-110 group-hover:-rotate-12 transition-all">
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 to-rose-600"></div>
          </motion.div>
        </motion.div>
      )}

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-luxury"
      >
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <MagnifyingGlassIcon className="h-5 w-5 text-blue-600" />
          Filtres & Recherche
        </h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par client ou code..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={filters.search}
              onChange={handleSearchChange}
            />
          </div>
          <select
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            value={filters.status}
            onChange={handleStatusChange}
          >
            <option value="">Tous les statuts</option>
            <option value="Payé">✅ Payé</option>
            <option value="Partiellement payé">🟡 Partiellement payé</option>
            <option value="Presque payé">🟢 Presque payé</option>
            <option value="Non payé">🔴 Non payé</option>
          </select>
          <input
            type="date"
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            value={filters.date}
            onChange={handleDateChange}
            title="Filtrer par date"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <select
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            value={filters.codTiers}
            onChange={handleClientFilterChange}
          >
            <option value="">Tous les clients</option>
            {clients.map((client) => (
              <option key={client.CodTiers || client.id} value={client.CodTiers || client.id}>
                {(client.CodTiers || client.id)} - {(client.LibelleComplet || client.Nom || client.LibTiers || client.Raisoc || client.CodTiers || client.id)}
              </option>
            ))}
          </select>

          <select
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            value={filters.codRepres}
            onChange={handleCommercialFilterChange}
          >
            <option value="">Tous les commerciaux</option>
            {commercials.map((commercial) => (
              <option key={commercial.value || commercial.userId} value={commercial.value || commercial.userId}>
                {commercial.label || commercial.fullName || commercial.login || commercial.value}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            value={filters.dateFrom}
            onChange={handleDateFromChange}
            title="Date début"
          />

          <input
            type="date"
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            value={filters.dateTo}
            onChange={handleDateToChange}
            title="Date fin"
          />
        </div>
      </motion.div>

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card-luxury overflow-hidden"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">📋 Réglement</h2>
          <span className="text-sm font-medium text-slate-500">
            {pagination?.total || 0} document{pagination?.total !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-slate-600 font-medium">⏳ Chargement...</p>
            </div>
          </div>
        ) : !reglements || reglements.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-4xl mb-2">📭</p>
              <p className="text-slate-600 font-medium">Aucun réglement trouvé</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left font-bold text-slate-700">Date</th>
                  <th className="px-6 py-3 text-left font-bold text-slate-700">Client</th>
                  <th className="px-6 py-3 text-right font-bold text-slate-700">Total</th>
                  <th className="px-6 py-3 text-right font-bold text-slate-700">Payé</th>
                  <th className="px-6 py-3 text-right font-bold text-slate-700">Restant</th>
                  <th className="px-6 py-3 text-center font-bold text-slate-700">Progression</th>
                  <th className="px-6 py-3 text-center font-bold text-slate-700">Statut</th>
                  <th className="px-6 py-3 text-center font-bold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {reglements.map((reg) => (
                    <motion.tr
                      key={reg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="border-b border-slate-100 hover:bg-blue-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {formatDate(toDateOnly(reg.date))}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{reg.client}</span>
                          <span className="text-xs text-slate-500">{reg.codTiers}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-slate-900">
                          {formatCurrency(reg.totalAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-emerald-600">
                          {formatCurrency(reg.paidAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-orange-600">
                          {formatCurrency(reg.remainingAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${reg.paymentPercentage}%` }}
                              transition={{ duration: 0.5, type: "spring" }}
                              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                            ></motion.div>
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-10 text-right">
                            {reg.paymentPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeColor(
                            reg.paymentStatus
                          )}`}
                        >
                          {reg.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openDetailModal(reg)}
                            className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-200 transition-colors flex items-center gap-1"
                          >
                            <EyeIcon className="w-4 h-4" />
                            Détails
                          </motion.button>
                          {/* Bouton paiement supprimé */}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card-luxury flex items-center justify-between"
      >
        <p className="text-sm text-slate-600">
          Affichage <span className="font-bold text-slate-900">{((pagination?.page || 1) - 1) * (pagination?.limit || 10) + 1}</span>
          {' à '}
          <span className="font-bold text-slate-900">{Math.min((pagination?.page || 1) * (pagination?.limit || 10), pagination?.total || 0)}</span>
          {' sur '}
          <span className="font-bold text-slate-900">{pagination?.total || 0}</span>
        </p>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={(pagination?.page || 1) === 1}
            onClick={() => handlePageChange((pagination?.page || 1) - 1)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Précédent
          </motion.button>
          {Array.from({ length: pagination?.totalPages || 0 }).map((_, idx) => (
            <motion.button
              key={idx + 1}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePageChange(idx + 1)}
              className={`px-3 py-2 rounded-lg font-semibold transition-all ${(pagination?.page || 1) === idx + 1
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'border border-slate-200 text-slate-700 hover:border-blue-300'
                }`}
            >
              {idx + 1}
            </motion.button>
          ))}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={(pagination?.page || 1) === (pagination?.totalPages || 1)}
            onClick={() => handlePageChange((pagination?.page || 1) + 1)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Suivant →
          </motion.button>
        </div>
      </motion.div>

      {/* Payment Modal */}
      <ReglemPaymentModal
        reglement={selectedReglement}
        isOpen={isModalOpen}
        onClose={closePaymentModal}
        onSuccess={handlePaymentSuccess}
      />

      {/* Create Reglement Form */}
      <ReglemForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={(newReglement) => {
          setIsFormOpen(false);
          setSelectedReglement(null);
          setIsModalOpen(false);

          // Make the new record visible immediately, then sync with backend.
          if (newReglement?.id) {
            setReglements((prev) => {
              if (prev.some((reg) => reg.id === newReglement.id)) return prev;
              return [newReglement, ...prev];
            });
          }

          setFilters((prev) => ({ ...prev, page: 1 }));
          loadReglements({ ...filters, page: 1 });
          fetchStats();
        }}
      />

      {/* Detail Modal */}
      <ReglemDetailModal
        isOpen={isDetailOpen}
        onClose={closeDetailModal}
        reglementId={detailReglementId}
      />
    </motion.div>
  );
};

export default ReglemsList;
