import { useState, useEffect, useMemo, forwardRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../../app/axios';
import {
  UserPlusIcon, ShieldCheckIcon, PencilSquareIcon,
  EyeIcon, TrashIcon, MagnifyingGlassIcon,
  ArrowPathIcon, UsersIcon, CheckBadgeIcon,
  ArrowDownTrayIcon, XMarkIcon, EnvelopeIcon,
  KeyIcon, MapPinIcon, BriefcaseIcon, AtSymbolIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import { getWhatsAppLink } from '../../utils/format';

/* ── Role config for panel ── */
const ROLE_CFG = {
  'Administrateur': 'bg-violet-50 text-violet-700 border-violet-200',
  'Admin':          'bg-violet-50 text-violet-700 border-violet-200',
  'Commercial':     'bg-[#e0f0ff] text-[#0062AF] border-blue-200',
  'Technicien':     'bg-amber-50 text-amber-700 border-amber-200',
  'Agent':          'bg-teal-50 text-teal-700 border-teal-200',
  'Client':         'bg-slate-100 text-slate-600 border-slate-200',
};
const getInitialsFull = (name = '') =>
  name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

/* ── User Detail Modal (centered) ── */
const UserDetailPanel = ({ userId, onClose, onEdit }) => {
  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [resending, setResending] = useState(false);
  const [imgError, setImgError]   = useState(false);
  const [gouvernorats, setGouvernorats] = useState([]);
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [userRes, govRes] = await Promise.all([
        axios.get(`/users/${userId}`),
        axios.get('/tiers-gouvernorats').catch(() => ({ data: [] })),
      ]);
      if (userRes.status === 'success') setUser(userRes.data);
      const govList = govRes.data?.data || govRes.data || [];
      setGouvernorats(Array.isArray(govList) ? govList : []);
    } catch { toast.error("Impossible de charger les détails"); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { fetchUser(); setImgError(false); }, [fetchUser]);

  const getGouvernoratName = (id) => {
    if (!id) return null;
    const found = gouvernorats.find(g => String(g.id) === String(id) || String(g.ID) === String(id));
    return found?.libelle || found?.Libelle || found?.nom || found?.Nom || null;
  };

  const handleResend = async () => {
    if (!user?.EmailPro) return;
    if (!window.confirm(`Générer un nouveau mot de passe et l'envoyer à ${user.EmailPro} ?`)) return;
    setResending(true);
    try {
      await axios.post(`/users/${user.UserID}/resend-credentials`);
      toast.success('Nouveaux identifiants envoyés par email');
    } catch (err) { toast.error(err.response?.data?.message || "Erreur lors de l'envoi"); }
    finally { setResending(false); }
  };

  const initials  = user ? getInitialsFull(user.FullName) : '?';
  const isActive  = user?.IsActive;
  const roleStyle = user ? (ROLE_CFG[user.UserRole] || 'bg-slate-100 text-slate-600 border-slate-200') : '';

  const govName = user ? (getGouvernoratName(user.Gouvernorat) || user.Gouvernorat) : null;

  const InfoRow = ({ label, value, accent = false, mono = false }) => (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.1em] mb-1">{label}</p>
      <p className={`text-[14px] font-medium leading-snug truncate ${accent ? 'text-[#0062AF]' : 'text-slate-700'} ${mono ? 'font-mono text-[13px]' : ''}`}>
        {value || <span className="text-slate-300 font-normal font-sans">—</span>}
      </p>
    </div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', damping: 28, stiffness: 340 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm max-h-[92vh] overflow-hidden flex flex-col"
        >

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 flex-none">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-[#e0f0ff] flex items-center justify-center">
                <UsersIcon className="h-3.5 w-3.5 text-[#0062AF]" />
              </div>
              <span className="text-xs font-bold text-slate-700">Profil utilisateur</span>
            </div>
            <button onClick={onClose}
              className="h-7 w-7 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all">
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
              <div className="relative h-9 w-9">
                <div className="absolute inset-0 rounded-full border-[3px] border-slate-100" />
                <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#0062AF] animate-spin" />
              </div>
              <p className="text-xs text-slate-400 font-medium">Chargement…</p>
            </div>
          ) : !user ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-16">
              <p className="text-sm text-slate-400">Utilisateur introuvable</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">

              {/* ── Avatar + Identity ── */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-shrink-0">
                    {user.PhotoProfil && !imgError ? (
                      <img src={user.PhotoProfil} alt={user.FullName} onError={() => setImgError(true)}
                        className="h-16 w-16 rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm" />
                    ) : (
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#0062AF] to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
                        <span className="text-xl font-black text-white select-none tracking-tight">{initials}</span>
                      </div>
                    )}
                    <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white shadow ${isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-[17px] font-black text-slate-900 truncate leading-tight">{user.FullName}</h2>
                    {user.EmailPro && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">{user.EmailPro}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {user.UserRole && (
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${roleStyle}`}>
                          {user.UserRole}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`} />
                        {isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Modifier button */}
                <button onClick={() => { onClose(); navigate(`/users/edit/${user.UserID}`); }}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-[#0062AF] hover:bg-[#004a85] text-white text-sm font-bold transition-all shadow-md shadow-blue-500/25 active:scale-[0.98]">
                  <PencilSquareIcon className="h-4 w-4" />
                  Modifier le profil
                </button>
              </div>

              {/* ── Info fields ── */}
              <div className="px-5 py-1 border-t border-slate-100">
                <InfoRow label="Email"       value={user.EmailPro}    accent />
                <InfoRow label="Identifiant" value={user.LoginName ? `@${user.LoginName}` : null} mono />
                <InfoRow label="Gouvernorat" value={govName} />
                <div className="grid grid-cols-2 gap-x-4">
                  <InfoRow label="Département" value={user.Departement} />
                  <InfoRow label="Poste"       value={user.PosteOccupe} />
                </div>
              </div>

              {/* ── Status + Actions ── */}
              <div className="px-5 pt-3 pb-5 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`} />
                    {isActive ? 'Compte actif' : 'Compte inactif'}
                  </div>
                  {user.EmailPro && (
                    <button onClick={handleResend} disabled={resending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-500 text-xs font-semibold transition-all disabled:opacity-50 shadow-sm">
                      {resending
                        ? <div className="h-3.5 w-3.5 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
                        : <KeyIcon className="h-3.5 w-3.5" />}
                      Renvoyer mdp
                    </button>
                  )}
                </div>

                {user.EmailPro && (
                  <button onClick={() => { onClose(); navigate('/messages', { state: { composeTo: user.EmailPro } }); }}
                    className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-semibold transition-all">
                    <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                    Envoyer un email
                  </button>
                )}
              </div>

            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};

/* ── Role config ── */
const ROLES = {
  Admin:      { label: 'Administrateur', badge: 'bg-slate-100 text-slate-700 border border-slate-200', dot: 'bg-[#0062AF]'    },
  Commercial: { label: 'Commercial',     badge: 'bg-slate-100 text-slate-700 border border-slate-200', dot: 'bg-[#0062AF]'    },
  Agent:      { label: 'Agent',          badge: 'bg-slate-100 text-slate-700 border border-slate-200', dot: 'bg-[#0062AF]'    },
  Technicien: { label: 'Technicien',     badge: 'bg-slate-100 text-slate-700 border border-slate-200', dot: 'bg-[#0062AF]'    },
  Client:     { label: 'Client',         badge: 'bg-slate-100 text-slate-700 border border-slate-200', dot: 'bg-[#0062AF]'    },
};
const KNOWN_ROLES = ['Admin', 'Commercial', 'Agent', 'Technicien', 'Client'];

const normalizeRole = (role) => {
  const r = String(role || '').trim().toLowerCase();
  if (['admin', 'administrateur'].includes(r)) return 'Admin';
  if (['commercial', 'commerciale'].includes(r)) return 'Commercial';
  if (r === 'agent') return 'Agent';
  if (['technicien', 'technicien sav'].includes(r)) return 'Technicien';
  if (r === 'client') return 'Client';
  return 'Non défini';
};

/* ── Avatar initials ── */
const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

/* ── Row component — forwardRef required by AnimatePresence popLayout ── */
const UserRow = forwardRef(({ user, onView, onEdit, onDelete, index }, ref) => {
  const role     = ROLES[user.role];
  const initials = getInitials(user.name);
  const grad      = 'from-[#0062AF] to-sky-500';
  const accentBar = 'bg-[#0062AF]';
  const isActive  = user.status === 'Actif';

  return (
    <motion.tr
      ref={ref}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, delay: index * 0.03 }}
      className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-all cursor-pointer relative"
      onClick={() => onView(user.id)}
    >
      {/* Left accent bar on hover */}
      <td className="w-0 p-0">
        <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${accentBar} opacity-0 group-hover:opacity-100 transition-opacity rounded-r-full`} />
      </td>

      {/* Collaborateur */}
      <td className="pl-6 pr-4 py-3.5">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}>
            {initials}
          </div>
          {/* Info */}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate leading-tight group-hover:text-[#0062AF] transition-colors">
              {user.name}
            </p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">{user.email || '—'}</p>
          </div>
        </div>
      </td>

      {/* Rôle */}
      <td className="px-4 py-3.5">
        {role ? (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${role.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${role.dot}`} />
            {role.label}
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic">—</span>
        )}
      </td>

      {/* Département */}
      <td className="px-4 py-3.5 hidden lg:table-cell">
        {user.dept !== 'Non assigne'
          ? <span className="text-xs text-slate-600 font-medium bg-slate-100 px-2.5 py-1 rounded-lg">{user.dept}</span>
          : <span className="text-slate-300 text-xs">—</span>
        }
      </td>

      {/* Statut */}
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
          isActive
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-slate-100 text-slate-500 border border-slate-200'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
          {user.status}
        </span>
      </td>

      {/* Actions */}
      <td className="pr-5 pl-4 py-3.5" onClick={e => e.stopPropagation()}>
        <div className="flex justify-end items-center gap-1">
          <button onClick={() => onView(user.id)}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-[#0062AF] hover:bg-blue-50 hover:border hover:border-blue-200 transition-all"
            title="Voir">
            <EyeIcon className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onEdit(user.id)}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-amber-600 hover:bg-amber-50 hover:border hover:border-amber-200 transition-all"
            title="Modifier">
            <PencilSquareIcon className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(user.id)}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 hover:border hover:border-rose-200 transition-all"
            title="Supprimer">
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
});

