import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    PlusIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
    WrenchScrewdriverIcon,
    ArrowPathIcon,
    EyeIcon,
    LifebuoyIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate } from '../../utils/format';
import axios from '../../app/axios';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';

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

const PRIORITY = {
  Urgente: { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500', label: '🔴 Urgente' },
  Haute: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500', label: '🟠 Haute' },
  Normale: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500', label: '🔵 Normale' },
  Basse: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-500', label: '⚪ Basse' },
};

const STATUS = {
  Ouvert: { icon: ExclamationCircleIcon, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Ouvert' },
  'En cours': { icon: WrenchScrewdriverIcon, color: 'text-amber-600', bg: 'bg-amber-50', label: 'En cours' },
  Résolu: { icon: CheckCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Résolu' },
};

const ClaimsList = () => {
    const navigate = useNavigate();
    const { user, isClient, isTechnicien, isAdmin } = useAuth();
    const [loading, setLoading] = useState(true);
    const [claims, setClaims] = useState([]);
    const [techniciens, setTechniciens] = useState([]);
    const [assigningId, setAssigningId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [technicianFilter, setTechnicianFilter] = useState('all');
    const [sortMode, setSortMode] = useState('recent');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchClaims = useCallback(async (page = currentPage, limit = itemsPerPage) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            // Add filters as query parameters
            if (searchTerm.trim()) {
                params.append('Objet', searchTerm.trim());
                params.append('LibTiers', searchTerm.trim());
                params.append('NumTicket', searchTerm.trim());
            }
            
            if (statusFilter !== 'all') {
                params.append('Statut', statusFilter);
            }
            
            if (priorityFilter !== 'all') {
                params.append('Priorite', priorityFilter);
            }
            
            if (technicianFilter !== 'all') {
                params.append('TechnicienID', technicianFilter);
            }

            const response = await axios.get(`/reclamations?${params.toString()}`);
            const result = response?.data;
            
            if (result?.data) {
                let mapped = (Array.isArray(result.data) ? result.data : []).map((rec) => ({
                    id: rec.ID,
                    codTiers: rec.CodTiers,
                    ticket: rec.NumTicket,
                    client: rec.LibTiers || rec.CodTiers || 'Client non défini',
                    object: rec.Objet || 'Sans objet',
                    description: rec.Description || '',
                    date: rec.DateOuverture || rec.createdAt,
                    priority: rec.Priorite || 'Moyenne',
                    status: rec.Statut || 'Ouvert',
                    assignedTo: rec.NomTechnicien || 'Non assigné',
                    assignedToId: rec.TechnicienID || null
                }));
                
                // Filtrer pour les techniciens: seulement leurs réclamations assignées
                if (isTechnicien) {
                    const techId = user?.UserID;
                    const normalize = (value) => String(value || '').trim().toLowerCase();
                    const technicianNames = [user?.FullName, user?.LoginName, user?.EmailPro]
                        .map(normalize)
                        .filter(Boolean);

                    mapped = mapped.filter(claim => {
                        const idMatch = claim.assignedToId === techId || String(claim.assignedToId) === String(techId);
                        const nameMatch = technicianNames.includes(normalize(claim.assignedTo));
                        return idMatch || nameMatch;
                    });
                }

                setClaims(mapped);
                setTotalItems(result.pagination?.total || 0);
                setTotalPages(result.pagination?.pages || 0);
                setCurrentPage(result.pagination?.page || 1);
            } else {
                // Fallback for non-paginated response
                const list = result ?? [];
                let mapped = (Array.isArray(list) ? list : []).map((rec) => ({
                    id: rec.ID,
                    codTiers: rec.CodTiers,
                    ticket: rec.NumTicket,
                    client: rec.LibTiers || rec.CodTiers || 'Client non défini',
                    object: rec.Objet || 'Sans objet',
                    description: rec.Description || '',
                    date: rec.DateOuverture || rec.createdAt,
                    priority: rec.Priorite || 'Moyenne',
                    status: rec.Statut || 'Ouvert',
                    assignedTo: rec.NomTechnicien || 'Non assigné',
                    assignedToId: rec.TechnicienID || null
                }));
                
                // Filtrer pour les techniciens: seulement leurs réclamations assignées
                if (isTechnicien) {
                    const techId = user?.UserID;
                    const normalize = (value) => String(value || '').trim().toLowerCase();
                    const technicianNames = [user?.FullName, user?.LoginName, user?.EmailPro]
                        .map(normalize)
                        .filter(Boolean);

                    mapped = mapped.filter(claim => {
                        const idMatch = claim.assignedToId === techId || String(claim.assignedToId) === String(techId);
                        const nameMatch = technicianNames.includes(normalize(claim.assignedTo));
                        return idMatch || nameMatch;
                    });
                }

                setClaims(mapped);
                setTotalItems(mapped.length);
                setTotalPages(1);
                setCurrentPage(1);
            }
        } catch (error) {
            console.error('Error fetching reclamations:', error);
            toast.error('Impossible de charger les réclamations');
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, searchTerm, statusFilter, priorityFilter, technicianFilter, isTechnicien, user?.UserID]);

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

            // axios interceptor already returns response.data payload
            if (response?.status === 'success') {
                const updated = response?.data || {};
                const updatedId = updated?.ID ?? updated?.id ?? claimId;
                setClaims((prev) =>
                    prev.map((claim) =>
                        String(claim.id) === String(updatedId)
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
                // Ensure UI reflects server state immediately (covers backend fallback paths)
                fetchClaims();
            } else {
                toast.error('Affectation échouée: ' + (response?.message || 'réponse invalide'));
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
        // Clients voient uniquement les leurs
        // Techniciens voient leurs réclamations assignées
        // Admins voient toutes les réclamations
        fetchClaims();
        if (isAdmin) {
            fetchTechniciens();
        }

        // Auto-refresh pour techniciens: toutes les 5 secondes
        // Permet de voir les nouvelles assignations de l'admin en temps quasi-réel
        let interval;
        if (isTechnicien) {
            interval = setInterval(() => {
                fetchClaims(currentPage, itemsPerPage);
            }, 5000); // 5 secondes
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [fetchClaims, fetchTechniciens, isAdmin, isTechnicien, currentPage, itemsPerPage]);

    // Handle filter changes - reset to page 1
    const handleFilterChange = useCallback(() => {
        setCurrentPage(1);
        fetchClaims(1, itemsPerPage);
    }, [fetchClaims, itemsPerPage]);

    // Effect for filter changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            handleFilterChange();
        }, 300); // Debounce search

        return () => clearTimeout(timeoutId);
    }, [searchTerm, statusFilter, priorityFilter, technicianFilter, handleFilterChange]);

    const filteredClaims = useMemo(() => {
        // Since filtering is now handled by the backend, we mainly do sorting here
        return [...claims].sort((a, b) => {
            if (sortMode === 'priority') {
                const rank = { urgente: 0, urgent: 0, haute: 1, moyenne: 2, normale: 2, basse: 3 };
                return (rank[String(a.priority || '').toLowerCase()] ?? 99) - (rank[String(b.priority || '').toLowerCase()] ?? 99);
            }
            if (sortMode === 'status') {
                return String(a.status || '').localeCompare(String(b.status || ''));
            }
            return new Date(b.date || 0) - new Date(a.date || 0);
        });
    }, [claims, sortMode]);

    const stats = useMemo(() => {
        return claims.reduce(
            (acc, claim) => {
                const status = String(claim.status || '').toLowerCase();

                if (status === 'résolu' || status === 'resolu') acc.resolved += 1;
                else if (status === 'en cours') acc.inProgress += 1;
                else if (status === 'ouvert' || status === 'nouveau') acc.open += 1;

                return acc;
            },
            { open: 0, inProgress: 0, resolved: 0 }
        );
    }, [claims]);

    // Handle page changes
    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
        fetchClaims(page, itemsPerPage);
    }, [fetchClaims, itemsPerPage]);

    // Handle items per page change
    const handleItemsPerPageChange = useCallback((newLimit) => {
        setItemsPerPage(newLimit);
        setCurrentPage(1);
        fetchClaims(1, newLimit);
    }, [fetchClaims]);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setSearchTerm('');
        setStatusFilter('all');
        setPriorityFilter('all');
        setTechnicianFilter('all');
        setSortMode('recent');
        setCurrentPage(1);
        fetchClaims(1, itemsPerPage);
    }, [fetchClaims, itemsPerPage]);

    if (loading) return <LoadingSpinner />;

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50/30 pb-20">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400/5 rounded-full blur-3xl animate-pulse" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-8">
                {/* Hero Header - Premium Look */}
                <motion.div variants={itemVariants} className="group rounded-3xl bg-gradient-to-br from-white via-slate-50 to-blue-50/60 backdrop-blur-xl border border-slate-200/60 p-8 sm:p-12 shadow-lg hover:shadow-xl transition-all overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/3 via-transparent to-cyan-500/3 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl" />
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500" />
                    
                    <div className="relative space-y-6">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-3"
                        >
                            <div className="p-3 bg-gradient-to-br from-blue-100/80 to-cyan-100/60 rounded-xl border border-blue-200/50 group-hover:border-blue-300 transition-all">
                                <LifebuoyIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <span className="text-sm font-bold text-blue-700 uppercase tracking-widest">Support & SAV</span>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-3 tracking-tight">
                                {isAdmin ? 'Gestion des Réclamations' : isTechnicien ? 'Mes Réclamations' : 'Mes Tickets'}
                            </h1>
                            <p className="text-lg text-slate-600 max-w-2xl leading-relaxed font-medium">
                                {isAdmin 
                                    ? 'Suivez et gérez l\'ensemble de vos tickets avec efficacité et professionnalisme.'
                                    : isTechnicien 
                                    ? 'Gérez vos interventions assignées et ajoutez des actions à vos réclamations.'
                                    : 'Suivez les statuts de vos demandes de support.'}
                            </p>
                        </motion.div>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-wrap gap-3 pt-4"
                        >
                            {(isAdmin || isClient) && (
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -3 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate('/claims/new')}
                                    className="px-7 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-400/30 group/btn"
                                >
                                    <PlusIcon className="h-5 w-5 inline mr-2 group-hover/btn:rotate-90 transition-transform" />
                                    {isAdmin ? 'Créer un ticket' : 'Signaler un problème'}
                                </motion.button>
                            )}
                            <motion.button
                                whileHover={{ scale: 1.05, y: -3 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={fetchClaims}
                                className="px-7 py-3.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 hover:border-slate-400 transition-all shadow-sm hover:shadow-md"
                            >
                                <ArrowPathIcon className="h-5 w-5 inline mr-2 group-hover:rotate-180 transition-transform" />
                                Actualiser
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Stats Cards - Premium */}
                <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                        { name: 'Ouvertes', count: stats.open, icon: ExclamationCircleIcon, gradient: 'from-blue-500 to-blue-400', light: 'from-blue-50 to-blue-100/40', text: 'text-blue-700', badge: 'bg-blue-100/60 border-blue-300/40' },
                        { name: 'En cours', count: stats.inProgress, icon: WrenchScrewdriverIcon, gradient: 'from-amber-500 to-amber-400', light: 'from-amber-50 to-amber-100/40', text: 'text-amber-700', badge: 'bg-amber-100/60 border-amber-300/40' },
                        { name: 'Résolues', count: stats.resolved, icon: CheckCircleIcon, gradient: 'from-emerald-500 to-emerald-400', light: 'from-emerald-50 to-emerald-100/40', text: 'text-emerald-700', badge: 'bg-emerald-100/60 border-emerald-300/40' },
                    ].map((item, idx) => (
                        <motion.div
                            key={item.name}
                            variants={itemVariants}
                            whileHover={{ y: -8, x: 0 }}
                            className={`group relative rounded-2xl bg-gradient-to-br ${item.light} backdrop-blur-sm border border-slate-200/60 p-6 overflow-hidden shadow-lg hover:shadow-2xl transition-all`}
                        >
                            <div className={`absolute -top-20 -right-20 w-56 h-56 bg-gradient-to-br ${item.light} rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500 opacity-60`} />
                            <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-3 transition-all duration-300`} />
                            
                            <div className="relative space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs font-bold ${item.text} uppercase tracking-widest opacity-90`}>{item.name}</span>
                                    <motion.div
                                        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                        className={`${item.badge} border rounded-lg p-2.5 transition-all`}
                                    >
                                        <item.icon className={`h-5 w-5 ${item.text}`} />
                                    </motion.div>
                                </div>
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.3 + idx * 0.1, type: 'spring', stiffness: 200 }}
                                    className={`text-4xl sm:text-5xl font-black ${item.text}`}
                                >
                                    {item.count}
                                </motion.div>
                                <div className={`h-1 w-12 bg-gradient-to-r from-transparent via-slate-300/50 to-transparent`} />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Filters Section - Premium Enhanced */}
                <motion.div variants={itemVariants} className="group rounded-2xl bg-gradient-to-br from-white via-slate-50 to-blue-50/40 backdrop-blur-sm border border-slate-200/60 p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/2 via-transparent to-cyan-500/2 opacity-0 group-hover:opacity-100 transition-all rounded-2xl" />
                    <div className="relative">
                        <div className="mb-8 flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-blue-100/80 to-cyan-100/60 rounded-xl border border-blue-200/50">
                                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">Recherche & Filtres</h3>
                                <p className="text-sm text-slate-600 mt-2 font-medium">Affinez vos résultats selon vos critères</p>
                            </div>
                        </div>

                        {/* Grid layout depends on if client or admin */}
                        <div className={`grid gap-4 ${isClient ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-5'}`}>
                            <div className={`${isClient ? 'lg:col-span-1' : 'lg:col-span-2'} relative group/input`}>
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-300/20 to-cyan-300/20 rounded-xl blur opacity-0 group-hover/input:opacity-100 transition-all" />
                                <div className="relative flex items-center">
                                    <svg className="absolute left-3 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Rechercher par ticket, client, objet..."
                                        className="relative w-full rounded-xl bg-white/60 backdrop-blur-sm border border-slate-300/50 hover:border-slate-400 focus:border-blue-400 pl-10 pr-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300/30 transition-all"
                                    />
                                </div>
                            </div>
                            
                            {/* Status Filter */}
                            <div className="relative group/select">
                                <div className="absolute inset-0 bg-gradient-to-r from-slate-300/20 to-slate-300/20 rounded-xl blur opacity-0 group-hover/select:opacity-100 transition-all" />
                                <div className="relative flex items-center">
                                    <svg className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="relative w-full rounded-xl bg-white/60 backdrop-blur-sm border border-slate-300/50 hover:border-slate-400 focus:border-blue-400 pl-9 pr-8 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-300/30 transition-all appearance-none"
                                    >
                                        <option value="all">Tous les statuts</option>
                                        <option value="Ouvert">Ouvert</option>
                                        <option value="En cours">En cours</option>
                                        <option value="Résolu">Résolu</option>
                                    </select>
                                    <svg className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Admin-only filters */}
                            {!isClient && (
                                <>
                                    <div className="relative group/select">
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-300/20 to-amber-300/20 rounded-xl blur opacity-0 group-hover/select:opacity-100 transition-all" />
                                        <div className="relative flex items-center">
                                            <svg className="absolute left-3 h-4 w-4 text-amber-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                            <select
                                                value={priorityFilter}
                                                onChange={(e) => setPriorityFilter(e.target.value)}
                                                className="relative w-full rounded-xl bg-white/60 backdrop-blur-sm border border-slate-300/50 hover:border-slate-400 focus:border-blue-400 pl-9 pr-8 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-300/30 transition-all appearance-none"
                                            >
                                                <option value="all">Toutes les priorités</option>
                                                <option value="Urgente">🔴 Urgente</option>
                                                <option value="Haute">🟠 Haute</option>
                                                <option value="Normale">🔵 Normale</option>
                                                <option value="Basse">⚪ Basse</option>
                                            </select>
                                            <svg className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                    {isAdmin && (
                                        <div className="relative group/select">
                                            <div className="absolute inset-0 bg-gradient-to-r from-green-300/20 to-green-300/20 rounded-xl blur opacity-0 group-hover/select:opacity-100 transition-all" />
                                            <div className="relative flex items-center">
                                                <svg className="absolute left-3 h-4 w-4 text-green-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <select
                                                    value={technicianFilter}
                                                    onChange={(e) => setTechnicianFilter(e.target.value)}
                                                    className="relative w-full rounded-xl bg-white/60 backdrop-blur-sm border border-slate-300/50 hover:border-slate-400 focus:border-blue-400 pl-9 pr-8 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-300/30 transition-all appearance-none"
                                                >
                                                    <option value="all">Tous les techniciens</option>
                                                    {techniciens.map((tech) => (
                                                        <option key={tech.id} value={tech.id}>{tech.name}</option>
                                                    ))}
                                                </select>
                                                <svg className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                    <div className="relative group/select">
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-300/20 to-purple-300/20 rounded-xl blur opacity-0 group-hover/select:opacity-100 transition-all" />
                                        <div className="relative flex items-center">
                                            <svg className="absolute left-3 h-4 w-4 text-purple-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                            </svg>
                                            <select
                                                value={sortMode}
                                                onChange={(e) => setSortMode(e.target.value)}
                                                className="relative w-full rounded-xl bg-white/60 backdrop-blur-sm border border-slate-300/50 hover:border-slate-400 focus:border-blue-400 pl-9 pr-8 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-300/30 transition-all appearance-none"
                                            >
                                                <option value="recent">Plus récents</option>
                                                <option value="priority">Par priorité</option>
                                                <option value="status">Par statut</option>
                                            </select>
                                            <svg className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-4 flex items-center justify-between text-sm"
                        >
                            <p className="text-slate-700 font-semibold">
                                <span className="text-blue-600 font-bold">{filteredClaims.length}</span> / <span className="text-slate-500">{totalItems}</span> réclamations affichées
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={clearFilters}
                                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100/60 border border-slate-300/60 rounded-lg hover:bg-slate-200/60 hover:border-slate-400/60 transition-all"
                            >
                                Effacer les filtres
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Table - Premium Enhanced */}
                <motion.div variants={itemVariants} className="group rounded-2xl bg-gradient-to-br from-white via-slate-50 to-blue-50/30 backdrop-blur-sm border border-slate-200/60 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="px-6 sm:px-8 py-6 border-b border-slate-200/60 bg-gradient-to-r from-white/80 to-blue-50/40 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <div className="p-2 bg-blue-100/60 rounded-lg">
                                    <LifebuoyIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                Tickets de Support
                            </h3>
                            <p className="text-sm text-slate-600 mt-1 font-medium">
                                {isClient ? 'Vos réclamations' : 'Gestion centralisée de tous vos tickets'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            Mise à jour en temps réel
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200/60 bg-gradient-to-r from-slate-50/70 to-blue-50/40">
                                    <th className="px-6 py-4 font-bold">N° Ticket</th>
                                    <th className="px-6 py-4 font-bold">Objet</th>
                                    <th className="px-6 py-4 font-bold">Priorité</th>
                                    {!isClient && <th className="px-6 py-4 font-bold">Technicien</th>}
                                    <th className="px-6 py-4 font-bold">Statut</th>
                                    <th className="px-6 py-4 text-right font-bold">Date</th>
                                    {(isClient || isTechnicien) && <th className="px-6 py-4 font-bold text-center">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/70">
                                <AnimatePresence>
                                    {filteredClaims.length === 0 ? (
                                        <motion.tr
                                            key="empty"
                                            variants={rowVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                        >
                                            <td colSpan={isClient ? "6" : "6"} className="text-center py-24">
                                                <motion.div variants={itemVariants} className="flex flex-col items-center gap-4">
                                                    <div className="p-4 bg-slate-100/80 rounded-2xl border border-slate-200/60">
                                                        <ExclamationCircleIcon className="h-12 w-12 text-slate-300" />
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
                                            transition={{ delay: idx * 0.02 }}
                                            className="hover:bg-blue-50/40 transition-all cursor-pointer border-b border-slate-100/70 last:border-b-0 group/row"
                                            onClick={() => navigate(`/claims/${claim.id}`)}
                                            whileHover={{ x: 2 }}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <motion.span whileHover={{ scale: 1.05 }} className="font-mono text-xs font-bold bg-gradient-to-r from-blue-100/80 to-blue-50/60 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-300/40 inline-block transition-all group-hover/row:border-blue-400/60 group-hover/row:shadow-lg group-hover/row:shadow-blue-300/20">
                                                    {claim.ticket}
                                                </motion.span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-900 truncate max-w-xs" title={claim.object}>
                                                    {claim.object}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                                    claim.priority === 'Urgente' || claim.priority === 'Urgent' ? 'bg-rose-100/70 text-rose-700 border-rose-300/40' :
                                                    claim.priority === 'Haute' ? 'bg-amber-100/70 text-amber-700 border-amber-300/40' :
                                                    claim.priority === 'Normale' ? 'bg-slate-100/70 text-slate-700 border-slate-300/40' :
                                                        'bg-slate-100/60 text-slate-600 border-slate-300/30'
                                                }`}>
                                                    {claim.priority}
                                                </span>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                                        <div className="h-8 w-8 bg-slate-100/80 border border-slate-300/60 rounded-lg flex items-center justify-center group-hover/row:border-blue-400/40 transition-all">
                                                            <WrenchScrewdriverIcon className="h-4 w-4 text-slate-600 group-hover/row:text-blue-600 transition-all" />
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-xs font-semibold text-slate-800">{claim.assignedTo}</span>
                                                            <select
                                                                className="text-xs border border-slate-300/60 hover:border-slate-400 focus:border-blue-400 rounded-lg px-2 py-1 bg-white/80 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300/30 transition-all"
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
                                                                        ? 'En cours...'
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
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <motion.span whileHover={{ scale: 1.05 }} className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-block border transition-all ${
                                                    claim.status === 'Résolu' || claim.status === 'resolu' ? 'bg-emerald-100/70 text-emerald-700 border-emerald-300/40' :
                                                    claim.status === 'En cours' ? 'bg-amber-100/70 text-amber-700 border-amber-300/40' :
                                                    claim.status === 'Ouvert' || claim.status === 'nouveau' ? 'bg-blue-100/70 text-blue-700 border-blue-300/40' :
                                                            'bg-slate-100/60 text-slate-600 border-slate-300/30'
                                                }`}>
                                                    {claim.status}
                                                </motion.span>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap text-sm text-slate-600 font-medium group-hover/row:text-slate-800 transition-all">
                                                {formatDate(claim.date)}
                                            </td>
                                            {(isClient || isTechnicien) && (
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                        <motion.button
                                                            whileHover={{ scale: 1.08 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => navigate(`/claims/${claim.id}`)}
                                                            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-100/70 border border-blue-300/40 rounded-lg hover:bg-blue-100 hover:border-blue-400/60 transition-all"
                                                            title="Voir le détail"
                                                        >
                                                            <EyeIcon className="h-4 w-4" />
                                                        </motion.button>
                                                        {isTechnicien && !['résolu', 'resolu', 'fermé', 'ferme'].includes(String(claim.status || '').toLowerCase()) && (
                                                            <motion.button
                                                                whileHover={{ scale: 1.08 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => navigate(`/claims/${claim.id}/intervention/new`)}
                                                                className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300/40 rounded-lg hover:bg-emerald-100 hover:border-emerald-400/60 transition-all"
                                                                title="Ajouter une intervention"
                                                            >
                                                                <PlusIcon className="h-4 w-4" />
                                                            </motion.button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="px-6 py-4 border-t border-slate-200/60 bg-gradient-to-r from-white/80 to-blue-50/40 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-600 font-medium">Éléments par page:</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                        className="text-sm border border-slate-300/60 rounded-lg px-2 py-1 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-300/30"
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </select>
                                </div>
                                <div className="text-sm text-slate-600">
                                    Page {currentPage} sur {totalPages} ({totalItems} éléments au total)
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage <= 1}
                                    className="px-3 py-2 text-sm font-medium text-slate-700 bg-white/80 border border-slate-300/60 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    ⇤ Premier
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                    className="px-3 py-2 text-sm font-medium text-slate-700 bg-white/80 border border-slate-300/60 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    ← Précédent
                                </motion.button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                        if (pageNum > totalPages) return null;
                                        
                                        return (
                                            <motion.button
                                                key={pageNum}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                                                    pageNum === currentPage
                                                        ? 'bg-blue-600 text-white shadow-lg'
                                                        : 'text-slate-700 bg-white/80 border border-slate-300/60 hover:bg-slate-50'
                                                }`}
                                            >
                                                {pageNum}
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                    className="px-3 py-2 text-sm font-medium text-slate-700 bg-white/80 border border-slate-300/60 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Suivant →
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage >= totalPages}
                                    className="px-3 py-2 text-sm font-medium text-slate-700 bg-white/80 border border-slate-300/60 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Dernier ⇥
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
};

export default ClaimsList;
