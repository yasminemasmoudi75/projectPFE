import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  ChatBubbleLeftEllipsisIcon,
  PhoneIcon,
  UserGroupIcon,
  BriefcaseIcon,
  ClockIcon,
  MapPinIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  AdjustmentsHorizontalIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  TagIcon,
  ArrowPathIcon,
  XMarkIcon,
  SparklesIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { fetchActivites, createActivite, validateActivite } from './activiteSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import axios from '../../app/axios';
import usePermission from '../../hooks/usePermission';
import { MODULE_CODES } from '../../utils/constants';

const extractArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const ActivitesList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { canCreate } = usePermission(MODULE_CODES.VISITES);
  const { activites, loading } = useSelector((state) => state.activites);
  const { user } = useSelector((state) => state.auth);

  const [filterType, setFilterType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tiers, setTiers] = useState([]);
  const [selectedTier, setSelectedTier] = useState('');
  const [projets, setProjets] = useState([]);
  const [selectedProjet, setSelectedProjet] = useState('');
  const [commerciaux, setCommerciaux] = useState([]);
  const [selectedCommercial, setSelectedCommercial] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Form state for new activity
  const [newActivity, setNewActivity] = useState({
    Type_Activite: 'Appel',
    Description: '',
    Date_Activite: new Date().toISOString().slice(0, 16),
    Statut: 'Planifié',
    IDTiers: '',
    ID_Projet: ''
  });

  useEffect(() => {
    dispatch(fetchActivites({ page: 1, limit: 50, filters: { valide: 1 } }));
  }, [dispatch]);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const response = await axios.get('/tiers');
        setTiers(extractArrayPayload(response));
      } catch (error) {
        console.error('Error fetching tiers for activities:', error);
      }
    };

    fetchTiers();
  }, []);

  useEffect(() => {
    const fetchProjets = async () => {
      try {
        const response = await axios.get('/projets', { params: { page: 1, limit: 100 } });
        setProjets(extractArrayPayload(response));
      } catch (error) {
        console.error('Error fetching projets for activities:', error);
      }
    };

    fetchProjets();
  }, []);

  useEffect(() => {
    const fetchCommerciaux = async () => {
      try {
        const response = await axios.get('/users/commercials/activites-filter');
        const rawData = extractArrayPayload(response);

        // Map backend response shape to { UserID, FullName, LoginName }
        const mapped = rawData.map(c => ({
          UserID: c.userId || c.UserID,
          FullName: c.fullName || c.FullName || c.label,
          LoginName: c.login || c.LoginName
        }));

        const sortedActifs = mapped
          .sort((a, b) =>
            (a.FullName || a.LoginName || '')
              .toString()
              .localeCompare(
                (b.FullName || b.LoginName || '').toString(),
                'fr',
                { sensitivity: 'base' }
              )
          );

        setCommerciaux(sortedActifs);
      } catch (error) {
        console.error('Error fetching commercials for activities:', error);
      }
    };

    fetchCommerciaux();
  }, []);

  const getActivityIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'appel': return <PhoneIcon className="h-5 w-5" />;
      case 'réunion': return <UserGroupIcon className="h-5 w-5" />;
      case 'visite': return <MapPinIcon className="h-5 w-5" />;
      case 'email': return <EnvelopeIcon className="h-5 w-5" />;
      case 'devis': return <BriefcaseIcon className="h-5 w-5" />;
      case 'note': return <DocumentTextIcon className="h-5 w-5" />;
      default: return <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'appel': return 'bg-blue-100 text-blue-700';
      case 'réunion': return 'bg-purple-100 text-purple-700';
      case 'visite': return 'bg-green-100 text-green-700';
      case 'email': return 'bg-cyan-100 text-cyan-700';
      case 'note': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'Terminé': return 'bg-green-100 text-green-700';
      case 'Planifié': return 'bg-yellow-100 text-yellow-700';
      case 'En cours': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createActivite(newActivity)).unwrap();
      toast.success('Activité ajoutée au journal');
      setIsAddModalOpen(false);
      setNewActivity({
        Type_Activite: 'Appel',
        Description: '',
        Date_Activite: new Date().toISOString().slice(0, 16),
        Statut: 'Planifié',
        IDTiers: '',
        ID_Projet: ''
      });
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const filteredProjetsForFilters = useMemo(() => {
    if (!selectedTier) return projets;

    return projets.filter(
      (p) => p.IDTiers === selectedTier || p.client?.IDTiers === selectedTier
    );
  }, [projets, selectedTier]);

  const filteredActivites = useMemo(() => {
    return activites.filter(a => {
      const matchesValidated = Number(a.Valide) === 1;
      const matchesType = filterType === 'All' || a.Type_Activite?.toLowerCase() === filterType.toLowerCase();
      const matchesSearch = (a.Description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (a.Type_Activite?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesClient = !selectedTier || a.IDTiers === selectedTier;
      const matchesProjet = !selectedProjet || a.ID_Projet === selectedProjet;
      const matchesCommercial = !selectedCommercial || String(a.utilisateur?.UserID) === selectedCommercial;
      const activiteDate = a.Date_Activite ? new Date(a.Date_Activite) : null;
      const fromOk = !dateFrom || (activiteDate && activiteDate >= new Date(dateFrom));
      const toOk = !dateTo || (activiteDate && activiteDate <= new Date(dateTo));

      return matchesValidated && matchesType && matchesSearch && matchesClient && matchesProjet && matchesCommercial && fromOk && toOk;
    });
  }, [activites, filterType, searchTerm, selectedTier, selectedProjet, selectedCommercial, dateFrom, dateTo]);

  const activityStats = useMemo(() => {
    const total = filteredActivites.length;
    let done = 0;
    let planned = 0;
    let inProgress = 0;

    filteredActivites.forEach((a) => {
      if (a.Statut === 'Terminé') done += 1;
      if (a.Statut === 'Planifié') planned += 1;
      if (a.Statut === 'En cours') inProgress += 1;
    });

    return { total, done, planned, inProgress };
  }, [filteredActivites]);

  if (loading) return <LoadingSpinner />;

  const refreshActivites = async () => {
    try {
      setRefreshing(true);
      await dispatch(fetchActivites({ page: 1, limit: 50, filters: { valide: 1 } }));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* Header - Inspired Design */}
      <div className="card-luxury p-8 bg-gradient-to-r from-sky-50 via-white to-violet-50 border-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-600 text-xs font-medium mb-3">
              <SparklesIcon className="h-3 w-3" />
              Journal CRM
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Journal d'Activités
            </h1>
            <p className="text-slate-600 mt-1 flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-sky-500" />
              Historique des interactions clients
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshActivites}
              className={`p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all ${refreshing ? 'animate-spin' : ''}`}
              title="Rafraîchir"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
            {canCreate && (
              <button
                onClick={() => navigate('/activites/new')}
                className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl shadow-md shadow-sky-200/50 transition-all flex items-center gap-2 font-medium"
              >
                <PlusIcon className="h-4 w-4" />
                Nouvelle Activité
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters Card - Inspired Design */}
      <div className="card-luxury shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/50 py-4 px-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Filtres & Segmentation
            </h3>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <FunnelIcon className="h-3 w-3" />
              Vue filtrée en temps réel
            </span>
          </div>
        </div>
        <div className="p-6">
          {/* Channel Filters */}
          <div className="mb-6">
            <h4 className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">
              Canal
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Tous', icon: AdjustmentsHorizontalIcon, type: 'All' },
                { name: 'Appels', icon: PhoneIcon, type: 'Appel' },
                { name: 'Emails', icon: EnvelopeIcon, type: 'Email' },
                { name: 'Réunions', icon: UserGroupIcon, type: 'Réunion' },
                { name: 'Visites', icon: MapPinIcon, type: 'Visite' },
                { name: 'Notes', icon: DocumentTextIcon, type: 'Note' }
              ].map(item => (
                <button
                  key={item.type}
                  onClick={() => setFilterType(item.type)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
                    filterType === item.type
                      ? 'bg-sky-50 border-sky-200 text-sky-600 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                Client
              </label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
              >
                <option value="">Tous les clients</option>
                {tiers.map(t => (
                  <option key={t.IDTiers} value={t.IDTiers}>
                    {t.Raisoc || t.NomTiers || t.IDTiers}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                Projet
              </label>
              <select
                value={selectedProjet}
                onChange={(e) => setSelectedProjet(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
              >
                <option value="">Tous les projets</option>
                {filteredProjetsForFilters.map(p => (
                  <option key={p.ID_Projet} value={p.ID_Projet}>
                    {p.Nom_Projet || p.Code_Pro || p.ID_Projet}
                  </option>
                ))}
              </select>
            </div>

            {/* Commercial filter - Hidden for commercial users, visible for admin/agents */}
            {!['commercial', 'commerciale'].includes(String(user?.UserRole || '').toLowerCase()) && (
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                  Commercial
                </label>
                <select
                  value={selectedCommercial}
                  onChange={(e) => setSelectedCommercial(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                >
                  <option value="">Tous les commerciaux</option>
                  {commerciaux.map(c => (
                    <option key={c.UserID} value={String(c.UserID)}>
                      {c.FullName || c.LoginName || `User #${c.UserID}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                Période
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                  placeholder="Du"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                  placeholder="Au"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Stats Cards - Inspired Design */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Activités', value: activityStats.total, icon: ChatBubbleLeftEllipsisIcon, color: 'sky' },
            { label: 'Terminées', value: activityStats.done, icon: CheckCircleIcon, color: 'emerald' },
            { label: 'Planifiées', value: activityStats.planned, icon: CalendarIcon, color: 'amber' },
            { label: 'En cours', value: activityStats.inProgress, icon: ArrowPathIcon, color: 'violet' },
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

        {/* Search Bar - Inspired Design */}
        <div className="card-luxury shadow-sm">
          <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                filterType === 'All'
                  ? 'bg-slate-100 text-slate-500'
                  : `${getTypeColor(filterType).replace('text-', 'bg-').replace('600', '50')} ${getTypeColor(filterType)}`
              }`}>
                {filterType === 'All' ? (
                  <AdjustmentsHorizontalIcon className="h-5 w-5" />
                ) : (
                  getActivityIcon(filterType)
                )}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Journal {filterType === 'All' ? 'Omnicanal' : filterType}
                </h2>
                <p className="text-xs text-slate-500">
                  {filteredActivites.length} interaction(s)
                </p>
              </div>
            </div>
            <div className="relative w-full sm:w-80">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher dans les notes, les types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card-luxury p-0 overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-transparent flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Flux d'activités</h3>
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              Triées par date d'interaction
            </span>
          </div>
          <div className="p-6 space-y-4">
            {filteredActivites.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-3xl px-8 py-16 text-center bg-slate-50/40">
                <ArrowPathIcon className="h-10 w-10 mx-auto text-slate-300 mb-4" />
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">Aucune activité</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ajustez vos filtres ou enregistrez une nouvelle interaction commerciale.
                </p>
              </div>
            ) : (
              filteredActivites.map((activite) => (
                <div key={activite.ID_Activite} className="group border border-slate-200 rounded-xl bg-white px-6 py-5 hover:border-blue-300 hover:shadow-lg transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${getTypeColor(activite.Type_Activite)} group-hover:scale-110 transition-transform`}>
                      {getActivityIcon(activite.Type_Activite)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-base font-bold text-slate-800">
                          {activite.Type_Activite}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusColor(activite.Statut)}`}>
                          {activite.Statut}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3 leading-relaxed">{activite.Description || 'Aucune description'}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <ClockIcon className="h-4 w-4 text-slate-400" />
                          {new Date(activite.Date_Activite).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CalendarIcon className="h-4 w-4 text-slate-400" />
                          {new Date(activite.Date_Activite).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <UserIcon className="h-4 w-4 text-slate-400" />
                          {activite.utilisateur?.FullName || 'Collaborateur'}
                        </span>
                        {activite.tier && (
                          <span className="flex items-center gap-1.5">
                            <BuildingOfficeIcon className="h-4 w-4 text-slate-400" />
                            {activite.tier.Raisoc || activite.tier.NomTiers || 'Client'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:self-center">
                      {Number(activite.Valide) !== 1 && (
                        <button
                          onClick={async () => {
                            try {
                              await dispatch(validateActivite(activite.ID_Activite)).unwrap();
                              toast.success('Activité validée');
                              dispatch(fetchActivites({ page: 1, limit: 50, filters: { valide: 1 } }));
                            } catch {
                              toast.error('Erreur lors de la validation');
                            }
                          }}
                          className="px-4 py-2 text-xs font-bold text-emerald-700 hover:text-white hover:bg-emerald-600 rounded-lg border border-emerald-200 transition-all"
                        >
                          Valider
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/activites/${activite.ID_Activite}`)}
                        className="px-4 py-2 text-xs font-bold text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg border border-blue-200 transition-all"
                      >
                        Voir détails
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal - New Activity */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Nouvelle activité</h2>
                <p className="text-xs text-slate-500 mt-0.5">Enregistrer une interaction client</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Canal</label>
                  <select
                    value={newActivity.Type_Activite}
                    onChange={(e) => setNewActivity({ ...newActivity, Type_Activite: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                  >
                    <option>Appel</option>
                    <option>Email</option>
                    <option>Visite</option>
                    <option>Réunion</option>
                    <option>Note</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Statut</label>
                  <select
                    value={newActivity.Statut}
                    onChange={(e) => setNewActivity({ ...newActivity, Statut: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                  >
                    <option>Planifié</option>
                    <option>En cours</option>
                    <option>Terminé</option>
                    <option>Annulé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  value={newActivity.Description}
                  onChange={(e) => setNewActivity({ ...newActivity, Description: e.target.value })}
                  rows="3"
                  placeholder="Détails de l'interaction..."
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Date et heure</label>
                <input
                  type="datetime-local"
                  value={newActivity.Date_Activite}
                  onChange={(e) => setNewActivity({ ...newActivity, Date_Activite: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Client</label>
                  <select
                    value={newActivity.IDTiers || ''}
                    onChange={(e) => setNewActivity({ ...newActivity, IDTiers: e.target.value, ID_Projet: '' })}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                  >
                    <option value="">Sélectionner un client</option>
                    {tiers.map((tier) => (
                      <option key={tier.IDTiers || tier.CodTiers} value={tier.IDTiers || tier.CodTiers}>
                        {tier.Raisoc || tier.CodTiers}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Projet lié</label>
                  <select
                    value={newActivity.ID_Projet || ''}
                    onChange={(e) => setNewActivity({ ...newActivity, ID_Projet: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                  >
                    <option value="">Sélectionner un projet</option>
                    {projets
                      .filter((p) => {
                        if (!newActivity.IDTiers) return true;
                        return p.IDTiers === newActivity.IDTiers || p.client?.IDTiers === newActivity.IDTiers;
                      })
                      .map((p) => (
                        <option key={p.ID_Projet || p.nf} value={p.ID_Projet || p.nf || ''}>
                          {p.Nom_Projet || p.Code_Pro || `Projet ${p.nf || ''}`}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-white text-slate-700 text-sm font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  Enregistrer l'activité
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitesList;