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
  ClockIcon,
  TruckIcon
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
import usePermission from '../../hooks/usePermission';
import axiosInstance from '../../app/axios';
import toast from 'react-hot-toast';
import predictionService from '../sales/predictionService';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const PRIORITY_COLORS = { 'Haute': '#ef4444', 'Moyenne': '#f59e0b', 'Basse': '#10b981' };
const STATUS_COLORS = { 'Ouvert': '#3b82f6', 'En cours': '#f59e0b', 'Résolu': '#10b981', 'Fermé': '#64748b' };
const isExpectedAuthFailure = (error) => error?.response?.status === 401 || error?.isSessionExpired === true;
const isForbidden = (error) => error?.response?.status === 403;
const getCollection = (payload) => (Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []);
const normalizeBoolean = (value) => value === true || value === 1 || value === '1';
const getProjectStatus = (project) => {
  if (project?.Statut) return project.Statut;

  const phase = (project?.Phase || '').toString().toLowerCase();
  const progress = Number(project?.Avancement || 0);

  if (phase.includes('suspend')) return 'Suspendu';
  if (phase.includes('attente')) return 'En attente';
  if (phase.includes('cl├┤t') || phase.includes('clot') || progress >= 100) return 'Compl├⌐t├⌐';

  return 'Actif';
};
const getObjectifStatus = (objectif) => {
  if (objectif?.Statut) return objectif.Statut;

  const progress = Number(objectif?.Avancement ?? 0);
  const current = Number(objectif?.Valeur_Actuelle ?? 0);
  const target = Number(objectif?.Valeur_Cible ?? 0);

  if (progress >= 100 || (target > 0 && current >= target)) return 'Atteint';
  if (progress > 0 || current > 0) return 'En cours';

  return 'Non atteint';
};
const getDevisStatus = (devis) => {
  if (normalizeBoolean(devis?.bTransf)) return 'Transform├⌐';
  if (normalizeBoolean(devis?.Valid)) return 'Valid├⌐';
  return 'En attente';
};
const isValidatedDevis = (devis) => ['Valid├⌐', 'Transform├⌐'].includes(getDevisStatus(devis));
const getUserRole = (userItem) => userItem?.UserRole || userItem?.Role || 'User';
const isUserActive = (userItem) => userItem?.IsActive == null || normalizeBoolean(userItem.IsActive);
const isUnreadMessage = (message) => !normalizeBoolean(message?.Delivered);



