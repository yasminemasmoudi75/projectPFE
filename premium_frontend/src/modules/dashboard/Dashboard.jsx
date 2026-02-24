import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChartBarIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  PlusIcon,
  EyeIcon,
  UsersIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar
} from 'recharts';
import useAuth from '../../hooks/useAuth';
import axiosInstance from '../../app/axios';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const PRIORITY_COLORS = { 'Haute': '#ef4444', 'Moyenne': '#f59e0b', 'Basse': '#10b981' };
const STATUS_COLORS = { 'Ouvert': '#3b82f6', 'En cours': '#f59e0b', 'Résolu': '#10b981', 'Fermé': '#64748b' };



const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('week');
  
  // State pour les données
  const [stats, setStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [reclamationStats, setReclamationStats] = useState(null);
  const [projectStats, setProjectStats] = useState(null);
  const [objectifStats, setObjectifStats] = useState(null);
  const [devisStats, setDevisStats] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Nouvelles statistiques
  const [priorityChartData, setPriorityChartData] = useState([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState([]);
  const [technicianStats, setTechnicianStats] = useState([]);
  const [typeReclamationData, setTypeReclamationData] = useState([]);
  const [resolutionRate, setResolutionRate] = useState(0);
  const [tiersStats, setTiersStats] = useState(null);
  const [messagesStats, setMessagesStats] = useState(null);
  
  // Statistiques commerciaux
  const [commercialStats, setCommercialStats] = useState([]);
  const [commercialDevisData, setCommercialDevisData] = useState([]);
  const [monthlyDevisData, setMonthlyDevisData] = useState([]);

  // Fetch les données au chargement
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Appels API parallèles
        const [
          reclamationsRes,
          projectsRes,
          objectifsRes,
          devisRes,
          usersRes,
          activitesRes,
          tiersRes,
          messagesRes
        ] = await Promise.all([
          axiosInstance.get('/reclamations?limit=1000'),
          axiosInstance.get('/projets?limit=1000'),
          axiosInstance.get('/objectifs?limit=1000'),
          axiosInstance.get('/devis?limit=1000'),
          axiosInstance.get('/users?limit=1000'),
          axiosInstance.get('/activites?limit=50'),
          axiosInstance.get('/tiers?limit=1000').catch(() => ({ data: [] })),
          axiosInstance.get('/messages?limit=100').catch(() => ({ data: [] }))
        ]);

        // Traiter les données de réclamations
        const reclamations = reclamationsRes.data || [];
        const reclamationsByStatus = {
          'Ouvert': reclamations.filter(r => r.Statut === 'Ouvert').length,
          'En cours': reclamations.filter(r => r.Statut === 'En cours').length,
          'Résolu': reclamations.filter(r => r.Statut === 'Résolu').length,
          'Fermé': reclamations.filter(r => r.Statut === 'Fermé').length
        };
        const reclamationsByPriority = {
          'Haute': reclamations.filter(r => r.Priorite === 'Haute').length,
          'Moyenne': reclamations.filter(r => r.Priorite === 'Moyenne').length,
          'Basse': reclamations.filter(r => r.Priorite === 'Basse').length
        };
        
        // Réclamations par type
        const reclamationsByType = {};
        reclamations.forEach(r => {
          const type = r.TypeReclamation || 'Autre';
          reclamationsByType[type] = (reclamationsByType[type] || 0) + 1;
        });
        const typeData = Object.entries(reclamationsByType).map(([name, value]) => ({ name, value }));
        setTypeReclamationData(typeData);
        
        // Statistiques par priorité pour graphique
        const priorityData = [
          { name: 'Haute', value: reclamationsByPriority['Haute'], fill: '#ef4444' },
          { name: 'Moyenne', value: reclamationsByPriority['Moyenne'], fill: '#f59e0b' },
          { name: 'Basse', value: reclamationsByPriority['Basse'], fill: '#10b981' }
        ];
        setPriorityChartData(priorityData);
        
        // Taux de résolution
        const resolvedCount = reclamationsByStatus['Résolu'] + reclamationsByStatus['Fermé'];
        const rate = reclamations.length > 0 ? ((resolvedCount / reclamations.length) * 100).toFixed(1) : 0;
        setResolutionRate(rate);
        
        // Tendances mensuelles (6 derniers mois)
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        const now = new Date();
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthReclamations = reclamations.filter(r => {
            const recDate = new Date(r.DateOuverture);
            return recDate.getFullYear() === date.getFullYear() && recDate.getMonth() === date.getMonth();
          });
          monthlyData.push({
            name: monthNames[date.getMonth()],
            ouvertes: monthReclamations.length,
            resolues: monthReclamations.filter(r => r.Statut === 'Résolu' || r.Statut === 'Fermé').length
          });
        }
        setMonthlyTrendData(monthlyData);
        
        // Statistiques par technicien
        const techStats = {};
        reclamations.forEach(r => {
          if (r.NomTechnicien) {
            if (!techStats[r.NomTechnicien]) {
              techStats[r.NomTechnicien] = { total: 0, resolved: 0 };
            }
            techStats[r.NomTechnicien].total++;
            if (r.Statut === 'Résolu' || r.Statut === 'Fermé') {
              techStats[r.NomTechnicien].resolved++;
            }
          }
        });
        const techData = Object.entries(techStats).map(([name, data]) => ({
          name: name.length > 12 ? name.substring(0, 12) + '...' : name,
          total: data.total,
          resolved: data.resolved,
          rate: data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0
        })).sort((a, b) => b.total - a.total).slice(0, 5);
        setTechnicianStats(techData);
        
        setReclamationStats({
          total: reclamations.length,
          byStatus: reclamationsByStatus,
          byPriority: reclamationsByPriority,
          openCount: reclamationsByStatus['Ouvert'],
          inProgressCount: reclamationsByStatus['En cours'],
          resolvedCount: resolvedCount,
          resolutionRate: rate
        });

        // Traiter les données de projets
        const projects = projectsRes.data || [];
        const projectsByStatus = {
          'Actif': projects.filter(p => p.Statut === 'Actif').length,
          'Complété': projects.filter(p => p.Statut === 'Complété').length,
          'En attente': projects.filter(p => p.Statut === 'En attente').length,
          'Suspendu': projects.filter(p => p.Statut === 'Suspendu').length
        };
        setProjectStats({
          total: projects.length,
          byStatus: projectsByStatus,
          activeCount: projectsByStatus['Actif'],
          completedCount: projectsByStatus['Complété']
        });

        // Traiter les données d'objectifs
        const objectifs = objectifsRes.data || [];
        const objectifsByStatus = {
          'Atteint': objectifs.filter(o => o.Statut === 'Atteint').length,
          'Non atteint': objectifs.filter(o => o.Statut === 'Non atteint').length,
          'En cours': objectifs.filter(o => o.Statut === 'En cours').length
        };
        setObjectifStats({
          total: objectifs.length,
          byStatus: objectifsByStatus,
          achievedCount: objectifsByStatus['Atteint'],
          achievementRate: ((objectifsByStatus['Atteint'] || 0) / (objectifs.length || 1) * 100).toFixed(1)
        });

        // Traiter les données de devis
        const devis = devisRes.data || [];
        const devisByStatus = {
          'En attente': devis.filter(d => d.Statut === 'En attente').length,
          'Validé': devis.filter(d => d.Statut === 'Validé').length,
          'Rejeté': devis.filter(d => d.Statut === 'Rejeté').length,
          'Expiré': devis.filter(d => d.Statut === 'Expiré').length
        };
        const devisTotalAmount = devis.reduce((sum, d) => sum + (d.Montant || 0), 0);
        setDevisStats({
          total: devis.length,
          byStatus: devisByStatus,
          pendingCount: devisByStatus['En attente'],
          validatedCount: devisByStatus['Validé'],
          totalAmount: devisTotalAmount
        });

        // Traiter les données d'utilisateurs
        const users = usersRes.data || [];
        const usersByRole = {
          'Admin': users.filter(u => u.Role === 'Admin').length,
          'Technicien': users.filter(u => u.Role === 'Technicien').length,
          'Commercial': users.filter(u => u.Role === 'Commercial').length,
          'Client': users.filter(u => u.Role === 'Client').length
        };
        setUserStats({
          total: users.length,
          byRole: usersByRole,
          activeCount: users.filter(u => u.IsActive).length
        });

        // Traiter les données des tiers (clients)
        const tiers = tiersRes.data || [];
        const tiersByType = {};
        tiers.forEach(t => {
          const type = t.TypeTiers || 'Autre';
          tiersByType[type] = (tiersByType[type] || 0) + 1;
        });
        setTiersStats({
          total: tiers.length,
          byType: tiersByType
        });

        // Traiter les données des messages
        const messages = messagesRes.data || [];
        const unreadCount = messages.filter(m => !m.IsRead).length;
        setMessagesStats({
          total: messages.length,
          unread: unreadCount
        });

        // ======= STATISTIQUES COMMERCIAUX =======
        // Performance des commerciaux basée sur les devis
        const commercialData = {};
        devis.forEach(d => {
          const commercial = d.CUser || d.CreatedBy || 'Non assigné';
          if (!commercialData[commercial]) {
            commercialData[commercial] = { 
              total: 0, 
              validated: 0, 
              totalAmount: 0, 
              validatedAmount: 0 
            };
          }
          commercialData[commercial].total++;
          commercialData[commercial].totalAmount += (d.TotTTC || d.Montant || 0);
          if (d.Statut === 'Validé') {
            commercialData[commercial].validated++;
            commercialData[commercial].validatedAmount += (d.TotTTC || d.Montant || 0);
          }
        });
        
        const commercialStatsArray = Object.entries(commercialData).map(([name, data]) => ({
          name: name.length > 12 ? name.substring(0, 12) + '...' : name,
          fullName: name,
          total: data.total,
          validated: data.validated,
          totalAmount: data.totalAmount,
          validatedAmount: data.validatedAmount,
          conversionRate: data.total > 0 ? Math.round((data.validated / data.total) * 100) : 0
        })).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 5);
        setCommercialStats(commercialStatsArray);
        
        // Graphique devis par commercial
        const commercialDevisChartData = commercialStatsArray.map(c => ({
          name: c.name,
          devis: c.total,
          validés: c.validated,
          montant: Math.round(c.totalAmount / 1000) // en milliers
        }));
        setCommercialDevisData(commercialDevisChartData);
        
        // Tendance mensuelle des devis (6 derniers mois)
        const monthNamesDevis = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        const nowDevis = new Date();
        const monthlyDevis = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(nowDevis.getFullYear(), nowDevis.getMonth() - i, 1);
          const monthDevis = devis.filter(d => {
            const devisDate = new Date(d.DatDoc || d.createdAt);
            return devisDate.getFullYear() === date.getFullYear() && devisDate.getMonth() === date.getMonth();
          });
          const validatedDevis = monthDevis.filter(d => d.Statut === 'Validé');
          monthlyDevis.push({
            name: monthNamesDevis[date.getMonth()],
            devis: monthDevis.length,
            validés: validatedDevis.length,
            montant: Math.round(monthDevis.reduce((sum, d) => sum + (d.TotTTC || d.Montant || 0), 0) / 1000)
          });
        }
        setMonthlyDevisData(monthlyDevis);

        // Préparer les cartes KPI avec les données réelles
        const newStats = [
          {
            name: 'Réclamations',
            value: reclamations.length,
            unit: 'En cours',
            icon: DocumentTextIcon,
            trend: `+${reclamationsByStatus['Ouvert']} ouvertes`,
            trendUp: true,
            color: 'blue',
            description: 'Actives'
          },
          {
            name: 'Projets Actifs',
            value: projectsByStatus['Actif'],
            unit: 'En cours',
            icon: BriefcaseIcon,
            trend: `+${projectsByStatus['Complété']} complétés`,
            trendUp: true,
            color: 'emerald',
            description: 'ce mois'
          },
          {
            name: 'Objectifs',
            value: `${((objectifsByStatus['Atteint'] || 0) / (objectifs.length || 1) * 100).toFixed(0)}%`,
            unit: 'atteints',
            icon: ArrowTrendingUpIcon,
            trend: `${objectifsByStatus['Atteint']}/${objectifs.length}`,
            trendUp: true,
            color: 'purple',
            description: 'Taux de réalisation'
          },
          {
            name: 'Devis',
            value: devis.length,
            unit: 'Total',
            icon: CurrencyDollarIcon,
            trend: `${devisByStatus['En attente']} en attente`,
            trendUp: false,
            color: 'amber',
            description: `${(devisTotalAmount / 1000).toFixed(1)}k TND`
          }
        ];
        setStats(newStats);

        // Préparer les activités récentes
        const activities = activitesRes.data || [];
        const formattedActivities = activities.slice(0, 5).map((activity, idx) => ({
          id: idx,
          type: 'activity',
          title: activity.LibActivite || 'Activité',
          client: activity.Observations || 'Sans description',
          status: 'success',
          time: 'Il y a peu'
        }));
        setRecentActivities(formattedActivities);

        // Préparer les données de graphique
        const statusData = [
          { name: 'Ouvert', value: reclamationsByStatus['Ouvert'] },
          { name: 'En cours', value: reclamationsByStatus['En cours'] },
          { name: 'Résolu', value: reclamationsByStatus['Résolu'] },
          { name: 'Fermé', value: reclamationsByStatus['Fermé'] }
        ];
        setChartData(statusData);

      } catch (error) {
        console.error('Erreur lors du chargement du dashboard:', error);
        toast.error('Erreur lors du chargement des données du dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getIconStyle = (color) => {
    const styles = {
      blue: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
      emerald: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      amber: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      purple: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)'
    };
    return styles[color] || styles.blue;
  };

  if (loading) {
    return (
      <div className="animate-fade-in space-y-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-luxury p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded mb-4 w-2/3"></div>
              <div className="h-8 bg-slate-200 rounded mb-4 w-1/2"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 pb-12">

      {/* Welcome Banner - Amélioré */}
      <div className="card-luxury p-0 overflow-hidden">
        <div className="relative p-8 lg:p-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
          {/* Décoration arrière-plan */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="text-white flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <SparklesIcon className="h-6 w-6 text-white" />
                </div>
                <p className="text-white/70 text-sm font-semibold uppercase tracking-wider">Bienvenue de retour</p>
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-3">
                {user?.FullName || 'Utilisateur'} 👋
              </h1>
              <p className="text-white/80 text-base max-w-lg leading-relaxed">
                Voici votre tableau de bord temps réel. <span className="text-white font-bold bg-white/20 px-3 py-1 rounded-lg">{reclamationStats?.openCount || 0} réclamations</span> nécessitent votre attention.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-start lg:justify-end">
              <button
                onClick={() => navigate('/reclamations')}
                className="group px-6 py-3 bg-white text-blue-600 rounded-xl text-sm font-bold uppercase tracking-wider shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-2"
              >
                <DocumentTextIcon className="h-5 w-5" />
                Voir Réclamations
              </button>
              <button 
                onClick={() => navigate('/projets')}
                className="group px-6 py-3 border-2 border-white/40 text-white rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                <BriefcaseIcon className="h-5 w-5 inline mr-2" />
                Voir Projets
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards - Design Amélioré */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="group cursor-pointer">
            <div className={`card-luxury p-0 overflow-hidden h-full transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl`}>
              {/* Header coloré */}
              <div style={{ background: getIconStyle(stat.color) }} className="h-1"></div>
              
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{stat.name}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-900">{stat.value}</span>
                      {stat.unit && <span className="text-sm font-semibold text-slate-500">{stat.unit}</span>}
                    </div>
                  </div>
                  <div
                    className="p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform"
                    style={{ background: getIconStyle(stat.color) }}
                  >
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold flex items-center gap-1 ${stat.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {stat.trendUp ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                      {stat.trend}
                    </span>
                    <span className="text-xs text-slate-400">{stat.description}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* Réclamations Status Chart - Design Amélioré */}
        <div className="xl:col-span-4 card-luxury p-0 overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-slate-100/50 bg-gradient-to-r from-blue-50 via-blue-50/50 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-800">Réclamations par Statut</h2>
              <div className="p-2 rounded-lg bg-blue-100">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              <span className="text-blue-600 font-bold text-base">Total: {reclamationStats?.total}</span>
            </p>
          </div>

          <div className="p-6 lg:p-8 flex justify-center">
            <div className="w-64 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Détail des statuts */}
          <div className="px-6 pb-6 space-y-3">
            {Object.entries(reclamationStats?.byStatus || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{status}</span>
                <span className="text-sm font-bold text-slate-800">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Projets & Objectifs */}
        <div className="xl:col-span-8 space-y-6">


          {/* Projects Status */}
          <div className="card-luxury p-0 overflow-hidden group">
            <div className="p-6 lg:p-8 border-b border-slate-100/50 bg-gradient-to-r from-emerald-50 via-emerald-50/50 to-transparent">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-slate-800">Projets en cours</h2>
                <div className="p-2 rounded-lg bg-emerald-100">
                  <BriefcaseIcon className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                <span className="text-emerald-600 font-bold text-base">{projectStats?.activeCount}</span> actifs / {projectStats?.total} total
              </p>
            </div>

            <div className="p-6 lg:p-8">
              <div className="space-y-4">
                {Object.entries(projectStats?.byStatus || {}).map(([status, count]) => (
                  <div key={status} className="group/item">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm font-semibold text-slate-700">{status}</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-sm font-bold">{count}</span>
                    </div>
                    <div className="w-full bg-slate-200/50 rounded-full h-2.5 overflow-hidden shadow-sm">
                      <div 
                        className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2.5 rounded-full transition-all group-hover/item:shadow-lg"
                        style={{ width: `${(count / (projectStats?.total || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Objectifs Achievement */}
          <div className="card-luxury p-0 overflow-hidden group">
            <div className="p-6 lg:p-8 border-b border-slate-100/50 bg-gradient-to-r from-purple-50 via-purple-50/50 to-transparent">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-slate-800">Taux de Réalisation Objectifs</h2>
                <div className="p-2 rounded-lg bg-purple-100">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                <span className="text-purple-600 font-bold text-base">{objectifStats?.achievementRate}%</span> atteints
              </p>
            </div>

            <div className="p-6 lg:p-8">
              <div className="space-y-4">
                {Object.entries(objectifStats?.byStatus || {}).map(([status, count]) => (
                  <div key={status} className="group/item">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-semibold text-slate-700">{status}</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-sm font-bold">{count}</span>
                    </div>
                    <div className="w-full bg-slate-200/50 rounded-full h-2.5 overflow-hidden shadow-sm">
                      <div 
                        className="bg-gradient-to-r from-purple-400 to-purple-500 h-2.5 rounded-full transition-all group-hover/item:shadow-lg"
                        style={{ width: `${(count / (objectifStats?.total || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Devis & Utilisateurs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* Devis Stats */}
        <div className="card-luxury p-0 overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-slate-100/50 bg-gradient-to-r from-amber-50 via-amber-50/50 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-800">Devis</h2>
              <div className="p-2 rounded-lg bg-amber-100">
                <DocumentTextIcon className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Montant total: <span className="text-amber-600 font-bold text-base">{(devisStats?.totalAmount / 1000).toFixed(1)}k TND</span>
            </p>
          </div>

          <div className="p-6 lg:p-8 space-y-4">
            {Object.entries(devisStats?.byStatus || {}).map(([status, count]) => (
              <div key={status} className="group/devis flex items-center justify-between p-4 bg-amber-50/70 rounded-xl border border-amber-100/50 hover:shadow-md hover:bg-amber-50 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <span className="text-sm font-semibold text-slate-700">{status}</span>
                </div>
                <span className="text-lg font-bold text-amber-600 group-hover/devis:scale-110 transition-transform">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Users Stats */}
        <div className="card-luxury p-0 overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-slate-100/50 bg-gradient-to-r from-cyan-50 via-cyan-50/50 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-800">Utilisateurs</h2>
              <div className="p-2 rounded-lg bg-cyan-100">
                <UsersIcon className="h-5 w-5 text-cyan-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              <span className="text-cyan-600 font-bold text-base">{userStats?.activeCount}</span> actifs / {userStats?.total} total
            </p>
          </div>

          <div className="p-6 lg:p-8 space-y-4">
            {Object.entries(userStats?.byRole || {}).map(([role, count]) => (
              <div key={role} className="group/user flex items-center justify-between p-4 bg-cyan-50/70 rounded-xl border border-cyan-100/50 hover:shadow-md hover:bg-cyan-50 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                  <span className="text-sm font-semibold text-slate-700">{role}</span>
                </div>
                <span className="text-lg font-bold text-cyan-600 group-hover/user:scale-110 transition-transform">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NOUVELLES STATISTIQUES */}
      
      {/* Réclamations - Par Priorité & Tendance Mensuelle */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Réclamations par Priorité */}
        <div className="card-luxury p-0 overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-slate-100/50 bg-gradient-to-r from-rose-50 via-red-50/50 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-800">Réclamations par Priorité</h2>
              <div className="p-2 rounded-lg bg-rose-100">
                <ChartBarIcon className="h-5 w-5 text-rose-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Taux de résolution: <span className="text-emerald-600 font-bold text-base">{resolutionRate}%</span>
            </p>
          </div>

          <div className="p-6 lg:p-8">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="px-6 pb-6 grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50/70 rounded-xl border border-red-100/50 hover:shadow-md transition-all">
              <p className="text-2xl font-bold text-red-600">{reclamationStats?.byPriority?.['Haute'] || 0}</p>
              <p className="text-xs text-slate-500 mt-1 font-semibold">Haute</p>
            </div>
            <div className="text-center p-4 bg-amber-50/70 rounded-xl border border-amber-100/50 hover:shadow-md transition-all">
              <p className="text-2xl font-bold text-amber-600">{reclamationStats?.byPriority?.['Moyenne'] || 0}</p>
              <p className="text-xs text-slate-500 mt-1 font-semibold">Moyenne</p>
            </div>
            <div className="text-center p-4 bg-emerald-50/70 rounded-xl border border-emerald-100/50 hover:shadow-md transition-all">
              <p className="text-2xl font-bold text-emerald-600">{reclamationStats?.byPriority?.['Basse'] || 0}</p>
              <p className="text-xs text-slate-500 mt-1 font-semibold">Basse</p>
            </div>
          </div>
        </div>

        {/* Tendance Mensuelle */}
        <div className="card-luxury p-0 overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-slate-100/50 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-800">Tendance Mensuelle</h2>
              <div className="p-2 rounded-lg bg-blue-100">
                <ClockIcon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Évolution des réclamations sur 6 mois
            </p>
          </div>

          <div className="p-6 lg:p-8">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData}>
                  <defs>
                    <linearGradient id="colorOuvertes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResolues" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="ouvertes" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorOuvertes)" name="Ouvertes" />
                  <Area type="monotone" dataKey="resolues" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolues)" name="Résolues" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Techniciens & Types de Réclamations */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Performance des Techniciens */}
        <div className="card-luxury p-0 overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-slate-100/50 bg-gradient-to-r from-violet-50 via-purple-50/50 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-800">Performance Techniciens</h2>
              <div className="p-2 rounded-lg bg-purple-100">
                <UsersIcon className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Top 5 techniciens par volume de réclamations
            </p>
          </div>

          <div className="p-6 lg:p-8">
            {technicianStats.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={technicianStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="total" fill="#8b5cf6" name="Total" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resolved" fill="#10b981" name="Résolus" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                <p>Aucune donnée de technicien disponible</p>
              </div>
            )}
          </div>

          {/* Performance KPIs */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-2 gap-4">
              {technicianStats.slice(0, 4).map((tech, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-br from-purple-50 to-violet-50/50 rounded-xl border border-purple-100/50 hover:shadow-md transition-all">
                  <p className="text-sm font-semibold text-slate-700 mb-2">{tech.name}</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold text-purple-600">{tech.total}</span>
                    <span className="text-xs font-bold text-emerald-600">{tech.rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Types de Réclamations */}
        <div className="card-luxury p-0 overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-slate-100/50 bg-gradient-to-r from-cyan-50 via-blue-50/50 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-800">Types de Réclamations</h2>
              <div className="p-2 rounded-lg bg-cyan-100">
                <DocumentTextIcon className="h-5 w-5 text-cyan-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Répartition par catégorie
            </p>
          </div>

          <div className="p-6 lg:p-8 flex justify-center">
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeReclamationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {typeReclamationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Détail des types */}
          <div className="px-6 pb-6 space-y-3">
            {typeReclamationData.map((type, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-sm font-medium text-slate-700">{type.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{type.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ======= STATISTIQUES COMMERCIAUX ======= */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Performance des Commerciaux */}
        <div className="card-luxury p-0 overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-slate-100/50 bg-gradient-to-r from-amber-50 via-orange-50/50 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-800">Performance Commerciaux</h2>
              <div className="p-2 rounded-lg bg-amber-100">
                <ArrowTrendingUpIcon className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Top 5 commerciaux par chiffre d'affaires
            </p>
          </div>

          <div className="p-6 lg:p-8">
            {commercialStats.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={commercialDevisData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="devis" fill="#f59e0b" name="Devis créés" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="validés" fill="#10b981" name="Devis validés" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                <p>Aucune donnée de commercial disponible</p>
              </div>
            )}
          </div>

          {/* Commercial KPIs */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-2 gap-4">
              {commercialStats.slice(0, 4).map((comm, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-xl border border-amber-100/50 hover:shadow-md transition-all">
                  <p className="text-sm font-semibold text-slate-700 mb-1">{comm.name}</p>
                  <p className="text-lg font-bold text-amber-600">{comm.conversionRate}%</p>
                  <p className="text-xs text-slate-500 mt-2">{(comm.totalAmount / 1000).toFixed(1)}k TND</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tendance Mensuelle Devis */}
        <div className="card-luxury p-0 overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-slate-100/50 bg-gradient-to-r from-emerald-50 via-green-50/50 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-800">Tendance Devis Mensuelle</h2>
              <div className="p-2 rounded-lg bg-emerald-100">
                <ClockIcon className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Évolution des devis sur 6 mois
            </p>
          </div>

          <div className="p-6 lg:p-8">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyDevisData}>
                  <defs>
                    <linearGradient id="colorDevis" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorValidés" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="devis" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorDevis)" name="Devis créés" />
                  <Area type="monotone" dataKey="validés" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorValidés)" name="Validés" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Stats Summary */}
          <div className="px-6 pb-6 grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-amber-50/70 rounded-xl border border-amber-100/50">
              <p className="text-2xl font-bold text-amber-600">{devisStats?.total || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Total Devis</p>
            </div>
            <div className="text-center p-4 bg-emerald-50/70 rounded-xl border border-emerald-100/50">
              <p className="text-2xl font-bold text-emerald-600">{devisStats?.validatedCount || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Validés</p>
            </div>
            <div className="text-center p-4 bg-rose-50/70 rounded-xl border border-rose-100/50">
              <p className="text-2xl font-bold text-rose-600">{devisStats?.pendingCount || 0}</p>
              <p className="text-xs text-slate-500 mt-1">En attente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Classement Commercial - Tableau détaillé */}
      <div className="card-luxury p-0 overflow-hidden">
        <div className="p-6 lg:p-8 border-b border-slate-100/50 bg-gradient-to-r from-indigo-50/50 to-transparent">
          <h2 className="text-lg font-bold text-slate-800">Classement des Commerciaux</h2>
          <p className="text-sm text-slate-500 mt-1">
            Performance détaillée par commercial
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Rang</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Commercial</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Devis</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Validés</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Taux Conv.</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">CA Total</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">CA Validé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commercialStats.map((comm, idx) => (
                <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-600' : 'bg-slate-300'
                    }`}>
                      {idx + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800">{comm.fullName}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-bold text-slate-800">{comm.total}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-bold text-emerald-600">{comm.validated}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${comm.conversionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-blue-600">{comm.conversionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-slate-800">{(comm.totalAmount / 1000).toFixed(1)}k</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-emerald-600">{(comm.validatedAmount / 1000).toFixed(1)}k</span>
                  </td>
                </tr>
              ))}
              {commercialStats.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                    Aucune donnée de commercial disponible
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Résumé Rapide - 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="card-luxury p-5 text-center group hover:-translate-y-2 transition-all cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-blue-100 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
            <DocumentTextIcon className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-blue-600">{reclamationStats?.total || 0}</p>
          <p className="text-xs text-slate-500 mt-2 font-semibold">Réclamations</p>
        </div>
        <div className="card-luxury p-5 text-center group hover:-translate-y-2 transition-all cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-amber-100 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ClockIcon className="h-6 w-6 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600">{reclamationStats?.openCount || 0}</p>
          <p className="text-xs text-slate-500 mt-2 font-semibold">En Attente</p>
        </div>
        <div className="card-luxury p-5 text-center group hover:-translate-y-2 transition-all cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">{resolutionRate}%</p>
          <p className="text-xs text-slate-500 mt-2 font-semibold">Résolution</p>
        </div>
        <div className="card-luxury p-5 text-center group hover:-translate-y-2 transition-all cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-purple-100 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BriefcaseIcon className="h-6 w-6 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-purple-600">{projectStats?.total || 0}</p>
          <p className="text-xs text-slate-500 mt-2 font-semibold">Projets</p>
        </div>
        <div className="card-luxury p-5 text-center group hover:-translate-y-2 transition-all cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-cyan-100 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
            <UserGroupIcon className="h-6 w-6 text-cyan-600" />
          </div>
          <p className="text-2xl font-extrabold text-cyan-600">{tiersStats?.total || 0}</p>
          <p className="text-xs text-slate-500 mt-2 font-semibold">Clients</p>
        </div>
        <div className="card-luxury p-5 text-center group hover:-translate-y-2 transition-all cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-rose-100 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
            <DocumentTextIcon className="h-6 w-6 text-rose-600" />
          </div>
          <p className="text-2xl font-extrabold text-rose-600">{messagesStats?.unread || 0}</p>
          <p className="text-xs text-slate-500 mt-2 font-semibold">Messages</p>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card-luxury p-0 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <DocumentTextIcon className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Activités Récentes</h3>
          </div>
          <button 
            onClick={() => navigate('/activities')}
            className="text-xs font-bold text-blue-600 uppercase tracking-wider hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
          >
            Voir tout →
          </button>
        </div>
        <div className="divide-y divide-slate-100/50">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div key={activity.id} className="p-5 px-6 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-md bg-blue-100 text-blue-600">
                    <DocumentTextIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{activity.title}</p>
                    <p className="text-xs text-slate-500 truncate mt-1">{activity.client}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-slate-500">
              Aucune activité récente
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
