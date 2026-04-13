import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeftIcon,
  CheckIcon,
  CalendarIcon,
  ChatBubbleLeftEllipsisIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import axios from '../../app/axios';

const extractArrayPayload = (response) => {
  // L'intercepteur axios retourne déjà response.data, donc traiter directement
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (response?.pagination && Array.isArray(response?.data)) return response.data;
  return [];
};

const getProjetTierReference = (projet) => (
  projet?.IDTiers ||
  projet?.client?.IDTiers ||
  projet?.CodTiers ||
  projet?.client?.CodTiers ||
  ''
);

const projectMatchesTier = (project, tierReference) => {
  if (!tierReference) return true;
  const references = [
    project?.IDTiers,
    project?.client?.IDTiers,
    project?.CodTiers,
    project?.client?.CodTiers,
  ].filter(Boolean).map(String);
  return references.includes(String(tierReference));
};

const normalizeRole = (role) => String(role || '').trim().toLowerCase();

const isAdminRole = (role) => ['admin', 'administrateur'].includes(normalizeRole(role));

const filterTiersLocally = (tiersList, { q, codRepres, prospectOnly }) => {
  const normalizedQ = String(q || '').trim().toLowerCase();
  const normalizedRepres = String(codRepres || '').trim();

  return (tiersList || []).filter((tier) => {
    const matchesQ = !normalizedQ || [tier?.Raisoc, tier?.CodTiers, tier?.Email, tier?.Tel]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQ));

    const matchesRepres = !normalizedRepres || String(tier?.codRepresTiers || '') === normalizedRepres;
    const isProspect = Boolean(tier?.Fictif) || Number(tier?.Niveau || 0) > 0;
    const matchesProspect = !prospectOnly || isProspect;

    return matchesQ && matchesRepres && matchesProspect;
  });
};

const ActiviteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const location = useLocation();
  const defaultProjetId = !isEdit ? location.state?.defaultProjetId : null;
  const defaultTierId = !isEdit ? location.state?.defaultTierId : null;
  const { user } = useSelector((state) => state.auth);
  const isAdminUser = isAdminRole(user?.UserRole);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [tiersLoading, setTiersLoading] = useState(false);

  const [tiers, setTiers] = useState([]);
  const [commercials, setCommercials] = useState([]);
  const [commercialsLoading, setCommercialsLoading] = useState(false);
  const [selectedTierSnapshot, setSelectedTierSnapshot] = useState(null);
  const [allProjets, setAllProjets] = useState([]); // Tous les projets
  const [filteredProjets, setFilteredProjets] = useState([]); // Projets filtrés par client
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [representativeCode, setRepresentativeCode] = useState('');
  const [prospectOnly, setProspectOnly] = useState(false);

  const [formData, setFormData] = useState({
    Type_Activite: 'Appel',
    Description: '',
    Date_Activite: new Date().toISOString().slice(0, 16),
    Statut: 'Planifié',
    IDTiers: '',
    ID_Projet: '',
  });

  const selectedProjetData = useMemo(() => {
    if (!formData.ID_Projet) return null;
    return allProjets.find((p) => String(p.ID_Projet) === String(formData.ID_Projet)) || null;
  }, [allProjets, formData.ID_Projet]);

  const tierOptions = useMemo(() => {
    if (!selectedTierSnapshot) return tiers;
    const hasSelected = tiers.some((item) => String(item.IDTiers || item.CodTiers) === String(selectedTierSnapshot.IDTiers || selectedTierSnapshot.CodTiers));
    return hasSelected ? tiers : [selectedTierSnapshot, ...tiers];
  }, [tiers, selectedTierSnapshot]);

  const formatBudget = (value) => {
    if (value === null || value === undefined || value === '') return '--';
    const parsed = Number(String(value).replace(',', '.'));
    if (Number.isNaN(parsed)) return String(value);
    return new Intl.NumberFormat('fr-FR').format(parsed);
  };

  const formatDateOnly = (value) => {
    if (!value) return '--';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '--';
    return d.toLocaleDateString('fr-FR');
  };

  // Charger les projets au montage
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [projetsRes] = await Promise.all([
          axios.get('/projets', { params: { page: 1, limit: 100 } }),
        ]);

        const projetsData = extractArrayPayload(projetsRes);

        setAllProjets(projetsData);

        if (!isEdit && (defaultProjetId || defaultTierId)) {
          let initialTierId = defaultTierId || '';
          let initialProjetId = '';
          let projetsPourClient = projetsData;

          if (defaultProjetId) {
            const selectedProjet = projetsData.find(
              (p) => String(p.ID_Projet) === String(defaultProjetId)
            );
            const projetClientId = getProjetTierReference(selectedProjet) || initialTierId;

            initialProjetId = String(defaultProjetId);
            initialTierId = projetClientId || initialTierId;

            if (projetClientId) {
              projetsPourClient = projetsData.filter(
                (p) => projectMatchesTier(p, projetClientId)
              );
            }
          } else if (initialTierId) {
            projetsPourClient = projetsData.filter(
              (p) => projectMatchesTier(p, initialTierId)
            );
          }

          setFilteredProjets(projetsPourClient);
          setFormData((prev) => ({
            ...prev,
            IDTiers: initialTierId || prev.IDTiers,
            ID_Projet: initialProjetId || prev.ID_Projet,
          }));
        } else {
          setFilteredProjets(projetsData); // Par défaut, afficher tous les projets
        }
      } catch (error) {
        console.error('Error fetching lookups for activite form:', error);
      }
    };

    fetchLookups();
  }, [defaultProjetId, defaultTierId, isEdit]);

  useEffect(() => {
    const fetchCommercials = async () => {
      try {
        setCommercialsLoading(true);
        const response = await axios.get('/users/commercials/activites-filter', {
          params: {
            moduleCode: 45,
            includeAll: isAdminUser ? 1 : undefined
          }
        });

        const rows = extractArrayPayload(response);
        const mapped = rows.map((row) => ({
          userId: String(row.userId || row.UserID || row.value || ''),
          label: row.label || row.fullName || row.FullName || row.login || row.LoginName || 'Commercial'
        })).filter((row) => row.userId);

        setCommercials(mapped);

        const isCommercialUser = normalizeRole(user?.UserRole) === 'commercial' || normalizeRole(user?.UserRole) === 'commerciale';
        if (isCommercialUser && user?.UserID) {
          setRepresentativeCode(String(user.UserID));
        }
      } catch (error) {
        console.error('Error fetching commercials for activities:', error);
      } finally {
        setCommercialsLoading(false);
      }
    };

    fetchCommercials();
  }, [isAdminUser, user?.UserID, user?.UserRole]);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        setTiersLoading(true);
        const response = await axios.get('/activites/tiers-lookup', {
          params: {
            q: clientSearchTerm || undefined,
            codRepres: representativeCode || undefined,
            prospectOnly: prospectOnly ? 1 : undefined,
            limit: 40
          }
        });
        const lookupData = extractArrayPayload(response);

        if (Array.isArray(lookupData) && lookupData.length > 0) {
          setTiers(lookupData);
          return;
        }

        // Fallback when endpoint is degraded or returns empty unexpectedly.
        const fallbackRes = await axios.get('/tiers', { params: { page: 1, limit: 200 } });
        const fallbackList = extractArrayPayload(fallbackRes);
        const filteredFallback = filterTiersLocally(fallbackList, {
          q: clientSearchTerm,
          codRepres: representativeCode,
          prospectOnly
        }).slice(0, 40);

        setTiers(filteredFallback.map((item) => ({
          ...item,
          isProspect: Boolean(item?.Fictif) || Number(item?.Niveau || 0) > 0
        })));
      } catch (error) {
        console.error('Error searching tiers for activities:', error);
        toast.error('Recherche client temporairement indisponible');
      } finally {
        setTiersLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [clientSearchTerm, representativeCode, prospectOnly, isAdminUser]);

  useEffect(() => {
    const fetchActivite = async () => {
      if (!isEdit) return;
      try {
        const response = await axios.get(`/activites/${id}`);
        const activite = response.data?.data || response.data;

        setFormData({
          Type_Activite: activite.Type_Activite || 'Appel',
          Description: activite.Description || '',
          Date_Activite: activite.Date_Activite
            ? new Date(activite.Date_Activite).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16),
          Statut: activite.Statut || 'Planifié',
          IDTiers: activite.IDTiers || '',
          ID_Projet: activite.ID_Projet || '',
        });

        if (activite?.tiers) {
          const tierSnapshot = {
            IDTiers: activite.tiers.IDTiers,
            CodTiers: activite.tiers.CodTiers,
            Raisoc: activite.tiers.Raisoc,
            codRepresTiers: activite.tiers.codRepresTiers,
            isProspect: false
          };
          setSelectedTierSnapshot(tierSnapshot);
          setClientSearchTerm(activite.tiers.Raisoc || activite.tiers.CodTiers || '');
        }
      } catch (error) {
        console.error('Error fetching activite:', error);
        toast.error("Impossible de charger l'activité");
        navigate('/activites');
      } finally {
        setLoading(false);
      }
    };

    fetchActivite();
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClientChange = (e) => {
    const { value } = e.target;
    const selectedTier = tierOptions.find((t) => String(t.IDTiers || t.CodTiers) === String(value)) || null;

    if (selectedTier) {
      setSelectedTierSnapshot(selectedTier);
      setClientSearchTerm(selectedTier.Raisoc || selectedTier.CodTiers || '');
    }

    const clientProjets = value
      ? allProjets.filter((p) => projectMatchesTier(p, value))
      : allProjets;
      
    setFilteredProjets(clientProjets);
    
    // Mettre à jour le formulaire
    setFormData(prev => ({
      ...prev,
      IDTiers: value,
      // Si le projet actuel n'appartient pas au client sélectionné, on le vide
      ID_Projet: value && prev.ID_Projet 
        ? (clientProjets.some(p => p.ID_Projet === prev.ID_Projet) ? prev.ID_Projet : '')
        : prev.ID_Projet
    }));
  };

  const handleCommercialChange = (value) => {
    setRepresentativeCode(value);

    // Reset selected client/project when switching commercial,
    // so the next selection always belongs to the chosen portfolio.
    setSelectedTierSnapshot(null);
    setFormData((prev) => ({
      ...prev,
      IDTiers: '',
      ID_Projet: ''
    }));
    setFilteredProjets(allProjets);
  };

  const handleProjetChange = (e) => {
    const { value } = e.target;
    
    if (!value) {
      setFormData(prev => ({ ...prev, ID_Projet: '', IDTiers: '' }));
      return;
    }
    
    const selectedProjet = allProjets.find((p) => 
      String(p.ID_Projet) === String(value)
    );

    const projetClientId = getProjetTierReference(selectedProjet);

    setFormData(prev => ({
      ...prev,
      ID_Projet: value,
      IDTiers: projetClientId
    }));

    if (projetClientId) {
      const clientProjets = allProjets.filter((p) => projectMatchesTier(p, projetClientId));
      setFilteredProjets(clientProjets);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const selectedProjet = allProjets.find(
        (p) => String(p.ID_Projet) === String(formData.ID_Projet)
      );
      const payload = {
        ...formData,
        ID_Projet: formData.ID_Projet || selectedProjet?.ID_Projet || '',
        Nf: selectedProjet?.nf ?? null
      };

      if (isEdit) {
        await axios.put(`/activites/${id}`, payload);
        toast.success("Activité mise à jour");
      } else {
        await axios.post('/activites', payload);
        toast.success('Activité créée avec succès');
      }
      
      if (location.state?.from === 'calendar') {
        navigate('/calendar');
      } else {
        navigate('/activites');
      }
    } catch (error) {
      console.error('Error saving activite:', error);
      const message = error.response?.data?.message || "Erreur lors de l'enregistrement";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in min-h-screen pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate(-1)}
            className="group h-12 w-12 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 rounded-2xl transition-all shadow-soft flex items-center justify-center"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-primary">
                <SparklesIcon className="h-3 w-3 mr-1" />
                Journal d'activités
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              {isEdit ? 'Modifier une activité' : 'Nouvelle activité'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => location.state?.from === 'calendar' ? navigate('/calendar') : navigate('/activites')}
            className="btn-outline"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-soft-primary flex items-center gap-2"
          >
            {saving ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <CheckIcon className="h-4 w-4 stroke-[2.5]" />
            )}
            <span>{isEdit ? 'Enregistrer' : 'Enregistrer'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="card-luxury p-0 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/80 to-transparent flex items-center gap-4">
              <div className="icon-shape icon-shape-sm shadow-glow-blue">
                <ChatBubbleLeftEllipsisIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Détails de l'interaction</h2>
                <p className="text-xs text-slate-500">Canal, description et statut de l'activité</p>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label-modern">Canal de contact *</label>
                  <select
                    name="Type_Activite"
                    value={formData.Type_Activite}
                    onChange={handleChange}
                    className="input-modern h-12 py-0"
                    required
                  >
                    <option>Appel</option>
                    <option>Email</option>
                    <option>Visite</option>
                    <option>Réunion</option>
                    <option>Note</option>
                  </select>
                </div>
                <div>
                  <label className="label-modern">Statut *</label>
                  <select
                    name="Statut"
                    value={formData.Statut}
                    onChange={handleChange}
                    className="input-modern h-12 py-0"
                    required
                  >
                    <option>Planifié</option>
                    <option>En cours</option>
                    <option>Terminé</option>
                    <option>Annulé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label-modern">Description</label>
                <textarea
                  name="Description"
                  value={formData.Description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Notez les points clés de l'échange..."
                  className="input-modern resize-none"
                />
              </div>

              <div>
                <label className="label-modern">Horodatage précis *</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="datetime-local"
                    name="Date_Activite"
                    value={formData.Date_Activite}
                    onChange={handleChange}
                    className="input-modern pl-12"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="card-luxury p-0 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/80 to-transparent flex items-center gap-3">
              <div className="icon-shape icon-shape-sm bg-slate-800">
                <DocumentTextIcon className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-sm font-bold text-slate-800">Rattachements (optionnels)</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label-modern">
                  {isAdminUser ? 'Filtre par Commercial' : 'Clients'}
                </label>
                {isAdminUser && (
                  <select
                    value={representativeCode}
                    onChange={(e) => handleCommercialChange(e.target.value)}
                    className="input-modern mb-2"
                  >
                    <option value="">Tous les commerciaux</option>
                    {commercials.map((item) => (
                      <option key={item.userId} value={item.userId}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                )}
                {commercialsLoading && isAdminUser && (
                  <p className="text-[11px] text-slate-500 mb-2">Chargement des commerciaux...</p>
                )}
                <input
                  type="text"
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  placeholder="Rechercher par raison sociale, code, email ou tel"
                  className="input-modern mb-2"
                />
                <label className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                  <input
                    type="checkbox"
                    checked={prospectOnly}
                    onChange={(e) => setProspectOnly(e.target.checked)}
                  />
                  Prospects uniquement
                </label>
                <select
                  name="IDTiers"
                  value={formData.IDTiers}
                  onChange={handleClientChange}
                  className="input-modern"
                >
                  <option value="">Aucun client</option>
                  {tierOptions.map(t => (
                    <option key={t.IDTiers || t.CodTiers} value={t.IDTiers || t.CodTiers}>
                      {(t.Raisoc || t.NomTiers || t.CodTiers || t.IDTiers)
                        + (t.CodTiers ? ` (${t.CodTiers})` : '')
                        + (t.isProspect ? ' - Prospect' : '')}
                    </option>
                  ))}
                </select>
                {tiersLoading && (
                  <p className="text-[11px] text-slate-500 mt-1">Recherche clients en cours...</p>
                )}
              </div>

              <div>
                <label className="label-modern">Projet lié</label>
                <select
                  name="ID_Projet"
                  value={formData.ID_Projet}
                  onChange={handleProjetChange}
                  className="input-modern"
                >
                  <option value="">Aucun projet</option>
                  {filteredProjets.map(p => (
                    <option key={p.ID_Projet} value={p.ID_Projet}>
                      {p.Nom_Projet || p.Code_Pro || p.ID_Projet}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProjetData && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                  <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">
                    Attributs du projet
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-400 uppercase tracking-wider">Code</p>
                      <p className="font-semibold text-slate-700">{selectedProjetData.Code_Pro || '--'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase tracking-wider">Titre</p>
                      <p className="font-semibold text-slate-700">{selectedProjetData.Titre_Projet || '--'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase tracking-wider">Nom</p>
                      <p className="font-semibold text-slate-700">{selectedProjetData.Nom_Projet || '--'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase tracking-wider">Phase</p>
                      <p className="font-semibold text-slate-700">{selectedProjetData.Phase || '--'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase tracking-wider">Libelle statut</p>
                      <p className="font-semibold text-slate-700">{selectedProjetData.Libelle_Statut || '--'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase tracking-wider">Priorite</p>
                      <p className="font-semibold text-slate-700">{selectedProjetData.Priorite || '--'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase tracking-wider">Domaine</p>
                      <p className="font-semibold text-slate-700">{selectedProjetData.Domaine || '--'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase tracking-wider">Avancement</p>
                      <p className="font-semibold text-slate-700">
                        {selectedProjetData.Avancement !== undefined && selectedProjetData.Avancement !== null
                          ? `${selectedProjetData.Avancement}%`
                          : '--'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase tracking-wider">Budget alloue</p>
                      <p className="font-semibold text-slate-700">{formatBudget(selectedProjetData.Budget_Alloue)} TND</p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase tracking-wider">Montant devis</p>
                      <p className="font-semibold text-slate-700">{formatBudget(selectedProjetData.Montant_Devis)} TND</p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase tracking-wider">Commercial</p>
                      <p className="font-semibold text-slate-700">
                        {selectedProjetData.Libelle_Commercial || selectedProjetData.Code_Commercial || '--'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase tracking-wider">Contact</p>
                      <p className="font-semibold text-slate-700">
                        {selectedProjetData.Libelle_Contact || selectedProjetData.Code_Contact || '--'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase tracking-wider">Societe</p>
                      <p className="font-semibold text-slate-700">
                        {selectedProjetData.Libelle_Societe || selectedProjetData.IDTiers || '--'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase tracking-wider">Opportunite</p>
                      <p className="font-semibold text-slate-700">{selectedProjetData.Opportunite || '--'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-slate-400 uppercase tracking-wider">Date echeance</p>
                      <p className="font-semibold text-slate-700">{formatDateOnly(selectedProjetData.Date_Echeance)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase tracking-wider">Date devis</p>
                      <p className="font-semibold text-slate-700">{formatDateOnly(selectedProjetData.Date_Devis)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase tracking-wider">Date bon commande</p>
                      <p className="font-semibold text-slate-700">{formatDateOnly(selectedProjetData.Date_Bon_Commande)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase tracking-wider">Reference devis</p>
                      <p className="font-semibold text-slate-700">{selectedProjetData.Reference_Devis || '--'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase tracking-wider">Reference BC</p>
                      <p className="font-semibold text-slate-700">{selectedProjetData.Reference_Bon_Commande || '--'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-slate-400 uppercase tracking-wider">Description</p>
                      <p className="font-semibold text-slate-700 whitespace-pre-wrap">{selectedProjetData.Note_Privee || '--'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ActiviteForm;
