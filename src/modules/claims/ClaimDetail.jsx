import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon, ClockIcon, UserIcon, DocumentTextIcon,
  CalendarIcon, CheckCircleIcon, ExclamationTriangleIcon,
  ArrowPathIcon, WrenchScrewdriverIcon, PaperAirplaneIcon,
  ChartBarIcon, HashtagIcon, TagIcon, LifebuoyIcon,
  PlusIcon, ShieldCheckIcon, BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../app/axios';
import useAuth from '../../hooks/useAuth';

/* ── configs ── */
const STATUS_CFG = {
  Ouvert:     { badge: 'bg-sky-50 text-sky-600 border border-sky-200',             dot: 'bg-sky-400',     bar: 'bg-sky-400'     },
  Ouverte:    { badge: 'bg-sky-50 text-sky-600 border border-sky-200',             dot: 'bg-sky-400',     bar: 'bg-sky-400'     },
  'En cours': { badge: 'bg-amber-50 text-amber-600 border border-amber-200',       dot: 'bg-amber-400',   bar: 'bg-amber-400'   },
  Résolu:     { badge: 'bg-emerald-50 text-emerald-600 border border-emerald-200', dot: 'bg-emerald-400', bar: 'bg-emerald-400' },
  Fermée:     { badge: 'bg-slate-100 text-slate-500 border border-slate-200',      dot: 'bg-slate-400',   bar: 'bg-slate-400'   },
};
const getStatusCfg = (s) => STATUS_CFG[s] || { badge: 'bg-slate-50 text-slate-500 border border-slate-200', dot: 'bg-slate-300', bar: 'bg-slate-300' };

const PRIORITY_CFG = {
  Basse:   { badge: 'bg-slate-50 text-slate-500 border border-slate-200',  dot: 'bg-slate-300'  },
  Normale: { badge: 'bg-slate-100 text-slate-600 border border-slate-200', dot: 'bg-slate-400'  },
  Haute:   { badge: 'bg-amber-50 text-amber-600 border border-amber-200',  dot: 'bg-amber-400'  },
  Urgente: { badge: 'bg-rose-50 text-rose-600 border border-rose-200',     dot: 'bg-rose-400'   },
};
const getPriorityCfg = (p) => PRIORITY_CFG[p] || PRIORITY_CFG.Normale;

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
function daysSince(d) {
  if (!d) return 0;
  return Math.ceil((new Date() - new Date(d)) / 86400000);
}

