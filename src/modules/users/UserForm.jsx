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
    SparklesIcon,
    ArrowRightIcon,
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

    const isValidPhoneNumber = (phone) => {
        if (!phone) return true;
        const cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
        if (cleaned.length === 8) {
            return /^[0-9]{8}$/.test(cleaned);
        } else if (cleaned.length === 10) {
            return /^216[0-9]{8}$/.test(cleaned);
        } else if (cleaned.startsWith('+216') && cleaned.length === 13) {
            return /^\+216[0-9]{8}$/.test(cleaned);
        }
        return false;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
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
            const FullName = `${formData.Prenom} ${formData.Nom}`.trim();
            
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
            
            if (formData.Password) {
                dataToSubmit.Password = formData.Password;
            }
            
            if (isEdit) {
                await axios.put(`/users/${id}`, dataToSubmit);
                toast.success('Utilisateur mis à jour avec succès');
            } else {
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
        <div className="min-h-screen bg-slate-50/50">
            {/* Modern Header */}
            <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
                <div className="flex h-16 items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/users')}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                        </button>
                        <div className="hidden md:flex items-center gap-2 text-sm">
                            <span 
                                className="text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                                onClick={() => navigate('/users')}
                            >
                                Utilisateurs
                            </span>
                            <ArrowRightIcon className="h-4 w-4 text-slate-300" />
                            <span className="font-semibold text-slate-800">{isEdit ? 'Modifier' : 'Nouveau'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/users')}
                            className="h-9 px-4 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all text-sm font-medium disabled:opacity-50 shadow-lg shadow-blue-500/25"
                        >
                            {saving ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <CheckIcon className="h-4 w-4" />
                            )}
                            <span className="hidden sm:inline">{isEdit ? 'Sauvegarder' : 'Créer'}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-5xl px-4 md:px-6 py-8 md:py-10">
                {/* Title Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold border border-blue-100">
                            <SparklesIcon className="h-3 w-3" />
                            {isEdit ? 'Modification' : 'Nouveau'}
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                        {isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {isEdit ? 'Modifiez les informations du collaborateur' : 'Créez un nouveau compte utilisateur avec les informations requises'}
                    </p>
                </div>

                {/* Single Page Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Authentification */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/30 overflow-hidden">
                        <div className="p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
                                    <LockClosedIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-800">Authentification</h2>
                                    <p className="text-sm text-slate-500">Identifiants de connexion</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Nom d'utilisateur <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <UserIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="LoginName"
                                            value={formData.LoginName}
                                            onChange={handleChange}
                                            className={`w-full h-11 pl-10 pr-3 text-sm rounded-xl border transition-all focus:outline-none focus:ring-4 font-mono ${
                                                isEdit 
                                                    ? 'bg-slate-50 border-slate-200 text-slate-500' 
                                                    : 'bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/10 hover:border-slate-300'
                                            }`}
                                            placeholder="ex: j.dupont"
                                            required
                                            disabled={isEdit}
                                        />
                                    </div>
                                    {isEdit && <p className="text-xs text-slate-400">Non modifiable</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Rôle <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <ShieldCheckIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <select
                                            name="UserRole"
                                            value={formData.UserRole}
                                            onChange={handleChange}
                                            className="w-full h-11 pl-10 pr-8 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300 transition-all appearance-none cursor-pointer"
                                            required
                                        >
                                            <option value="Agent">Agent</option>
                                            <option value="Commercial">Commercial</option>
                                            <option value="Technicien">Technicien</option>
                                            <option value="Administrateur">Administrateur</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <ArrowRightIcon className="h-4 w-4 text-slate-400 rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Mot de passe {!isEdit && <span className="text-red-500">*</span>}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <LockClosedIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="password"
                                            name="Password"
                                            value={formData.Password}
                                            onChange={handleChange}
                                            className="w-full h-11 pl-10 pr-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300 transition-all"
                                            placeholder={isEdit ? "Laisser vide si inchangé" : "••••••••"}
                                            required={!isEdit}
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Confirmer mot de passe {!isEdit && <span className="text-red-500">*</span>}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <CheckIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="password"
                                            name="ConfirmPassword"
                                            value={formData.ConfirmPassword}
                                            onChange={handleChange}
                                            className={`w-full h-11 pl-10 pr-3 text-sm rounded-xl border focus:outline-none focus:ring-4 transition-all ${
                                                formData.Password && formData.Password !== formData.ConfirmPassword 
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10 bg-red-50/30' 
                                                    : formData.Password && formData.Password === formData.ConfirmPassword
                                                    ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/10 bg-emerald-50/30'
                                                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10 hover:border-slate-300'
                                            }`}
                                            placeholder={isEdit ? "Laisser vide si inchangé" : "••••••••"}
                                            required={!isEdit}
                                            minLength={6}
                                        />
                                    </div>
                                    {formData.Password && formData.Password !== formData.ConfirmPassword && (
                                        <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Informations personnelles */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/30 overflow-hidden">
                        <div className="p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-xl bg-violet-50 border border-violet-100">
                                    <UserIcon className="h-5 w-5 text-violet-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-800">Informations personnelles</h2>
                                    <p className="text-sm text-slate-500">Détails du collaborateur</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Prénom <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <UserIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="Prenom"
                                            value={formData.Prenom}
                                            onChange={handleChange}
                                            className="w-full h-11 pl-10 pr-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 hover:border-slate-300 transition-all"
                                            placeholder="ex: Jean"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Nom <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <IdentificationIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="Nom"
                                            value={formData.Nom}
                                            onChange={handleChange}
                                            className="w-full h-11 pl-10 pr-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 hover:border-slate-300 transition-all"
                                            placeholder="ex: Dupont"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Email professionnel <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="email"
                                            name="EmailPro"
                                            value={formData.EmailPro}
                                            onChange={handleChange}
                                            className="w-full h-11 pl-10 pr-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 hover:border-slate-300 transition-all"
                                            placeholder="email@entreprise.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Téléphone
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <PhoneIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="tel"
                                            name="TelPro"
                                            value={formData.TelPro}
                                            onChange={handleChange}
                                            className={`w-full h-11 pl-10 pr-3 text-sm rounded-xl border focus:outline-none focus:ring-4 transition-all ${
                                                formData.TelPro && !isValidPhoneNumber(formData.TelPro) 
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10 bg-red-50/30' 
                                                    : formData.TelPro && isValidPhoneNumber(formData.TelPro)
                                                    ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/10 bg-emerald-50/30'
                                                    : 'border-slate-200 focus:border-violet-500 focus:ring-violet-500/10 hover:border-slate-300'
                                            }`}
                                            placeholder="ex: 25123456 ou +216 25123456"
                                        />
                                    </div>
                                    {formData.TelPro && !isValidPhoneNumber(formData.TelPro) && (
                                        <p className="text-xs text-red-500">Numéro invalide</p>
                                    )}
                                    {formData.TelPro && isValidPhoneNumber(formData.TelPro) && (
                                        <p className="text-xs text-emerald-500">✓ Numéro valide</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Code employé
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <IdentificationIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="Code"
                                            value={formData.Code}
                                            onChange={handleChange}
                                            className="w-full h-11 pl-10 pr-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 hover:border-slate-300 transition-all font-mono"
                                            placeholder="ex: EMP001"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Gouvernorat
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <BuildingOfficeIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="Gouvernorat"
                                            value={formData.Gouvernorat}
                                            onChange={handleChange}
                                            className="w-full h-11 pl-10 pr-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 hover:border-slate-300 transition-all"
                                            placeholder="ex: Tunis"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Position */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/30 overflow-hidden">
                        <div className="p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
                                    <BriefcaseIcon className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-800">Position</h2>
                                    <p className="text-sm text-slate-500">Département et fonction</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Département
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <BuildingOfficeIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="Departement"
                                            value={formData.Departement}
                                            onChange={handleChange}
                                            className="w-full h-11 pl-10 pr-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 hover:border-slate-300 transition-all"
                                            placeholder="ex: Commercial, Technique..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Poste occupé
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <BriefcaseIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="Poste"
                                            value={formData.Poste}
                                            onChange={handleChange}
                                            className="w-full h-11 pl-10 pr-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 hover:border-slate-300 transition-all"
                                            placeholder="ex: Chef de projet"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2 mt-2">
                                    <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-xl transition-all ${formData.IsActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                                <ShieldCheckIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">Statut du compte</p>
                                                <p className={`text-xs mt-0.5 ${formData.IsActive ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                                                    {formData.IsActive ? '✓ Compte actif et opérationnel' : 'Compte temporairement désactivé'}
                                                </p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="IsActive"
                                                checked={formData.IsActive}
                                                onChange={handleChange}
                                                className="sr-only peer"
                                            />
                                            <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-200 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-400 peer-checked:to-emerald-500 shadow-inner"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 h-11 px-8 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25"
                        >
                            {saving ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <CheckIcon className="h-4 w-4" />
                            )}
                            {isEdit ? 'Sauvegarder les modifications' : 'Créer l\'utilisateur'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default UserForm;
