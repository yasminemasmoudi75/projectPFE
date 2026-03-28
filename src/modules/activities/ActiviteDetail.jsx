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
} from '@heroicons/react/24/outline';
import axios from '../../app/axios';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';

const getActivityIcon = (type) => {
  const normalized = type?.toLowerCase();

  switch (normalized) {
    case 'appel':
      return <PhoneIcon className="h-4 w-4 text-white" />;
    case 'email':
      return <EnvelopeIcon className="h-4 w-4 text-white" />;
    case 'visite':
      return <MapPinIcon className="h-4 w-4 text-white" />;
    default:
      return <ChatBubbleLeftEllipsisIcon className="h-4 w-4 text-white" />;
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
        <div className="h-20 w-20 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300 mb-6">
          <ChatBubbleLeftEllipsisIcon className="h-10 w-10" />
        </div>
        <p className="text-slate-500 font-bold mb-6">Activité introuvable</p>
        <button
          onClick={() => navigate('/activites')}
          className="btn-soft-primary"
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

  return (
    <div className="animate-fade-in space-y-8 pb-12">
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
            className="h-11 w-11 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 rounded-xl transition-all shadow-soft flex items-center justify-center"
            title="Retour"
          >
            <ArrowLeftIcon className="h-5 w-5 stroke-[2.5]" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-primary">
                <SparklesIcon className="h-3 w-3 mr-1" />
                Journal d'Activités
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Détail de l'activité</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {Number(activite.Valide) !== 1 && (
            <button
              onClick={handleValidate}
              disabled={validating}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all disabled:opacity-60"
            >
              {validating ? 'Validation...' : 'Valider'}
            </button>
          )}
            {activite.ID_Projet && (
              <button
                onClick={() => navigate(`/projets/${activite.ID_Projet}`)}
                className="px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold hover:bg-indigo-100 transition-all flex items-center gap-2"
              >
                <BriefcaseIcon className="h-4 w-4" />
                Détails Projet
              </button>
            )}
          <button
            onClick={() => navigate(`/activites/edit/${activite.ID_Activite}`, { state: location.state })}
            className="btn-soft-primary flex items-center gap-2"
          >
            <PencilSquareIcon className="h-4 w-4 stroke-[3]" />
            Modifier
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="card-luxury p-0 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/80 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="icon-shape icon-shape-sm shadow-glow-blue">
                  {getActivityIcon(activite.Type_Activite)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">{activite.Type_Activite}</h2>
                  <p className="text-xs text-slate-500">{activite.Description || 'Aucune description fournie'}</p>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
                    <p className="text-sm font-bold text-slate-700">
                      {date ? date.toLocaleDateString('fr-FR') : 'Non définie'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ClockIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Heure</p>
                    <p className="text-sm font-bold text-slate-700">
                      {date ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Non définie'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-[11px] font-bold uppercase tracking-widest">
                  Statut : {activite.Statut || 'Non défini'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="card-luxury p-0 overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-100/50 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Contexte</h3>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agent</p>
                  <p className="text-sm font-bold text-slate-700">
                    {activite.utilisateur?.FullName || 'Collaborateur inconnu'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
                  <BuildingOfficeIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client</p>
                  <p className="text-sm font-bold text-slate-700">
                    {activite.tiers?.Raisoc || (activite.IDTiers || 'Non renseigné')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card-luxury p-0 overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-100/50 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Projet lié</h3>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BriefcaseIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nom du projet</p>
                  <p className="text-sm font-bold text-slate-700">
                    {projectInfo?.Nom_Projet || 'Aucun projet lié'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Code</p>
                  <p className="text-sm font-bold text-slate-700 truncate">{projectInfo?.Code_Pro || 'N/A'}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ID Projet</p>
                  <p className="text-sm font-bold text-slate-700 truncate">{projectId || 'N/A'}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Référence (NF)</p>
                  <p className="text-sm font-bold text-slate-700 truncate">{projectReference || 'N/A'}</p>
                </div>
              </div>

              {projectId && (
                <button
                  onClick={() => navigate(`/projets/${projectId}`)}
                  className="w-full px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all"
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
