import { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import authService from '../../auth/authService';
import { toast } from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUrl';
import {
    UserCircleIcon,
    LockClosedIcon,
    PencilIcon,
    CameraIcon,
    EnvelopeIcon,
    PhoneIcon,
    ShieldCheckIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';

const InputField = ({ label, icon: Icon, ...props }) => (
    <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{label}</label>
        <div className="relative">
            {Icon && (
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Icon className="h-4 w-4 text-slate-400" />
                </div>
            )}
            <input
                {...props}
                className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all`}
            />
        </div>
    </div>
);

const Profile = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab]       = useState('info');
    const [isLoading, setIsLoading]       = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl]     = useState(null);

    const [formData, setFormData] = useState({ FullName: '', EmailPro: '', TelPro: '' });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    useEffect(() => {
        if (user) {
            setFormData({ FullName: user.FullName || '', EmailPro: user.EmailPro || '', TelPro: user.TelPro || '' });
            if (user.PhotoProfil) setPreviewUrl(getImageUrl(user.PhotoProfil));
        }
    }, [user]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return toast.error('Veuillez sélectionner une image');
        if (file.size > 5 * 1024 * 1024) return toast.error("L'image ne doit pas dépasser 5 Mo");
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(file);
    };

    const onUpdateProfile = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const fd = new FormData();
            fd.append('FullName', formData.FullName);
            fd.append('EmailPro', formData.EmailPro);
            fd.append('TelPro', formData.TelPro);
            if (selectedFile) fd.append('profilePicture', selectedFile);
            await authService.updateProfile(fd);
            toast.success('Profil mis à jour');
            window.location.reload();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour');
        } finally { setIsLoading(false); }
    };

    const onChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword)
            return toast.error('Les mots de passe ne correspondent pas');
        setIsLoading(true);
        try {
            await authService.changePassword(passwordData);
            toast.success('Mot de passe modifié');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur lors du changement');
        } finally { setIsLoading(false); }
    };

    const initials = user?.FullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

    const TABS = [
        { id: 'info',     label: 'Informations',  icon: UserCircleIcon },
        { id: 'security', label: 'Sécurité',       icon: ShieldCheckIcon },
    ];

    return (
        <div className="max-w-5xl mx-auto pb-20">

            {/* ── Page title ── */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Mon profil</h1>
                <p className="text-sm text-slate-500 mt-1">Gérez vos informations personnelles et votre sécurité</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

                {/* ── Left: Profile card ── */}
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">

                        {/* Cover */}
                        <div className="h-24 bg-gradient-to-br from-blue-500 to-blue-600" />

                        {/* Avatar */}
                        <div className="px-6 pb-6 -mt-12 text-center">
                            <div className="relative inline-block mb-4">
                                <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                                            <span className="text-2xl font-bold text-blue-600">{initials}</span>
                                        </div>
                                    )}
                                </div>
                                <label
                                    htmlFor="avatarInput"
                                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    <CameraIcon className="h-3.5 w-3.5 text-white" />
                                </label>
                                <input id="avatarInput" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </div>

                            <h2 className="text-base font-bold text-slate-900">{user?.FullName || '—'}</h2>
                            <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold border border-blue-100">
                                {user?.UserRole || 'Utilisateur'}
                            </span>

                            {user?.EmailPro && (
                                <p className="text-xs text-slate-400 mt-3 flex items-center justify-center gap-1.5">
                                    <EnvelopeIcon className="h-3.5 w-3.5" />
                                    {user.EmailPro}
                                </p>
                            )}
                            {user?.TelPro && (
                                <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1.5">
                                    <PhoneIcon className="h-3.5 w-3.5" />
                                    {user.TelPro}
                                </p>
                            )}

                            {selectedFile && (
                                <div className="mt-4 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-100 text-left">
                                    <p className="text-xs text-amber-600 font-medium">Photo sélectionnée — sauvegardez pour l'appliquer.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Nav */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-2 space-y-1">
                        {TABS.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                                    activeTab === t.id
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                }`}
                            >
                                <t.icon className={`h-4 w-4 flex-shrink-0 ${activeTab === t.id ? 'text-blue-500' : 'text-slate-400'}`} />
                                {t.label}
                                {activeTab === t.id && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Right: Content ── */}
                <div>
                    {/* Informations */}
                    {activeTab === 'info' && (
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-7">
                            <div className="flex items-center gap-3 mb-7 pb-5 border-b border-slate-100">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <PencilIcon className="h-4 w-4 text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">Informations personnelles</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Mettez à jour vos coordonnées</p>
                                </div>
                            </div>

                            <form onSubmit={onUpdateProfile} className="space-y-5">
                                <InputField
                                    label="Nom complet"
                                    icon={UserCircleIcon}
                                    type="text"
                                    name="FullName"
                                    value={formData.FullName}
                                    onChange={e => setFormData({ ...formData, FullName: e.target.value })}
                                    placeholder="Votre nom"
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <InputField
                                        label="Email professionnel"
                                        icon={EnvelopeIcon}
                                        type="email"
                                        name="EmailPro"
                                        value={formData.EmailPro}
                                        onChange={e => setFormData({ ...formData, EmailPro: e.target.value })}
                                        placeholder="email@exemple.com"
                                    />
                                    <InputField
                                        label="Téléphone"
                                        icon={PhoneIcon}
                                        type="text"
                                        name="TelPro"
                                        value={formData.TelPro}
                                        onChange={e => setFormData({ ...formData, TelPro: e.target.value })}
                                        placeholder="+216 XX XXX XXX"
                                    />
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-60"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Enregistrement…
                                            </>
                                        ) : (
                                            <>
                                                <CheckIcon className="h-4 w-4" />
                                                Enregistrer
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Sécurité */}
                    {activeTab === 'security' && (
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-7">
                            <div className="flex items-center gap-3 mb-7 pb-5 border-b border-slate-100">
                                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                                    <LockClosedIcon className="h-4 w-4 text-amber-500" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">Changer le mot de passe</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Choisissez un mot de passe sécurisé</p>
                                </div>
                            </div>

                            <form onSubmit={onChangePassword} className="space-y-5">
                                <InputField
                                    label="Mot de passe actuel"
                                    icon={LockClosedIcon}
                                    type="password"
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <InputField
                                            label="Nouveau mot de passe"
                                            icon={LockClosedIcon}
                                            type="password"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            placeholder="••••••••"
                                            required
                                        />
                                        <p className="text-[11px] text-slate-400 mt-1.5">Min. 8 caractères avec majuscule, chiffre et symbole.</p>
                                    </div>
                                    <InputField
                                        label="Confirmer le mot de passe"
                                        icon={LockClosedIcon}
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                {/* Password rules hint */}
                                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 grid grid-cols-2 gap-2">
                                    {[
                                        '8 caractères minimum',
                                        'Une majuscule',
                                        'Un chiffre',
                                        'Un caractère spécial',
                                    ].map(r => (
                                        <p key={r} className="flex items-center gap-2 text-xs text-slate-400">
                                            <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                                <CheckIcon className="h-2.5 w-2.5 text-slate-400" />
                                            </span>
                                            {r}
                                        </p>
                                    ))}
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-60"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Modification…
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheckIcon className="h-4 w-4" />
                                                Changer le mot de passe
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
