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
  ClockIcon,
  ArrowRightIcon,
  SparklesIcon,
  ServerIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AdminDashboardPro = () => {
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
      
      const usersResponse = await axios.get('/users');
      const users = usersResponse.data || [];
      
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

  const statCards = [
    {
      title: 'Utilisateurs Totaux',
      value: stats.totalUsers,
      change: '+12%',
      icon: UsersIcon,
      color: 'from-blue-600 to-blue-700',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      description: 'Tous les utilisateurs actifs et inactifs'
    },
    {
      title: 'Utilisateurs Actifs',
      value: stats.activeUsers,
      change: '+8%',
      icon: UserGroupIcon,
      color: 'from-emerald-600 to-emerald-700',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      description: 'Actuellement connectés'
    },
    {
      title: 'Administrateurs',
      value: stats.adminUsers,
      change: 'Stable',
      icon: ShieldCheckIcon,
      color: 'from-purple-600 to-purple-700',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      description: 'Comptes administrateur'
    },
    {
      title: 'Modules Actifs',
      value: `${stats.activeModules}/${stats.totalModules}`,
      change: 'OK',
      icon: KeyIcon,
      color: 'from-amber-600 to-amber-700',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      description: 'Modules disponibles'
    }
  ];

  const adminSections = [
    {
      title: 'Gestion Utilisateurs',
      description: 'Créer, modifier et gérer les comptes',
      icon: UsersIcon,
      color: 'blue',
      path: '/users',
      features: ['Créer utilisateur', 'Modifier rôles', 'Activer/Désactiver'],
      badge: `${stats.totalUsers} actifs`
    },
    {
      title: 'Gestion Permissions',
      description: 'Configurer les droits d\'accès par module',
      icon: KeyIcon,
      color: 'purple',
      path: '/admin/permissions',
      features: ['Par rôle', 'Par module', 'Validation'],
      badge: `${stats.activeModules} modules`
    },
    {
      title: 'Gestion Rôles',
      description: 'Administer les rôles et profils utilisateurs',
      icon: ShieldCheckIcon,
      color: 'emerald',
      path: '/admin/roles',
      features: ['Admin', 'Commercial', 'Agent'],
      badge: '5 rôles'
    },
    {
      title: 'Statistiques & Rapports',
      description: 'Analyses détaillées du système',
      icon: ChartBarIcon,
      color: 'amber',
      path: '/admin/stats',
      features: ['Utilisation', 'Performance', 'Audit'],
      badge: 'Temps réel'
    },
    {
      title: 'Configuration Système',
      description: 'Paramètres et maintenance',
      icon: CogIcon,
      color: 'rose',
      path: '/admin/settings',
      features: ['Base de données', 'Sécurité', 'Backup'],
      badge: 'Stable'
    },
    {
      title: 'Gestion Notifications',
      description: 'Alertes et messages système',
      icon: BellIcon,
      color: 'indigo',
      path: '/admin/notifications',
      features: ['Alertes', 'Emails', 'Logs'],
      badge: '3 nouvelles'
    }
  ];

  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: 'text-purple-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'text-amber-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: 'text-rose-600' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: 'text-indigo-600' }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600"></div>
        <p className="text-slate-500 font-medium">Chargement des données admin...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* 🎯 HEADER HERO */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 opacity-95"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%27%20height=%2760%27%20viewBox=%270%200%2060%2060%27%20xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg%20fill=%27none%27%20fill-rule=%27evenodd%27%3E%3Cg%20fill=%27%23ffffff%27%20fill-opacity=%270.05%27%3E%3Cpath%20d=%27M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        <div className="relative px-8 py-12 md:px-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <ShieldCheckIcon className="h-6 w-6 text-white" />
                </div>
                <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wide">
                  🛡️ Administration Système
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                Centre de Contrôle
              </h1>
              <p className="text-blue-100 text-lg font-medium max-w-2xl">
                Gérez et surveillez tous les aspects de votre CRM Nexus avec une précision absolue
              </p>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-white/20 to-transparent rounded-2xl blur-xl"></div>
                <div className="relative h-24 w-24 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <ListBulletIcon className="h-12 w-12 text-white/60" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white hover:shadow-xl hover:border-slate-300 transition-all duration-300"
            >
              <div className={`absolute top-0 right-0 h-24 w-24 ${stat.bgColor} rounded-full -translate-y-12 translate-x-12 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform`}></div>
              
              <div className="relative p-6 z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`h-12 w-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${stat.textColor}`} />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                    {stat.change}
                  </span>
                </div>
                
                <p className="text-sm text-slate-500 mb-1">{stat.title}</p>
                <p className="text-3xl font-black text-slate-900 mb-3">{stat.value}</p>
                <p className="text-xs text-slate-400 font-medium">{stat.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🚨 SYSTEM HEALTH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="h-12 w-12 rounded-xl bg-emerald-200 flex items-center justify-center">
              <ServerIcon className="h-6 w-6 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-900">État du Système</h3>
              <p className="text-sm text-emerald-700 mt-1">Tous les services fonctionnent correctement</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/50 rounded-xl p-4 border border-emerald-100">
              <p className="text-xs text-slate-600 font-medium mb-2">Uptime</p>
              <p className="text-2xl font-bold text-emerald-700">99.9%</p>
              <div className="h-1 bg-emerald-200 rounded-full mt-3 overflow-hidden">
                <div className="h-full w-[99.9%] bg-emerald-500 rounded-full"></div>
              </div>
            </div>
            <div className="bg-white/50 rounded-xl p-4 border border-emerald-100">
              <p className="text-xs text-slate-600 font-medium mb-2">Dernier Backup</p>
              <p className="text-2xl font-bold text-emerald-700">2h ago</p>
              <p className="text-xs text-slate-500 mt-2">Automatique</p>
            </div>
            <div className="bg-white/50 rounded-xl p-4 border border-emerald-100">
              <p className="text-xs text-slate-600 font-medium mb-2">DB Status</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="font-bold text-emerald-700">Connecté</span>
              </div>
            </div>
          </div>
        </div>

        {/* LATEST ACTIVITY */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Activité Récente</h3>
          <div className="space-y-3">
            {[
              { icon: UsersIcon, text: 'Nouvel utilisateur', time: '5 min', color: 'blue' },
              { icon: KeyIcon, text: 'Permissions modifiées', time: '15 min', color: 'purple' },
              { icon: CheckCircleIcon, text: 'Backup complété', time: '2h', color: 'emerald' }
            ].map((activity, idx) => {
              const ActivityItemIcon = activity.icon;
              return (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className={`h-8 w-8 rounded-lg bg-${activity.color}-100 flex items-center justify-center`}>
                    <ActivityItemIcon className={`h-4 w-4 text-${activity.color}-600`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{activity.text}</p>
                    <p className="text-xs text-slate-400">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🎛️ ADMIN SECTIONS GRID */}
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-2">
            <SparklesIcon className="h-6 w-6 text-blue-600" />
            Modules d'Administration
          </h2>
          <p className="text-slate-600">Accédez aux outils de gestion principaux</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section, idx) => {
            const SectionIcon = section.icon;
            const colors = colorMap[section.color];
            
            return (
              <button
                key={idx}
                onClick={() => navigate(section.path)}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-left hover:shadow-xl hover:border-slate-300 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-12 w-12 rounded-xl ${colors.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <SectionIcon className={`h-6 w-6 ${colors.icon}`} />
                    </div>
                    <span className={`px-3 py-1 rounded-full bg-${section.color}-50 text-${section.color}-700 text-xs font-bold whitespace-nowrap`}>
                      {section.badge}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className={`text-lg font-bold ${colors.text} group-hover:text-slate-900 transition-colors mb-1`}>
                    {section.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">{section.description}</p>

                  {/* Features list */}
                  <div className="space-y-2 mb-4">
                    {section.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-600">
                        <div className={`h-1.5 w-1.5 rounded-full ${colors.icon}`}></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                    <span>Accéder</span>
                    <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* QUICK LINKS */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 p-8">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Raccourcis Utiles</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Nouvel Utilisateur', icon: UserGroupIcon, color: 'blue' },
            { label: 'Logs d\'Audit', icon: EyeIcon, color: 'purple' },
            { label: 'Sauvegarde DB', icon: CheckCircleIcon, color: 'emerald' },
            { label: 'Rapports', icon: ChartBarIcon, color: 'amber' }
          ].map((link, idx) => {
            const LinkIcon = link.icon;
            return (
              <button
                key={idx}
                onClick={() => toast.success(`${link.label} (En développement)`)}
                className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50 transition-all"
              >
                <div className={`h-10 w-10 rounded-lg bg-${link.color}-100 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <LinkIcon className={`h-5 w-5 text-${link.color}-600`} />
                </div>
                <span className="text-xs font-medium text-slate-700">{link.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPro;
