import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  XMarkIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, UserIcon,
  BuildingOfficeIcon, BriefcaseIcon, CalendarIcon,
  PencilSquareIcon, CheckCircleIcon, ArrowUpRightIcon,
  DocumentTextIcon, ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid';
import axios from '../../app/axios';
import toast from 'react-hot-toast';

const TYPE_CFG = {
  appel:    { Icon: PhoneIcon,                 bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', bar: '#10b981' },
  email:    { Icon: EnvelopeIcon,              bg: 'bg-sky-500',     light: 'bg-sky-50',     text: 'text-sky-600',     border: 'border-sky-200',     bar: '#0284c7' },
  visite:   { Icon: MapPinIcon,               bg: 'bg-violet-500',  light: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-200',  bar: '#7c3aed' },
  réunion:  { Icon: UserIcon,                 bg: 'bg-indigo-500',  light: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-200',  bar: '#4338ca' },
  reunion:  { Icon: UserIcon,                 bg: 'bg-indigo-500',  light: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-200',  bar: '#4338ca' },
  note:     { Icon: DocumentTextIcon,         bg: 'bg-amber-500',   light: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200',   bar: '#d97706' },
};
const getCfg = t => TYPE_CFG[(t || '').toLowerCase()] ?? {
  Icon: ChatBubbleLeftEllipsisIcon,
  bg: 'bg-slate-400', light: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', bar: '#94a3b8',
};

const STATUS_CFG = {
  terminé:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
  termine:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
  planifié:   { cls: 'bg-amber-50   text-amber-700   border-amber-200',   dot: 'bg-amber-400'   },
  planifie:   { cls: 'bg-amber-50   text-amber-700   border-amber-200',   dot: 'bg-amber-400'   },
  'en cours': { cls: 'bg-blue-50    text-blue-700    border-blue-200',    dot: 'bg-blue-400'    },
};
const getStatus = s => STATUS_CFG[(s || '').toLowerCase()] ?? {
  cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400',
};

const ActivitePanel = ({ activiteId, onClose }) => {
  const navigate    = useNavigate();
  const [activite,   setActivite]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (!activiteId) return;
    setLoading(true);
    setActivite(null);
    (async () => {
      try {
        const res = await axios.get(`/activites/${activiteId}`);
        setActivite(res.data?.data || res.data);
      } catch {
        toast.error("Impossible de charger l'activité");
      } finally {
        setLoading(false);
      }
    })();
  }, [activiteId]);

  const handleValidate = async () => {
    setValidating(true);
    try {
      const res = await axios.patch(`/activites/${activiteId}/validate`);
      setActivite(res.data?.data || res.data || res);
      toast.success('Activité validée');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setValidating(false);
    }
  };

  const cfg         = activite ? getCfg(activite.Type_Activite) : null;
  const TypeIcon    = cfg?.Icon ?? ChatBubbleLeftEllipsisIcon;
  const stsCfg      = activite ? getStatus(activite.Statut) : null;
  const date        = activite?.Date_Activite ? new Date(activite.Date_Activite) : null;
  const isValidated = activite && (Number(activite.Valide) === 1 || activite.Statut === 'Terminé');
  const projectInfo = activite?.projet ?? null;
  const projectId   = projectInfo?.ID_Projet ?? activite?.ID_Projet ?? null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40" onClick={onClose} />

      {/* Centered card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col pointer-events-auto overflow-hidden"
          style={{ maxHeight: '88vh' }}>

          {/* ── Colour bar ── */}
          {cfg && <div className="h-[3px] flex-shrink-0" style={{ backgroundColor: cfg.bar }} />}

          {/* ── Header ── */}
          <div className="flex-shrink-0 flex items-center gap-4 px-6 pt-5 pb-4">
            {/* Icon */}
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg?.bg ?? 'bg-slate-400'}`}>
              <TypeIcon className="h-6 w-6 text-white" />
            </div>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Activité</p>
              <p className="text-base font-bold text-slate-900 leading-tight truncate">
                {activite?.Type_Activite || '—'}
                {activite?.tiers?.Raisoc && (
                  <span className="font-normal text-slate-400"> · {activite.tiers.Raisoc}</span>
                )}
              </p>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-44">
                <div className="h-6 w-6 rounded-full border-2 border-[#0062AF] border-t-transparent animate-spin" />
              </div>
            ) : !activite ? (
              <div className="flex flex-col items-center justify-center h-44 gap-2">
                <ChatBubbleLeftEllipsisIcon className="h-8 w-8 text-slate-200" />
                <p className="text-sm text-slate-400">Activité introuvable</p>
              </div>
            ) : (
              <div className="px-6 pb-2 space-y-4">

                {/* ── Meta row : status + date ── */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${stsCfg.cls}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${stsCfg.dot}`} />
                      {activite.Statut || '—'}
                    </span>
                    {isValidated && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckSolid className="h-3 w-3" /> Validée
                      </span>
                    )}
                  </div>
                  {date && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-[11px] text-slate-400 capitalize">
                        {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-sm font-bold text-slate-700 tabular-nums">
                        {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>

                {/* ── Info grid ── */}
                <div className="grid grid-cols-2 gap-2">
                  {activite.tiers?.Raisoc && (
                    <button
                      onClick={() => activite.IDTiers && navigate(`/clients/${activite.IDTiers}`)}
                      className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                    >
                      <BuildingOfficeIcon className="h-4 w-4 text-[#0062AF] flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Client</p>
                        <p className="text-xs font-semibold text-slate-700 truncate group-hover:text-[#0062AF] transition-colors">
                          {activite.tiers.Raisoc}
                        </p>
                      </div>
                      <ArrowUpRightIcon className="h-3 w-3 text-slate-300 group-hover:text-[#0062AF] flex-shrink-0" />
                    </button>
                  )}
                  {activite.utilisateur?.FullName && (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <UserIcon className="h-4 w-4 text-violet-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Agent</p>
                        <p className="text-xs font-semibold text-slate-700 truncate">{activite.utilisateur.FullName}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Description ── */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                    <DocumentTextIcon className="h-3.5 w-3.5 text-slate-400" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Description</p>
                  </div>
                  <div className="px-4 py-4 min-h-[90px]">
                    {activite.Description ? (
                      <p className="text-sm text-slate-700 leading-relaxed">{activite.Description}</p>
                    ) : (
                      <p className="text-sm text-slate-300 italic">Aucune description renseignée.</p>
                    )}
                  </div>
                </div>

                {/* ── Validation banner ── */}
                {isValidated ? (
                  <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <CheckSolid className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <p className="text-sm font-semibold text-emerald-700">Activité validée et clôturée</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm font-semibold text-amber-700">En attente de validation</p>
                    <button
                      onClick={handleValidate}
                      disabled={validating}
                      className="inline-flex items-center gap-1.5 h-8 px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60 flex-shrink-0"
                    >
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      {validating ? '…' : 'Valider'}
                    </button>
                  </div>
                )}

                {/* ── Projet lié ── */}
                {projectInfo?.Nom_Projet && (
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                      <BriefcaseIcon className="h-3.5 w-3.5 text-slate-400" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Projet lié</p>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 text-sm font-black flex-shrink-0">
                          {(projectInfo.Nom_Projet || 'P')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{projectInfo.Nom_Projet}</p>
                          {projectInfo.Code_Pro && (
                            <p className="text-[11px] text-slate-400 font-mono">{projectInfo.Code_Pro}</p>
                          )}
                        </div>
                      </div>
                      {projectId && (
                        <button
                          onClick={() => navigate(`/projets/${projectId}`)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0062AF] hover:underline flex-shrink-0"
                        >
                          Voir <ArrowUpRightIcon className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* bottom spacing */}
                <div className="h-1" />
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          {activite && (
            <div className="flex-shrink-0 border-t border-slate-100 px-6 py-4 flex gap-3">
              <button
                onClick={() => navigate(`/activites/${activiteId}`)}
                className="h-9 px-4 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Pleine page
              </button>
              <button
                onClick={() => navigate(`/activites/edit/${activiteId}`)}
                className="flex-1 h-9 flex items-center justify-center gap-2 bg-[#0062AF] hover:bg-[#004a85] text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <PencilSquareIcon className="h-4 w-4" />
                Modifier
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default ActivitePanel;
