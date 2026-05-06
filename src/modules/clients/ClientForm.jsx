import { useState, useEffect, useMemo, useRef } from 'react';
import axios from '../../app/axios';
import { useSelector } from 'react-redux';
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
    const { user } = useSelector((state) => state.auth);
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
    const [commercialsList, setCommercialsList] = useState([]);
    const [banques, setBanques] = useState([]);
    const [loadingBanques, setLoadingBanques] = useState(false);
    const [addingBanque, setAddingBanque] = useState(false);
    const [otherBanque, setOtherBanque] = useState('');
    const [otherBanqueAdresse, setOtherBanqueAdresse] = useState('');
    const [otherBanquePhoto, setOtherBanquePhoto] = useState(null);
    const otherBanquePhotoInputRef = useRef(null);
    const [emailCheckMessage, setEmailCheckMessage] = useState('');
    const [emailChecking, setEmailChecking] = useState(false);

    // Stepped form state
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState(new Set([1]));
    const totalSteps = 4;

    const isCommercial = useMemo(() => {
        const role = String(user?.UserRole || '').trim().toLowerCase();
        return role === 'commercial' || role === 'commerciale';
    }, [user]);

    const isAdmin = useMemo(() => {
        const role = String(user?.UserRole || '').trim().toLowerCase();
        return role === 'admin' || role === 'administrateur';
    }, [user]);

    const isAgent = useMemo(() => {
        const role = String(user?.UserRole || '').trim().toLowerCase();
        return role === 'agent';
    }, [user]);

    // Validation functions for each step
    const validateStep1 = () => {
        return formData.Raisoc && formData.CodTiers;
    };

    const validateStep2 = () => {
        return formData.gouvernorat;
    };

    const validateStep3 = () => {
        return true; // Optional fields
    };

    const validateStep4 = () => {
        return true; // Optional fields
    };

    const canProceedToNext = () => {
        switch (currentStep) {
            case 1: return validateStep1();
            case 2: return validateStep2();
            case 3: return validateStep3();
            case 4: return validateStep4();
            default: return false;
        }
    };

    const handleNextStep = () => {
        if (currentStep < totalSteps) {
            const newCompleted = new Set(completedSteps);
            newCompleted.add(currentStep + 1);
            setCompletedSteps(newCompleted);
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const goToStep = (step) => {
        if (step >= 1 && step <= totalSteps) {
            setCurrentStep(step);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const fetchTiersClasses = async () => {
            try {
                const response = await axios.get('/tiers-classes');
                const payload = response?.data?.data || response?.data || [];
                setTiersClasses(Array.isArray(payload) ? payload : []);
            } catch (error) {
                console.error('Error fetching tiers classes:', error);
                setTiersClasses([]);
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

        const fetchCommercials = async () => {
            try {
                const response = await axios.get('/users/commercials/assignable');
                const data = response.data;
                const rawList = Array.isArray(data) ? data : data.data || [];
                setCommercialsList(rawList.map((c) => ({
                    UserID: c.userId || c.UserID,
                    FullName: c.fullName || c.FullName || c.label || c.login,
                    LoginName: c.login || c.LoginName
                })));
            } catch (error) {
                console.error('Error fetching commercials:', error);
            }
        };

        const fetchBanques = async () => {
            try {
                setLoadingBanques(true);
                const response = await axios.get('/banques');
                const payload = response?.data?.data || response?.data || [];
                setBanques(Array.isArray(payload) ? payload : []);
            } catch (error) {
                console.error('Error fetching banques:', error);
                setBanques([]);
            } finally {
                setLoadingBanques(false);
            }
        };

        fetchTiersClasses();
        fetchTiersGouvernorats();
        fetchTiersCategories();
        fetchCommercials();
        fetchBanques();

        // Si l'utilisateur est un commercial, on pré-remplit son propre code
        if (!isEdit && isCommercial) {
            const myIdentifier = user?.UserID || user?.id || user?.LoginName || '';
            setFormData(prev => ({ ...prev, Commercial: String(myIdentifier) }));
        }

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
                            ? data.contacts.map((c) => ({
                                Responsable: c.Responsable || '',
                                Tel: normalizePhone(c.Tel),
                                classeAuto: c.classeAuto // Récupération de la classe calculée
                            }))
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

    const selectedClassLabel = useMemo(() => {
        const classId = String(formData.Classe || '').trim();
        if (!classId) return '';

        const selectedClass = tiersClasses.find((cl) => String(cl.id) === classId);
        return String(selectedClass?.libelle || '').trim().toLowerCase();
    }, [formData.Classe, tiersClasses]);

    const canAssignCommercial = selectedClassLabel === 'prospect';

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

    const handleAddOtherBanque = async () => {
        const banqueName = String(otherBanque || '').trim();
        if (!banqueName) return;

        try {
            setAddingBanque(true);
            const payload = new FormData();
            payload.append('banque', banqueName);

            const adresse = String(otherBanqueAdresse || '').trim();
            if (adresse) {
                payload.append('adresse', adresse);
            }

            if (otherBanquePhoto) {
                payload.append('photo', otherBanquePhoto);
            }

            const response = await axios.post('/banques', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const added = response?.data?.data || null;

            if (added?.id) {
                setBanques((prev) => {
                    if (prev.some((b) => String(b.id) === String(added.id))) return prev;
                    return [...prev, added].sort((a, b) => String(a.banque || '').localeCompare(String(b.banque || ''), 'fr', { sensitivity: 'base' }));
                });
                setFormData((prev) => ({ ...prev, Banque: added.banque || banqueName }));
                setOtherBanque('');
                setOtherBanqueAdresse('');
                setOtherBanquePhoto(null);
                if (otherBanquePhotoInputRef.current) {
                    otherBanquePhotoInputRef.current.value = '';
                }
                return;
            }

            setFormData((prev) => ({ ...prev, Banque: banqueName }));
            setOtherBanque('');
            setOtherBanqueAdresse('');
            setOtherBanquePhoto(null);
            if (otherBanquePhotoInputRef.current) {
                otherBanquePhotoInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error adding banque:', error);
            toast.error(error?.response?.data?.message || 'Impossible d\'ajouter la banque');
        } finally {
            setAddingBanque(false);
        }
    };

    const addAddress = () => {
        setAddresses((prev) => [...prev, { Adresse: '' }]);
    };

    const removeAddress = (index) => {
        setAddresses((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
    };

    const checkEmailUniqueness = async () => {
        const email = String(formData.Email || '').trim();
        if (!email) {
            setEmailCheckMessage('');
            return true;
        }

        setEmailChecking(true);
        try {
            const response = await axios.get('/tiers/check-email', {
                params: {
                    email,
                    excludeId: isEdit ? id : undefined
                }
            });

            const payload = response?.data ?? response;
            if (payload?.unique === false) {
                setEmailCheckMessage(payload?.message || 'Cet email est déjà utilisé.');
                return false;
            }

            setEmailCheckMessage('');
            return true;
        } catch (error) {
            console.error('Error checking email uniqueness:', error);
            setEmailCheckMessage('');
            return true;
        } finally {
            setEmailChecking(false);
        }
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

        if (!String(formData.gouvernorat || '').trim()) {
            toast.error('Le gouvernorat est obligatoire.');
            return;
        }

        // Si l'utilisateur est un commercial, l'affectation est toujours obligatoire (elle est pré-remplie)
        // Mais pour un Admin ou Agent, on peut laisser vide (non obligatoire)
        if (isCommercial && !String(formData.Commercial || '').trim()) {
            toast.error('L\'affectation commerciale (Représentant) est obligatoire.');
            return;
        }

        if (isEdit && String(formData.Commercial || '').trim() && !canAssignCommercial) {
            toast.error('Seuls les clients de classe Prospect peuvent être affectés à un commercial.');
            return;
        }

        const emailUnique = await checkEmailUniqueness();
        if (!emailUnique) {
            toast.error('Cet email est déjà utilisé par un autre client.');
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
        <div className="animate-fade-in space-y-8 pb-12 bg-mesh-luxury min-h-screen">
            {/* Header - Modern Luxury Design */}
            <div className="card-luxury p-8 border-none shadow-xl shadow-slate-200/50">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="group h-12 w-12 bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-100 hover:bg-white rounded-2xl transition-all flex items-center justify-center shadow-sm"
                        >
                            <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider mb-2 border border-indigo-100/50">
                                <SparklesIcon className="h-3 w-3" />
                                Partenariat Stratégique
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                                {isEdit ? 'Modifier Client' : 'Nouveau Partenaire'}
                                {!isEdit && <span className="text-indigo-600 text-sm font-medium px-2 py-0.5 bg-indigo-50 rounded-lg">Draft</span>}
                                {formData.classeAuto && (
                                    <div className={`ml-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-sm ${formData.classeAuto.ClasseCalculee === 'Diamant' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                        formData.classeAuto.ClasseCalculee === 'Gold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            formData.classeAuto.ClasseCalculee === 'Silver' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                                formData.classeAuto.ClasseCalculee === 'Passif' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                    formData.classeAuto.ClasseCalculee === 'Inactif' ? 'bg-slate-100 text-slate-500 border-slate-300' :
                                                        'bg-sky-50 text-sky-700 border-sky-200'
                                        }`}>
                                        <SparklesIcon className="h-3 w-3" />
                                        Classification : {formData.classeAuto.ClasseCalculee}
                                    </div>
                                )}
                            </h1>
                            <p className="text-slate-500 mt-1 text-sm font-medium">
                                {isEdit ? 'Mise à jour des informations et paramètres du compte' : 'Configuration complète du profil client et des conditions commerciales'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/clients')}
                            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-3 font-bold text-xs uppercase tracking-widest disabled:opacity-50 group"
                        >
                            {saving ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <CheckIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            )}
                            <span>{isEdit ? 'Sauvegarder' : 'Créer le Client'}</span>
                        </button>
                    </div>
                </div>

            </div>

            <div className="flex justify-center">
                <form onSubmit={handleSubmit} className="w-full max-w-5xl space-y-6">

                    {/* Main Form Content */}
                    <div className="space-y-6">

                        {/* Step 1: Identity Section */}
                        {(currentStep === 1 || isEdit) && (
                            <div className="card-luxury shadow-sm">
                                <div className="border-b border-slate-200 bg-slate-50/50 py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-sky-100 rounded-xl flex items-center justify-center text-sky-600">
                                            <IdentificationIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold text-slate-800">Identité Juridique</h2>
                                            <p className="text-xs text-slate-500">Informations légales et identification</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Raison Sociale *</label>
                                            <input
                                                type="text"
                                                name="Raisoc"
                                                value={formData.Raisoc}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Catégorie *</label>
                                            <select
                                                name="Categorie"
                                                value={formData.Categorie}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
                                                required
                                            >
                                                <option value="">Sélectionner...</option>
                                                <option value="Étatique">Étatique</option>
                                                <option value="Privé">Privé</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                {/* Navigation Buttons - Step 1 */}
                                {!isEdit && (
                                    <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-4 flex justify-between">
                                        <button
                                            type="button"
                                            onClick={() => navigate('/clients')}
                                            className="px-5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleNextStep}
                                            className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-medium shadow-md shadow-sky-200/50 transition-all"
                                        >
                                            Suivant →
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Contact & Localisation */}
                        {(currentStep === 2 || isEdit) && (
                            <div className="card-luxury shadow-sm">
                                <div className="border-b border-slate-200 bg-slate-50/50 py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                            <MapPinIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold text-slate-800">Contact & Localisation</h2>
                                            <p className="text-xs text-slate-500">Coordonnées et adresse du siège</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Email Professionnel</label>
                                            <div className="relative">
                                                <input
                                                    type="email"
                                                    name="Email"
                                                    value={formData.Email}
                                                    onChange={(e) => {
                                                        setEmailCheckMessage('');
                                                        handleChange(e);
                                                    }}
                                                    onBlur={checkEmailUniqueness}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
                                                />
                                            </div>
                                            {emailCheckMessage ? (
                                                <p className="mt-2 text-sm text-rose-600">{emailCheckMessage}</p>
                                            ) : emailChecking ? (
                                                <p className="mt-2 text-sm text-slate-500">Vérification de l'email...</p>
                                            ) : null}
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Site Web</label>
                                            <input
                                                type="text"
                                                name="www"
                                                value={formData.www}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">CIN / Identifiant</label>
                                            <input
                                                type="text"
                                                name="Cin"
                                                value={formData.Cin}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Ville</label>
                                            <input
                                                type="text"
                                                name="Ville"
                                                value={formData.Ville}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Code Postal</label>
                                            <input
                                                type="text"
                                                name="CodePostal"
                                                value={formData.CodePostal}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Pays</label>
                                            <input
                                                type="text"
                                                name="Pays"
                                                value={formData.Pays}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Gouvernorat *</label>
                                            <select
                                                name="gouvernorat"
                                                value={formData.gouvernorat}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
                                                required
                                            >
                                                <option value="">-- Choisir --</option>
                                                {tiersGouvernorats.map((g) => (
                                                    <option key={g.id} value={g.id}>
                                                        {g.libelle}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation Buttons - Step 2 */}
                                {!isEdit && (
                                    <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-4 flex justify-between">
                                        <button
                                            type="button"
                                            onClick={handlePreviousStep}
                                            className="px-5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all"
                                        >
                                            ← Précédent
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleNextStep}
                                            className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-medium shadow-md shadow-sky-200/50 transition-all"
                                        >
                                            Suivant →
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Contacts Multiples */}
                        {(currentStep === 3 || isEdit) && (
                            <div className="card-luxury p-0 overflow-hidden">
                                <div className="px-8 py-6 border-b border-slate-100/50 bg-gradient-to-r from-blue-50/70 to-transparent flex items-center gap-4">
                                    <div className="icon-shape icon-shape-sm shadow-glow-primary">
                                        <BuildingOffice2Icon className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-800">Contacts et Adresses</h2>
                                        <p className="text-xs text-slate-500">Coordonnées secondaires</p>
                                    </div>
                                </div>
                                <div className="p-8 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 pb-8">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Téléphone Fixe</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <PhoneIcon className="h-4 w-4 text-slate-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="Tel"
                                                    value={formData.Tel}
                                                    onChange={handleChange}
                                                    inputMode="numeric"
                                                    maxLength={8}
                                                    pattern="[0-9]{8}"
                                                    className="input-modern pl-11"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Numéro Mobile</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <PhoneIcon className="h-4 w-4 text-slate-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="Gsm"
                                                    value={formData.Gsm}
                                                    onChange={handleChange}
                                                    inputMode="numeric"
                                                    maxLength={8}
                                                    pattern="[0-9]{8}"
                                                    className="input-modern pl-11"
                                                />
                                            </div>
                                        </div>
                                    </div>
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
                                                <div key={`contact-${index}`} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                                    <div className="md:col-span-6">
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1 tracking-wider">Nom Responsable</label>
                                                        <input
                                                            type="text"
                                                            value={contact.Responsable}
                                                            onChange={(e) => handleContactChange(index, 'Responsable', e.target.value)}
                                                            className="input-modern w-full"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-5">
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1 tracking-wider">Num. Téléphone</label>
                                                        <input
                                                            type="text"
                                                            value={contact.Tel}
                                                            onChange={(e) => handleContactChange(index, 'Tel', e.target.value)}
                                                            inputMode="numeric"
                                                            maxLength={8}
                                                            pattern="[0-9]{8}"
                                                            className="input-modern w-full"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeContact(index)}
                                                            className="h-11 w-full rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                                                            title="Supprimer"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
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

                                {/* Navigation Buttons */}
                                {!isEdit && (
                                    <div className="px-8 py-5 border-t border-slate-100/50 bg-slate-50/50 flex justify-between">
                                        <button
                                            type="button"
                                            onClick={handlePreviousStep}
                                            className="px-5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-medium border border-slate-200 shadow-sm transition-all"
                                        >
                                            ← Précédent
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleNextStep}
                                            className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-medium shadow-md shadow-sky-200/50 transition-all"
                                        >
                                            Suivant →
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 4: Informations Complémentaires */}
                        {(currentStep === 4 || isEdit) && (
                            <div className="card-luxury p-0 overflow-hidden">
                                <div className="px-8 py-6 border-b border-slate-100/50 bg-gradient-to-r from-amber-50/80 to-transparent flex items-center gap-4">
                                    <div className="icon-shape icon-shape-sm" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' }}>
                                        <CreditCardIcon className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-800">Informations Complémentaires</h2>
                                        <p className="text-xs text-slate-500">Données financières et paramètres</p>
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
                                            <select
                                                name="Banque"
                                                value={formData.Banque}
                                                onChange={(e) => {
                                                    handleChange(e);
                                                    if (e.target.value === 'AUTRE') {
                                                        setAddingBanque(true);
                                                    } else {
                                                        setAddingBanque(false);
                                                    }
                                                }}
                                                className="input-modern"
                                                disabled={loadingBanques}
                                            >
                                                <option value="">-- Choisir --</option>
                                                <option value="AUTRE" className="font-bold text-sky-600">+ AJOUTER UNE NOUVELLE BANQUE</option>
                                                {formData.Banque && formData.Banque !== 'AUTRE' && !banques.some((b) => String(b.banque || '').trim() === String(formData.Banque || '').trim()) && (
                                                    <option value={formData.Banque}>{formData.Banque}</option>
                                                )}
                                                {banques.map((banque) => (
                                                    <option key={banque.id || banque.banque} value={banque.banque}>{banque.banque}</option>
                                                ))}
                                            </select>

                                            {addingBanque && (
                                                <div className="mt-4 p-4 bg-sky-50/50 rounded-2xl border border-sky-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="flex items-center gap-2 mb-4 text-sky-700">
                                                        <SparklesIcon className="h-4 w-4" />
                                                        <span className="text-xs font-bold uppercase tracking-wider">Nouvelle Banque</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-4">
                                                        <div>
                                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block ml-1">Nom de la banque</label>
                                                            <input
                                                                type="text"
                                                                value={otherBanque}
                                                                onChange={(e) => setOtherBanque(e.target.value)}
                                                                className="input-modern"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block ml-1">Adresse / Agence</label>
                                                            <input
                                                                type="text"
                                                                value={otherBanqueAdresse}
                                                                onChange={(e) => setOtherBanqueAdresse(e.target.value)}
                                                                className="input-modern"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block ml-1">Logo / Image</label>
                                                            <div className="flex items-center gap-3">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    ref={otherBanquePhotoInputRef}
                                                                    onChange={(e) => setOtherBanquePhoto(e.target.files?.[0] || null)}
                                                                    className="input-modern flex-1 bg-white py-2"
                                                                />
                                                            </div>
                                                            {otherBanquePhoto && <p className="mt-1 text-[10px] text-emerald-600 font-medium ml-1">✓ {otherBanquePhoto.name}</p>}
                                                        </div>
                                                        <div className="flex gap-2 pt-2">
                                                            <button
                                                                type="button"
                                                                onClick={handleAddOtherBanque}
                                                                disabled={!String(otherBanque || '').trim()}
                                                                className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 shadow-sm shadow-sky-200"
                                                            >
                                                                Confirmer l'ajout
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setAddingBanque(false);
                                                                    setFormData(prev => ({ ...prev, Banque: '' }));
                                                                }}
                                                                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                                                            >
                                                                Annuler
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
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

                                    {/* Commercial Settings Inline */}
                                    <div className="mt-8 pt-6 border-t border-slate-200">
                                        <h3 className="text-sm font-bold text-slate-800 mb-4">Paramètres Commerciaux</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="label-modern">Représentant {isCommercial ? '*' : '(Optionnel)'}</label>
                                                <select
                                                    name="Commercial"
                                                    value={formData.Commercial}
                                                    onChange={handleChange}
                                                    className="input-modern"
                                                    disabled={(isEdit && !canAssignCommercial) || (!isEdit && isCommercial)}
                                                >
                                                    <option value="">-- Choisir --</option>
                                                    {isCommercial && !commercialsList.some(c => String(c.LoginName || c.UserID) === String(formData.Commercial)) && (
                                                        <option value={formData.Commercial}>{user?.FullName || formData.Commercial}</option>
                                                    )}
                                                    {commercialsList.map((commercial) => (
                                                        <option key={commercial.UserID || commercial.LoginName} value={String(commercial.LoginName || commercial.UserID || '')}>
                                                            {commercial.FullName || commercial.LoginName || commercial.UserID}
                                                        </option>
                                                    ))}
                                                </select>
                                                {!canAssignCommercial && !isEdit && (
                                                    <p className="mt-2 text-[11px] text-indigo-600 font-medium">
                                                        Note : Ce nouveau client sera créé avec le statut "Prospect".
                                                    </p>
                                                )}
                                                {isCommercial && !isEdit && (
                                                    <p className="mt-2 text-[11px] text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded">
                                                        ✓ Affectation automatique : Vous êtes le responsable de ce nouveau prospect.
                                                    </p>
                                                )}
                                                {(isAdmin || isAgent) && !isEdit && (
                                                    <p className="mt-2 text-[11px] text-slate-500 italic">
                                                        Le client sera créé en tant que "Prospect" et affecté au commercial choisi.
                                                    </p>
                                                )}
                                                {isEdit && !canAssignCommercial && (
                                                    <p className="mt-2 text-[11px] text-amber-600 font-medium">
                                                        L'affectation n'est possible que pour les clients de classe "Prospect".
                                                    </p>
                                                )}
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

                                {/* Navigation Buttons */}
                                {!isEdit && (
                                    <div className="px-8 py-5 border-t border-slate-100/50 bg-slate-50/50 flex justify-between">
                                        <button
                                            type="button"
                                            onClick={handlePreviousStep}
                                            className="px-5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-medium border border-slate-200 shadow-sm transition-all"
                                        >
                                            ← Précédent
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-medium shadow-lg shadow-emerald-200/50 transition-all"
                                        >
                                            ✓ Enregistrer
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                </form>
            </div>
        </div>
    );
};

export default ClientForm;