/* ══ Main ══ */
const UsersList = () => {
  const navigate = useNavigate();
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [users, setUsers]               = useState([]);
  const [searchTerm, setSearchTerm]     = useState('');
  const [roleFilter, setRoleFilter]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage]   = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const ITEMS = 12;

  const fetchUsers = async (showSpin = false) => {
    if (showSpin) setRefreshing(true);
    try {
      const res = await axios.get('/users?limit=10000');
      const raw = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setUsers(raw.map(u => ({
        id:     u.UserID,
        name:   u.FullName || 'Utilisateur',
        login:  u.LoginName || '',
        email:  u.EmailPro || '',
        role:   normalizeRole(u.UserRole),
        status: (u.IsActive === true || u.IsActive === 1 || String(u.IsActive) === 'true') ? 'Actif' : 'Inactif',
        dept:   u.Departement || 'Non assigne',
      })));
    } catch {
      toast.error('Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ? Cette action est irréversible.')) return;
    try {
      await axios.delete(`/users/${id}`);
      setUsers(p => p.filter(u => u.id !== id));
      toast.success('Utilisateur supprimé');
    } catch { toast.error('Erreur lors de la suppression'); }
  };

  const exportCSV = () => {
    const headers = ['Nom', 'Login', 'Email', 'Rôle', 'Département', 'Statut'];
    const rows = filteredUsers.map(u => [u.name, u.login, u.email, u.role, u.dept, u.status]);
    const blob = new Blob([[headers, ...rows].map(r => r.join(';')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Export CSV réussi');
  };

  /* ── Filtered list ── */
  const filteredUsers = useMemo(() => users.filter(u => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.login.toLowerCase().includes(q);
    const matchRole   = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  }), [users, searchTerm, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS));
  const paginated  = useMemo(() => filteredUsers.slice((currentPage - 1) * ITEMS, currentPage * ITEMS), [filteredUsers, currentPage]);

  useEffect(() => setCurrentPage(1), [searchTerm, roleFilter, statusFilter]);

  /* ── Stats ── */
  const stats = useMemo(() => ({
    total:    users.length,
    active:   users.filter(u => u.status === 'Actif').length,
    inactive: users.filter(u => u.status === 'Inactif').length,
    admins:   users.filter(u => u.role === 'Admin').length,
  }), [users]);

  /* ── Role pill counts ── */
  const roleCounts = useMemo(() => {
    const counts = { all: users.length };
    KNOWN_ROLES.forEach(r => { counts[r] = users.filter(u => u.role === r).length; });
    return counts;
  }, [users]);

  if (loading) return <LoadingSpinner />;

  const hasFilters = roleFilter !== 'all' || statusFilter !== 'all' || searchTerm;

  return (
    <div className="animate-fade-in space-y-5 pb-12">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0062AF] via-sky-400 to-teal-400" />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#0062AF]/4 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 bottom-0 w-48 h-48 bg-sky-400/4 rounded-full blur-3xl pointer-events-none" />

        <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#0062AF] to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Gestion des Collaborateurs</h1>
              <p className="text-sm text-slate-400 font-medium mt-0.5">
                {stats.total} utilisateurs · {stats.active} actifs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => fetchUsers(true)} disabled={refreshing}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50">
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={exportCSV}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-slate-50 transition-all shadow-sm">
              <ArrowDownTrayIcon className="h-4 w-4 text-emerald-500" /> CSV
            </button>
            <button onClick={() => navigate('/users/new')}
              className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-[#0062AF] hover:bg-[#004a85] text-white text-sm font-semibold transition-all shadow-md shadow-blue-500/20 active:scale-95">
              <UserPlusIcon className="h-4 w-4" />
              Nouveau collaborateur
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',    value: stats.total,    sub: 'enregistrés',    icon: UsersIcon,       accent: 'from-[#0062AF] to-sky-500',       bg: 'bg-blue-50',    text: 'text-[#0062AF]'    },
          { label: 'Actifs',   value: stats.active,   sub: `${stats.total > 0 ? Math.round(stats.active / stats.total * 100) : 0}%`, icon: CheckBadgeIcon, accent: 'from-emerald-500 to-teal-400', bg: 'bg-emerald-50', text: 'text-emerald-600' },
          { label: 'Inactifs', value: stats.inactive, sub: 'comptes',         icon: UsersIcon,       accent: 'from-slate-400 to-slate-500',     bg: 'bg-slate-100',  text: 'text-slate-600'    },
          { label: 'Admins',   value: stats.admins,   sub: 'administrateurs', icon: ShieldCheckIcon, accent: 'from-sky-500 to-teal-400',       bg: 'bg-sky-50',     text: 'text-sky-600'      },
        ].map((s, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
            className="relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${s.accent}`} />
            <div className="p-4 pt-5 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{s.label}</p>
                <p className={`text-2xl font-black leading-none tabular-nums ${s.text}`}>{s.value}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">{s.sub}</p>
              </div>
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.text}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">

        {/* Search + status */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, email, login…"
              className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#0062AF]/50 focus:ring-2 focus:ring-[#0062AF]/8 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-[#0062AF]/50 focus:ring-2 focus:ring-[#0062AF]/8 transition-all">
            <option value="all">Tous les statuts</option>
            <option value="Actif">Actifs uniquement</option>
            <option value="Inactif">Inactifs uniquement</option>
          </select>
        </div>

        {/* Role pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { key: 'all', label: 'Tous' },
            ...KNOWN_ROLES.map(r => ({ key: r, label: ROLES[r]?.label || r })),
          ].map(pill => {
            const active = roleFilter === pill.key;
            const count  = roleCounts[pill.key] ?? 0;
            const role   = ROLES[pill.key];
            return (
              <button key={pill.key} onClick={() => setRoleFilter(pill.key)}
                className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-semibold border transition-all ${
                  active
                    ? pill.key === 'all'
                      ? 'bg-[#0062AF] text-white border-[#0062AF]'
                      : `${role?.badge || 'bg-slate-100 text-slate-600 border-slate-200'} shadow-sm`
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}>
                {active && pill.key !== 'all' && (
                  <span className={`h-1.5 w-1.5 rounded-full ${role?.dot || 'bg-slate-400'}`} />
                )}
                {pill.label}
                <span className={`text-[10px] font-bold opacity-60`}>{count}</span>
              </button>
            );
          })}

          {hasFilters && (
            <button onClick={() => { setSearchTerm(''); setRoleFilter('all'); setStatusFilter('all'); }}
              className="inline-flex items-center gap-1 h-7 px-3 rounded-full text-xs font-semibold border border-rose-200 text-rose-500 bg-rose-50 hover:bg-rose-100 transition-all ml-1">
              <XMarkIcon className="h-3 w-3" /> Effacer
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Table header bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50/40">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-700">Collaborateurs</span>
          </div>
          <span className="text-xs text-slate-400">
            <span className="font-semibold text-slate-600">{filteredUsers.length}</span> résultat{filteredUsers.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="w-0 p-0" />
                <th className="pl-6 pr-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">Collaborateur</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">Rôle</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left hidden lg:table-cell">Département</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">Statut</th>
                <th className="pr-5 pl-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {paginated.length === 0 ? (
                  <tr key="empty">
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                          <UsersIcon className="h-7 w-7 text-slate-300" />
                        </div>
                        <p className="text-sm font-semibold text-slate-500">Aucun utilisateur trouvé</p>
                        {hasFilters && (
                          <button onClick={() => { setSearchTerm(''); setRoleFilter('all'); setStatusFilter('all'); }}
                            className="text-xs text-[#0062AF] font-semibold hover:underline">
                            Réinitialiser les filtres
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : paginated.map((user, idx) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    index={idx}
                    onView={id => setSelectedUserId(id)}
                    onEdit={id => navigate(`/users/edit/${id}`)}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/30">
            <p className="text-xs text-slate-400">
              Page <span className="font-semibold text-slate-600">{currentPage}</span> sur <span className="font-semibold text-slate-600">{totalPages}</span>
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold">
                ‹
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p;
                if (totalPages <= 7) p = i + 1;
                else if (currentPage <= 4) p = i + 1;
                else if (currentPage >= totalPages - 3) p = totalPages - 6 + i;
                else p = currentPage - 3 + i;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button key={p} onClick={() => setCurrentPage(p)}
                    className={`h-7 w-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                      p === currentPage
                        ? 'bg-[#0062AF] text-white shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold">
                ›
              </button>
            </div>
          </div>
        )}

        {/* Footer count */}
        <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/30 text-xs text-slate-400 font-medium">
          Affichage de {paginated.length} sur {filteredUsers.length} utilisateurs filtrés ({users.length} au total)
        </div>
      </div>
      {/* ── User Detail Side Panel ── */}
      <AnimatePresence>
        {selectedUserId && (
          <UserDetailPanel
            userId={selectedUserId}
            onClose={() => setSelectedUserId(null)}
            onEdit={id => navigate(`/users/edit/${id}`)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersList;
