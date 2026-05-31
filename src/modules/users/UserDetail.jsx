import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../../app/axios';
import {
    ArrowLeftIcon, EnvelopeIcon,
    PencilSquareIcon, ArrowPathIcon,
    KeyIcon, MapPinIcon, BriefcaseIcon,
    UserIcon, AtSymbolIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import { getWhatsAppLink } from '../../utils/format';

const getInitials = (name = '') =>
    name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

const ROLE_CFG = {
    'Administrateur': { label: 'Administrateur', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
    'Admin':          { label: 'Admin',           cls: 'bg-violet-50 text-violet-700 border-violet-200' },
    'Commercial':     { label: 'Commercial',      cls: 'bg-[#e0f0ff] text-[#0062AF] border-blue-200'   },
    'Technicien':     { label: 'Technicien',      cls: 'bg-amber-50 text-amber-700 border-amber-200'   },
    'Agent':          { label: 'Agent',           cls: 'bg-teal-50 text-teal-700 border-teal-200'      },
};

const Field = ({ icon: Icon, label, value, accent = false }) => (
    <div className="flex items-start gap-3 py-3.5 border-b border-slate-100 last:border-0">
        <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon className="h-3.5 w-3.5 text-slate-400" />
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
            <p className={`text-sm font-semibold truncate ${accent ? 'text-[#0062AF]' : 'text-slate-800'}`}>
                {value || <span className="text-slate-300 font-normal">—</span>}
            </p>
        </div>
    </div>
);

const UserDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser]             = useState(null);
    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [resending, setResending]   = useState(false);
    const [imgError, setImgError]     = useState(false);

    const fetchUser = async (spin = false) => {
        if (spin) setRefreshing(true);
        try {
            const res = await axios.get(`/users/${id}`);
            if (res.status === 'success') setUser(res.data);
        } catch {
            toast.error("Impossible de charger les détails de l'utilisateur");
        } finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => { fetchUser(); }, [id]);

    if (loading) return <LoadingSpinner />;
    if (!user) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-semibold">Utilisateur introuvable</p>
            <button onClick={() => navigate('/users')}
                className="text-sm text-[#0062AF] font-semibold hover:underline underline-offset-2">
                ← Retour à la liste
            </button>
        </div>
    );

    const initials  = getInitials(user.FullName);
    const isActive  = user.IsActive;
    const roleCfg   = ROLE_CFG[user.UserRole] || { label: user.UserRole, cls: 'bg-slate-100 text-slate-600 border-slate-200' };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl mx-auto pb-10 space-y-5"
        >
            {/* ── Back ── */}
            <button onClick={() => navigate('/users')}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-[#0062AF] transition-colors group">
                <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                Retour
            </button>

            {/* ── Header Card ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                {/* Top accent */}
                <div className="h-1 bg-gradient-to-r from-[#0062AF] via-sky-400 to-teal-400" />

                <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-5">

                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        {user.PhotoProfil && !imgError ? (
                            <img src={user.PhotoProfil} alt={user.FullName} onError={() => setImgError(true)}
                                className="h-16 w-16 rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm" />
                        ) : (
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#0062AF] to-sky-500 flex items-center justify-center shadow-md shadow-blue-500/20">
                                <span className="text-xl font-black text-white select-none">{initials}</span>
                            </div>
                        )}
                        <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white shadow-sm ${isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                    </div>

                    {/* Identity */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-black text-slate-900 tracking-tight truncate">{user.FullName}</h1>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {user.UserRole && (
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${roleCfg.cls}`}>
                                    {roleCfg.label}
                                </span>
                            )}
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                                {isActive ? 'Actif' : 'Inactif'}
                            </span>
                        </div>
                        {user.EmailPro && (
                            <p className="text-xs text-slate-400 mt-1.5 truncate">{user.EmailPro}</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => fetchUser(true)} disabled={refreshing}
                            className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40 shadow-sm">
                            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={() => navigate(`/users/edit/${user.UserID}`)}
                            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#0062AF] hover:bg-[#004a85] text-white text-sm font-semibold transition-all shadow-sm shadow-blue-500/20 active:scale-[0.97]">
                            <PencilSquareIcon className="h-4 w-4" />
                            Modifier
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Info Card ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40 flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Informations</span>
                </div>
                <div className="px-6 py-1">
                    {user.EmailPro && (
                        <Field icon={EnvelopeIcon} label="Email" value={user.EmailPro} accent />
                    )}
                    <div className="grid grid-cols-2 gap-0">
                        <div className="py-3.5 border-b border-slate-100 pr-4">
                            <div className="flex items-start gap-3">
                                <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <AtSymbolIcon className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Identifiant</p>
                                    <p className="text-sm font-semibold text-slate-800 truncate font-mono">
                                        {user.LoginName ? `@${user.LoginName}` : <span className="text-slate-300 font-normal font-sans">—</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="py-3.5 border-b border-slate-100 pl-4 border-l border-slate-100">
                            <div className="flex items-start gap-3">
                                <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <MapPinIcon className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Gouvernorat</p>
                                    <p className="text-sm font-semibold text-slate-800 truncate">
                                        {user.Gouvernorat || <span className="text-slate-300 font-normal">—</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-0">
                        <div className="py-3.5 pr-4">
                            <div className="flex items-start gap-3">
                                <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <BriefcaseIcon className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Département</p>
                                    <p className="text-sm font-semibold text-slate-800 truncate">
                                        {user.Departement || <span className="text-slate-300 font-normal">—</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="py-3.5 pl-4 border-l border-slate-100">
                            <div className="flex items-start gap-3">
                                <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <BriefcaseIcon className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Poste</p>
                                    <p className="text-sm font-semibold text-slate-800 truncate">
                                        {user.PosteOccupe || <span className="text-slate-300 font-normal">—</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Actions Card ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                    {/* Status */}
                    <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold ${isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`} />
                        {isActive ? 'Compte actif' : 'Compte inactif'}
                    </div>

                    {/* Resend credentials */}
                    {user.EmailPro && (
                        <button onClick={async () => {
                            if (!window.confirm(`Générer un nouveau mot de passe et l'envoyer à ${user.EmailPro} ?`)) return;
                            setResending(true);
                            try {
                                await axios.post(`/users/${user.UserID}/resend-credentials`);
                                toast.success('Nouveaux identifiants envoyés par email');
                            } catch (err) {
                                toast.error(err.response?.data?.message || "Erreur lors de l'envoi");
                            } finally { setResending(false); }
                        }} disabled={resending}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-600 text-xs font-semibold transition-all disabled:opacity-50 shadow-sm">
                            {resending
                                ? <div className="h-3.5 w-3.5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                                : <KeyIcon className="h-3.5 w-3.5 text-slate-400" />}
                            Renvoyer le mot de passe
                        </button>
                    )}
                </div>

                {/* Send email */}
                {user.EmailPro && (
                    <div className="px-6 pb-4">
                        <button onClick={() => navigate('/messages', { state: { composeTo: user.EmailPro } })}
                            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-semibold transition-all">
                            <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                            Envoyer un email
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default UserDetail;
