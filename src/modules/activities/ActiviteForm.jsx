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
  const [members, setMembers] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
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
    Valide: 0,
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

  // Fetch all internal staff (for meeting participants picker)
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await axios.get('/users/members/calendar-filter');
        const rawData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setMembers(
          rawData
            .map((m) => ({
              userId: String(m.userId || m.UserID || m.value || ''),
              label: m.fullName || m.FullName || m.label || m.login || '',
              role: m.role || m.Role || ''
            }))
            .filter((m) => m.userId && String(m.userId) !== String(user?.UserID))
        );
      } catch {
        // non-blocking
      }
    };
    fetchMembers();
  }, [user?.UserID]);

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
          Valide: activite.Valide || 0,
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
  
  const isReadOnly = useMemo(() => isEdit && (Number(formData.Valide) === 1 || formData.Statut === 'Terminé'), [isEdit, formData.Valide, formData.Statut]);

  const toggleParticipant = (userId) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'Type_Activite' && value !== 'Réunion') {
      setSelectedParticipants([]);
    }
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
        Nf: selectedProjet?.nf ?? null,
        participants: selectedParticipants.map(Number)
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
    <div className="animate-fade-in space-y-6 pb-12">
      {/* Header - Inspired Design */}
      <div className="card-luxury p-8 bg-gradient-to-r from-sky-50 via-white to-violet-50 border-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate(-1)}
              className="h-11 w-11 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-all flex items-center justify-center"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-600 text-xs font-medium mb-3">
                <SparklesIcon className="h-3 w-3" />
                Journal CRM
              </div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                {isEdit ? 'Modifier une activité' : 'Nouvelle activité'}
              </h1>
              <p className="text-slate-600 mt-1 text-sm">
                {isEdit ? 'Mettre à jour les détails de l\'interaction' : 'Enregistrer une nouvelle interaction client'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => location.state?.from === 'calendar' ? navigate('/calendar') : navigate('/activites')}
              className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-all"
            >
              Annuler
            </button>
    <button
      onClick={handleSubmit}
      disabled={saving || isReadOnly}
      className="px-6 py-2.5 rounded-xl bg-[#0062AF] hover:bg-[#004a85] text-white font-medium shadow-md shadow-blue-500/20 transition-all disabled:opacity-60 flex items-center gap-2"
    >
      {saving ? (
        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      ) : (
        <CheckIcon className="h-4 w-4" />
      )}
      <span>{isEdit ? (isReadOnly ? 'Activité validée' : 'Enregistrer') : 'Créer l\'activité'}</span>
    </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Form Content */}
        <div className="lg:col-span-8 space-y-6">
          <div className="card-luxury shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50/50 py-4 px-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-sky-500 text-white flex items-center justify-center">
                  <ChatBubbleLeftEllipsisIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Détails de l'interaction</h2>
                  <p className="text-sm text-slate-600">Canal, description et statut de l'activité</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                    Canal de contact *
                  </label>
                  <select
                    name="Type_Activite"
                    value={formData.Type_Activite}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    required
                    disabled={isReadOnly}
                  >
                    <option>Appel</option>
                    <option>Email</option>
                    <option>Visite</option>
                    <option>Réunion</option>
                    <option>Note</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                    Statut *
                  </label>
                  <select
                    name="Statut"
                    value={formData.Statut}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    required
                    disabled={isReadOnly}
                  >
                    <option>Planifié</option>
                    <option>En cours</option>
                    <option>Terminé</option>
                    <option>Annulé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                  Description
                </label>
                <textarea
                  name="Description"
                  value={formData.Description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Notez les points clés de l'échange..."
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none resize-none disabled:bg-slate-50 disabled:text-slate-500"
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                  Horodatage précis *
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="datetime-local"
                    name="Date_Activite"
                    value={formData.Date_Activite}
                    onChange={handleChange}
                    className="w-full pl-11 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    required
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card-luxury shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50/50 py-4 px-6">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Rattachements (optionnels)
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                  {isAdminUser ? 'Filtre par Commercial' : 'Clients'}
                </label>
                {isAdminUser && (
                  <select
                    value={representativeCode}
                    onChange={(e) => handleCommercialChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none mb-3 disabled:bg-slate-50 disabled:text-slate-500"
                    disabled={isReadOnly}
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
                  <p className="text-xs text-slate-500 mb-2">Chargement des commerciaux...</p>
                )}
                <input
                  type="text"
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  placeholder="Rechercher par raison sociale, code, email ou tel"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none mb-3 disabled:bg-slate-50 disabled:text-slate-500"
                  disabled={isReadOnly}
                />
                <label className="flex items-center gap-2 text-xs text-slate-600 mb-3">
                  <input
                    type="checkbox"
                    checked={prospectOnly}
                    onChange={(e) => setProspectOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400 disabled:opacity-50"
                    disabled={isReadOnly}
                  />
                  Prospects uniquement
                </label>
                <select
                  name="IDTiers"
                  value={formData.IDTiers}
                  onChange={handleClientChange}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  disabled={isReadOnly}
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
                  <p className="text-xs text-slate-500 mt-2">Recherche clients en cours...</p>
                )}
              </div>

              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                  Projet lié
                </label>
                <select
                  name="ID_Projet"
                  value={formData.ID_Projet}
                  onChange={handleProjetChange}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  disabled={isReadOnly}
                >
                  <option value="">Aucun projet</option>
                  {filteredProjets.map(p => (
                    <option key={p.ID_Projet} value={p.ID_Projet}>
                      {p.Nom_Projet || p.Code_Pro || p.ID_Projet}
                    </option>
                  ))}
                </select>
              </div>

              {/* Participants — visible for Réunion on new activities */}
              {!isEdit && formData.Type_Activite === 'Réunion' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-slate-500 uppercase tracking-wider">
                      Inviter des participants
                    </label>
                    {selectedParticipants.length > 0 && (
                      <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                        {selectedParticipants.length} sélectionné(s)
                      </span>
                    )}
                  </div>

                  {/* Selected chips */}
                  {selectedParticipants.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {selectedParticipants.map((uid) => {
                        const m = members.find((x) => x.userId === uid);
                        if (!m) return null;
                        return (
                          <span key={uid} className="inline-flex items-center gap-1 px-2 py-1 bg-sky-100 text-sky-700 rounded-lg text-[11px] font-semibold">
                            {m.label}
                            <button type="button" onClick={() => toggleParticipant(uid)} className="hover:text-sky-900 ml-0.5">×</button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                    {members.length === 0 ? (
                      <p className="text-xs text-slate-400 px-3 py-3 text-center">Aucun membre disponible</p>
                    ) : (
                      members.map((m) => {
                        const selected = selectedParticipants.includes(m.userId);
                        return (
                          <button
                            key={m.userId}
                            type="button"
                            onClick={() => toggleParticipant(m.userId)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-colors border-b border-slate-100 last:border-0 ${
                              selected ? 'bg-sky-50 text-sky-700' : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className={`h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                              selected ? 'bg-sky-500 border-sky-500' : 'border-slate-300'
                            }`}>
                              {selected && <CheckIcon className="h-3 w-3 text-white" />}
                            </span>
                            <span className="flex-1 text-left truncate">{m.label}</span>
                            {m.role && (
                              <span className="text-[10px] text-slate-400 shrink-0 capitalize">{m.role}</span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

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
