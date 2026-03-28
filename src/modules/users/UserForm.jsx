import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    CheckIcon,
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    BriefcaseIcon,
    BuildingOfficeIcon,
    LockClosedIcon,
    IdentificationIcon,
    ShieldCheckIcon,
    UserCircleIcon,
    KeyIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import axios from '../../app/axios';

const UserForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        LoginName: '',
        Password: '',
        ConfirmPassword: '',
        Nom: '',
        Prenom: '',
        Code: '',
        Gouvernorat: '',
        EmailPro: '',
        UserRole: 'Agent',
        TelPro: '',
        Poste: '',
        Departement: '',
        IsActive: true
    });

    useEffect(() => {
        if (isEdit) {
            const fetchUser = async () => {
                try {
                    const response = await axios.get(`/users/${id}`);
                    if (response.status === 'success') {
                        const user = response.data;
                        // Split FullName into Nom and Prenom
                        const nameParts = (user.FullName || '').split(' ');
                        const prenom = nameParts[0] || '';
                        const nom = nameParts.slice(1).join(' ') || '';
                        
                        setFormData({
                            LoginName: user.LoginName || '',
                            Password: '',
                            ConfirmPassword: '',
                            Nom: nom,
                            Prenom: prenom,
                            Code: user.Code || '',
                            Gouvernorat: user.Gouvernorat || '',
                            EmailPro: user.EmailPro || '',
                            UserRole: user.UserRole || 'Agent',
                            TelPro: user.TelPro || '',
                            Poste: user.PosteOccupe || '',
                            Departement: user.Departement || '',
                            IsActive: user.IsActive
                        });
                    }
                } catch (error) {
                    toast.error('Erreur lors du chargement de l\'utilisateur');
                    navigate('/users');
                } finally {
                    setLoading(false);
                }
            };
            fetchUser();
        }
    }, [id, isEdit, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Validation du numéro de téléphone tunisien
    const isValidPhoneNumber = (phone) => {
        if (!phone) return true; // Le téléphone est optionnel
        
        // Supprimer tous les espaces, tirets, points et parenthèses
        const cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
        
        // Accepter les formats:
        // - 8 chiffres (ex: 25123456)
        // - 10 chiffres avec +216 (ex: +21625123456)
        // - 12 chiffres sans + (ex: 21625123456)
        
        if (cleaned.length === 8) {
            // Format local: 8 chiffres
            return /^[0-9]{8}$/.test(cleaned);
        } else if (cleaned.length === 10) {
            // Format international sans +
            return /^216[0-9]{8}$/.test(cleaned);
        } else if (cleaned.startsWith('+216') && cleaned.length === 13) {
            // Format international avec +
            return /^\+216[0-9]{8}$/.test(cleaned);
        }
        
        return false;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validations
        if (formData.TelPro && !isValidPhoneNumber(formData.TelPro)) {
            toast.error('Numéro de téléphone invalide. Format accepté: 8 chiffres (ex: 25123456) ou +216 25123456');
            return;
        }

        if (formData.Password !== formData.ConfirmPassword) {
            toast.error('Les mots de passe ne correspondent pas');
            return;
        }
        
        if (!isEdit && !formData.Password) {
            toast.error('Le mot de passe est requis pour la création');
            return;
        }

        setSaving(true);

        try {
            // Combine Nom and Prenom into FullName
            const FullName = `${formData.Prenom} ${formData.Nom}`.trim();
            
            // Create submission data
            const dataToSubmit = {
                LoginName: formData.LoginName,
                FullName: FullName,
                EmailPro: formData.EmailPro,
                UserRole: formData.UserRole,
                TelPro: formData.TelPro,
                Poste: formData.Poste,
                Departement: formData.Departement,
                IsActive: formData.IsActive,
                Code: formData.Code,
                Gouvernorat: formData.Gouvernorat
            };
            
            // Add password if provided
            if (formData.Password) {
                dataToSubmit.Password = formData.Password;
            }
            
            if (isEdit) {
                await axios.put(`/users/${id}`, dataToSubmit);
                toast.success('Utilisateur mis à jour avec succès');
            } else {
                // Password is required for creation
                if (!formData.Password) {
                    toast.error('Le mot de passe est requis');
                    setSaving(false);
                    return;
                }
                dataToSubmit.Password = formData.Password;
                await axios.post('/users', dataToSubmit);
                toast.success('Utilisateur créé avec succès');
            }
            navigate('/users');
        } catch (error) {
            console.error('Error saving user:', error);
            const message = error.response?.data?.message || 'Erreur lors de l\'enregistrement';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in min-h-screen pb-16">
            {/* Header */}
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
                                Gestion RH
                            </span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                            {isEdit ? 'Modifier Utilisateur' : 'Nouveau Collaborateur'}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/users')}
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
                        <span>{isEdit ? 'Sauvegarder' : 'Créer'}</span>
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column - Profile Card */}
                <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="h-24 bg-gradient-blue"></div>
                        <div className="px-8 pb-8 -mt-12">
                            <div className="h-24 w-24 rounded-2xl bg-white p-1.5 shadow-soft-xl mx-auto mb-6">
                                <div className="h-full w-full rounded-xl bg-gradient-blue flex items-center justify-center text-3xl font-bold text-white">
                                    {formData.Prenom?.charAt(0) || <UserIcon className="h-10 w-10" />}
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-slate-800 mb-1">
                                    {`${formData.Prenom} ${formData.Nom}`.trim() || 'Nom Complet'}
                                </h3>
                                <span className="inline-flex px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                                    {formData.UserRole}
                                </span>
                            </div>
                        </div>

                        {/* Status Toggle */}
                        <div className="px-8 pb-8">
                            <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-white hover:border-blue-200 transition-all">
                                <div>
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Statut du compte</p>
                                    <p className={`text-sm font-semibold ${formData.IsActive ? 'text-emerald-600' : 'text-slate-500'}`}>
                                        {formData.IsActive ? 'Compte actif' : 'Compte désactivé'}
                                    </p>
                                </div>
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        name="IsActive"
                                        checked={formData.IsActive}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                                </div>
                            </label>
                        </div>
                    </div>


                </div>

                {/* Right Column - Form Sections */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Authentication Section */}
                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/80 to-transparent flex items-center gap-4">
                            <div className="icon-shape icon-shape-sm shadow-glow-blue">
                                <KeyIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-800">Authentification</h2>
                                <p className="text-xs text-slate-500">Identifiants de connexion</p>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label-modern">
                                        <IdentificationIcon className="h-4 w-4 text-blue-500 inline mr-1" />
                                        Nom d'utilisateur *
                                    </label>
                                    <input
                                        type="text"
                                        name="LoginName"
                                        value={formData.LoginName}
                                        onChange={handleChange}
                                        className="input-modern font-mono"
                                        placeholder="ex: jd.agent"
                                        required
                                        disabled={isEdit}
                                    />
                                    {isEdit && <p className="mt-2 text-xs text-slate-400">L'identifiant ne peut pas être modifié</p>}
                                </div>
                                <div>
                                    <label className="label-modern">
                                        <LockClosedIcon className="h-4 w-4 text-blue-500 inline mr-1" />
                                        Mot de passe {!isEdit && '*'}
                                    </label>
                                    <input
                                        type="password"
                                        name="Password"
                                        value={formData.Password}
                                        onChange={handleChange}
                                        className="input-modern"
                                        placeholder={isEdit ? "Laisser vide si inchangé" : "••••••••"}
                                        required={!isEdit}
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label className="label-modern">
                                        <LockClosedIcon className="h-4 w-4 text-blue-500 inline mr-1" />
                                        Confirmer mot de passe {!isEdit && '*'}
                                    </label>
                                    <input
                                        type="password"
                                        name="ConfirmPassword"
                                        value={formData.ConfirmPassword}
                                        onChange={handleChange}
                                        className={`input-modern ${formData.Password && formData.Password !== formData.ConfirmPassword ? 'border-red-500' : ''}`}
                                        placeholder={isEdit ? "Laisser vide si inchangé" : "••••••••"}
                                        required={!isEdit}
                                        minLength={6}
                                    />
                                    {formData.Password && formData.Password !== formData.ConfirmPassword && (
                                        <p className="mt-2 text-xs text-red-500">Les mots de passe ne correspondent pas</p>
                                    )}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="label-modern">Rôle *</label>
                                    <div className="flex flex-wrap gap-3">
                                        {['Administrateur', 'Agent', 'Commercial', 'Technicien'].map((role) => (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, UserRole: role }))}
                                                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-2 ${formData.UserRole === role
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-glow-blue'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
                                                    }`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Personal Info Section */}
                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100/50 bg-gradient-to-r from-emerald-50/80 to-transparent flex items-center gap-4">
                            <div className="icon-shape icon-shape-sm" style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }}>
                                <UserCircleIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-800">Informations Personnelles</h2>
                                <p className="text-xs text-slate-500">Détails du collaborateur</p>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label-modern">Prénom *</label>
                                    <input
                                        type="text"
                                        name="Prenom"
                                        value={formData.Prenom}
                                        onChange={handleChange}
                                        className="input-modern"
                                        placeholder="ex: Jean"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label-modern">Nom *</label>
                                    <input
                                        type="text"
                                        name="Nom"
                                        value={formData.Nom}
                                        onChange={handleChange}
                                        className="input-modern"
                                        placeholder="ex: Dupont"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label-modern">
                                        <EnvelopeIcon className="h-4 w-4 text-emerald-500 inline mr-1" />
                                        Email professionnel *
                                    </label>
                                    <input
                                        type="email"
                                        name="EmailPro"
                                        value={formData.EmailPro}
                                        onChange={handleChange}
                                        className="input-modern"
                                        placeholder="email@entreprise.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label-modern">
                                        <PhoneIcon className="h-4 w-4 text-emerald-500 inline mr-1" />
                                        Téléphone
                                    </label>
                                    <input
                                        type="tel"
                                        name="TelPro"
                                        value={formData.TelPro}
                                        onChange={handleChange}
                                        className={`input-modern ${formData.TelPro && !isValidPhoneNumber(formData.TelPro) ? 'border-red-500' : formData.TelPro && isValidPhoneNumber(formData.TelPro) ? 'border-green-500' : ''}`}
                                        placeholder="ex: 25123456 ou +216 25123456"
                                    />
                                    {formData.TelPro && !isValidPhoneNumber(formData.TelPro) && (
                                        <p className="mt-2 text-xs text-red-500">Téléphone invalide. Formats acceptés: 8 chiffres ou +216 XXXX XXXX</p>
                                    )}
                                    {formData.TelPro && isValidPhoneNumber(formData.TelPro) && (
                                        <p className="mt-2 text-xs text-green-500">✓ Numéro valide</p>
                                    )}
                                </div>
                                <div>
                                    <label className="label-modern">Code</label>
                                    <input
                                        type="text"
                                        name="Code"
                                        value={formData.Code}
                                        onChange={handleChange}
                                        className="input-modern"
                                        placeholder="ex: EMP001"
                                    />
                                </div>
                                <div>
                                    <label className="label-modern">Gouvernorat</label>
                                    <input
                                        type="text"
                                        name="Gouvernorat"
                                        value={formData.Gouvernorat}
                                        onChange={handleChange}
                                        className="input-modern"
                                        placeholder="ex: Tunis"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Position Section */}
                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100/50 bg-gradient-to-r from-amber-50/80 to-transparent flex items-center gap-4">
                            <div className="icon-shape icon-shape-sm" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' }}>
                                <BriefcaseIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-800">Position</h2>
                                <p className="text-xs text-slate-500">Département et fonction</p>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label-modern">
                                        <BuildingOfficeIcon className="h-4 w-4 text-amber-500 inline mr-1" />
                                        Département
                                    </label>
                                    <input
                                        type="text"
                                        name="Departement"
                                        value={formData.Departement}
                                        onChange={handleChange}
                                        className="input-modern"
                                        placeholder="ex: Commercial, Technique..."
                                    />
                                </div>
                                <div>
                                    <label className="label-modern">Poste occupé</label>
                                    <input
                                        type="text"
                                        name="Poste"
                                        value={formData.Poste}
                                        onChange={handleChange}
                                        className="input-modern"
                                        placeholder="ex: Chef de projet"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </form>
        </div>
    );
};

export default UserForm;
