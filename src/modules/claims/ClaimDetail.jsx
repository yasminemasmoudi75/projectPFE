import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftIcon, ClockIcon, UserIcon, DocumentTextIcon,
  CalendarIcon, CheckCircleIcon, ExclamationTriangleIcon,
  ArrowPathIcon, WrenchScrewdriverIcon, PaperAirplaneIcon,
  ChartBarIcon, HashtagIcon, TagIcon, LifebuoyIcon,
  PlusIcon, ShieldCheckIcon, BuildingOfficeIcon, ReceiptPercentIcon,
  ArrowDownTrayIcon, PencilSquareIcon, TrashIcon,
} from '@heroicons/react/24/outline';
import SignaturePad from '../../components/signature/SignaturePad';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../app/axios';
import useAuth from '../../hooks/useAuth';
import SignatureBlock from '../../components/signature/SignatureBlock';

/* ── configs ── */
const STATUS_CFG = {
  Ouvert:     { badge: 'bg-sky-50 text-sky-600 border border-sky-200',             dot: 'bg-sky-400',     bar: 'bg-sky-400',     topBorder: 'border-t-sky-400',     heroBg: 'from-sky-50/40'     },
  Ouverte:    { badge: 'bg-sky-50 text-sky-600 border border-sky-200',             dot: 'bg-sky-400',     bar: 'bg-sky-400',     topBorder: 'border-t-sky-400',     heroBg: 'from-sky-50/40'     },
  'En cours': { badge: 'bg-amber-50 text-amber-600 border border-amber-200',       dot: 'bg-amber-400',   bar: 'bg-amber-400',   topBorder: 'border-t-amber-400',   heroBg: 'from-amber-50/40'   },
  Résolu:     { badge: 'bg-emerald-50 text-emerald-600 border border-emerald-200', dot: 'bg-emerald-400', bar: 'bg-emerald-400', topBorder: 'border-t-emerald-400', heroBg: 'from-emerald-50/40' },
  Fermée:     { badge: 'bg-slate-100 text-slate-500 border border-slate-200',      dot: 'bg-slate-400',   bar: 'bg-slate-400',   topBorder: 'border-t-slate-300',   heroBg: 'from-slate-50/40'   },
};
const getStatusCfg = (s) => STATUS_CFG[s] || { badge: 'bg-slate-50 text-slate-500 border border-slate-200', dot: 'bg-slate-300', bar: 'bg-slate-300', topBorder: 'border-t-slate-200', heroBg: 'from-slate-50/20' };

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
const SideCard = ({ icon: Icon, title, accent, children }) => (
  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white flex items-center gap-2.5">
      {Icon && (
        <div className={`h-7 w-7 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${accent || 'bg-[#e8f1f9] border border-blue-100'}`}>
          <Icon className="h-3.5 w-3.5 text-[#0062AF]" />
        </div>
      )}
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">{title}</p>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

/* ── Avatar ── */
const Avatar = ({ name = '', size = 'md', color = 'slate' }) => {
  const initials = String(name).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const sz = size === 'sm' ? 'h-7 w-7 text-[10px]' : size === 'lg' ? 'h-11 w-11 text-sm' : 'h-9 w-9 text-xs';
  const colors = { slate: 'bg-slate-100 border-slate-200 text-slate-600', blue: 'bg-blue-50 border-blue-200 text-blue-600' };
  return (
    <div className={`${sz} rounded-xl border flex items-center justify-center font-bold flex-none ${colors[color] || colors.slate}`}>
      {initials}
    </div>
  );
};

/* ── PersonCard ── */
const PersonCard = ({ name, subtitle, role, online }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/60 border border-slate-100">
    <div className="relative">
      <Avatar name={name || '?'} size="lg" color="blue" />
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
      )}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-slate-700 truncate">{name || 'Non assigné'}</p>
      {subtitle && <p className="text-[10px] text-slate-400 font-mono truncate">{subtitle}</p>}
      {role && <span className="inline-flex items-center mt-0.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-semibold text-blue-600">{role}</span>}
    </div>
  </div>
);

