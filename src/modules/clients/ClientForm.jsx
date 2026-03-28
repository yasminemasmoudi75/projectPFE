import { useState, useEffect } from 'react';
import axios from '../../app/axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    CheckIcon,
    PlusIcon,
    TrashIcon,
    MapPinIcon,
    IdentificationIcon,
    PhoneIcon,
    EnvelopeIcon,
    CreditCardIcon,
    BuildingOffice2Icon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';

const PHONE_FIELDS = ['Tel', 'Gsm', 'Fax'];

const normalizePhone = (value) => String(value || '').replace(/\D/g, '').slice(0, 8);
const isPhoneValid = (value) => value === '' || /^\d{8}$/.test(value);

const ClientForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        CodTiers: '',
        Raisoc: '',
        Prenom: '',
        Nom: '',
        Classe: '',
        Fonction: '',
        Categorie: '',
        Domaine: '',
        Type: 'Client Professionnel',
        Email: '',
        Tel: '',
        Fax: '',
        Gsm: '',
        www: '',
        Adresse: '',
        Ville: '',
        Pays: '',
        CodePostal: '',
        MatriculeFiscale: '',
        Cin: '',
        RC: '',
        ConditionPaiement: '30 jours',
        Commercial: '',
        Remise: '',
        NbrCreditJour: '',
        Plafondcredit: '',
        ModReg: '',
        DetailReg: '',
        Banque: '',
        TextExonor: '',
        AdresseMaps: '',
        MapsVille: '',
        MapsPays: '',
        MapsDistrict: '',
        MapsRegion: '',
        MapsSubRegion: '',
        gouvernorat: '',
        lat: '',
        long: '',
        Blockage: false,
        Timbre: false,
        Major: false,
        Exonor: false,
        assujet: false,
        Fictif: false,
        Pub: false,
        Actif: true
    });
    const [contacts, setContacts] = useState([{ Responsable: '', Tel: '' }]);
    const [addresses, setAddresses] = useState([{ Adresse: '' }]);
    const [showCustomRegion, setShowCustomRegion] = useState(false);
    const [tiersClasses, setTiersClasses] = useState([]);
    const [tiersGouvernorats, setTiersGouvernorats] = useState([]);
    const [tiersCategories, setTiersCategories] = useState([]);

    useEffect(() => {
        const fetchTiersClasses = async () => {
            try {
                const response = await axios.get('/tiers-classes');
                setTiersClasses(response.data || []);
            } catch (error) {
                console.error('Error fetching tiers classes:', error);
            }
        };

        const fetchTiersGouvernorats = async () => {
            try {
                const response = await axios.get('/tiers-gouvernorats');
                setTiersGouvernorats(response.data.data || response.data || []);
            } catch (error) {
                console.error('Error fetching tiers gouvernorats:', error);
            }
        };

        const fetchTiersCategories = async () => {
            try {
                const response = await axios.get('/tiers-categories');
                setTiersCategories(response.data.data || response.data || []);
            } catch (error) {
                console.error('Error fetching tiers categories:', error);
            }
        };

        fetchTiersClasses();
        fetchTiersGouvernorats();
        fetchTiersCategories();

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
                        Prenom: data.Prenom || '',
                        Nom: data.Nom || '',
                        Classe: data.Classe || '',
                        Fonction: data.Fonction || '',
                        Categorie: data.Categorie || '',
                        Domaine: data.Domaine || '',
                        Type: 'Client Professionnel',
                        Email: data.Email || '',
                        Tel: normalizePhone(data.Tel),
                        Fax: normalizePhone(data.Fax),
                        Gsm: normalizePhone(data.Gsm),
                        www: data.www || '',
                        Adresse: data.Adresse || '',
                        Ville: data.Ville || '',
                        Pays: data.Pays || '',
                        CodePostal: data.Cp || '',
                        MatriculeFiscale: data.CodTva || '',
                        Cin: data.Cin || '',
                        RC: data.RC || '',
                        ConditionPaiement: '',
                        Commercial: data.codRepresTiers || '',
                        Remise: data.Remise ?? '',
                        NbrCreditJour: data.NbrCreditJour ?? '',
                        Plafondcredit: data.Plafondcredit ?? '',
                        ModReg: data.ModReg || '',
                        DetailReg: data.DetailReg || '',
                        Banque: data.Banque || '',
                        TextExonor: data.TextExonor || '',
                        AdresseMaps: data.AdresseMaps || '',
                        MapsVille: data.MapsVille || '',
                        MapsPays: data.MapsPays || '',
                        MapsDistrict: data.MapsDistrict || '',
                        MapsRegion: data.MapsRegion || '',
                        MapsSubRegion: data.MapsSubRegion || '',
                        gouvernorat: data.gouvernorat || '',
                        lat: data.lat ?? '',
                        long: data.long ?? '',
                        Blockage: Boolean(data.Blockage),
                        Timbre: Boolean(data.Timbre),
                        Major: Boolean(data.Major),
                        Exonor: Boolean(data.Exonor),
                        assujet: Boolean(data.assujet),
                        Fictif: Boolean(data.Fictif),
                        Pub: Boolean(data.Pub),
                        Actif: data.Actif !== false
                    });

                    setContacts(
                        Array.isArray(data.contacts) && data.contacts.length > 0
                            ? data.contacts.map((c) => ({ Responsable: c.Responsable || '', Tel: normalizePhone(c.Tel) }))
                            : [{ Responsable: '', Tel: '' }]
                    );

                    setAddresses(
                        Array.isArray(data.addresses) && data.addresses.length > 0
                            ? data.addresses.map((a) => ({ Adresse: a.Adresse || '' }))
                            : [{ Adresse: '' }]
                    );
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
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
            return;
        }

        if (PHONE_FIELDS.includes(name)) {
            setFormData(prev => ({ ...prev, [name]: normalizePhone(value) }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleContactChange = (index, field, value) => {
        const nextValue = field === 'Tel' ? normalizePhone(value) : value;
        setContacts((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: nextValue } : item)));
    };

    const addContact = () => {
        setContacts((prev) => [...prev, { Responsable: '', Tel: '' }]);
    };

    const removeContact = (index) => {
        setContacts((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
    };

    const handleAddressChange = (index, value) => {
        setAddresses((prev) => prev.map((item, i) => (i === index ? { ...item, Adresse: value } : item)));
    };

    const addAddress = () => {
        setAddresses((prev) => [...prev, { Adresse: '' }]);
    };

    const removeAddress = (index) => {
        setAddresses((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const invalidMainPhones = PHONE_FIELDS.filter((field) => !isPhoneValid(formData[field]));
        if (invalidMainPhones.length > 0) {
            toast.error('Chaque numéro (Téléphone/Mobile/Fax) doit contenir exactement 8 chiffres.');
            return;
        }

        const hasInvalidContactPhone = contacts.some((c) => !isPhoneValid(c.Tel));
        if (hasInvalidContactPhone) {
            toast.error('Les téléphones des contacts doivent contenir exactement 8 chiffres.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                contacts: contacts.filter((c) => c.Responsable?.trim() || c.Tel?.trim()),
                addresses: addresses.filter((a) => a.Adresse?.trim())
            };

            if (isEdit) {
                await axios.put(`/tiers/${id}`, payload);
                toast.success('Client mis à jour avec succès');
            } else {
                await axios.post('/tiers', payload);
                toast.success('Client créé avec succès');
            }
            navigate('/clients');
        } catch (error) {
            const serverErrors = error.response?.data?.errors;
            if (serverErrors && Array.isArray(serverErrors)) {
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

                    {/* Informations Personnelles Section */}
                    <div className="card-shadow rounded-xl border border-slate-200">
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-5 flex items-center gap-4 border-b border-slate-200">
                            <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded"></div>
                            <div>
                                <h2 className="text-base font-bold text-slate-800">Informations Personnelles</h2>
                                <p className="text-xs text-slate-500">Détails de contact et professionnels</p>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label-modern">Prénom</label>
                                    <input
                                        type="text"
                                        name="Prenom"
                                        value={formData.Prenom}
                                        onChange={handleChange}
                                        className="input-modern"
                                        placeholder="Jean"
                                    />
                                </div>
                                <div>
                                    <label className="label-modern">Nom</label>
                                    <input
                                        type="text"
                                        name="Nom"
                                        value={formData.Nom}
                                        onChange={handleChange}
                                        className="input-modern"
                                        placeholder="Dupont"
                                    />
                                </div>
                                <div>
                                    <label className="label-modern">Classe</label>
                                    <select
                                        name="Classe"
                                        value={formData.Classe}
                                        onChange={handleChange}
                                        className="input-modern"
                                    >
                                        <option value="">Sélectionner une classe</option>
                                        {tiersClasses.map((cl) => (
                                            <option key={cl.id} value={cl.id}>
                                                {cl.libelle}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label-modern">Gouvernorat</label>
                                    <select
                                        name="gouvernorat"
                                        value={formData.gouvernorat}
                                        onChange={handleChange}
                                        className="input-modern"
                                    >
                                        <option value="">Sélectionner un gouvernorat</option>
                                        {tiersGouvernorats.map((g) => (
                                            <option key={g.id} value={g.id}>
                                                {g.libelle}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label-modern">Fonction</label>
                                    <input
                                        type="text"
                                        name="Fonction"
                                        value={formData.Fonction}
                                        onChange={handleChange}
                                        className="input-modern"
                                        placeholder="Ex: Directeur Commercial"
                                    />
                                </div>
                                <div>
                                    <label className="label-modern">Catégorie</label>
                                    <select
                                        name="Categorie"
                                        value={formData.Categorie}
                                        onChange={handleChange}
                                        className="input-modern"
                                    >
                                        <option value="">Sélectionner une catégorie</option>
                                        {tiersCategories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.libelle}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label-modern">Domaine</label>
                                    <input
                                        type="text"
                                        name="Domaine"
                                        value={formData.Domaine}
                                        onChange={handleChange}
                                        className="input-modern"
                                        placeholder="Ex: Logiciels, Matériel, Services"
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
                                            inputMode="numeric"
                                            maxLength={8}
                                            pattern="[0-9]{8}"
                                            className="input-modern pl-12"
                                            placeholder="71000000"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="label-modern">Mobile</label>
                                    <input
                                        type="text"
                                        name="Gsm"
                                        value={formData.Gsm}
                                        onChange={handleChange}
                                        inputMode="numeric"
                                        maxLength={8}
                                        pattern="[0-9]{8}"
                                        className="input-modern"
                                        placeholder="98000000"
                                    />
                                </div>
                                <div>
                                    <label className="label-modern">Site Web</label>
                                    <input
                                        type="text"
                                        name="www"
                                        value={formData.www}
                                        onChange={handleChange}
                                        className="input-modern"
                                        placeholder="https://entreprise.tn"
                                    />
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
                                <div className="md:col-span-2">
                                    <label className="label-modern">Région</label>
                                    <input
                                        type="text"
                                        name="Ville"
                                        value={formData.Ville}
                                        onChange={handleChange}
                                        className="input-modern"
                                        placeholder="Ex: Tunis, Ariana, Sousse..."
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
                                <div>
                                    <label className="label-modern">Pays</label>
                                    <input
                                        type="text"
                                        name="Pays"
                                        value={formData.Pays}
                                        onChange={handleChange}
                                        className="input-modern"
                                        placeholder="Tunisie"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100/50 bg-gradient-to-r from-blue-50/70 to-transparent flex items-center gap-4">
                            <div className="icon-shape icon-shape-sm shadow-glow-primary">
                                <BuildingOffice2Icon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-800">Contacts et Adresses Multiples</h2>
                                <p className="text-xs text-slate-500">TabTiersContact et TabTiersAdr</p>
                            </div>
                        </div>
                        <div className="p-8 space-y-8">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-slate-800">Contacts</h3>
                                    <button type="button" onClick={addContact} className="btn-outline text-xs flex items-center gap-1">
                                        <PlusIcon className="h-4 w-4" />
                                        Ajouter contact
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {contacts.map((contact, index) => (
                                        <div key={`contact-${index}`} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                            <input
                                                type="text"
                                                value={contact.Responsable}
                                                onChange={(e) => handleContactChange(index, 'Responsable', e.target.value)}
                                                className="input-modern md:col-span-6"
                                                placeholder="Nom du responsable"
                                            />
                                            <input
                                                type="text"
                                                value={contact.Tel}
                                                onChange={(e) => handleContactChange(index, 'Tel', e.target.value)}
                                                inputMode="numeric"
                                                maxLength={8}
                                                pattern="[0-9]{8}"
                                                className="input-modern md:col-span-5"
                                                placeholder="Téléphone (8 chiffres)"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeContact(index)}
                                                className="h-11 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 md:col-span-1 flex items-center justify-center"
                                                title="Supprimer"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-slate-800">Adresses</h3>
                                    <button type="button" onClick={addAddress} className="btn-outline text-xs flex items-center gap-1">
                                        <PlusIcon className="h-4 w-4" />
                                        Ajouter adresse
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {addresses.map((address, index) => (
                                        <div key={`address-${index}`} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                            <input
                                                type="text"
                                                value={address.Adresse}
                                                onChange={(e) => handleAddressChange(index, e.target.value)}
                                                className="input-modern md:col-span-11"
                                                placeholder="Adresse complémentaire"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeAddress(index)}
                                                className="h-11 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 md:col-span-1 flex items-center justify-center"
                                                title="Supprimer"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100/50 bg-gradient-to-r from-amber-50/80 to-transparent flex items-center gap-4">
                            <div className="icon-shape icon-shape-sm" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' }}>
                                <CreditCardIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-800">Informations Complémentaires Tiers</h2>
                                <p className="text-xs text-slate-500">Champs avancés de TabTiers</p>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="label-modern">Registre de commerce</label>
                                    <input type="text" name="RC" value={formData.RC} onChange={handleChange} className="input-modern" />
                                </div>
                                <div>
                                    <label className="label-modern">Banque</label>
                                    <input type="text" name="Banque" value={formData.Banque} onChange={handleChange} className="input-modern" />
                                </div>
                                <div>
                                    <label className="label-modern">Remise (%)</label>
                                    <input type="number" min="0" step="0.001" name="Remise" value={formData.Remise} onChange={handleChange} className="input-modern" />
                                </div>
                                <div>
                                    <label className="label-modern">Crédit (jours)</label>
                                    <input type="number" min="0" name="NbrCreditJour" value={formData.NbrCreditJour} onChange={handleChange} className="input-modern" />
                                </div>
                                <div>
                                    <label className="label-modern">Plafond crédit</label>
                                    <input type="number" min="0" step="0.01" name="Plafondcredit" value={formData.Plafondcredit} onChange={handleChange} className="input-modern" />
                                </div>
                                <div>
                                    <label className="label-modern">Mode règlement</label>
                                    <input type="text" name="ModReg" value={formData.ModReg} onChange={handleChange} className="input-modern" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="label-modern">Détail règlement</label>
                                    <input type="text" name="DetailReg" value={formData.DetailReg} onChange={handleChange} className="input-modern" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="label-modern">Texte exonération</label>
                                    <textarea name="TextExonor" value={formData.TextExonor} onChange={handleChange} rows="2" className="input-modern resize-none" />
                                </div>
                                <div>
                                    <label className="label-modern">Latitude</label>
                                    <input type="number" min="0" step="0.000001" name="lat" value={formData.lat} onChange={handleChange} className="input-modern" />
                                </div>
                                <div>
                                    <label className="label-modern">Longitude</label>
                                    <input type="number" min="0" step="0.000001" name="long" value={formData.long} onChange={handleChange} className="input-modern" />
                                </div>
                                <div>
                                    <label className="label-modern">Adresse Maps</label>
                                    <input type="text" name="AdresseMaps" value={formData.AdresseMaps} onChange={handleChange} className="input-modern" />
                                </div>
                                <div>
                                    <label className="label-modern">Gouvernorat</label>
                                    <input type="text" name="gouvernorat" value={formData.gouvernorat} onChange={handleChange} className="input-modern" />
                                </div>
                                <div>
                                    <label className="label-modern">Maps Ville</label>
                                    <input type="text" name="MapsVille" value={formData.MapsVille} onChange={handleChange} className="input-modern" />
                                </div>
                                <div>
                                    <label className="label-modern">Maps Pays</label>
                                    <input type="text" name="MapsPays" value={formData.MapsPays} onChange={handleChange} className="input-modern" />
                                </div>
                                <div>
                                    <label className="label-modern">Maps District</label>
                                    <input type="text" name="MapsDistrict" value={formData.MapsDistrict} onChange={handleChange} className="input-modern" />
                                </div>
                                <div>
                                    <label className="label-modern">Maps Region</label>
                                    <input type="text" name="MapsRegion" value={formData.MapsRegion} onChange={handleChange} className="input-modern" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="label-modern">Maps SubRegion</label>
                                    <input type="text" name="MapsSubRegion" value={formData.MapsSubRegion} onChange={handleChange} className="input-modern" />
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    ['Actif', 'Actif'],
                                    ['Blockage', 'Blocage'],
                                    ['Timbre', 'Timbre'],
                                    ['Major', 'Majoration'],
                                    ['Exonor', 'Exonore'],
                                    ['assujet', 'Assujetti'],
                                    ['Fictif', 'Fictif'],
                                    ['Pub', 'Pub']
                                ].map(([key, label]) => (
                                    <label key={key} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 bg-white">
                                        <input
                                            type="checkbox"
                                            name={key}
                                            checked={Boolean(formData[key])}
                                            onChange={handleChange}
                                            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                                        />
                                        <span className="text-xs font-semibold text-slate-700">{label}</span>
                                    </label>
                                ))}
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
                </div>

            </form>
        </div>
    );
};

export default ClientForm;
