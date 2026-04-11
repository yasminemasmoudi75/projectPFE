import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    ChatBubbleLeftEllipsisIcon,
    ClockIcon,
    CheckCircleIcon,
    WrenchScrewdriverIcon,
    UserCircleIcon,
    CalendarIcon,
    ExclamationCircleIcon,
    UserPlusIcon,
    TagIcon,
    SparklesIcon,
    ArrowTrendingUpIcon,
    BoltIcon,
    DocumentTextIcon,
    Cog6ToothIcon,
    LightBulbIcon,
    ShieldCheckIcon,
    FireIcon,
    StarIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';
import axios from '../../app/axios';
import useAuth from '../../hooks/useAuth';
import { USER_ROLES } from '../../utils/constants';

/* ─── Variants ───────────────────────────────────────────────── */
const page = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } } };
const card = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 280, damping: 24 } } };

/* ─── Configs ────────────────────────────────────────────────── */
const PRIORITY = {
    Urgente: { bg: 'bg-rose-50',   text: 'text-rose-600',   dot: 'bg-rose-500',   border: 'border-rose-200',   glow: 'shadow-rose-100'   },
    Haute:   { bg: 'bg-amber-50',  text: 'text-amber-600',  dot: 'bg-amber-500',  border: 'border-amber-200',  glow: 'shadow-amber-100'  },
    Normale: { bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-400',    border: 'border-blue-200',    glow: 'shadow-blue-100'    },
    Basse:   { bg: 'bg-slate-50',  text: 'text-slate-500',  dot: 'bg-slate-300',  border: 'border-slate-200',  glow: 'shadow-slate-100'  },
};

const STATUS = {
    'Résolu':   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircleIcon,       bar: 'from-emerald-400 to-teal-500',   barHex: '#10b981', pct: '100%', label: 'Fermé avec succès'       },
    'En cours': { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   icon: WrenchScrewdriverIcon, bar: 'from-amber-400 to-orange-500',   barHex: '#f59e0b', pct: '55%',  label: 'Traitement en cours…'     },
    'Ouvert':   { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',     icon: ExclamationCircleIcon, bar: 'from-blue-400 to-indigo-500',    barHex: '#3b82f6', pct: '15%',  label: "En attente d'assignation" },
};

/* ════════════════════════════════════════════════════════════════ */
const ClaimDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAdmin: userIsAdmin, isTechnicien: userIsTechnicien, isClient: userIsClient } = useAuth();

    const [loading, setLoading]                   = useState(true);
    const [claim, setClaim]                       = useState(null);
    const [assigning, setAssigning]               = useState(false);
    const [techniciens, setTechniciens]           = useState([]);
    const [interventionFilter, setInterventionFilter] = useState('all');

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const [claimRes, usersRes] = await Promise.all([
                    axios.get(`/reclamations/${id}`),
                    userIsAdmin ? axios.get('/users') : Promise.resolve({ status: 'skipped', data: [] })
                ]);
                if (claimRes?.status === 'success') setClaim(claimRes.data || null);
                if (usersRes?.status === 'success' && Array.isArray(usersRes.data)) {
                    setTechniciens(usersRes.data
                        .filter(u => String(u.UserRole || '').toLowerCase() === USER_ROLES.TECHNICIEN.toLowerCase())
                        .map(u => ({ id: u.UserID, name: u.FullName || u.LoginName || `Tech ${u.UserID}` }))
                    );
                }
            } catch { toast.error('Impossible de charger la réclamation'); }
            finally { setLoading(false); }
        })();
    }, [id, userIsAdmin]);

    const handleAssign = async (tech) => {
        setAssigning(true);
        try {
            const res = await axios.patch(`/reclamations/${id}/assign-technician`, { technicienID: tech.id });
            if (res?.status === 'success') { setClaim(res?.data || claim); toast.success(`Affecté à ${tech.name}`); }
            else toast.error('Affectation échouée: ' + (res?.message || ''));
        } catch (e) { toast.error(e.response?.data?.message || "Erreur lors de l'affectation"); }
        finally { setAssigning(false); }
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            const res = await axios.patch(`/reclamations/${id}/statut`, { statut: newStatus });
            if (res?.status === 'success') { setClaim(res?.data || claim); toast.success(`Statut : ${newStatus}`); }
            else toast.error('Mise à jour du statut échouée: ' + (res?.message || ''));
        } catch (e) { toast.error(e.response?.data?.message || 'Erreur mise à jour'); }
    };

    if (loading) return <LoadingSpinner />;
    if (!claim)  return null;

    const prio   = PRIORITY[claim.Priorite] || PRIORITY.Normale;
    const status = STATUS[claim.Statut]     || STATUS.Ouvert;
    const StatusIcon = status.icon;
    const interventions = Array.isArray(claim.interventions) ? claim.interventions : [];
    const isClosed = ['résolu', 'resolu', 'fermé', 'ferme'].includes(String(claim.Statut || '').toLowerCase());

    const filteredInterventions = interventions.filter(item => {
        const reportText = String(item.intervention?.resultat || '').trim();
        const hasReport = !!reportText && reportText.toLowerCase() !== 'sans rapport détaillé';
        if (interventionFilter === 'all')            return true;
        if (interventionFilter === 'with-report')    return hasReport;
        if (interventionFilter === 'without-report') return !hasReport;
        if (interventionFilter === 'closed')         return item.intervention?.clotured;
        return true;
    });

    return (
        <motion.div variants={page} initial="hidden" animate="visible"
            className="min-h-screen px-3 sm:px-6 lg:px-8"
            style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}
        >
            {/* Premium status ribbon */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${status.bar} fixed top-0 left-0 z-50 shadow-lg`} />

            <div className="max-w-7xl mx-auto pt-8 pb-24 space-y-8">

                {/* ── Premium header ── */}
                <motion.div variants={card} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <motion.button
                        whileHover={{ x: -3 }} whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/claims')}
                        className="inline-flex items-center gap-2.5 text-slate-600 hover:text-slate-700 text-sm font-semibold transition-all"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                        Retour
                    </motion.button>

                    <div className="flex items-center gap-3 flex-wrap">
                        <motion.div whileHover={{ scale: 1.05 }} className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider bg-white border border-slate-200 text-slate-600 shadow-md hover:shadow-lg transition-all">
                            <TagIcon className="h-4 w-4 text-indigo-600" />
                            {claim.NumTicket || `#RM${claim.ID}`}
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl text-xs font-bold border shadow-md hover:shadow-lg transition-all ${status.bg} ${status.text} ${status.border}`}>
                            <StatusIcon className="h-4 w-4" />
                            {claim.Statut}
                        </motion.div>
                    </div>

                    {userIsAdmin && !isClosed && (
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)' }} 
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleStatusUpdate('Résolu')}
                            className="inline-flex items-center gap-2.5 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
                        >
                            <CheckCircleIcon className="h-5 w-5" />
                            Marquer Résolu
                        </motion.button>
                    )}
                </motion.div>

                {/* ── Premium hero banner ── */}
                <motion.div variants={card}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-white to-slate-100 border border-slate-200/50 shadow-2xl"
                >
                    {/* Decorative elements */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className={`absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br ${status.bar} opacity-[0.08] blur-3xl`} />
                        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-indigo-500 opacity-[0.05] blur-3xl" />
                    </div>

                    <div className="relative px-8 sm:px-12 py-12 sm:py-16">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
                            <div className="flex-1">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em] mb-3">Détail du ticket</p>
                                <h1 className="text-3xl sm:text-4xl font-black text-slate-800 leading-tight mb-4 max-w-2xl"
                                    style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}
                                >
                                    {claim.Objet}
                                </h1>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-slate-600 font-medium">
                                    <div className="flex items-center gap-2">
                                        <UserCircleIcon className="h-4 w-4 text-indigo-500" />
                                        <span>{claim.LibTiers || claim.CodTiers}</span>
                                    </div>
                                    <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-300" />
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 text-indigo-500" />
                                        <span>{formatDate(claim.DateOuverture)}</span>
                                    </div>
                                </div>
                            </div>

                            <motion.div whileHover={{ scale: 1.05 }} className={`inline-flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border ${prio.border} ${prio.bg} shadow-md`}>
                                <div className={`h-3 w-3 rounded-full ${prio.dot}`} />
                                <span className={`text-xs font-black uppercase tracking-wider ${prio.text}`}>{claim.Priorite || 'Normale'}</span>
                            </motion.div>
                        </div>

                        {/* KPI cards - Premium style */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
                            {[
                                { icon: StarIcon, label: 'Statut', value: claim.Statut, color: 'from-blue-300 to-indigo-400', bgColor: 'from-blue-100 to-indigo-100' },
                                { icon: BoltIcon, label: 'Actions', value: interventions.length, color: 'from-amber-300 to-orange-400', bgColor: 'from-amber-100 to-orange-100' },
                                { icon: WrenchScrewdriverIcon, label: 'Assigné à', value: claim.NomTechnicien || 'Non assigné', color: 'from-emerald-300 to-teal-400', bgColor: 'from-emerald-100 to-teal-100' },
                                { icon: FireIcon, label: 'Priorité', value: claim.Priorite || 'Normale', color: 'from-rose-300 to-pink-400', bgColor: 'from-rose-100 to-pink-100' },
                            ].map((item, idx) => (
                                <motion.div key={idx} whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,.12)' }}
                                    className={`bg-gradient-to-br ${item.bgColor} rounded-2xl border border-slate-200/50 px-5 py-5 shadow-lg hover:shadow-xl transition-all`}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md`}>
                                            <item.icon className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">{item.label}</p>
                                    <p className="text-base font-black text-slate-800 truncate">{item.value}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* ── Main grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Left col (2/3) ── */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Claim detail card - Premium */}
                        <motion.div variants={card} className="rounded-2xl bg-white border border-slate-200 shadow-md overflow-hidden hover:shadow-lg transition-all">
                            <div className="h-1 w-full bg-gradient-to-r from-indigo-300 to-purple-300" />
                            <div className="px-8 sm:px-10 py-10">
                                <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-300 to-blue-400 flex items-center justify-center">
                                        <DocumentTextIcon className="h-5 w-5 text-white" />
                                    </div>
                                    Informations du ticket
                                </h2>

                                {/* Client & Ticket info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                                    <motion.div whileHover={{ scale: 1.01, y: -2 }} className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm text-slate-800">
                                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Client</p>
                                        <p className="text-lg font-bold text-slate-800">{claim.LibTiers || claim.CodTiers}</p>
                                        <p className="text-sm text-slate-500 mt-2 font-medium">Demandeur du ticket</p>
                                    </motion.div>
                                    <motion.div whileHover={{ scale: 1.01, y: -2 }} className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm text-slate-800">
                                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">N° Ticket</p>
                                        <p className="text-lg font-bold font-mono text-slate-800">{claim.NumTicket || `#RM${claim.ID}`}</p>
                                        <p className="text-sm text-slate-500 mt-2 font-medium">Référence unique</p>
                                    </motion.div>
                                </div>

                                {/* Description */}
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
                                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <LightBulbIcon className="h-4 w-4 text-slate-600" />
                                        Description
                                    </p>
                                    <p className="text-slate-700 leading-relaxed font-medium text-base">{claim.Description || 'Aucune description fournie'}</p>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { label: 'Rôle', value: userIsAdmin ? 'Admin' : userIsTechnicien ? 'Tech' : 'Client', color: 'bg-gradient-to-br from-indigo-300 to-blue-400' },
                                        { label: 'Actions', value: interventions.length, color: 'bg-gradient-to-br from-amber-300 to-orange-400' },
                                        { label: 'Statut', value: claim.Statut, color: 'bg-gradient-to-br from-emerald-300 to-teal-400' },
                                    ].map(item => (
                                        <motion.div key={item.label} whileHover={{ y: -2 }} className={`${item.color} rounded-lg px-4 py-4 shadow-sm text-white`}>
                                            <p className="text-xs font-semibold opacity-80 uppercase tracking-wider mb-1">{item.label}</p>
                                            <p className="text-base font-bold">{item.value}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Timeline - Premium */}
                        <motion.div variants={card} className="rounded-2xl bg-white border border-slate-200 shadow-md p-8 sm:p-10 overflow-hidden hover:shadow-lg transition-all">
                            <div className="h-1 w-full absolute top-0 left-0 right-0 bg-gradient-to-r from-indigo-300 to-purple-300" />
                            <h3 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-300 to-purple-400 flex items-center justify-center">
                                    <ArrowTrendingUpIcon className="h-5 w-5 text-white" />
                                </div>
                                Historique du ticket
                            </h3>
                            <ol className="relative space-y-8 pl-8 border-l-2 border-slate-300">
                                <TStep delay={0.1} color="bg-indigo-400" title="Ticket créé" sub={formatDate(claim.DateOuverture)} icon={<CalendarIcon className="h-4 w-4 text-white" />} />
                                {claim.NomTechnicien && <TStep delay={0.2} color="bg-blue-400" title="Agent assigné" sub={claim.NomTechnicien} icon={<WrenchScrewdriverIcon className="h-4 w-4 text-white" />} />}
                                {claim.Statut === 'En cours' && <TStep delay={0.25} color="bg-amber-400" title="Traitement en cours" sub="En attente de résolution" icon={<ClockIcon className="h-4 w-4 text-white" />} pulse />}
                                {claim.Statut === 'Résolu'   && <TStep delay={0.3}  color="bg-emerald-400" title="Ticket résolu ✓" sub={formatDate(claim.DateResolution || new Date())} icon={<CheckCircleIcon className="h-4 w-4 text-white" />} />}
                            </ol>
                        </motion.div>

                        {/* Interventions list - Premium */}
                        <motion.div variants={card} className="rounded-2xl bg-white border border-slate-200 shadow-md overflow-hidden hover:shadow-lg transition-all">
                            <div className="h-1 w-full bg-gradient-to-r from-amber-300 via-orange-400 to-red-400" />
                            <div className="px-8 sm:px-10 py-8">
                                <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center shadow-sm">
                                            <BoltIcon className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-800">Journal des actions</h3>
                                            <p className="text-xs text-slate-500 font-medium mt-0.5">{interventions.length} action{interventions.length !== 1 ? 's' : ''} enregistrée{interventions.length !== 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                    <select
                                        value={interventionFilter}
                                        onChange={e => setInterventionFilter(e.target.value)}
                                        className="text-xs font-bold bg-white border-2 border-amber-300 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                                    >
                                        <option value="all">Toutes</option>
                                        <option value="with-report">Avec rapport</option>
                                        <option value="without-report">Sans rapport</option>
                                        <option value="closed">Terminées</option>
                                    </select>
                                </div>

                                <div>
                                    {filteredInterventions.length === 0 ? (
                                        <div className="flex flex-col items-center gap-4 py-16 text-center">
                                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                                <BoltIcon className="h-8 w-8 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-slate-600">Aucune action enregistrée</p>
                                                <p className="text-sm text-slate-400 mt-1 font-medium">Les actions apparaîtront une fois la demande prise en charge</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {filteredInterventions.map((item, index) => (
                                                <motion.div key={`${item.iddi || index}`} whileHover={{ scale: 1.01, y: -2 }}
                                                    className="rounded-2xl bg-gradient-to-br from-white via-slate-50 to-white border border-slate-100/50 p-6 shadow-md hover:shadow-lg transition-all"
                                                >
                                                    {/* Header */}
                                                    <div className="flex items-start justify-between gap-4 mb-5">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2.5 mb-2">
                                                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                                                    <Cog6ToothIcon className="h-4 w-4 text-white" />
                                                                </div>
                                                                <p className="text-base font-black text-slate-800">Action #{item.numdi || '-'}</p>
                                                            </div>
                                                            <p className="text-xs text-slate-500 ml-10 font-semibold">{formatDate(item.datdi)}</p>
                                                        </div>
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/50 text-xs font-bold text-amber-700 whitespace-nowrap">
                                                            <BoltIcon className="h-3.5 w-3.5" />
                                                            En suivi
                                                        </span>
                                                    </div>

                                                    {/* Problem description */}
                                                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50 rounded-xl p-4 mb-4">
                                                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Problème reporté</p>
                                                        <p className="text-sm font-bold text-slate-800">{item.descPanne || claim.Objet || '-'}</p>
                                                        <p className="text-xs text-slate-600 mt-2 font-medium">Par <span className="font-black text-slate-800">{item.demandeur || claim.LibTiers || '-'}</span></p>
                                                    </div>

                                                    {/* Intervention report */}
                                                    {item.intervention && (
                                                        <div className={`rounded-xl border px-5 py-4 ${item.intervention.clotured ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/50' : item.intervention.encours ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50' : 'bg-gradient-to-br from-sky-50 to-cyan-50 border-blue-200/50'}`}>
                                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                                <div>
                                                                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${item.intervention.clotured ? 'text-emerald-700' : item.intervention.encours ? 'text-amber-700' : 'text-blue-700'}`}>
                                                                        Rapport d'action #{item.intervention.numbt || '-'}
                                                                    </p>
                                                                    <p className={`text-sm font-bold ${item.intervention.clotured ? 'text-emerald-900' : item.intervention.encours ? 'text-amber-900' : 'text-blue-900'}`}>
                                                                        {item.intervention.technicien || claim.NomTechnicien || 'Agent support'}
                                                                    </p>
                                                                </div>
                                                                <motion.span whileHover={{ scale: 1.05 }} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 ${item.intervention.clotured ? 'bg-emerald-100/80 text-emerald-700' : item.intervention.encours ? 'bg-amber-100/80 text-amber-700' : 'bg-blue-100/80 text-blue-700'}`}>
                                                                    {item.intervention.clotured && <CheckCircleIcon className="h-3.5 w-3.5" />}
                                                                    {item.intervention.encours && <ClockIcon className="h-3.5 w-3.5" />}
                                                                    {!item.intervention.clotured && !item.intervention.encours && <BoltIcon className="h-3.5 w-3.5" />}
                                                                    {item.intervention.clotured ? 'Terminée' : item.intervention.encours ? 'En cours' : 'Démarrée'}
                                                                </motion.span>
                                                            </div>
                                                            {item.intervention.resultat && (
                                                                <div className={`text-xs leading-relaxed font-medium ${item.intervention.clotured ? 'text-emerald-800' : item.intervention.encours ? 'text-amber-800' : 'text-blue-800'}`}>
                                                                    <p className="font-bold mb-1.5">Rapport:</p>
                                                                    <p className="opacity-95">{item.intervention.resultat}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* ── Right sidebar (1/3) ── */}
                    <div className="space-y-8">

                        {/* State + Progress - Premium */}
                        <motion.div variants={card} className="rounded-3xl bg-gradient-to-br from-white to-slate-50 border border-slate-200/50 shadow-xl p-8 overflow-hidden relative hover:shadow-2xl transition-all">
                            <div className={`absolute -top-20 -right-20 h-40 w-40 opacity-[0.06] bg-gradient-to-br ${status.bar} rounded-full blur-3xl`} />
                            <div className="relative">
                                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${status.bar} flex items-center justify-center`}>
                                        <StatusIcon className="h-5 w-5 text-white" />
                                    </div>
                                    État du ticket
                                </h3>
                                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className={`relative flex items-center gap-4 p-5 rounded-2xl border ${status.bg} ${status.border} mb-6`}>
                                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${status.bar} flex items-center justify-center shadow-lg flex-shrink-0`}>
                                        <StatusIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-base font-black ${status.text}`}>{claim.Statut}</p>
                                        <p className="text-xs text-slate-600 font-semibold mt-1">{status.label}</p>
                                    </div>
                                </motion.div>
                                <div>
                                    <div className="flex items-center justify-between mb-2.5">
                                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Progression</p>
                                        <span className={`text-sm font-black ${status.text}`}>{status.pct}</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: status.pct }}
                                            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                                            className={`h-full rounded-full bg-gradient-to-r ${status.bar} shadow-lg`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Technician Card - Premium style */}
                        <motion.div variants={card} className="rounded-3xl bg-gradient-to-br from-white to-indigo-50/30 border border-slate-200/50 shadow-xl p-8 overflow-hidden relative hover:shadow-2xl transition-all">
                            <div className="absolute -top-20 -right-20 h-40 w-40 opacity-[0.06] bg-indigo-500 rounded-full blur-3xl" />
                            <div className="relative">
                                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2.5">
                                    <WrenchScrewdriverIcon className="h-5 w-5 text-indigo-400" />
                                    Agent assigné
                                </h3>
                                <AnimatePresence mode="wait">
                                    {claim.NomTechnicien ? (
                                        <motion.div key="tech" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-4 p-5 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl border border-indigo-200/70"
                                        >
                                            <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 3, repeat: Infinity }} className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-300 to-blue-400 flex items-center justify-center shadow-lg flex-shrink-0">
                                                <UserCircleIcon className="h-6 w-6 text-white" />
                                            </motion.div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-black text-slate-800 text-base truncate">{claim.NomTechnicien}</p>
                                                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-bold mt-1">
                                                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                                    Actif
                                                </span>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="none" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-4 p-5 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl border border-rose-200/70"
                                        >
                                            <div className="h-12 w-12 rounded-xl bg-rose-200 flex items-center justify-center flex-shrink-0">
                                                <ExclamationCircleIcon className="h-6 w-6 text-rose-600" />
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-rose-700">Non assigné</p>
                                                <p className="text-xs text-rose-600 font-semibold mt-0.5">À assigner en priorité</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        {/* Client space */}
                        {userIsClient && (
                            <motion.div variants={card} className="bg-white rounded-3xl border border-slate-200/50 shadow-xl p-6 space-y-4 hover:shadow-2xl transition-all">
                                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2.5">
                                    <UserCircleIcon className="h-5 w-5 text-blue-400" />
                                    Espace client
                                </h3>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">Suivez l'état de votre réclamation ou ouvrez un nouveau ticket.</p>
                                    <div className="flex flex-col gap-2">
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                        onClick={() => navigate('/claims/new')}
                                        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all"
                                    >
                                        + Créer une réclamation
                                    </motion.button>
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                        onClick={() => navigate('/claims')}
                                        className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        Voir mes réclamations
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {/* Assign technician */}
                        {userIsAdmin && !isClosed && (
                            <motion.div variants={card} className="bg-white rounded-3xl border border-slate-200/50 shadow-xl overflow-hidden hover:shadow-2xl transition-all">
                                <div className="h-2 w-full bg-gradient-to-r from-indigo-300 to-purple-400" />
                                <div className="p-6">
                                    <h3 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-300 to-purple-400 flex items-center justify-center shadow-md">
                                            <UserPlusIcon className="h-5 w-5 text-white" />
                                        </div>
                                        Affecter un agent support
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium mb-5">Sélectionnez un agent disponible pour prendre en charge ce ticket</p>
                                    {techniciens.length === 0 ? (
                                        <div className="flex flex-col items-center gap-3 py-6 text-center">
                                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                                <UserPlusIcon className="h-6 w-6 text-slate-400" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-600">Aucun agent disponible</p>
                                            <p className="text-xs text-slate-400 font-medium">Veuillez créer des agents avant d'assigner</p>
                                        </div>
                                    ) : (
                                        <>
                                            <select
                                                defaultValue="" disabled={assigning}
                                                onChange={e => { const t = techniciens.find(x => String(x.id) === e.target.value); if (t) handleAssign(t); }}
                                                className="w-full px-4 py-3.5 text-sm font-bold text-slate-700 bg-gradient-to-br from-indigo-100 to-purple-100 border-2 border-indigo-300 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
                                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236366f1'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '18px', paddingRight: '40px' }}
                                            >
                                                <option value="" disabled>✓ Sélectionner un agent...</option>
                                                {techniciens.map(t => <option key={t.id} value={t.id}>👤 {t.name}</option>)}
                                            </select>
                                            <AnimatePresence>
                                                {assigning && (
                                                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                        className="mt-4 p-3 rounded-lg bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-200/70 flex items-center justify-center gap-2"
                                                    >
                                                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                                            className="inline-block h-4 w-4 border-2 border-indigo-300 border-t-indigo-500 rounded-full"
                                                        />
                                                        <span className="text-xs font-bold text-indigo-500">Affectation en cours…</span>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Info card */}
                        <motion.div variants={card} className="bg-white rounded-3xl border border-slate-200/50 shadow-xl overflow-hidden hover:shadow-2xl transition-all">
                            <div className="h-0.5 w-full bg-gradient-to-r from-indigo-300 to-purple-400" />
                            <div className="p-6">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-indigo-600" />
                                    Détails du ticket
                                </p>
                                <div className="space-y-1">
                                    <MRow icon={<CalendarIcon className="h-4 w-4 text-indigo-400" />} iconBg="bg-indigo-50" label="Date d'ouverture" value={formatDate(claim.DateOuverture)} />
                                    <MRow icon={<TagIcon       className="h-4 w-4 text-violet-400" />} iconBg="bg-violet-50" label="Type"            value={claim.TypeReclamation} chip />
                                    <MRow icon={<SparklesIcon  className="h-4 w-4 text-amber-400"  />} iconBg="bg-amber-50"  label="Priorité"        value={claim.Priorite} last />
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </div>

        </motion.div>
    );
};

/* ── Helpers ─────────────────────────────────────────────────── */

const TStep = ({ delay, color, title, sub, icon, pulse }) => (
    <motion.li initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay, type: 'spring', stiffness: 260, damping: 22 }} className="relative"
    >
        <motion.span whileHover={{ scale: 1.15 }} className={`absolute -left-[2.5rem] top-1 h-9 w-9 rounded-full ${color} flex items-center justify-center shadow-lg ${pulse ? 'animate-pulse' : ''}`}>
            {icon}
        </motion.span>
        <p className="text-base font-black text-slate-800">{title}</p>
        <p className="text-sm text-slate-500 mt-1 font-semibold">{sub}</p>
    </motion.li>
);

const InfoBlock = ({ label, value }) => (
    <div className="rounded-xl bg-white border border-slate-100 px-4 py-3">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-semibold text-slate-800 truncate">{value}</p>
    </div>
);

const MRow = ({ icon, iconBg, label, value, chip, last }) => (
    <div className={`flex items-center justify-between py-3.5 ${!last ? 'border-b border-slate-100' : ''}`}>
        <span className="flex items-center gap-3 text-slate-700 text-sm font-semibold">
            <span className={`h-8 w-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>{icon}</span>
            {label}
        </span>
        {chip
            ? <span className="text-xs font-bold bg-violet-50 text-violet-600 border border-violet-200/50 px-3 py-1.5 rounded-lg">{value}</span>
            : <span className="text-sm font-black text-slate-800">{value}</span>
        }
    </div>
);

export default ClaimDetail;
