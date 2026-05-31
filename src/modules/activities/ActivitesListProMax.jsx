import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  PlusIcon, MagnifyingGlassIcon, CalendarIcon,
  ChatBubbleLeftEllipsisIcon, PhoneIcon, UserGroupIcon,
  BriefcaseIcon, ClockIcon, MapPinIcon, ChevronRightIcon,
  CheckCircleIcon, EnvelopeIcon, DocumentTextIcon,
  ArrowPathIcon, XMarkIcon, UserIcon, BuildingOfficeIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { fetchActivites, createActivite, validateActivite } from './activiteSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import axios from '../../app/axios';
import usePermission from '../../hooks/usePermission';
import { MODULE_CODES } from '../../utils/constants';
import ActivitePanel from './ActivitePanel';

const extractArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const TYPE_CFG = {
  appel:   { Icon: PhoneIcon,        iconBg: 'bg-emerald-500', badgeCls: 'bg-emerald-50 text-emerald-700', borderCls: 'border-l-emerald-400' },
  email:   { Icon: EnvelopeIcon,     iconBg: 'bg-sky-500',     badgeCls: 'bg-sky-50 text-sky-700',         borderCls: 'border-l-sky-400'     },
  visite:  { Icon: MapPinIcon,       iconBg: 'bg-violet-500',  badgeCls: 'bg-violet-50 text-violet-700',   borderCls: 'border-l-violet-400'  },
  réunion: { Icon: UserGroupIcon,    iconBg: 'bg-indigo-500',  badgeCls: 'bg-indigo-50 text-indigo-700',   borderCls: 'border-l-indigo-400'  },
  reunion: { Icon: UserGroupIcon,    iconBg: 'bg-indigo-500',  badgeCls: 'bg-indigo-50 text-indigo-700',   borderCls: 'border-l-indigo-400'  },
  note:    { Icon: DocumentTextIcon, iconBg: 'bg-amber-500',   badgeCls: 'bg-amber-50 text-amber-700',     borderCls: 'border-l-amber-400'   },
};
const getTypeCfg = t => TYPE_CFG[(t || '').toLowerCase()] ?? {
  Icon: ChatBubbleLeftEllipsisIcon, iconBg: 'bg-slate-400',
  badgeCls: 'bg-slate-100 text-slate-600', borderCls: 'border-l-slate-300',
};

