import { useState, useEffect, useMemo } from 'react';
import axios from '../../app/axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    ArrowLeftIcon,
    CheckIcon,
    BriefcaseIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    SparklesIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import { fetchProjetById, createProjet, updateProjet } from './projetSlice';

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

const extractArrayPayload = (response) => {
    // L'intercepteur axios retourne déjà response.data, donc traiter directement
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (response?.pagination && Array.isArray(response?.data)) return response.data;
    return [];
};

const ProjetForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isEdit = Boolean(id);
    const { currentProjet, loading: reduxLoading } = useSelector((state) => state.projets);

    const { user } = useSelector((state) => state.auth);
    const isAdminUser = isAdminRole(user?.UserRole);

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [tiers, setTiers] = useState([]);
    const [commercials, setCommercials] = useState([]);
    const [commercialsLoading, setCommercialsLoading] = useState(false);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [representativeCode, setRepresentativeCode] = useState('');
    const [tiersLoading, setTiersLoading] = useState(false);
    const [selectedTierSnapshot, setSelectedTierSnapshot] = useState(null);

    const [formData, setFormData] = useState({
        Nom_Projet: '',
        IDTiers: '',
        Budget_Alloue: 0,
        Avancement: 0,
        Date_Echeance: '',
        Priorite: 'Normale',
        Phase: 'Nouveau',
        Note_Privee: '',
        Alerte_IA_Risque: false
    });

    // Fetch commercials on mount
    useEffect(() => {
        const fetchCommercials = async () => {
            try {
                setCommercialsLoading(true);
                const response = await axios.get('/users/commercials/activites-filter', {
                    params: {
                        moduleCode: 46,
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
                console.error('Error fetching commercials for projets:', error);
            } finally {
                setCommercialsLoading(false);
            }
        };

        fetchCommercials();
    }, [isAdminUser, user?.UserID, user?.UserRole]);

    // Fetch clients with search and commercial filter
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            try {
                setTiersLoading(true);
                const response = await axios.get('/projets/tiers-lookup', {
                    params: {
                        q: clientSearchTerm || undefined,
                        codRepres: representativeCode || undefined,
                        limit: 80
                    }
                });
                const lookupData = extractArrayPayload(response);

                if (Array.isArray(lookupData) && lookupData.length > 0) {
                    setTiers(lookupData);
                    return;
                }

                // Fallback when endpoint is unavailable
                const fallbackRes = await axios.get('/tiers', { params: { page: 1, limit: 200 } });
                const fallbackList = extractArrayPayload(fallbackRes);
                const filteredFallback = filterTiersLocally(fallbackList, {
                    q: clientSearchTerm,
                    codRepres: representativeCode
                }).slice(0, 80);

                setTiers(filteredFallback);
            } catch (error) {
                console.error('Error fetching tiers lookup for projets:', error);
            } finally {
                setTiersLoading(false);
            }
        }, 250);

        return () => clearTimeout(timeoutId);
    }, [clientSearchTerm, representativeCode]);

    const handleCommercialChange = (value) => {
        setRepresentativeCode(value);
        setSelectedTierSnapshot(null);
        setFormData((prev) => ({
            ...prev,
            IDTiers: ''
        }));
    };

    const tierOptions = useMemo(() => {
        if (!selectedTierSnapshot) return tiers;
        const hasSelected = tiers.some((item) => String(item.IDTiers || item.CodTiers) === String(selectedTierSnapshot.IDTiers || selectedTierSnapshot.CodTiers));
        return hasSelected ? tiers : [selectedTierSnapshot, ...tiers];
    }, [tiers, selectedTierSnapshot]);

    useEffect(() => {
        if (isEdit) {
            dispatch(fetchProjetById(id));
        }
    }, [id, isEdit, dispatch]);

    useEffect(() => {
        if (isEdit && currentProjet) {
            setFormData({
                Nom_Projet: currentProjet.Nom_Projet || '',
                IDTiers: currentProjet.IDTiers || '',
                Budget_Alloue: currentProjet.Budget_Alloue || 0,
                Avancement: currentProjet.Avancement || 0,
                Date_Echeance: currentProjet.Date_Echeance ? new Date(currentProjet.Date_Echeance).toISOString().split('T')[0] : '',
                Priorite: currentProjet.Priorite || 'Normale',
                Phase: currentProjet.Phase || 'Nouveau',
                Note_Privee: currentProjet.Note_Privee || '',
                Alerte_IA_Risque: currentProjet.Alerte_IA_Risque || false
            });
            setLoading(false);
        }
    }, [currentProjet, isEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let finalValue = value;

        if (type === 'checkbox') {
            finalValue = checked;
        } else if (type === 'number') {
            finalValue = value === '' ? 0 : parseFloat(value);
            if (name === 'Budget_Alloue') {
                finalValue = Math.max(0, finalValue || 0);
            }
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));
    };

    const preventNegativeInput = (e) => {
        if (e.key === '-' || e.key === 'Minus') {
            e.preventDefault();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const normalizedBudget = Number(formData.Budget_Alloue || 0);
        if (normalizedBudget < 0) {
            toast.error('Le budget alloué ne peut pas être négatif');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                Budget_Alloue: Math.max(0, normalizedBudget)
            };

            if (isEdit) {
                await dispatch(updateProjet({ id, data: payload })).unwrap();
                toast.success('Projet mis à jour');
            } else {
                await dispatch(createProjet(payload)).unwrap();
                toast.success('Projet créé avec succès');
            }
            navigate('/projets');
        } catch (error) {
            toast.error(error.message || "Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    if (loading || (isEdit && reduxLoading)) return <LoadingSpinner />;

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
                                Gestion Projets
                            </div>
                            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                                {isEdit ? 'Modifier le Projet' : 'Nouvelle Initiative'}
                            </h1>
                            <p className="text-slate-600 mt-1 text-sm">
                                Renseignez les informations du projet pour un suivi optimal.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/projets')}
                            className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-all"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl bg-[#0062AF] hover:bg-[#004a85] text-white font-medium shadow-md shadow-blue-500/20 transition-all disabled:opacity-60 flex items-center gap-2"
                        >
                            {saving ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <CheckIcon className="h-4 w-4" />
                            )}
                            <span>{isEdit ? 'Enregistrer' : 'Lancer le Projet'}</span>
                        </button>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                    {/* Informations Clés */}
                    <div className="card-luxury shadow-sm">
                        <div className="border-b border-slate-200 bg-slate-50/50 py-4 px-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-sky-500 text-white flex items-center justify-center">
                                    <BriefcaseIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">Informations Clés</h2>
                                    <p className="text-sm text-slate-600">Définition et client rattaché</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                                    Nom du Projet *
                                </label>
                                <input
                                    type="text"
                                    name="Nom_Projet"
                                    value={formData.Nom_Projet}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-lg font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
                                    placeholder="Ex: Refonte Site E-commerce"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                                    {isAdminUser ? 'Filtre par Commercial' : 'Client'}
                                </label>
                                {isAdminUser && !isEdit && (
                                    <select
                                        value={representativeCode}
                                        onChange={(e) => handleCommercialChange(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none mb-3"
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
                                {!isEdit ? (
                                    <input
                                        type="text"
                                        value={clientSearchTerm}
                                        onChange={(e) => setClientSearchTerm(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none mb-3"
                                    />
                                ) : (
                                    <div className="mb-3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-slate-500 italic text-sm">
                                        <CheckIcon className="h-4 w-4 text-emerald-500" />
                                        Client rattaché au projet
                                    </div>
                                )}
                                <select
                                    name="IDTiers"
                                    value={formData.IDTiers}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        handleChange(e);
                                        if (value) {
                                            const selected = tierOptions.find(t => (t.CodTiers || t.IDTiers) === value);
                                            if (selected) {
                                                setSelectedTierSnapshot({
                                                    IDTiers: selected.IDTiers,
                                                    CodTiers: selected.CodTiers,
                                                    Raisoc: selected.Raisoc,
                                                    codRepresTiers: selected.codRepresTiers
                                                });
                                            }
                                        }
                                    }}
                                    disabled={isEdit}
                                    className={`w-full px-3 py-2.5 border rounded-xl text-sm transition-all focus:outline-none ${isEdit ? 'bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed font-medium' : 'bg-white border-slate-200 text-slate-700 focus:border-sky-400'}`}
                                    required
                                >
                                    <option value="">Sélectionner un client...</option>
                                    {tierOptions.map(t => (
                                        <option key={t.IDTiers || t.CodTiers} value={t.CodTiers || t.IDTiers}>
                                            {(t.Raisoc || t.NomTiers || t.CodTiers || t.IDTiers)
                                                + (t.CodTiers ? ` (${t.CodTiers})` : '')}
                                        </option>
                                    ))}
                                </select>
                                {tiersLoading && (
                                    <p className="text-xs text-slate-500 mt-2">Recherche clients en cours...</p>
                                )}
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                                    Budget Alloué (TND)
                                </label>
                                <div className="relative">
                                    <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="number" min="0"
                                        name="Budget_Alloue"
                                        value={formData.Budget_Alloue}
                                        onChange={handleChange}
                                        onKeyDown={preventNegativeInput}
                                        className="w-full pl-11 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Suivi et Avancement */}
                    <div className="card-luxury shadow-sm">
                        <div className="border-b border-slate-200 bg-slate-50/50 py-4 px-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-violet-500 text-white flex items-center justify-center">
                                    <ChartBarIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">Suivi et Avancement</h2>
                                    <p className="text-sm text-slate-600">Statut et progression du projet</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                                        Phase Actuelle
                                    </label>
                                    <select name="Phase" value={formData.Phase} onChange={handleChange} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none">
                                        <option>Nouveau</option>
                                        <option>Analyse</option>
                                        <option>Conception</option>
                                        <option>Exécution</option>
                                        <option>Tests</option>
                                        <option>Clôture</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                                        Avancement (%)
                                    </label>
                                    <input
                                        type="range"
                                        name="Avancement"
                                        value={formData.Avancement}
                                        onChange={handleChange}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500 mt-4"
                                    />
                                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                                        <span>0%</span>
                                        <span className="text-sky-600 font-semibold">{formData.Avancement}%</span>
                                        <span>100%</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                                        Priorité
                                    </label>
                                    <div className="flex gap-3 mt-2">
                                        {['Basse', 'Normale', 'Haute'].map(p => (
                                            <label key={p} className={`flex-1 flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.Priorite === p ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                                <input type="radio" name="Priorite" value={p} checked={formData.Priorite === p} onChange={handleChange} className="hidden" />
                                                <span className="text-xs font-semibold uppercase tracking-wider">{p}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                                        Date d'échéance
                                    </label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input
                                            type="date"
                                            name="Date_Echeance"
                                            value={formData.Date_Echeance}
                                            onChange={handleChange}
                                            className="w-full pl-11 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6 self-start">
                    <div className="card-luxury shadow-sm">
                        <div className="border-b border-slate-200 bg-slate-50/50 py-4 px-6">
                            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                                Note Privée
                            </h2>
                        </div>
                        <div className="p-6">
                            <textarea
                                name="Note_Privee"
                                value={formData.Note_Privee}
                                onChange={handleChange}
                                rows="8"
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none resize-none"
                                placeholder="Instructions internes, détails techniques..."
                            ></textarea>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ProjetForm;
