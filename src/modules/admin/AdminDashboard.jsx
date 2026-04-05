import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../app/axios';
import useAuth from '../../hooks/useAuth';
import {
  UsersIcon,
  ShieldCheckIcon,
  KeyIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  LockClosedIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    totalModules: 16,
    activeModules: 0,
    recentLogins: []
  });
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState({
    status: 'healthy',
    lastBackup: '2024-01-15 03:00',
    uptime: '99.9%'
  });

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Accès réservé aux administrateurs');
      navigate('/dashboard');
      return;
    }
    fetchAdminData();
  }, [isAdmin, navigate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const usersResponse = await axios.get('/users');
      const users = usersResponse.data || [];
      
      // Fetch permissions
      const permResponse = await axios.get('/permissions/my-permissions');
      const permissions = permResponse.data?.data?.permissions || [];
      
      setStats({
        totalUsers: users.length,
        activeUsers: users.filter(u => u.IsActive || u.isActive).length,
        adminUsers: users.filter(u => 
          u.UserRole?.toLowerCase() === 'admin' || 
          u.role?.toLowerCase() === 'admin'
        ).length,
        totalModules: permissions.length,
        activeModules: permissions.filter(p => p.isActive).length,
        recentLogins: users.slice(0, 5).map(u => ({
          name: u.FullName || u.name,
          time: 'Il y a 2h',
          avatar: u.FullName?.charAt(0) || 'U'
        }))
      });
    } catch (err) {
      console.error('Error fetching admin data:', err);
      toast.error('Erreur lors du chargement des données admin');
    } finally {
      setLoading(false);
    }
  };

  const adminCards = [
    {
      title: 'Gestion Utilisateurs',
      description: 'Créer, modifier, supprimer des utilisateurs',
      icon: UsersIcon,
      color: 'blue',
      stats: `${stats.totalUsers} utilisateurs`,
      path: '/users',
      actions: ['Voir liste', 'Ajouter utilisateur']
    },
    {
      title: 'Gestion Permissions',
      description: 'Configurer les droits d\'accès par module',
      icon: KeyIcon,
      color: 'purple',
      stats: `${stats.activeModules}/${stats.totalModules} modules actifs`,
      path: '/admin/permissions',
      actions: ['Configurer', 'Voir modules']
    },
    {
      title: 'Gestion Rôles',
      description: 'Administer les rôles et profils',
      icon: ShieldCheckIcon,
      color: 'emerald',
      stats: `${stats.adminUsers} admins`,
      path: '/admin/roles',
      actions: ['Gérer rôles', 'Assigner']
    },
    {
      title: 'Statistiques',
      description: 'Analyses et rapports du système',
      icon: ChartBarIcon,
      color: 'amber',
      stats: 'Rapports disponibles',
      path: '/admin/stats',
      actions: ['Voir stats', 'Exporter']
    },
    {
      title: 'Configuration',
      description: 'Paramètres système et maintenance',
      icon: CogIcon,
      color: 'slate',
      stats: 'Système stable',
      path: '/admin/settings',
      actions: ['Configurer', 'Sauvegarder']
    },
    {
      title: 'Notifications',
      description: 'Gérer les alertes et messages',
      icon: BellIcon,
      color: 'rose',
      stats: '3 nouvelles',
      path: '/admin/notifications',
      actions: ['Voir tout', 'Marquer lu']
    }
  ];

  const quickActions = [
    { label: 'Nouvel utilisateur', icon: UserGroupIcon, action: () => navigate('/users/new'), color: 'blue' },
    { label: 'Modifier permissions', icon: LockClosedIcon, action: () => navigate('/admin/permissions'), color: 'purple' },
    { label: 'Voir logs', icon: EyeIcon, action: () => navigate('/admin/logs'), color: 'slate' },
    { label: 'Backup DB', icon: CheckCircleIcon, action: () => toast.success('Backup démarré'), color: 'emerald' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
              <ShieldCheckIcon className="h-6 w-6 text-white" />
            </div>
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider">
              Administration
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Tableau de Bord Admin
          </h1>
          <p className="text-slate-500 mt-1">
            Gérez votre système CRM en toute simplicité
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-600">{user?.FullName}</p>
            <p className="text-xs text-slate-400">Administrateur</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {user?.FullName?.charAt(0) || 'A'}
          </div>
        </div>
      </div>

      {/* System Health Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
            <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-900">Système Opérationnel</h3>
            <p className="text-sm text-emerald-700">
              Uptime: {systemHealth.uptime} | Dernier backup: {systemHealth.lastBackup}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Tous les services fonctionnent normalement
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <UsersIcon className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              +12%
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{stats.totalUsers}</p>
          <p className="text-sm text-slate-500">Utilisateurs totaux</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <UserGroupIcon className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              Actifs
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{stats.activeUsers}</p>
          <p className="text-sm text-slate-500">Utilisateurs actifs</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <ShieldCheckIcon className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{stats.adminUsers}</p>
          <p className="text-sm text-slate-500">Administrateurs</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <KeyIcon className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{stats.activeModules}</p>
          <p className="text-sm text-slate-500">Modules actifs</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.action}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-${action.color}-300 hover:bg-${action.color}-50 transition-all group`}
            >
              <div className={`h-12 w-12 rounded-xl bg-${action.color}-100 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <action.icon className={`h-6 w-6 text-${action.color}-600`} />
              </div>
              <span className="text-sm font-medium text-slate-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Admin Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group cursor-pointer"
            onClick={() => navigate(card.path)}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`h-12 w-12 rounded-xl bg-${card.color}-100 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <card.icon className={`h-6 w-6 text-${card.color}-600`} />
                </div>
                <span className={`text-xs font-bold text-${card.color}-600 bg-${card.color}-50 px-2 py-1 rounded-full`}>
                  {card.stats}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-2">{card.title}</h3>
              <p className="text-sm text-slate-500 mb-4">{card.description}</p>
              
              <div className="flex gap-2">
                {card.actions.map((action, actionIdx) => (
                  <button
                    key={actionIdx}
                    className={`text-xs font-medium text-${card.color}-600 hover:text-${card.color}-700 hover:underline`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(card.path);
                    }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
            <div className={`h-1 bg-gradient-to-r from-${card.color}-400 to-${card.color}-600 rounded-b-2xl`}></div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Connexions Récentes</h3>
            <button className="text-sm text-blue-600 hover:underline">Voir tout</button>
          </div>
          <div className="space-y-4">
            {stats.recentLogins.map((login, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {login.avatar}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{login.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    {login.time}
                  </p>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Alertes Système</h3>
            <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
              3 actives
            </span>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Mise à jour recommandée</p>
                <p className="text-sm text-amber-700">Une nouvelle version est disponible</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Pic d\'activité</p>
                <p className="text-sm text-blue-700">Traffic élevé détecté aujourd\'hui</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <CheckCircleIcon className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-emerald-900">Backup réussi</p>
                <p className="text-sm text-emerald-700">Sauvegarde automatique complétée</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
