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
    TagIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';

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
        <div className="animate-fade-in space-y-8 pb-12">
            {/* Header Navigation */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => navigate('/users')}
                        className="h-11 w-11 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 rounded-xl transition-all shadow-soft flex items-center justify-center"
                        title="Retour"
                    >
                        <ArrowLeftIcon className="h-5 w-5 stroke-[2.5]" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="badge badge-primary">
                                <UserGroupIcon className="h-3 w-3 mr-1" />
                                Annuaire Interne
                            </span>
                        </div>
                        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Profil Collaborateur</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all shadow-soft"
                    >
                        <ArrowPathIcon className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => navigate(`/users/edit/${user.UserID}`)}
                        className="btn-soft-primary flex items-center gap-2"
                    >
                        <PencilSquareIcon className="h-4 w-4 stroke-[3]" />
                        Éditer Profil
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left side: Main Profile Card & Identifiers */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Hero Identity Card */}
                    <div className="card-luxury p-0 overflow-hidden group">
                        <div className="h-32 bg-gradient-blue relative flex items-center px-10">
                            <div className="absolute top-0 right-0 w-64 h-full bg-white/10 -skew-x-12 translate-x-1/2"></div>
                            <h2 className="text-white/20 font-black text-6xl uppercase tracking-tighter select-none">PROFILE</h2>
                        </div>
                        <div className="px-10 pb-10 relative">
                            <div className="flex flex-col md:flex-row md:items-end gap-8 -mt-12">
                                <div className="h-32 w-32 rounded-[2rem] bg-white p-1.5 shadow-xl transition-transform group-hover:scale-105 duration-500">
                                    <div className="h-full w-full rounded-[1.6rem] bg-gradient-blue flex items-center justify-center text-4xl font-black text-white shadow-glow-blue">
                                        {user.FullName?.charAt(0)}
                                    </div>
                                </div>
                                <div className="flex-1 pb-2">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{user.FullName}</h2>
                                        <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ${user.IsActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                            }`}>
                                            {user.IsActive ? 'Actif' : 'Désactivé'}
                                        </span>
                                    </div>
                                    <div className="flex items-center flex-wrap gap-4 text-sm font-bold text-slate-500">
                                        <div className="flex items-center gap-2 text-blue-600">
                                            <TagIcon className="h-4 w-4" />
                                            @{user.LoginName}
                                        </div>
                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                                        <span className="text-slate-400 uppercase tracking-widest text-[11px]">{user.UserRole}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Contact Details Card */}
                        <div className="card-luxury p-0 overflow-hidden">
                            <div className="px-8 py-5 border-b border-slate-100/50 bg-slate-50/50 flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Coordonnées</h3>
                                <div className="icon-shape icon-shape-sm bg-gradient-blue shadow-glow-blue scale-75">
                                    <EnvelopeIcon className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="group">
                                    <label className="label-modern italic tracking-[0.2em] mb-2">Canal Email</label>
                                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                        <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-colors group-hover:bg-blue-600 group-hover:text-white">
                                            <EnvelopeIcon className="h-4 w-4" />
                                        </div>
                                        {user.EmailPro}
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="label-modern italic tracking-[0.2em] mb-2">Ligne Directe</label>
                                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                        <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-colors group-hover:bg-blue-600 group-hover:text-white">
                                            <PhoneIcon className="h-4 w-4" />
                                        </div>
                                        {user.TelPro || 'Non renseigné'}
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="label-modern italic tracking-[0.2em] mb-2">Date de Naissance</label>
                                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                        <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-colors group-hover:bg-blue-600 group-hover:text-white">
                                            <CalendarIcon className="h-4 w-4" />
                                        </div>
                                        {user.DateNaissance ? new Date(user.DateNaissance).toLocaleDateString() : 'Non renseignée'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Professional details Card */}
                        <div className="card-luxury p-0 overflow-hidden">
                            <div className="px-8 py-5 border-b border-slate-100/50 bg-slate-50/50 flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Professionnel</h3>
                                <div className="icon-shape icon-shape-sm bg-gradient-success shadow-glow-emerald scale-75">
                                    <BriefcaseIcon className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="group">
                                    <label className="label-modern italic tracking-[0.2em] mb-2">Département</label>
                                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                        <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                                            <BuildingOfficeIcon className="h-4 w-4" />
                                        </div>
                                        {user.Departement || 'Non assigné'}
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="label-modern italic tracking-[0.2em] mb-2">Poste & Rang</label>
                                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                        <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                                            <IdentificationIcon className="h-4 w-4" />
                                        </div>
                                        {user.PosteOccupe || 'Non défini'}
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="label-modern italic tracking-[0.2em] mb-2">Scope d'accès</label>
                                    <div className="flex items-center gap-2">
                                        <span className="badge badge-primary py-2 px-4 shadow-sm">Niveau {user.UserRole === 'Administrateur' ? 'Total' : 'Restreint'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side: Security & Activity */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Activity Feed Card */}
                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="px-8 py-5 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-transparent">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Activité Système</h3>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                    <ClockIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dernière Connexion</p>
                                    <p className="text-xs font-black text-slate-700 mt-1">
                                        {user.LastLoginDate ? new Date(user.LastLoginDate).toLocaleString('fr-FR') : 'Jamais connecté'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                    <CalendarIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date d'intégration</p>
                                    <p className="text-xs font-black text-slate-700 mt-1">
                                        {user.CreatedDate ? new Date(user.CreatedDate).toLocaleDateString('fr-FR') : 'Inconnue'}
                                    </p>
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
