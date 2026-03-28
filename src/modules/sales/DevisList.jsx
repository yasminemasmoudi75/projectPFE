import { useEffect, useState } from 'react';
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
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { fetchDevis } from './devisSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';
import clsx from 'clsx';

const DevisList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { devis, loading, pagination } = useSelector((state) => state.devis);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: 'all', // all, draft, valid, converted
    minAmount: '',
    maxAmount: '',
    minProbability: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);

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
      dateTo: ''
    });
  };

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(v => v !== 'all' && v !== '').length;

  // Apply filters to devis list
  const filteredDevis = devis?.filter(item => {
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

    return true;
  }) || [];

  const refreshData = () => {
    dispatch(fetchDevis({ page: 1, limit: 10 }));
  };

  useEffect(() => {
    refreshData();
  }, [dispatch]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-primary">
              <SparklesIcon className="h-3 w-3 mr-1" />
              Ventes & Offres
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Registre des Devis</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Pilotez le cycle de vie de vos propositions commerciales.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshData}
            className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-all shadow-soft"
            title="Rafraîchir"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate('/devis/new')}
            className="btn-soft-primary flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4 stroke-[3]" />
            Nouvelle Proposition
          </button>
        </div>
      </div>

      {/* Quick Stats Overlay (Optional but nice for consistency) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-luxury p-0 overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Encours Devis</p>
              <p className="text-2xl font-extrabold text-slate-800">12,5k <span className="text-xs text-slate-400 font-bold">TND</span></p>
            </div>
            <div className="icon-shape bg-gradient-blue shadow-glow-blue">
              <DocumentTextIcon className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="h-1 bg-gradient-blue"></div>
        </div>
        <div className="card-luxury p-0 overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Taux Conversion</p>
              <p className="text-2xl font-extrabold text-slate-800">32% <span className="text-xs text-emerald-500 font-bold">+5%</span></p>
            </div>
            <div className="icon-shape bg-gradient-success shadow-glow-emerald">
              <ArrowTrendingUpIcon className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="h-1 bg-gradient-success"></div>
        </div>

      </div>

      {/* Filters Card */}
      <div className="card-luxury p-0 overflow-hidden">
        {/* Main Filter Bar */}
        <div className="p-6 flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher par N° de pièce, client..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="input-modern pl-11"
            />
          </div>

          {/* Quick Status Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFilterChange('status', 'all')}
              className={clsx(
                "px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                filters.status === 'all'
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-blue-300 hover:text-blue-600"
              )}
            >
              Tous
            </button>
            <button
              onClick={() => handleFilterChange('status', 'draft')}
              className={clsx(
                "px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                filters.status === 'draft'
                  ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-blue-300 hover:text-blue-600"
              )}
            >
              Brouillon
            </button>
            <button
              onClick={() => handleFilterChange('status', 'valid')}
              className={clsx(
                "px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                filters.status === 'valid'
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-blue-300 hover:text-blue-600"
              )}
            >
              Validés
            </button>
            <button
              onClick={() => handleFilterChange('status', 'converted')}
              className={clsx(
                "px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                filters.status === 'converted'
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-blue-300 hover:text-blue-600"
              )}
            >
              Transformés
            </button>
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              "px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
              showFilters
                ? "bg-slate-800 text-white border border-slate-700"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            )}
          >
            <FunnelIcon className="h-4 w-4" />
            Filtres
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Advanced Filters Section */}
        {showFilters && (
          <div className="border-t border-slate-100 bg-slate-50/50 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Min Amount */}
              <div className="group">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                  <CurrencyDollarIcon className="h-3 w-3" />
                  Montant Min
                </label>
                <input
                  type="number" min="0"
                  placeholder="Min..."
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  className="input-modern w-full text-sm"
                />
              </div>

              {/* Max Amount */}
              <div className="group">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                  <CurrencyDollarIcon className="h-3 w-3" />
                  Montant Max
                </label>
                <input
                  type="number" min="0"
                  placeholder="Max..."
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  className="input-modern w-full text-sm"
                />
              </div>

              {/* Date From */}
              <div className="group">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  Du
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="input-modern w-full text-sm"
                />
              </div>

              {/* Date To */}
              <div className="group">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  Au
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="input-modern w-full text-sm"
                />
              </div>


            </div>

            {/* Filter Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <XMarkIcon className="h-4 w-4" />
                Réinitialiser
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all"
              >
                Appliquer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="card-luxury p-0 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-transparent flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Liste des Propositions Commerciales</h3>
          <span className="text-xs font-medium text-slate-500">
            {filteredDevis?.length || 0}
            {devis?.length !== filteredDevis?.length && ` sur ${devis?.length || 0}`} documents
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/30 text-left border-b border-slate-100/50">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Document</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Client</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Région</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Classe</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Domaine</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Montant TTC</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {(!filteredDevis || filteredDevis.length === 0) ? (
                <tr>
                  <td colSpan="10" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                        <DocumentTextIcon className="h-8 w-8" />
                      </div>
                      <p className="text-slate-500 font-medium">
                        {devis && devis.length > 0 ? 'Aucun devis ne correspond aux filtres' : 'Aucun devis trouvé'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDevis.map((item, i) => (
                  <tr
                    key={i}
                    className="group hover:bg-blue-50/30 transition-all cursor-pointer"
                    onClick={() => navigate(`/devis/${item.Guid}`)}
                  >
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-blue-600 font-mono tracking-tight">{item.Prfx}{item.Nf}</span>
                        <span className="text-[10px] font-medium text-slate-400 uppercase">{formatDate(item.DatUser)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-blue flex items-center justify-center text-white font-bold text-xs shadow-sm group-hover:scale-110 transition-transform">
                          {item.LibTiers?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 leading-none mb-1 group-hover:text-blue-600 transition-colors uppercase truncate max-w-[150px]">{item.LibTiers}</p>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">Client Tiers</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-bold text-amber-700 bg-amber-100 uppercase tracking-wider">
                        {item.MapsRegion || item.Gouvernorat || '-'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-medium text-slate-700">{item.TypeDevis || 'Non renseigné'}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-bold text-blue-700 bg-blue-100 uppercase tracking-wider">
                        {item.Categorie || '-'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-600 bg-slate-100 uppercase tracking-wider">
                        {item.Classe || '-'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-medium text-slate-700">{item.Domaine || 'Non renseigné'}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-extrabold text-slate-800">{formatCurrency(item.TotTTC)}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={clsx(
                        "inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider",
                        item.IsConverted ? "bg-emerald-100 text-emerald-700" :
                          item.Valid ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                      )}>
                        {item.IsConverted ? "Transformé" : item.Valid ? "Validé" : "Brouillon"}
                      </span>
                    </td>

                    <td className="px-8 py-5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/devis/edit/${item.Guid}`); }}
                          className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-100 rounded-xl transition-all"
                          title="Modifier"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/devis/${item.Guid}`); }}
                          className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                          title="Détails"
                        >
                          <ArrowUpRightIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100/50 text-xs font-medium text-slate-500 flex justify-between items-center">
          <span>Performance CRM active</span>
          <span className="text-slate-400">NexuxCRM Suite v1.2</span>
        </div>
      </div>
    </div>
  );
};

export default DevisList;
