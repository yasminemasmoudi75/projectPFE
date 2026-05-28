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
    UserIcon,
    GlobeAltIcon,
    BanknotesIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';

const PHONE_FIELDS = ['Tel', 'Gsm', 'Fax'];

const normalizePhone = (value) => String(value || '').replace(/\D/g, '').slice(0, 8);
const isPhoneValid = (value) => value === '' || /^\d{8}$/.test(value);

const STEPS = [
    { id: 1, label: 'Identité', sublabel: 'Infos légales', icon: IdentificationIcon, color: 'sky' },
    { id: 2, label: 'Localisation', sublabel: 'Adresse & région', icon: MapPinIcon, color: 'sky' },
    { id: 3, label: 'Contacts', sublabel: 'Tél, email & responsables', icon: BuildingOffice2Icon, color: 'sky' },
    { id: 4, label: 'Financier', sublabel: 'Conditions', icon: CreditCardIcon, color: 'sky' },
];

const STEP_COLORS = {
    sky:     { bg: 'bg-sky-500',     light: 'bg-sky-50',     text: 'text-sky-600',     border: 'border-sky-200',     ring: 'ring-sky-200',     shadow: 'shadow-sky-200/50',    gradient: 'from-sky-50 to-blue-50/30',    inputFocus: 'focus:border-sky-400 focus:ring-2 focus:ring-sky-100',     divider: 'border-sky-100',     h3: 'text-sky-600' },
    emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', ring: 'ring-emerald-200', shadow: 'shadow-emerald-200/50', gradient: 'from-emerald-50 to-teal-50/30', inputFocus: 'focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100', divider: 'border-emerald-100', h3: 'text-emerald-600' },
    violet:  { bg: 'bg-violet-500',  light: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-200',  ring: 'ring-violet-200',  shadow: 'shadow-violet-200/50',  gradient: 'from-violet-50 to-purple-50/30', inputFocus: 'focus:border-violet-400 focus:ring-2 focus:ring-violet-100', divider: 'border-violet-100', h3: 'text-violet-600' },
    amber:   { bg: 'bg-amber-500',   light: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200',   ring: 'ring-amber-200',   shadow: 'shadow-amber-200/50',   gradient: 'from-amber-50 to-orange-50/30', inputFocus: 'focus:border-amber-400 focus:ring-2 focus:ring-amber-100',   divider: 'border-amber-100', h3: 'text-amber-600' },
};

const InputField = ({ label, required, error, children, hint }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {label} {required && <span className="text-rose-400">*</span>}
        </label>
        {children}
        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
        {hint && !error && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
);

const inputBase = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none transition-all text-sm";
const inputClass = `${inputBase} focus:border-sky-400 focus:ring-2 focus:ring-sky-100`;
const ic = (color) => `${inputBase} ${STEP_COLORS[color].inputFocus}`;

const ClientForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);

    const [loadingCode, setLoadingCode] = useState(false);

    const [formData, setFormData] = useState({
        CodTiers: '',
        Raisoc: '',
        Prenom: '',
        Nom: '',
        Classe: '',
        Categorie: '',
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

    const validateStep1 = () => Boolean(formData.Raisoc);
    const validateStep2 = () => formData.gouvernorat;
    const validateStep3 = () => true;
    const validateStep4 = () => true;

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
        if (completedSteps.has(step) || step <= currentStep) {
            setCurrentStep(step);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const fetchNextCode = async () => {
        setLoadingCode(true);
        try {
            const response = await axios.get('/tiers/next-code');
            const code = response?.data?.data || response?.data || '';
            if (code) setFormData(prev => ({ ...prev, CodTiers: code }));
        } catch (error) {
            console.error('Error fetching next code:', error);
        } finally {
            setLoadingCode(false);
        }
    };

    useEffect(() => {
        const fetchTiersClasses = async () => {
            try {
                const response = await axios.get('/tiers-classes');
                const payload = response?.data?.data || response?.data || [];
                const list = Array.isArray(payload) ? payload : [];
                setTiersClasses(list);
                if (!isEdit) {
                    const prospect = list.find(cl => String(cl.libelle || '').trim().toLowerCase() === 'prospect');
                    if (prospect) setFormData(prev => ({ ...prev, Classe: String(prospect.id) }));
                }
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

        if (!isEdit) fetchNextCode();

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

                    if (!data) throw new Error('Client introuvable');

                    setFormData({
                        CodTiers: data.CodTiers || '',
                        Raisoc: data.Raisoc || '',
                        Prenom: data.Prenom || '',
                        Nom: data.Nom || '',
                        Classe: data.Classe || '',
                        Categorie: data.Categorie || '',
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
                            ? data.contacts.map((c) => ({ Responsable: c.Responsable || '', Tel: normalizePhone(c.Tel), classeAuto: c.classeAuto }))
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

    const addContact = () => setContacts((prev) => [...prev, { Responsable: '', Tel: '' }]);
    const removeContact = (index) => setContacts((prev) => prev.length === 1 ? prev : prev.filter((_, i) => i !== index));
    const handleAddressChange = (index, value) => setAddresses((prev) => prev.map((item, i) => i === index ? { ...item, Adresse: value } : item));
    const addAddress = () => setAddresses((prev) => [...prev, { Adresse: '' }]);
    const removeAddress = (index) => setAddresses((prev) => prev.length === 1 ? prev : prev.filter((_, i) => i !== index));

    const handleAddOtherBanque = async () => {
        const banqueName = String(otherBanque || '').trim();
        if (!banqueName) return;
        try {
            setAddingBanque(true);
            const payload = new FormData();
            payload.append('banque', banqueName);
            const adresse = String(otherBanqueAdresse || '').trim();
            if (adresse) payload.append('adresse', adresse);
            if (otherBanquePhoto) payload.append('photo', otherBanquePhoto);

            const response = await axios.post('/banques', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
            const added = response?.data?.data || null;

            if (added?.id) {
                setBanques((prev) => {
                    if (prev.some((b) => String(b.id) === String(added.id))) return prev;
                    return [...prev, added].sort((a, b) => String(a.banque || '').localeCompare(String(b.banque || ''), 'fr', { sensitivity: 'base' }));
                });
                setFormData((prev) => ({ ...prev, Banque: added.banque || banqueName }));
            } else {
                setFormData((prev) => ({ ...prev, Banque: banqueName }));
            }
            setOtherBanque('');
            setOtherBanqueAdresse('');
            setOtherBanquePhoto(null);
            if (otherBanquePhotoInputRef.current) otherBanquePhotoInputRef.current.value = '';
        } catch (error) {
            console.error('Error adding banque:', error);
            toast.error(error?.response?.data?.message || "Impossible d'ajouter la banque");
        } finally {
            setAddingBanque(false);
        }
    };

    const checkEmailUniqueness = async () => {
        const email = String(formData.Email || '').trim();
        if (!email) { setEmailCheckMessage(''); return true; }
        setEmailChecking(true);
        try {
            const response = await axios.get('/tiers/check-email', { params: { email, excludeId: isEdit ? id : undefined } });
            const payload = response?.data ?? response;
            if (payload?.unique === false) {
                setEmailCheckMessage(payload?.message || 'Cet email est déjà utilisé.');
                return false;
            }
            setEmailCheckMessage('');
            return true;
        } catch {
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
        if (contacts.some((c) => !isPhoneValid(c.Tel))) {
            toast.error('Les téléphones des contacts doivent contenir exactement 8 chiffres.');
            return;
        }
        if (!String(formData.gouvernorat || '').trim()) {
            toast.error('Le gouvernorat est obligatoire.');
            return;
        }
        if (isCommercial && !String(formData.Commercial || '').trim()) {
            toast.error("L'affectation commerciale (Représentant) est obligatoire.");
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
                const res = await axios.post('/tiers', payload);
                toast.success('Client créé avec succès');
                if (res?.data?.emailSent === false) {
                    toast.error(
                        "Le compte a été créé mais l'email avec les identifiants n'a pas pu être envoyé. Vérifiez la configuration SMTP.",
                        { duration: 6000 }
                    );
                }
            }
            navigate('/clients');
        } catch (error) {
            const serverErrors = error.response?.data?.errors;
            if (serverErrors && Array.isArray(serverErrors)) {
                serverErrors.forEach(err => toast.error(`${err.field}: ${err.message}`));
            } else {
                toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement");
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    const currentColor = isEdit ? STEP_COLORS.sky : STEP_COLORS[STEPS[currentStep - 1].color];
    const progressPct = isEdit ? 100 : Math.round(((currentStep - 1) / (totalSteps - 1)) * 100);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50 pb-16">

            {/* ── Header ── */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="group h-10 w-10 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-xl flex items-center justify-center transition-all"
                        >
                            <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold text-slate-800">
                                    {isEdit ? 'Modifier le client' : 'Nouveau client'}
                                </h1>
                                {!isEdit && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                                        {currentStep} / {totalSteps}
                                    </span>
                                )}
                                {formData.classeAuto && (
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                        formData.classeAuto.ClasseCalculee === 'Diamant' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                        formData.classeAuto.ClasseCalculee === 'Gold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        formData.classeAuto.ClasseCalculee === 'Silver' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                        'bg-sky-50 text-sky-700 border-sky-200'
                                    }`}>
                                        {formData.classeAuto.ClasseCalculee}
                                    </span>
                                )}
                            </div>
                            {isEdit && formData.Raisoc && (
                                <p className="text-xs text-slate-500">{formData.Raisoc}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/clients')}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                        >
                            Annuler
                        </button>
                        {(isEdit || currentStep === totalSteps) && (
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="px-5 py-2 text-sm font-bold text-white bg-[#004792] hover:bg-[#003370] rounded-xl shadow-md shadow-[#004792]/30 transition-all flex items-center gap-2 disabled:opacity-60"
                            >
                                {saving ? (
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <CheckIcon className="h-4 w-4" />
                                )}
                                {isEdit ? 'Sauvegarder' : 'Créer le client'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 pt-8 space-y-6">


                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ═══════════════════════════════════════════════════════
                        ÉTAPE 1 — Identité Juridique
                    ═══════════════════════════════════════════════════════ */}
                    {(currentStep === 1 || isEdit) && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className={`px-6 py-4 border-b border-slate-100 bg-gradient-to-r ${STEP_COLORS.sky.gradient} flex items-center gap-3`}>
                                <div className={`h-9 w-9 ${STEP_COLORS.sky.bg} rounded-xl flex items-center justify-center shadow-md ${STEP_COLORS.sky.shadow}`}>
                                    <IdentificationIcon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-800">Identité Juridique</h2>
                                    <p className="text-[11px] text-slate-500">Informations légales et identification du partenaire</p>
                                </div>
                                {!isEdit && <span className={`ml-auto text-[10px] font-bold uppercase ${STEP_COLORS.sky.text} ${STEP_COLORS.sky.light} px-2.5 py-1 rounded-full`}>Étape 1</span>}
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Code auto + Raison sociale */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <InputField label="Code Client" hint="Généré automatiquement">
                                        <div className="flex items-center gap-2">
                                            <div className={`flex-1 flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl ${loadingCode ? 'animate-pulse' : ''}`}>
                                                <span className="text-sm font-bold text-sky-600 tracking-wider">
                                                    {loadingCode ? '...' : (formData.CodTiers || '—')}
                                                </span>
                                            </div>
                                            {!isEdit && (
                                                <button
                                                    type="button"
                                                    onClick={fetchNextCode}
                                                    disabled={loadingCode}
                                                    className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-all disabled:opacity-50"
                                                    title="Regénérer le code"
                                                >
                                                    <ArrowPathIcon className={`h-4 w-4 ${loadingCode ? 'animate-spin' : ''}`} />
                                                </button>
                                            )}
                                        </div>
                                    </InputField>
                                    <div className="md:col-span-2">
                                        <InputField label="Raison Sociale" required>
                                            <input
                                                type="text"
                                                name="Raisoc"
                                                value={formData.Raisoc}
                                                onChange={handleChange}
                                                placeholder="Nom complet de l'entreprise"
                                                className={`${ic('sky')} font-semibold`}
                                                required
                                            />
                                        </InputField>
                                    </div>
                                </div>

                                {/* Prénom + Nom + CIN */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <InputField label="Prénom du responsable">
                                        <input type="text" name="Prenom" value={formData.Prenom} onChange={handleChange} placeholder="Prénom" className={ic('sky')} />
                                    </InputField>
                                    <InputField label="Nom du responsable">
                                        <input type="text" name="Nom" value={formData.Nom} onChange={handleChange} placeholder="Nom de famille" className={ic('sky')} />
                                    </InputField>
                                    <InputField label="CIN / Identifiant">
                                        <input type="text" name="Cin" value={formData.Cin} onChange={handleChange} placeholder="N° CIN" className={ic('sky')} />
                                    </InputField>
                                </div>

                                {/* Catégorie + Classe (auto Prospect) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField label="Catégorie">
                                        <select name="Categorie" value={formData.Categorie} onChange={handleChange} className={ic('sky')}>
                                            <option value="">Sélectionner...</option>
                                            <option value="Étatique">Étatique</option>
                                            <option value="Privé">Privé</option>
                                        </select>
                                    </InputField>
                                    <InputField label="Classe" hint={!isEdit ? 'Définie automatiquement à Prospect' : undefined}>
                                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${isEdit ? 'bg-white border-slate-200' : 'bg-indigo-50 border-indigo-200'}`}>
                                            {isEdit ? (
                                                <select name="Classe" value={formData.Classe} onChange={handleChange} className="flex-1 bg-transparent text-sm text-slate-700 focus:outline-none">
                                                    <option value="">Sélectionner...</option>
                                                    {tiersClasses.map((cl) => (
                                                        <option key={cl.id} value={cl.id}>{cl.libelle}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <>
                                                    <SparklesIcon className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                                                    <span className="text-sm font-bold text-indigo-700">
                                                        {tiersClasses.find(cl => String(cl.id) === String(formData.Classe))?.libelle || 'Prospect'}
                                                    </span>
                                                    <input type="hidden" name="Classe" value={formData.Classe} />
                                                </>
                                            )}
                                        </div>
                                    </InputField>
                                </div>
                            </div>

                            {!isEdit && (
                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/clients')}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNextStep}
                                        disabled={!validateStep1()}
                                        className={`px-6 py-2 text-sm font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${STEP_COLORS.sky.bg} ${STEP_COLORS.sky.shadow} hover:opacity-90`}
                                    >
                                        Suivant
                                        <span>→</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
                        ÉTAPE 2 — Contact & Localisation
                    ═══════════════════════════════════════════════════════ */}
                    {(currentStep === 2 || isEdit) && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className={`px-6 py-4 border-b border-slate-100 bg-gradient-to-r ${STEP_COLORS.sky.gradient} flex items-center gap-3`}>
                                <div className={`h-9 w-9 ${STEP_COLORS.sky.bg} rounded-xl flex items-center justify-center shadow-md ${STEP_COLORS.sky.shadow}`}>
                                    <MapPinIcon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-800">Localisation</h2>
                                    <p className="text-[11px] text-slate-500">Adresse et situation géographique</p>
                                </div>
                                {!isEdit && <span className={`ml-auto text-[10px] font-bold uppercase ${STEP_COLORS.sky.text} ${STEP_COLORS.sky.light} px-2.5 py-1 rounded-full`}>Étape 2</span>}
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Adresse */}
                                <div>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${STEP_COLORS.sky.h3}`}>
                                        <MapPinIcon className="h-3.5 w-3.5" /> Adresse principale
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <InputField label="Adresse">
                                                <input type="text" name="Adresse" value={formData.Adresse} onChange={handleChange} placeholder="Rue, numéro, bâtiment..." className={ic('sky')} />
                                            </InputField>
                                        </div>
                                        <InputField label="Ville">
                                            <input type="text" name="Ville" value={formData.Ville} onChange={handleChange} placeholder="Ex: Tunis" className={ic('sky')} />
                                        </InputField>
                                        <InputField label="Code postal">
                                            <input type="text" name="CodePostal" value={formData.CodePostal} onChange={handleChange} placeholder="Ex: 1000" className={ic('sky')} />
                                        </InputField>
                                    </div>
                                </div>

                                <div className={`border-t border-dashed ${STEP_COLORS.sky.divider}`} />

                                {/* Gouvernorat + Pays */}
                                <div>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${STEP_COLORS.sky.h3}`}>
                                        <MapPinIcon className="h-3.5 w-3.5" /> Région
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField label="Gouvernorat" required>
                                            <select name="gouvernorat" value={formData.gouvernorat} onChange={handleChange} className={ic('sky')} required>
                                                <option value="">-- Choisir un gouvernorat --</option>
                                                {tiersGouvernorats.map((g) => (
                                                    <option key={g.id} value={g.id}>{g.libelle}</option>
                                                ))}
                                            </select>
                                        </InputField>
                                        <InputField label="Pays">
                                            <input type="text" name="Pays" value={formData.Pays} onChange={handleChange} placeholder="Ex: Tunisie" className={ic('sky')} />
                                        </InputField>
                                    </div>
                                </div>
                            </div>

                            {!isEdit && (
                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between">
                                    <button type="button" onClick={handlePreviousStep} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">← Précédent</button>
                                    <button type="button" onClick={handleNextStep} disabled={!validateStep2()} className={`px-6 py-2 text-sm font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${STEP_COLORS.sky.bg} ${STEP_COLORS.sky.shadow} hover:opacity-90`}>
                                        Suivant →
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
                        ÉTAPE 3 — Contacts & Adresses secondaires
                    ═══════════════════════════════════════════════════════ */}
                    {(currentStep === 3 || isEdit) && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className={`px-6 py-4 border-b border-slate-100 bg-gradient-to-r ${STEP_COLORS.sky.gradient} flex items-center gap-3`}>
                                <div className={`h-9 w-9 ${STEP_COLORS.sky.bg} rounded-xl flex items-center justify-center shadow-md ${STEP_COLORS.sky.shadow}`}>
                                    <UserIcon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-800">Contacts & Coordonnées</h2>
                                    <p className="text-[11px] text-slate-500">Téléphone, email, site web et responsables</p>
                                </div>
                                {!isEdit && <span className={`ml-auto text-[10px] font-bold uppercase ${STEP_COLORS.sky.text} ${STEP_COLORS.sky.light} px-2.5 py-1 rounded-full`}>Étape 3</span>}
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Email + Site web */}
                                <div>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${STEP_COLORS.sky.h3}`}>
                                        <EnvelopeIcon className="h-3.5 w-3.5" />
                                        Coordonnées électroniques
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField
                                            label="Email professionnel"
                                            required
                                            error={emailCheckMessage}
                                            hint={emailChecking ? 'Vérification en cours...' : 'Utilisé pour la connexion au compte client'}
                                        >
                                            <div className="relative">
                                                <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <input
                                                    type="email"
                                                    name="Email"
                                                    value={formData.Email}
                                                    onChange={(e) => { setEmailCheckMessage(''); handleChange(e); }}
                                                    onBlur={checkEmailUniqueness}
                                                    placeholder="contact@entreprise.com"
                                                    className={`${ic('sky')} pl-10 ${emailCheckMessage ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : ''}`}
                                                />
                                            </div>
                                        </InputField>
                                        <InputField label="Site web">
                                            <div className="relative">
                                                <GlobeAltIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <input type="text" name="www" value={formData.www} onChange={handleChange} placeholder="www.entreprise.com" className={`${ic('sky')} pl-10`} />
                                            </div>
                                        </InputField>
                                    </div>
                                </div>

                                <div className={`border-t border-dashed ${STEP_COLORS.sky.divider}`} />

                                {/* Tel + Mobile + Fax */}
                                <div>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${STEP_COLORS.sky.h3}`}>
                                        <PhoneIcon className="h-3.5 w-3.5" />
                                        Numéros de téléphone
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField label="Téléphone fixe" hint="8 chiffres">
                                            <div className="relative">
                                                <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <input type="text" name="Tel" value={formData.Tel} onChange={handleChange} inputMode="numeric" maxLength={8} placeholder="XXXXXXXX" className={`${ic('sky')} pl-10`} />
                                            </div>
                                        </InputField>
                                        <InputField label="Mobile / GSM" hint="8 chiffres">
                                            <div className="relative">
                                                <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <input type="text" name="Gsm" value={formData.Gsm} onChange={handleChange} inputMode="numeric" maxLength={8} placeholder="XXXXXXXX" className={`${ic('sky')} pl-10`} />
                                            </div>
                                        </InputField>
                                        {/* Fax — optionnel, affiché en discret */}
                                        <InputField label="Fax" hint="Optionnel — 8 chiffres">
                                            <div className="relative">
                                                <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                                <input type="text" name="Fax" value={formData.Fax} onChange={handleChange} inputMode="numeric" maxLength={8} placeholder="XXXXXXXX" className={`${ic('sky')} pl-10 text-slate-400`} />
                                            </div>
                                        </InputField>
                                    </div>
                                </div>

                                <div className={`border-t border-dashed ${STEP_COLORS.sky.divider}`} />

                                {/* Liste de contacts */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-800">Contacts responsables</h3>
                                            <p className="text-[11px] text-slate-500">Personnes à contacter au sein de l'entreprise</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addContact}
                                            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl ${STEP_COLORS.sky.light} ${STEP_COLORS.sky.text} ${STEP_COLORS.sky.border} border hover:opacity-80 transition-all`}
                                        >
                                            <PlusIcon className="h-3.5 w-3.5" />
                                            Ajouter
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {contacts.map((contact, index) => (
                                            <div key={`contact-${index}`} className="flex gap-3 items-end p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Nom du responsable</label>
                                                    <input
                                                        type="text"
                                                        value={contact.Responsable}
                                                        onChange={(e) => handleContactChange(index, 'Responsable', e.target.value)}
                                                        placeholder="Prénom Nom"
                                                        className={inputClass}
                                                    />
                                                </div>
                                                <div className="w-36">
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Téléphone</label>
                                                    <input
                                                        type="text"
                                                        value={contact.Tel}
                                                        onChange={(e) => handleContactChange(index, 'Tel', e.target.value)}
                                                        inputMode="numeric"
                                                        maxLength={8}
                                                        placeholder="XXXXXXXX"
                                                        className={inputClass}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeContact(index)}
                                                    className="h-10 w-10 flex-shrink-0 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-dashed border-slate-200" />

                                {/* Liste d'adresses */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-800">Adresses secondaires</h3>
                                            <p className="text-[11px] text-slate-500">Sites, entrepôts, agences supplémentaires</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addAddress}
                                            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl ${STEP_COLORS.sky.light} ${STEP_COLORS.sky.text} ${STEP_COLORS.sky.border} border hover:opacity-80 transition-all`}
                                        >
                                            <PlusIcon className="h-3.5 w-3.5" />
                                            Ajouter
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {addresses.map((address, index) => (
                                            <div key={`address-${index}`} className="flex gap-3 items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <input
                                                    type="text"
                                                    value={address.Adresse}
                                                    onChange={(e) => handleAddressChange(index, e.target.value)}
                                                    placeholder="Adresse complète..."
                                                    className={`${inputClass} flex-1`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeAddress(index)}
                                                    className="h-10 w-10 flex-shrink-0 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {!isEdit && (
                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between">
                                    <button type="button" onClick={handlePreviousStep} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">← Précédent</button>
                                    <button type="button" onClick={handleNextStep} className={`px-6 py-2 text-sm font-bold text-white rounded-xl shadow-md transition-all ${STEP_COLORS.sky.bg} ${STEP_COLORS.sky.shadow} hover:opacity-90`}>
                                        Suivant →
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
                        ÉTAPE 4 — Informations Financières & Commerciales
                    ═══════════════════════════════════════════════════════ */}
                    {(currentStep === 4 || isEdit) && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className={`px-6 py-4 border-b border-slate-100 bg-gradient-to-r ${STEP_COLORS.sky.gradient} flex items-center gap-3`}>
                                <div className={`h-9 w-9 ${STEP_COLORS.sky.bg} rounded-xl flex items-center justify-center shadow-md ${STEP_COLORS.sky.shadow}`}>
                                    <BanknotesIcon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-800">Informations Financières & Commerciales</h2>
                                    <p className="text-[11px] text-slate-500">Données comptables, bancaires et conditions de paiement</p>
                                </div>
                                {!isEdit && <span className={`ml-auto text-[10px] font-bold uppercase ${STEP_COLORS.sky.text} ${STEP_COLORS.sky.light} px-2.5 py-1 rounded-full`}>Étape 4</span>}
                            </div>

                            <div className="p-6 space-y-6">

                                {/* Identifiants légaux */}
                                <div>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${STEP_COLORS.sky.h3}`}>
                                        <IdentificationIcon className="h-3.5 w-3.5" />
                                        Identifiants légaux
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField label="Matricule fiscale">
                                            <input type="text" name="MatriculeFiscale" value={formData.MatriculeFiscale} onChange={handleChange} placeholder="Ex: 123456A" className={ic('sky')} />
                                        </InputField>
                                        <InputField label="Banque principale">
                                            <select
                                                name="Banque"
                                                value={formData.Banque}
                                                onChange={(e) => {
                                                    handleChange(e);
                                                    setAddingBanque(e.target.value === 'AUTRE');
                                                }}
                                                className={ic('sky')}
                                                disabled={loadingBanques}
                                            >
                                                <option value="">-- Choisir --</option>
                                                <option value="AUTRE" className="font-bold text-sky-600">+ Ajouter une nouvelle banque</option>
                                                {formData.Banque && formData.Banque !== 'AUTRE' && !banques.some((b) => String(b.banque || '').trim() === String(formData.Banque || '').trim()) && (
                                                    <option value={formData.Banque}>{formData.Banque}</option>
                                                )}
                                                {banques.map((banque) => (
                                                    <option key={banque.id || banque.banque} value={banque.banque}>{banque.banque}</option>
                                                ))}
                                            </select>
                                        </InputField>
                                    </div>

                                    {addingBanque && (
                                        <div className="mt-4 p-4 bg-sky-50 rounded-xl border border-sky-200">
                                            <div className="flex items-center gap-2 mb-3 text-sky-700">
                                                <SparklesIcon className="h-4 w-4" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Nouvelle banque</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <InputField label="Nom de la banque">
                                                    <input type="text" value={otherBanque} onChange={(e) => setOtherBanque(e.target.value)} placeholder="Ex: BNA, STB..." className={ic('sky')} />
                                                </InputField>
                                                <InputField label="Adresse / Agence">
                                                    <input type="text" value={otherBanqueAdresse} onChange={(e) => setOtherBanqueAdresse(e.target.value)} className={ic('sky')} />
                                                </InputField>
                                                <div className="md:col-span-2">
                                                    <InputField label="Logo / Image">
                                                        <input type="file" accept="image/*" ref={otherBanquePhotoInputRef} onChange={(e) => setOtherBanquePhoto(e.target.files?.[0] || null)} className={`${ic('sky')} py-2`} />
                                                    </InputField>
                                                    {otherBanquePhoto && <p className="mt-1 text-[11px] text-emerald-600 font-medium">✓ {otherBanquePhoto.name}</p>}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-3">
                                                <button type="button" onClick={handleAddOtherBanque} disabled={!String(otherBanque || '').trim()} className="flex-1 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-all">
                                                    Confirmer l'ajout
                                                </button>
                                                <button type="button" onClick={() => { setAddingBanque(false); setFormData(prev => ({ ...prev, Banque: '' })); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50">
                                                    Annuler
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className={`border-t border-dashed ${STEP_COLORS.sky.divider}`} />

                                {/* Conditions financières */}
                                <div>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${STEP_COLORS.sky.h3}`}>
                                        <CreditCardIcon className="h-3.5 w-3.5" />
                                        Conditions financières
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField label="Remise (%)">
                                            <input type="number" min="0" step="0.001" name="Remise" value={formData.Remise} onChange={handleChange} placeholder="0.000" className={ic('sky')} />
                                        </InputField>
                                        <InputField label="Plafond crédit">
                                            <input type="number" min="0" step="0.01" name="Plafondcredit" value={formData.Plafondcredit} onChange={handleChange} placeholder="0.00" className={ic('sky')} />
                                        </InputField>
                                    </div>
                                </div>

                                <div className={`border-t border-dashed ${STEP_COLORS.sky.divider}`} />

                                {/* Options booléennes */}
                                <div>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${STEP_COLORS.sky.h3}`}>Options & statuts</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {[
                                            { key: 'Actif', label: 'Actif', color: 'emerald' },
                                            { key: 'Blockage', label: 'Bloqué', color: 'rose' },
                                            { key: 'Timbre', label: 'Timbre', color: 'sky' },
                                            { key: 'Major', label: 'Majoration', color: 'amber' },
                                            { key: 'Exonor', label: 'Exonéré', color: 'violet' },
                                            { key: 'assujet', label: 'Assujetti', color: 'blue' },
                                            { key: 'Fictif', label: 'Fictif', color: 'slate' },
                                            { key: 'Pub', label: 'Pub', color: 'pink' },
                                        ].map(({ key, label }) => (
                                            <label
                                                key={key}
                                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                                                    formData[key]
                                                        ? 'bg-sky-50 border-sky-200 text-sky-700'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    name={key}
                                                    checked={Boolean(formData[key])}
                                                    onChange={handleChange}
                                                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-200"
                                                />
                                                <span className="text-xs font-semibold">{label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className={`border-t border-dashed ${STEP_COLORS.sky.divider}`} />

                                {/* Paramètres commerciaux */}
                                <div>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${STEP_COLORS.sky.h3}`}>
                                        <SparklesIcon className="h-3.5 w-3.5" />
                                        Paramètres commerciaux
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <InputField label={`Représentant commercial ${isCommercial ? '*' : '(optionnel)'}`}>
                                                <select
                                                    name="Commercial"
                                                    value={formData.Commercial}
                                                    onChange={handleChange}
                                                    className={ic('sky')}
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
                                            </InputField>
                                            {!canAssignCommercial && !isEdit && (
                                                <p className="mt-2 text-[11px] text-indigo-600">Ce client sera créé avec le statut "Prospect".</p>
                                            )}
                                            {isCommercial && !isEdit && (
                                                <p className="mt-2 text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                                    ✓ Affectation automatique : vous êtes le responsable.
                                                </p>
                                            )}
                                            {(isAdmin || isAgent) && !isEdit && (
                                                <p className="mt-2 text-[11px] text-slate-400 italic">Le client sera créé en tant que "Prospect".</p>
                                            )}
                                            {isEdit && !canAssignCommercial && (
                                                <p className="mt-2 text-[11px] text-amber-600">L'affectation n'est possible que pour les clients de classe "Prospect".</p>
                                            )}
                                        </div>
                                        <InputField label="Conditions de paiement">
                                            <select name="ConditionPaiement" value={formData.ConditionPaiement} onChange={handleChange} className={ic('sky')}>
                                                <option>Comptant</option>
                                                <option>30 jours</option>
                                                <option>30 jours fin de mois</option>
                                                <option>60 jours</option>
                                            </select>
                                        </InputField>
                                    </div>
                                </div>
                            </div>

                            {!isEdit && (
                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between">
                                    <button type="button" onClick={handlePreviousStep} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">← Précédent</button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-6 py-2 text-sm font-bold text-white bg-[#004792] hover:bg-[#003370] rounded-xl shadow-lg shadow-[#004792]/30 transition-all flex items-center gap-2 disabled:opacity-60"
                                    >
                                        {saving ? (
                                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <CheckIcon className="h-4 w-4" />
                                        )}
                                        Enregistrer le client
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                </form>
            </div>
        </div>
    );
};

export default ClientForm;
