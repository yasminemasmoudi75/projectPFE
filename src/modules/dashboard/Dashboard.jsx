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

/* Mapping nom affiché ↔ clé API Flask (MAJUSCULES_UNDERSCORE) */
const GOUVERNORATS = [
  { name: 'Tunis',       key: 'TUNIS'      },
  { name: 'Sfax',        key: 'SFAX'       },
  { name: 'Sousse',      key: 'SOUSSE'     },
  { name: 'Nabeul',      key: 'NABEUL'     },
  { name: 'Ben Arous',   key: 'BEN_AROUS'  },
  { name: 'Ariana',      key: 'ARIANA'     },
  { name: 'Bizerte',     key: 'BIZERTE'    },
  { name: 'Monastir',    key: 'MONASTIR'   },
  { name: 'Manouba',     key: 'MANOUBA'    },
  { name: 'Gabès',       key: 'GABES'      },
  { name: 'Gafsa',       key: 'GAFSA'      },
  { name: 'Kairouan',    key: 'KAIROUAN'   },
  { name: 'Mahdia',      key: 'MAHDIA'     },
  { name: 'Médenine',    key: 'MEDENINE'   },
  { name: 'Béja',        key: 'BEJA'       },
  { name: 'Jendouba',    key: 'JENDOUBA'   },
  { name: 'Kef',         key: 'LE_KEF'     },
  { name: 'Kasserine',   key: 'KASSERINE'  },
  { name: 'Sidi Bouzid', key: 'SIDI_BOUZID'},
  { name: 'Siliana',     key: 'SILIANA'    },
  { name: 'Zaghouan',    key: 'ZAGHOUAN'   },
  { name: 'Kébili',      key: 'KEBILI'     },
  { name: 'Tozeur',      key: 'TOZEUR'     },
  { name: 'Tataouine',   key: 'TATAOUINE'  },
];
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

  // Sélecteur trimestre ML
  const [mlTrimestre, setMlTrimestre] = useState(3);
  const [mlYear, setMlYear]           = useState(new Date().getFullYear());
  const [mlLoading, setMlLoading]     = useState(false);

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

        // Fetch ML Regional Predictions — tous les 24 gouvernorats (clés API)
        try {
          const govKeys = GOUVERNORATS.map(g => g.key);
          const mlData = await predictionService.predictBatch(govKeys, 3, new Date().getFullYear());
          const results = mlData?.results || mlData?.predictions || [];
          setRegionalPredictions(results);
          setIsMLAvailable(results.length > 0);
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

  /* Recharger les prédictions ML quand trimestre/année change */
  const fetchMlPredictions = async (t, y) => {
    setMlLoading(true);
    try {
      const govKeys = GOUVERNORATS.map(g => g.key);
      const mlData  = await predictionService.predictBatch(govKeys, t, y);
      const results = mlData?.results || mlData?.predictions || [];
      setRegionalPredictions(results);
      setIsMLAvailable(results.length > 0);
    } catch {
      setIsMLAvailable(false);
    } finally {
      setMlLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <div className="h-40 bg-slate-100 rounded-3xl" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-100 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const ICON_PALETTE = {
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-500',    border: 'border-blue-100',    bar: 'bg-blue-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-500', border: 'border-emerald-100', bar: 'bg-emerald-500' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-500',   border: 'border-amber-100',   bar: 'bg-amber-500' },
    purple:  { bg: 'bg-violet-50',  text: 'text-violet-500',  border: 'border-violet-100',  bar: 'bg-violet-500' },
    rose:    { bg: 'bg-rose-50',    text: 'text-rose-500',    border: 'border-rose-100',    bar: 'bg-rose-500' },
    cyan:    { bg: 'bg-cyan-50',    text: 'text-cyan-500',    border: 'border-cyan-100',    bar: 'bg-cyan-500' },
    indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-500',  border: 'border-indigo-100',  bar: 'bg-indigo-500' },
    sky:     { bg: 'bg-sky-50',     text: 'text-sky-500',     border: 'border-sky-100',     bar: 'bg-sky-500' },
    teal:    { bg: 'bg-teal-50',    text: 'text-teal-500',    border: 'border-teal-100',    bar: 'bg-teal-500' },
  };

  const CardHeader = ({ title, subtitle, icon: Icon, color = 'blue' }) => {
    const p = ICON_PALETTE[color] || ICON_PALETTE.blue;
    return (
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-none ${p.bg} border ${p.border}`}>
          <Icon className={`h-4 w-4 ${p.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-800 truncate">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
    );
  };

  const kpiCards = [
    { label: 'Clients',        value: tiersStats?.total || 0,             sub: `Base active`,                           icon: UserGroupIcon,       color: 'emerald' },
    { label: 'Devis',          value: devisStats?.total || 0,             sub: `${(devisStats?.totalAmount/1000||0).toFixed(1)}k TND`, icon: DocumentTextIcon,    color: 'sky' },
    { label: 'Projets actifs', value: projectStats?.activeCount || 0,     sub: `${projectStats?.total||0} total`,       icon: BriefcaseIcon,       color: 'indigo' },
    { label: 'Objectifs',      value: `${objectifStats?.achievementRate||0}%`, sub: `${objectifStats?.achievedCount||0}/${objectifStats?.total||0} atteints`, icon: ArrowTrendingUpIcon, color: 'purple' },
    { label: 'SAV ouvert',     value: reclamationStats?.openCount || 0,   sub: `Taux résol. ${resolutionRate}%`,        icon: ClockIcon,           color: 'rose' },
    { label: 'Utilisateurs',   value: userStats?.total || 0,              sub: `${userStats?.activeCount||0} actifs`,   icon: UsersIcon,           color: 'amber' },
    { label: 'Livraisons',     value: stats.find(s=>s.name==='Livraisons')?.value || 0, sub: 'Total',           icon: TruckIcon,           color: 'teal' },
    { label: 'Factures',       value: stats.find(s=>s.name==='Factures')?.value || 0, sub: 'Total',            icon: CurrencyDollarIcon,  color: 'cyan' },
  ];

  return (
    <div className="space-y-5 pb-12">

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <SparklesIcon className="h-4 w-4 text-indigo-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{currentDate}</p>
            </div>
            <h1 className="text-3xl font-black text-slate-800">
              Bonjour,{' '}
              <span className="bg-gradient-to-r from-indigo-500 to-sky-500 bg-clip-text text-transparent">
                {(user?.FullName || 'Utilisateur').split(' ')[0]}
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">Vue d'ensemble de votre activité en temps réel</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
              {reclamationStats?.openCount || 0} SAV ouverts
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              {projectStats?.activeCount || 0} projets actifs
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {objectifStats?.achievedCount || 0}/{objectifStats?.total || 0} objectifs
            </span>
            <button onClick={() => navigate('/reclamations')}
              className="h-8 px-4 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl transition-all shadow-sm">
              Voir SAV
            </button>
          </div>
        </div>
      </div>

      {/* KPI Grid — 8 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {kpiCards.map((kpi, i) => {
          const p = ICON_PALETTE[kpi.color] || ICON_PALETTE.blue;
          return (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-2">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-none ${p.bg} border ${p.border}`}>
                <kpi.icon className={`h-4 w-4 ${p.text}`} />
              </div>
              <p className="text-2xl font-black text-slate-800 leading-none">{kpi.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{kpi.label}</p>
              <p className="text-[10px] text-slate-300">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Row 1 — SAV donut · Projects bars · Objectifs gauge */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* SAV by status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CardHeader title="SAV par Statut" subtitle={`Total: ${reclamationStats?.total || 0} · Résolution: ${resolutionRate}%`} icon={DocumentTextIcon} color="rose" />
          <div className="p-5 flex justify-center">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={Object.values(STATUS_COLORS)[i % 4]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="px-5 pb-5 space-y-2">
            {Object.entries(reclamationStats?.byStatus || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[status] || '#94a3b8' }} />
                  <span className="text-xs text-slate-600">{status}</span>
                </div>
                <span className="text-xs font-bold text-slate-800">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Projects progress */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CardHeader title="Projets" subtitle={`${projectStats?.activeCount || 0} actifs / ${projectStats?.total || 0} total`} icon={BriefcaseIcon} color="indigo" />
          <div className="p-5 space-y-4">
            {Object.entries(projectStats?.byStatus || {}).map(([status, count]) => {
              const total = projectStats?.total || 1;
              const pct = Math.round((count / total) * 100);
              const colorMap = { 'Actif': 'bg-indigo-400', 'Complété': 'bg-emerald-400', 'En attente': 'bg-amber-400', 'Suspendu': 'bg-rose-400' };
              return (
                <div key={status}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-600 font-medium">{status}</span>
                    <span className="text-xs font-bold text-slate-700">{count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-2 rounded-full transition-all ${colorMap[status] || 'bg-slate-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Objectifs gauge */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CardHeader title="Objectifs" subtitle="Taux d'atteinte global" icon={ArrowTrendingUpIcon} color="purple" />
          <div className="p-5 flex flex-col items-center gap-4">
            <div className="relative h-40 w-40">
              <svg className="w-full h-full -rotate-90">
                <circle cx="80" cy="80" r="68" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                <circle cx="80" cy="80" r="68" stroke="#8b5cf6" strokeWidth="10" fill="transparent"
                  strokeDasharray={427}
                  strokeDashoffset={427 - (427 * Number(objectifStats?.achievementRate || 0)) / 100}
                  className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800">{objectifStats?.achievementRate || 0}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">atteints</span>
              </div>
            </div>
            <div className="w-full space-y-2">
              {Object.entries(objectifStats?.byStatus || {}).map(([status, count]) => (
                <div key={status} className="flex justify-between">
                  <span className="text-xs text-slate-500">{status}</span>
                  <span className="text-xs font-bold text-slate-700">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 — Monthly trends */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* SAV monthly */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CardHeader title="Tendance SAV Mensuelle" subtitle="6 derniers mois" icon={ChartBarIcon} color="blue" />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyTrendData}>
                <defs>
                  <linearGradient id="gSAVOuv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSAVRes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="ouvertes" stroke="#3b82f6" strokeWidth={2} fill="url(#gSAVOuv)" name="Ouvertes" />
                <Area type="monotone" dataKey="resolues" stroke="#10b981" strokeWidth={2} fill="url(#gSAVRes)" name="Résolues" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Devis monthly */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CardHeader title="Tendance Devis Mensuelle" subtitle="6 derniers mois" icon={CurrencyDollarIcon} color="sky" />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyDevisData}>
                <defs>
                  <linearGradient id="gDevis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDevisVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="devis" stroke="#0ea5e9" strokeWidth={2} fill="url(#gDevis)" name="Devis" />
                <Area type="monotone" dataKey="valides" stroke="#8b5cf6" strokeWidth={2} fill="url(#gDevisVal)" name="Validés" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3 — SAV priority · Techniciens · Types */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* SAV by priority */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CardHeader title="SAV par Priorité" subtitle="Distribution actuelle" icon={ChartBarIcon} color="rose" />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={priorityChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={55} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Nombre">
                  {priorityChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Techniciens */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CardHeader title="Top Techniciens" subtitle="Réclamations assignées" icon={UsersIcon} color="teal" />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={technicianStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="total" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="resolved" fill="#99f6e4" radius={[4, 4, 0, 0]} name="Résolues" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Types SAV */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CardHeader title="Types de SAV" subtitle="Répartition par catégorie" icon={ChartBarIcon} color="amber" />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={typeReclamationData} cx="50%" cy="50%" outerRadius={70} dataKey="value" paddingAngle={2}>
                  {typeReclamationData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4 — Commercial performance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Bar chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CardHeader title="Performance Commerciaux" subtitle="Devis par commercial" icon={ChartBarIcon} color="sky" />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={commercialDevisData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="devis" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Total devis" />
                <Bar dataKey="valides" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Validés" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ranking table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CardHeader title="Classement Commerciaux" subtitle="Par montant total" icon={ArrowTrendingUpIcon} color="purple" />
          <div className="p-5 space-y-3">
            {commercialStats.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black flex-none ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-600'}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">{c.fullName}</p>
                  <p className="text-[10px] text-slate-400">{c.total} devis · {c.conversionRate}% conversion</p>
                </div>
                <span className="text-xs font-black text-slate-800 tabular-nums">{(c.totalAmount / 1000).toFixed(1)}k</span>
              </div>
            ))}
            {commercialStats.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Aucune donnée disponible</p>}
          </div>
        </div>
      </div>

      {/* Row 5 — Devis detail · Users · Products */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Devis status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CardHeader title="Statut Devis" subtitle={`${devisStats?.total || 0} devis total`} icon={DocumentTextIcon} color="sky" />
          <div className="p-5 space-y-3">
            {Object.entries(devisStats?.byStatus || {}).map(([status, count]) => {
              const total = devisStats?.total || 1;
              const pct = Math.round((count / total) * 100);
              const colorMap = { 'En attente': 'bg-amber-400', 'Validé': 'bg-emerald-400', 'Transformé': 'bg-indigo-400' };
              return (
                <div key={status}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-600">{status}</span>
                    <span className="text-xs font-bold text-slate-700">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-2 rounded-full transition-all ${colorMap[status] || 'bg-slate-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-400">Montant total</p>
              <p className="text-lg font-black text-slate-800">{((devisStats?.totalAmount || 0) / 1000).toFixed(1)}k TND</p>
            </div>
          </div>
        </div>

        {/* Users by role */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CardHeader title="Utilisateurs par Rôle" subtitle={`${userStats?.activeCount || 0} actifs sur ${userStats?.total || 0}`} icon={UsersIcon} color="amber" />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={Object.entries(userStats?.byRole || {}).map(([name, value]) => ({ name, value }))}
                  cx="50%" cy="50%" outerRadius={65} dataKey="value" paddingAngle={2}>
                  {Object.keys(userStats?.byRole || {}).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CardHeader title="Rendement Produits" subtitle="Performance relative" icon={ChartBarIcon} color="emerald" />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={productYield.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="yield" fill="#10b981" radius={[0, 6, 6, 0]} name="Rendement" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 6 — Satisfaction · Goal predictions · IA */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Global satisfaction */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CardHeader title="Satisfaction Client" subtitle="Score global" icon={SparklesIcon} color="emerald" />
          <div className="p-5 flex flex-col items-center gap-3">
            <div className="relative h-36 w-36">
              <svg className="w-full h-full -rotate-90">
                <circle cx="72" cy="72" r="62" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                <circle cx="72" cy="72" r="62" stroke="#10b981" strokeWidth="10" fill="transparent"
                  strokeDasharray={389.6}
                  strokeDashoffset={389.6 - (389.6 * (globalSatisfaction?.score || 8.5)) / 10}
                  className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800">{globalSatisfaction?.score || '8.5'}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">/ 10</span>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${(globalSatisfaction?.score || 8.5) > 7 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
              {globalSatisfaction?.label || 'Excellente'}
            </span>
            <p className="text-xs text-slate-400 text-center">Basé sur {globalSatisfaction?.resolvedClaims || 0} réclamations résolues</p>
          </div>
        </div>

        {/* Goal predictions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CardHeader title="Prédiction Objectifs" subtitle="Analyse prédictive" icon={ArrowTrendingUpIcon} color="purple" />
          <div className="p-5 space-y-3 overflow-y-auto max-h-64">
            {goalPredictions.length > 0 ? goalPredictions.slice(0, 4).map((pred, i) => (
              <div key={i} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs font-bold text-slate-700 truncate flex-1">{pred.commercial}</p>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${pred.willReach ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {pred.willReach ? '✓ Atteindra' : '✗ À risque'}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-1.5 rounded-full ${pred.willReach ? 'bg-emerald-400' : 'bg-rose-400'}`}
                    style={{ width: `${Math.min(100, Math.round((pred.currentProgress / pred.target) * 100) || 0)}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{Math.round((pred.currentProgress / pred.target) * 100) || 0}% — {pred.target.toLocaleString()} DT</p>
              </div>
            )) : (
              <p className="text-xs text-slate-400 text-center py-8">Aucune prédiction disponible</p>
            )}
          </div>
        </div>

        {/* IA recommendations */}
        <div className="bg-indigo-950 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-indigo-900/60 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-800 border border-indigo-700 flex items-center justify-center flex-none">
              <SparklesIcon className="h-4 w-4 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Recommandations IA</h3>
              <p className="text-xs text-indigo-400">Insights intelligents</p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {recommendations.length > 0 ? recommendations.slice(0, 4).map((rec, i) => (
              <div key={i} className="flex gap-2">
                <span className="mt-0.5 h-4 w-4 rounded-full bg-indigo-800 text-indigo-300 flex items-center justify-center text-[9px] font-bold flex-none">{i + 1}</span>
                <p className="text-xs text-indigo-200 leading-relaxed">{rec.message || rec}</p>
              </div>
            )) : (
              <div className="space-y-2">
                {[
                  `Taux de résolution SAV: ${resolutionRate}%`,
                  `${projectStats?.activeCount || 0} projets actifs en cours`,
                  `${objectifStats?.achievementRate || 0}% des objectifs atteints`
                ].map((msg, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="mt-0.5 h-4 w-4 rounded-full bg-indigo-800 text-indigo-300 flex items-center justify-center text-[9px] font-bold flex-none">{i + 1}</span>
                    <p className="text-xs text-indigo-200">{msg}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Prévisions des Ventes ── */}
      {(() => {
        /* régression linéaire sur monthlyDevisData pour prédire 3 mois */
        const hist = monthlyDevisData || [];
        const n = hist.length;
        const xM = (n - 1) / 2;
        const yMd = n ? hist.reduce((s, d) => s + (d.devis || 0), 0) / n : 0;
        const yMm = n ? hist.reduce((s, d) => s + (d.montant || 0), 0) / n : 0;
        let nd = 0, nm = 0, den = 0;
        hist.forEach((d, i) => {
          nd  += (i - xM) * ((d.devis   || 0) - yMd);
          nm  += (i - xM) * ((d.montant || 0) - yMm);
          den += (i - xM) ** 2;
        });
        const sd = den ? nd / den : 0, id = yMd - sd * xM;
        const sm = den ? nm / den : 0, im = yMm - sm * xM;
        const mnames = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
        const now = new Date();
        const future = [1, 2, 3].map(i => {
          const dt = new Date(now.getFullYear(), now.getMonth() + i, 1);
          return {
            name: mnames[dt.getMonth()],
            prevDevis:   Math.max(0, Math.round(id + sd * (n + i - 1))),
            prevMontant: Math.max(0, Math.round(im + sm * (n + i - 1))),
          };
        });
        /* données combinées historique + prévision */
        const combined = [
          ...hist.map(d => ({ name: d.name, actuel: d.devis, montant: d.montant })),
          ...future.map(f => ({ name: f.name + ' ★', prevDevis: f.prevDevis, prevMontant: f.prevMontant }))
        ];
        /* raccordement : dernier point historique = premier point prévision */
        if (n > 0 && future.length > 0) combined[n - 1].prevDevis = hist[n - 1].devis;

        const growth = sd > 0 ? 'hausse' : sd < 0 ? 'baisse' : 'stable';
        const growthColor = sd > 0 ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                          : sd < 0 ? 'text-rose-600 bg-rose-50 border-rose-200'
                          : 'text-slate-600 bg-slate-100 border-slate-200';
        const nextMonthDevis   = future[0]?.prevDevis || 0;
        const nextMonthMontant = future[0]?.prevMontant || 0;

        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* en-tête */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                  <SparklesIcon className="h-4 w-4 text-violet-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Prévisions des Ventes</h3>
                  <p className="text-xs text-slate-400">Projection — 3 prochains mois (★)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${growthColor}`}>
                  Tendance : {growth}
                </span>
                {isMLAvailable && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">ML actif</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4">
              {/* graphique principal */}
              <div className="xl:col-span-3 p-5">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={combined}>
                    <defs>
                      <linearGradient id="gActuel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gPrev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                      formatter={(val, name) => [val, name === 'actuel' ? 'Réel' : 'Prévu']}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }}
                      formatter={v => v === 'actuel' ? 'Devis réels' : 'Devis prévus ★'} />
                    <Area type="monotone" dataKey="actuel"    stroke="#0ea5e9" strokeWidth={2} fill="url(#gActuel)" dot={false} connectNulls={false} />
                    <Area type="monotone" dataKey="prevDevis" stroke="#8b5cf6" strokeWidth={2} fill="url(#gPrev)"   dot={false} strokeDasharray="5 3" connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* métriques prévues */}
              <div className="xl:col-span-1 border-t xl:border-t-0 xl:border-l border-slate-100 p-5 flex flex-col gap-4 justify-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mois prochain</p>
                <div>
                  <p className="text-3xl font-black text-slate-800">{nextMonthDevis}</p>
                  <p className="text-xs text-slate-400 mt-0.5">devis prévus</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-violet-600">{nextMonthMontant}k</p>
                  <p className="text-xs text-slate-400 mt-0.5">TND estimé</p>
                </div>
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  {future.map((f, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-500">{mnames[(now.getMonth() + i + 1) % 12]}</span>
                      <span className="text-[11px] font-bold text-violet-600">{f.prevDevis} devis</span>
                    </div>
                  ))}
                </div>
                {isMLAvailable && regionalPredictions.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Top régions ML</p>
                    {regionalPredictions.slice(0, 3).map((r, i) => (
                      <div key={i} className="flex justify-between text-[11px] py-0.5">
                        <span className="text-slate-500">{r.region}</span>
                        <span className="font-bold text-emerald-600">{r.prediction}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 24 Gouvernorats — Prédictions ML ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center flex-none">
              <SparklesIcon className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Recommandations Commerciaux par Gouvernorat</h3>
              <p className="text-xs text-slate-400">Tunisie · 24 gouvernorats · faut-il augmenter ou réduire les commerciaux ?</p>
            </div>
          </div>

          {/* Sélecteur trimestre + année */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-xl border border-slate-200 overflow-hidden text-[11px] font-bold">
              {[1,2,3,4].map(t => (
                <button key={t}
                  onClick={() => { setMlTrimestre(t); fetchMlPredictions(t, mlYear); }}
                  className={`px-3 py-1.5 transition-all ${mlTrimestre === t ? 'bg-violet-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                  T{t}
                </button>
              ))}
            </div>
            <select
              value={mlYear}
              onChange={e => { const y = Number(e.target.value); setMlYear(y); fetchMlPredictions(mlTrimestre, y); }}
              className="h-8 px-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-600 focus:outline-none focus:border-violet-400">
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {mlLoading && <span className="text-[10px] text-slate-400 animate-pulse">Chargement…</span>}
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">↑ Augmenter</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">→ Maintenir</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-500 border border-rose-200">↓ Réduire</span>
            </div>
            {isMLAvailable
              ? <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">ML actif</span>
              : <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-400 border border-slate-200">ML hors ligne</span>
            }
          </div>
        </div>

        {/* Compteurs recommandations commerciaux */}
        {isMLAvailable && (() => {
          const getReco = r => (r.recommandation || '').toUpperCase();
          const augmenter = (regionalPredictions || []).filter(r => getReco(r) === 'AUGMENTER').length;
          const maintenir = (regionalPredictions || []).filter(r => getReco(r) === 'MAINTENIR').length;
          const reduire   = (regionalPredictions || []).filter(r => getReco(r) === 'RÉDUIRE' || getReco(r) === 'REDUIRE').length;
          return (
            <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3">
                <span className="text-4xl font-black text-emerald-600">{augmenter}</span>
                <div>
                  <p className="text-sm font-black text-emerald-700">↑ Augmenter</p>
                  <p className="text-[11px] text-emerald-500">commerciaux à déployer</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
                <span className="text-4xl font-black text-amber-600">{maintenir}</span>
                <div>
                  <p className="text-sm font-black text-amber-700">→ Maintenir</p>
                  <p className="text-[11px] text-amber-500">effectif stable</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-5 py-3">
                <span className="text-4xl font-black text-rose-600">{reduire}</span>
                <div>
                  <p className="text-sm font-black text-rose-700">↓ Réduire</p>
                  <p className="text-[11px] text-rose-500">commerciaux à retirer</p>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {GOUVERNORATS.map((g) => {
            const r         = (regionalPredictions || []).find(x => x.region === g.key);
            const prob      = r != null ? Math.round(r.probabilite_hausse ?? 0) : null;
            const reco      = (r?.recommandation || '').toUpperCase().replace('É','E');
            const confiance = r != null ? Math.round(r.confiance ?? 0) : null;
            const hasData   = !!r;

            const styles = {
              AUGMENTER: {
                card:  'bg-white border-slate-200',
                badge: 'bg-emerald-100 text-emerald-700',
                text:  'text-emerald-700',
                bar:   'bg-emerald-400',
                icon:  '↑',
                label: 'Augmenter',
                sub:   'Renforcer les commerciaux',
              },
              MAINTENIR: {
                card:  'bg-white border-slate-200',
                badge: 'bg-amber-100 text-amber-700',
                text:  'text-amber-700',
                bar:   'bg-amber-400',
                icon:  '→',
                label: 'Maintenir',
                sub:   'Effectif stable',
              },
              REDUIRE: {
                card:  'bg-white border-slate-200',
                badge: 'bg-rose-100 text-rose-600',
                text:  'text-rose-600',
                bar:   'bg-rose-400',
                icon:  '↓',
                label: 'Réduire',
                sub:   'Alléger les commerciaux',
              },
              DEFAULT: {
                card:  'bg-white border-slate-200',
                badge: 'bg-slate-100 text-slate-400',
                text:  'text-slate-300',
                bar:   'bg-slate-200',
                icon:  '—',
                label: '—',
                sub:   '',
              },
            };
            const s = styles[reco] || styles.DEFAULT;
            const radius = 26, circ = 2 * Math.PI * radius;
            const offset = hasData ? circ - (circ * (prob / 100)) : circ;

            return (
              <div key={g.name}
                className={`rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${s.card}`}>

                <div className="p-4 flex flex-col gap-3">

                  {/* nom + badge */}
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs font-black text-slate-800 leading-tight">{g.name}</p>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap flex-none ${s.badge}`}>
                      {s.icon} {s.label}
                    </span>
                  </div>

                  {/* jauge SVG circulaire + probabilité */}
                  <div className="flex items-center gap-3">
                    <svg width="60" height="60" className="flex-none -rotate-90">
                      <circle cx="30" cy="30" r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="5" />
                      <circle cx="30" cy="30" r={radius} fill="none"
                        stroke={!hasData ? '#cbd5e1' : reco === 'AUGMENTER' ? '#10b981' : reco === 'MAINTENIR' ? '#f59e0b' : '#f43f5e'}
                        strokeWidth="5"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                      />
                      <text x="30" y="30" textAnchor="middle" dominantBaseline="central"
                        className="rotate-90" style={{ transform: 'rotate(90deg)', transformOrigin: '30px 30px', fontSize: 11, fontWeight: 900, fill: !hasData ? '#94a3b8' : reco === 'AUGMENTER' ? '#059669' : reco === 'MAINTENIR' ? '#d97706' : '#e11d48' }}>
                        {hasData ? `${prob}%` : '—'}
                      </text>
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-bold leading-tight ${s.text}`}>{s.sub}</p>
                      {hasData
                        ? <p className="text-[10px] text-slate-400 mt-1">Confiance <span className="font-bold text-slate-600">{confiance}%</span></p>
                        : <p className="text-[10px] text-slate-300 mt-1">en attente ML</p>
                      }
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent activities */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader title="Activités Récentes" subtitle="Dernières interactions" icon={ClockIcon} color="blue" />
        <div className="divide-y divide-slate-50">
          {recentActivities.length > 0 ? recentActivities.map((activity, i) => (
            <div key={i} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
              <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-none">
                <DocumentTextIcon className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 truncate">{activity.title}</p>
                <p className="text-[10px] text-slate-400 truncate">{activity.client}</p>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{activity.time}</span>
            </div>
          )) : (
            <div className="px-5 py-8 text-center">
              <p className="text-xs text-slate-400">Aucune activité récente</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
