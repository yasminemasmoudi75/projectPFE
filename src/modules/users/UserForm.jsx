import { useState, useEffect } from 'react';
import axios from '../../app/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    UserIcon, EnvelopeIcon, PhoneIcon,
    ShieldCheckIcon, CheckIcon, ArrowLeftIcon,
    BuildingOfficeIcon, LockClosedIcon,
    MapPinIcon, XMarkIcon, KeyIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

/* ── Input field wrapper ── */
const Field = ({ label, required, children }) => (
    <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            {label}{required && <span className="text-rose-400 ml-1">*</span>}
        </label>
        {children}
    </div>
);

const inputCls =
    'w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#0062AF]/50 focus:ring-2 focus:ring-[#0062AF]/10 transition-all';

const selectCls =
    'w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#0062AF]/50 focus:ring-2 focus:ring-[#0062AF]/10 transition-all';

/* ── Section card ── */
const Card = ({ title, icon: Icon, iconBg, iconColor, accent, children, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.22 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
        <div className={`h-1 bg-gradient-to-r ${accent}`} />
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{title}</p>
        </div>
        <div className="p-6 space-y-5">{children}</div>
    </motion.div>
);

/* ══ Page ══ */
const UserForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [loading, setLoading]     = useState(isEdit);
    const [saving, setSaving]       = useState(false);
    const [resending, setResending] = useState(false);
    const [gouvernorats, setGouvernorats] = useState([]);

    const [formData, setFormData] = useState({
        Password: '', ConfirmPassword: '',
        Nom: '', Prenom: '', EmailPro: '', TelPro: '',
        Poste: '', Departement: '', UserRole: 'Agent',
        Gouvernorat: '', IsActive: true,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const govRes = await axios.get('/tiers-gouvernorats');
                const govData = govRes.data?.data || govRes.data || [];
                setGouvernorats(Array.isArray(govData) ? govData : []);

                if (isEdit) {
                    const response = await axios.get(`/users/${id}`);
                    if (response.status === 'success') {
                        const user = response.data;
                        const nameParts = (user.FullName || '').split(' ');
                        setFormData({
                            Password: '', ConfirmPassword: '',
                            Nom: nameParts.slice(1).join(' ') || '',
                            Prenom: nameParts[0] || '',
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
                console.error(error);
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
            const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
            if (name === 'UserRole' && value && !prev.IsActive) next.IsActive = true;
            return next;
        });
    };

    const handleResendCredentials = async () => {
        if (!window.confirm('Générer un nouveau mot de passe et l\'envoyer par email ?')) return;
        setResending(true);
        try {
            await axios.post(`/users/${id}/resend-credentials`);
            toast.success('Nouveaux identifiants envoyés par email');
        } catch (err) {
            toast.error(err.response?.data?.message || "Erreur lors de l'envoi");
        } finally {
            setResending(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.UserRole && !formData.Gouvernorat) {
            toast.error("Le gouvernorat est obligatoire lorsqu'un rôle est assigné."); return;
        }
        if (!formData.TelPro || !/^\d{8}$/.test(formData.TelPro)) {
            toast.error('Le numéro de téléphone doit contenir exactement 8 chiffres.'); return;
        }

        setSaving(true);
        try {
            const payload = { ...formData, FullName: `${formData.Prenom} ${formData.Nom}`.trim() };
            if (isEdit) {
                await axios.put(`/users/${id}`, payload);
                toast.success('Collaborateur mis à jour');
                navigate('/users');
            } else {
                const res = await axios.post('/users', payload);
                if (res.emailSent === false) {
                    toast.error("Compte créé, mais l'email n'a pas pu être envoyé. Vérifiez la configuration SMTP.");
                } else {
                    toast.success('Compte créé — identifiants envoyés par email');
                }
                navigate('/users');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="h-10 w-10 border-2 border-slate-200 border-t-[#0062AF] rounded-full animate-spin" />
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="max-w-6xl mx-auto pb-24 space-y-6"
        >
            {/* ── Top bar ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/users')}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-[#0062AF] hover:border-[#0062AF]/30 hover:bg-blue-50 transition-all group"
                    >
                        <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            {isEdit ? 'Modifier le collaborateur' : 'Nouveau collaborateur'}
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {isEdit ? 'Modifiez les informations du collaborateur' : 'Remplissez les informations pour créer un nouveau compte'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate('/users')}
                        className="inline-flex items-center gap-2 h-10 px-5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"
                    >
                        <XMarkIcon className="h-4 w-4" />
                        Annuler
                    </button>
                    <button
                        type="submit"
                        form="user-form"
                        disabled={saving}
                        className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#0062AF] hover:bg-[#004a85] text-white text-sm font-semibold transition-all shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-60"
                    >
                        {saving
                            ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <CheckIcon className="h-4 w-4" />
                        }
                        {isEdit ? 'Sauvegarder' : 'Créer le compte'}
                    </button>
                </div>
            </div>

            {/* ── Form ── */}
            <form id="user-form" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Left (2 cols) ── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Identité */}
                        <Card
                            title="Identité"
                            icon={UserIcon}
                            iconBg="bg-blue-50"
                            iconColor="text-[#0062AF]"
                            accent="from-[#0062AF] to-sky-400"
                            delay={0.08}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <Field label="Prénom" required>
                                    <input type="text" name="Prenom" value={formData.Prenom}
                                        onChange={handleChange} required
                                        className={inputCls} />
                                </Field>
                                <Field label="Nom" required>
                                    <input type="text" name="Nom" value={formData.Nom}
                                        onChange={handleChange} required
                                        className={inputCls} />
                                </Field>
                                <Field label="Email professionnel" required>
                                    <input type="email" name="EmailPro" value={formData.EmailPro}
                                        onChange={handleChange} required
                                        className={inputCls} />
                                </Field>
                                <Field label="Téléphone (8 chiffres)" required>
                                    <input type="tel" name="TelPro" value={formData.TelPro}
                                        onChange={handleChange} required
                                        maxLength={8} pattern="\d{8}"
                                        title="8 chiffres exactement"
                                        className={inputCls} />
                                </Field>
                            </div>
                        </Card>

                        {/* Organisation */}
                        <Card
                            title="Organisation"
                            icon={BuildingOfficeIcon}
                            iconBg="bg-violet-50"
                            iconColor="text-violet-500"
                            accent="from-violet-400 to-purple-400"
                            delay={0.12}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <Field label="Poste occupé">
                                    <input type="text" name="Poste" value={formData.Poste}
                                        onChange={handleChange}
                                        className={inputCls} />
                                </Field>
                                <Field label="Département">
                                    <input type="text" name="Departement" value={formData.Departement}
                                        onChange={handleChange}
                                        className={inputCls} />
                                </Field>
                                <Field label={`Gouvernorat${formData.UserRole ? ' *' : ''}`} required={!!formData.UserRole}>
                                    <div className="relative">
                                        <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                        <select name="Gouvernorat" value={formData.Gouvernorat}
                                            onChange={handleChange} required={!!formData.UserRole}
                                            className={`${selectCls} pl-10`}>
                                            <option value="">— Sélectionnez —</option>
                                            {gouvernorats.map(gov => (
                                                <option key={gov.id} value={gov.id}>{gov.libelle}</option>
                                            ))}
                                        </select>
                                    </div>
                                </Field>
                            </div>
                        </Card>
                    </div>

                    {/* ── Right (1 col) ── */}
                    <div className="space-y-6">

                        {/* Accès & Sécurité */}
                        <Card
                            title="Accès & Sécurité"
                            icon={ShieldCheckIcon}
                            iconBg="bg-emerald-50"
                            iconColor="text-emerald-500"
                            accent="from-emerald-400 to-teal-400"
                            delay={0.08}
                        >
                            {/* Rôle */}
                            <Field label="Rôle">
                                <div className="relative">
                                    <ShieldCheckIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                    <select name="UserRole" value={formData.UserRole}
                                        onChange={handleChange}
                                        className={`${selectCls} pl-10`}>
                                        <option value="">Accès restreint</option>
                                        <option value="Admin">Administrateur</option>
                                        <option value="Agent">Agent</option>
                                        <option value="Commercial">Commercial</option>
                                        <option value="Technicien">Technicien</option>
                                    </select>
                                </div>
                            </Field>

                            {/* Statut actif */}
                            <div className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                                formData.IsActive ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                            }`}>
                                <div className="flex items-center gap-2.5">
                                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${formData.IsActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                    <span className={`text-sm font-semibold ${formData.IsActive ? 'text-emerald-700' : 'text-slate-600'}`}>
                                        {formData.IsActive ? 'Compte actif' : 'Compte inactif'}
                                    </span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="IsActive" checked={formData.IsActive}
                                        onChange={handleChange} className="sr-only peer" />
                                    <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 peer-checked:after:border-white" />
                                </label>
                            </div>
                        </Card>

                        {/* Sécurité */}
                        <Card
                            title="Sécurité"
                            icon={LockClosedIcon}
                            iconBg="bg-amber-50"
                            iconColor="text-amber-500"
                            accent="from-amber-400 to-orange-300"
                            delay={0.13}
                        >
                            {!isEdit ? (
                                /* CREATE — mot de passe envoyé par email */
                                <div className="flex items-start gap-3 px-3.5 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                                    <EnvelopeIcon className="h-4 w-4 text-[#0062AF] flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-[#0062AF] font-medium leading-relaxed">
                                        Un mot de passe temporaire sera généré automatiquement et envoyé à l'adresse email du collaborateur.
                                    </p>
                                </div>
                            ) : (
                                /* EDIT — renvoyer mot de passe uniquement */
                                <button
                                    type="button"
                                    onClick={handleResendCredentials}
                                    disabled={resending}
                                    className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-semibold transition-all disabled:opacity-50"
                                >
                                    {resending
                                        ? <div className="h-3.5 w-3.5 border-2 border-amber-400/30 border-t-amber-500 rounded-full animate-spin" />
                                        : <KeyIcon className="h-4 w-4" />
                                    }
                                    Renvoyer le mot de passe
                                </button>
                            )}
                        </Card>

                        {/* Submit */}
                        <motion.button
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            type="submit"
                            disabled={saving}
                            className="w-full h-13 py-3.5 bg-[#0062AF] hover:bg-[#004a85] text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                        >
                            {saving
                                ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <CheckIcon className="h-4 w-4" />
                            }
                            {isEdit ? 'Sauvegarder les modifications' : 'Créer le collaborateur'}
                        </motion.button>
                    </div>
                </div>
            </form>
        </motion.div>
    );
};

export default UserForm;
