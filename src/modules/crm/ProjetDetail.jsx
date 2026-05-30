import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon,
  BriefcaseIcon,
  ClockIcon,
  SparklesIcon,
  ChartBarIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftEllipsisIcon,
  DocumentTextIcon,
  ShoppingCartIcon,
  TruckIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { useDispatch, useSelector } from 'react-redux';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';
import { fetchProjetById, clearCurrentProjet, deleteProjet } from './projetSlice';
import axios from '../../app/axios';
import toast from 'react-hot-toast';
import usePermission from '../../hooks/usePermission';
import { MODULE_CODES } from '../../utils/constants';

const ProjetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { canCreate, canEdit, canDelete } = usePermission(MODULE_CODES.PROJETS);
  const { currentProjet: projet, loading } = useSelector((state) => state.projets);

  const [activitesProjet, setActivitesProjet] = useState([]);
  const [loadingActivites, setLoadingActivites] = useState(false);
  const [errorActivites, setErrorActivites] = useState(null);
  const [activiteTypeFilter, setActiviteTypeFilter] = useState('All');
  const [activiteStatusFilter, setActiviteStatusFilter] = useState('All');
  const [validatingActiviteId, setValidatingActiviteId] = useState(null);

  const [activeDocTab, setActiveDocTab] = useState('devis');
  const [documents, setDocuments] = useState({ devis: [], bcv: [], blv: [], fav: [] });
  const [loadingDocs, setLoadingDocs] = useState(false);

  const DOC_TABS = [
    { id: 'devis', label: 'Devis', icon: DocumentTextIcon },
    { id: 'bcv', label: 'Commandes', icon: ShoppingCartIcon },
    { id: 'blv', label: 'Livraisons', icon: TruckIcon },
    { id: 'fav', label: 'Factures', icon: BanknotesIcon },
  ];

  useEffect(() => {
    if (!projet) return;
    const projetUuid = projet.ID_Projet;
    const codTiers = projet.IDTiers;
    if (!projetUuid && !codTiers) return;

    setLoadingDocs(true);
    const bypass = { includeAll: 'true' };
    const extract = (r) => Array.isArray(r?.data) ? r.data : [];

    // Phase 1 — fetch devis + BCV (linked by CodProject)
    Promise.all([
      projetUuid
        ? axios.get('/devis', { params: { CodProject: projetUuid, limit: 500, ...bypass } }).catch(() => null)
        : Promise.resolve(null),
      projetUuid
        ? axios.get('/bcv', { params: { CodProject: projetUuid, limit: 500, ...bypass } }).catch(() => null)
        : Promise.resolve(null),
    ]).then(async ([d, b]) => {
      const devisList = extract(d);
      const bcvList   = extract(b);

      // Phase 2 — BLV/FAV have no CodProject: resolve via BCV→Nf chain
      const bcvNfs = new Set(bcvList.map(bc => String(bc.Nf)));

      let blvList = [];
      let favList = [];

      if (bcvNfs.size > 0 && codTiers) {
        const [blRes, fRes] = await Promise.all([
          axios.get('/blv', { params: { CodTiers: codTiers, limit: 1000, ...bypass } }).catch(() => null),
          axios.get('/fav', { params: { CodTiers: codTiers, limit: 1000, ...bypass } }).catch(() => null),
        ]);
        blvList = extract(blRes).filter(doc => bcvNfs.has(String(doc.CodDev)));
        favList = extract(fRes).filter(doc => bcvNfs.has(String(doc.CodDev)));
      }

      setDocuments({ devis: devisList, bcv: bcvList, blv: blvList, fav: favList });
    }).finally(() => setLoadingDocs(false));
  }, [projet]);

  const getProgressColor = (percentage) => {
    if (percentage >= 70) return '#10b981'; // Emerald
    if (percentage >= 40) return '#3b82f6'; // Blue
    if (percentage >= 20) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
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

  const handleValidateActivite = async (activiteId) => {
    try {
      setValidatingActiviteId(activiteId);
      const response = await axios.patch(`/activites/${activiteId}/validate`);
      const updatedActivite = response.data || response;

      setActivitesProjet((prev) =>
        prev.map((item) =>
          item.ID_Activite === activiteId
            ? { ...item, ...updatedActivite, Valide: 1, Statut: 'Terminé' }
            : item
        )
      );

      toast.success('Activité validée');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setValidatingActiviteId(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!projet) return <div>Projet non trouvé</div>;

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* Header - Inspired Design */}
      <div className="card-luxury p-8 bg-gradient-to-r from-sky-50 via-white to-violet-50 border-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => {
                const fromClientId = location.state?.fromClientId;
                if (fromClientId) {
                  navigate(`/clients/${fromClientId}`);
                } else {
                  navigate('/projets');
                }
              }}
              className="h-11 w-11 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-all flex items-center justify-center"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-600 text-xs font-medium mb-3">
                <BriefcaseIcon className="h-3 w-3" />
                Détails du Projet
              </div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                {projet.Nom_Projet}
              </h1>
              <p className="text-slate-600 mt-1 flex items-center gap-2 text-sm">
                <BriefcaseIcon className="h-4 w-4 text-sky-500" />
                Client: <span className="font-semibold text-slate-800">{projet.client?.Raisoc || 'N/A'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canEdit && (
              <button
                onClick={() => navigate(`/projets/edit/${id}`)}
                className="px-6 py-2.5 bg-[#0062AF] hover:bg-[#004a85] text-white rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 font-medium"
              >
                <PencilSquareIcon className="h-4 w-4" />
                Modifier
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="px-6 py-2.5 bg-white text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-50 hover:border-rose-300 transition-all flex items-center gap-2 font-medium"
              >
                <TrashIcon className="h-4 w-4" />
                Supprimer
              </button>
            )}
          </div>
        </div>

        {/* Phase & Priority Badges */}
        <div className="flex items-center flex-wrap gap-2 mt-6">
          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider ${
            projet.Phase === 'Clôture' ? 'bg-emerald-100 text-emerald-700' : 
            projet.Phase === 'En cours' ? 'bg-blue-100 text-blue-700' : 
            projet.Phase === 'Planification' ? 'bg-violet-100 text-violet-700' :
            'bg-slate-100 text-slate-700'
          }`}>
            {projet.Phase || 'Nouveau'}
          </span>
          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider ${
            projet.Priorite === 'Haute' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
          }`}>
            {projet.Priorite || 'Normale'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avancement global</p>
            <span className="text-3xl font-bold" style={{ color: getProgressColor(projet.avancement_auto ?? projet.Avancement ?? 0) }}>{projet.avancement_auto ?? projet.Avancement ?? 0}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${projet.avancement_auto ?? projet.Avancement ?? 0}%`, backgroundColor: getProgressColor(projet.avancement_auto ?? projet.Avancement ?? 0) }}
            ></div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-sky-50 to-sky-100/50 p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Budget Alloué</p>
            <p className="text-2xl font-bold text-sky-700">{formatCurrency(projet.budget || projet.Budget_Alloue || 0)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Échéance</p>
            <p className="text-2xl font-bold text-emerald-700">{formatDate(projet.deadline || projet.Date_Echeance)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-violet-50 to-violet-100/50 p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Phase Active</p>
            <p className="text-2xl font-bold text-violet-700">{projet.phase || projet.Phase || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-luxury p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BriefcaseIcon className="h-5 w-5 text-blue-600" />
              Description du Projet
            </h2>
            <p className="text-slate-600 leading-relaxed">{projet.Note_Privee || 'Aucune description disponible.'}</p>
          </div>

          <div className="card-luxury shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50/50 py-4 px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
                    <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Historique des activités</h2>
                    <p className="text-xs text-slate-500">Interactions rattachées à ce projet</p>
                  </div>
                </div>
                {canCreate && (
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
                    className="px-4 py-2 bg-[#0062AF] hover:bg-[#004a85] text-white rounded-xl shadow-md shadow-blue-500/20 transition-all text-sm font-medium"
                  >
                    + Ajouter activité
                  </button>
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <span className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  Filtrer les activités
                </span>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <select
                    value={activiteTypeFilter}
                    onChange={(e) => setActiviteTypeFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
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
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
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
              <div className="space-y-3 activity-history-section">
                {filteredActivitesProjet.map((activite) => {
                  const date = activite.Date_Activite ? new Date(activite.Date_Activite) : null;
                  return (
                    <div
                      key={activite.ID_Activite}
                      className="border border-slate-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-slate-800">
                            {activite.Type_Activite}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                            activite.Statut === 'Terminé' ? 'bg-emerald-100 text-emerald-700' :
                            activite.Statut === 'En cours' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {activite.Statut || 'Planifié'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                          {activite.Description || 'Aucune description'}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          {date && (
                            <>
                              <span className="flex items-center gap-1.5">
                                <ClockIcon className="h-4 w-4 text-slate-400" />
                                {date.toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <CalendarIcon className="h-4 w-4 text-slate-400" />
                                {date.toLocaleDateString('fr-FR')}
                              </span>
                            </>
                          )}
                          <span className="flex items-center gap-1.5">
                            <UserIcon className="h-4 w-4 text-slate-400" />
                            {activite.utilisateur?.FullName || 'Collaborateur'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:self-start">
                        {Number(activite.Valide) !== 1 && (
                          <button
                            type="button"
                            onClick={() => handleValidateActivite(activite.ID_Activite)}
                            disabled={validatingActiviteId === activite.ID_Activite}
                            className="px-4 py-2 text-xs font-bold text-emerald-700 hover:text-white hover:bg-emerald-600 rounded-lg border border-emerald-200 disabled:opacity-60 transition-all"
                          >
                            {validatingActiviteId === activite.ID_Activite ? '...' : 'Valider'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate(`/activites/${activite.ID_Activite}`)}
                          className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition-all"
                        >
                          Détails
                        </button>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => navigate(`/activites/edit/${activite.ID_Activite}`)}
                            className="px-4 py-2 text-xs font-bold text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg border border-blue-200 transition-all"
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
          </div>

          {/* ── Documents commerciaux ── */}
          <div className="card-luxury shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50/50 py-4 px-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <DocumentTextIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Documents commerciaux</h2>
                  <p className="text-xs text-slate-500">Devis, commandes, livraisons et factures liés à ce projet</p>
                </div>
              </div>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                {DOC_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDocTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      activeDocTab === tab.id
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      activeDocTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {documents[tab.id].length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {loadingDocs ? (
                <div className="py-10 text-center text-sm text-slate-400">Chargement…</div>
              ) : documents[activeDocTab].length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-slate-400 italic">Aucun document trouvé</p>
                </div>
              ) : (
                documents[activeDocTab].map(doc => {
                  const isValid = doc.Valid === true || doc.Valid === 1 || doc.Valide === 1;
                  const dateVal = doc.DatUser || doc.MDate;
                  return (
                    <div
                      key={doc.Guid}
                      className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
                          {doc.Prfx || ''}{doc.Nf}
                        </span>
                        <span className="text-sm text-slate-500 truncate">
                          {doc.LibTiers || doc.tiers?.Raisoc || '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {dateVal && (
                          <span className="text-xs text-slate-400 hidden sm:block">
                            {new Date(dateVal).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        <span className="text-sm font-semibold text-slate-800">
                          {formatCurrency(doc.TotTTC || 0)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {isValid ? 'Validé' : 'Brouillon'}
                        </span>
                        <button
                          onClick={() => navigate(`/${activeDocTab}/${doc.Guid}`)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors whitespace-nowrap"
                        >
                          Voir
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {projet.Alerte_IA_Risque && (
            <div className="card-luxury p-6 border-l-4 border-l-rose-500 bg-gradient-to-r from-rose-50 to-white">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-100 rounded-xl">
                  <ExclamationTriangleIcon className="h-6 w-6 text-rose-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-rose-900 font-bold text-base mb-1">⚠️ Alerte IA : Risque Détecté</h4>
                  <p className="text-rose-700 text-sm leading-relaxed">
                    Notre système d'intelligence artificielle a identifié des facteurs de risque sur ce projet. Une attention particulière est recommandée.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="card-luxury p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-blue-600" />
              Résumé du Projet
            </h2>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Budget Alloué</p>
                  <p className="text-xl font-black text-slate-800">{formatCurrency(projet.budget || projet.Budget_Alloue || 0)}</p>
                </div>
              </div>

              <div className="border-t border-slate-100"></div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-emerald-50 rounded-xl">
                  <CalendarIcon className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Échéance Finale</p>
                  <p className="text-lg font-bold text-slate-800">{formatDate(projet.deadline || projet.Date_Echeance)}</p>
                </div>
              </div>

              <div className="border-t border-slate-100"></div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-violet-50 rounded-xl">
                  <BriefcaseIcon className="h-5 w-5 text-violet-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phase Actuelle</p>
                  <p className="text-lg font-bold text-slate-800">{projet.phase || projet.Phase || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t border-slate-100"></div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-amber-50 rounded-xl">
                  <ClockIcon className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priorité</p>
                  <p className="text-lg font-bold text-slate-800">{projet.Priorite || 'Normale'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjetDetail;