const STATUS_CFG = {
  'Terminé':  { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
  'Planifié': { cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-400'   },
  'En cours': { cls: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-400'    },
};
const getStatusCfg = s => STATUS_CFG[s] ?? { cls: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400' };

const TYPE_TABS = [
  { label: 'Tout',     type: 'All',     Icon: null           },
  { label: 'Appels',   type: 'Appel',   Icon: PhoneIcon      },
  { label: 'Emails',   type: 'Email',   Icon: EnvelopeIcon   },
  { label: 'Réunions', type: 'Réunion', Icon: UserGroupIcon  },
  { label: 'Visites',  type: 'Visite',  Icon: MapPinIcon     },
  { label: 'Notes',    type: 'Note',    Icon: DocumentTextIcon },
];

const ActivitesListProMax = () => {
  const dispatch = useDispatch();
  const { canCreate } = usePermission(MODULE_CODES.VISITES);
  const { activites, loading } = useSelector(s => s.activites);

  const [filterType,         setFilterType]         = useState('All');
  const [searchTerm,         setSearchTerm]         = useState('');
  const [showFilters,        setShowFilters]        = useState(false);
  const [isAddModalOpen,     setIsAddModalOpen]     = useState(false);
  const [panelActiviteId,    setPanelActiviteId]    = useState(null);
  const [refreshing,         setRefreshing]         = useState(false);

  const [tiers,              setTiers]              = useState([]);
  const [selectedTier,       setSelectedTier]       = useState('');
  const [projets,            setProjets]            = useState([]);
  const [selectedProjet,     setSelectedProjet]     = useState('');
  const [commerciaux,        setCommerciaux]        = useState([]);
  const [selectedCommercial, setSelectedCommercial] = useState('');
  const [dateFrom,           setDateFrom]           = useState('');
  const [dateTo,             setDateTo]             = useState('');

  const [newActivity, setNewActivity] = useState({
    Type_Activite: 'Appel', Description: '',
    Date_Activite: new Date().toISOString().slice(0, 16),
    Statut: 'Planifié', IDTiers: '', ID_Projet: '',
  });

  useEffect(() => {
    dispatch(fetchActivites({ page: 1, limit: 50, filters: { valide: 1 } }));
  }, [dispatch]);

  useEffect(() => {
    axios.get('/tiers').then(r => setTiers(extractArrayPayload(r))).catch(() => {});
  }, []);

  useEffect(() => {
    axios.get('/projets', { params: { page: 1, limit: 100 } })
      .then(r => setProjets(extractArrayPayload(r))).catch(() => {});
  }, []);

  useEffect(() => {
    axios.get('/users/commercials/activites-filter').then(r => {
      const raw = extractArrayPayload(r);
      setCommerciaux(
        raw.map(c => ({
          UserID: c.userId || c.UserID,
          FullName: c.fullName || c.FullName || c.label,
          LoginName: c.login || c.LoginName,
        })).sort((a, b) =>
          (a.FullName || '').localeCompare(b.FullName || '', 'fr', { sensitivity: 'base' })
        )
      );
    }).catch(() => {});
  }, []);

  const filteredProjetsForFilters = useMemo(() => {
    if (!selectedTier) return projets;
    return projets.filter(p => p.IDTiers === selectedTier || p.client?.IDTiers === selectedTier);
  }, [projets, selectedTier]);

  const filteredActivites = useMemo(() => activites.filter(a => {
    const q = searchTerm.toLowerCase();
    const d = a.Date_Activite ? new Date(a.Date_Activite) : null;
    return (
      Number(a.Valide) === 1 &&
      (filterType === 'All' || (a.Type_Activite || '').toLowerCase() === filterType.toLowerCase()) &&
      (!q || (a.Description || '').toLowerCase().includes(q) || (a.Type_Activite || '').toLowerCase().includes(q)) &&
      (!selectedTier       || a.IDTiers === selectedTier) &&
      (!selectedProjet     || a.ID_Projet === selectedProjet) &&
      (!selectedCommercial || String(a.utilisateur?.UserID) === selectedCommercial) &&
      (!dateFrom || (d && d >= new Date(dateFrom))) &&
      (!dateTo   || (d && d <= new Date(dateTo)))
    );
  }), [activites, filterType, searchTerm, selectedTier, selectedProjet, selectedCommercial, dateFrom, dateTo]);

  const stats = useMemo(() => ({
    total:      filteredActivites.length,
    done:       filteredActivites.filter(a => a.Statut === 'Terminé').length,
    planned:    filteredActivites.filter(a => a.Statut === 'Planifié').length,
    inProgress: filteredActivites.filter(a => a.Statut === 'En cours').length,
  }), [filteredActivites]);

  const hasActiveFilters = selectedTier || selectedProjet || selectedCommercial || dateFrom || dateTo;

  const handleAddActivity = async e => {
    e.preventDefault();
    try {
      await dispatch(createActivite(newActivity)).unwrap();
      toast.success('Activité créée');
      setIsAddModalOpen(false);
      setNewActivity({
        Type_Activite: 'Appel', Description: '',
        Date_Activite: new Date().toISOString().slice(0, 16),
        Statut: 'Planifié', IDTiers: '', ID_Projet: '',
      });
    } catch {
      toast.error('Erreur lors de la création');
    }
  };

  const refreshActivites = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchActivites({ page: 1, limit: 50, filters: { valide: 1 } }));
      toast.success('Données actualisées');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5 pb-10">

      {/* ── Header ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-[#0062AF] flex items-center justify-center flex-shrink-0">
              <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Journal d'activités</h1>
              <p className="text-sm text-slate-500">Suivez toutes vos interactions clients</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshActivites}
              title="Actualiser"
              className={`h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
            {canCreate && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0062AF] hover:bg-[#004a85] text-white rounded-xl text-sm font-medium transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                Nouvelle activité
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total',      value: stats.total,      Icon: ChatBubbleLeftEllipsisIcon },
          { label: 'Terminées',  value: stats.done,       Icon: CheckCircleIcon            },
          { label: 'Planifiées', value: stats.planned,    Icon: CalendarIcon               },
          { label: 'En cours',   value: stats.inProgress, Icon: ClockIcon                  },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50">
                <s.Icon className="w-5 h-5 text-[#0062AF]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters + Search ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Type tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-3 border-b border-slate-100 overflow-x-auto">
          {TYPE_TABS.map(({ label, type, Icon }) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === type
                  ? 'bg-[#0062AF] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {label}
            </button>
          ))}
          <div className="ml-auto flex-shrink-0 flex items-center gap-2 pl-3">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                hasActiveFilters
                  ? 'bg-blue-50 text-[#0062AF] border border-blue-200'
                  : 'text-slate-500 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <FunnelIcon className="h-3.5 w-3.5" />
              Filtres
              {hasActiveFilters && (
                <span className="h-4 w-4 rounded-full bg-[#0062AF] text-white text-[10px] font-bold flex items-center justify-center">
                  {[selectedTier, selectedProjet, selectedCommercial, dateFrom, dateTo].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par description ou type d'activité…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-[#0062AF] focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        </div>

        {/* Advanced filters (collapsible) */}
        {showFilters && (
          <div className="px-4 py-4 bg-slate-50/60 border-b border-slate-100">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Client</label>
                <select
                  value={selectedTier}
                  onChange={e => setSelectedTier(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-[#0062AF] bg-white"
                >
                  <option value="">Tous</option>
                  {tiers.map(t => (
                    <option key={t.IDTiers} value={t.IDTiers}>{t.Raisoc || t.NomTiers || t.IDTiers}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Projet</label>
                <select
                  value={selectedProjet}
                  onChange={e => setSelectedProjet(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-[#0062AF] bg-white"
                >
                  <option value="">Tous</option>
                  {filteredProjetsForFilters.map(p => (
                    <option key={p.ID_Projet} value={p.ID_Projet}>{p.Nom_Projet || p.Code_Pro}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Commercial</label>
                <select
                  value={selectedCommercial}
                  onChange={e => setSelectedCommercial(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-[#0062AF] bg-white"
                >
                  <option value="">Tous</option>
                  {commerciaux.map(c => (
                    <option key={c.UserID} value={String(c.UserID)}>{c.FullName || c.LoginName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Du</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-[#0062AF]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Au</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-[#0062AF]"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => { setSelectedTier(''); setSelectedProjet(''); setSelectedCommercial(''); setDateFrom(''); setDateTo(''); }}
                className="mt-3 text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Count row ── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-semibold text-slate-500">
          {filteredActivites.length} activité{filteredActivites.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Activity list ── */}
      <div className="space-y-2">
        {filteredActivites.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center py-16 gap-3">
            <ChatBubbleLeftEllipsisIcon className="h-10 w-10 text-slate-200" />
            <p className="text-sm font-semibold text-slate-400">Aucune activité trouvée</p>
            <p className="text-xs text-slate-300">Ajustez vos filtres ou créez une nouvelle activité</p>
          </div>
        ) : (
          filteredActivites.map(a => {
            const tcfg  = getTypeCfg(a.Type_Activite);
            const scfg  = getStatusCfg(a.Statut);
            const TypeI = tcfg.Icon;
            const d     = a.Date_Activite ? new Date(a.Date_Activite) : null;

            return (
              <div
                key={a.ID_Activite}
                onClick={() => setPanelActiviteId(a.ID_Activite)}
                className={`bg-white border border-slate-200 border-l-4 ${tcfg.borderCls} rounded-xl hover:shadow-sm hover:border-slate-300 transition-all cursor-pointer`}
              >
                <div className="px-5 py-4 flex items-center gap-4">
                  {/* Type icon */}
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tcfg.iconBg}`}>
                    <TypeI className="h-5 w-5 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-slate-800">{a.Type_Activite}</span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${scfg.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${scfg.dot}`} />
                        {a.Statut}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-md leading-relaxed">
                      {a.Description || <span className="italic text-slate-300">Sans description</span>}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                      {d && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <CalendarIcon className="h-3 w-3" />
                          {d.toLocaleDateString('fr-FR')}
                          <span className="mx-0.5">·</span>
                          {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {a.utilisateur?.FullName && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <UserIcon className="h-3 w-3" />
                          {a.utilisateur.FullName}
                        </span>
                      )}
                      {a.tiers?.Raisoc && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <BuildingOfficeIcon className="h-3 w-3" />
                          {a.tiers.Raisoc}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRightIcon className="h-4 w-4 text-slate-300 flex-shrink-0" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Side panel ── */}
      {panelActiviteId && (
        <ActivitePanel
          activiteId={panelActiviteId}
          onClose={() => setPanelActiviteId(null)}
        />
      )}

      {/* ── Create modal ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#0062AF] flex items-center justify-center">
                  <PlusIcon className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Nouvelle activité</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="p-6 space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Type</label>
                  <select
                    value={newActivity.Type_Activite}
                    onChange={e => setNewActivity({ ...newActivity, Type_Activite: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#0062AF] focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    {['Appel', 'Email', 'Visite', 'Réunion', 'Note'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Statut</label>
                  <select
                    value={newActivity.Statut}
                    onChange={e => setNewActivity({ ...newActivity, Statut: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#0062AF] focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    {['Planifié', 'En cours', 'Terminé'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Date & Heure</label>
                <input
                  type="datetime-local"
                  value={newActivity.Date_Activite}
                  onChange={e => setNewActivity({ ...newActivity, Date_Activite: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#0062AF] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Client</label>
                  <select
                    value={newActivity.IDTiers || ''}
                    onChange={e => setNewActivity({ ...newActivity, IDTiers: e.target.value, ID_Projet: '' })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#0062AF] focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    <option value="">— Sélectionner —</option>
                    {tiers.map(t => (
                      <option key={t.IDTiers} value={t.IDTiers}>{t.Raisoc || t.NomTiers}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Projet</label>
                  <select
                    value={newActivity.ID_Projet || ''}
                    onChange={e => setNewActivity({ ...newActivity, ID_Projet: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#0062AF] focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    <option value="">— Sélectionner —</option>
                    {projets
                      .filter(p => !newActivity.IDTiers || p.IDTiers === newActivity.IDTiers)
                      .map(p => (
                        <option key={p.ID_Projet} value={p.ID_Projet}>{p.Nom_Projet || p.Code_Pro}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Description</label>
                <textarea
                  value={newActivity.Description}
                  onChange={e => setNewActivity({ ...newActivity, Description: e.target.value })}
                  rows={6}
                  placeholder="Détails de l'activité…"
                  className="w-full px-3 py-3 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#0062AF] focus:ring-2 focus:ring-blue-100 resize-none leading-relaxed"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 h-10 border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-[#0062AF] hover:bg-[#004a85] text-white text-sm font-semibold rounded-lg transition-colors"
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