/* ── Main ── */
const ClaimDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAdmin, isTechnicien, isClient } = useAuth();
  const autoAssignedRef = useRef(false);

  const [claim, setClaim]                 = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [notFound, setNotFound]           = useState(false);
  const [activeTab, setActiveTab]         = useState(searchParams.get('tab') || 'overview');
  const [validating, setValidating]       = useState(false);
  const [downloading, setDownloading]     = useState(false);
  const [favData, setFavData]             = useState(null);
  const [favLoading, setFavLoading]       = useState(false);
  const [showSigPad, setShowSigPad]       = useState(false);
  const [showClientPad, setShowClientPad] = useState(false);

  useEffect(() => { autoAssignedRef.current = false; fetchClaim(); }, [id]);

  useEffect(() => {
    if (claim?.NumFacture && !favData && !favLoading) {
      setFavLoading(true);
      api.get(`/reclamations/${id}/fav`)
        .then(res => setFavData(res.data?.data || {}))
        .catch(() => setFavData({}))
        .finally(() => setFavLoading(false));
    }
  }, [claim?.NumFacture, id, favData]);

  // Auto-assignation : technicien ouvre une réclamation non assignée → assignation automatique
  useEffect(() => {
    if (!claim || !isTechnicien || autoAssignedRef.current || !user?.UserID) return;
    if (!claim.TechnicienID && claim.Statut === 'Ouvert') {
      autoAssignedRef.current = true;
      api.patch(`/reclamations/${id}/assign-technician`, { technicienID: user.UserID })
        .then(() => { toast.success('Vous avez été assigné à cette réclamation'); fetchClaim(); })
        .catch(() => {});
    }
  }, [claim, isTechnicien, user?.UserID]);

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

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const response = await api.get(`/reclamations/${id}/facture/pdf`, { responseType: 'blob' });
      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: 'application/pdf' });
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture_SAV_${claim.NumFacture}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF téléchargé avec succès');
    } catch {
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleValidateAndGenerateInvoice = async () => {
    try {
      setValidating(true);
      const res = await api.patch(`/reclamations/${id}/validate-intervention`);
      if (res?.status === 'success') {
        toast.success(`Facture SAV N°${res.data?.numFacture} générée automatiquement !`);
        fetchClaim();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la génération de la facture');
    } finally {
      setValidating(false);
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

  const validatedInterventions = interventions.filter(itv => Boolean(itv.intervention?.clotured));

  const TABS = [
    { id: 'overview',      label: 'Vue générale',   icon: DocumentTextIcon },
    { id: 'interventions', label: 'Interventions',  icon: WrenchScrewdriverIcon, count: interventions.length },
    ...(claim?.NumFacture ? [{ id: 'facture', label: 'Facture SAV', icon: ReceiptPercentIcon }] : []),
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
      className="space-y-4 pb-12">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/claims')}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#0062AF] transition-colors group">
          <span className="h-8 w-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:border-[#0062AF]/30 transition-all">
            <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          </span>
          <span className="hidden sm:inline">Réclamations</span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={fetchClaim}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <ArrowPathIcon className="h-4 w-4" />
          </button>
          {(isAdmin || isTechnicien) && !isClosed && (
            <button onClick={() => handleStatusUpdate('Résolu')}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all shadow-sm shadow-emerald-500/20">
              <CheckCircleIcon className="h-4 w-4" /> Marquer Résolu
            </button>
          )}
        </div>
      </div>

      {/* ── Hero card ── */}
      <div className={`relative bg-gradient-to-br ${sCfg.heroBg} to-white border border-slate-200/80 border-t-[3px] ${sCfg.topBorder} rounded-2xl shadow-sm overflow-hidden`}>
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #0062AF 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative p-6 flex flex-col lg:flex-row lg:items-start gap-5">

          {/* Gauche : ticket + titre + dates */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0062AF] text-white text-xs font-black font-mono shadow-sm shadow-blue-500/20">
                <HashtagIcon className="h-3.5 w-3.5" />
                {claim.NumTicket || `RM${claim.ID}`}
              </span>
              {claim.TypeReclamation && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 text-slate-500 text-[10px] font-semibold border border-slate-200 shadow-sm">
                  <TagIcon className="h-3 w-3 text-[#0062AF]" /> {claim.TypeReclamation}
                </span>
              )}
            </div>
            <h1 className="text-[26px] font-black text-slate-900 leading-tight mb-3 tracking-tight">
              {claim.Objet || 'Sans objet'}
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <div className="h-5 w-5 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-none shadow-sm">
                  <CalendarIcon className="h-3 w-3 text-slate-400" />
                </div>
                Ouvert le <span className="font-semibold text-slate-600 ml-0.5">{formatDate(claim.DateOuverture)}</span>
              </span>
              {claim.DateModification && (
                <span className="flex items-center gap-1.5 text-slate-400">
                  <div className="h-5 w-5 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-none shadow-sm">
                    <ArrowPathIcon className="h-3 w-3 text-slate-400" />
                  </div>
                  MAJ <span className="font-semibold text-slate-600 ml-0.5">{formatDate(claim.DateModification)}</span>
                </span>
              )}
              {claim.LibTiers && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-500">
                  <BuildingOfficeIcon className="h-3.5 w-3.5 text-[#0062AF] flex-shrink-0" />
                  <span className="font-semibold text-slate-700">{claim.LibTiers}</span>
                </span>
              )}
            </div>
          </div>

          {/* Droite : badges statut + priorité */}
          <div className="flex flex-col items-start lg:items-end gap-2 flex-shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border shadow-sm ${sCfg.badge}`}>
              <span className={`h-2 w-2 rounded-full ${sCfg.dot} animate-pulse`} />
              {claim.Statut || 'Ouvert'}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border shadow-sm ${pCfg.badge}`}>
              <span className={`h-2 w-2 rounded-full ${pCfg.dot}`} />
              {claim.Priorite || 'Normale'}
            </span>
          </div>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Jours ouverts', value: days,                         color: 'text-sky-700',    bg: 'bg-gradient-to-br from-sky-50 to-sky-100/50 border-sky-200',       icon: ClockIcon,             iconBg: 'bg-sky-500', iconCls: 'text-white'    },
          { label: 'Interventions', value: interventions.length,         color: 'text-violet-700', bg: 'bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-200', icon: WrenchScrewdriverIcon, iconBg: 'bg-violet-500', iconCls: 'text-white' },
          { label: 'SLA / Délai',   value: claim.DelaiTraitement || '—', color: 'text-amber-700',  bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200',   icon: ExclamationTriangleIcon, iconBg: 'bg-amber-500', iconCls: 'text-white' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 25 }}
            className={`border rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200 ${s.bg}`}>
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-none shadow-md ${s.iconBg}`}>
              <s.icon className={`h-5 w-5 ${s.iconCls}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{s.label}</p>
              <p className={`text-2xl font-black leading-tight tabular-nums ${s.color}`}>{s.value}</p>
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
                ? 'bg-[#0062AF] text-white shadow-md shadow-[#0062AF]/25'
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

                {/* Bannière facture SAV disponible */}
                {claim?.NumFacture && (
                  <div className="relative overflow-hidden flex items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-emerald-50 to-emerald-100/30 border border-emerald-200 rounded-2xl shadow-sm">
                    <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-emerald-100/50 to-transparent pointer-events-none" />
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500 shadow-md shadow-emerald-500/25 flex items-center justify-center flex-none">
                        <ReceiptPercentIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-800">Réclamation traitée</p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          Facture SAV <span className="font-black font-mono">N°{claim.NumFacture}</span> disponible
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setActiveTab('facture')}
                      className="relative z-10 flex-none h-8 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0">
                      Voir la facture →
                    </button>
                  </div>
                )}

                {/* Description */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
                    <div className="h-7 w-7 rounded-xl bg-[#e8f1f9] border border-blue-100 shadow-sm flex items-center justify-center flex-shrink-0">
                      <DocumentTextIcon className="h-3.5 w-3.5 text-[#0062AF]" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">Description</span>
                  </div>
                  <div className="px-5 py-5">
                    {claim.Description ? (
                      <div className="border-l-[3px] border-[#0062AF]/30 pl-4 py-1 bg-slate-50/40 rounded-r-xl">
                        <p className="text-sm text-slate-600 leading-relaxed">{claim.Description}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 py-2 text-slate-400">
                        <DocumentTextIcon className="h-4 w-4 text-slate-300 flex-none" />
                        <p className="text-sm italic">Aucune description fournie.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Technicien assigné */}
                {claim.NomTechnicien && (
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
                      <div className="h-7 w-7 rounded-xl bg-[#e8f1f9] border border-blue-100 shadow-sm flex items-center justify-center flex-shrink-0">
                        <UserIcon className="h-3.5 w-3.5 text-[#0062AF]" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">Technicien assigné</span>
                      <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {claim.Statut === 'En cours' ? 'En intervention' : 'Assigné'}
                      </span>
                    </div>
                    <div className="px-5 py-4">
                      <PersonCard name={claim.NomTechnicien} role="Technicien SAV" online={claim.Statut === 'En cours'} />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab: Interventions */}
            {activeTab === 'interventions' && (
              <motion.div key="interventions" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center flex-shrink-0">
                        <WrenchScrewdriverIcon className="h-3.5 w-3.5 text-[#0062AF]" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
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
                        className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-[#0062AF] text-white hover:bg-[#004a85] transition-all shadow-sm">
                        <PlusIcon className="h-3.5 w-3.5" /> Planifier
                      </button>
                    )}
                  </div>

                  {(() => {
                    const displayList = interventions;
                    if (displayList.length === 0) return (
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                          <WrenchScrewdriverIcon className="h-7 w-7 text-slate-300" />
                        </div>
                        <p className="text-sm font-semibold text-slate-500">Aucune intervention planifiée</p>
                        <p className="text-xs text-slate-400">Les interventions apparaîtront ici une fois planifiées.</p>
                        {(isAdmin || isTechnicien) && !isClosed && (
                          <button onClick={() => navigate(`/claims/${id}/intervention/new`)}
                            className="mt-1 inline-flex items-center gap-1.5 h-8 px-4 rounded-xl bg-[#0062AF] text-white hover:bg-[#004a85] transition-all shadow-sm">
                            <PlusIcon className="h-3.5 w-3.5" /> Ajouter une intervention
                          </button>
                        )}
                      </div>
                    );
                    return (
                    /* Timeline layout */
                    <div className="px-5 py-4 space-y-0">
                      {displayList.map((itv, i) => {
                        const bt      = itv.intervention;
                        const validated = bt?.clotured === true || bt?.clotured === 1;
                        const rejected  = bt && !bt.encours && !bt.clotured && String(bt.resultat || '').startsWith('Rejeté');
                        const inProgress = bt?.encours === true || bt?.encours === 1;
                        const isLast  = i === interventions.length - 1;
                        const numbt   = bt?.numbt;

                        const statusLabel = validated ? 'Validé' : rejected ? 'Rejeté' : inProgress ? 'En cours' : 'Planifiée';
                        const statusCls   = validated
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : rejected
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : 'bg-amber-50 text-amber-600 border-amber-200';
                        const dotCls = validated ? 'bg-emerald-400' : rejected ? 'bg-rose-400' : 'bg-amber-400';

                        const descText   = itv.descPanne || itv.commentaire || '';
                        const resultat   = bt?.resultat && !String(bt.resultat).startsWith('Rejeté') ? bt.resultat : '';
                        const techName   = bt?.technicien || itv.demandeur || 'Non assigné';
                        const dateVal    = bt?.datbt || itv.datdi;

                        return (
                          <motion.div key={itv.numdi || i}
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="relative flex gap-4">
                            {/* Timeline dot */}
                            <div className="flex flex-col items-center flex-none">
                              <div className={`h-7 w-7 rounded-full border-2 flex items-center justify-center z-10 ${
                                validated ? 'bg-emerald-50 border-emerald-300'
                                : rejected ? 'bg-rose-50 border-rose-300'
                                : 'bg-amber-50 border-amber-300'
                              }`}>
                                {validated
                                  ? <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" />
                                  : rejected
                                  ? <ExclamationTriangleIcon className="h-3.5 w-3.5 text-rose-500" />
                                  : <ClockIcon className="h-3.5 w-3.5 text-amber-500" />
                                }
                              </div>
                              {!isLast && <div className="w-px flex-1 bg-slate-100 mt-1 mb-1" />}
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-5">
                              <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-3.5 hover:border-slate-200 transition-colors">
                                {/* Header row */}
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <div>
                                    <p className="text-xs font-semibold text-slate-700">
                                      {itv.service || 'Intervention SAV'}
                                      {numbt ? <span className="ml-1.5 text-[9px] font-mono text-slate-400">#{numbt}</span> : null}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(dateVal)}</p>
                                  </div>
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-none border ${statusCls}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${dotCls}`} />
                                    {statusLabel}
                                  </span>
                                </div>

                                {/* Description */}
                                {descText && (
                                  <p className="text-xs text-slate-500 leading-relaxed mt-2 mb-1">{descText}</p>
                                )}

                                {/* Résultat technicien */}
                                {resultat && (
                                  <div className="mt-1.5 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-0.5">Rapport</p>
                                    <p className="text-xs text-blue-700">{resultat}</p>
                                  </div>
                                )}

                                {/* Footer : technicien + boutons admin */}
                                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <Avatar name={techName} size="sm" />
                                    <span className="text-[10px] text-slate-500 font-medium">{techName}</span>
                                  </div>

                                  {/* Boutons admin Valider / Rejeter */}
                                  {isAdmin && !validated && !rejected && numbt && (
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={async () => {
                                          try {
                                            await api.patch(`/reclamations/${id}/interventions/${numbt}/validate`, { action: 'validate' });
                                            toast.success('Intervention validée');
                                            fetchClaim();
                                          } catch { toast.error('Erreur lors de la validation'); }
                                        }}
                                        className="h-6 px-2.5 inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all">
                                        <CheckCircleIcon className="h-3 w-3" /> Valider
                                      </button>
                                      <button
                                        onClick={async () => {
                                          try {
                                            await api.patch(`/reclamations/${id}/interventions/${numbt}/validate`, { action: 'reject' });
                                            toast('Intervention rejetée');
                                            fetchClaim();
                                          } catch { toast.error('Erreur lors du rejet'); }
                                        }}
                                        className="h-6 px-2.5 inline-flex items-center gap-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-[10px] font-bold transition-all">
                                        <ExclamationTriangleIcon className="h-3 w-3" /> Rejeter
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                    );
                  })()}
                </div>
              </motion.div>
            )}
            {/* Tab: Facture SAV */}
            {activeTab === 'facture' && claim?.NumFacture && (() => {
              const fmt3 = (n) => Number(n || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
              const ht  = Number(claim.MontantTotal || 0);
              const tva = ht * 0.19;
              const ttc = ht + tva;
              const services = [
                { label: 'Pièces détachées',    ref: 'SAV-PCS', montant: Number(claim.MontantPieces    || 0) },
                { label: 'Frais de déplacement', ref: 'SAV-DEP', montant: Number(claim.FraisDeplacement || 0) },
                { label: "Main d'œuvre",          ref: 'SAV-MO',  montant: Number(claim.MontantMO       || 0) },
              ].filter(s => s.montant > 0);
              return (
                <motion.div key="facture" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-12 py-10">

                      {/* ── Barre d'actions PDF ── */}
                      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                        <p className="text-xs text-slate-400 italic">Facture générée automatiquement par NexusCRM</p>
                        <button
                          onClick={handleDownloadPDF}
                          disabled={downloading}
                          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[#0062AF] hover:bg-[#004a85] disabled:opacity-60 text-white text-xs font-semibold transition-all shadow-sm shadow-blue-500/20">
                          <ArrowDownTrayIcon className="h-4 w-4" />
                          {downloading ? 'Génération…' : 'Télécharger PDF'}
                        </button>
                      </div>

                      {/* ── En-tête société ── */}
                      <div className="flex justify-between items-start mb-10">
                        <div>
                          <h1 className="text-2xl font-black text-slate-900 tracking-tight">AMS-LABO</h1>
                          <div className="text-xs text-slate-400 mt-2 space-y-0.5 leading-relaxed">
                            <p className="text-slate-500">Rue Taher Kammoun · 3000 Sfax, Tunisie</p>
                            <p>Tél : <span className="font-semibold text-slate-600">74 407 194</span></p>
                            <p>Email : <span className="font-semibold text-slate-600">contact@amslabo.com</span></p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-0.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Propulsé par</span>
                          <span className="text-xl font-black text-[#0062AF]">NEXUS</span>
                          <span className="text-[9px] text-slate-400 tracking-widest">CRM Suite</span>
                        </div>
                      </div>

                      {/* ── Titre document ── */}
                      <div className="text-center mb-10">
                        <h2 className="text-[22px] font-black text-slate-900 uppercase tracking-[0.3em]">Facture SAV</h2>
                        <div className="mt-2 mx-auto w-32 h-0.5 bg-gradient-to-r from-transparent via-[#0062AF] to-transparent" />
                      </div>

                      {/* ── Méta + Destinataire ── */}
                      <div className="grid grid-cols-2 gap-12 mb-10 pb-10 border-b border-slate-100">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Détails du document</p>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Référence</span>
                            <span className="font-black text-[#0062AF] font-mono">{claim.NumFacture}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Date</span>
                            <span className="font-semibold text-slate-700">{formatDate(claim.DateOuverture)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Ticket SAV</span>
                            <span className="font-semibold text-slate-700 font-mono">{claim.NumTicket || `RM${claim.ID}`}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Objet</span>
                            <span className="font-semibold text-slate-700 text-right max-w-[160px] line-clamp-1">{claim.Objet}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Destinataire</p>
                          <h3 className="text-xl font-black text-slate-900 leading-tight mb-2">{claim.LibTiers || '—'}</h3>
                          {claim.CodTiers && (
                            <p className="text-xs font-mono text-slate-400">Code : {claim.CodTiers}</p>
                          )}
                        </div>
                      </div>

                      {/* ── Tableau des prestations ── */}
                      <div className="mb-10">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Prestations</p>
                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-28">Réf.</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Désignation</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-16">Qté</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-36">Montant HT</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {services.length > 0 ? services.map((s, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-4 py-4">
                                    <span className="text-xs font-mono font-bold text-slate-400">{s.ref}</span>
                                  </td>
                                  <td className="px-4 py-4">
                                    <p className="text-sm font-semibold text-slate-800">{s.label}</p>
                                  </td>
                                  <td className="px-4 py-4 text-sm font-bold text-slate-700 text-center tabular-nums">1</td>
                                  <td className="px-4 py-4 text-sm font-bold text-slate-900 text-right tabular-nums">
                                    {fmt3(s.montant)} TND
                                  </td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400 italic">
                                    Aucune prestation enregistrée.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* ── Totaux ── */}
                      <div className="flex justify-end mb-10">
                        <div className="w-full sm:w-80 space-y-2">
                          <div className="space-y-2 pb-4 border-b border-slate-200">
                            {[
                              { label: 'Sous-total HT', value: ht },
                              { label: 'TVA (19%)',      value: tva },
                            ].map((row, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{row.label}</span>
                                <span className="text-sm font-bold tabular-nums text-slate-600">{fmt3(row.value)} TND</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-end justify-between pt-2">
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total TTC</p>
                              <p className="text-[11px] text-slate-400">Toutes taxes comprises</p>
                            </div>
                            <div className="text-right">
                              <span className="text-3xl font-black text-[#0062AF] tabular-nums">{fmt3(ttc)}</span>
                              <span className="text-sm font-bold text-slate-400 ml-1.5">TND</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Interventions validées */}
                      {validatedInterventions.length > 0 && (
                        <div className="mb-8 pb-8 border-b border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Interventions réalisées</p>
                          <div className="space-y-2">
                            {validatedInterventions.map((itv, i) => {
                              const bt = itv.intervention;
                              const techName = bt?.technicien || itv.demandeur || '—';
                              const dateVal  = bt?.datbt || itv.datdi;
                              const resultat = bt?.resultat && !String(bt.resultat).startsWith('Rejeté') ? bt.resultat : '';
                              return (
                                <div key={i} className="flex items-start gap-3 px-4 py-3 bg-emerald-50/40 border border-emerald-100 rounded-xl">
                                  <CheckCircleIcon className="h-4 w-4 text-emerald-500 flex-none mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-slate-700">{itv.service || 'Intervention SAV'}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      {formatDate(dateVal)} · Technicien : <span className="font-medium text-slate-500">{techName}</span>
                                    </p>
                                    {resultat && <p className="text-xs text-slate-500 mt-1 italic leading-relaxed">"{resultat}"</p>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* ── Signatures ── */}
                      {favLoading ? (
                        <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-center py-6 text-xs text-slate-400 gap-2">
                          <ArrowPathIcon className="h-4 w-4 animate-spin" /> Chargement des signatures…
                        </div>
                      ) : favData?.guid ? (
                        <SignatureBlock
                          signatureLabel="Signature du responsable"
                          counterLabel="Cachet & Signature client"
                          canSign={isAdmin}
                          apiPath={`/fav/${favData.guid}/signature`}
                          initialSig={favData.signatureData}
                          canCounterSign={isAdmin || isClient}
                          counterApiPath={`/fav/${favData.guid}/client-signature`}
                          initialCounterSig={favData.clientSignatureData}
                        />
                      ) : (
                        <div className="mt-10 pt-8 border-t border-slate-100">
                          <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                            <ArrowPathIcon className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                            <p className="text-xs text-amber-700 flex-1">Signatures indisponibles</p>
                            <button
                              onClick={() => setFavData(null)}
                              className="text-[10px] font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2"
                            >
                              Réessayer
                            </button>
                          </div>
                          <div className="flex items-start justify-between gap-8">
                            {['Signature du responsable', 'Cachet & Signature client'].map((label) => (
                              <div key={label} className="flex-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{label}</p>
                                <div className="w-48 h-20 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center">
                                  <p className="text-[10px] text-slate-300">Indisponible</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── Pied de page ── */}
                      <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                        <p className="text-[11px] text-slate-300 font-medium">NexusCRM — Document généré automatiquement</p>
                        <p className="text-[11px] text-slate-300 font-medium">{claim.NumFacture} · {formatDate(claim.DateOuverture)}</p>
                      </div>

                    </div>
                  </div>
                </motion.div>
              );
            })()}

          </AnimatePresence>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-3 lg:sticky lg:top-6">

          {/* Statut */}
          <SideCard icon={ShieldCheckIcon} title="Statut">
            <div className="space-y-3">
              <div className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border ${sCfg.badge}`}>
                <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${sCfg.dot} animate-pulse`} />
                <span className="text-sm font-bold">{claim.Statut || 'Ouvert'}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progression</span>
                  <span className="text-xs font-black text-slate-700">{progress}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
                    className={`h-full rounded-full ${sCfg.bar} shadow-sm`} />
                </div>
                <p className="text-[10px] text-slate-400 text-right">
                  {interventions.length} intervention{interventions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </SideCard>

          {/* Actions */}
          {(isAdmin || isTechnicien) && (
            <SideCard icon={WrenchScrewdriverIcon} title="Actions rapides" accent="bg-violet-50 border border-violet-100">
              <div className="space-y-2">
                {!isClosed && (
                  <button onClick={() => navigate(`/claims/${id}/intervention/new`)}
                    className="w-full h-9 inline-flex items-center justify-center gap-2 px-3 rounded-xl bg-[#0062AF] hover:bg-[#004a85] text-white text-xs font-bold transition-all shadow-sm shadow-[#0062AF]/25 hover:shadow-[#0062AF]/30 hover:-translate-y-0.5 active:translate-y-0">
                    <WrenchScrewdriverIcon className="h-3.5 w-3.5" /> Nouvelle intervention
                  </button>
                )}
                {!isClosed && (
                  <button onClick={() => handleStatusUpdate('En cours')}
                    className="w-full h-9 inline-flex items-center justify-center gap-2 px-3 rounded-xl border border-amber-200 bg-amber-50 text-xs font-semibold text-amber-700 hover:bg-amber-100 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                    <ArrowPathIcon className="h-3.5 w-3.5" /> Mettre En cours
                  </button>
                )}
                {!isClosed && (
                  <button onClick={() => handleStatusUpdate('Résolu')}
                    className="w-full h-9 inline-flex items-center justify-center gap-2 px-3 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                    <CheckCircleIcon className="h-3.5 w-3.5" /> Marquer Résolu
                  </button>
                )}

                {/* Bouton admin : Valider & Générer Facture SAV */}
                {isAdmin && !isClosed && !claim?.NumFacture && interventions.length > 0 && (
                  <button
                    onClick={handleValidateAndGenerateInvoice}
                    disabled={validating}
                    className="w-full h-9 inline-flex items-center justify-center gap-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-sm shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0">
                    <DocumentTextIcon className="h-3.5 w-3.5" />
                    {validating ? 'Génération...' : 'Valider & Générer Facture SAV'}
                  </button>
                )}

                {isClosed && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-400">
                    <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-400 flex-none" />
                    Réclamation clôturée
                  </div>
                )}

                <button onClick={() => navigate('/claims')}
                  className="w-full h-9 inline-flex items-center justify-center gap-2 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-sm">
                  <ArrowLeftIcon className="h-3.5 w-3.5" /> Retour à la liste
                </button>
              </div>
            </SideCard>
          )}

          {/* ── Carte signatures facture SAV ── */}
          {claim?.NumFacture && (isAdmin || isClient) && (
            <>
              {/* Modals SignaturePad — toujours montés si état actif, indépendants du favData */}
              {showSigPad && favData?.guid && (
                <SignaturePad
                  onSave={async (dataUrl) => {
                    try {
                      await api.patch(`/fav/${favData.guid}/signature`, { signatureData: dataUrl });
                      setFavData(d => ({ ...d, signatureData: dataUrl }));
                      setShowSigPad(false);
                      toast.success('Signature enregistrée');
                    } catch { toast.error('Erreur signature'); setShowSigPad(false); }
                  }}
                  onClose={() => setShowSigPad(false)}
                />
              )}
              {showClientPad && favData?.guid && (
                <SignaturePad
                  onSave={async (dataUrl) => {
                    try {
                      await api.patch(`/fav/${favData.guid}/client-signature`, { signatureData: dataUrl });
                      setFavData(d => ({ ...d, clientSignatureData: dataUrl }));
                      setShowClientPad(false);
                      toast.success('Signature enregistrée');
                    } catch { toast.error('Erreur signature'); setShowClientPad(false); }
                  }}
                  onClose={() => setShowClientPad(false)}
                />
              )}

              <SideCard icon={PencilSquareIcon} title="Signatures">
                {favLoading ? (
                  <div className="flex items-center justify-center py-4 gap-2 text-xs text-slate-400">
                    <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" /> Chargement…
                  </div>
                ) : !favData?.guid ? (
                  <div className="text-center py-3">
                    <p className="text-xs text-slate-400 mb-2">Impossible de charger la facture</p>
                    <button
                      onClick={() => { setFavData(null); }}
                      className="text-[10px] text-[#0062AF] hover:underline"
                    >
                      Réessayer
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Signature responsable — admin only */}
                    {isAdmin && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Responsable</p>
                        {favData.signatureData ? (
                          <div className="relative group inline-block">
                            <img src={favData.signatureData} alt="Signature" className="h-14 max-w-full rounded-xl border border-slate-200 bg-white object-contain shadow-sm" />
                            <button
                              onClick={async () => {
                                await api.delete(`/fav/${favData.guid}/signature`);
                                setFavData(d => ({ ...d, signatureData: null }));
                                toast.success('Signature supprimée');
                              }}
                              className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center rounded-full bg-rose-500 text-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <TrashIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowSigPad(true)}
                            className="w-full h-12 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-[#0062AF]/50 hover:text-[#0062AF] hover:bg-[#f0f7ff] flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer"
                          >
                            <PencilSquareIcon className="h-4 w-4" /> Signer
                          </button>
                        )}
                        {favData.signatureData && (
                          <button onClick={() => setShowSigPad(true)} className="mt-1 text-[10px] text-[#0062AF] hover:underline">Modifier</button>
                        )}
                      </div>
                    )}

                    {/* Signature client — admin ou client */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        {isClient ? 'Votre signature' : 'Signature client'}
                      </p>
                      {favData.clientSignatureData ? (
                        <div className="space-y-2">
                          <div className="relative group inline-block">
                            <img src={favData.clientSignatureData} alt="Signature client" className="h-14 max-w-full rounded-xl border border-slate-200 bg-white object-contain shadow-sm" />
                            {isAdmin && (
                              <button
                                onClick={async () => {
                                  await api.delete(`/fav/${favData.guid}/client-signature`);
                                  setFavData(d => ({ ...d, clientSignatureData: null }));
                                  toast.success('Signature supprimée');
                                }}
                                className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center rounded-full bg-rose-500 text-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <TrashIcon className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <button
                            onClick={() => setShowClientPad(true)}
                            className="w-full h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-[#0062AF]/40 hover:text-[#0062AF] hover:bg-[#f0f7ff] flex items-center justify-center gap-1.5 text-xs font-medium transition-all"
                          >
                            <PencilSquareIcon className="h-3.5 w-3.5" />
                            {isClient ? 'Modifier ma signature' : 'Modifier'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowClientPad(true)}
                          className="w-full h-12 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-[#0062AF]/50 hover:text-[#0062AF] hover:bg-[#f0f7ff] flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          {isClient ? 'Apposer ma signature' : 'Signer'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </SideCard>
            </>
          )}

          {/* ── Carte détails facture SAV ── */}
          {claim?.NumFacture && (
            <SideCard icon={ReceiptPercentIcon} title="Facture SAV" accent="bg-emerald-50 border border-emerald-200">
              <div className="space-y-3">
                {/* Numéro */}
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-emerald-500 flex-none" />
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">N° Facture</span>
                  </div>
                  <span className="text-sm font-black text-emerald-800 font-mono">{claim.NumFacture}</span>
                </div>

                {/* Lignes de coût */}
                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  {[
                    { label: 'Pièces détachées', value: Number(claim.MontantPieces || 0) },
                    { label: 'Frais déplacement', value: Number(claim.FraisDeplacement || 0) },
                    { label: "Main d'œuvre", value: Number(claim.MontantMO || 0) },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between px-3 py-2 text-xs border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <span className="text-slate-500">{row.label}</span>
                      <span className={`font-semibold tabular-nums ${row.value > 0 ? 'text-slate-700' : 'text-slate-300'}`}>
                        {row.value.toFixed(3)} TND
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totaux */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-500">Total HT</span>
                    <span className="font-bold text-slate-700 tabular-nums">
                      {Number(claim.MontantTotal || 0).toFixed(3)} TND
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">TVA (19%)</span>
                    <span className="font-semibold text-slate-500 tabular-nums">
                      {(Number(claim.MontantTotal || 0) * 0.19).toFixed(3)} TND
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-gradient-to-r from-[#0062AF] to-[#0077cc] mt-2 shadow-md shadow-blue-500/15">
                    <span className="text-xs font-bold text-white/80">Total TTC</span>
                    <div className="text-right">
                      <span className="text-base font-black text-white tabular-nums">
                        {(Number(claim.MontantTotal || 0) * 1.19).toFixed(3)}
                      </span>
                      <span className="text-xs font-semibold text-white/70 ml-1">TND</span>
                    </div>
                  </div>
                </div>
              </div>
            </SideCard>
          )}

        </div>
      </div>
    </motion.div>
  );
};

export default ClaimDetail;
