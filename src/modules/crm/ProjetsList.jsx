import { useState, useEffect, useMemo } from 'react';
import {
  PlusIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  ChartBarIcon,
  BriefcaseIcon,
  SparklesIcon,
  ArrowPathIcon,
  RocketLaunchIcon,
  ArrowUpRightIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjets } from './projetSlice';
import axios from '../../app/axios';

const MOCK_PROJETS = [
  {
    id: 1,
    name: 'Mise à jour Infrastructure SI',
    client: 'Société ABC',
    budget: 45000,
    progress: 75,
    deadline: '2024-03-20',
    status: 'En cours',
    priority: 'Haute',
    phase: 'Exécution',
    avatar: 'IS'
  },
  {
    id: 2,
    name: 'Déploiement CRM Mobile',
    client: 'Tech Solutions',
    budget: 12000,
    progress: 15,
    deadline: '2024-05-15',
    status: 'En cours',
    priority: 'Moyenne',
    phase: 'Prospection',
    avatar: 'CR'
  },
  {
    id: 3,
    name: 'Maintenance Serveurs Annuelle',
    client: 'Global Import',
    budget: 8500,
    progress: 100,
    deadline: '2024-01-30',
    status: 'Terminé',
    priority: 'Basse',
    phase: 'Clôture',
    avatar: 'MS'
  },
];

const ProjetsList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { projets, loading, pagination } = useSelector((state) => state.projets);
  const [typeFilter, setTypeFilter] = useState('All');
  const [commerciaux, setCommerciaux] = useState([]);
  const [selectedCommercial, setSelectedCommercial] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tiersById, setTiersById] = useState({});

  const getProgressColor = (percentage) => {
    if (percentage < 30) return '#ef4444'; // Red
    if (percentage < 70) return '#f97316'; // Orange
    return '#f59e0b'; // Amber
  };

  useEffect(() => {
    dispatch(fetchProjets({ page: 1, limit: 12 }));
  }, [dispatch]);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const response = await axios.get('/tiers');
        const data = response.data?.data || response.data || [];
        const map = {};
        data.forEach((t) => {
          if (t.IDTiers) map[t.IDTiers] = t;
        });
        setTiersById(map);

        const reps = Array.from(
          new Set(
            data
              .map((t) => t.codRepresTiers)
              .filter((v) => v && String(v).trim() !== '')
          )
        );
        setCommerciaux(reps);
      } catch (error) {
        console.error('Error fetching tiers for projets filters:', error);
      }
    };

    fetchTiers();
  }, []);

  const availableTypes = useMemo(() => {
    const phases = projets.map((p) => p.Phase).filter(Boolean);
    return Array.from(new Set(phases));
  }, [projets]);

  const filteredProjets = useMemo(() => {
    return projets.filter((projet) => {
      const matchesType =
        typeFilter === 'All' ||
        (projet.Phase || '').toLowerCase() === typeFilter.toLowerCase();

      const tiers = tiersById[projet.IDTiers] || projet.client;
      const repCode = tiers?.codRepresTiers;
      const matchesCommercial =
        !selectedCommercial || repCode === selectedCommercial;

      const createdDate = projet.Date_Creation
        ? new Date(projet.Date_Creation)
        : null;
      const fromOk =
        !dateFrom || (createdDate && createdDate >= new Date(dateFrom));
      const toOk =
        !dateTo || (createdDate && createdDate <= new Date(dateTo));

      return matchesType && matchesCommercial && fromOk && toOk;
    });
  }, [projets, typeFilter, selectedCommercial, dateFrom, dateTo, tiersById]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-primary">
              <BriefcaseIcon className="h-3 w-3 mr-1" />
              Opérations CRM
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Projets & Opportunités</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Suivez l'avancement, les budgets et les échéances de vos chantiers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(fetchProjets({ page: 1, limit: 12 }))}
            className="h-10 w-10 flex items-center justify-center bg-white text-slate-400 hover:text-blue-600 rounded-xl shadow-soft hover:shadow-glow-blue transition-all border border-slate-200"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate('/projets/new')}
            className="btn-soft-primary flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4 stroke-[3]" />
            Nouveau Projet
          </button>
        </div>
      </div>

      {/* Filters: Type, Commercial, Date */}
      <div className="card-luxury p-0 overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
              Filtres Projets
            </h3>
            <button
              type="button"
              onClick={() => {
                setTypeFilter('All');
                setSelectedCommercial('');
                setDateFrom('');
                setDateTo('');
              }}
              className="text-[11px] font-semibold text-slate-400 hover:text-blue-600 flex items-center gap-1"
            >
              Réinitialiser
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-widest">
                Type / Phase
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input-modern h-9 text-xs w-full"
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
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-widest">
                Commercial
              </label>
              <select
                value={selectedCommercial}
                onChange={(e) => setSelectedCommercial(e.target.value)}
                className="input-modern h-9 text-xs w-full"
              >
                <option value="">Tous les commerciaux</option>
                {commerciaux.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-widest">
                Créé après
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input-modern h-9 text-xs w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-widest">
                Créé avant
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input-modern h-9 text-xs w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout for Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
      </div>
    </div>
  );
};

export default ProjetsList;
