import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../app/axios';
import {
  PlusIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  PencilSquareIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  EyeIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  UsersIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';

const UsersList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchUsers = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const response = await axios.get('/users');
      if (response.status === 'success' && Array.isArray(response.data)) {
        const mappedUsers = response.data.map(user => ({
          id: user.UserID,
          name: user.FullName || 'Utilisateur sans nom',
          login: user.LoginName || '',
          email: user.EmailPro || 'Non spécifié',
          role: user.UserRole || 'Rôle non défini',
          status: (user.IsActive === true || user.IsActive === 1) ? 'Actif' : 'Inactif',
          dept: user.Departement || 'Non assigné'
        }));
        setUsers(mappedUsers);
      }
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

      const matchesStatus = statusFilter === 'All' || user.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'Actif').length,
      admins: users.filter(u => u.role === 'Administrateur').length
    };
  }, [users]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-primary">
              <SparklesIcon className="h-3 w-3 mr-1" />
              Gestion RH
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Utilisateurs</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Gérez vos collaborateurs et leurs privilèges d'accès
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchUsers(true)}
            className={`p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-all shadow-soft ${refreshing ? 'animate-spin' : ''}`}
            title="Rafraîchir"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate('/users/new')}
            className="btn-soft-primary flex items-center gap-2"
          >
            <UserPlusIcon className="h-4 w-4" />
            Nouveau Membre
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-luxury p-0 overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Membres</p>
              <p className="text-2xl font-extrabold text-slate-800 flex items-baseline gap-2">
                {stats.total}
                <span className="text-xs text-emerald-500 font-bold">+12%</span>
              </p>
            </div>
            <div className="icon-shape shadow-glow-blue">
              <UsersIcon className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="h-1 bg-gradient-blue"></div>
        </div>

        <div className="card-luxury p-0 overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Comptes Actifs</p>
              <p className="text-2xl font-extrabold text-slate-800 flex items-baseline gap-2">
                {stats.active}
                <span className="text-xs text-emerald-500 font-bold">Live</span>
              </p>
            </div>
            <div className="icon-shape shadow-soft" style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }}>
              <CheckBadgeIcon className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="h-1 bg-gradient-success"></div>
        </div>

        <div className="card-luxury p-0 overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Administrateurs</p>
              <p className="text-2xl font-extrabold text-slate-800">
                {stats.admins}
              </p>
            </div>
            <div className="icon-shape shadow-soft" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)' }}>
              <ShieldCheckIcon className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="h-1" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)' }}></div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card-luxury p-0 overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-11"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-modern w-full md:w-48"
            >
              <option value="All">Tous les statuts</option>
              <option value="Actif">Actifs uniquement</option>
              <option value="Inactif">Inactifs uniquement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card-luxury p-0 overflow-hidden">
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
                  <td colSpan="4" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                        <UsersIcon className="h-8 w-8" />
                      </div>
                      <p className="text-slate-500 font-medium">Aucun utilisateur trouvé</p>
                      <button
                        onClick={() => navigate('/users/new')}
                        className="btn-soft-primary text-xs"
                      >
                        Ajouter un utilisateur
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-blue-50/30 transition-all">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-blue flex items-center justify-center font-bold text-white shadow-glow-blue transform transition-transform group-hover:scale-105">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 mb-0.5 group-hover:text-blue-600 transition-colors">{user.name}</p>
                          <p className="text-xs font-medium text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-1">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${user.role === 'Admin'
                          ? 'bg-purple-100 text-purple-700'
                          : user.role === 'Commercial'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                          }`}>
                          {user.role}
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
                          className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
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
        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100/50 text-xs font-medium text-slate-500 flex justify-between items-center">
          <span>Affichage de {filteredUsers.length} sur {users.length} membres</span>
          <span className="text-slate-400">NexusCRM v2.0</span>
        </div>
      </div>
    </div>
  );
};

export default UsersList;
