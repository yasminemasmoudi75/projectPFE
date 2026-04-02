import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    PlusIcon,
    ChatBubbleLeftEllipsisIcon,
    ClockIcon,
    CheckCircleIcon,
    WrenchScrewdriverIcon,
    ArrowPathIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate } from '../../utils/format';
import axios from '../../app/axios';
import toast from 'react-hot-toast';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: {
    y: 0, opacity: 1, scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", bounce: 0, duration: 0.4 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

const StatPill = ({ label, value, tone }) => (
        <div className={`rounded-2xl border px-4 py-3 shadow-sm ${tone}`}>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">{label}</p>
                <p className="mt-1 text-sm font-black">{value}</p>
        </div>
);

const ClaimsList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [claims, setClaims] = useState([]);
    const [techniciens, setTechniciens] = useState([]);
    const [assigningId, setAssigningId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [technicianFilter, setTechnicianFilter] = useState('all');
    const [sortMode, setSortMode] = useState('recent');

    const fetchClaims = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('/reclamations');
            const list = response?.data ?? [];
            const mapped = (Array.isArray(list) ? list : []).map((rec) => ({
                id: rec.ID,
                ticket: rec.NumTicket,
                client: rec.LibTiers || rec.CodTiers || 'Client non défini',
                object: rec.Objet || 'Sans objet',
                date: rec.DateOuverture || rec.createdAt,
                priority: rec.Priorite || 'Moyenne',
                status: rec.Statut || 'Ouvert',
                assignedTo: rec.NomTechnicien || 'Non assigné',
                assignedToId: rec.TechnicienID || null
            }));
            setClaims(mapped);
        } catch (error) {
            console.error('Error fetching reclamations:', error);
            toast.error('Impossible de charger les réclamations');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTechniciens = useCallback(async () => {
        try {
            const response = await axios.get('/users');
            const users = response?.data ?? [];
            const techs = (Array.isArray(users) ? users : [])
                .filter((u) => String(u.UserRole || '').toLowerCase() === 'technicien')
                .map((u) => ({
                    id: u.UserID,
                    name: u.FullName || u.LoginName || `Technicien ${u.UserID}`
                }));
            setTechniciens(techs);
        } catch (error) {
            console.error('Error fetching technicians:', error);
            toast.error('Impossible de charger les techniciens');
        }
    }, []);

    const handleAssignTechnician = async (claimId, technicienID) => {
        if (!technicienID) return;

        const currentClaim = claims.find((c) => c.id === claimId);
        const selectedTech = techniciens.find((t) => String(t.id) === String(technicienID));
        if (!selectedTech) return;

        if (currentClaim && String(currentClaim.assignedToId || '') === String(selectedTech.id || '')) {
            toast('Cette réclamation est déjà affectée à ce technicien');
            return;
        }

        try {
            setAssigningId(claimId);
            const response = await axios.patch(`/reclamations/${claimId}/assign-technician`, {
                technicienID: selectedTech.id
            });

            if (response?.status === 'success') {
                const updated = response?.data || {};
                setClaims((prev) =>
                    prev.map((claim) =>
                        claim.id === claimId
                            ? {
                                ...claim,
                                assignedTo: updated.NomTechnicien || selectedTech.name,
                                assignedToId: updated.TechnicienID ?? null,
                                status: updated.Statut || (claim.status === 'Ouvert' ? 'En cours' : claim.status)
                            }
                            : claim
                    )
                );
                toast.success(`Affecté à ${selectedTech.name}`);
            } else {
                toast.error('Affectation échouée');
            }
        } catch (error) {
            console.warn('Assign technician warning:', error?.response?.status, error?.response?.data?.message);
            if (error?.response?.status === 409) {
                toast.error(error?.response?.data?.message || 'Affectation impossible: réclamation déjà affectée ou non modifiable');
                fetchClaims();
            } else {
                toast.error(error?.response?.data?.message || 'Erreur lors de l\'affectation');
            }
        } finally {
            setAssigningId(null);
        }
    };

    useEffect(() => {
        fetchClaims();
        fetchTechniciens();
    }, [fetchClaims, fetchTechniciens]);

    const filteredClaims = useMemo(() => {
        const normalize = (value) => String(value || '').toLowerCase().trim();
        const query = normalize(searchTerm);

        return [...claims]
            .filter((claim) => {
                const matchesSearch = !query || [claim.ticket, claim.client, claim.object, claim.assignedTo]
                    .some((field) => normalize(field).includes(query));
                const matchesStatus = statusFilter === 'all' || normalize(claim.status) === normalize(statusFilter);
                const matchesPriority = priorityFilter === 'all' || normalize(claim.priority) === normalize(priorityFilter);
                const matchesTechnician = technicianFilter === 'all' || String(claim.assignedToId || '') === String(technicianFilter);
                return matchesSearch && matchesStatus && matchesPriority && matchesTechnician;
            })
            .sort((a, b) => {
                if (sortMode === 'priority') {
                    const rank = { urgente: 0, urgent: 0, haute: 1, moyenne: 2, normale: 2, basse: 3 };
                    return (rank[String(a.priority || '').toLowerCase()] ?? 99) - (rank[String(b.priority || '').toLowerCase()] ?? 99);
                }
                if (sortMode === 'status') {
                    return String(a.status || '').localeCompare(String(b.status || ''));
                }
                return new Date(b.date || 0) - new Date(a.date || 0);
            });
    }, [claims, searchTerm, statusFilter, priorityFilter, technicianFilter, sortMode]);

    const stats = claims.reduce(
        (acc, claim) => {
            const status = String(claim.status || '').toLowerCase();
            const priority = String(claim.priority || '').toLowerCase();

            if (status === 'résolu' || status === 'resolu') acc.resolved += 1;
            if (status === 'en cours') acc.inProgress += 1;
            if (status === 'ouvert' || status === 'nouveau') acc.new += 1;
            if (priority === 'urgente' || priority === 'urgent') acc.urgent += 1;

            return acc;
        },
        { new: 0, inProgress: 0, urgent: 0, resolved: 0 }
    );

    if (loading) return <LoadingSpinner />;

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="min-h-screen bg-slate-50 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Header */}
                <motion.div variants={itemVariants} className="pt-8 rounded-3xl border border-slate-200 bg-white shadow-lg overflow-hidden relative">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-16 -right-12 h-56 w-56 rounded-full bg-indigo-100/60 blur-3xl" />
                        <div className="absolute bottom-0 left-1/4 h-40 w-40 rounded-full bg-sky-100/60 blur-3xl" />
                    </div>
                    <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <div className="max-w-2xl space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                <SparklesIcon className="h-3.5 w-3.5 text-indigo-500" /> Support & suivi
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Réclamations & SAV</h1>
                                <p className="text-sm sm:text-base font-medium text-slate-500 mt-2 max-w-xl leading-relaxed">
                                    Gérez les tickets, suivez les priorités et affectez rapidement les réclamations en cours.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <StatPill label="Nouveaux" value={stats.new} tone="bg-blue-50 text-blue-700 border-blue-100" />
                                <StatPill label="En cours" value={stats.inProgress} tone="bg-amber-50 text-amber-700 border-amber-100" />
                                <StatPill label="Urgents" value={stats.urgent} tone="bg-rose-50 text-rose-700 border-rose-100" />
                                <StatPill label="Résolus" value={stats.resolved} tone="bg-emerald-50 text-emerald-700 border-emerald-100" />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={fetchClaims}
                                className="inline-flex items-center justify-center h-12 w-12 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 hover:border-blue-300 transition-colors shadow-sm"
                                title="Actualiser"
                            >
                                <ArrowPathIcon className="h-5 w-5" />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate('/claims/new')}
                                className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-md hover:from-blue-700 hover:to-indigo-700"
                            >
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Créer un ticket
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Grid of Status */}
                <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { name: 'Nouveaux', count: stats.new, icon: ChatBubbleLeftEllipsisIcon, iconBg: 'bg-blue-50', iconText: 'text-blue-600', bar: 'from-blue-500 to-indigo-600' },
                        { name: 'En cours', count: stats.inProgress, icon: WrenchScrewdriverIcon, iconBg: 'bg-amber-50', iconText: 'text-amber-600', bar: 'from-amber-500 to-orange-500' },
                        { name: 'Urgents', count: stats.urgent, icon: ClockIcon, iconBg: 'bg-red-50', iconText: 'text-red-600', bar: 'from-red-500 to-rose-600' },
                        { name: 'Résolus', count: stats.resolved, icon: CheckCircleIcon, iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', bar: 'from-emerald-500 to-teal-600' },
                    ].map((item, idx) => (
                        <motion.div
                            key={item.name}
                            variants={itemVariants}
                            whileHover={{ y: -3 }}
                            className="relative bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
                        >
                            <div className={`h-1 w-full bg-gradient-to-r ${item.bar}`}></div>
                            <div className="p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{item.name}</p>
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.3 + idx * 0.1, type: "spring" }}
                                        className={`h-10 w-10 rounded-lg ${item.iconBg} flex items-center justify-center`}
                                    >
                                        <item.icon className={`h-5 w-5 ${item.iconText}`} />
                                    </motion.div>
                                </div>
                                <motion.span
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.4 + idx * 0.1 }}
                                        className="text-4xl font-black text-slate-900"
                                    >
                                        {item.count}
                                    </motion.span>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Filters */}
                <motion.div variants={itemVariants} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h3 className="font-black text-slate-800 text-base">Filtres de recherche</h3>
                            <p className="text-xs text-slate-500 mt-1">Affinez l’affichage par statut, priorité ou technicien.</p>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                            {filteredClaims.length} / {claims.length} affichées
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                        <div className="lg:col-span-2 relative">
                            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Rechercher un client, ticket ou objet"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                        <div className="relative">
                            <FunnelIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="Ouvert">Ouvert</option>
                                <option value="En cours">En cours</option>
                                <option value="Résolu">Résolu</option>
                            </select>
                        </div>
                        <div className="relative">
                            <FunnelIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="all">Toutes les priorités</option>
                                <option value="Urgente">Urgente</option>
                                <option value="Haute">Haute</option>
                                <option value="Normale">Normale</option>
                                <option value="Basse">Basse</option>
                            </select>
                        </div>
                        <div className="relative">
                            <FunnelIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                value={technicianFilter}
                                onChange={(e) => setTechnicianFilter(e.target.value)}
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="all">Tous les agents</option>
                                {techniciens.map((tech) => (
                                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="relative">
                            <select
                                value={sortMode}
                                onChange={(e) => setSortMode(e.target.value)}
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="recent">Plus récents</option>
                                <option value="priority">Par priorité</option>
                                <option value="status">Par statut</option>
                            </select>
                        </div>
                    </div>
                </motion.div>

                {/* Table */}
                <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                        <div>
                            <h3 className="font-black text-slate-800 text-base">Tickets de support</h3>
                            <p className="text-xs text-slate-500 mt-1">Tous vos tickets en un coup d'œil</p>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border border-slate-200 bg-white text-slate-600">
                            Total: {filteredClaims.length}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50">
                                    <th className="px-6 py-4">N° Ticket</th>
                                    <th className="px-6 py-4">Client & Objet</th>
                                    <th className="px-6 py-4">Priorité</th>
                                    <th className="px-6 py-4">Technicien</th>
                                    <th className="px-6 py-4">Statut</th>
                                    <th className="px-6 py-4 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <AnimatePresence>
                                    {filteredClaims.length === 0 ? (
                                        <motion.tr
                                            key="empty"
                                            variants={rowVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                        >
                                            <td colSpan="6" className="text-center py-20">
                                                <motion.div variants={itemVariants} className="flex flex-col items-center gap-4">
                                                    <div className="p-4 bg-blue-50 rounded-full">
                                                        <ChatBubbleLeftEllipsisIcon className="h-12 w-12 text-blue-300" />
                                                    </div>
                                                    <h3 className="font-bold text-slate-700 text-lg">Aucune réclamation</h3>
                                                    <p className="text-sm text-slate-500">Cliquez sur "Créer un Ticket" pour démarrer</p>
                                                </motion.div>
                                            </td>
                                        </motion.tr>
                                    ) : filteredClaims.map((claim, idx) => (
                                        <motion.tr
                                            key={claim.id}
                                            variants={rowVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => navigate(`/claims/${claim.id}`)}
                                            className="hover:bg-slate-50 transition-all cursor-pointer"
                                            whileHover={{ x: 3 }}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <motion.span whileHover={{ scale: 1.03 }} className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-md transition-all cursor-pointer">
                                                    {claim.ticket}
                                                </motion.span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-bold text-slate-800 text-sm mb-1">{claim.client}</div>
                                                    <div className="text-xs text-slate-500 truncate max-w-xs font-medium">{claim.object}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${claim.priority === 'Urgente' || claim.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                                                    claim.priority === 'Haute' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {claim.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                                    <div className="h-8 w-8 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
                                                        <WrenchScrewdriverIcon className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-xs font-bold text-slate-700">{claim.assignedTo}</span>
                                                        <select
                                                            className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                            value=""
                                                            disabled={
                                                                assigningId === claim.id ||
                                                                techniciens.length === 0 ||
                                                                String(claim.status || '').toLowerCase() === 'résolu' ||
                                                                String(claim.status || '').toLowerCase() === 'resolu' ||
                                                                String(claim.status || '').toLowerCase() === 'fermé' ||
                                                                String(claim.status || '').toLowerCase() === 'ferme'
                                                            }
                                                            onChange={(e) => {
                                                                handleAssignTechnician(claim.id, e.target.value);
                                                                e.target.value = '';
                                                            }}
                                                        >
                                                            <option value="" disabled>
                                                                {assigningId === claim.id
                                                                    ? 'Affectation...'
                                                                    : (String(claim.status || '').toLowerCase() === 'résolu' || String(claim.status || '').toLowerCase() === 'resolu' || String(claim.status || '').toLowerCase() === 'fermé' || String(claim.status || '').toLowerCase() === 'ferme')
                                                                        ? 'Clôturé'
                                                                        : 'Affecter...'}
                                                            </option>
                                                            {techniciens.map((tech) => (
                                                                <option key={tech.id} value={tech.id}>
                                                                    {tech.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <motion.span whileHover={{ scale: 1.05 }} className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white inline-block ${claim.status === 'Résolu' || claim.status === 'resolu' ? 'bg-emerald-500' :
                                                    claim.status === 'En cours' ? 'bg-amber-500' :
                                                    claim.status === 'Ouvert' || claim.status === 'nouveau' ? 'bg-blue-500' :
                                                            'bg-slate-400'
                                                    }`}>
                                                    {claim.status}
                                                </motion.span>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap text-sm text-slate-600 font-medium">
                                                {formatDate(claim.date)}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default ClaimsList;
