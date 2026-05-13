import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../app/axios';
import {
    ArrowLeftIcon,
    EnvelopeIcon,
    PhoneIcon,
    BriefcaseIcon,
    BuildingOfficeIcon,
    IdentificationIcon,
    UserCircleIcon,
    PencilSquareIcon,
    CalendarIcon,
    ClockIcon,
    CheckBadgeIcon,
    ShieldCheckIcon,
    SparklesIcon,
    ArrowPathIcon,
    UserGroupIcon,
    TagIcon,
    MapPinIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import { getWhatsAppLink } from '../../utils/format';

const UserDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get(`/users/${id}`);
                if (response.status === 'success') {
                    setUser(response.data);
                }
            } catch (error) {
                console.error('Error fetching user details:', error);
                toast.error("Impossible de charger les détails de l'utilisateur");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id]);

    if (loading) return <LoadingSpinner />;

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="h-20 w-20 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300 mb-6">
                    <UserCircleIcon className="h-10 w-10" />
                </div>
                <p className="text-slate-500 font-bold mb-6">Collaborateur introuvable</p>
                <button
                    onClick={() => navigate('/users')}
                    className="btn-soft-primary"
                >
                    Retour à l'annuaire
                </button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6 pb-12">
            {/* Professional Header - Modern Design (Same as Client) */}
            <div className="card-luxury p-8 bg-gradient-to-r from-sky-50 via-white to-violet-50 border-none">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => navigate('/users')}
                            className="h-11 w-11 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-all flex items-center justify-center"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                        </button>
                        <div>
                            <div className="flex gap-2 mb-3">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-600 text-xs font-medium">
                                    <UserGroupIcon className="h-3 w-3" />
                                    Fiche Utilisateur
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                                    user.IsActive 
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                    <ShieldCheckIcon className="h-3 w-3" />
                                    {user.IsActive ? 'Actif' : 'Inactif'}
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{user.FullName}</h1>
                            <div className="flex items-center gap-3 mt-2 text-sm">
                                <span className="font-semibold text-slate-600">@{user.LoginName}</span>
                                <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                                <span className="flex items-center gap-1.5 text-slate-500">
                                    <BriefcaseIcon className="h-4 w-4 text-sky-500" />
                                    {user.UserRole || 'Rôle non défini'}
                                </span>
                                {user.Departement && (
                                    <>
                                        <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                                        <span className="flex items-center gap-1.5 text-slate-500">
                                            <BuildingOfficeIcon className="h-4 w-4 text-sky-500" />
                                            {user.Departement}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all"
                            title="Rafraîchir"
                        >
                            <ArrowPathIcon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => navigate(`/users/edit/${user.UserID}`)}
                            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl shadow-md shadow-sky-200/50 transition-all flex items-center gap-2 font-medium"
                        >
                            <PencilSquareIcon className="h-4 w-4" />
                            Modifier
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Identity Card */}
                    <div className="card-luxury shadow-sm">
                        <div className="border-b border-slate-200 bg-slate-50/50 py-4 px-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-sky-100 rounded-xl flex items-center justify-center text-sky-600">
                                    <IdentificationIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-800">Informations d'Identité</h2>
                                    <p className="text-xs text-slate-500">Identifiants et informations personnelles</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Nom Complet</label>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl">
                                        <UserCircleIcon className="h-5 w-5 text-sky-500" />
                                        <span className="text-sm font-semibold text-slate-800">{user.FullName}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Nom d'Utilisateur</label>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl font-mono">
                                        <IdentificationIcon className="h-5 w-5 text-sky-500" />
                                        <span className="text-sm font-semibold text-slate-800">@{user.LoginName}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Code Employé</label>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl font-mono">
                                        <TagIcon className="h-5 w-5 text-sky-500" />
                                        <span className="text-sm font-semibold text-slate-800">{user.Code || 'Non attribué'}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Gouvernorat</label>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl">
                                        <MapPinIcon className="h-5 w-5 text-sky-500" />
                                        <span className="text-sm font-semibold text-slate-800">{user.Gouvernorat || 'Non défini'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="card-luxury shadow-sm">
                        <div className="border-b border-slate-200 bg-slate-50/50 py-4 px-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                    <PhoneIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-800">Coordonnées</h2>
                                    <p className="text-xs text-slate-500">Email et téléphone</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Email Professionnel</label>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl">
                                        <EnvelopeIcon className="h-5 w-5 text-emerald-500" />
                                        <span className="text-sm font-semibold text-slate-800">{user.EmailPro || 'Non défini'}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Téléphone</label>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl">
                                        <PhoneIcon className="h-5 w-5 text-emerald-500" />
                                        {user.TelPro ? (
                                            <a 
                                                href={getWhatsAppLink(user.TelPro)} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-sm font-semibold text-slate-800 hover:text-emerald-600 hover:underline flex items-center gap-1.5 transition-all"
                                            >
                                                {user.TelPro}
                                                <svg className="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                                </svg>
                                            </a>
                                        ) : (
                                            <span className="text-sm font-semibold text-slate-800">Non défini</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Professional Information */}
                    <div className="card-luxury shadow-sm">
                        <div className="border-b border-slate-200 bg-slate-50/50 py-4 px-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600">
                                    <BriefcaseIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-800">Informations Professionnelles</h2>
                                    <p className="text-xs text-slate-500">Poste et département</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Rôle</label>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl">
                                        <ShieldCheckIcon className="h-5 w-5 text-violet-500" />
                                        <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                                            user.UserRole === 'Administrateur' || user.UserRole === 'Admin'
                                                ? 'bg-violet-100 text-violet-700'
                                                : user.UserRole === 'Commercial'
                                                    ? 'bg-sky-100 text-sky-700'
                                                    : user.UserRole === 'Technicien'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {user.UserRole}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Département</label>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl">
                                        <BuildingOfficeIcon className="h-5 w-5 text-violet-500" />
                                        <span className="text-sm font-semibold text-slate-800">{user.Departement || 'Non assigné'}</span>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Poste Occupé</label>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl">
                                        <BriefcaseIcon className="h-5 w-5 text-violet-500" />
                                        <span className="text-sm font-semibold text-slate-800">{user.PosteOccupe || 'Non défini'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Activity & Metadata */}
                <div className="space-y-6">
                    {/* Activity Card */}
                    <div className="card-luxury shadow-sm">
                        <div className="border-b border-slate-200 bg-slate-50/50 py-4 px-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                                    <ClockIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-800">Activité</h2>
                                    <p className="text-xs text-slate-500">Historique de connexion</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-xs text-slate-500 uppercase tracking-wider mb-3">Dernière Connexion</label>
                                <div className="flex items-start gap-3 px-4 py-3 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl">
                                    <ClockIcon className="h-5 w-5 text-amber-500 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">
                                            {user.LastLoginDate ? new Date(user.LastLoginDate).toLocaleDateString('fr-FR') : 'Jamais'}
                                        </p>
                                        {user.LastLoginDate && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                {new Date(user.LastLoginDate).toLocaleTimeString('fr-FR')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 uppercase tracking-wider mb-3">Date de Création</label>
                                <div className="flex items-start gap-3 px-4 py-3 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl">
                                    <CalendarIcon className="h-5 w-5 text-amber-500 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">
                                            {user.CreatedDate ? new Date(user.CreatedDate).toLocaleDateString('fr-FR') : 'Inconnue'}
                                        </p>
                                        {user.CreatedDate && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                {new Date(user.CreatedDate).toLocaleTimeString('fr-FR')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Card */}
                    <div className="card-luxury shadow-sm">
                        <div className="border-b border-slate-200 bg-slate-50/50 py-4 px-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                    <ShieldCheckIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-800">Statut du Compte</h2>
                                    <p className="text-xs text-slate-500">État actuel</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className={`flex items-center justify-between px-4 py-4 rounded-xl border ${
                                user.IsActive 
                                    ? 'bg-emerald-50 border-emerald-200' 
                                    : 'bg-rose-50 border-rose-200'
                            }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`h-3 w-3 rounded-full ${user.IsActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                                    <span className={`text-sm font-bold ${user.IsActive ? 'text-emerald-700' : 'text-rose-700'}`}>
                                        {user.IsActive ? 'Compte Actif' : 'Compte Inactif'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetail;
