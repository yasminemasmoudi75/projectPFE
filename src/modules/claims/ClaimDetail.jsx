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
    Normale: { bg: 'bg-sky-50',    text: 'text-sky-600',    dot: 'bg-sky-400',    border: 'border-sky-200',    glow: 'shadow-sky-100'    },
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
            if (res?.status === 'success') { setClaim(res.data); toast.success(`Affecté à ${tech.name}`); }
            else toast.error('Affectation échouée');
        } catch (e) { toast.error(e.response?.data?.message || "Erreur lors de l'affectation"); }
        finally { setAssigning(false); }
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            const res = await axios.patch(`/reclamations/${id}/statut`, { statut: newStatus });
            if (res?.status === 'success') { setClaim(res.data); toast.success(`Statut : ${newStatus}`); }
            else toast.error('Mise à jour du statut échouée');
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
            className="min-h-screen pb-24 px-4 sm:px-6 lg:px-8"
            style={{ background: 'linear-gradient(155deg, #f0f5ff 0%, #f8fafc 45%, #f0fdf8 100%)' }}
        >
            {/* Full-width status ribbon */}
            <div className={`h-1 w-full bg-gradient-to-r ${status.bar} fixed top-0 left-0 z-50`} />

            <div className="max-w-6xl mx-auto pt-10 space-y-6">

                {/* ── Top nav ── */}
                <motion.div variants={card} className="flex flex-wrap items-center justify-between gap-3">
                    <motion.button
                        whileHover={{ x: -4 }} whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/claims')}
                        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-xs font-bold transition-colors"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Retour aux réclamations
                    </motion.button>

                    <div className="flex items-center gap-2">
                        <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-500 shadow-sm">
                            <ChatBubbleLeftEllipsisIcon className="h-3 w-3" />
                            {claim.NumTicket || `#RM${claim.ID}`}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${status.bg} ${status.text} ${status.border}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {claim.Statut}
                        </span>
                    </div>

                    {userIsAdmin && !isClosed && (
                        <motion.button
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            onClick={() => handleStatusUpdate('Résolu')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-colors"
                        >
                            <CheckCircleIcon className="h-4 w-4" />
                            Marquer Résolu
                        </motion.button>
                    )}
                </motion.div>

                {/* ── Hero banner ── */}
                <motion.div variants={card}
                    className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg"
                    style={{ boxShadow: '0 8px 40px rgba(99,102,241,.08), 0 2px 8px rgba(0,0,0,.04)' }}
                >
                    {/* decorative blobs */}
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-indigo-100/60 blur-3xl" />
                        <div className="absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-sky-100/60 blur-2xl" />
                    </div>
                    {/* left accent */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${status.bar}`} />

                    <div className="relative px-8 pt-8 pb-7 pl-10">
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.22em] mb-1">Suivi de votre demande</p>
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight"
                                    style={{ fontFamily: "'Georgia', serif" }}
                                >
                                    {claim.Objet}
                                </h1>
                                <p className="mt-2 text-sm text-slate-500 font-medium">
                                    {claim.LibTiers || claim.CodTiers} · Ouvert le {formatDate(claim.DateOuverture)}
                                </p>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${prio.bg} ${prio.text} ${prio.border}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${prio.dot}`} />
                                {claim.Priorite || 'Normale'}
                            </span>
                        </div>

                        {/* KPI row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { label: 'Priorité',      value: claim.Priorite || 'Normale',                                             tone: `${prio.bg} ${prio.text} ${prio.border}`              },
                                { label: 'Statut',        value: claim.Statut,                                                            tone: `${status.bg} ${status.text} ${status.border}`        },
                                { label: 'Actions',       value: `${interventions.length} action${interventions.length !== 1 ? 's' : ''}`, tone: 'bg-slate-50 text-slate-700 border-slate-200'       },
                                { label: 'Agent support', value: claim.NomTechnicien || 'Non assigné',                                    tone: claim.NomTechnicien ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200' },
                            ].map(k => (
                                <div key={k.label} className={`rounded-xl border px-4 py-3 ${k.tone}`}>
                                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-0.5">{k.label}</p>
                                    <p className="text-xs font-black truncate">{k.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* ── Main grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Left col (2/3) ── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Claim detail card */}
                        <motion.div variants={card} className="bg-white rounded-2xl border border-slate-100 shadow-md overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/30 flex items-center gap-2">
                                <DocumentTextIcon className="h-4 w-4 text-indigo-500" />
                                <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Détail de la réclamation</h2>
                            </div>
                            <div className="p-6 space-y-5">
                                {/* role / stats row */}
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: 'Rôle',         value: userIsAdmin ? 'Administration' : userIsTechnicien ? 'Technicien' : userIsClient ? 'Client' : 'Utilisateur' },
                                        { label: 'Interventions', value: interventions.length },
                                        { label: 'Statut',       value: claim.Statut },
                                    ].map(m => (
                                        <div key={m.label} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{m.label}</p>
                                            <p className="mt-1 text-sm font-black text-slate-800">{m.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* client / ticket */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <UserCircleIcon className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-blue-500">Client</p>
                                            <p className="text-sm font-black text-slate-800">{claim.LibTiers || claim.CodTiers}</p>
                                        </div>
                                    </div>
                                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                            <TagIcon className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-500">N° Ticket</p>
                                            <p className="text-sm font-black text-slate-800 font-mono">{claim.NumTicket || `#RM${claim.ID}`}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* description */}
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Description</p>
                                    <p className="text-slate-700 text-sm leading-relaxed">{claim.Description}</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Timeline */}
                        <motion.div variants={card} className="bg-white rounded-2xl border border-slate-100 shadow-md p-6">
                            <div className="flex items-center gap-2 mb-7">
                                <ArrowTrendingUpIcon className="h-4 w-4 text-indigo-500" />
                                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Historique</h3>
                            </div>
                            <ol className="relative border-l-2 border-dashed border-slate-200 space-y-7 pl-8">
                                <TStep delay={0.1} color="bg-indigo-500" title="Ticket créé" sub={formatDate(claim.DateOuverture)} icon={<CalendarIcon className="h-3 w-3 text-white" />} />
                                {claim.NomTechnicien && <TStep delay={0.2} color="bg-amber-500" title="Agent support assigné" sub={claim.NomTechnicien} icon={<WrenchScrewdriverIcon className="h-3 w-3 text-white" />} />}
                                {claim.Statut === 'En cours' && <TStep delay={0.25} color="bg-orange-500" title="Traitement en cours" sub="En attente de résolution" icon={<ClockIcon className="h-3 w-3 text-white" />} pulse />}
                                {claim.Statut === 'Résolu'   && <TStep delay={0.3}  color="bg-emerald-500" title="Ticket résolu ✓" sub={formatDate(claim.DateResolution || new Date())} icon={<CheckCircleIcon className="h-3 w-3 text-white" />} />}
                            </ol>
                        </motion.div>

                        {/* Interventions list */}
                        <motion.div variants={card} className="bg-white rounded-2xl border border-slate-100 shadow-md overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/30 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BoltIcon className="h-4 w-4 text-indigo-500" />
                                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Journal des actions</h3>
                                    <span className="ml-1 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black">
                                        {interventions.length}
                                    </span>
                                </div>
                                <select
                                    value={interventionFilter}
                                    onChange={e => setInterventionFilter(e.target.value)}
                                    className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                                >
                                    <option value="all">Toutes</option>
                                    <option value="with-report">Avec compte-rendu</option>
                                    <option value="without-report">Sans compte-rendu</option>
                                    <option value="closed">Terminées</option>
                                </select>
                            </div>

                            <div className="p-6">
                                {filteredInterventions.length === 0 ? (
                                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                                            <BoltIcon className="h-6 w-6 text-slate-300" />
                                        </div>
                                        <p className="text-sm font-black text-slate-600">Aucune action enregistrée</p>
                                        <p className="text-xs text-slate-400 max-w-xs">Les actions apparaissent ici dès que votre demande est prise en charge.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredInterventions.map((item, index) => (
                                            <motion.div key={`${item.iddi || index}`} whileHover={{ y: -2 }}
                                                className="rounded-2xl border border-slate-100 bg-slate-50 p-5 shadow-sm"
                                            >
                                                <div className="flex items-start justify-between gap-3 mb-4">
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900">Action #{item.numdi || '-'}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">Ajoutée le {formatDate(item.datdi)}</p>
                                                    </div>
                                                    <span className="px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black uppercase tracking-widest text-indigo-700">
                                                        Suivi intervention
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <InfoBlock label="Demandeur"      value={item.demandeur || claim.LibTiers || '-'} />
                                                    <InfoBlock label="Problème signalé"    value={item.descPanne || claim.Objet || '-'} />
                                                </div>
                                                {item.intervention && (
                                                    <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div>
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Rapport d'action #{item.intervention.numbt || '-'}</p>
                                                                <p className="text-sm font-black text-emerald-900 mt-0.5">Intervenant: {item.intervention.technicien || claim.NomTechnicien || 'Agent support'}</p>
                                                            </div>
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.intervention.clotured ? 'bg-emerald-100 text-emerald-700' : item.intervention.encours ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                                                {item.intervention.clotured ? 'Terminé' : item.intervention.encours ? 'En cours' : 'Démarré'}
                                                            </span>
                                                        </div>
                                                        <p className="mt-2 text-xs text-emerald-800 leading-relaxed">
                                                            {item.intervention.resultat || 'Sans rapport détaillé'}
                                                        </p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* ── Right sidebar (1/3) ── */}
                    <div className="space-y-5">

                        {/* State + progress */}
                        <motion.div variants={card} className="bg-white rounded-2xl border border-slate-100 shadow-md p-6 overflow-hidden relative">
                            <div className={`absolute inset-0 opacity-[0.03] bg-gradient-to-br ${status.bar}`} />
                            <p className="relative text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">État du ticket</p>
                            <div className={`relative flex items-center gap-3 p-4 rounded-2xl border ${status.bg} ${status.border}`}>
                                <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${status.bar} flex items-center justify-center shadow-md flex-shrink-0`}>
                                    <StatusIcon className="h-5 w-5 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className={`font-black text-sm ${status.text}`}>{claim.Statut}</p>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">{status.label}</p>
                                </div>
                                {!isClosed && <span className="ml-auto h-2 w-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />}
                            </div>
                            <div className="mt-4">
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: status.pct }}
                                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                                        className={`h-full rounded-full bg-gradient-to-r ${status.bar}`}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-semibold mt-1.5">{status.pct} complété</p>
                            </div>
                        </motion.div>

                        {/* Technicien card */}
                        <motion.div variants={card} className="bg-white rounded-2xl border border-slate-100 shadow-md p-6">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                                <WrenchScrewdriverIcon className="h-3.5 w-3.5" /> Agent support en charge
                            </p>
                            <AnimatePresence mode="wait">
                                {claim.NomTechnicien ? (
                                    <motion.div key="tech" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center gap-3 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100"
                                    >
                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-400 to-blue-600 flex items-center justify-center shadow-md flex-shrink-0">
                                            <UserCircleIcon className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 text-sm">{claim.NomTechnicien}</p>
                                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Actif
                                            </span>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="flex items-center gap-2 p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-600 text-sm font-bold"
                                    >
                                        <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" /> Non assigné
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Add intervention entry point */}
                        {(userIsAdmin || userIsTechnicien) && !isClosed && (
                            <motion.div variants={card}
                                className="bg-white rounded-2xl border border-slate-100 shadow-md p-6 space-y-4"
                            >
                                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                                    <SparklesIcon className="h-3.5 w-3.5" /> Nouvelle action
                                </p>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Utilisez le formulaire dédié pour enregistrer une action complète avec type, durée, prochaine étape et compte-rendu.
                                </p>
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => navigate(`/claims/${id}/intervention/new`)}
                                    className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <SparklesIcon className="h-4 w-4" /> Ouvrir le formulaire professionnel
                                </motion.button>
                            </motion.div>
                        )}

                        {/* Client space */}
                        {userIsClient && (
                            <motion.div variants={card} className="bg-white rounded-2xl border border-slate-100 shadow-md p-6 space-y-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <UserCircleIcon className="h-3.5 w-3.5" /> Espace client
                                </p>
                                <p className="text-sm text-slate-600 leading-relaxed">Suivez l'état de votre réclamation ou ouvrez un nouveau ticket.</p>
                                <div className="flex flex-col gap-2">
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                        onClick={() => navigate('/claims/new')}
                                        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md"
                                    >
                                        Créer une réclamation
                                    </motion.button>
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                        onClick={() => navigate('/claims')}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        Voir mes réclamations
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {/* Assign technician */}
                        {userIsAdmin && !isClosed && (
                            <motion.div variants={card} className="bg-white rounded-2xl border border-slate-100 shadow-md p-6">
                                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                                    <UserPlusIcon className="h-3.5 w-3.5" /> Affecter un agent support
                                </p>
                                {techniciens.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center py-3 font-semibold">Aucun agent disponible</p>
                                ) : (
                                    <>
                                        <select
                                            defaultValue="" disabled={assigning}
                                            onChange={e => { const t = techniciens.find(x => String(x.id) === e.target.value); if (t) handleAssign(t); }}
                                            className="w-full px-4 py-3 text-sm font-semibold text-slate-700 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer appearance-none"
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236366f1'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                                        >
                                            <option value="" disabled>Sélectionner un agent...</option>
                                            {techniciens.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                        <AnimatePresence>
                                            {assigning && (
                                                <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                    className="mt-3 text-xs text-indigo-500 font-bold text-center flex items-center justify-center gap-2"
                                                >
                                                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                        className="inline-block h-3 w-3 border-2 border-indigo-400 border-t-transparent rounded-full"
                                                    />
                                                    Affectation en cours…
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </>
                                )}
                            </motion.div>
                        )}

                        {/* Info card */}
                        <motion.div variants={card} className="bg-white rounded-2xl border border-slate-100 shadow-md overflow-hidden">
                            <div className={`h-0.5 w-full bg-gradient-to-r ${status.bar}`} />
                            <div className="p-6">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Informations</p>
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
        <span className={`absolute -left-[2.15rem] top-0.5 h-7 w-7 rounded-full ${color} flex items-center justify-center shadow-md ${pulse ? 'animate-pulse' : ''}`}>
            {icon}
        </span>
        <p className="text-sm font-black text-slate-800">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5 font-medium">{sub}</p>
    </motion.li>
);

const InfoBlock = ({ label, value }) => (
    <div className="rounded-xl bg-white border border-slate-100 px-4 py-3">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-semibold text-slate-800 truncate">{value}</p>
    </div>
);

const MRow = ({ icon, iconBg, label, value, chip, last }) => (
    <div className={`flex items-center justify-between py-3 ${!last ? 'border-b border-slate-50' : ''}`}>
        <span className="flex items-center gap-2.5 text-slate-500 text-xs font-semibold">
            <span className={`h-7 w-7 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>{icon}</span>
            {label}
        </span>
        {chip
            ? <span className="text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 px-2.5 py-1 rounded-lg">{value}</span>
            : <span className="text-xs font-black text-slate-700">{value}</span>
        }
    </div>
);

export default ClaimDetail;
