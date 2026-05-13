import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PlusIcon, ExclamationCircleIcon, CheckCircleIcon,
  WrenchScrewdriverIcon, ArrowPathIcon, EyeIcon, LifebuoyIcon,
  TrashIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon,
  FunnelIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate } from '../../utils/format';
import axios from '../../app/axios';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import usePermission from '../../hooks/usePermission';

/* ─── configs ────────────────────────────────────────────────── */
const PRIORITY_CFG = {
  Urgente: { badge: 'bg-rose-50 text-rose-600 border border-rose-200',   dot: 'bg-rose-400' },
  Haute:   { badge: 'bg-amber-50 text-amber-600 border border-amber-200', dot: 'bg-amber-400' },
  Normale: { badge: 'bg-slate-100 text-slate-600 border border-slate-200', dot: 'bg-slate-400' },
  Basse:   { badge: 'bg-slate-50 text-slate-500 border border-slate-200',  dot: 'bg-slate-300' },
};
const getPriorityCfg = (p) => PRIORITY_CFG[p] || PRIORITY_CFG.Normale;

const STATUS_CFG = {
  Ouvert:     { badge: 'bg-sky-50 text-sky-600 border border-sky-200',      dot: 'bg-sky-400',     row: '#f0f9ff' },
  'En cours': { badge: 'bg-amber-50 text-amber-600 border border-amber-200', dot: 'bg-amber-400',   row: '#fffbeb' },
  Résolu:     { badge: 'bg-emerald-50 text-emerald-600 border border-emerald-200', dot: 'bg-emerald-400', row: '#f0fdf4' },
};
const getStatusCfg = (s) => STATUS_CFG[s] || { badge: 'bg-slate-50 text-slate-500 border border-slate-200', dot: 'bg-slate-300', row: '#f8fafc' };

