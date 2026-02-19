import { useState, useEffect } from 'react';
import axios from '../../app/axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    CheckIcon,
    MapPinIcon,
    IdentificationIcon,
    PhoneIcon,
    EnvelopeIcon,
    CreditCardIcon,
    BuildingOffice2Icon,
    SparklesIcon,
    GlobeAltIcon,
    ShieldCheckIcon,
    BoltIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';

const ClientForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        CodTiers: '',
        Raisoc: '',
        Type: 'Client Professionnel',
        Email: '',
        Tel: '',
        Fax: '',
        Adresse: '',
        Ville: '',
        CodePostal: '',
        MatriculeFiscale: '',
        Cin: '',
        ConditionPaiement: '30 jours',
        Commercial: ''
    });

    useEffect(() => {
        if (isEdit) {
            const fetchClient = async () => {
                try {
                    const response = await axios.get(`/tiers/${id}`);
                    const payload = response.data;
                    const data = payload?.data || payload;

                    if (!data) {
                        throw new Error('Client introuvable');
                    }

                    setFormData({
                        CodTiers: data.CodTiers || '',
                        Raisoc: data.Raisoc || '',
                        Type: 'Client Professionnel',
                        Email: data.Email || '',
                        Tel: data.Tel || '',
                        Fax: data.Gsm || '',
                        Adresse: data.Adresse || '',
                        Ville: data.Ville || '',
                        CodePostal: '',
                        MatriculeFiscale: '',
                        Cin: data.Cin || '',
                        ConditionPaiement: '',
                        Commercial: data.codRepresTiers || ''
                    });
                } catch (error) {
                    console.error('Error fetching client:', error);
                    toast.error("Impossible de charger le client");
                    navigate('/clients');
                } finally {
                    setLoading(false);
                }
            };
            fetchClient();
        }
    }, [id, isEdit, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEdit) {
                await axios.put(`/tiers/${id}`, formData);
                toast.success('Client mis à jour avec succès');
            } else {
                await axios.post('/tiers', formData);
                toast.success('Client créé avec succès');
            }
            navigate('/clients');
        } catch (error) {
            console.error('Error saving client:', error.response?.data || error.message);

            const serverErrors = error.response?.data?.errors;
            if (serverErrors && Array.isArray(serverErrors)) {
                console.log('--- DÉTAILS DES ERREURS SERVEUR ---');
                console.table(serverErrors);
                serverErrors.forEach(err => {
                    toast.error(`${err.field}: ${err.message}`);
                });
            } else {
                toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement");
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in min-h-screen pb-16">
            {/* Decorative Background Elements */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-gradient-to-tr from-cyan-200/20 to-blue-200/20 rounded-full blur-3xl"></div>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => navigate(-1)}
                        className="group h-12 w-12 bg-white/80 backdrop-blur-sm border border-slate-200/50 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 rounded-2xl transition-all shadow-soft-md flex items-center justify-center"
                    >
                        <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="badge badge-primary">
                                <SparklesIcon className="h-3 w-3 mr-1" />
                                Gestion Tiers
                            </span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                            {isEdit ? 'Modifier Client' : 'Nouveau Partenaire'}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/clients')}
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
                        <span>{isEdit ? 'Sauvegarder' : 'Créer le Client'}</span>
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column - Main Forms */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Identity Section */}
                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/80 to-transparent flex items-center gap-4">
                            <div className="icon-shape icon-shape-sm shadow-glow-primary">
                                <IdentificationIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-800">Identité Juridique</h2>
                                <p className="text-xs text-slate-500">Informations légales et identification</p>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="label-modern">Raison Sociale *</label>
                                    <input
                                        type="text"
                                        name="Raisoc"
                                        value={formData.Raisoc}
                                        onChange={handleChange}
                                        className="input-modern text-lg font-semibold"
                                        placeholder="Ex: Entreprise ABC International"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label-modern">Code Tiers *</label>
                                    <input
                                        type="text"
                                        name="CodTiers"
                                        value={formData.CodTiers}
                                        onChange={handleChange}
                                        className="input-modern font-mono uppercase tracking-wider"
                                        placeholder="CLI-0001"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label-modern">Type de Client</label>
                                    <select
                                        name="Type"
                                        value={formData.Type}
                                        onChange={handleChange}
                                        className="input-modern"
                                    >
                                        <option>Client Professionnel</option>
                                        <option>PME / PMI</option>
                                        <option>Particulier</option>
                                        <option>Administration</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="label-modern">Matricule Fiscale</label>
                                    <input
                                        type="text"
                                        name="MatriculeFiscale"
                                        value={formData.MatriculeFiscale}
                                        onChange={handleChange}
                                        className="input-modern font-mono"
                                        placeholder="1234567/A/M/000"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact & Address Section */}
                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100/50 bg-gradient-to-r from-emerald-50/80 to-transparent flex items-center gap-4">
                            <div className="icon-shape icon-shape-sm shadow-glow-success" style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }}>
                                <MapPinIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-800">Contact & Localisation</h2>
                                <p className="text-xs text-slate-500">Coordonnées et adresse du siège</p>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label-modern">Email Professionnel</label>
                                    <div className="relative">
                                        <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input
                                            type="email"
                                            name="Email"
                                            value={formData.Email}
                                            onChange={handleChange}
                                            className="input-modern pl-12"
                                            placeholder="contact@entreprise.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="label-modern">Téléphone</label>
                                    <div className="relative">
                                        <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input
                                            type="text"
                                            name="Tel"
                                            value={formData.Tel}
                                            onChange={handleChange}
                                            className="input-modern pl-12"
                                            placeholder="+216 71 000 000"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-2"></div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="label-modern">Adresse Complète</label>
                                    <textarea
                                        name="Adresse"
                                        value={formData.Adresse}
                                        onChange={handleChange}
                                        rows="3"
                                        className="input-modern resize-none"
                                        placeholder="Numéro, rue, immeuble, étage..."
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="label-modern">Ville</label>
                                    <input
                                        type="text"
                                        name="Ville"
                                        value={formData.Ville}
                                        onChange={handleChange}
                                        className="input-modern"
                                        placeholder="Tunis"
                                    />
                                </div>
                                <div>
                                    <label className="label-modern">Code Postal</label>
                                    <input
                                        type="text"
                                        name="CodePostal"
                                        value={formData.CodePostal}
                                        onChange={handleChange}
                                        className="input-modern"
                                        placeholder="1000"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Commercial & Info */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Commercial Settings */}
                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100/50 bg-gradient-to-r from-rose-50/80 to-transparent flex items-center gap-3">
                            <div className="icon-shape icon-shape-sm" style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)' }}>
                                <CreditCardIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-800">Commercial</h2>
                                <p className="text-[10px] text-slate-500">Paramètres de vente</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="label-modern">Représentant</label>
                                <select
                                    name="Commercial"
                                    value={formData.Commercial}
                                    onChange={handleChange}
                                    className="input-modern"
                                >
                                    <option value="">Sélectionner...</option>
                                    <option value="Admin">Administrateur</option>
                                    <option value="Commercial1">Commercial 1</option>
                                </select>
                            </div>
                            <div>
                                <label className="label-modern">Conditions de Paiement</label>
                                <select
                                    name="ConditionPaiement"
                                    value={formData.ConditionPaiement}
                                    onChange={handleChange}
                                    className="input-modern"
                                >
                                    <option>Comptant</option>
                                    <option>30 jours</option>
                                    <option>30 jours fin de mois</option>
                                    <option>60 jours</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Info Card with Premium Gradient */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-8 text-white shadow-glow-primary">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="h-10 w-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <ShieldCheckIcon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold">Sécurité & Audit</h4>
                                    <p className="text-[10px] text-white/60">Traçabilité activée</p>
                                </div>
                            </div>
                            <p className="text-xs text-white/70 leading-relaxed mb-6">
                                Toutes les modifications apportées à cette fiche client sont enregistrées et horodatées pour assurer la conformité.
                            </p>
                            <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                                <BoltIcon className="h-5 w-5 text-amber-300" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider">Statut</p>
                                    <p className="text-xs text-white/60">{isEdit ? 'Modification en cours' : 'Nouvelle entrée'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Tips */}
                    <div className="card-glass p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <GlobeAltIcon className="h-4 w-4 text-indigo-500" />
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Conseils</h4>
                        </div>
                        <ul className="space-y-3">
                            {['Vérifiez le matricule fiscale', 'Renseignez une adresse email valide', 'Définissez les conditions de paiement'].map((tip, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                    <span className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

            </form>
        </div>
    );
};

export default ClientForm;
