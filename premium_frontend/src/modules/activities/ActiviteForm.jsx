import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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

const ActiviteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const location = useLocation();
  const defaultProjetId = !isEdit ? location.state?.defaultProjetId : null;
  const defaultTierId = !isEdit ? location.state?.defaultTierId : null;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [tiers, setTiers] = useState([]);
  const [allProjets, setAllProjets] = useState([]); // Tous les projets
  const [filteredProjets, setFilteredProjets] = useState([]); // Projets filtrés par client

  const [formData, setFormData] = useState({
    Type_Activite: 'Appel',
    Description: '',
    Date_Activite: new Date().toISOString().slice(0, 16),
    Statut: 'Planifié',
    IDTiers: '',
    ID_Projet: '',
  });

  // Charger les listes clients / projets au montage
  useEffect(() => {
    const fetchLookups = async () => {
      try {
       
        const [tiersRes, projetsRes] = await Promise.all([
          axios.get('/tiers'),
          axios.get('/projets', { params: { page: 1, limit: 100 } }),
        ]);

        console.log('Tiers response:', tiersRes);
        console.log('Projets response:', projetsRes);

        // Vérifier la structure des données reçues
        const tiersData = tiersRes.data?.data || tiersRes.data || [];
        const projetsData = projetsRes.data?.data || projetsRes.data || [];
        
        console.log('Tiers data:', tiersData);
        console.log('Projets data:', projetsData);

        setTiers(tiersData);
        setAllProjets(projetsData);

        if (!isEdit && (defaultProjetId || defaultTierId)) {
          let initialTierId = defaultTierId || '';
          let initialProjetId = '';
          let projetsPourClient = projetsData;

          if (defaultProjetId) {
            const selectedProjet = projetsData.find(
              (p) => String(p.ID_Projet) === String(defaultProjetId)
            );
            const projetClientId =
              selectedProjet?.IDTiers ||
              selectedProjet?.client?.IDTiers ||
              initialTierId;

            initialProjetId = String(defaultProjetId);
            initialTierId = projetClientId || initialTierId;

            if (projetClientId) {
              projetsPourClient = projetsData.filter(
                (p) =>
                  p.IDTiers === projetClientId || p.client?.IDTiers === projetClientId
              );
            }
          } else if (initialTierId) {
            projetsPourClient = projetsData.filter(
              (p) =>
                p.IDTiers === initialTierId || p.client?.IDTiers === initialTierId
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
    // Filtrer les projets pour ne montrer que ceux du client sélectionné
    const clientProjets = value 
      ? allProjets.filter(p => p.IDTiers === value || p.client?.IDTiers === value)
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

  const handleProjetChange = (e) => {
    const { value } = e.target;
    
    if (!value) {
      setFormData(prev => ({ ...prev, ID_Projet: '', IDTiers: '' }));
      return;
    }
    
    // Afficher tous les projets pour le débogage
    console.log('Tous les projets disponibles:', allProjets);
    
    // Trouver le projet sélectionné (en s'assurant que les types correspondent)
    const selectedProjet = allProjets.find((p) => 
      String(p.ID_Projet) === String(value) || 
      String(p.ID_Projet) === String(value)
    );
    
    console.log('Valeur sélectionnée:', value);
    console.log('Projet trouvé:', selectedProjet);
    
    // Récupérer l'ID du client du projet (supporte les deux formats de réponse API)
    const projetClientId = selectedProjet?.IDTiers || 
                         selectedProjet?.client?.IDTiers || 
                         '';
    
  
    
    // Mettre à jour l'état du formulaire
    setFormData(prev => ({
      ...prev,
      ID_Projet: value,
      IDTiers: projetClientId // Toujours mettre à jour le client, même si c'est vide
    }));
    
    // Si le projet a un client, filtrer les projets pour ce client
    if (projetClientId) {
      const clientProjets = allProjets.filter(p => 
        p.IDTiers === projetClientId || p.client?.IDTiers === projetClientId
      );
      setFilteredProjets(clientProjets);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEdit) {
        await axios.put(`/activites/${id}`, formData);
        toast.success("Activité mise à jour");
      } else {
        await axios.post('/activites', formData);
        toast.success('Activité créée avec succès');
      }
      navigate('/activites');
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
            onClick={() => navigate('/activites')}
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
                <label className="label-modern">Client</label>
                <select
                  name="IDTiers"
                  value={formData.IDTiers}
                  onChange={handleClientChange}
                  className="input-modern"
                >
                  <option value="">Aucun client</option>
                  {tiers.map(t => (
                    <option key={t.IDTiers} value={t.IDTiers}>
                      {t.Raisoc || t.NomTiers || t.IDTiers}
                    </option>
                  ))}
                </select>
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
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ActiviteForm;