/* ─── ClaimsList ─────────────────────────────────────────────── */
const ClaimsList = () => {
  const navigate = useNavigate();
  const { user, isClient, isTechnicien, isAdmin } = useAuth();
  const { canCreate: canAddReclamation, isFilterRepresEnabled } = usePermission(31);

  const [loading, setLoading]                   = useState(true);
  const [claims, setClaims]                     = useState([]);
  const [techniciens, setTechniciens]           = useState([]);
  const [commercials, setCommercials]           = useState([]);
  const [assigningId, setAssigningId]           = useState(null);
  const [searchTerm, setSearchTerm]             = useState('');
  const [statusFilter, setStatusFilter]         = useState('all');
  const [priorityFilter, setPriorityFilter]     = useState('all');
  const [technicianFilter, setTechnicianFilter] = useState('all');
  const [commercialFilter, setCommercialFilter] = useState('all');
  const [dateFilter, setDateFilter]             = useState('');
  const [sortMode, setSortMode]                 = useState('recent');
  const [deleteConfirm, setDeleteConfirm]       = useState(null);
  const [deletingId, setDeletingId]             = useState(null);
  const [currentPage, setCurrentPage]           = useState(1);
  const [itemsPerPage, setItemsPerPage]         = useState(10);
  const [totalItems, setTotalItems]             = useState(0);
  const [totalPages, setTotalPages]             = useState(0);

  const fetchClaims = useCallback(async (page = currentPage, limit = itemsPerPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (searchTerm.trim()) {
        params.append('Objet', searchTerm.trim());
        params.append('LibTiers', searchTerm.trim());
        params.append('NumTicket', searchTerm.trim());
      }
      if (statusFilter !== 'all')    params.append('Statut', statusFilter);
      if (priorityFilter !== 'all')  params.append('Priorite', priorityFilter);
      if (technicianFilter !== 'all') params.append('TechnicienID', technicianFilter);
      if (commercialFilter !== 'all') params.append('CommercialID', commercialFilter);
      if (dateFilter)                params.append('Date', dateFilter);

      const response = await axios.get(`/reclamations?${params.toString()}`);
      const result = response?.data;

      const mapItem = (rec) => ({
        id: rec.ID, codTiers: rec.CodTiers, ticket: rec.NumTicket,
        client: rec.LibTiers || rec.CodTiers || 'Client non défini',
        object: rec.Objet || 'Sans objet', description: rec.Description || '',
        date: rec.DateOuverture || rec.createdAt,
        priority: rec.Priorite || 'Moyenne', status: rec.Statut || 'Ouvert',
        assignedTo: rec.NomTechnicien || 'Non assigné', assignedToId: rec.TechnicienID || null,
      });

      const filterForTech = (list) => {
        if (!isTechnicien) return list;
        const techId = user?.UserID;
        const normalize = (v) => String(v || '').trim().toLowerCase();
        const names = [user?.FullName, user?.LoginName, user?.EmailPro].map(normalize).filter(Boolean);
        return list.filter(c =>
          c.assignedToId === techId || String(c.assignedToId) === String(techId) ||
          names.includes(normalize(c.assignedTo))
        );
      };

      if (result?.data) {
        const mapped = filterForTech((Array.isArray(result.data) ? result.data : []).map(mapItem));
        setClaims(mapped);
        setTotalItems(result.pagination?.total || 0);
        setTotalPages(result.pagination?.pages || 0);
        setCurrentPage(result.pagination?.page || 1);
      } else {
        const mapped = filterForTech((Array.isArray(result ?? []) ? result ?? [] : []).map(mapItem));
        setClaims(mapped);
        setTotalItems(mapped.length);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch {
      toast.error('Impossible de charger les réclamations');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, priorityFilter, technicianFilter, commercialFilter, dateFilter, isTechnicien, user?.UserID]);

  const fetchTechniciens = useCallback(async () => {
    try {
      const res = await axios.get('/users?limit=1000');
      const users = Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : []);
      setTechniciens(users.filter(u => String(u.UserRole || '').toLowerCase() === 'technicien')
        .map(u => ({ id: u.UserID, name: u.FullName || u.LoginName || `Technicien ${u.UserID}` })));
    } catch { toast.error('Impossible de charger les techniciens'); }
  }, []);

  const fetchCommercials = useCallback(async () => {
    try {
      const res = await axios.get('/users/commercials/devis-filter', {
        params: { moduleCode: '31', includeAll: isFilterRepresEnabled ? 'false' : 'true' },
      });
      const raw = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setCommercials(raw.map(c => ({ id: c.userId || c.UserID, name: c.fullName || c.FullName || c.label || c.login || c.LoginName })));
    } catch {}
  }, [isFilterRepresEnabled]);

  const handleAssignTechnician = async (claimId, technicienID) => {
    if (!technicienID) return;
    const currentClaim  = claims.find(c => c.id === claimId);
    const selectedTech  = techniciens.find(t => String(t.id) === String(technicienID));
    if (!selectedTech) return;
    if (currentClaim && String(currentClaim.assignedToId || '') === String(selectedTech.id || '')) {
      toast('Cette réclamation est déjà affectée à ce technicien'); return;
    }
    try {
      setAssigningId(claimId);
      const response = await axios.patch(`/reclamations/${claimId}/assign-technician`, { technicienID: selectedTech.id });
      if (response?.status === 'success') {
        const updated = response?.data || {};
        const updatedId = updated?.ID ?? updated?.id ?? claimId;
        setClaims(prev => prev.map(c =>
          String(c.id) === String(updatedId)
            ? { ...c, assignedTo: updated.NomTechnicien || selectedTech.name, assignedToId: updated.TechnicienID ?? null, status: updated.Statut || (c.status === 'Ouvert' ? 'En cours' : c.status) }
            : c
        ));
        toast.success(`Affecté à ${selectedTech.name}`);
        fetchClaims();
      } else {
        toast.error('Affectation échouée : ' + (response?.message || 'réponse invalide'));
      }
    } catch (error) {
      if (error?.response?.status === 409) {
        toast.error(error?.response?.data?.message || 'Affectation impossible : réclamation déjà affectée');
        fetchClaims();
      } else {
        toast.error(error?.response?.data?.message || "Erreur lors de l'affectation");
      }
    } finally { setAssigningId(null); }
  };

  const handleDeleteClaim = async (claimId) => {
    try {
      setDeletingId(claimId);
      const response = await axios.delete(`/reclamations/${claimId}`);
      if (response?.status === 'success' || response?.status === 200) {
        setClaims(prev => prev.filter(c => c.id !== claimId));
        toast.success('Réclamation supprimée avec succès');
        setDeleteConfirm(null);
      } else { toast.error('Erreur lors de la suppression'); }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Impossible de supprimer la réclamation');
    } finally { setDeletingId(null); }
  };

  useEffect(() => {
    fetchClaims();
    if (isAdmin) fetchTechniciens();
    const role = String(user?.UserRole || '').trim().toLowerCase();
    if (!isClient && !['commercial', 'commerciale'].includes(role)) fetchCommercials();
    let interval;
    if (isTechnicien) interval = setInterval(() => fetchClaims(currentPage, itemsPerPage), 5000);
    return () => { if (interval) clearInterval(interval); };
  }, [fetchClaims, fetchTechniciens, fetchCommercials, isAdmin, isClient, isTechnicien, currentPage, itemsPerPage, user?.UserRole]);

  const handleFilterChange = useCallback(() => {
    setCurrentPage(1); fetchClaims(1, itemsPerPage);
  }, [fetchClaims, itemsPerPage]);

  useEffect(() => {
    const id = setTimeout(handleFilterChange, 300);
    return () => clearTimeout(id);
  }, [searchTerm, statusFilter, priorityFilter, technicianFilter, commercialFilter, dateFilter, handleFilterChange]);

  const filteredClaims = useMemo(() => [...claims].sort((a, b) => {
    if (sortMode === 'priority') {
      const rank = { urgente: 0, urgent: 0, haute: 1, moyenne: 2, normale: 2, basse: 3 };
      return (rank[String(a.priority || '').toLowerCase()] ?? 99) - (rank[String(b.priority || '').toLowerCase()] ?? 99);
    }
    if (sortMode === 'status') return String(a.status || '').localeCompare(String(b.status || ''));
    return new Date(b.date || 0) - new Date(a.date || 0);
  }), [claims, sortMode]);

  const effectiveTotalItems = totalItems > 0 ? totalItems : filteredClaims.length;
  const effectiveTotalPages = Math.max(1, totalPages > 0 ? totalPages : Math.ceil(filteredClaims.length / itemsPerPage));

  const displayedClaims = useMemo(() => {
    if (totalPages > 0) return filteredClaims;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClaims.slice(start, start + itemsPerPage);
  }, [filteredClaims, totalPages, currentPage, itemsPerPage]);

  const stats = useMemo(() => claims.reduce((acc, c) => {
    const s = String(c.status || '').toLowerCase();
    if (s === 'résolu' || s === 'resolu') acc.resolved++;
    else if (s === 'en cours') acc.inProgress++;
    else if (s === 'ouvert' || s === 'nouveau') acc.open++;
    return acc;
  }, { open: 0, inProgress: 0, resolved: 0 }), [claims]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    if (totalPages > 0) fetchClaims(page, itemsPerPage);
  }, [fetchClaims, itemsPerPage, totalPages]);

  const handleItemsPerPageChange = useCallback((newLimit) => {
    setItemsPerPage(newLimit); setCurrentPage(1);
    if (totalPages > 0) fetchClaims(1, newLimit);
  }, [fetchClaims, totalPages]);

  const clearFilters = useCallback(() => {
    setSearchTerm(''); setStatusFilter('all'); setPriorityFilter('all');
    setTechnicianFilter('all'); setCommercialFilter('all');
    setDateFilter(''); setSortMode('recent'); setCurrentPage(1);
    fetchClaims(1, itemsPerPage);
  }, [fetchClaims, itemsPerPage]);

  const hasFilters = !!(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' ||
    technicianFilter !== 'all' || commercialFilter !== 'all' || dateFilter);

  const pageTitle = isAdmin ? 'Gestion des Réclamations' : isTechnicien ? 'Mes Réclamations' : 'Mes Tickets';
  const pageDesc  = isAdmin ? "Suivez et gérez l'ensemble de vos tickets avec efficacité."
    : isTechnicien ? 'Gérez vos interventions assignées et ajoutez des actions.'
    : 'Suivez les statuts de vos demandes de support.';

  const pageWindow = Array.from({ length: effectiveTotalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === effectiveTotalPages || Math.abs(p - currentPage) <= 1);

  if (loading) return <LoadingSpinner />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
      className="space-y-5 pb-12">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-sky-50/60 to-transparent pointer-events-none rounded-2xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex items-start gap-4 flex-1">
            <div className="h-11 w-11 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center flex-none">
              <LifebuoyIcon className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{pageTitle}</h1>
              <p className="text-sm text-slate-400 mt-1">{pageDesc}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchClaims()}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              title="Actualiser">
              <ArrowPathIcon className="h-4 w-4" />
            </button>
            {(isAdmin || isClient || canAddReclamation) && (
              <button onClick={() => navigate('/claims/new')}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-500 transition-colors shadow-sm">
                <PlusIcon className="h-4 w-4" />
                {isAdmin ? 'Créer un ticket' : 'Signaler un problème'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Ouvertes',  count: stats.open,       icon: ExclamationCircleIcon, iconCls: 'text-sky-500',     iconBg: 'bg-sky-50 border-sky-200' },
          { label: 'En cours',  count: stats.inProgress, icon: WrenchScrewdriverIcon, iconCls: 'text-amber-500',   iconBg: 'bg-amber-50 border-amber-200' },
          { label: 'Résolues',  count: stats.resolved,   icon: CheckCircleIcon,       iconCls: 'text-emerald-500', iconBg: 'bg-emerald-50 border-emerald-200' },
        ].map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default">
            <div className={`h-10 w-10 rounded-xl border flex items-center justify-center flex-none ${k.iconBg}`}>
              <k.icon className={`h-5 w-5 ${k.iconCls}`} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{k.label}</p>
              <p className="text-2xl font-bold text-slate-700 leading-tight">{k.count}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher par ticket, client, objet…"
              className="w-full h-10 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 focus:bg-white placeholder:text-slate-400 transition-all" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status */}
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="h-10 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 text-slate-600 transition-all">
              <option value="all">Tous les statuts</option>
              <option value="Ouvert">Ouvert</option>
              <option value="En cours">En cours</option>
              <option value="Résolu">Résolu</option>
            </select>
            {/* Date */}
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              className="h-10 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 text-slate-600 transition-all" />
            {!isClient && (
              <>
                <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
                  className="h-10 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 text-slate-600 transition-all">
                  <option value="all">Toutes priorités</option>
                  <option value="Urgente">Urgente</option>
                  <option value="Haute">Haute</option>
                  <option value="Normale">Normale</option>
                  <option value="Basse">Basse</option>
                </select>
                {isAdmin && (
                  <select value={technicianFilter} onChange={e => setTechnicianFilter(e.target.value)}
                    className="h-10 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 text-slate-600 transition-all">
                    <option value="all">Tous techniciens</option>
                    {techniciens.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
                <select value={sortMode} onChange={e => setSortMode(e.target.value)}
                  className="h-10 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 text-slate-600 transition-all">
                  <option value="recent">Plus récents</option>
                  <option value="priority">Par priorité</option>
                  <option value="status">Par statut</option>
                </select>
                {!['commercial', 'commerciale'].includes(String(user?.UserRole || '').trim().toLowerCase()) && (
                  <select value={commercialFilter} onChange={e => setCommercialFilter(e.target.value)}
                    className="h-10 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 text-slate-600 transition-all">
                    <option value="all">Tous commerciaux</option>
                    {commercials.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </>
            )}
            {hasFilters && (
              <button onClick={clearFilters}
                className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-400 hover:border-rose-200 transition-all">
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            <span className="font-semibold text-slate-600">{displayedClaims.length}</span>
            {' / '}
            <span className="font-semibold text-slate-600">{effectiveTotalItems}</span>
            {' '}réclamation{effectiveTotalItems !== 1 ? 's' : ''}
            {hasFilters && <span className="ml-1 text-sky-500 font-semibold">(filtrées)</span>}
          </p>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/40">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center">
              <LifebuoyIcon className="h-4 w-4 text-sky-500" />
            </div>
            <span className="text-sm font-semibold text-slate-600">Tickets de support</span>
          </div>
          <span className="text-xs text-slate-400">
            <span className="font-semibold text-slate-600">{effectiveTotalItems}</span> ticket{effectiveTotalItems !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest">N° Ticket</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Objet</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Priorité</th>
                {!isClient && <th className="px-4 py-3.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Technicien</th>}
                <th className="px-4 py-3.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Statut</th>
                <th className="px-4 py-3.5 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Date</th>
                {(isClient || isTechnicien || isAdmin) && (
                  <th className="px-4 py-3.5 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {displayedClaims.length === 0 ? (
                  <tr key="empty">
                    <td colSpan={7} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                          <LifebuoyIcon className="h-7 w-7 text-slate-300" />
                        </div>
                        <p className="text-sm font-semibold text-slate-500">Aucune réclamation trouvée</p>
                        <p className="text-xs text-slate-400">Créez un ticket ou modifiez vos filtres.</p>
                        {hasFilters && (
                          <button onClick={clearFilters} className="text-xs text-sky-500 font-semibold hover:underline underline-offset-2">
                            Réinitialiser les filtres
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : displayedClaims.map((claim, idx) => {
                  const pCfg = getPriorityCfg(claim.priority);
                  const sCfg = getStatusCfg(claim.status);
                  return (
                    <motion.tr key={claim.id}
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }} transition={{ duration: 0.15, delay: idx * 0.025 }}
                      className="group cursor-pointer transition-colors duration-150"
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = sCfg.row; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; }}
                      onClick={() => navigate(`/claims/${claim.id}`)}>

                      {/* Ticket */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200">
                          {claim.ticket}
                        </span>
                      </td>

                      {/* Objet */}
                      <td className="px-4 py-4">
                        <div className="text-xs font-semibold text-slate-700 truncate max-w-xs" title={claim.object}>
                          {claim.object}
                        </div>
                        {claim.client && !isClient && (
                          <div className="text-[10px] text-slate-400 mt-0.5">{claim.client}</div>
                        )}
                      </td>

                      {/* Priorité */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${pCfg.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${pCfg.dot} flex-none`} />
                          {claim.priority}
                        </span>
                      </td>

                      {/* Technicien (admin only) */}
                      {isAdmin && (
                        <td className="px-4 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs text-slate-600 font-medium">{claim.assignedTo}</span>
                            <select value="" disabled={
                              assigningId === claim.id || techniciens.length === 0 ||
                              ['résolu', 'resolu', 'fermé', 'ferme'].includes(String(claim.status || '').toLowerCase())
                            }
                              onChange={e => { handleAssignTechnician(claim.id, e.target.value); e.target.value = ''; }}
                              className="text-xs h-7 px-2 border border-slate-200 rounded-lg bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 transition-all disabled:opacity-50">
                              <option value="" disabled>
                                {assigningId === claim.id ? 'En cours…'
                                  : ['résolu', 'resolu', 'fermé', 'ferme'].includes(String(claim.status || '').toLowerCase())
                                    ? 'Clôturé' : 'Affecter…'}
                              </option>
                              {techniciens.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                          </div>
                        </td>
                      )}
                      {!isAdmin && !isClient && (
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-xs text-slate-500">{claim.assignedTo}</span>
                        </td>
                      )}

                      {/* Statut */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${sCfg.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sCfg.dot} flex-none`} />
                          {claim.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <span className="text-xs text-slate-500 tabular-nums">{formatDate(claim.date)}</span>
                      </td>

                      {/* Actions */}
                      {(isClient || isTechnicien || isAdmin) && (
                        <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => navigate(`/claims/${claim.id}`)}
                              className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-all shadow-sm"
                              title="Voir le détail">
                              <EyeIcon className="h-3.5 w-3.5" />
                            </button>
                            {isTechnicien && !['résolu', 'resolu', 'fermé', 'ferme'].includes(String(claim.status || '').toLowerCase()) && (
                              <button onClick={() => navigate(`/claims/${claim.id}/intervention/new`)}
                                className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                                title="Ajouter une intervention">
                                <PlusIcon className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {isAdmin && (
                              <button onClick={() => setDeleteConfirm(claim.id)} disabled={deletingId === claim.id}
                                className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm disabled:opacity-40"
                                title="Supprimer">
                                <TrashIcon className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {effectiveTotalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-xs text-slate-400">
                Page <span className="font-semibold text-slate-600">{currentPage}</span> / <span className="font-semibold text-slate-600">{effectiveTotalPages}</span>
                {' — '}
                <span className="font-semibold text-slate-600">{effectiveTotalItems}</span> total
              </p>
              <select value={itemsPerPage} onChange={e => handleItemsPerPageChange(Number(e.target.value))}
                className="h-7 px-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 text-slate-600 transition-all">
                {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <button disabled={currentPage <= 1} onClick={() => handlePageChange(currentPage - 1)}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              {pageWindow.map((p, i, arr) => (
                <span key={p} className="flex items-center gap-1.5">
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="text-slate-300 text-xs select-none">…</span>}
                  <button onClick={() => handlePageChange(p)}
                    className={`h-8 min-w-[2rem] px-2 rounded-lg text-xs font-medium transition-all ${
                      currentPage === p
                        ? 'bg-sky-600 text-white'
                        : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}>{p}</button>
                </span>
              ))}
              <button disabled={currentPage >= effectiveTotalPages} onClick={() => handlePageChange(currentPage + 1)}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center flex-none">
                    <ExclamationCircleIcon className="h-5 w-5 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Supprimer la réclamation ?</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Cette action est irréversible</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-5">
                  Êtes-vous sûr de vouloir supprimer le ticket{' '}
                  <span className="font-bold text-slate-700">
                    {claims.find(c => c.id === deleteConfirm)?.ticket || deleteConfirm}
                  </span> ? Toutes les interventions associées seront supprimées.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirm(null)}
                    className="flex-1 h-10 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all">
                    Annuler
                  </button>
                  <button onClick={() => handleDeleteClaim(deleteConfirm)} disabled={deletingId === deleteConfirm}
                    className="flex-1 h-10 bg-rose-500 text-white rounded-xl text-sm font-semibold hover:bg-rose-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                    {deletingId === deleteConfirm
                      ? <><ArrowPathIcon className="h-4 w-4 animate-spin" /> Suppression…</>
                      : <><TrashIcon className="h-4 w-4" /> Supprimer</>}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ClaimsList;
