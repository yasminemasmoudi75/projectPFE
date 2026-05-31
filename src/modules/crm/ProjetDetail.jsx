import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeftIcon, CalendarIcon, CurrencyDollarIcon, UserIcon,
  BriefcaseIcon, ClockIcon, PencilSquareIcon, TrashIcon,
  ExclamationTriangleIcon, ChatBubbleLeftEllipsisIcon,
  DocumentTextIcon, ShoppingCartIcon, TruckIcon, BanknotesIcon,
  ArrowUpRightIcon, PlusIcon, PhoneIcon, CheckCircleIcon,
  ChartBarIcon, TagIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid';
import { useDispatch, useSelector } from 'react-redux';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';
import { fetchProjetById, clearCurrentProjet, deleteProjet } from './projetSlice';
import axios from '../../app/axios';
import toast from 'react-hot-toast';
import usePermission from '../../hooks/usePermission';
import { MODULE_CODES } from '../../utils/constants';

/* ── helpers ── */
const phaseConfig = (phase) => {
  const p = (phase || '').toLowerCase();
  if (p.includes('cours'))                           return { cls: 'bg-blue-50 text-[#0062AF] border-blue-200',     color: '#0062AF' };
  if (p.includes('termin') || p.includes('clôtur'))  return { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', color: '#10b981' };
  if (p === 'planification' || p === 'analyse')      return { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',   color: '#4338ca' };
  if (p === 'nouveau')                               return { cls: 'bg-sky-50 text-sky-700 border-sky-200',           color: '#0284c7' };
  if (p === 'tests' || p === 'test')                 return { cls: 'bg-amber-50 text-amber-700 border-amber-200',     color: '#d97706' };
  return { cls: 'bg-slate-100 text-slate-600 border-slate-200', color: '#64748b' };
};
const priorityConfig = (p) => {
  const v = (p || '').toLowerCase();
  if (v === 'haute')   return { cls: 'bg-red-50 text-red-600 border-red-200',       icon: '↑' };
  if (v === 'moyenne') return { cls: 'bg-amber-50 text-amber-600 border-amber-200', icon: '→' };
  return { cls: 'bg-slate-100 text-slate-500 border-slate-200', icon: '↓' };
};
const statusConfig = (s) => {
  const v = (s || '').toLowerCase();
  if (v === 'terminé')  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (v === 'en cours') return 'bg-blue-50 text-[#0062AF] border-blue-200';
  return 'bg-slate-100 text-slate-500 border-slate-200';
};
const ACT_TYPE = {
  Appel:   { Icon: PhoneIcon,                   bg: 'bg-emerald-100', fg: 'text-emerald-700' },
  Email:   { Icon: ChatBubbleLeftEllipsisIcon,   bg: 'bg-blue-100',    fg: 'text-[#0062AF]'   },
  Réunion: { Icon: UserIcon,                    bg: 'bg-violet-100',  fg: 'text-violet-700'  },
  Visite:  { Icon: BriefcaseIcon,               bg: 'bg-rose-100',    fg: 'text-rose-700'    },
};

const TABS = [
  { id: 'devis', label: 'Devis',      Icon: DocumentTextIcon },
  { id: 'bcv',   label: 'Commandes',  Icon: ShoppingCartIcon },
  { id: 'blv',   label: 'Livraisons', Icon: TruckIcon        },
  { id: 'fav',   label: 'Factures',   Icon: BanknotesIcon    },
];

/* ══ Component ══ */
const ProjetDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { canCreate, canEdit, canDelete } = usePermission(MODULE_CODES.PROJETS);
  const { currentProjet: projet, loading } = useSelector(s => s.projets);

  const [activites,     setActivites]     = useState([]);
  const [loadingActs,   setLoadingActs]   = useState(false);
  const [typeFilter,    setTypeFilter]    = useState('All');
  const [statusFilter,  setStatusFilter]  = useState('All');
  const [validatingId,  setValidatingId]  = useState(null);
  const [activeTab,     setActiveTab]     = useState('devis');
  const [docs,          setDocs]          = useState({ devis: [], bcv: [], blv: [], fav: [] });
  const [loadingDocs,   setLoadingDocs]   = useState(false);

  useEffect(() => {
    dispatch(fetchProjetById(id));
    return () => dispatch(clearCurrentProjet());
  }, [dispatch, id]);

  useEffect(() => {
    if (!id) return;
    setLoadingActs(true);
    axios.get('/activites', { params: { projetId: id } })
      .then(r => setActivites(Array.isArray(r.data?.data ?? r.data) ? (r.data?.data ?? r.data) : []))
      .catch(() => {}).finally(() => setLoadingActs(false));
  }, [id]);

  useEffect(() => {
    if (!projet) return;
    const uuid = projet.ID_Projet, ct = projet.IDTiers;
    if (!uuid && !ct) return;
    setLoadingDocs(true);
    const ex = r => Array.isArray(r?.data) ? r.data : [];
    Promise.all([
      uuid ? axios.get('/devis', { params: { CodProject: uuid, limit: 500, includeAll: 'true' } }).catch(() => null) : null,
      uuid ? axios.get('/bcv',   { params: { CodProject: uuid, limit: 500, includeAll: 'true' } }).catch(() => null) : null,
    ]).then(async ([d, b]) => {
      const devis = ex(d), bcv = ex(b);
      const nfs = new Set(bcv.map(x => String(x.Nf)));
      let blv = [], fav = [];
      if (nfs.size > 0 && ct) {
        const [bl, fa] = await Promise.all([
          axios.get('/blv', { params: { CodTiers: ct, limit: 1000, includeAll: 'true' } }).catch(() => null),
          axios.get('/fav', { params: { CodTiers: ct, limit: 1000, includeAll: 'true' } }).catch(() => null),
        ]);
        blv = ex(bl).filter(x => nfs.has(String(x.CodDev)));
        fav = ex(fa).filter(x => nfs.has(String(x.CodDev)));
      }
      setDocs({ devis, bcv, blv, fav });
    }).finally(() => setLoadingDocs(false));
  }, [projet]);

  const types    = useMemo(() => [...new Set(activites.map(a => a.Type_Activite).filter(Boolean))], [activites]);
  const statuses = useMemo(() => [...new Set(activites.map(a => a.Statut).filter(Boolean))], [activites]);
  const filtered = useMemo(() => activites.filter(a =>
    (typeFilter   === 'All' || a.Type_Activite === typeFilter) &&
    (statusFilter === 'All' || a.Statut        === statusFilter)
  ), [activites, typeFilter, statusFilter]);

  const handleDelete = async () => {
    if (!window.confirm('Supprimer ce projet ?')) return;
    try { await dispatch(deleteProjet(id)).unwrap(); navigate('/projets'); }
    catch (e) { alert('Erreur : ' + e.message); }
  };
  const handleValidate = async (actId) => {
    setValidatingId(actId);
    try {
      const res = await axios.patch(`/activites/${actId}/validate`);
      setActivites(prev => prev.map(a =>
        a.ID_Activite === actId ? { ...a, ...(res.data || res), Valide: 1, Statut: 'Terminé' } : a
      ));
      toast.success('Activité validée');
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setValidatingId(null); }
  };

  if (loading) return <LoadingSpinner />;
  if (!projet) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center">
        <BriefcaseIcon className="h-8 w-8 text-slate-300" />
      </div>
      <p className="text-slate-500 font-semibold">Projet non trouvé</p>
      <button onClick={() => navigate('/projets')} className="px-5 py-2 bg-[#0062AF] text-white text-sm font-semibold rounded-xl">
        Retour
      </button>
    </div>
  );

  const pct      = Number(projet.avancement_auto ?? projet.Avancement ?? 0);
  const phase    = phaseConfig(projet.Phase);
  const prior    = priorityConfig(projet.Priorite);
  const daysLeft = projet.Date_Echeance
    ? Math.ceil((new Date(projet.Date_Echeance) - Date.now()) / 86400000)
    : null;
  const isUrgent  = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  const isPast    = daysLeft !== null && daysLeft < 0;
  const doneCnt   = activites.filter(a => a.Statut === 'Terminé' || Number(a.Valide) === 1).length;
  const totalDocs = docs.devis.length + docs.bcv.length + docs.blv.length + docs.fav.length;
  const initials  = (projet.Nom_Projet || 'PR').substring(0, 2).toUpperCase();

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-5">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => location.state?.fromClientId
            ? navigate(`/clients/${location.state.fromClientId}`)
            : navigate('/projets')}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group"
        >
          <span className="h-8 w-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:border-slate-300 transition-all">
            <ArrowLeftIcon className="h-4 w-4" />
          </span>
          Retour aux projets
        </button>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => navigate(`/projets/edit/${id}`)}
              className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#0062AF] text-white text-sm font-semibold rounded-lg hover:bg-[#004a85] transition-colors shadow-sm"
            >
              <PencilSquareIcon className="h-4 w-4" /> Modifier
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 h-9 px-4 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <TrashIcon className="h-4 w-4" /> Supprimer
            </button>
          )}
        </div>
      </div>

      {/* ── IA Alert ── */}
      {projet.Alerte_IA_Risque && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-red-700">
            Alerte IA — des facteurs de risque ont été détectés sur ce projet.
          </p>
        </div>
      )}

      {/* ══ Hero — style ProductDetail ══ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">

        {/* Accent top — identique à ProductDetail */}
        <div className="h-0.5 bg-gradient-to-r from-[#0062AF] via-sky-400 to-teal-400" />

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr]">

          {/* ── Panneau gauche : cercle + phase (style image ProductDetail) ── */}
          <div className="relative flex flex-col items-center justify-center gap-5 min-h-[280px] p-8 border-b lg:border-b-0 lg:border-r border-slate-100 bg-gradient-to-br from-blue-50/40 via-slate-50 to-teal-50/20">

            {/* Dot grid pattern */}
            <div className="absolute inset-0 opacity-[0.035]"
              style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            {/* Cercle de progression */}
            {(() => {
              const r = 52, circ = 2 * Math.PI * r;
              const offset = circ * (1 - pct / 100);
              // Seuils couleur : < 30 rouge · 30-49 amber · ≥ 50 vert
              const color      = pct >= 50 ? '#10b981' : pct >= 30 ? '#f59e0b' : '#ef4444';
              const textColor  = pct >= 50 ? 'text-emerald-600' : pct >= 30 ? 'text-amber-500' : 'text-red-500';
              const trackColor = pct >= 50 ? '#d1fae5' : pct >= 30 ? '#fef3c7' : '#fee2e2';
              const label      = pct === 0 ? 'Non démarré' : pct < 30 ? 'Critique' : pct < 50 ? 'En progression' : pct < 100 ? 'En bonne voie' : 'Terminé';
              return (
                <div className="relative z-10 h-36 w-36">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle cx="60" cy="60" r={r} fill="none" stroke={trackColor} strokeWidth="9" />
                    <circle cx="60" cy="60" r={r} fill="none" stroke={color}
                      strokeWidth="9" strokeLinecap="round"
                      strokeDasharray={circ} strokeDashoffset={offset}
                      style={{ transition: 'stroke-dashoffset 1.2s ease-out, stroke 0.5s ease' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-black tabular-nums leading-none ${textColor}`}>{pct}</span>
                    <span className={`text-xs font-semibold mt-0.5 ${textColor} opacity-70`}>%</span>
                    <span className="text-[10px] font-medium text-slate-400 mt-1 text-center px-2">{label}</span>
                  </div>
                </div>
              );
            })()}

            {/* Phase badge + priorité */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${phase.cls}`}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: phase.color }} />
                {projet.Phase || 'Nouveau'}
              </span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${prior.cls}`}>
                {prior.icon} {projet.Priorite || 'Normale'}
              </span>
              {(isUrgent || isPast) && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border bg-red-50 text-red-600 border-red-200">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {isPast ? 'En retard' : `J-${daysLeft}`}
                </span>
              )}
              {pct >= 100 && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                  <CheckSolid className="h-3.5 w-3.5" /> Terminé
                </span>
              )}
            </div>
          </div>

          {/* ── Panneau droit : info + metric cards (style PriceCard) ── */}
          <div className="p-7 flex flex-col gap-5">

            {/* Badges top */}
            <div className="flex flex-wrap items-center gap-2">
              {projet.Code_Pro && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#0062AF] bg-blue-50 border border-[#0062AF]/20 px-2.5 py-1 rounded-lg">
                  <span className="text-[10px] font-bold text-[#0062AF]/50 uppercase tracking-wider not-italic font-sans mr-0.5">Réf.</span>
                  {projet.Code_Pro}
                </span>
              )}
              {projet.Date_Creation && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                  <CalendarIcon className="h-3 w-3 text-slate-400" />
                  Créé le {formatDate(projet.Date_Creation)}
                </span>
              )}
            </div>

            {/* Titre */}
            <div>
              <h1 className="text-2xl font-black text-slate-900 leading-snug tracking-tight">
                {projet.Nom_Projet}
              </h1>
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <UserIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client</span>
                  <span className="text-slate-300">·</span>
                  <span className="font-semibold text-slate-600">{projet.client?.Raisoc || '—'}</span>
                </span>
              </div>
            </div>

            {projet.Note_Privee && (
              <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 border-l-2 border-[#0062AF]/20 pl-3 italic">
                {projet.Note_Privee}
              </p>
            )}

            <div className="border-t border-slate-100" />

            {/* Metric cards — style PriceCard de ProductDetail */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Budget alloué',
                  value: projet.Budget_Alloue > 0 ? formatCurrency(projet.Budget_Alloue) : '—',
                  unit: 'TND',
                  accent: 'bg-blue-300',
                  textColor: 'text-blue-700',
                },
                {
                  label: 'Échéance',
                  value: projet.Date_Echeance ? formatDate(projet.Date_Echeance) : '—',
                  unit: isUrgent ? `⚠ J-${daysLeft} restants` : isPast ? 'Date dépassée' : 'Date limite',
                  accent: isUrgent || isPast ? 'bg-red-300' : 'bg-teal-300',
                  textColor: isUrgent || isPast ? 'text-red-600' : 'text-teal-700',
                },
                {
                  label: 'Activités',
                  value: activites.length,
                  unit: `${doneCnt} terminée${doneCnt !== 1 ? 's' : ''}`,
                  accent: 'bg-violet-300',
                  textColor: 'text-violet-700',
                },
                {
                  label: 'Documents',
                  value: totalDocs,
                  unit: `${docs.devis.length} devis · ${docs.fav.length} fact.`,
                  accent: 'bg-amber-300',
                  textColor: 'text-amber-700',
                },
              ].map((k, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className={`h-1 ${k.accent}`} />
                  <div className="px-4 py-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{k.label}</p>
                    <p className={`text-xl font-black tabular-nums leading-none ${k.textColor}`}>{k.value}</p>
                    <p className="text-xs text-slate-400 mt-1.5 font-medium">{k.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:items-stretch">

        {/* ── Left 2/3 ── */}
        <div className="lg:col-span-2 flex flex-col gap-5 h-full">

          {/* Activities */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Activités du projet</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activites.length} entrée{activites.length !== 1 ? 's' : ''} · {doneCnt} terminée{doneCnt !== 1 ? 's' : ''}
                </p>
              </div>
              {canCreate && (
                <button
                  onClick={() => navigate('/activites/new', { state: { defaultProjetId: projet.ID_Projet, defaultTierId: projet.client?.IDTiers || projet.IDTiers } })}
                  className="inline-flex items-center gap-1.5 h-8 px-3 bg-[#0062AF] text-white text-xs font-semibold rounded-lg hover:bg-[#004a85] transition-colors"
                >
                  <PlusIcon className="h-3.5 w-3.5" /> Ajouter
                </button>
              )}
            </div>

            {/* Filters */}
            {activites.length > 0 && (
              <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 border-b border-slate-100">
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                  className="h-8 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0062AF]/20 focus:border-[#0062AF]">
                  <option value="All">Tous les types</option>
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="h-8 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0062AF]/20 focus:border-[#0062AF]">
                  <option value="All">Tous les statuts</option>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {(typeFilter !== 'All' || statusFilter !== 'All') && (
                  <button onClick={() => { setTypeFilter('All'); setStatusFilter('All'); }}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors ml-1">
                    Effacer
                  </button>
                )}
              </div>
            )}

            {/* List */}
            {loadingActs ? (
              <div className="flex items-center justify-center py-16 gap-3">
                <div className="h-6 w-6 rounded-full border-2 border-[#0062AF] border-t-transparent animate-spin" />
                <span className="text-sm text-slate-400">Chargement…</span>
              </div>
            ) : activites.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-3 text-center">
                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
                  <ChatBubbleLeftEllipsisIcon className="h-6 w-6 text-slate-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">Aucune activité enregistrée</p>
                  <p className="text-xs text-slate-400 mt-1">Les interactions liées à ce projet apparaîtront ici.</p>
                </div>
                {canCreate && (
                  <button
                    onClick={() => navigate('/activites/new', { state: { defaultProjetId: projet.ID_Projet } })}
                    className="mt-1 px-4 py-2 text-sm font-semibold text-[#0062AF] border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Créer une activité
                  </button>
                )}
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-400">Aucun résultat pour ces filtres.</p>
            ) : (
              <div className="divide-y divide-slate-100 overflow-y-auto flex-1 min-h-0">
                {filtered.map(act => {
                  const date   = act.Date_Activite ? new Date(act.Date_Activite) : null;
                  const isDone = Number(act.Valide) === 1 || act.Statut === 'Terminé';
                  const cfg    = ACT_TYPE[act.Type_Activite] || ACT_TYPE['Email'];
                  const Icon   = cfg.icon || ChatBubbleLeftEllipsisIcon;
                  return (
                    <div key={act.ID_Activite}
                      className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group">

                      {/* Type icon */}
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isDone ? 'bg-emerald-100' : cfg.bg}`}>
                        {isDone
                          ? <CheckSolid className="h-4 w-4 text-emerald-600" />
                          : <Icon className={`h-4 w-4 ${cfg.fg}`} />
                        }
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-semibold text-slate-800">{act.Type_Activite}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusConfig(act.Statut)}`}>
                            {act.Statut || 'Planifié'}
                          </span>
                        </div>
                        {act.Description && (
                          <p className="text-sm text-slate-500 line-clamp-2 mb-1.5">{act.Description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          {date && (
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-3.5 w-3.5" />
                              {date.toLocaleDateString('fr-FR')} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <UserIcon className="h-3.5 w-3.5" />
                            {act.utilisateur?.FullName || 'Collaborateur'}
                          </span>
                        </div>
                      </div>

                      {/* Actions — appear on hover */}
                      <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isDone && (
                          <button
                            onClick={() => handleValidate(act.ID_Activite)}
                            disabled={validatingId === act.ID_Activite}
                            className="h-7 px-3 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-600 hover:text-white hover:border-emerald-600 disabled:opacity-50 transition-all"
                          >
                            {validatingId === act.ID_Activite ? '…' : 'Valider'}
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/activites/${act.ID_Activite}`)}
                          className="h-7 px-3 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          Voir
                        </button>
                        {canEdit && !isDone && (
                          <button
                            onClick={() => navigate(`/activites/edit/${act.ID_Activite}`)}
                            className="h-7 px-3 text-xs font-semibold text-[#0062AF] bg-blue-50 border border-blue-200 rounded-lg hover:bg-[#0062AF] hover:text-white transition-all"
                          >
                            Modifier
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Documents commerciaux</h2>
                <p className="text-xs text-slate-400 mt-0.5">{totalDocs} document{totalDocs !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100">
              {TABS.map(({ id: tid, label, Icon }) => (
                <button key={tid} onClick={() => setActiveTab(tid)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-all ${
                    activeTab === tid
                      ? 'border-[#0062AF] text-[#0062AF]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}>
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                    activeTab === tid ? 'bg-[#0062AF] text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {docs[tid].length}
                  </span>
                </button>
              ))}
            </div>

            {loadingDocs ? (
              <div className="flex items-center justify-center py-12 gap-3">
                <div className="h-6 w-6 rounded-full border-2 border-[#0062AF] border-t-transparent animate-spin" />
              </div>
            ) : docs[activeTab].length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-sm text-slate-400">Aucun document dans cette catégorie</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-y-auto flex-1 min-h-0">
                {docs[activeTab].map(doc => {
                  const valid = doc.Valid === true || doc.Valid === 1 || doc.Valide === 1;
                  return (
                    <div key={doc.Guid}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex-1 flex items-center gap-4 min-w-0">
                        <span className="text-sm font-semibold text-slate-800 font-mono whitespace-nowrap">
                          {doc.Prfx || ''}{doc.Nf}
                        </span>
                        <span className="text-sm text-slate-400 truncate">
                          {doc.LibTiers || doc.tiers?.Raisoc || '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {(doc.DatUser || doc.MDate) && (
                          <span className="text-xs text-slate-400 hidden md:block">
                            {new Date(doc.DatUser || doc.MDate).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        <span className="text-sm font-semibold text-slate-800 tabular-nums">
                          {formatCurrency(doc.TotTTC || 0)}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${valid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          {valid ? 'Validé' : 'Brouillon'}
                        </span>
                        <button onClick={() => navigate(`/${activeTab}/${doc.Guid}`)}
                          className="inline-flex items-center gap-1 h-7 px-3 text-xs font-semibold text-[#0062AF] border border-blue-200 bg-blue-50 hover:bg-[#0062AF] hover:text-white rounded-lg transition-all">
                          Ouvrir <ArrowUpRightIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="flex flex-col gap-5 h-full">

          {/* Fiche projet — non redondant */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">Fiche projet</h2>
            </div>

            {/* Client — shortcut vers la fiche */}
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Client associé</p>
              <button
                onClick={() => projet.IDTiers && navigate(`/clients/${projet.IDTiers}`)}
                className="flex items-center gap-3 w-full group"
              >
                <div className="h-10 w-10 rounded-xl bg-[#e0f0ff] flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-black text-[#0062AF]">
                    {(projet.client?.Raisoc || '?')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-[#0062AF] transition-colors truncate">
                    {projet.client?.Raisoc || 'Client non spécifié'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Voir la fiche client →</p>
                </div>
              </button>
            </div>

            {/* Timeline démarrage → échéance */}
            <div className="px-5 py-4">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Calendrier</p>
              <div className="relative pl-5">
                {/* Ligne verticale */}
                <div className="absolute left-[7px] top-1.5 bottom-1.5 w-px bg-slate-200" />

                {/* Démarrage */}
                <div className="relative mb-4">
                  <div className="absolute -left-5 top-1 h-3 w-3 rounded-full bg-[#0062AF] ring-[3px] ring-white border border-[#0062AF]/20" />
                  <p className="text-[10px] text-slate-400 font-medium">Démarrage</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">
                    {projet.Date_Creation ? formatDate(projet.Date_Creation) : '—'}
                  </p>
                </div>

                {/* Échéance */}
                <div className="relative">
                  <div className={`absolute -left-5 top-1 h-3 w-3 rounded-full ring-[3px] ring-white ${
                    isPast   ? 'bg-red-500 border border-red-300' :
                    isUrgent ? 'bg-amber-500 border border-amber-300' :
                               'bg-slate-300 border border-slate-200'
                  }`} />
                  <p className="text-[10px] text-slate-400 font-medium">Échéance</p>
                  <p className={`text-sm font-semibold mt-0.5 ${
                    isPast ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-slate-700'
                  }`}>
                    {projet.Date_Echeance ? formatDate(projet.Date_Echeance) : 'Non définie'}
                  </p>
                  {isUrgent && !isPast && (
                    <p className="text-[10px] text-amber-500 font-semibold mt-0.5">J-{daysLeft} restants</p>
                  )}
                  {isPast && (
                    <p className="text-[10px] text-red-500 font-semibold mt-0.5">Date dépassée</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pipeline */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">Pipeline commercial</h2>
            </div>
            <div className="px-5 py-4">
              {[
                { label: 'Devis',      count: docs.devis.length, Icon: DocumentTextIcon },
                { label: 'Commandes',  count: docs.bcv.length,   Icon: ShoppingCartIcon },
                { label: 'Livraisons', count: docs.blv.length,   Icon: TruckIcon        },
                { label: 'Factures',   count: docs.fav.length,   Icon: BanknotesIcon    },
              ].map((step, i, arr) => (
                <div key={step.label}>
                  <div className="flex items-center gap-3 py-2.5">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${step.count > 0 ? 'bg-[#e0f0ff]' : 'bg-slate-100'}`}>
                      <step.Icon className={`h-4 w-4 ${step.count > 0 ? 'text-[#0062AF]' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${step.count > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                          {step.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold w-6 text-center ${step.count > 0 ? 'text-[#0062AF]' : 'text-slate-300'}`}>
                            {step.count}
                          </span>
                          {step.count > 0 && <CheckSolid className="h-3.5 w-3.5 text-emerald-500" />}
                        </div>
                      </div>
                    </div>
                  </div>
                  {i < arr.length - 1 && <div className="h-px bg-slate-100 ml-11" />}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProjetDetail;
