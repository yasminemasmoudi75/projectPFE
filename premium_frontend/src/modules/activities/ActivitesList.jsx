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
import { fetchActivites, createActivite } from './activiteSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import axios from '../../app/axios';

const ActivitesList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
    IDTiers: ''
  });

  useEffect(() => {
    dispatch(fetchActivites({ page: 1, limit: 50 }));
  }, [dispatch]);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const response = await axios.get('/tiers');
        setTiers(response.data || []);
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
        const data = response.data?.data || response.data || [];
        setProjets(data);
      } catch (error) {
        console.error('Error fetching projets for activities:', error);
      }
    };

    fetchProjets();
  }, []);

  useEffect(() => {
    const fetchCommerciaux = async () => {
      try {
        const response = await axios.get('/users');
        const rawData = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

        const sortedActifs = rawData
          .filter(
            (u) =>
              u.IsActive === true ||
              u.IsActive === 1 ||
              typeof u.IsActive === 'undefined'
          )
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
        console.error('Error fetching users for activities:', error);
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
        IDTiers: ''
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
      const matchesType = filterType === 'All' || a.Type_Activite?.toLowerCase() === filterType.toLowerCase();
      const matchesSearch = (a.Description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (a.Type_Activite?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesClient = !selectedTier || a.IDTiers === selectedTier;
      const matchesProjet = !selectedProjet || a.ID_Projet === selectedProjet;
      const matchesCommercial = !selectedCommercial || String(a.utilisateur?.UserID) === selectedCommercial;
      const activiteDate = a.Date_Activite ? new Date(a.Date_Activite) : null;
      const fromOk = !dateFrom || (activiteDate && activiteDate >= new Date(dateFrom));
      const toOk = !dateTo || (activiteDate && activiteDate <= new Date(dateTo));

      return matchesType && matchesSearch && matchesClient && matchesProjet && matchesCommercial && fromOk && toOk;
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
      await dispatch(fetchActivites({ page: 1, limit: 50 }));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-primary">
              <SparklesIcon className="h-3 w-3 mr-1" />
              Journal CRM
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Journal d'Activités</h1>
          <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-blue-500" /> Historique des interactions clients en temps réel
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshActivites}
            className={`p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-all shadow-soft ${refreshing ? 'animate-spin' : ''}`}
            title="Rafraîchir"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>

          <div className="flex bg-white p-1.5 rounded-2xl shadow-soft border border-slate-200 items-center">
            <button
              onClick={() => { setNewActivity(prev => ({ ...prev, Type_Activite: 'Appel' })); setIsAddModalOpen(true); }}
              className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              title="Appel"
            >
              <PhoneIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => { setNewActivity(prev => ({ ...prev, Type_Activite: 'Email' })); setIsAddModalOpen(true); }}
              className="p-2.5 text-blue-400 hover:bg-blue-50 rounded-xl transition-all"
              title="Email"
            >
              <EnvelopeIcon className="h-5 w-5" />
            </button>
            <div className="w-px h-5 bg-slate-200 mx-2"></div>
            <button
              onClick={() => navigate('/activites/new')}
              className="btn-soft-primary flex items-center gap-2 h-10 px-6"
            >
              <PlusIcon className="h-4 w-4 stroke-[3]" /> Nouvel Événement
            </button>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card-luxury p-0 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-transparent flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Filtres & Segmentation</h3>
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <FunnelIcon className="h-3 w-3" />
            Vue filtrée en temps réel
          </span>
        </div>
        <div className="p-6 space-y-5">
          {/* Filtre par Canal - Boutons en ligne */}
          <div>
            <h4 className="text-[11px] font-semibold text-slate-600 mb-2 uppercase tracking-widest">Canal</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Flux Global', icon: AdjustmentsHorizontalIcon, type: 'All' },
                { name: 'Appels', icon: PhoneIcon, type: 'Appel' },
                { name: 'Emails', icon: EnvelopeIcon, type: 'Email' },
                { name: 'Réunions', icon: UserGroupIcon, type: 'Réunion' },
                { name: 'Visites', icon: MapPinIcon, type: 'Visite' },
                { name: 'Notes', icon: DocumentTextIcon, type: 'Note' }
              ].map(item => (
                <button
                  key={item.type}
                  onClick={() => setFilterType(item.type)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all border ${
                    filterType === item.type
                      ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                      : 'bg-white border-slate-200/60 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filtres par Client, Projet, Commercial, Date - en grille */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-widest">Client</label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="input-modern w-full h-10 text-xs"
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
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-widest">Projet</label>
              <select
                value={selectedProjet}
                onChange={(e) => setSelectedProjet(e.target.value)}
                className="input-modern w-full h-10 text-xs"
              >
                <option value="">Tous les projets</option>
                {filteredProjetsForFilters.map(p => (
                  <option key={p.ID_Projet} value={p.ID_Projet}>
                    {p.Nom_Projet || p.Code_Pro || p.ID_Projet}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-widest">Commercial</label>
              <select
                value={selectedCommercial}
                onChange={(e) => setSelectedCommercial(e.target.value)}
                className="input-modern w-full h-10 text-xs"
              >
                <option value="">Tous les commerciaux</option>
                {commerciaux.map(c => (
                  <option key={c.UserID} value={String(c.UserID)}>
                    {c.FullName || c.LoginName || `User #${c.UserID}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-widest">Période</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="input-modern h-10 text-xs"
                  placeholder="Du"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="input-modern h-10 text-xs"
                  placeholder="Au"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="card-luxury p-0 overflow-hidden">
            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Activités</p>
                <p className="text-2xl font-extrabold text-slate-800">
                  {activityStats.total}
                </p>
              </div>
              <div className="icon-shape bg-gradient-blue shadow-glow-blue">
                <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="h-1 bg-gradient-blue"></div>
          </div>

          <div className="card-luxury p-0 overflow-hidden">
            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Terminées</p>
                <p className="text-2xl font-extrabold text-emerald-700 flex items-baseline gap-2">
                  {activityStats.done}
                </p>
              </div>
              <div className="icon-shape bg-gradient-success shadow-glow-emerald">
                <CheckCircleIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="h-1 bg-gradient-success"></div>
          </div>

          <div className="card-luxury p-0 overflow-hidden">
            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Planifiées</p>
                <p className="text-2xl font-extrabold text-amber-700">
                  {activityStats.planned}
                </p>
              </div>
              <div className="icon-shape bg-gradient-warning shadow-lg shadow-amber-200">
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="h-1 bg-gradient-warning"></div>
          </div>

          <div className="card-luxury p-0 overflow-hidden">
            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">En cours</p>
                <p className="text-2xl font-extrabold text-blue-700">
                  {activityStats.inProgress}
                </p>
              </div>
              <div className="icon-shape bg-gradient-blue-cyan shadow-glow-blue">
                <ArrowPathIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="h-1 bg-gradient-blue-cyan"></div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="card-luxury p-0 overflow-hidden">
          <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 px-2">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-black ${filterType === 'All' ? 'bg-slate-100 text-slate-600' : getTypeColor(filterType)}`}>
                {filterType === 'All' ? '∞' : filterType.charAt(0)}
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tighter">
                  Journal {filterType === 'All' ? 'Omnicanal' : filterType}
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {filteredActivites.length} interaction(s)
                </p>
              </div>
            </div>
            <div className="relative w-full sm:w-[320px]">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher dans les notes, les types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-modern pl-11 h-11"
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
                <div key={activite.ID_Activite} className="border border-slate-100 rounded-2xl bg-white px-4 py-4 hover:border-blue-200 hover:shadow-sm transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${getTypeColor(activite.Type_Activite)}`}>
                      {getActivityIcon(activite.Type_Activite)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-slate-900">
                          {activite.Type_Activite}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(activite.Statut)}`}>
                          {activite.Statut}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{activite.Description || 'Aucune description'}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <ClockIcon className="h-4 w-4" />
                          {new Date(activite.Date_Activite).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CalendarIcon className="h-4 w-4" />
                          {new Date(activite.Date_Activite).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <UserIcon className="h-4 w-4" />
                          {activite.utilisateur?.FullName || 'Collaborateur'}
                        </span>
                        {activite.IDTiers && (
                          <span className="flex items-center gap-1.5">
                            <BuildingOfficeIcon className="h-4 w-4" />
                            {activite.IDTiers.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:self-center">
                      <button className="h-9 w-9 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-xl transition-all border border-slate-100">
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => navigate(`/activites/${activite.ID_Activite}`)}
                        className="btn-outline border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 flex items-center gap-1 text-xs"
                      >
                        Détails <ChevronRightIcon className="h-3 w-3" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Nouvelle interaction</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Canal</label>
                  <select
                    value={newActivity.Type_Activite}
                    onChange={(e) => setNewActivity({ ...newActivity, Type_Activite: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option>Appel</option>
                    <option>Email</option>
                    <option>Visite</option>
                    <option>Réunion</option>
                    <option>Note</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select
                    value={newActivity.Statut}
                    onChange={(e) => setNewActivity({ ...newActivity, Statut: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option>Planifié</option>
                    <option>En cours</option>
                    <option>Terminé</option>
                    <option>Annulé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newActivity.Description}
                  onChange={(e) => setNewActivity({ ...newActivity, Description: e.target.value })}
                  rows="3"
                  placeholder="Détails de l'interaction..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date et heure</label>
                <input
                  type="datetime-local"
                  value={newActivity.Date_Activite}
                  onChange={(e) => setNewActivity({ ...newActivity, Date_Activite: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Enregistrer
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