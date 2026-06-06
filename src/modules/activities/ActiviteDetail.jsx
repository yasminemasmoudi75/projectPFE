import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeftIcon, CalendarIcon,
  ChatBubbleLeftEllipsisIcon, PhoneIcon, EnvelopeIcon,
  MapPinIcon, UserIcon, BuildingOfficeIcon, BriefcaseIcon,
  PencilSquareIcon, CheckCircleIcon, ArrowUpRightIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid';
import axios from '../../app/axios';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import usePermission from '../../hooks/usePermission';
import useAuth from '../../hooks/useAuth';
import { MODULE_CODES } from '../../utils/constants';

const TYPE_CFG = {
  appel:   { Icon: PhoneIcon,                  color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  email:   { Icon: EnvelopeIcon,               color: '#0284c7', bg: 'bg-sky-50',     text: 'text-sky-600',     border: 'border-sky-200'     },
  visite:  { Icon: MapPinIcon,                 color: '#7c3aed', bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-200'  },
  réunion: { Icon: UserIcon,                   color: '#4338ca', bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-200'  },
  reunion: { Icon: UserIcon,                   color: '#4338ca', bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-200'  },
  note:    { Icon: DocumentTextIcon,           color: '#d97706', bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200'   },
};
const getCfg = t => TYPE_CFG[(t||'').toLowerCase()] || {
  Icon: ChatBubbleLeftEllipsisIcon, color: '#64748b',
  bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200',
};

const getStatus = s => {
  switch ((s||'').toLowerCase()) {
    case 'terminé':
    case 'termine':  return { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' };
    case 'planifié':
    case 'planifie': return { cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-400'   };
    case 'en cours': return { cls: 'bg-blue-50 text-[#0062AF] border-blue-200',         dot: 'bg-[#0062AF]'   };
    default:         return { cls: 'bg-slate-100 text-slate-600 border-slate-200',      dot: 'bg-slate-400'   };
  }
};

const ActiviteDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { canEdit } = usePermission(MODULE_CODES.CALENDRIER);
  const [activite,      setActivite]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [validating,    setValidating]    = useState(false);
  const [linkedProject, setLinkedProject] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res  = await axios.get(`/activites/${id}`);
        const data = res.data?.data || res.data;
        setActivite(data);
        if (!data?.projet) {
          const ref = data?.ID_Projet || data?.Nf;
          if (ref) {
            try { const pr = await axios.get(`/projets/${ref}`); setLinkedProject(pr.data?.data || pr.data || null); }
            catch { setLinkedProject(null); }
          }
        } else { setLinkedProject(data.projet); }
      } catch { toast.error("Impossible de charger l'activité"); }
      finally  { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!activite) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="h-14 w-14 bg-slate-100 rounded-2xl flex items-center justify-center">
        <ChatBubbleLeftEllipsisIcon className="h-7 w-7 text-slate-300" />
      </div>
      <p className="text-slate-500 font-semibold">Activité introuvable</p>
      <button onClick={() => navigate('/activites')} className="px-4 py-2 bg-[#0062AF] text-white rounded-lg text-sm font-semibold">Retour</button>
    </div>
  );

  const date        = activite.Date_Activite ? new Date(activite.Date_Activite) : null;
  const projectInfo = linkedProject || activite.projet || null;
  const projectId   = projectInfo?.ID_Projet || activite.ID_Projet || null;
  const isValidated = Number(activite.Valide) === 1 || activite.Statut === 'Terminé';
  const cfg         = getCfg(activite.Type_Activite);
  const stsCfg      = getStatus(activite.Statut);
  const TypeIcon    = cfg.Icon;

  const handleValidate = async () => {
    setValidating(true);
    try {
      const res = await axios.patch(`/activites/${id}/validate`);
      setActivite(res.data || res);
      toast.success('Activité validée');
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setValidating(false); }
  };

  const goBack = () => {
    const fc = location.state?.fromClientId;
    if (fc) navigate(`/clients/${fc}`);
    else if (location.state?.from === 'calendar') navigate('/calendar');
    else navigate('/activites');
  };

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-4">

      {/* ── Nav ── */}
      <div className="flex items-center justify-between py-1">
        <button onClick={goBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group">
          <span className="h-8 w-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:border-slate-300 transition-all">
            <ArrowLeftIcon className="h-4 w-4" />
          </span>
          Retour
        </button>
        <div className="flex items-center gap-2">
          {!isValidated && (
            <button onClick={handleValidate} disabled={validating}
              className="inline-flex items-center gap-1.5 h-9 px-4 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-60 transition-colors">
              <CheckCircleIcon className="h-4 w-4" />
              {validating ? '…' : 'Valider'}
            </button>
          )}
          {activite.ID_Projet && (
            <button onClick={() => navigate(`/projets/${activite.ID_Projet}`)}
              className="inline-flex items-center gap-1.5 h-9 px-4 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors">
              <BriefcaseIcon className="h-4 w-4" />
              Projet
            </button>
          )}
          {(isAdmin || canEdit) && !isValidated && (
            <button onClick={() => navigate(`/activites/edit/${activite.ID_Activite}`, { state: location.state })}
              className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#0062AF] hover:bg-[#004a85] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
              <PencilSquareIcon className="h-4 w-4" />
              Modifier
            </button>
          )}
        </div>
      </div>

      {/* ══ Hero ══ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Trait couleur type */}
        <div className="h-1" style={{ backgroundColor: cfg.color }} />

        <div className="px-8 py-7">
          <div className="flex items-start gap-5">

            {/* Icône */}
            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 ${cfg.bg} ${cfg.border}`}>
              <TypeIcon className={`h-8 w-8 ${cfg.text}`} />
            </div>

            {/* Titre + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  {/* Type + status badges */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      {activite.Type_Activite}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${stsCfg.cls}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${stsCfg.dot}`} />
                      {activite.Statut || '—'}
                    </span>
                    {isValidated && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckSolid className="h-3 w-3" /> Validée
                      </span>
                    )}
                  </div>

                  {/* Nom principal */}
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {activite.Type_Activite}
                    {activite.tiers?.Raisoc && (
                      <span className="text-slate-400 font-normal"> — {activite.tiers.Raisoc}</span>
                    )}
                  </h1>
                </div>

                {/* Date heure */}
                {date && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-400 capitalize">
                      {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-lg font-bold text-slate-700 tabular-nums mt-0.5">
                      {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                {activite.tiers?.Raisoc && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                    <BuildingOfficeIcon className="h-3.5 w-3.5 text-[#0062AF]" />
                    {activite.tiers.Raisoc}
                  </span>
                )}
                {activite.utilisateur?.FullName && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                    <UserIcon className="h-3.5 w-3.5 text-violet-500" />
                    {activite.utilisateur.FullName}
                  </span>
                )}
                {projectInfo?.Nom_Projet && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                    <BriefcaseIcon className="h-3.5 w-3.5 text-amber-500" />
                    {projectInfo.Nom_Projet}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Grid contenu ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Main 2/3 */}
        <div className="lg:col-span-2 space-y-4">

          {/* Description */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
              <TypeIcon className={`h-4 w-4 ${cfg.text}`} />
              <h2 className="text-sm font-semibold text-slate-800">Description</h2>
            </div>
            <div className="px-6 py-5 min-h-[220px]">
              {activite.Description
                ? <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{activite.Description}</p>
                : <p className="text-sm text-slate-300 italic">Aucune description fournie.</p>
              }
            </div>
          </div>

          {/* Statut validation */}
          {isValidated ? (
            <div className="flex items-center gap-4 px-5 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <CheckSolid className="h-6 w-6 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-700">Activité validée et clôturée</p>
                <p className="text-xs text-emerald-500 mt-0.5">Enregistrée dans le journal CRM.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-5 py-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <div>
                <p className="text-sm font-semibold text-amber-700">En attente de validation</p>
                <p className="text-xs text-amber-500 mt-0.5">Validez pour clôturer cette activité.</p>
              </div>
              <button onClick={handleValidate} disabled={validating}
                className="inline-flex items-center gap-1.5 h-9 px-4 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 flex-shrink-0">
                <CheckCircleIcon className="h-4 w-4" />
                {validating ? '…' : 'Valider'}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar 1/3 */}
        <div className="space-y-4">

          {/* Informations */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-700">Informations</p>
            </div>
            <div className="px-5 py-3 divide-y divide-slate-50">
              {[
                { label: 'Agent',  value: activite.utilisateur?.FullName || 'Collaborateur', Icon: UserIcon,           iconCls: 'bg-violet-50 text-violet-500' },
                { label: 'Client', value: activite.tiers?.Raisoc || '—',                     Icon: BuildingOfficeIcon, iconCls: 'bg-blue-50 text-[#0062AF]', nav: activite.IDTiers ? () => navigate(`/clients/${activite.IDTiers}`) : null },
                { label: 'Date & Heure', value: date ? `${date.toLocaleDateString('fr-FR')} · ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : '—', Icon: CalendarIcon, iconCls: 'bg-slate-100 text-slate-500' },
              ].map(row => (
                <div key={row.label}
                  onClick={row.nav || undefined}
                  className={`flex items-center gap-3 py-3 ${row.nav ? 'cursor-pointer group' : ''}`}>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${row.iconCls}`}>
                    <row.Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{row.label}</p>
                    <p className={`text-sm font-medium text-slate-800 truncate mt-0.5 ${row.nav ? 'group-hover:text-[#0062AF] transition-colors' : ''}`}>
                      {row.value}
                    </p>
                  </div>
                  {row.nav && <ArrowUpRightIcon className="h-3.5 w-3.5 text-slate-300 group-hover:text-[#0062AF] flex-shrink-0 transition-colors" />}
                </div>
              ))}
            </div>
          </div>

          {/* Projet lié */}
          {projectInfo?.Nom_Projet ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-700">Projet lié</p>
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0 text-amber-700 text-base font-black">
                    {(projectInfo.Nom_Projet||'P')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{projectInfo.Nom_Projet}</p>
                    {projectInfo.Code_Pro && (
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{projectInfo.Code_Pro}</p>
                    )}
                  </div>
                </div>
                {projectId && (
                  <button onClick={() => navigate(`/projets/${projectId}`)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-[#0062AF] bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors">
                    <ArrowUpRightIcon className="h-4 w-4" /> Voir le projet
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-700">Projet lié</p>
              </div>
              <div className="flex flex-col items-center py-8 text-center gap-2">
                <BriefcaseIcon className="h-8 w-8 text-slate-200" />
                <p className="text-sm text-slate-400">Aucun projet lié</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiviteDetail;
