import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  ChatBubbleLeftEllipsisIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  UserIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  PencilSquareIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import axios from '../../app/axios';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';

const getActivityIcon = (type) => {
  const normalized = type?.toLowerCase();

  switch (normalized) {
    case 'appel':
      return <PhoneIcon className="h-6 w-6" />;
    case 'email':
      return <EnvelopeIcon className="h-6 w-6" />;
    case 'visite':
      return <MapPinIcon className="h-6 w-6" />;
    case 'réunion':
    case 'reunion':
      return <UserIcon className="h-6 w-6" />;
    default:
      return <ChatBubbleLeftEllipsisIcon className="h-6 w-6" />;
  }
};

const getTypeColor = (type) => {
  switch (type?.toLowerCase()) {
    case 'appel':
      return 'bg-sky-50 text-sky-500';
    case 'email':
      return 'bg-cyan-50 text-cyan-500';
    case 'visite':
      return 'bg-emerald-50 text-emerald-500';
    case 'réunion':
    case 'reunion':
      return 'bg-violet-50 text-violet-500';
    case 'note':
      return 'bg-amber-50 text-amber-500';
    default:
      return 'bg-slate-50 text-slate-500';
  }
};

const ActiviteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activite, setActivite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [linkedProject, setLinkedProject] = useState(null);

  useEffect(() => {
    const fetchActivite = async () => {
      try {
        const response = await axios.get(`/activites/${id}`);
        const activiteData = response.data?.data || response.data;

        setActivite(activiteData);

        if (!activiteData?.projet) {
          const projectRef = activiteData?.ID_Projet || activiteData?.Nf;

          if (projectRef) {
            try {
              const projectResponse = await axios.get(`/projets/${projectRef}`);
              const projectData = projectResponse.data?.data || projectResponse.data;
              setLinkedProject(projectData || null);
            } catch {
              setLinkedProject(null);
            }
          } else {
            setLinkedProject(null);
          }
        } else {
          setLinkedProject(activiteData.projet);
        }
      } catch (error) {
        console.error('Error fetching activite details:', error);
        toast.error("Impossible de charger l'activité");
      } finally {
        setLoading(false);
      }
    };

    fetchActivite();
  }, [id]);

  if (loading) return <LoadingSpinner />;

  if (!activite) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-20 w-20 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mb-6">
          <ChatBubbleLeftEllipsisIcon className="h-10 w-10" />
        </div>
        <p className="text-slate-500 font-semibold mb-6">Activité introuvable</p>
        <button
          onClick={() => navigate('/activites')}
          className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-medium shadow-md shadow-sky-200/50 transition-all"
        >
          Retour au journal
        </button>
      </div>
    );
  }

  const date = activite.Date_Activite ? new Date(activite.Date_Activite) : null;
  const projectInfo = linkedProject || activite.projet || null;
  const projectId = projectInfo?.ID_Projet || activite.ID_Projet || null;
  const projectReference = projectInfo?.nf || activite.Nf || null;

  const handleValidate = async () => {
    try {
      setValidating(true);
      const response = await axios.patch(`/activites/${id}/validate`);
      const activiteData = response.data || response;
      setActivite(activiteData);
      toast.success('Activité validée');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setValidating(false);
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'Terminé':
      case 'Termine':
        return 'bg-emerald-50 text-emerald-600';
      case 'Planifié':
      case 'Planifie':
        return 'bg-amber-50 text-amber-600';
      case 'En cours':
        return 'bg-sky-50 text-sky-600';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* Header - Inspired Design */}
      <div className="card-luxury p-8 bg-gradient-to-r from-sky-50 via-white to-violet-50 border-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => {
                const fromClientId = location.state?.fromClientId;
                const fromCalendar = location.state?.from === 'calendar';
                
                if (fromClientId) {
                  navigate(`/clients/${fromClientId}`);
                } else if (fromCalendar) {
                  navigate('/calendar');
                } else {
                  navigate('/activites');
                }
              }}
              className="h-11 w-11 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-all flex items-center justify-center"
              title="Retour"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-600 text-xs font-medium mb-3">
                <SparklesIcon className="h-3 w-3" />
                Journal CRM
              </div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                Détail de l'activité
              </h1>
              <p className="text-slate-600 mt-1 flex items-center gap-2 text-sm">
                <ClockIcon className="h-4 w-4 text-sky-500" />
                {activite.Type_Activite} - {activite.Statut}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {Number(activite.Valide) !== 1 && (
              <button
                onClick={handleValidate}
                disabled={validating}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium shadow-md shadow-emerald-200/50 transition-all disabled:opacity-60 flex items-center gap-2"
              >
                <CheckCircleIcon className="h-4 w-4" />
                {validating ? 'Validation...' : 'Valider'}
              </button>
            )}
            {activite.ID_Projet && (
              <button
                onClick={() => navigate(`/projets/${activite.ID_Projet}`)}
                className="px-6 py-2.5 rounded-xl bg-violet-50 text-violet-600 border border-violet-200 font-medium hover:bg-violet-100 transition-all flex items-center gap-2"
              >
                <BriefcaseIcon className="h-4 w-4" />
                Voir Projet
              </button>
            )}
            <button
              onClick={() => navigate(`/activites/edit/${activite.ID_Activite}`, { state: location.state })}
              className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium shadow-md shadow-sky-200/50 transition-all flex items-center gap-2"
            >
              <PencilSquareIcon className="h-4 w-4" />
              Modifier
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Activity Info Card */}
          <div className="card-luxury shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50/50 py-4 px-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${getTypeColor(activite.Type_Activite)}`}>
                  {getActivityIcon(activite.Type_Activite)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{activite.Type_Activite}</h2>
                  <p className="text-sm text-slate-600">{activite.Description || 'Aucune description fournie'}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Date</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {date ? date.toLocaleDateString('fr-FR') : 'Non définie'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center">
                    <ClockIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Heure</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {date ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Non définie'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Statut</p>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider ${getStatusColor(activite.Statut)}`}>
                  {activite.Statut || 'Non défini'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Context Card */}
          <div className="card-luxury shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50/50 py-4 px-6">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Contexte
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Agent</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {activite.utilisateur?.FullName || 'Collaborateur inconnu'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
                  <BuildingOfficeIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Client</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {activite.tiers?.Raisoc || (activite.IDTiers || 'Non renseigné')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Linked Project Card */}
          <div className="card-luxury shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50/50 py-4 px-6">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Projet lié
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center">
                  <BriefcaseIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Nom du projet</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {projectInfo?.Nom_Projet || 'Aucun projet lié'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Code</p>
                  <p className="text-xs font-semibold text-slate-700 truncate">{projectInfo?.Code_Pro || 'N/A'}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Réf. NF</p>
                  <p className="text-xs font-semibold text-slate-700 truncate">{projectReference || 'N/A'}</p>
                </div>
              </div>

              {projectId && (
                <button
                  onClick={() => navigate(`/projets/${projectId}`)}
                  className="w-full px-4 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-medium shadow-md shadow-violet-200/50 transition-all"
                >
                  Voir le détail du projet
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiviteDetail;
