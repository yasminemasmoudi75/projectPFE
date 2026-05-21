import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../app/axios';
import {
  PlusIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  PencilSquareIcon,
  EyeIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  UsersIcon,
  CheckBadgeIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';

// Normalise la valeur brute de UserRole en une étiquette cohérente.
// Le backend peut retourner 'Commerciale', 'commercial', 'Agent', etc.
const normalizeRoleDisplay = (role) => {
  const r = String(role || '').trim().toLowerCase();
  if (['admin', 'administrateur'].includes(r)) return 'Admin';
  if (['commercial', 'commerciale'].includes(r)) return 'Commercial';
  if (['agent'].includes(r)) return 'Agent';
  if (['technicien', 'technicien sav'].includes(r)) return 'Technicien';
  if (['client'].includes(r)) return 'Client';
  if (!role || r === 'user' || r === 'utilisateur') return 'Non défini';
  return String(role).trim();
};

const ROLE_BADGE = {
  Admin:       'bg-violet-100 text-violet-700',
  Commercial:  'bg-sky-100    text-sky-700',
  Agent:       'bg-emerald-100 text-emerald-700',
  Technicien:  'bg-amber-100  text-amber-700',
  Client:      'bg-rose-100   text-rose-700',
};

const ROLE_DISPLAY_LABEL = {
  Admin:      'Administrateur',
  Commercial: 'Commercial',
  Agent:      'Agent',
  Technicien: 'Technicien',
  Client:     'Client',
};

const KNOWN_ROLES = ['Admin', 'Agent', 'Commercial', 'Technicien', 'Client'];

const UsersList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchUsers = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const response = await axios.get('/users?limit=10000');
      const usersPayload = Array.isArray(response?.data)
        ? response.data
        : (Array.isArray(response) ? response : []);

      const mappedUsers = usersPayload.map((user) => ({
        id: user.UserID,
        name: user.FullName || 'Utilisateur sans nom',
        login: user.LoginName || '',
        email: user.EmailPro || 'Non specifie',
        role: normalizeRoleDisplay(user.UserRole),
        status: (user.IsActive === true || user.IsActive === 1 || String(user.IsActive) === 'true') ? 'Actif' : 'Inactif',
        dept: user.Departement || 'Non assigne'
      }));

      setUsers(mappedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Impossible de charger la liste des utilisateurs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      try {
        await axios.delete(`/users/${userId}`);
        setUsers(users.filter(user => user.id !== userId));
        toast.success('Utilisateur supprimé avec succès');
      } catch (err) {
        console.error('Error deleting user:', err);
        toast.error('Erreur lors de la suppression de l\'utilisateur');
      }
    }
  };

  // Filter and Search Logic
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.login.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !statusFilter || user.status === statusFilter;
      const matchesRole = !roleFilter || user.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchTerm, statusFilter, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'Actif').length,
      agents: users.filter(u => u.role === 'Agent').length,
      admins: users.filter(u => u.role === 'Admin').length,
    };
  }, [users]);

  // Export functions
  const exportToCSV = () => {
    const headers = ['Nom', 'Login', 'Email', 'Rôle', 'Département', 'Statut'];
    const rows = filteredUsers.map(u => [
      u.name || '',
      u.login || '',
      u.email || '',
      u.role || '',
      u.dept || '',
      u.status
    ]);
    
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `utilisateurs_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Export CSV réussi');
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    const html = `
      <html>
        <head>
          <title>Liste des Utilisateurs</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background: #3b82f6; color: white; }
            tr:nth-child(even) { background: #f8fafc; }
            .header { margin-bottom: 20px; }
            .header h1 { color: #1e293b; margin: 0; }
            .header p { color: #64748b; margin: 5px 0; }
            .badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
            .badge-active { background: #d1fae5; color: #065f46; }
            .badge-inactive { background: #f1f5f9; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Liste des Utilisateurs</h1>
            <p>Exporté le ${new Date().toLocaleDateString('fr-FR')} - ${filteredUsers.length} utilisateurs</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Login</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              ${filteredUsers.map(u => {
                const statusClass = u.status === 'Actif' ? 'badge-active' : 'badge-inactive';
                return `
                  <tr>
                    <td>${u.name}</td>
                    <td>${u.login}</td>
                    <td>${u.email}</td>
                    <td>${u.role}</td>
                    <td><span class="badge ${statusClass}">${u.status}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  // Rôles présents dans les données + rôles connus non encore présents
  const uniqueRoles = useMemo(() => {
    const fromData = new Set(users.map(u => u.role).filter(r => r && r !== 'Non défini'));
    return [...new Set([...KNOWN_ROLES, ...fromData])].sort();
  }, [users]);

  const activeFilterCount = [statusFilter, roleFilter].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* Header - Modern Design */}
      <div className="card-luxury p-8 bg-gradient-to-r from-sky-50 via-white to-violet-50 border-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-600 text-xs font-medium mb-3">
              <ShieldCheckIcon className="h-3 w-3" />
              Administration
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Gestion des Utilisateurs</h1>
            <p className="text-slate-600 mt-1 flex items-center gap-2 text-sm">
              <UsersIcon className="h-4 w-4 text-sky-500" />
              Gérez vos collaborateurs et leurs privilèges d'accès
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchUsers(true)}
              className={`p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all ${refreshing ? 'animate-spin' : ''}`}
              title="Rafraîchir"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            
            {/* Export Buttons */}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100 transition-colors"
              title="Exporter en CSV"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium hover:bg-rose-100 transition-colors"
              title="Imprimer / PDF"
            >
              <PrinterIcon className="h-5 w-5" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            
            <button
              onClick={() => navigate('/users/new')}
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl shadow-md shadow-sky-200/50 transition-all flex items-center gap-2 font-medium"
            >
              <UserPlusIcon className="h-4 w-4" />
              Nouvel Utilisateur
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Utilisateurs', value: stats.total, sub: 'utilisateurs enregistrés', icon: UsersIcon, color: 'sky' },
          { label: 'Comptes Actifs', value: stats.active, sub: `${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% actifs`, icon: CheckBadgeIcon, color: 'emerald' },
          { label: 'Agents', value: stats.agents, sub: `${stats.admins} admin(s)`, icon: ShieldCheckIcon, color: 'violet' },
        ].map((stat, i) => {
          const colorMap = {
            sky: { bg: 'bg-sky-50', text: 'text-sky-500', bar: 'bg-sky-400' },
            emerald: { bg: 'bg-emerald-50', text: 'text-emerald-500', bar: 'bg-emerald-400' },
            violet: { bg: 'bg-violet-50', text: 'text-violet-500', bar: 'bg-violet-400' },
          };
          const colors = colorMap[stat.color];
          return (
            <div key={i} className="card-luxury shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                    <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                    <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
                  </div>
                  <div className={`${colors.bg} p-2.5 rounded-xl group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`h-5 w-5 ${colors.text}`} />
                  </div>
                </div>
                <div className={`h-1 ${colors.bar} mt-4 rounded-full`}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters & Search */}
      <div className="card-luxury shadow-sm">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher un utilisateur par nom, login, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${showFilters
                ? 'bg-sky-100 text-sky-700 border border-sky-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-sky-300'
                }`}
            >
              <FunnelIcon className="h-4 w-4" />
              Filtres {hasActiveFilters && <span className="bg-sky-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">{activeFilterCount}</span>}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t border-slate-200 mt-6 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-500 uppercase tracking-wider">Statut</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                >
                  <option value="">Tous les statuts</option>
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                </select>
              </div>

              {/* Role Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-500 uppercase tracking-wider">Rôle</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                >
                  <option value="">Tous les rôles</option>
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>{ROLE_DISPLAY_LABEL[role] || role}</option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <div className="md:col-span-2 flex justify-end">
                  <button
                    onClick={() => {
                      setStatusFilter('');
                      setRoleFilter('');
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="card-luxury p-0 overflow-hidden shadow-sm">
        <div className="px-8 py-5 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-transparent flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Liste des Collaborateurs</h3>
          <span className="text-xs font-medium text-slate-500">{filteredUsers.length} résultats</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/30 text-left border-b border-slate-100/50">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Collaborateur</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rôle & Département</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                        <UsersIcon className="h-8 w-8" />
                      </div>
                      <p className="text-slate-500 font-medium">Aucun utilisateur trouvé</p>
                      <button
                        onClick={() => navigate('/users/new')}
                        className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-sm font-medium transition-all"
                      >
                        Ajouter un utilisateur
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-blue-50/30 transition-all">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-md transform transition-transform group-hover:scale-105">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 mb-0.5 group-hover:text-sky-600 transition-colors">{user.name}</p>
                          <p className="text-xs font-medium text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-1">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${ROLE_BADGE[user.role] || 'bg-slate-100 text-slate-600'}`}>
                          {ROLE_DISPLAY_LABEL[user.role] || user.role}
                        </span>
                        <p className="text-xs font-medium text-slate-500">{user.dept}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${user.status === 'Actif' ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'
                        }`}>
                        <span className={`h-2 w-2 rounded-full ${user.status === 'Actif' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                        {user.status}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => navigate(`/users/${user.id}`)}
                          className="p-2.5 text-slate-400 hover:text-sky-600 hover:bg-sky-100 rounded-xl transition-all"
                          title="Voir le profil"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => navigate(`/users/edit/${user.id}`)}
                          className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-100 rounded-xl transition-all"
                          title="Modifier"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-all"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredUsers.length > 0 && (
          <div className="px-8 py-4 border-t border-slate-100/50 bg-white/70 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span>Éléments par page</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="input-modern py-1.5 px-2 text-xs w-20"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <span className="text-xs font-semibold text-slate-600 min-w-20 text-center">
                Page {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersList;
