import { useState, useEffect, useMemo } from 'react';
import {
  PlusIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  BriefcaseIcon,
  ArrowPathIcon,
  RocketLaunchIcon,
  ArrowUpRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjets } from './projetSlice';
import usePermission from '../../hooks/usePermission';
import { MODULE_CODES } from '../../utils/constants';
import axios from '../../app/axios';

const ProjetsList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { canCreate } = usePermission(MODULE_CODES.PROJETS);
  const { projets, loading, pagination } = useSelector((state) => state.projets);
  const [typeFilter, setTypeFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [commerciaux, setCommerciaux] = useState([]);
  const [selectedCommercial, setSelectedCommercial] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const getProgressColor = (percentage) => {
    if (percentage < 30) return '#ef4444'; // Red
    if (percentage < 70) return '#f97316'; // Orange
    return '#f59e0b'; // Amber
  };

  useEffect(() => {
    dispatch(fetchProjets({ page: 1, limit: 12 }));
  }, [dispatch]);

  useEffect(() => {
    const fetchCommerciaux = async () => {
      try {
        const response = await axios.get('/users/commercials/projets-filter');
        const data = response.data;
        const rawList = Array.isArray(data) ? data : data.data || [];
        // Map to { value (UserID string), label (FullName) }
        setCommerciaux(rawList.map(c => ({
          value: String(c.userId || c.value || c.UserID),
          label: c.fullName || c.label || c.login || `Commercial ${c.userId}`
        })));
      } catch (error) {
        console.error('Error fetching commercials:', error);
        // Fallback: extract from loaded projects
        const reps = Array.from(
          new Set(
            projets
              .map((p) => p.client?.codRepresTiers)
              .filter((v) => v && String(v).trim() !== '')
          )
        );
        setCommerciaux(reps.map(code => ({ value: code, label: code })));
      }
    };
    fetchCommerciaux();
  }, []);

  const availableTypes = useMemo(() => {
    const phases = projets.map((p) => p.Phase).filter(Boolean);
    return Array.from(new Set(phases));
  }, [projets]);

  const filteredProjets = useMemo(() => {
    return projets.filter((projet) => {
      const searchValue = search.trim().toLowerCase();

      const tiers = projet.client;
      const clientName = (tiers?.Raisoc || 'Client non spécifié').toLowerCase();

      const matchesSearch =
        !searchValue ||
        (projet.Nom_Projet || '').toLowerCase().includes(searchValue) ||
        clientName.includes(searchValue) ||
        String(projet.ID_Projet || '').toLowerCase().includes(searchValue);

      const matchesType =
        typeFilter === 'All' ||
        (projet.Phase || '').toLowerCase() === typeFilter.toLowerCase();

      const repCode = tiers?.codRepresTiers;
      const matchesCommercial =
        !selectedCommercial || String(repCode || '') === selectedCommercial;

      const createdDate = projet.Date_Creation
        ? new Date(projet.Date_Creation)
        : null;
      const fromOk =
        !dateFrom || (createdDate && createdDate >= new Date(dateFrom));
      const toOk =
        !dateTo || (createdDate && createdDate <= new Date(dateTo));

      return matchesSearch && matchesType && matchesCommercial && fromOk && toOk;
    });
  }, [projets, typeFilter, selectedCommercial, dateFrom, dateTo, search]);

  const stats = useMemo(() => {
    const total = filteredProjets.length;
    const totalBudget = filteredProjets.reduce((acc, p) => acc + (Number(p.Budget_Alloue) || 0), 0);
    const avgProgress = total > 0
      ? Math.round(filteredProjets.reduce((acc, p) => acc + (Number(p.Avancement) || 0), 0) / total)
      : 0;
    const dueSoon = filteredProjets.filter((p) => {
      if (!p.Date_Echeance) return false;
      const due = new Date(p.Date_Echeance);
      if (Number.isNaN(due.getTime())) return false;
      const diffDays = (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 14;
    }).length;

    return { total, totalBudget, avgProgress, dueSoon };
  }, [filteredProjets]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* Header - Inspired Design */}
      <div className="card-luxury p-8 bg-gradient-to-r from-sky-50 via-white to-violet-50 border-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-600 text-xs font-medium mb-3">
              <BriefcaseIcon className="h-3 w-3" />
              Opérations CRM
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Projets & Opportunités
            </h1>
            <p className="text-slate-600 mt-1 text-sm">
              Suivez l'avancement, les budgets et les échéances de vos chantiers.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => dispatch(fetchProjets({ page: 1, limit: 12 }))}
              className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all"
              title="Rafraîchir"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            {canCreate && (
              <button
                onClick={() => navigate('/projets/new')}
                className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl shadow-md shadow-sky-200/50 transition-all flex items-center gap-2 font-medium"
              >
                <PlusIcon className="h-4 w-4" />
                Nouveau Projet
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats - Inspired Design */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Projets', value: stats.total, sub: 'projets visibles', icon: BriefcaseIcon, color: 'sky' },
          { label: 'Budget Total', value: formatCurrency(stats.totalBudget), sub: 'total alloué', icon: CurrencyDollarIcon, color: 'emerald' },
          { label: 'Avancement', value: `${stats.avgProgress}%`, sub: 'moyenne', icon: ChartBarIcon, color: 'amber' },
          { label: 'Échéances', value: stats.dueSoon, sub: 'dans 14 jours', icon: CalendarDaysIcon, color: 'violet' },
        ].map((stat, i) => {
          const colorMap = {
            sky: { bg: 'bg-sky-50', text: 'text-sky-500', bar: 'bg-sky-400' },
            emerald: { bg: 'bg-emerald-50', text: 'text-emerald-500', bar: 'bg-emerald-400' },
            amber: { bg: 'bg-amber-50', text: 'text-amber-500', bar: 'bg-amber-400' },
            violet: { bg: 'bg-violet-50', text: 'text-violet-500', bar: 'bg-violet-400' },
          };
          const colors = colorMap[stat.color];

          return (
            <div
              key={i}
              className="card-luxury shadow-sm border border-slate-200 hover:shadow-md transition-shadow group"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
                      {stat.label}
                    </p>
                    <h3 className="text-2xl font-bold text-slate-800">
                      {stat.value}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
                  </div>
                  <div className={`${colors.bg} p-2.5 rounded-xl group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`h-5 w-5 ${colors.text}`} />
                  </div>
                </div>
                <div className={`h-1 ${colors.bar} mt-4 rounded-full`}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search + Filters - Inspired Design */}
      <div className="card-luxury shadow-sm">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col xl:flex-row gap-3 xl:items-center xl:justify-between">
            <div className="relative flex-1 w-full">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par projet, client, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className={`px-5 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap border ${
                  showFilters
                    ? 'bg-sky-50 border-sky-200 text-sky-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FunnelIcon className="h-4 w-4" />
                Filtres
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setTypeFilter('All');
                  setSelectedCommercial('');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap border bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                title="Réinitialiser"
              >
                <XMarkIcon className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="pt-4 border-t border-slate-200 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                    Phase
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                  >
                    <option value="All">Toutes les phases</option>
                    {availableTypes.map((phase) => (
                      <option key={phase} value={phase}>
                        {phase}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                    Commercial
                  </label>
                  <select
                    value={selectedCommercial}
                    onChange={(e) => setSelectedCommercial(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                  >
                    <option value="">Tous les commerciaux</option>
                    {commerciaux.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                    Créé après
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                    Créé avant
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid Layout for Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjets.length === 0 && (
          <div className="card-luxury p-10 md:col-span-2 lg:col-span-3 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300">
              <RocketLaunchIcon className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-extrabold text-slate-800">Aucun projet trouvé</h3>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              Modifie ta recherche ou tes filtres, ou crée un nouveau projet.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setSearch('');
                  setTypeFilter('All');
                  setSelectedCommercial('');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-bold text-xs shadow-sm"
              >
                Réinitialiser
              </button>
              {canCreate && (
                <button
                  onClick={() => navigate('/projets/new')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-xs shadow-sm"
                >
                  + Nouveau projet
                </button>
              )}
            </div>
          </div>
        )}

        {filteredProjets.map((projet) => (
          <div key={projet.ID_Projet} className="card-luxury p-0 overflow-hidden flex flex-col h-full group">
            <div className="p-8 flex-1">
              <div className="flex justify-between items-start mb-6">
                <div className="h-14 w-14 rounded-2xl bg-gradient-blue flex items-center justify-center text-white font-extrabold text-lg shadow-glow-blue group-hover:scale-110 transition-transform">
                  {projet.Nom_Projet?.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ${projet.Phase === 'Clôture' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                    {projet.Phase || 'Nouveau'}
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl ${projet.Priorite === 'Haute' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                    {projet.Priorite || 'Normale'}
                  </span>
                </div>
              </div>

              <Link to={`/projets/${projet.ID_Projet}`} className="block">
                <h3 className="text-xl font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors mb-2 leading-tight">
                  {projet.Nom_Projet}
                </h3>
              </Link>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-6">
                <MapPinIcon className="h-4 w-4 text-blue-500" />
                {projet.client?.Raisoc || 'Client non spécifié'}
              </div>

              <div className="flex flex-col items-center justify-center py-6 gap-4">
                <div className="relative h-28 w-28 drop-shadow-sm">
                  <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
                    <path
                      className="stroke-slate-100/80 stroke-[2.5]"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="stroke-[3] transition-all duration-1000 ease-out"
                      fill="none"
                      stroke={getProgressColor(projet.Avancement || 0)}
                      strokeDasharray={`${projet.Avancement || 0}, 100`}
                      strokeLinecap="round"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-slate-800 tracking-tighter">{projet.Avancement || 0}%</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest -mt-1">Avancement</span>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                  {projet.Avancement < 30 ? 'Initialisation' : projet.Avancement < 70 ? 'En cours' : 'Phase finale'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-100/50 mt-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Budget Prévu</span>
                  <span className="text-sm font-black text-slate-800">{formatCurrency(projet.Budget_Alloue || 0)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Délai Final</span>
                  <span className="text-sm font-black text-slate-800">{projet.Date_Echeance ? formatDate(projet.Date_Echeance) : 'Non définie'}</span>
                </div>
              </div>
            </div>

            <div className="px-8 py-4 bg-slate-50/50 flex justify-between items-center text-xs font-bold border-t border-slate-100/50">
              <span className="flex items-center gap-2 text-slate-500 uppercase tracking-tighter">
                <ChartBarIcon className="h-4 w-4 text-blue-500" />
                Phase: <span className="text-slate-800">{projet.Phase || 'N/A'}</span>
              </span>
              <button
                onClick={() => navigate(`/projets/${projet.ID_Projet}`)}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-all group/btn"
              >
                Visionner
                <ArrowUpRightIcon className="h-4 w-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ))}

        {/* Create New Project Card Placeholder */}
        {canCreate && (
          <button
            onClick={() => navigate('/projets/new')}
            className="card-luxury p-8 border-2 border-dashed border-slate-200 bg-slate-50/30 flex flex-col items-center justify-center text-center gap-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
          >
            <div className="h-16 w-16 bg-white rounded-2xl shadow-soft flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:scale-110 transition-all">
              <PlusIcon className="h-8 w-8 stroke-[3]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Lancer un chantier</h4>
              <p className="text-xs text-slate-400 mt-1 font-medium">Créer un nouveau suivi projet</p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjetsList;