const Dashboard = () => {
  const { user } = useAuth();
  const { allPermissions } = usePermission();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('week');

  // Helper: V├⌐rifier si un module est actif
  const hasModuleAccess = (moduleCode) => {
    if (!moduleCode) return true; // Pas de v├⌐rification si pas de code
    const target = Number(moduleCode);
    return allPermissions.some((p) => Number(p.moduleCode) === target && p.isActive === true);
  };

  // State pour les donn├⌐es
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

  // Nouvelles statistiques avancées
  const [productYield, setProductYield] = useState([]);
  const [goalPredictions, setGoalPredictions] = useState([]);
  const [globalSatisfaction, setGlobalSatisfaction] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [regionalPredictions, setRegionalPredictions] = useState([]);
  const [isMLAvailable, setIsMLAvailable] = useState(false);

  // Statistiques commerciaux
  const [commercialStats, setCommercialStats] = useState([]);
  const [commercialDevisData, setCommercialDevisData] = useState([]);
  const [monthlyDevisData, setMonthlyDevisData] = useState([]);

  // Fetch les donn├⌐es au chargement
  useEffect(() => {
    const fetchDashboardData = async () => {
      const safeRequest = async (enabled, requestFn, fallback) => {
        if (!enabled) return fallback;

        try {
          return await requestFn();
        } catch (error) {
          if (isExpectedAuthFailure(error) || isForbidden(error)) {
            return fallback;
          }
          throw error;
        }
      };

      try {
        setLoading(true);

        // Construire dynamiquement les appels API selon les permissions
        const apiCalls = [
          safeRequest(hasModuleAccess(31), () => axiosInstance.get('/reclamations'), { data: [] }), // SAV/Reclamations (31)
          safeRequest(hasModuleAccess(3), () => axiosInstance.get('/projets'), { data: [] }), // Projets (3)
          safeRequest(hasModuleAccess(42), () => axiosInstance.get('/objectifs'), { data: [] }), // Objectifs (42)
          safeRequest(hasModuleAccess(4), () => axiosInstance.get('/devis'), { data: [] }), // Devis (4)
          safeRequest(hasModuleAccess(1), () => axiosInstance.get('/users'), { data: [] }), // Users (1)
          safeRequest(hasModuleAccess(41), () => axiosInstance.get('/activites'), { data: [] }), // Activites (41)
          safeRequest(hasModuleAccess(30), () => axiosInstance.get('/tiers'), { data: [] }), // Clients/Tiers (30)
          safeRequest(hasModuleAccess(2), () => axiosInstance.get('/messages'), { data: [] }), // Messages (2)
          safeRequest(hasModuleAccess(6), () => axiosInstance.get('/blv'), { data: { data: [] } }), // BLV/Livraisons (6)
          safeRequest(hasModuleAccess(7), () => axiosInstance.get('/fav'), { data: { data: [] } }), // Factures (7)
          safeRequest(true, () => axiosInstance.get('/stats/products-yield'), { data: [] }),
          safeRequest(true, () => axiosInstance.get('/stats/goal-predictions'), { data: [] }),
          safeRequest(true, () => axiosInstance.get('/stats/satisfaction-global'), { data: null })
        ];

        const [
          reclamationsRes,
          projectsRes,
          objectifsRes,
          devisRes,
          usersRes,
          activitesRes,
          tiersRes,
          messagesRes,
          blvRes,
          favRes,
          yieldRes,
          predictionsRes,
          satisfactionRes
        ] = await Promise.all(apiCalls);

        const blv = getCollection(blvRes);
        const fav = getCollection(favRes);

        // Traiter les donn├⌐es de réclamations
        const reclamations = getCollection(reclamationsRes);
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

        // réclamations par type
        const reclamationsByType = {};
        reclamations.forEach(r => {
          const type = r.TypeReclamation || 'Autre';
          reclamationsByType[type] = (reclamationsByType[type] || 0) + 1;
        });
        const typeData = Object.entries(reclamationsByType).map(([name, value]) => ({ name, value }));
        setTypeReclamationData(typeData);

        // Statistiques par priorit├⌐ pour graphique
        const priorityData = [
          { name: 'Haute', value: reclamationsByPriority['Haute'], fill: '#ef4444' },
          { name: 'Moyenne', value: reclamationsByPriority['Moyenne'], fill: '#f59e0b' },
          { name: 'Basse', value: reclamationsByPriority['Basse'], fill: '#10b981' }
        ];
        setPriorityChartData(priorityData);

        // Taux de Résolution
        const resolvedCount = reclamationsByStatus['Résolu'] + reclamationsByStatus['Fermé'];
        const rate = reclamations.length > 0 ? ((resolvedCount / reclamations.length) * 100).toFixed(1) : 0;
        setResolutionRate(rate);

        // Tendances mensuelles (6 derniers mois)
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Ao├╗', 'Sep', 'Oct', 'Nov', 'D├⌐c'];
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

        // Traiter les donn├⌐es de projets
        const projects = getCollection(projectsRes);
        const projectsByStatus = {
          'Actif': projects.filter(p => getProjectStatus(p) === 'Actif').length,
          'Compl├⌐t├⌐': projects.filter(p => getProjectStatus(p) === 'Compl├⌐t├⌐').length,
          'En attente': projects.filter(p => getProjectStatus(p) === 'En attente').length,
          'Suspendu': projects.filter(p => getProjectStatus(p) === 'Suspendu').length
        };
        setProjectStats({
          total: projects.length,
          byStatus: projectsByStatus,
          activeCount: projectsByStatus['Actif'],
          completedCount: projectsByStatus['Compl├⌐t├⌐']
        });

        // Traiter les donn├⌐es d'objectifs
        const objectifs = getCollection(objectifsRes);
        const objectifsByStatus = {
          'Atteint': objectifs.filter(o => getObjectifStatus(o) === 'Atteint').length,
          'Non atteint': objectifs.filter(o => getObjectifStatus(o) === 'Non atteint').length,
          'En cours': objectifs.filter(o => getObjectifStatus(o) === 'En cours').length
        };
        setObjectifStats({
          total: objectifs.length,
          byStatus: objectifsByStatus,
          achievedCount: objectifsByStatus['Atteint'],
          achievementRate: ((objectifsByStatus['Atteint'] || 0) / (objectifs.length || 1) * 100).toFixed(1)
        });

        // Traiter les donn├⌐es de devis
        const devis = getCollection(devisRes);
        const devisByStatus = {
          'En attente': devis.filter(d => getDevisStatus(d) === 'En attente').length,
          'Valid├⌐': devis.filter(d => getDevisStatus(d) === 'Valid├⌐').length,
          'Transform├⌐': devis.filter(d => getDevisStatus(d) === 'Transform├⌐').length
        };
        const devisTotalAmount = devis.reduce((sum, d) => sum + Number(d.TotTTC || d.Montant || 0), 0);
        setDevisStats({
          total: devis.length,
          byStatus: devisByStatus,
          pendingCount: devisByStatus['En attente'],
          validatedCount: devisByStatus['Valid├⌐'] + devisByStatus['Transform├⌐'],
          totalAmount: devisTotalAmount
        });

        // Traiter les donn├⌐es d'utilisateurs
        const users = getCollection(usersRes);
        const usersByRole = users.reduce((acc, currentUser) => {
          const role = getUserRole(currentUser);
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {});
        setUserStats({
          total: users.length,
          byRole: usersByRole,
          activeCount: users.filter(isUserActive).length
        });

        // Traiter les donn├⌐es des tiers (clients)
        const tiers = getCollection(tiersRes);
        const tiersByType = {};
        tiers.forEach(t => {
          const type = t.TypeTiers || 'Autre';
          tiersByType[type] = (tiersByType[type] || 0) + 1;
        });
        setTiersStats({
          total: tiers.length,
          byType: tiersByType
        });

        // Traiter les donn├⌐es des messages
        const messages = getCollection(messagesRes);
        const unreadCount = messages.filter(isUnreadMessage).length;
        setMessagesStats({
          total: messages.length,
          unread: unreadCount
        });

        // ======= STATISTIQUES COMMERCIAUX =======
        // Performance des commerciaux Basée sur les devis
        const commercialData = {};
        devis.forEach(d => {
          const commercial = d.CUser || d.CodRepres || d.CreatedBy || 'Non assign├⌐';
          if (!commercialData[commercial]) {
            commercialData[commercial] = {
              total: 0,
              validated: 0,
              totalAmount: 0,
              validatedAmount: 0
            };
          }
          commercialData[commercial].total++;
          commercialData[commercial].totalAmount += Number(d.TotTTC || d.Montant || 0);
          if (isValidatedDevis(d)) {
            commercialData[commercial].validated++;
            commercialData[commercial].validatedAmount += Number(d.TotTTC || d.Montant || 0);
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
          valides: c.validated,
          montant: Math.round(c.totalAmount / 1000) // en milliers
        }));
        setCommercialDevisData(commercialDevisChartData);

        // Tendance mensuelle des devis (6 derniers mois)
        const monthNamesDevis = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Ao├╗', 'Sep', 'Oct', 'Nov', 'D├⌐c'];
        const nowDevis = new Date();
        const monthlyDevis = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(nowDevis.getFullYear(), nowDevis.getMonth() - i, 1);
          const monthDevis = devis.filter(d => {
            const devisDate = new Date(d.DatUser || d.DatCreateUser || d.createdAt);
            return devisDate.getFullYear() === date.getFullYear() && devisDate.getMonth() === date.getMonth();
          });
          const validatedDevis = monthDevis.filter(isValidatedDevis);
          monthlyDevis.push({
            name: monthNamesDevis[date.getMonth()],
            devis: monthDevis.length,
            valides: validatedDevis.length,
            montant: Math.round(monthDevis.reduce((sum, d) => sum + Number(d.TotTTC || d.Montant || 0), 0) / 1000)
          });
        }
        setMonthlyDevisData(monthlyDevis);

        // Pr├⌐parer les cartes KPI avec les donn├⌐es r├⌐elles
        const newStats = [
          {
            name: 'réclamations',
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
            trend: `+${projectsByStatus['Compl├⌐t├⌐']} compl├⌐t├⌐s`,
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
            description: 'Taux de r├⌐alisation'
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
          },
          {
            name: 'Livraisons',
            value: blv.length,
            unit: 'Total',
            icon: TruckIcon,
            trend: `${blv.filter(b => b.Valid).length} valid├⌐s`,
            trendUp: true,
            color: 'blue',
            description: 'Logistique'
          },
          {
            name: 'Factures',
            value: fav.length,
            unit: 'Total',
            icon: DocumentTextIcon,
            trend: `${fav.filter(f => f.Valid).length} valid├⌐es`,
            trendUp: true,
            color: 'emerald',
            description: 'Finance'
          }
        ];
        setStats(newStats);

        // Pr├⌐parer les activit├⌐s r├⌐centes
        const activities = getCollection(activitesRes);
        const formattedActivities = activities.slice(0, 5).map((activity, idx) => ({
          id: idx,
          type: 'activity',
          title: activity.Type_Activite || 'Activit├⌐',
          client: activity.Description || 'Sans description',
          status: 'success',
          time: 'Il y a peu'
        }));
        setRecentActivities(formattedActivities);

        // Pr├⌐parer les donn├⌐es de graphique
        const statusData = [
          { name: 'Ouvert', value: reclamationsByStatus['Ouvert'] },
          { name: 'En cours', value: reclamationsByStatus['En cours'] },
          { name: 'Résolu', value: reclamationsByStatus['Résolu'] },
          { name: 'Fermé', value: reclamationsByStatus['Fermé'] }
        ];
        setChartData(statusData);

        // Update advanced stats
        setProductYield(getCollection(yieldRes));
        setGoalPredictions(getCollection(predictionsRes));
        setGlobalSatisfaction(satisfactionRes?.data || null);

        // Fetch recommendations for current user if commercial
        if (user?.UserID) {
          try {
            const recRes = await axiosInstance.get(`/stats/recommendations/${user.UserID}`);
            setRecommendations(recRes.data?.recommendations || []);
          } catch (e) { console.warn('Could not fetch recommendations'); }
        }

        // Fetch ML Regional Predictions
        try {
          const mlData = await predictionService.predictAllRegions(3, 2026);
          setRegionalPredictions(mlData.predictions || []);
          setIsMLAvailable(true);
        } catch (mlError) {
          console.warn('ML Service not available for dashboard:', mlError.message);
          setIsMLAvailable(false);
        }

      } catch (error) {
        if (!isExpectedAuthFailure(error) && !isForbidden(error)) {
          console.error('Erreur lors du chargement du dashboard:', error);
          toast.error('Erreur lors du chargement des donn├⌐es du dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [allPermissions]);

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
            <div key={i} className="card-luxury p-6 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="h-4 bg-slate-200 rounded mb-4 w-2/3"></div>
              <div className="h-8 bg-slate-200 rounded mb-4 w-1/2"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Get current date and time
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Enhanced Chart Card Header Component - Unified Color Scheme
  const ChartCardHeader = ({ title, subtitle, icon: Icon, colorClass = 'blue' }) => {
    const colorStyles = {
      blue: { bg: 'from-slate-50/80 via-slate-50/40', text: 'text-slate-800', icon: 'bg-slate-100', iconColor: 'text-slate-700', accent: 'border-slate-200/50' },
      emerald: { bg: 'from-slate-50/80 via-slate-50/40', text: 'text-slate-800', icon: 'bg-slate-100', iconColor: 'text-slate-700', accent: 'border-slate-200/50' },
      purple: { bg: 'from-slate-50/80 via-slate-50/40', text: 'text-slate-800', icon: 'bg-slate-100', iconColor: 'text-slate-700', accent: 'border-slate-200/50' },
      amber: { bg: 'from-slate-50/80 via-slate-50/40', text: 'text-slate-800', icon: 'bg-slate-100', iconColor: 'text-slate-700', accent: 'border-slate-200/50' },
      rose: { bg: 'from-slate-50/80 via-slate-50/40', text: 'text-slate-800', icon: 'bg-slate-100', iconColor: 'text-slate-700', accent: 'border-slate-200/50' },
      cyan: { bg: 'from-slate-50/80 via-slate-50/40', text: 'text-slate-800', icon: 'bg-slate-100', iconColor: 'text-slate-700', accent: 'border-slate-200/50' },
      indigo: { bg: 'from-slate-50/80 via-slate-50/40', text: 'text-slate-800', icon: 'bg-slate-100', iconColor: 'text-slate-700', accent: 'border-slate-200/50' },
    };
    const colors = colorStyles[colorClass] || colorStyles.blue;
    return (
      <div className={`p-6 lg:p-8 border-b border-slate-200/40 bg-gradient-to-r ${colors.bg} to-transparent relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1 pr-4">
            <h2 className={`text-lg font-bold ${colors.text} tracking-tight mb-1`}>{title}</h2>
            {subtitle && <p className="text-sm text-slate-600/90 font-medium">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-xl ${colors.icon} border ${colors.accent} shadow-md hover:shadow-lg transition-all flex-shrink-0`}>
            <Icon className={`h-6 w-6 ${colors.iconColor}`} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in space-y-8 pb-12">

      {/* Professional Welcome Banner - Premium Design */}
      <div className="card-luxury p-0 overflow-hidden group hover:shadow-2xl transition-all duration-300 border border-slate-200/40">
        <div className="relative p-8 lg:p-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 backdrop-blur-xl overflow-hidden shadow-lg border-b border-white/10">
          {/* Enhanced Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/15 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>

          {/* Gradient Line Animation */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="text-white flex-1">
              <div className="flex items-center gap-3 mb-4 opacity-90">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <SparklesIcon className="h-6 w-6 text-white animate-pulse" />
                </div>
                <div className="flex flex-col gap-0">
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Bienvenue Retour</p>
                  <p className="text-white/80 text-xs font-semibold">{currentDate}</p>
                </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
                Bonjour, {(user?.FullName || 'Utilisateur').split(' ')[0]} ≡ƒæï
              </h1>
              <div className="space-y-3">
                <p className="text-white/90 text-base max-w-xl leading-relaxed font-medium">
                  Voici un aper├ºu de votre tableau de bord en temps r├⌐el avec tous vos KPI importants.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 bg-white/15 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
                    <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></div>
                    <span className="text-white/90 text-sm font-semibold">{reclamationStats?.openCount || 0} réclamations urgentes</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/15 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
                    <div className="w-2 h-2 rounded-full bg-blue-300 animate-pulse"></div>
                    <span className="text-white/90 text-sm font-semibold">{projectStats?.activeCount || 0} Projets actifs</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 justify-start lg:justify-end">
              <button
                onClick={() => navigate('/reclamations')}
                className="group/btn px-7 py-3 bg-white text-blue-600 rounded-xl text-sm font-bold uppercase tracking-wider shadow-2xl hover:shadow-3xl hover:-translate-y-1.5 transition-all flex items-center gap-2 border-2 border-white/20 hover:border-white/50 hover:bg-blue-50"
              >
                <DocumentTextIcon className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                Voir réclamations
              </button>
              <button
                onClick={() => navigate('/projets')}
                className="group/btn2 px-6 py-3 border-2 border-white/40 text-white rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-white/10 transition-all backdrop-blur-sm hover:border-white/60 hover:shadow-lg"
              >
                <BriefcaseIcon className="h-5 w-5 inline mr-2 group-hover/btn2:scale-110 transition-transform" />
                Voir Projets
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards - Professional Design with Enhanced Animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="group cursor-pointer"
            style={{
              animation: `slideUp 0.5s ease-out ${index * 0.08}s both`,
            }}
          >
            <style>{`
              @keyframes slideUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
            <div className={`card-luxury p-0 overflow-hidden h-full transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl border border-slate-200/40 bg-white flex flex-col`}>

              <div className="p-6 lg:p-7 flex flex-col h-full bg-gradient-to-br from-white/60 to-slate-50/40">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest letter-spacing-1 mb-2.5">{stat.name}</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent group-hover:from-slate-700 group-hover:to-slate-600 transition-all">{stat.value}</span>
                      {stat.unit && <span className="text-sm font-semibold text-slate-500">{stat.unit}</span>}
                    </div>
                  </div>
                  <div
                    className="p-4 rounded-2xl shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 flex-shrink-0 border border-slate-200/50"
                    style={{ background: getIconStyle(stat.color) }}
                  >
                    <stat.icon className="h-7 w-7 text-white" />
                  </div>
                </div>

                {/* Divider */}
                <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200/50 to-transparent mt-2"></div>

                {/* Footer Section */}
                <div className="mt-auto pt-5 border-t border-slate-200/50">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold flex items-center gap-1.5 ${stat.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {stat.trendUp ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                        {stat.trend}
                      </span>
                      <span className="text-xs font-medium text-slate-600 bg-slate-100/60 px-3 py-1.5 rounded-lg border border-slate-200/50 font-semibold">{stat.description}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* réclamations Status Chart - Professional Enhanced Design */}
        <div className="xl:col-span-4 card-luxury p-0 overflow-hidden group hover:shadow-lg transition-all duration-300 border border-slate-200/40 bg-white">
          <ChartCardHeader
            title="réclamations par Statut"
            subtitle={`Total: ${reclamationStats?.total} | Taux de Résolution: ${resolutionRate}%`}
            icon={DocumentTextIcon}
            colorClass="blue"
          />

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

          {/* D├⌐tail des statuts */}
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
          <div className="card-luxury p-0 overflow-hidden group hover:shadow-lg transition-all duration-300 border border-slate-200/40 bg-white">
            <ChartCardHeader
              title="Projets en cours"
              subtitle={`${projectStats?.activeCount} actifs sur ${projectStats?.total} total`}
              icon={BriefcaseIcon}
              colorClass="emerald"
            />

            <div className="p-6 lg:p-8">
              <div className="space-y-4">
                {Object.entries(projectStats?.byStatus || {}).map(([status, count]) => (
                  <div key={status} className="group/item">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="h-5 w-5 text-slate-600" />
                        <span className="text-sm font-semibold text-slate-700">{status}</span>
                      </div>
                      <span className="px-3 py-1 rounded-lg bg-slate-100/60 text-slate-700 text-sm font-bold border border-slate-200/50">{count}</span>
                    </div>
                    <div className="w-full bg-gradient-to-r from-slate-100 to-slate-50 rounded-lg h-3 overflow-hidden shadow-sm border border-slate-100/50">
                      <div
                        className="bg-gradient-to-r from-slate-400 to-slate-500 h-3 rounded-lg transition-all duration-500 group-hover/item:shadow-lg"
                        style={{ width: `${(count / (projectStats?.total || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Objectifs Achievement */}
          <div className="card-luxury p-0 overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-slate-200/40 bg-white">
            <ChartCardHeader
              title="Taux de R├⌐alisation Objectifs"
              subtitle={`${objectifStats?.achievementRate}% d'objectifs atteints`}
              icon={ArrowTrendingUpIcon}
              colorClass="purple"
            />

            <div className="p-6 lg:p-8">
              <div className="space-y-4">
                {Object.entries(objectifStats?.byStatus || {}).map(([status, count]) => (
                  <div key={status} className="group/item">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="h-5 w-5 text-slate-600" />
                        <span className="text-sm font-semibold text-slate-700">{status}</span>
                      </div>
                      <span className="px-3 py-1 rounded-lg bg-slate-100/60 text-slate-700 text-sm font-bold border border-slate-200/50">{count}</span>
                    </div>
                    <div className="w-full bg-gradient-to-r from-slate-100 to-slate-50 rounded-lg h-3 overflow-hidden shadow-sm border border-slate-100/50">
                      <div
                        className="bg-gradient-to-r from-slate-400 to-slate-500 h-3 rounded-lg transition-all duration-500 group-hover/item:shadow-lg"
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
        <div className="card-luxury p-0 overflow-hidden group hover:shadow-lg transition-all duration-300 border border-slate-200/30">
          <ChartCardHeader
            title="Devis"
            subtitle={`Montant total: ${(devisStats?.totalAmount / 1000).toFixed(1)}k TND`}
            icon={DocumentTextIcon}
            colorClass="amber"
          />

          <div className="p-6 lg:p-8 space-y-3">
            {Object.entries(devisStats?.byStatus || {}).map(([status, count]) => (
              <div key={status} className="group/devis flex items-center justify-between p-4 bg-gradient-to-r from-slate-50/70 to-transparent rounded-lg border border-slate-200/50 hover:shadow-md hover:bg-slate-50 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-slate-400 shadow-sm"></div>
                  <span className="text-sm font-semibold text-slate-700">{status}</span>
                </div>
                <span className="text-lg font-bold text-slate-700 group-hover/devis:scale-110 transition-transform px-3 py-1 rounded-lg bg-white/50 border border-slate-200/50">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Users Stats */}
        <div className="card-luxury p-0 overflow-hidden group hover:shadow-lg transition-all duration-300 border border-slate-200/30">
          <ChartCardHeader
            title="Utilisateurs"
            subtitle={`${userStats?.activeCount} actifs sur ${userStats?.total} total`}
            icon={UsersIcon}
            colorClass="cyan"
          />

          <div className="p-6 lg:p-8 space-y-3">
            {Object.entries(userStats?.byRole || {}).map(([role, count]) => (
              <div key={role} className="group/user flex items-center justify-between p-4 bg-gradient-to-r from-slate-50/70 to-transparent rounded-lg border border-slate-200/50 hover:shadow-md hover:bg-slate-50 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-slate-400 shadow-sm"></div>
                  <span className="text-sm font-semibold text-slate-700">{role}</span>
                </div>
                <span className="text-lg font-bold text-slate-700 group-hover/user:scale-110 transition-transform px-3 py-1 rounded-lg bg-white/50 border border-slate-200/50">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NOUVELLES STATISTIQUES */}

      {/* réclamations - Par Priorit├⌐ & Tendance Mensuelle */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* réclamations par Priorit├⌐ */}
        <div className="card-luxury p-0 overflow-hidden group hover:shadow-lg transition-all duration-300 border border-slate-200/40 bg-white">
          <ChartCardHeader
            title="réclamations par Priorit├⌐"
            subtitle={`Taux de Résolution: ${resolutionRate}%`}
            icon={ChartBarIcon}
            colorClass="rose"
          />

          <div className="p-6 lg:p-8">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis type="number" min="0" />
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
            <div className="text-center p-4 bg-slate-50/70 rounded-xl border border-slate-200/50 hover:shadow-md transition-all">
              <p className="text-2xl font-bold text-slate-800">{reclamationStats?.byPriority?.['Haute'] || 0}</p>
              <p className="text-xs text-slate-500 mt-1 font-semibold">Haute</p>
            </div>
            <div className="text-center p-4 bg-slate-50/70 rounded-xl border border-slate-200/50 hover:shadow-md transition-all">
              <p className="text-2xl font-bold text-slate-800">{reclamationStats?.byPriority?.['Moyenne'] || 0}</p>
              <p className="text-xs text-slate-500 mt-1 font-semibold">Moyenne</p>
            </div>
            <div className="text-center p-4 bg-slate-50/70 rounded-xl border border-slate-200/50 hover:shadow-md transition-all">
              <p className="text-2xl font-bold text-slate-800">{reclamationStats?.byPriority?.['Basse'] || 0}</p>
              <p className="text-xs text-slate-500 mt-1 font-semibold">Basse</p>
            </div>
          </div>
        </div>

        {/* Tendance Mensuelle */}
        <div className="card-luxury p-0 overflow-hidden group hover:shadow-lg transition-all duration-300">
          <ChartCardHeader
            title="Tendance Mensuelle"
            subtitle="├ëvolution des réclamations sur 6 mois"
            icon={ClockIcon}
            colorClass="blue"
          />

          <div className="p-6 lg:p-8">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData}>
                  <defs>
                    <linearGradient id="colorOuvertes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorResolues" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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

      {/* Performance Techniciens & Types de réclamations */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* Performance des Techniciens */}
        <div className="card-luxury p-0 overflow-hidden group hover:shadow-lg transition-all duration-300">
          <ChartCardHeader
            title="Performance Techniciens"
            subtitle="Top 5 techniciens par volume de réclamations"
            icon={UsersIcon}
            colorClass="purple"
          />

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
                <p>Aucune donn├⌐e de technicien disponible</p>
              </div>
            )}
          </div>

          {/* Performance KPIs */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-2 gap-4">
              {technicianStats.slice(0, 4).map((tech, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-br from-slate-50 to-slate-50/50 rounded-xl border border-slate-200/50 hover:shadow-md transition-all">
                  <p className="text-sm font-semibold text-slate-700 mb-2">{tech.name}</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold text-slate-800">{tech.total}</span>
                    <span className="text-xs font-bold text-slate-600">{tech.rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Types de réclamations */}
        <div className="card-luxury p-0 overflow-hidden group hover:shadow-lg transition-all duration-300 border border-slate-200/40 bg-white">
          <ChartCardHeader
            title="Types de réclamations"
            subtitle="R├⌐partition par cat├⌐gorie"
            icon={DocumentTextIcon}
            colorClass="cyan"
          />

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

          {/* D├⌐tail des types */}
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
        <div className="card-luxury p-0 overflow-hidden group hover:shadow-lg transition-all duration-300 border border-slate-200/40 bg-white">
          <ChartCardHeader
            title="Performance Commerciaux"
            subtitle="Top 5 commerciaux par chiffre d'affaires"
            icon={ArrowTrendingUpIcon}
            colorClass="amber"
          />

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
                    <Bar dataKey="devis" fill="#f59e0b" name="Devis cr├⌐├⌐s" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="valid├⌐s" fill="#10b981" name="Devis valid├⌐s" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                <p>Aucune donn├⌐e de commercial disponible</p>
              </div>
            )}
          </div>

          {/* Commercial KPIs */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-2 gap-4">
              {commercialStats.slice(0, 4).map((comm, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-br from-slate-50 to-slate-50/50 rounded-xl border border-slate-200/50 hover:shadow-md transition-all">
                  <p className="text-sm font-semibold text-slate-700 mb-1">{comm.name}</p>
                  <p className="text-lg font-bold text-slate-800">{comm.conversionRate}%</p>
                  <p className="text-xs text-slate-500 mt-2">{(comm.totalAmount / 1000).toFixed(1)}k TND</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tendance Mensuelle Devis */}
        <div className="card-luxury p-0 overflow-hidden group hover:shadow-lg transition-all duration-300 border border-slate-200/40 bg-white">
          <ChartCardHeader
            title="Tendance Devis Mensuelle"
            subtitle="├ëvolution des devis sur 6 mois"
            icon={ClockIcon}
            colorClass="emerald"
          />

          <div className="p-6 lg:p-8">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyDevisData}>
                  <defs>
                    <linearGradient id="colorDevis" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorValid├⌐s" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="devis" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorDevis)" name="Devis cr├⌐├⌐s" />
                  <Area type="monotone" dataKey="valid├⌐s" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorValid├⌐s)" name="Valid├⌐s" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Stats Summary */}
          <div className="px-6 pb-6 grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-50/70 rounded-xl border border-slate-200/50">
              <p className="text-2xl font-bold text-slate-800">{devisStats?.total || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Total Devis</p>
            </div>
            <div className="text-center p-4 bg-slate-50/70 rounded-xl border border-slate-200/50">
              <p className="text-2xl font-bold text-slate-800">{devisStats?.validatedCount || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Valid├⌐s</p>
            </div>
            <div className="text-center p-4 bg-slate-50/70 rounded-xl border border-slate-200/50">
              <p className="text-2xl font-bold text-slate-800">{devisStats?.pendingCount || 0}</p>
              <p className="text-xs text-slate-500 mt-1">En attente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Classement Commercial - Tableau d├⌐taill├⌐ */}
      <div className="card-luxury p-0 overflow-hidden group hover:shadow-lg transition-all duration-300 border border-slate-200/30">
        <div className="p-6 lg:p-8 border-b border-slate-100/30 bg-gradient-to-r from-indigo-50/50 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50/50 border border-indigo-200/50 shadow-sm">
              <ArrowTrendingUpIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Classement des Commerciaux</h2>
              <p className="text-sm text-slate-500 mt-0.5">Performance d├⌐taill├⌐e par commercial</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Rang</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Commercial</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Devis</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Valid├⌐s</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Taux Conv.</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">CA Total</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">CA Valid├⌐</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commercialStats.map((comm, idx) => (
                <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${idx === 0 ? 'bg-slate-700' : idx === 1 ? 'bg-slate-500' : idx === 2 ? 'bg-slate-400' : 'bg-slate-300'
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
                    Aucune donn├⌐e de commercial disponible
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======= ANALYSE AVANC├ëE - PRODUITS & OBJECTIFS ======= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Rendement Produits */}
        <div className="xl:col-span-7 card-luxury p-0 overflow-hidden group hover:shadow-lg transition-all duration-300 border border-slate-200/30">
          <ChartCardHeader
            title="Rendement des Produits"
            subtitle="Top 10 produits par chiffre d'affaires HT"
            icon={ChartBarIcon}
            colorClass="blue"
          />
          <div className="p-6 lg:p-8">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productYield} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="LibArt" type="category" width={150} tick={{ fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value) => [`${value.toLocaleString()} TND`, 'CA HT']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="totalHT" fill="url(#colorHT)" radius={[0, 4, 4, 0]}>
                    <defs>
                      <linearGradient id="colorHT" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Satisfaction Client Global */}
        <div className="xl:col-span-5 card-luxury p-0 overflow-hidden group hover:shadow-lg transition-all duration-300 border border-slate-200/30">
          <ChartCardHeader
            title="Satisfaction Client"
            subtitle="Index de satisfaction global (Basé sur IA)"
            icon={CheckCircleIcon}
            colorClass="emerald"
          />
          <div className="p-10 flex flex-col items-center justify-center h-full min-h-[320px]">
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Circular Progress Background */}
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                <circle 
                  cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                  strokeDasharray={552.9}
                  strokeDashoffset={552.9 - (552.9 * (globalSatisfaction?.score || 8.5)) / 10}
                  className="text-emerald-500 transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-slate-800">{globalSatisfaction?.score || '8.5'}</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">sur 10</span>
              </div>
            </div>
            <div className="mt-8 text-center">
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${
                (globalSatisfaction?.score || 8.5) > 7 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {globalSatisfaction?.label || 'Excellente'}
              </span>
              <p className="text-sm text-slate-500 mt-4 font-medium">
                Basé sur {globalSatisfaction?.resolvedClaims || 0} réclamations Résolues
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pr├⌐diction des Objectifs & Recommandations IA */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Pr├⌐dictions Commerciaux */}
        <div className="xl:col-span-8 card-luxury p-0 overflow-hidden group hover:shadow-lg transition-all duration-300 border border-slate-200/30 bg-white">
          <ChartCardHeader
            title="Estimation d'Atteinte des Objectifs"
            subtitle="Analyse prédictive basée sur le rythme actuel"
            icon={SparklesIcon}
            colorClass="purple"
          />
          <div className="p-6 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goalPredictions.length > 0 ? goalPredictions.map((pred, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{pred.commercial}</p>
                      <h4 className="text-lg font-bold text-slate-800 mt-1">Objectif: {pred.target.toLocaleString()} DT</h4>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      pred.willReach ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {pred.willReach ? 'En bonne voie' : '├Ç risque'}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                        <span>Probabilit├⌐ de succès</span>
                        <span>{pred.probability}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            pred.probability > 70 ? 'bg-emerald-500' : pred.probability > 40 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${pred.probability}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 py-3 border-t border-slate-100">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">R├⌐alis├⌐</p>
                        <p className="text-sm font-bold text-slate-700">{pred.actual.toLocaleString()} DT</p>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temps restant</p>
                        <p className="text-sm font-bold text-slate-700">{pred.daysRemaining} jours</p>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-2 py-10 text-center text-slate-400 font-medium">
                  Aucun objectif actif avec données de prédiction
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommandations IA */}
        <div className="xl:col-span-4 card-luxury p-0 overflow-hidden group hover:shadow-lg transition-all duration-300 border border-slate-200/30 bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
          <div className="p-6 lg:p-8 border-b border-white/10 bg-white/5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Conseils IA</h2>
                <p className="text-xs text-white/70 font-medium mt-1">Comment atteindre votre objectif</p>
              </div>
              <SparklesIcon className="h-6 w-6 text-amber-300 animate-pulse" />
            </div>
          </div>
          
          <div className="p-6 lg:p-8 space-y-6">
            {recommendations.length > 0 ? (
              <>
                <p className="text-sm font-medium text-white/90 leading-relaxed">
                  Pour combler votre ├⌐cart de <span className="font-bold text-amber-300">{(recommendations[0]?.qtyToSell * recommendations[0]?.avgPrice || 0).toLocaleString()} DT</span>, nous vous sugg├⌐rons :
                </p>
                <div className="space-y-4">
                  {recommendations.map((rec, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 transition-all">
                      <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">{rec.CodArt}</p>
                      <p className="text-sm font-bold mb-3">{rec.LibArt}</p>
                      <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg">
                        <span className="text-[10px] font-bold uppercase text-white/60">Vendre</span>
                        <span className="text-sm font-black text-amber-300">{rec.qtyToSell} unit├⌐s</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-10 text-center text-white/60">
                <p className="text-sm">F├⌐licitations ! Vous avez atteint votre objectif ou aucun objectif n'est d├⌐fini.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRÉDICTIONS RÉGIONALES IA (NOUVEAU) */}
      {isMLAvailable && regionalPredictions.length > 0 && (
        <div className="card-luxury p-0 overflow-hidden group hover:shadow-xl transition-all duration-300 border border-slate-200/30 bg-white">
          <ChartCardHeader
            title="Prédictions de Ventes par Gouvernorat (IA)"
            subtitle="Analyse prédictive basée sur le modèle Machine Learning (XGBoost/LSTM)"
            icon={SparklesIcon}
            colorClass="cyan"
          />
          <div className="p-6 lg:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {regionalPredictions.map((pred, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-md transition-all border-l-4" 
                     style={{ borderLeftColor: pred.prediction === 'HAUSSE' ? '#10b981' : '#ef4444' }}>
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-slate-700">{pred.region}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      pred.prediction === 'HAUSSE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {pred.prediction === 'HAUSSE' ? '📈' : '📉'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Confiance</p>
                      <p className="text-lg font-black text-slate-800">{Math.round(pred.confiance)}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Action</p>
                      <p className={`text-xs font-bold ${
                        pred.recommandation === 'AUGMENTER' ? 'text-green-600' : 'text-amber-600'
                      }`}>{pred.recommandation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="card-luxury p-6 text-center group hover:-translate-y-2 hover:shadow-xl transition-all cursor-pointer border-l-4 border-slate-400 bg-gradient-to-br from-slate-50/50 to-white/40 rounded-lg">
          <div className="w-12 h-12 rounded-lg bg-slate-100 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm border border-slate-200/50">
            <DocumentTextIcon className="h-6 w-6 text-slate-700" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800 group-hover:text-slate-900 transition-colors">{reclamationStats?.total || 0}</p>
          <p className="text-xs text-slate-600 mt-2 font-semibold uppercase tracking-wide">réclamations</p>
          <div className="mt-3 pt-3 border-t border-slate-200/50">
            <p className="text-xs text-slate-500 font-medium">{reclamationStats?.openCount} ouvertes</p>
          </div>
        </div>
        <div className="card-luxury p-6 text-center group hover:-translate-y-2 hover:shadow-xl transition-all cursor-pointer border-l-4 border-slate-400 bg-gradient-to-br from-slate-50/50 to-white/40 rounded-lg">
          <div className="w-12 h-12 rounded-lg bg-slate-100 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm border border-slate-200/50">
            <ClockIcon className="h-6 w-6 text-slate-700" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800 group-hover:text-slate-900 transition-colors">{reclamationStats?.openCount || 0}</p>
          <p className="text-xs text-slate-600 mt-2 font-semibold uppercase tracking-wide">En Attente</p>
          <div className="mt-3 pt-3 border-t border-slate-200/50">
            <p className="text-xs text-slate-500 font-medium">Priorit├⌐ haute</p>
          </div>
        </div>
        <div className="card-luxury p-6 text-center group hover:-translate-y-2 hover:shadow-xl transition-all cursor-pointer border-l-4 border-slate-400 bg-gradient-to-br from-slate-50/50 to-white/40 rounded-lg">
          <div className="w-12 h-12 rounded-lg bg-slate-100 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm border border-slate-200/50">
            <CheckCircleIcon className="h-6 w-6 text-slate-700" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800 group-hover:text-slate-900 transition-colors">{resolutionRate}%</p>
          <p className="text-xs text-slate-600 mt-2 font-semibold uppercase tracking-wide">Résolution</p>
          <div className="mt-3 pt-3 border-t border-slate-200/50">
            <p className="text-xs text-slate-500 font-medium">Taux mensuel</p>
          </div>
        </div>
        <div className="card-luxury p-6 text-center group hover:-translate-y-2 hover:shadow-xl transition-all cursor-pointer border-l-4 border-slate-400 bg-gradient-to-br from-slate-50/50 to-white/40 rounded-lg">
          <div className="w-12 h-12 rounded-lg bg-slate-100 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm border border-slate-200/50">
            <BriefcaseIcon className="h-6 w-6 text-slate-700" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800 group-hover:text-slate-900 transition-colors">{projectStats?.total || 0}</p>
          <p className="text-xs text-slate-600 mt-2 font-semibold uppercase tracking-wide">Projets</p>
          <div className="mt-3 pt-3 border-t border-slate-200/50">
            <p className="text-xs text-slate-500 font-medium">{projectStats?.activeCount} actifs</p>
          </div>
        </div>
        <div className="card-luxury p-6 text-center group hover:-translate-y-2 hover:shadow-xl transition-all cursor-pointer border-l-4 border-slate-400 bg-gradient-to-br from-slate-50/50 to-white/40 rounded-lg">
          <div className="w-12 h-12 rounded-lg bg-slate-100 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm border border-slate-200/50">
            <UserGroupIcon className="h-6 w-6 text-slate-700" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800 group-hover:text-slate-900 transition-colors">{tiersStats?.total || 0}</p>
          <p className="text-xs text-slate-600 mt-2 font-semibold uppercase tracking-wide">Clients</p>
          <div className="mt-3 pt-3 border-t border-slate-200/50">
            <p className="text-xs text-slate-500 font-medium">Base active</p>
          </div>
        </div>
        <div className="card-luxury p-6 text-center group hover:-translate-y-2 hover:shadow-xl transition-all cursor-pointer border-l-4 border-slate-400 bg-gradient-to-br from-slate-50/50 to-white/40 rounded-lg">
          <div className="w-12 h-12 rounded-lg bg-slate-100 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm border border-slate-200/50">
            <DocumentTextIcon className="h-6 w-6 text-slate-700" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800 group-hover:text-slate-900 transition-colors">{messagesStats?.unread || 0}</p>
          <p className="text-xs text-slate-600 mt-2 font-semibold uppercase tracking-wide">Messages</p>
          <div className="mt-3 pt-3 border-t border-slate-200/50">
            <p className="text-xs text-slate-500 font-medium">Non lus</p>
          </div>
        </div>
      </div>

      {/* Recent Activities - Enhanced Professional Design */}
      <div className="card-luxury p-0 overflow-hidden group hover:shadow-xl transition-all duration-300 border border-slate-200/30">
        <div className="px-6 py-5 border-b border-slate-200/40 bg-gradient-to-r from-slate-50/60 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50/50 border border-blue-200/50 group-hover:scale-110 transition-all duration-300 shadow-md hover:shadow-lg">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Activit├⌐s R├⌐centes</h3>
              <p className="text-sm text-slate-600/80 font-medium mt-0.5">Derni├¿res mises ├á jour du syst├¿me</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/activities')}
            className="text-xs font-bold text-blue-600 uppercase tracking-wider hover:bg-blue-50 px-4 py-2 rounded-lg transition-all hover:translate-x-1"
          >
            Voir tout ΓåÆ
          </button>
        </div>
        <div className="divide-y divide-slate-200/40">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, idx) => (
              <div
                key={activity.id}
                className="p-5 px-6 hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-transparent transition-all cursor-pointer group/item"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover/item:scale-110 group-hover/item:shadow-md bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 border border-blue-200/50">
                    <DocumentTextIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate group-hover/item:text-blue-600 transition-colors">{activity.title}</p>
                    <p className="text-xs text-slate-500 truncate mt-1">{activity.client}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full group-hover/item:bg-blue-100 transition-colors">
                      {activity.time}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-slate-400 text-sm">Aucune activit├⌐ r├⌐cente</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;