/* ── InfoRow ── */
const InfoRow = ({ icon: Icon, label, value, mono = false }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
    <div className="h-6 w-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-none">
      <Icon className="h-3.5 w-3.5 text-slate-400" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={`text-xs font-semibold text-slate-700 mt-0.5 truncate ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
  </div>
);

/* ── SideCard ── */
const SideCard = ({ icon: Icon, title, children, accent }) => (
  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
    <div className={`px-4 py-3 border-b flex items-center gap-2 ${accent ? 'bg-sky-50/40 border-sky-100' : 'bg-slate-50/40 border-slate-100'}`}>
      {Icon && <Icon className={`h-3.5 w-3.5 ${accent ? 'text-sky-400' : 'text-slate-400'}`} />}
      <p className={`text-xs font-semibold uppercase tracking-widest ${accent ? 'text-sky-500' : 'text-slate-500'}`}>{title}</p>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

/* ── Avatar ── */
const Avatar = ({ name = '', size = 'md' }) => {
  const initials = String(name).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const sz = size === 'sm' ? 'h-7 w-7 text-[10px]' : size === 'lg' ? 'h-11 w-11 text-sm' : 'h-9 w-9 text-xs';
  return (
    <div className={`${sz} rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold flex-none`}>
      {initials}
    </div>
  );
};

/* ── PersonCard ── */
const PersonCard = ({ name, subtitle, role, online }) => (
  <div className="flex items-center gap-3">
    <div className="relative">
      <Avatar name={name || '?'} size="lg" />
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
      )}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-slate-700 truncate">{name || 'Non assigné'}</p>
      {subtitle && <p className="text-[10px] text-slate-400 font-mono truncate">{subtitle}</p>}
      {role && <p className="text-[10px] text-slate-400 mt-0.5">{role}</p>}
    </div>
  </div>
);

/* ── Main ── */
const ClaimDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isTechnicien } = useAuth();

  const [claim, setClaim]                 = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [notFound, setNotFound]           = useState(false);
  const [activeTab, setActiveTab]         = useState('overview');

  useEffect(() => { fetchClaim(); }, [id]);

  const fetchClaim = async () => {
    try {
      setLoading(true);
      setNotFound(false);
      const res  = await api.get(`/reclamations/${id}`, { silent404: true });
      const data = res?.data?.data ?? res?.data ?? res;
      setClaim(data);
      setInterventions(data?.interventions || []);
    } catch (err) {
      if (err?.response?.status === 404 || !err?.response) setNotFound(true);
    } finally { setLoading(false); }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await api.patch(`/reclamations/${id}/statut`, { statut: newStatus });
      fetchClaim();
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
    }
  };

  /* ── loading ── */
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-[3px] border-slate-100" />
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-sky-400 animate-spin" />
      </div>
      <p className="text-sm text-slate-400 font-medium">Chargement du ticket…</p>
    </div>
  );

  /* ── not found / error ── */
  if (notFound || (!loading && !claim)) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
        <ExclamationTriangleIcon className="h-8 w-8 text-slate-300" />
      </div>
      <p className="text-sm font-semibold text-slate-500">Réclamation introuvable</p>
      <p className="text-xs text-slate-400">Cette réclamation n&apos;existe pas ou a été supprimée.</p>
      <button onClick={() => navigate('/claims')} className="text-xs text-sky-500 font-semibold hover:underline underline-offset-2">
        ← Retour à la liste
      </button>
    </div>
  );

  const isClosed = ['Résolu', 'Fermée'].includes(claim?.Statut);
  const sCfg     = getStatusCfg(claim?.Statut);
  const pCfg     = getPriorityCfg(claim?.Priorite);
  const days     = daysSince(claim?.DateOuverture);
  const progress = isClosed ? 100 : Math.min(99, Math.round((interventions.length / Math.max(interventions.length + 1, 3)) * 100));

  const TABS = [
    { id: 'overview',      label: 'Vue générale',            icon: DocumentTextIcon },
    { id: 'interventions', label: `Interventions`,           icon: WrenchScrewdriverIcon, count: interventions.length },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
      className="space-y-4 pb-12">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/claims')}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
          <ArrowLeftIcon className="h-4 w-4" /> Réclamations
        </button>
        <div className="flex items-center gap-2">
          <button onClick={fetchClaim}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            title="Actualiser">
            <ArrowPathIcon className="h-4 w-4" />
          </button>
          {(isAdmin || isTechnicien) && !isClosed && (
            <button onClick={() => handleStatusUpdate('Résolu')}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-all shadow-sm">
              <CheckCircleIcon className="h-4 w-4" />
              Marquer Résolu
            </button>
          )}
        </div>
      </div>

      {/* ── Hero card ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Sky accent bar */}
        <div className="h-1 w-full bg-sky-400" />
        <div className="p-5 sm:p-6">
          {/* Chips row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold font-mono border border-slate-200">
              <HashtagIcon className="h-3 w-3" />
              {claim.NumTicket || `RM${claim.ID}`}
            </span>
            {claim.TypeReclamation && (
              <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-lg bg-slate-50 text-slate-500 text-[10px] font-semibold border border-slate-200">
                <TagIcon className="h-3 w-3" />
                {claim.TypeReclamation}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[10px] font-semibold ${sCfg.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${sCfg.dot}`} />
              {claim.Statut || 'Ouvert'}
            </span>
            <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[10px] font-semibold ${pCfg.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${pCfg.dot}`} />
              {claim.Priorite || 'Normale'}
            </span>
          </div>
          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-800 leading-snug mb-2">
            {claim.Objet || 'Sans objet'}
          </h1>
          {/* Dates */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              Ouvert le {formatDate(claim.DateOuverture)}
            </span>
            {claim.DateModification && (
              <span className="flex items-center gap-1.5">
                <ArrowPathIcon className="h-3.5 w-3.5" />
                Modifié le {formatDate(claim.DateModification)}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
              <ClockIcon className="h-3.5 w-3.5 text-sky-400" />
              {days} jour{days !== 1 ? 's' : ''} ouvert
            </span>
          </div>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Jours ouverts',  value: days,                         icon: ClockIcon,               iconCls: 'text-sky-500',     iconBg: 'bg-sky-50 border-sky-200'         },
          { label: 'SLA restant',    value: claim.DelaiTraitement || '—', icon: ExclamationTriangleIcon, iconCls: 'text-amber-500',   iconBg: 'bg-amber-50 border-amber-200'     },
          { label: 'Interventions',  value: interventions.length,         icon: WrenchScrewdriverIcon,   iconCls: 'text-violet-500',  iconBg: 'bg-violet-50 border-violet-200'   },
          { label: 'Progression',    value: `${progress}%`,               icon: ChartBarIcon,            iconCls: 'text-emerald-500', iconBg: 'bg-emerald-50 border-emerald-200' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className={`h-9 w-9 rounded-xl border flex items-center justify-center flex-none ${s.iconBg}`}>
              <s.icon className={`h-4 w-4 ${s.iconCls}`} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className="text-xl font-bold text-slate-700 leading-tight tabular-nums">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Tabs row ── */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`inline-flex items-center gap-2 h-8 px-4 rounded-xl text-xs font-semibold transition-all ${
              activeTab === t.id
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}>
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            {t.count !== undefined && (
              <span className={`inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold ${
                activeTab === t.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-5 items-start">

        {/* Main content */}
        <div>
          <AnimatePresence mode="wait">

            {/* Tab: Vue générale */}
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                className="space-y-4">

                {/* Description */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/40">
                    <DocumentTextIcon className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Description</span>
                  </div>
                  <div className="px-5 py-4">
                    {claim.Description ? (
                      <div className="border-l-2 border-sky-200 pl-4">
                        <p className="text-sm text-slate-600 leading-relaxed">{claim.Description}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">Aucune description fournie.</p>
                    )}
                  </div>
                </div>

                {/* Info grid */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/40">
                    <LifebuoyIcon className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Informations du ticket</span>
                  </div>
                  <div className="px-5 py-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                    <InfoRow icon={HashtagIcon}  label="Numéro"            value={claim.NumTicket || `RM${claim.ID}`} mono />
                    <InfoRow icon={TagIcon}       label="Type"              value={claim.TypeReclamation} />
                    <InfoRow icon={CalendarIcon}  label="Date d'ouverture" value={formatDate(claim.DateOuverture)} />
                    <InfoRow icon={CalendarIcon}  label="Dernière MAJ"     value={formatDate(claim.DateModification)} />
                    <InfoRow icon={UserIcon}      label="Technicien"       value={claim.NomTechnicien || 'Non assigné'} />
                    <InfoRow icon={BuildingOfficeIcon} label="Client"      value={claim.LibTiers || claim.CodTiers} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab: Interventions */}
            {activeTab === 'interventions' && (
              <motion.div key="interventions" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/40">
                    <div className="flex items-center gap-2">
                      <WrenchScrewdriverIcon className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                        Interventions
                      </span>
                      {interventions.length > 0 && (
                        <span className="h-5 px-2 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold inline-flex items-center">
                          {interventions.length}
                        </span>
                      )}
                    </div>
                    {(isAdmin || isTechnicien) && !isClosed && (
                      <button onClick={() => navigate(`/claims/${id}/intervention/new`)}
                        className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500 transition-all shadow-sm">
                        <PlusIcon className="h-3.5 w-3.5" /> Planifier
                      </button>
                    )}
                  </div>

                  {interventions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <WrenchScrewdriverIcon className="h-7 w-7 text-slate-300" />
                      </div>
                      <p className="text-sm font-semibold text-slate-500">Aucune intervention planifiée</p>
                      <p className="text-xs text-slate-400">Les interventions apparaîtront ici une fois planifiées.</p>
                      {(isAdmin || isTechnicien) && !isClosed && (
                        <button onClick={() => navigate(`/claims/${id}/intervention/new`)}
                          className="mt-1 inline-flex items-center gap-1.5 h-8 px-4 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500 transition-all shadow-sm">
                          <PlusIcon className="h-3.5 w-3.5" /> Ajouter une intervention
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Timeline layout */
                    <div className="px-5 py-4 space-y-0">
                      {interventions.map((itv, i) => {
                        const done = itv.Statut === 'Terminée';
                        const isLast = i === interventions.length - 1;
                        return (
                          <motion.div key={itv.ID || i}
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="relative flex gap-4">
                            {/* Timeline line */}
                            <div className="flex flex-col items-center flex-none">
                              <div className={`h-7 w-7 rounded-full border-2 flex items-center justify-center z-10 ${
                                done
                                  ? 'bg-emerald-50 border-emerald-300'
                                  : 'bg-amber-50 border-amber-300'
                              }`}>
                                {done
                                  ? <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" />
                                  : <ClockIcon className="h-3.5 w-3.5 text-amber-500" />
                                }
                              </div>
                              {!isLast && <div className="w-px flex-1 bg-slate-100 mt-1 mb-1" />}
                            </div>
                            {/* Content */}
                            <div className={`flex-1 pb-5 ${isLast ? '' : ''}`}>
                              <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-3.5 hover:border-slate-200 transition-colors">
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <div>
                                    <p className="text-xs font-semibold text-slate-700">{itv.Type || 'Intervention'}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(itv.DateIntervention)}</p>
                                  </div>
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-none ${
                                    done
                                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-600 border border-amber-200'
                                  }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${done ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                    {itv.Statut || 'En cours'}
                                  </span>
                                </div>
                                {itv.Description && (
                                  <p className="text-xs text-slate-500 leading-relaxed mt-2 mb-2">{itv.Description}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                                  <Avatar name={itv.NomTechnicien || '?'} size="sm" />
                                  <span className="text-[10px] text-slate-500 font-medium">{itv.NomTechnicien || 'Non assigné'}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-3 lg:sticky lg:top-6">

          {/* Status card */}
          <SideCard icon={ShieldCheckIcon} title="Statut du ticket" accent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Statut actuel</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${sCfg.badge}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${sCfg.dot}`} />
                  {claim.Statut || 'Ouvert'}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Progression</span>
                  <span className="text-xs font-bold text-slate-600">{progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className={`h-full rounded-full ${sCfg.bar}`} />
                </div>
                <p className="text-[10px] text-slate-400">
                  {interventions.length} intervention{interventions.length !== 1 ? 's' : ''} · {days} jour{days !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </SideCard>

          {/* Technicien */}
          <SideCard icon={UserIcon} title="Technicien assigné">
            <PersonCard
              name={claim.NomTechnicien}
              role="Technicien"
              online={claim.Statut === 'En cours'}
            />
          </SideCard>

          {/* Client */}
          <SideCard icon={BuildingOfficeIcon} title="Client">
            <PersonCard
              name={claim.LibTiers || claim.CodTiers}
              subtitle={claim.CodTiers}
              role="Client"
            />
          </SideCard>

          {/* Détails */}
          <SideCard icon={CalendarIcon} title="Détails">
            <div className="divide-y divide-slate-50">
              <InfoRow icon={CalendarIcon}            label="Date d'ouverture" value={formatDate(claim.DateOuverture)} />
              <InfoRow icon={ClockIcon}               label="Délai traitement" value={claim.DelaiTraitement || '—'} />
              <InfoRow icon={ExclamationTriangleIcon} label="Priorité"         value={claim.Priorite || 'Normale'} />
            </div>
          </SideCard>

          {/* Actions */}
          {(isAdmin || isTechnicien) && (
            <SideCard icon={WrenchScrewdriverIcon} title="Actions rapides">
              <div className="space-y-2">
                {!isClosed && (
                  <button onClick={() => navigate(`/claims/${id}/intervention/new`)}
                    className="w-full h-9 flex items-center gap-2 px-3 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500 transition-all shadow-sm">
                    <WrenchScrewdriverIcon className="h-3.5 w-3.5" /> Nouvelle intervention
                  </button>
                )}
                {!isClosed && (
                  <button onClick={() => handleStatusUpdate('En cours')}
                    className="w-full h-9 flex items-center gap-2 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-all">
                    <ArrowPathIcon className="h-3.5 w-3.5" /> Mettre En cours
                  </button>
                )}
                {!isClosed && (
                  <button onClick={() => handleStatusUpdate('Résolu')}
                    className="w-full h-9 flex items-center gap-2 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all">
                    <CheckCircleIcon className="h-3.5 w-3.5" /> Marquer Résolu
                  </button>
                )}
                <button onClick={() => navigate('/claims')}
                  className="w-full h-9 flex items-center gap-2 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all">
                  <ArrowLeftIcon className="h-3.5 w-3.5" /> Retour à la liste
                </button>
              </div>
            </SideCard>
          )}

        </div>
      </div>
    </motion.div>
  );
};

export default ClaimDetail;
