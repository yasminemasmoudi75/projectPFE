import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../../app/axios';
import {
    ArrowLeftIcon, EnvelopeIcon, PhoneIcon,
    BuildingOfficeIcon, UserCircleIcon, PencilSquareIcon,
    ClockIcon, ArrowPathIcon, IdentificationIcon,
    KeyIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import { getWhatsAppLink } from '../../utils/format';

const getInitials = (name = '') =>
    name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

const Field = ({ label, value, children }) => (
    <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1.5">{label}</p>
        {children ?? (
            <p className="text-sm font-semibold text-slate-800 truncate">
                {value || <span className="text-slate-300 font-normal">—</span>}
            </p>
        )}
    </div>
);

const Card = ({ title, icon: Icon, iconBg, iconColor, accent, children, delay = 0, className = '' }) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.22 }}
        className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}
    >
        {accent && <div className={`h-0.5 bg-gradient-to-r ${accent}`} />}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
            {Icon && (
                <div className={`h-7 w-7 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
                </div>
            )}
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{title}</p>
        </div>
        {children}
    </motion.div>
);

const ROLE_STYLE = {
    'Administrateur': 'bg-violet-50 text-violet-700 border-violet-200',
    'Admin':          'bg-violet-50 text-violet-700 border-violet-200',
    'Commercial':     'bg-blue-50 text-[#0062AF] border-blue-200',
    'Technicien':     'bg-amber-50 text-amber-700 border-amber-200',
    'Agent':          'bg-teal-50 text-teal-700 border-teal-200',
};

const WA_ICON = (
    <svg className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
);

/* ══ Page ══ */
const UserDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser]           = useState(null);
    const [loading, setLoading]     = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [resending, setResending] = useState(false);
    const [imgError, setImgError]   = useState(false);

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
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="h-20 w-20 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300 mb-6">
                <UserCircleIcon className="h-10 w-10" />
            </div>
            <p className="text-slate-500 font-bold mb-6">Collaborateur introuvable</p>
            <button onClick={() => navigate('/users')} className="btn-soft-primary">Retour</button>
        </div>
    );

    const handleResendCredentials = async () => {
        if (!window.confirm(`Générer un nouveau mot de passe et l'envoyer à ${user.EmailPro} ?`)) return;
        setResending(true);
        try {
            await axios.post(`/users/${user.UserID}/resend-credentials`);
            toast.success('Nouveaux identifiants envoyés par email');
        } catch (err) {
            toast.error(err.response?.data?.message || "Erreur lors de l'envoi");
        } finally { setResending(false); }
    };

    const initials  = getInitials(user.FullName);
    const isActive  = user.IsActive;
    const roleStyle = ROLE_STYLE[user.UserRole] || 'bg-slate-100 text-slate-600 border-slate-200';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-5xl mx-auto pb-20 space-y-4"
        >
            {/* ── Top bar ── */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/users')}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-[#0062AF] hover:border-[#0062AF]/30 hover:bg-blue-50 transition-all group"
                >
                    <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <button
                    onClick={() => fetchUser(true)}
                    disabled={refreshing}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm text-slate-400 hover:text-slate-700 transition-all disabled:opacity-50"
                >
                    <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* ══ HERO ══ */}
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.25 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
                {/* Barre accent fine */}
                <div className="h-1 bg-[#0062AF]" />

                <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-5">

                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            {user.PhotoProfil && !imgError ? (
                                <img
                                    src={user.PhotoProfil}
                                    alt={user.FullName}
                                    onError={() => setImgError(true)}
                                    className="h-20 w-20 rounded-2xl object-cover shadow-md ring-4 ring-slate-100"
                                />
                            ) : (
                                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#0062AF] to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <span className="text-[26px] font-black text-white tracking-tight select-none">{initials}</span>
                                </div>
                            )}
                            <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white shadow ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>

                        {/* Info + actions */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start justify-between gap-4">

                                {/* Nom + badges */}
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-2">
                                        {user.FullName}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {user.UserRole && (
                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${roleStyle}`}>
                                                {user.UserRole}
                                            </span>
                                        )}
                                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                                            isActive
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-slate-100 text-slate-500 border-slate-200'
                                        }`}>
                                            <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                            {isActive ? 'Actif' : 'Inactif'}
                                        </span>
                                    </div>
                                </div>

                                {/* Boutons */}
                                <div className="flex gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => navigate(`/users/edit/${user.UserID}`)}
                                        className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-[#0062AF] hover:bg-[#004a85] text-white text-sm font-semibold transition-all shadow-md shadow-blue-500/20 active:scale-95"
                                    >
                                        <PencilSquareIcon className="h-4 w-4" />
                                        Modifier
                                    </button>
                                    {user.EmailPro && (
                                        <button
                                            onClick={() => navigate('/messages', { state: { composeTo: user.EmailPro } })}
                                            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium transition-all"
                                        >
                                            <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                                            Envoyer un email
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Infos de contact */}
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500">
                                {user.EmailPro && (
                                    <span className="flex items-center gap-1.5">
                                        <EnvelopeIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                        <span className="font-medium">{user.EmailPro}</span>
                                    </span>
                                )}
                                {user.TelPro && (
                                    <a
                                        href={getWhatsAppLink(user.TelPro)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors"
                                    >
                                        <PhoneIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                        <span className="font-medium">{user.TelPro}</span>
                                        {WA_ICON}
                                    </a>
                                )}
                                {(user.Departement || user.PosteOccupe) && (
                                    <span className="flex items-center gap-1.5">
                                        <BuildingOfficeIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                        <span className="font-medium">{[user.Departement, user.PosteOccupe].filter(Boolean).join(' · ')}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ══ BODY GRID — 50/50 ══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Gauche : Identité + Organisation empilées */}
                <div className="space-y-4">
                    <Card title="Identité" icon={IdentificationIcon} iconBg="bg-blue-50" iconColor="text-[#0062AF]" accent="from-[#0062AF] to-sky-400" delay={0.1}>
                        <div className="p-5 space-y-4">
                            <Field label="Identifiant" value={user.LoginName ? `@${user.LoginName}` : null} />
                            <div className="h-px bg-slate-100" />
                            <Field label="Gouvernorat" value={user.Gouvernorat} />
                        </div>
                    </Card>

                    <Card title="Organisation" icon={BuildingOfficeIcon} iconBg="bg-violet-50" iconColor="text-violet-500" accent="from-violet-400 to-purple-400" delay={0.13}>
                        <div className="p-5 space-y-4">
                            <Field label="Département" value={user.Departement} />
                            <div className="h-px bg-slate-100" />
                            <Field label="Poste" value={user.PosteOccupe} />
                        </div>
                    </Card>
                </div>

                {/* Droite : Compte */}
                <Card title="Compte" icon={ClockIcon} iconBg="bg-amber-50" iconColor="text-amber-500" accent="from-amber-400 to-orange-300" delay={0.1}>
                    <div className="p-5 space-y-4">

                        {/* Status */}
                        <div className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border ${
                            isActive ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                        }`}>
                            <span className={`h-2 w-2 rounded-full flex-shrink-0 ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                            <span className={`text-sm font-semibold ${isActive ? 'text-emerald-700' : 'text-slate-600'}`}>
                                {isActive ? 'Compte actif' : 'Compte inactif'}
                            </span>
                        </div>

                        <div className="h-px bg-slate-100" />

                        <Field label="Email" value={user.EmailPro} />

                        <div className="h-px bg-slate-100" />

                        <Field label="Téléphone">
                            {user.TelPro ? (
                                <a href={getWhatsAppLink(user.TelPro)} target="_blank" rel="noopener noreferrer"
                                    className="text-sm font-semibold text-slate-800 hover:text-emerald-600 inline-flex items-center gap-1.5 transition-colors">
                                    {user.TelPro} {WA_ICON}
                                </a>
                            ) : <span className="text-sm text-slate-300">—</span>}
                        </Field>

                        {user.EmailPro && (
                            <>
                                <div className="h-px bg-slate-100" />
                                <button
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
                            </>
                        )}
                    </div>
                </Card>

            </div>
        </motion.div>
    );
};

export default UserDetail;
