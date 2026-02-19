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

  useEffect(() => {
    const fetchActivite = async () => {
      try {
        const response = await axios.get(`/activites/${id}`);
        const activiteData = response.data?.data || response.data;

        setActivite(activiteData);
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

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button
            onClick={() => {
              const fromClientId = location.state?.fromClientId;
              if (fromClientId) {
                navigate(`/clients/${fromClientId}`);
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
          <button
            onClick={() => navigate(`/activites/edit/${activite.ID_Activite}`)}
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
        </div>
      </div>
    </div>
  );
};

export default ActiviteDetail;
