import { useState, useEffect } from 'react';
import axios from '../../app/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    UserIcon, 
    EnvelopeIcon, 
    PhoneIcon, 
    BriefcaseIcon, 
    GlobeAltIcon, 
    ShieldCheckIcon, 
    CheckIcon, 
    ArrowLeftIcon,
    BuildingOfficeIcon,
    LockClosedIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const UserForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [gouvernorats, setGouvernorats] = useState([]);

    const [formData, setFormData] = useState({
        LoginName: '',
        Password: '',
        ConfirmPassword: '',
        Nom: '',
        Prenom: '',
        EmailPro: '',
        TelPro: '',
        Poste: '',
        Departement: '',
        UserRole: 'Agent',
        Gouvernorat: '',
        IsActive: true,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Charger les gouvernorats
                const govRes = await axios.get('/tiers-gouvernorats');
                const govData = govRes.data?.data || govRes.data || [];
                setGouvernorats(Array.isArray(govData) ? govData : []);

                // 2. Charger l'utilisateur si on est en mode édition
                if (isEdit) {
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
                            EmailPro: user.EmailPro || '',
                            TelPro: user.TelPro || '',
                            Poste: user.PosteOccupe || '',
                            Departement: user.Departement || '',
                            UserRole: user.UserRole || 'Agent',
                            Gouvernorat: user.Gouvernorat || '',
                            IsActive: user.IsActive === 1 || user.IsActive === true,
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Erreur lors du chargement des données');
                if (isEdit) navigate('/users');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, isEdit, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const newState = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            };
            
            // Activation automatique si un rôle est assigné
            if (name === 'UserRole' && value && !prev.IsActive) {
                newState.IsActive = true;
            }
            return newState;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validations
        if (!isEdit && !formData.Password) {
            toast.error('Le mot de passe est obligatoire pour un nouvel utilisateur.');
            return;
        }

        if (formData.Password && formData.Password !== formData.ConfirmPassword) {
            toast.error('Les mots de passe ne correspondent pas.');
            return;
        }

        if (formData.UserRole && !formData.Gouvernorat) {
            toast.error('Le champ Gouvernorat est obligatoire lorsqu\'un rôle est assigné.');
            return;
        }

        // Validation du numéro de téléphone (8 chiffres)
        if (!/^\d{8}$/.test(formData.TelPro)) {
            toast.error('Le numéro de téléphone doit contenir exactement 8 chiffres.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                FullName: `${formData.Prenom} ${formData.Nom}`.trim()
            };

            let response;
            if (isEdit) {
                response = await axios.put(`/users/${id}`, payload);
                toast.success('Utilisateur mis à jour avec succès');
            } else {
                response = await axios.post('/users', payload);
                toast.success('Utilisateur créé avec succès');
            }

            if (response.status === 'success') {
                navigate('/users');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/users')}
                        className="p-3 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-2xl transition-all border border-slate-100"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            {isEdit ? 'Modifier Collaborateur' : 'Nouveau Collaborateur'}
                        </h1>
                        <p className="text-sm text-slate-500">
                            {isEdit ? 'Mise à jour du profil et des permissions' : 'Création d\'un compte utilisateur interne'}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                {/* Colonne Gauche: Profil & Localisation */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Identité */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                <UserIcon className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Identité du Collaborateur</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Prénom <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    name="Prenom"
                                    value={formData.Prenom}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nom <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    name="Nom"
                                    value={formData.Nom}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2"><EnvelopeIcon className="h-4 w-4" /> Email <span className="text-rose-500">*</span></label>
                                <input
                                    type="email"
                                    name="EmailPro"
                                    value={formData.EmailPro}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2"><PhoneIcon className="h-4 w-4" /> Téléphone <span className="text-rose-500">*</span></label>
                                <input
                                    type="tel"
                                    name="TelPro"
                                    value={formData.TelPro}
                                    onChange={handleChange}
                                    maxLength={8}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Poste et Gouvernorat */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                                <BriefcaseIcon className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Affectation & Région</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Poste Occupé</label>
                                <input
                                    type="text"
                                    name="Poste"
                                    value={formData.Poste}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:ring-4 focus:ring-sky-100 focus:border-sky-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2"><BuildingOfficeIcon className="h-4 w-4" /> Département</label>
                                <input
                                    type="text"
                                    name="Departement"
                                    value={formData.Departement}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:ring-4 focus:ring-sky-100 focus:border-sky-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                                    <GlobeAltIcon className="h-4 w-4 text-indigo-500" />
                                    Gouvernorat {formData.UserRole && <span className="text-rose-500">*</span>}
                                </label>
                                <select
                                    name="Gouvernorat"
                                    value={formData.Gouvernorat}
                                    onChange={handleChange}
                                    required={!!formData.UserRole}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Sélectionnez un gouvernorat</option>
                                    {gouvernorats.map(gov => (
                                        <option key={gov.id} value={gov.id}>
                                            {gov.libelle}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Colonne Droite: Sécurité & Actions */}
                <div className="space-y-8">
                    {/* Rôle & Statut */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <ShieldCheckIcon className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Permissions</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Rôle Utilisateur</label>
                                <select
                                    name="UserRole"
                                    value={formData.UserRole}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all"
                                >
                                    <option value="">Aucun (Accès restreint)</option>
                                    <option value="Admin">Administrateur</option>
                                    <option value="Agent">Agent</option>
                                    <option value="Commercial">Commercial</option>
                                    <option value="Technicien">Technicien</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2.5 h-2.5 rounded-full ${formData.IsActive ? 'bg-emerald-500' : 'bg-slate-300'} animate-pulse`}></div>
                                    <span className="text-sm font-bold text-slate-700">Compte Actif</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="IsActive"
                                        checked={formData.IsActive}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                </label>
                            </div>
                        </div>

                        {/* Mot de passe */}
                        <div className="space-y-4 pt-4 border-t border-slate-50">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2"><LockClosedIcon className="h-4 w-4" /> Mot de passe {!isEdit && <span className="text-rose-500">*</span>}</label>
                                <input
                                    type="password"
                                    name="Password"
                                    value={formData.Password}
                                    onChange={handleChange}
                                    required={!isEdit}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2"><LockClosedIcon className="h-4 w-4" /> Confirmation {!isEdit && <span className="text-rose-500">*</span>}</label>
                                <input
                                    type="password"
                                    name="ConfirmPassword"
                                    value={formData.ConfirmPassword}
                                    onChange={handleChange}
                                    required={!isEdit}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-bold shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {saving ? (
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <CheckIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                {isEdit ? 'Sauvegarder les modifications' : 'Créer le Collaborateur'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserForm;
