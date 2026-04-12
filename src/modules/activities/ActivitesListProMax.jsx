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
  FireIcon
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

const ActivitesListProMax = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { canCreate } = usePermission(MODULE_CODES.VISITES);
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
      case 'appel': return <PhoneIcon className="h-6 w-6" />;
      case 'réunion': return <UserGroupIcon className="h-6 w-6" />;
      case 'visite': return <MapPinIcon className="h-6 w-6" />;
      case 'email': return <EnvelopeIcon className="h-6 w-6" />;
      case 'devis': return <BriefcaseIcon className="h-6 w-6" />;
      case 'note': return <DocumentTextIcon className="h-6 w-6" />;
      default: return <ChatBubbleLeftEllipsisIcon className="h-6 w-6" />;
    }
  };

  const getTypeStyle = (type) => {
    switch (type?.toLowerCase()) {
      case 'appel': return {
        bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
        icon: 'bg-gradient-to-br from-blue-400 to-blue-600',
        badge: 'bg-blue-100 text-blue-800',
        line: 'bg-gradient-to-r from-blue-400 to-blue-600'
      };
      case 'réunion': return {
        bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
        icon: 'bg-gradient-to-br from-purple-400 to-purple-600',
        badge: 'bg-purple-100 text-purple-800',
        line: 'bg-gradient-to-r from-purple-400 to-purple-600'
      };
      case 'visite': return {
        bg: 'bg-gradient-to-br from-green-50 to-green-100',
        icon: 'bg-gradient-to-br from-green-400 to-green-600',
        badge: 'bg-green-100 text-green-800',
        line: 'bg-gradient-to-r from-green-400 to-green-600'
      };
      case 'email': return {
        bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100',
        icon: 'bg-gradient-to-br from-cyan-400 to-cyan-600',
        badge: 'bg-cyan-100 text-cyan-800',
        line: 'bg-gradient-to-r from-cyan-400 to-cyan-600'
      };
      case 'note': return {
        bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
        icon: 'bg-gradient-to-br from-amber-400 to-amber-600',
        badge: 'bg-amber-100 text-amber-800',
        line: 'bg-gradient-to-r from-amber-400 to-amber-600'
      };
      default: return {
        bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
        icon: 'bg-gradient-to-br from-gray-400 to-gray-600',
        badge: 'bg-gray-100 text-gray-800',
        line: 'bg-gradient-to-r from-gray-400 to-gray-600'
      };
    }
  };

  const getStatusStyle = (statut) => {
    switch (statut) {
      case 'Terminé': return {
        bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
        border: 'border-l-4 border-green-500',
        badge: 'bg-green-100 text-green-800',
        icon: '✅'
      };
      case 'Planifié': return {
        bg: 'bg-gradient-to-r from-amber-50 to-orange-50',
        border: 'border-l-4 border-amber-500',
        badge: 'bg-amber-100 text-amber-800',
        icon: '📅'
      };
      case 'En cours': return {
        bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
        border: 'border-l-4 border-blue-500',
        badge: 'bg-blue-100 text-blue-800',
        icon: '⚡'
      };
      default: return {
        bg: 'bg-gradient-to-r from-gray-50 to-slate-50',
        border: 'border-l-4 border-gray-500',
        badge: 'bg-gray-100 text-gray-800',
        icon: '•'
      };
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createActivite(newActivity)).unwrap();
      toast.success('✨ Activité créée avec succès!');
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
      toast.error('❌ Erreur lors de la création');
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
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 space-y-8 pb-20">
      {/* MEGA HEADER */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-pulse"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 px-8 md:px-12 py-16">
          <div className="mb-6">
            <div className="inline-block">
              <span className="px-4 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-bold uppercase tracking-widest flex items-center gap-2 mb-4">
                <FireIcon className="h-4 w-4 text-orange-300" />
                Activités en Direct
              </span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tight">
            Journal d'Activités
          </h1>
          <p className="text-lg text-white/80 max-w-2xl leading-relaxed">
            Gérez, suivez et optimisez toutes vos interactions clients. Transformez vos données en intelligence commerciale.
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-4 mt-8">
            <button
              onClick={refreshActivites}
              className={`px-6 py-3 bg-white/10 backdrop-blur hover:bg-white/20 rounded-xl font-bold transition-all flex items-center gap-2 ${refreshing ? 'animate-spin' : ''}`}
            >
              <ArrowPathIcon className="h-4 w-4" />
              Actualiser
            </button>
            {canCreate && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-8 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:shadow-2xl transition-all flex items-center gap-2 shadow-xl hover:scale-105 transform"
              >
                <PlusIcon className="h-5 w-5" />
                Créer une Activité
              </button>
            )}
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total', value: activityStats.total, emoji: '📊', color: 'from-blue-500 to-cyan-500' },
          { label: 'Terminées', value: activityStats.done, emoji: '✅', color: 'from-green-500 to-emerald-500' },
          { label: 'Planifiées', value: activityStats.planned, emoji: '📅', color: 'from-amber-500 to-orange-500' },
          { label: 'En Cours', value: activityStats.inProgress, emoji: '⚡', color: 'from-purple-500 to-pink-500' }
        ].map((stat, idx) => (
          <div 
            key={idx}
            className="group relative rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 p-6 border border-slate-700 cursor-pointer transform hover:scale-105"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-all duration-300`}></div>
            
            <div className="relative z-10">
              <div className="text-4xl mb-3">{stat.emoji}</div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">{stat.label}</p>
              <p className={`text-4xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 shadow-xl">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-purple-400" />
          Filtrer les Activités
        </h3>

        {/* Type Filter */}
        <div className="mb-8">
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-4">Par Canal</p>
          <div className="flex flex-wrap gap-3">
            {[
              { name: 'Tout', type: 'All', emoji: '∞' },
              { name: 'Appels', type: 'Appel', emoji: '📞' },
              { name: 'Emails', type: 'Email', emoji: '📧' },
              { name: 'Réunions', type: 'Réunion', emoji: '👥' },
              { name: 'Visites', type: 'Visite', emoji: '📍' },
              { name: 'Notes', type: 'Note', emoji: '📝' }
            ].map(item => (
              <button
                key={item.type}
                onClick={() => setFilterType(item.type)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all transform hover:scale-110 ${
                  filterType === item.type
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }`}
              >
                <span>{item.emoji}</span>
                {item.name}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs text-slate-400 font-bold uppercase mb-2">Client</label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 transition-all"
            >
              <option value="">Tous</option>
              {tiers.map(t => (
                <option key={t.IDTiers} value={t.IDTiers}>
                  {t.Raisoc || t.NomTiers || t.IDTiers}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-bold uppercase mb-2">Projet</label>
            <select
              value={selectedProjet}
              onChange={(e) => setSelectedProjet(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 transition-all"
            >
              <option value="">Tous</option>
              {filteredProjetsForFilters.map(p => (
                <option key={p.ID_Projet} value={p.ID_Projet}>
                  {p.Nom_Projet || p.Code_Pro}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-bold uppercase mb-2">Commercial</label>
            <select
              value={selectedCommercial}
              onChange={(e) => setSelectedCommercial(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 transition-all"
            >
              <option value="">Tous</option>
              {commerciaux.map(c => (
                <option key={c.UserID} value={String(c.UserID)}>
                  {c.FullName || c.LoginName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-bold uppercase mb-2">Du</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-bold uppercase mb-2">Au</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
        <input
          type="text"
          placeholder="🔍 Cherchez par description, type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 transition-all text-lg"
        />
      </div>

      {/* ACTIVITIES LIST */}
      <div>
        <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
          <span className="text-3xl">🚀</span>
          {filteredActivites.length} Activité(s)
        </h2>

        <div className="space-y-4">
          {filteredActivites.length === 0 ? (
            <div className="rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 px-8 py-16 text-center">
              <ChatBubbleLeftEllipsisIcon className="h-12 w-12 mx-auto text-slate-600 mb-4" />
              <h3 className="text-lg font-bold mb-2">Aucune activité trouvée</h3>
              <p className="text-slate-400">Ajustez vos filtres ou créez une nouvelle activité</p>
            </div>
          ) : (
            filteredActivites.map((activite, idx) => {
              const typeStyle = getTypeStyle(activite.Type_Activite);
              const statusStyle = getStatusStyle(activite.Statut);
              
              return (
                <div
                  key={activite.ID_Activite}
                  className={`group rounded-2xl overflow-hidden transition-all duration-300 transform hover:scale-[1.01] hover:shadow-2xl cursor-pointer border border-slate-700 ${statusStyle.bg} ${statusStyle.border}`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
                    {/* Icon */}
                    <div className={`flex-shrink-0 h-16 w-16 rounded-2xl ${typeStyle.icon} flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                      {getActivityIcon(activite.Type_Activite)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-xl font-black text-white">
                          {activite.Type_Activite}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-black ${statusStyle.badge}`}>
                          {statusStyle.icon} {activite.Statut}
                        </span>
                      </div>
                      
                      <p className="text-slate-300 mb-3 line-clamp-2">
                        {activite.Description || '—'}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4" />
                          {new Date(activite.Date_Activite).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          {new Date(activite.Date_Activite).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4" />
                          {activite.utilisateur?.FullName || 'Collaborateur'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {Number(activite.Valide) !== 1 && (
                        <button
                          onClick={async () => {
                            try {
                              await dispatch(validateActivite(activite.ID_Activite)).unwrap();
                              toast.success('✅ Validé!');
                              dispatch(fetchActivites({ page: 1, limit: 50, filters: { valide: 1 } }));
                            } catch {
                              toast.error('❌ Erreur');
                            }
                          }}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded-lg transition-all"
                        >
                          Valider
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/activites/${activite.ID_Activite}`)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-lg transition-all flex items-center gap-1"
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

      {/* MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700">
            <div className="sticky top-0 flex justify-between items-center border-b border-slate-700 px-8 py-6 bg-gradient-to-r from-purple-600 to-pink-600">
              <h2 className="text-2xl font-black text-white">✨ Créer une Activité</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 hover:bg-white/20 rounded-xl transition-all"
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Canal</label>
                  <select
                    value={newActivity.Type_Activite}
                    onChange={(e) => setNewActivity({ ...newActivity, Type_Activite: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 transition-all"
                  >
                    <option>Appel</option>
                    <option>Email</option>
                    <option>Visite</option>
                    <option>Réunion</option>
                    <option>Note</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Statut</label>
                  <select
                    value={newActivity.Statut}
                    onChange={(e) => setNewActivity({ ...newActivity, Statut: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 transition-all"
                  >
                    <option>Planifié</option>
                    <option>En cours</option>
                    <option>Terminé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">Description</label>
                <textarea
                  value={newActivity.Description}
                  onChange={(e) => setNewActivity({ ...newActivity, Description: e.target.value })}
                  rows="4"
                  placeholder="Détails..."
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">Date & Heure</label>
                <input
                  type="datetime-local"
                  value={newActivity.Date_Activite}
                  onChange={(e) => setNewActivity({ ...newActivity, Date_Activite: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Client</label>
                  <select
                    value={newActivity.IDTiers || ''}
                    onChange={(e) => setNewActivity({ ...newActivity, IDTiers: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 transition-all"
                  >
                    <option value="">Sélectionner</option>
                    {tiers.map((tier) => (
                      <option key={tier.IDTiers} value={tier.IDTiers}>
                        {tier.Raisoc || tier.NomTiers}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Projet</label>
                  <select
                    value={newActivity.ID_Projet || ''}
                    onChange={(e) => setNewActivity({ ...newActivity, ID_Projet: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 transition-all"
                  >
                    <option value="">Sélectionner</option>
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

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-slate-600 text-white font-bold rounded-lg hover:bg-slate-700 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-xl transition-all transform hover:scale-105"
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

export default ActivitesListProMax;
