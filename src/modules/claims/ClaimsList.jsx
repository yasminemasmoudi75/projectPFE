import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    PlusIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
    WrenchScrewdriverIcon,
    ArrowPathIcon,
    EyeIcon,
    LifebuoyIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate } from '../../utils/format';
import axios from '../../app/axios';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import usePermission from '../../hooks/usePermission';

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
    const { canCreate: canAddReclamation } = usePermission(31);
    const [loading, setLoading] = useState(true);
    const [claims, setClaims] = useState([]);
    const [techniciens, setTechniciens] = useState([]);
    const [assigningId, setAssigningId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [technicianFilter, setTechnicianFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [sortMode, setSortMode] = useState('recent');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    
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

            if (dateFilter) {
                params.append('Date', dateFilter);
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
    }, [currentPage, itemsPerPage, searchTerm, statusFilter, priorityFilter, technicianFilter, dateFilter, isTechnicien, user?.UserID]);

    const fetchTechniciens = useCallback(async () => {
        try {
            const response = await axios.get('/users?limit=1000');
            const payload = response?.data ?? response ?? {};
            const users = Array.isArray(payload?.data)
                ? payload.data
                : (Array.isArray(payload) ? payload : []);

            const techs = users
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

    const handleDeleteClaim = async (claimId) => {
        try {
            setDeletingId(claimId);
            const response = await axios.delete(`/reclamations/${claimId}`);
            
            if (response?.status === 'success' || response?.status === 200) {
                setClaims((prev) => prev.filter((claim) => claim.id !== claimId));
                toast.success('Réclamation supprimée avec succès');
                setDeleteConfirm(null);
            } else {
                toast.error('Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error(error?.response?.data?.message || 'Impossible de supprimer la réclamation');
        } finally {
            setDeletingId(null);
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
    }, [searchTerm, statusFilter, priorityFilter, technicianFilter, dateFilter, handleFilterChange]);

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

    const effectiveTotalItems = totalItems > 0 ? totalItems : filteredClaims.length;
    const effectiveTotalPages = Math.max(
        1,
        totalPages > 0 ? totalPages : Math.ceil(filteredClaims.length / itemsPerPage)
    );

    const displayedClaims = useMemo(() => {
        // Backend paginated response: keep server page data as-is.
        if (totalPages > 0) return filteredClaims;

        // Fallback: paginate locally when backend response is not paginated.
        const start = (currentPage - 1) * itemsPerPage;
        return filteredClaims.slice(start, start + itemsPerPage);
    }, [filteredClaims, totalPages, currentPage, itemsPerPage]);

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
        if (totalPages > 0) {
            fetchClaims(page, itemsPerPage);
        }
    }, [fetchClaims, itemsPerPage, totalPages]);

    // Handle items per page change
    const handleItemsPerPageChange = useCallback((newLimit) => {
        setItemsPerPage(newLimit);
        setCurrentPage(1);
        if (totalPages > 0) {
            fetchClaims(1, newLimit);
        }
    }, [fetchClaims, totalPages]);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setSearchTerm('');
        setStatusFilter('all');
        setPriorityFilter('all');
        setTechnicianFilter('all');
        setDateFilter('');
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
                {/* Header */}
                <motion.div variants={itemVariants} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="h-14 w-14 bg-sky-50 rounded-xl flex items-center justify-center">
                                <LifebuoyIcon className="h-7 w-7 text-sky-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">
                                    {isAdmin ? 'Gestion des Réclamations' : isTechnicien ? 'Mes Réclamations' : 'Mes Tickets'}
                                </h1>
                                <p className="text-sm text-slate-500 mt-1">
                                    {isAdmin 
                                        ? 'Suivez et gérez l\'ensemble de vos tickets avec efficacité.'
                                        : isTechnicien 
                                        ? 'Gérez vos interventions assignées et ajoutez des actions.'
                                        : 'Suivez les statuts de vos demandes de support.'}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {(isAdmin || isClient || canAddReclamation) && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate('/claims/new')}
                                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2"
                                >
                                    <PlusIcon className="h-5 w-5" />
                                    {isAdmin ? 'Créer un ticket' : 'Signaler un problème'}
                                </motion.button>
                            )}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={fetchClaims}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-all flex items-center gap-2"
                            >
                                <ArrowPathIcon className="h-5 w-5" />
                                Actualiser
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                        { name: 'Ouvertes', count: stats.open, icon: ExclamationCircleIcon, color: 'blue', bg: 'bg-blue-50', border: 'border-blue-200' },
                        { name: 'En cours', count: stats.inProgress, icon: WrenchScrewdriverIcon, color: 'amber', bg: 'bg-amber-50', border: 'border-amber-200' },
                        { name: 'Résolues', count: stats.resolved, icon: CheckCircleIcon, color: 'emerald', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                    ].map((item, idx) => {
                        const colorMap = {
                            blue: { text: 'text-blue-700', iconBg: 'bg-blue-100', iconText: 'text-blue-600' },
                            amber: { text: 'text-amber-700', iconBg: 'bg-amber-100', iconText: 'text-amber-600' },
                            emerald: { text: 'text-emerald-700', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
                        };
                        const colors = colorMap[item.color];
                        
                        return (
                            <motion.div
                                key={item.name}
                                variants={itemVariants}
                                whileHover={{ y: -4 }}
                                className={`card-luxury p-6 ${item.bg} ${item.border} border`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`text-sm font-bold ${colors.text} uppercase tracking-wider`}>{item.name}</span>
                                    <div className={`h-12 w-12 ${colors.iconBg} rounded-xl flex items-center justify-center`}>
                                        <item.icon className={`h-6 w-6 ${colors.iconText}`} />
                                    </div>
                                </div>
                                <div className={`text-4xl font-black ${colors.text}`}>
                                    {item.count}
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Filters Section */}
                <motion.div variants={itemVariants} className="card-luxury p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 bg-sky-100 rounded-xl flex items-center justify-center">
                            <svg className="h-5 w-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Recherche & Filtres</h3>
                            <p className="text-xs text-slate-500">Affinez vos résultats selon vos critères</p>
                        </div>
                    </div>

                    <div className={`grid gap-4 ${isClient ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-6'}`}>
                        <div className={`${isClient ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Rechercher par ticket, client, objet..."
                                    className="input-modern pl-10"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="input-modern"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="Ouvert">Ouvert</option>
                                <option value="En cours">En cours</option>
                                <option value="Résolu">Résolu</option>
                            </select>
                        </div>

                        <div>
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="input-modern"
                            />
                        </div>

                        {!isClient && (
                            <>
                                <div>
                                    <select
                                        value={priorityFilter}
                                        onChange={(e) => setPriorityFilter(e.target.value)}
                                        className="input-modern"
                                    >
                                        <option value="all">Toutes les priorités</option>
                                        <option value="Urgente">🔴 Urgente</option>
                                        <option value="Haute">🟠 Haute</option>
                                        <option value="Normale">🔵 Normale</option>
                                        <option value="Basse">⚪ Basse</option>
                                    </select>
                                </div>
                                {isAdmin && (
                                    <div>
                                        <select
                                            value={technicianFilter}
                                            onChange={(e) => setTechnicianFilter(e.target.value)}
                                            className="input-modern"
                                        >
                                            <option value="all">Tous les techniciens</option>
                                            {techniciens.map((tech) => (
                                                <option key={tech.id} value={tech.id}>{tech.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <select
                                        value={sortMode}
                                        onChange={(e) => setSortMode(e.target.value)}
                                        className="input-modern"
                                    >
                                        <option value="recent">Plus récents</option>
                                        <option value="priority">Par priorité</option>
                                        <option value="status">Par statut</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm">
                        <p className="text-slate-600 font-medium">
                            <span className="text-sky-600 font-bold">{displayedClaims.length}</span> / <span className="text-slate-400">{effectiveTotalItems}</span> réclamations
                        </p>
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                        >
                            Effacer les filtres
                        </button>
                    </div>
                </motion.div>

                {/* Table */}
                <motion.div variants={itemVariants} className="card-luxury overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-sky-100 rounded-xl flex items-center justify-center">
                                <LifebuoyIcon className="h-5 w-5 text-sky-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Tickets de Support</h3>
                                <p className="text-xs text-slate-500">
                                    {isClient ? 'Vos réclamations' : 'Gestion centralisée de tous vos tickets'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200 bg-slate-50/70">
                                    <th className="px-6 py-4 font-bold">N° Ticket</th>
                                    <th className="px-6 py-4 font-bold">Objet</th>
                                    <th className="px-6 py-4 font-bold">Priorité</th>
                                    {!isClient && <th className="px-6 py-4 font-bold">Technicien</th>}
                                    <th className="px-6 py-4 font-bold">Statut</th>
                                    <th className="px-6 py-4 text-right font-bold">Date</th>
                                    {(isClient || isTechnicien || isAdmin) && <th className="px-6 py-4 font-bold text-center">Actions</th>}
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
                                            <td colSpan={isClient ? "6" : "6"} className="text-center py-20">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                                                        <ExclamationCircleIcon className="h-8 w-8 text-slate-300" />
                                                    </div>
                                                    <h3 className="font-bold text-slate-700">Aucune réclamation</h3>
                                                    <p className="text-sm text-slate-500">Cliquez sur "Créer un Ticket" pour démarrer</p>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ) : displayedClaims.map((claim, idx) => (
                                        <motion.tr
                                            key={claim.id}
                                            variants={rowVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            transition={{ delay: idx * 0.02 }}
                                            className="hover:bg-sky-50/50 transition-colors cursor-pointer group/row"
                                            onClick={() => navigate(`/claims/${claim.id}`)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-xs font-bold bg-sky-50 text-sky-700 px-3 py-1.5 rounded-lg border border-sky-200 inline-block">
                                                    {claim.ticket}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-slate-800 truncate max-w-xs" title={claim.object}>
                                                    {claim.object}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                                    claim.priority === 'Urgente' || claim.priority === 'Urgent' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                    claim.priority === 'Haute' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    claim.priority === 'Normale' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                                        'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}>
                                                    {claim.priority}
                                                </span>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                                        <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                                            <WrenchScrewdriverIcon className="h-4 w-4 text-slate-600" />
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-xs font-semibold text-slate-800">{claim.assignedTo}</span>
                                                            <select
                                                                className="text-xs border border-slate-200 hover:border-slate-300 focus:border-sky-400 rounded-lg px-2 py-1 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all"
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
                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-block border ${
                                                    claim.status === 'Résolu' || claim.status === 'resolu' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    claim.status === 'En cours' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    claim.status === 'Ouvert' || claim.status === 'nouveau' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}>
                                                    {claim.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap text-sm text-slate-600 font-medium">
                                                {formatDate(claim.date)}
                                            </td>
                                            {(isClient || isTechnicien || isAdmin) && (
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => navigate(`/claims/${claim.id}`)}
                                                            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-all"
                                                            title="Voir le détail"
                                                        >
                                                            <EyeIcon className="h-4 w-4" />
                                                        </button>
                                                        {isTechnicien && !['résolu', 'resolu', 'fermé', 'ferme'].includes(String(claim.status || '').toLowerCase()) && (
                                                            <button
                                                                onClick={() => navigate(`/claims/${claim.id}/intervention/new`)}
                                                                className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all"
                                                                title="Ajouter une intervention"
                                                            >
                                                                <PlusIcon className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {isAdmin && (
                                                            <button
                                                                onClick={() => setDeleteConfirm(claim.id)}
                                                                disabled={deletingId === claim.id}
                                                                className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                                title="Supprimer"
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </button>
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
                    {effectiveTotalPages > 1 && (
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
                                    Page {currentPage} sur {effectiveTotalPages} ({effectiveTotalItems} éléments au total)
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
                                    {Array.from({ length: Math.min(5, effectiveTotalPages) }, (_, i) => {
                                        const pageNum = Math.max(1, Math.min(effectiveTotalPages - 4, currentPage - 2)) + i;
                                        if (pageNum > effectiveTotalPages) return null;
                                        
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
                                    disabled={currentPage >= effectiveTotalPages}
                                    className="px-3 py-2 text-sm font-medium text-slate-700 bg-white/80 border border-slate-300/60 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Suivant →
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handlePageChange(effectiveTotalPages)}
                                    disabled={currentPage >= effectiveTotalPages}
                                    className="px-3 py-2 text-sm font-medium text-slate-700 bg-white/80 border border-slate-300/60 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Dernier ⇥
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"
                        onClick={() => setDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-rose-100 rounded-xl">
                                    <ExclamationCircleIcon className="h-6 w-6 text-rose-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Supprimer la réclamation ?</h3>
                                    <p className="text-sm text-slate-600">Cette action est irréversible</p>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 mb-6">
                                Êtes-vous sûr de vouloir supprimer la réclamation{' '}
                                <span className="font-bold text-slate-900">
                                    {claims.find((c) => c.id === deleteConfirm)?.ticket || deleteConfirm}
                                </span>? Tous les détails et interventions associées seront supprimés.
                            </p>

                            <div className="flex gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all"
                                >
                                    Annuler
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDeleteClaim(deleteConfirm)}
                                    disabled={deletingId === deleteConfirm}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {deletingId === deleteConfirm ? (
                                        <>
                                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                            Suppression...
                                        </>
                                    ) : (
                                        <>
                                            <TrashIcon className="h-4 w-4" />
                                            Supprimer
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ClaimsList;
