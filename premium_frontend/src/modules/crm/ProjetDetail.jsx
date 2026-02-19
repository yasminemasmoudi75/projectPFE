import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon,
  BriefcaseIcon,
  FlagIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  ChartBarIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';
import { useDispatch, useSelector } from 'react-redux';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';
import { fetchProjetById, clearCurrentProjet, deleteProjet } from './projetSlice';
import axios from '../../app/axios';

const ProjetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { currentProjet: projet, loading } = useSelector((state) => state.projets);

  const [activitesProjet, setActivitesProjet] = useState([]);
  const [loadingActivites, setLoadingActivites] = useState(false);
  const [errorActivites, setErrorActivites] = useState(null);
  const [activiteTypeFilter, setActiviteTypeFilter] = useState('All');
  const [activiteStatusFilter, setActiviteStatusFilter] = useState('All');

  const getProgressColor = (percentage) => {
    if (percentage < 30) return '#ef4444'; // Red
    if (percentage < 70) return '#f97316'; // Orange
    return '#f59e0b'; // Amber
  };

  useEffect(() => {
    dispatch(fetchProjetById(id));
    return () => dispatch(clearCurrentProjet());
  }, [dispatch, id]);

  useEffect(() => {
    const fetchActivitesForProjet = async () => {
      if (!id) return;
      setLoadingActivites(true);
      setErrorActivites(null);
      try {
        const response = await axios.get('/activites', {
          params: { projetId: id },
        });
        const data = response.data?.data || response.data || [];
        setActivitesProjet(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Erreur lors du chargement des activités du projet:', error);
        setErrorActivites("Impossible de charger l'historique des activités");
      } finally {
        setLoadingActivites(false);
      }
    };

    fetchActivitesForProjet();
  }, [id]);

  const availableActiviteTypes = useMemo(() => {
    const types = activitesProjet.map((a) => a.Type_Activite).filter(Boolean);
    return Array.from(new Set(types));
  }, [activitesProjet]);

  const availableActiviteStatus = useMemo(() => {
    const status = activitesProjet.map((a) => a.Statut).filter(Boolean);
    return Array.from(new Set(status));
  }, [activitesProjet]);

  const filteredActivitesProjet = useMemo(() => {
    return activitesProjet.filter((a) => {
      const matchesType =
        activiteTypeFilter === 'All' ||
        (a.Type_Activite || '').toLowerCase() === activiteTypeFilter.toLowerCase();
      const matchesStatus =
        activiteStatusFilter === 'All' ||
        (a.Statut || '').toLowerCase() === activiteStatusFilter.toLowerCase();

      return matchesType && matchesStatus;
    });
  }, [activitesProjet, activiteTypeFilter, activiteStatusFilter]);

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.')) {
      try {
        await dispatch(deleteProjet(id)).unwrap();
        navigate('/projets');
      } catch (err) {
        alert('Erreur lors de la suppression : ' + err.message);
      }
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!projet) return <div>Projet non trouvé</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <button
        onClick={() => {
          const fromClientId = location.state?.fromClientId;
          if (fromClientId) {
            navigate(`/clients/${fromClientId}`);
          } else {
            navigate('/projets');
          }
        }}
        className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-1" />
        Retour
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${projet.Phase === 'Clôture' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                {projet.Phase || 'Nouveau'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${projet.Priorite === 'Haute' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                {projet.Priorite || 'Normale'}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800">{projet.Nom_Projet}</h1>
            <p className="text-gray-500 flex items-center gap-2">
              <BriefcaseIcon className="h-5 w-5" />
              Client: <span className="font-semibold text-slate-800">{projet.client?.Raisoc || 'N/A'}</span>
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="relative h-24 w-24">
              <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
                <path className="stroke-gray-100 stroke-[3]" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="stroke-[3] transition-all duration-1000" fill="none"
                  stroke={getProgressColor(projet.Avancement || 0)}
                  strokeDasharray={`${projet.Avancement || 0}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <text x="18" y="20.35" className="text-[10px] font-black fill-slate-800 rotate-90 origin-center" textAnchor="middle" transform="rotate(90 18 18)">{projet.Avancement || 0}%</text>
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-500">Avancement Global</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate(`/projets/edit/${id}`)}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-600 transition-all flex items-center gap-2 font-bold text-sm"
            >
              <PencilSquareIcon className="h-4 w-4" />
              Modifier
            </button>
            <button
              onClick={handleDelete}
              className="px-6 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-100 hover:text-rose-700 transition-all flex items-center gap-2 font-bold text-sm"
            >
              <TrashIcon className="h-4 w-4" />
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Description du Projet</h2>
            <p className="text-gray-600 leading-relaxed">{projet.Note_Privee || 'Aucune description disponible.'}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-gradient-blue flex items-center justify-center text-white shadow-glow-blue">
                  <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Historique des activités</h2>
                  <p className="text-xs text-slate-500">
                    Interactions rattachées à ce projet
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  navigate('/activites/new', {
                    state: {
                      defaultProjetId: projet.ID_Projet,
                      defaultTierId: projet.client?.IDTiers || projet.IDTiers,
                    },
                  })
                }
                className="btn-soft-primary text-xs px-4 py-2"
              >
                Ajouter une activité
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                Filtrer les activités
              </span>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <select
                  value={activiteTypeFilter}
                  onChange={(e) => setActiviteTypeFilter(e.target.value)}
                  className="input-modern h-8 text-[11px] min-w-[140px]"
                >
                  <option value="All">Tous les types</option>
                  {availableActiviteTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  value={activiteStatusFilter}
                  onChange={(e) => setActiviteStatusFilter(e.target.value)}
                  className="input-modern h-8 text-[11px] min-w-[140px]"
                >
                  <option value="All">Tous les statuts</option>
                  {availableActiviteStatus.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loadingActivites ? (
              <p className="text-xs text-slate-400">Chargement de l'historique...</p>
            ) : errorActivites ? (
              <p className="text-xs text-rose-500">{errorActivites}</p>
            ) : activitesProjet.length === 0 ? (
              <p className="text-sm text-slate-400 italic">
                Aucune activité enregistrée pour ce projet.
              </p>
            ) : filteredActivitesProjet.length === 0 ? (
              <p className="text-sm text-slate-400 italic">
                Aucune activité ne correspond à ces filtres.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredActivitesProjet.map((activite) => {
                  const date = activite.Date_Activite ? new Date(activite.Date_Activite) : null;
                  return (
                    <div
                      key={activite.ID_Activite}
                      className="border border-slate-100 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 hover:border-blue-200 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-700">
                            {activite.Type_Activite}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600">
                            {activite.Statut || 'Planifié'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {activite.Description || 'Aucune description'}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                          {date && (
                            <>
                              <span className="flex items-center gap-1.5">
                                <ClockIcon className="h-3.5 w-3.5" />
                                {date.toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <CalendarIcon className="h-3.5 w-3.5" />
                                {date.toLocaleDateString('fr-FR')}
                              </span>
                            </>
                          )}
                          <span className="flex items-center gap-1.5">
                            <UserIcon className="h-3.5 w-3.5" />
                            {activite.utilisateur?.FullName || 'Collaborateur'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:self-start">
                        <button
                          type="button"
                          onClick={() => navigate(`/activites/${activite.ID_Activite}`)}
                          className="px-3 py-1.5 text-[11px] text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-100"
                        >
                          Détails
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/activites/edit/${activite.ID_Activite}`)}
                          className="px-3 py-1.5 text-[11px] text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg border border-blue-100"
                        >
                          Modifier
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {projet.Alerte_IA_Risque && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-6 flex items-start gap-4">
              <div className="p-2 bg-rose-100 rounded-lg">
                <SparklesIcon className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h4 className="text-rose-900 font-bold">Alerte IA : Risque Détecté</h4>
                <p className="text-rose-700 text-sm mt-1">
                  Notre système d'intelligence artificielle a identifié des facteurs de risque sur ce projet. Une attention particulière est recommandée.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FlagIcon className="h-5 w-5 text-primary-600" />
              Étapes Clés (Milestones)
            </h2>
            <div className="space-y-6 relative ml-4 border-l-2 border-gray-100 py-2">
              {(projet.milestones || []).map((ms, index) => (
                <div key={index} className="relative pl-8">
                  <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 bg-white ${ms.completed ? 'border-primary-600' : 'border-gray-200'
                    }`}>
                    {ms.completed && <div className="absolute inset-0.5 rounded-full bg-primary-600"></div>}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className={`text-sm font-semibold ${ms.completed ? 'text-slate-800' : 'text-gray-400'}`}>
                      {ms.name}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">Échéance: {formatDate(ms.date)}</span>
                  </div>
                </div>
              ))}
              {(!projet.milestones || projet.milestones.length === 0) && (
                <p className="pl-8 text-sm text-slate-400 italic">Aucune étape définie pour le moment.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Finance & Temps</h2>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Budget Alloué</p>
                <p className="text-xl font-extrabold text-slate-800">{formatCurrency(projet.budget)}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary-50 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Échéance Finale</p>
                <p className="text-lg font-bold text-slate-800">{formatDate(projet.deadline)}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-50 rounded-lg">
                <ClockIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Phase Actuelle</p>
                <p className="text-lg font-bold text-slate-800">{projet.phase}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-xl shadow-sm p-6 text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>🚀</span> Actions Rapides
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-all">
                Signaler un retard
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate('/activites/new', {
                    state: {
                      defaultProjetId: projet.ID_Projet,
                      defaultTierId: projet.client?.IDTiers || projet.IDTiers,
                    },
                  })
                }
                className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-all"
              >
                Ajouter une activité
              </button>
              <button className="w-full py-2 bg-white text-primary-700 hover:bg-gray-100 rounded-lg text-sm font-bold transition-all shadow-lg">
                Valider l'étape actuelle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjetDetail;
