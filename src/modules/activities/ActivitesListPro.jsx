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
  DocumentTextIcon,
  ArrowPathIcon,
  XMarkIcon,
  SparklesIcon,
  UserIcon,
  BuildingOfficeIcon,
  FireIcon,
  CheckIcon
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

const ActivitesListPro = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { canCreate } = usePermission(MODULE_CODES.CHARGEMENT);
  const { activites, loading } = useSelector((state) => state.activites);

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
        console.error('Error fetching tiers:', error);
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
        console.error('Error fetching projets:', error);
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
              .localeCompare((b.FullName || b.LoginName || '').toString(), 'fr', { sensitivity: 'base' })
          );
        setCommerciaux(sortedActifs);
      } catch (error) {
        console.error('Error fetching commercials:', error);
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
      case 'appel': return { bg: 'bg-blue-100/80', text: 'text-blue-700', gradient: 'from-blue-400 to-blue-600' };
      case 'réunion': return { bg: 'bg-purple-100/80', text: 'text-purple-700', gradient: 'from-purple-400 to-purple-600' };
      case 'visite': return { bg: 'bg-green-100/80', text: 'text-green-700', gradient: 'from-green-400 to-green-600' };
      case 'email': return { bg: 'bg-cyan-100/80', text: 'text-cyan-700', gradient: 'from-cyan-400 to-cyan-600' };
      case 'note': return { bg: 'bg-amber-100/80', text: 'text-amber-700', gradient: 'from-amber-400 to-amber-600' };
      default: return { bg: 'bg-gray-100/80', text: 'text-gray-700', gradient: 'from-gray-400 to-gray-600' };
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'Terminé': return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100' };
      case 'Planifié': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100' };
      case 'En cours': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100' };
      default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-100' };
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createActivite(newActivity)).unwrap();
      toast.success('✨ Activité ajoutée avec succès', { icon: '🎉' });
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
      toast.error('❌ Erreur lors de l\'ajout');
    }
  };

  const filteredProjetsForFilters = useMemo(() => {
    if (!selectedTier) return projets;
    return projets.filter((p) => p.IDTiers === selectedTier || p.client?.IDTiers === selectedTier);
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
    let done = 0, planned = 0, inProgress = 0;

    filteredActivites.forEach((a) => {
      if (a.Statut === 'Terminé') done += 1;
      else if (a.Statut === 'Planifié') planned += 1;
      else if (a.Statut === 'En cours') inProgress += 1;
    });

    return { total, done, planned, inProgress };
  }, [filteredActivites]);

  const refreshActivites = async () => {
    try {
      setRefreshing(true);
      await dispatch(fetchActivites({ page: 1, limit: 50, filters: { valide: 1 } }));
      toast.success('✅ Données actualisées');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 pb-16 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 min-h-screen p-2">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-8 md:p-12 shadow-2xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl transform -translate-x-1/4 translate-y-1/3"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 backdrop-blur rounded-xl">
              <SparklesIcon className="h-5 w-5 text-white" />
            </div>
            <span className="px-3 py-1 bg-white/30 backdrop-blur rounded-full text-xs font-bold text-white uppercase tracking-wider">
              📊 Dashboard Interactif
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
            Journal d'Activités
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl">
            Gérez et suivez toutes vos interactions clients en temps réel. Visualisez les tendances, optimisez votre prospection.
          </p>
        </div>

        {/* Quick Action Bar */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-3 mt-8">
          <button
            onClick={refreshActivites}
            className={`px-6 py-2.5 bg-white/20 backdrop-blur text-white rounded-xl font-semibold hover:bg-white/30 transition-all flex items-center gap-2 ${refreshing ? 'animate-spin' : ''}`}
          >
            <ArrowPathIcon className="h-4 w-4" />
            Actualiser
          </button>
          {canCreate && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-2.5 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-xl transition-all flex items-center gap-2 shadow-lg"
            >
              <PlusIcon className="h-5 w-5" />
              Nouvelle Activité
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards - Enhanced */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total', value: activityStats.total, icon: ChatBubbleLeftEllipsisIcon, color: 'from-blue-500 to-cyan-500', icon_bg: 'bg-blue-100' },
          { label: 'Terminées', value: activityStats.done, icon: CheckCircleIcon, color: 'from-emerald-500 to-green-500', icon_bg: 'bg-green-100' },
          { label: 'Planifiées', value: activityStats.planned, icon: CalendarIcon, color: 'from-amber-500 to-orange-500', icon_bg: 'bg-amber-100' },
          { label: 'En Cours', value: activityStats.inProgress, icon: ArrowPathIcon, color: 'from-purple-500 to-pink-500', icon_bg: 'bg-purple-100' }
        ].map((stat, idx) => (
          <div 
            key={idx}
            className="group relative rounded-2xl bg-white overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 p-6 border border-slate-100/50"
          >
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-all duration-300" style={{ background: `linear-gradient(135deg, var(--gradient))` }}></div>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{stat.label}</p>
                <p className={`text-4xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-4 rounded-2xl ${stat.icon_bg} shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="h-6 w-6 text-slate-700" />
              </div>
            </div>
            
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-500`} 
                style={{ width: `${(stat.value / (activityStats.total || 1)) * 100}%` }}>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter & Search Section */}
      <div className="space-y-6">
        {/* Quick Channel Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100/50">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-widest">
            <FunnelIcon className="h-4 w-4 text-blue-600" />
            Filtrer par Canal
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              { name: 'Tous', type: 'All', icon: AdjustmentsHorizontalIcon },
              { name: 'Appels', type: 'Appel', icon: PhoneIcon },
              { name: 'Emails', type: 'Email', icon: EnvelopeIcon },
              { name: 'Réunions', type: 'Réunion', icon: UserGroupIcon },
              { name: 'Visites', type: 'Visite', icon: MapPinIcon },
              { name: 'Notes', type: 'Note', icon: DocumentTextIcon }
            ].map(item => (
              <button
                key={item.type}
                onClick={() => setFilterType(item.type)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  filterType === item.type
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100/50">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-widest">
            <AdjustmentsHorizontalIcon className="h-4 w-4 text-blue-600" />
            Filtres Avancés
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Client</label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Projet</label>
              <select
                value={selectedProjet}
                onChange={(e) => setSelectedProjet(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Commercial</label>
              <select
                value={selectedCommercial}
                onChange={(e) => setSelectedCommercial(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Du</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Au</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-100/50">
          <MagnifyingGlassIcon className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="🔍 Rechercher dans les descriptions, types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
          />
        </div>
      </div>

      {/* Activities Timeline */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100/50">
        <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-transparent border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <FireIcon className="h-5 w-5 text-orange-500" />
              Flux en Direct
            </h2>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <CheckIcon className="h-3 w-3" />
              {filteredActivites.length} interaction(s) trouvée(s)
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {filteredActivites.length === 0 ? (
            <div className="border-2 border-dashed border-slate-300 rounded-2xl px-8 py-20 text-center bg-slate-50/50">
              <ChatBubbleLeftEllipsisIcon className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-600 mb-2">Aucune activité trouvée</h3>
              <p className="text-sm text-slate-400">Ajustez vos filtres ou enregistrez une nouvelle interaction.</p>
            </div>
          ) : (
            filteredActivites.map((activite, idx) => {
              const typeColor = getTypeColor(activite.Type_Activite);
              const statusColor = getStatusColor(activite.Statut);
              return (
                <div 
                  key={activite.ID_Activite}
                  className={`group relative rounded-2xl overflow-hidden transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl border-2 p-4 md:p-6 animate-in fade-in slide-in-from-bottom-4 cursor-pointer`}
                  style={{ 
                    background: statusColor.bg,
                    borderColor: statusColor.border,
                    animationDelay: `${idx * 50}ms`
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Activity Icon */}
                    <div className={`flex-shrink-0 h-14 w-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${typeColor.gradient} text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                      {getActivityIcon(activite.Type_Activite)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-black text-slate-900">
                          {activite.Type_Activite}
                        </h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${statusColor.badge} ${statusColor.text} shadow-sm`}>
                          {activite.Statut}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mb-3 line-clamp-2">
                        {activite.Description || '—'}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600 font-medium">
                        <span className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-lg">
                          <ClockIcon className="h-3.5 w-3.5" />
                          {new Date(activite.Date_Activite).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-lg">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {new Date(activite.Date_Activite).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-lg">
                          <UserIcon className="h-3.5 w-3.5" />
                          {activite.utilisateur?.FullName || 'Collaborateur'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {Number(activite.Valide) !== 1 && (
                        <button
                          onClick={async () => {
                            try {
                              await dispatch(validateActivite(activite.ID_Activite)).unwrap();
                              toast.success('✅ Activité validée');
                              dispatch(fetchActivites({ page: 1, limit: 50, filters: { valide: 1 } }));
                            } catch {
                              toast.error('❌ Erreur');
                            }
                          }}
                          className="px-3 py-2 bg-green-100 text-green-700 hover:bg-green-200 font-semibold text-xs rounded-lg transition-all flex items-center gap-1"
                        >
                          <CheckCircleIcon className="h-3.5 w-3.5" /> Valider
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/activites/${activite.ID_Activite}`)}
                        className="px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 font-semibold text-xs rounded-lg transition-all flex items-center gap-1"
                      >
                        Voir <ChevronRightIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal - New Activity (Enhanced) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
            {/* Modal Header */}
            <div className="sticky top-0 flex justify-between items-center border-b border-slate-200 px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-2xl font-black text-slate-900">✨ Nouvelle Activité</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 hover:bg-white rounded-xl transition-all"
              >
                <XMarkIcon className="h-6 w-6 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddActivity} className="p-8 space-y-6">
              {/* Type & Status Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Canal</label>
                  <select
                    value={newActivity.Type_Activite}
                    onChange={(e) => setNewActivity({ ...newActivity, Type_Activite: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium transition-all"
                  >
                    <option>Appel</option>
                    <option>Email</option>
                    <option>Visite</option>
                    <option>Réunion</option>
                    <option>Note</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Statut</label>
                  <select
                    value={newActivity.Statut}
                    onChange={(e) => setNewActivity({ ...newActivity, Statut: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium transition-all"
                  >
                    <option>Planifié</option>
                    <option>En cours</option>
                    <option>Terminé</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <textarea
                  value={newActivity.Description}
                  onChange={(e) => setNewActivity({ ...newActivity, Description: e.target.value })}
                  rows="4"
                  placeholder="Détails de l'interaction..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none transition-all"
                />
              </div>

              {/* Date & Time */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Date & Heure</label>
                <input
                  type="datetime-local"
                  value={newActivity.Date_Activite}
                  onChange={(e) => setNewActivity({ ...newActivity, Date_Activite: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                />
              </div>

              {/* Client & Project */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Client</label>
                  <select
                    value={newActivity.IDTiers || ''}
                    onChange={(e) => setNewActivity({ ...newActivity, IDTiers: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                  >
                    <option value="">Sélectionner un client</option>
                    {tiers.map((tier) => (
                      <option key={tier.IDTiers} value={tier.IDTiers}>
                        {tier.Raisoc || tier.NomTiers}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Projet</label>
                  <select
                    value={newActivity.ID_Projet || ''}
                    onChange={(e) => setNewActivity({ ...newActivity, ID_Projet: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                  >
                    <option value="">Sélectionner un projet</option>
                    {projets
                      .filter((p) => !newActivity.IDTiers || p.IDTiers === newActivity.IDTiers)
                      .map((p) => (
                        <option key={p.ID_Projet} value={p.ID_Projet}>
                          {p.Nom_Projet || p.Code_Pro}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
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

export default ActivitesListPro;
