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
  TruckIcon,
  XMarkIcon,
  FunnelIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
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
  if (phase.includes('clôt') || phase.includes('clot') || progress >= 100) return 'Complété';

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
  if (normalizeBoolean(devis?.bTransf)) return 'Transformé';
  if (normalizeBoolean(devis?.Valid)) return 'Validé';
  return 'En attente';
};
const isValidatedDevis = (devis) => ['Validé', 'Transformé'].includes(getDevisStatus(devis));
const getUserRole = (userItem) => userItem?.UserRole || userItem?.Role || 'User';
const isUserActive = (userItem) => userItem?.IsActive == null || normalizeBoolean(userItem.IsActive);
const isUnreadMessage = (message) => !normalizeBoolean(message?.Delivered);



const Dashboard = () => {
  const { user } = useAuth();
  const { allPermissions } = usePermission();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('week');
  const [activeDashTab, setActiveDashTab] = useState('apercu');
  const [selectedCommercial, setSelectedCommercial] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  const normalizedRole = String(user?.UserRole || '').trim().toLowerCase();
  const isClientDash      = normalizedRole === 'client';
  const isTechnicienDash  = ['technicien', 'technicien sav'].includes(normalizedRole);
  const isAgentDash       = normalizedRole === 'agent';
  const isCommercialDash  = ['commercial', 'commerciale'].includes(normalizedRole);

  // Helper: Vérifier si un module est actif
  const hasModuleAccess = (moduleCode) => {
    if (!moduleCode) return true; // Pas de vérification si pas de code
    const target = Number(moduleCode);
    return allPermissions.some((p) => Number(p.moduleCode) === target && p.isActive === true);
  };

  // Sélecteur trimestre ML
  const [mlTrimestre, setMlTrimestre] = useState(3);
  const [mlYear, setMlYear]           = useState(new Date().getFullYear());
  const [mlLoading, setMlLoading]     = useState(false);

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
  const [clientPaymentStats, setClientPaymentStats] = useState(null);

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
  const [allCommercialNames, setAllCommercialNames] = useState([]);

  // Raw data for client-side date filtering
  const [rawDevis, setRawDevis] = useState([]);
  const [rawReclamations, setRawReclamations] = useState([]);
  const [rawActivites, setRawActivites] = useState([]);

  // Date filter states
  const [agentPeriod, setAgentPeriod] = useState('month');
  const [agentYear,   setAgentYear]   = useState('all');
  const [commDateFrom, setCommDateFrom] = useState('');
  const [commDateTo,   setCommDateTo]   = useState('');
  const [commYear,     setCommYear]     = useState('all');
  const [techPeriod,  setTechPeriod]  = useState('month');
  const [techYear,    setTechYear]    = useState('all');

  // Helper: compute date range from year + period
  const getRange = (year, period) => {
    if (year !== 'all') {
      const y = Number(year);
      return { start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1) };
    }
    const days = { week:7, month:30, '3months':90, year:365 }[period] || 30;
    return { start: new Date(Date.now() - days * 86400000), end: new Date(Date.now() + 86400000) };
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i));

  // Fetch les données au chargement
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

        // Traiter les données de réclamations
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

        // Statistiques par priorité pour graphique
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
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
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
        setRawReclamations(reclamations);

        // Traiter les données de projets
        const projects = getCollection(projectsRes);
        const projectsByStatus = {
          'Actif': projects.filter(p => getProjectStatus(p) === 'Actif').length,
          'Complété': projects.filter(p => getProjectStatus(p) === 'Complété').length,
          'En attente': projects.filter(p => getProjectStatus(p) === 'En attente').length,
          'Suspendu': projects.filter(p => getProjectStatus(p) === 'Suspendu').length
        };
        setProjectStats({
          total: projects.length,
          byStatus: projectsByStatus,
          activeCount: projectsByStatus['Actif'],
          completedCount: projectsByStatus['Complété']
        });

        // Traiter les données d'objectifs
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

        // Traiter les données de devis
        const devis = getCollection(devisRes);
        const devisByStatus = {
          'En attente': devis.filter(d => getDevisStatus(d) === 'En attente').length,
          'Validé': devis.filter(d => getDevisStatus(d) === 'Validé').length,
          'Transformé': devis.filter(d => getDevisStatus(d) === 'Transformé').length
        };
        const devisTotalAmount = devis.reduce((sum, d) => sum + Number(d.TotTTC || d.Montant || 0), 0);
        setDevisStats({
          total: devis.length,
          byStatus: devisByStatus,
          pendingCount: devisByStatus['En attente'],
          validatedCount: devisByStatus['Validé'] + devisByStatus['Transformé'],
          totalAmount: devisTotalAmount
        });
        setRawDevis(devis);

        // Traiter les données d'utilisateurs
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
        const commRoles = ['commercial', 'commerciale', 'Commercial', 'Commerciale'];
        const commNames = users
          .filter(u => commRoles.includes(String(u.UserRole || '')))
          .map(u => u.FullName || u.LoginName || u.NomUtilisateur)
          .filter(Boolean);
        setAllCommercialNames(commNames);

        // Traiter les données des tiers (clients)
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

        // Traiter les données des messages
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
          const commercial = d.CUser || d.CodRepres || d.CreatedBy || 'Non assigné';
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
        const monthNamesDevis = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
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

        // Préparer les cartes KPI avec les données réelles
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
          },
          {
            name: 'Livraisons',
            value: blv.length,
            unit: 'Total',
            icon: TruckIcon,
            trend: `${blv.filter(b => b.Valid).length} validés`,
            trendUp: true,
            color: 'blue',
            description: 'Logistique'
          },
          {
            name: 'Factures',
            value: fav.length,
            unit: 'Total',
            icon: DocumentTextIcon,
            trend: `${fav.filter(f => f.Valid).length} validées`,
            trendUp: true,
            color: 'emerald',
            description: 'Finance'
          }
        ];
        setStats(newStats);

        // Préparer les activités récentes
        const activities = getCollection(activitesRes);
        const formattedActivities = activities.slice(0, 5).map((activity, idx) => ({
          id: idx,
          type: 'activity',
          title: activity.Type_Activite || 'Activité',
          client: activity.Description || 'Sans description',
          status: 'success',
          time: 'Il y a peu'
        }));
        setRecentActivities(formattedActivities);
        setRawActivites(activities);

        // Préparer les données de graphique
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
          toast.error('Erreur lors du chargement des données du dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [allPermissions]);

  // Fetch payment stats for client portal
  useEffect(() => {
    if (!isClientDash) return;
    (async () => {
      try {
        const res = await axiosInstance.get('/reglements/stats');
        setClientPaymentStats(res?.data?.data || res?.data || null);
      } catch {
        setClientPaymentStats(null);
      }
    })();
  }, [isClientDash]);

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

  // â”€â”€ Client portal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (isClientDash) {
    const open       = reclamationStats?.openCount       || 0;
    const inProgress = reclamationStats?.inProgressCount || 0;
    const resolved   = reclamationStats?.resolvedCount   || 0;

    const totalAmount    = clientPaymentStats?.totalAmount    || 0;
    const totalPaid      = clientPaymentStats?.totalPaid      || 0;
    const totalRemaining = clientPaymentStats?.totalRemaining || 0;
    const payRate    = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

    const fmtTND = (n) =>
      Number(n || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' TND';

    return (
      <div className="space-y-5 pb-12">

        {/* ── Header ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#003f7d] via-[#0062AF] to-sky-400 px-8 py-7 text-white shadow-xl shadow-blue-500/25">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -right-2 -bottom-14 h-56 w-56 rounded-full bg-white/5" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-blue-200/70 text-[11px] font-bold uppercase tracking-[0.12em] mb-1">{currentDate}</p>
              <h1 className="text-3xl font-black leading-tight">
                Bienvenue,{' '}
                <span className="text-sky-200">{user?.FullName || user?.LoginName}</span>
              </h1>
              <p className="text-blue-200/60 text-sm mt-1.5">Espace client — Nexus CRM</p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2">
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Compte actif
              </span>
              <button
                onClick={() => navigate('/profile')}
                className="text-blue-200/70 hover:text-white text-xs font-medium underline underline-offset-2 transition-colors"
              >
                Mon profil →
              </button>
            </div>
          </div>
        </div>

        {/* ── Situation Financière ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Section header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#e0f0ff] border border-blue-100 flex items-center justify-center">
                <svg className="h-4.5 w-4.5 text-[#0062AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={18} height={18}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Situation Financière</p>
                <p className="text-[11px] text-slate-400">État de vos paiements</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/reglements')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0062AF] bg-[#e0f0ff] hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
            >
              Voir le détail
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* 3 montants */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="absolute top-3 right-3 h-8 w-8 rounded-xl bg-slate-200/60 flex items-center justify-center">
                  <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] mb-3">Montant total</p>
                <p className="text-2xl font-black text-slate-900 tabular-nums leading-none">{fmtTND(totalAmount)}</p>
                <p className="text-[11px] text-slate-400 mt-2">Total de vos factures</p>
              </div>

              {/* Réglé */}
              <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
                <div className="absolute top-3 right-3 h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.12em] mb-3">Montant réglé</p>
                <p className="text-2xl font-black text-emerald-700 tabular-nums leading-none">{fmtTND(totalPaid)}</p>
                <p className="text-[11px] text-emerald-500 mt-2 flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {payRate}% de vos factures réglées
                </p>
              </div>

              {/* Restant */}
              <div className={`relative overflow-hidden rounded-2xl p-5 ${totalRemaining > 0 ? 'border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50' : 'border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50'}`}>
                <div className={`absolute top-3 right-3 h-8 w-8 rounded-xl flex items-center justify-center ${totalRemaining > 0 ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                  {totalRemaining > 0 ? (
                    <svg className="h-4 w-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  ) : (
                    <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                </div>
                <p className={`text-[10px] font-black uppercase tracking-[0.12em] mb-3 ${totalRemaining > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  Montant restant
                </p>
                <p className={`text-2xl font-black tabular-nums leading-none ${totalRemaining > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {fmtTND(totalRemaining)}
                </p>
                <p className={`text-[11px] mt-2 flex items-center gap-1 ${totalRemaining > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${totalRemaining > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  {totalRemaining > 0 ? `${100 - payRate}% restant à régler` : 'Tout est réglé ✓'}
                </p>
              </div>
            </div>

            {/* Barre de progression */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.12em]">Progression du paiement</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#0062AF]">{payRate}%</span>
                  <span className="text-[10px] text-slate-400">recouvré</span>
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${payRate}%`,
                    background: payRate === 100
                      ? 'linear-gradient(90deg, #10b981, #34d399)'
                      : payRate >= 75
                      ? 'linear-gradient(90deg, #0062AF, #38bdf8)'
                      : payRate > 0
                      ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                      : '#e2e8f0'
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-300 font-medium">
                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Documents ── */}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] mb-3 px-1">Mes documents</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'Mes Devis',
                value: devisStats?.total || 0,
                sub: 'Propositions commerciales',
                color: 'text-[#0062AF]', bg: 'bg-[#e0f0ff]', bar: 'from-[#0062AF] to-sky-400',
                action: () => navigate('/devis'),
                icon: (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                ),
              },
              {
                label: 'Mes Commandes',
                value: 0,
                sub: 'Bons de commande',
                color: 'text-violet-600', bg: 'bg-violet-50', bar: 'from-violet-500 to-purple-400',
                action: () => navigate('/bcv'),
                icon: (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                ),
              },
              {
                label: 'Mes Réclamations',
                value: open + inProgress + resolved,
                sub: `${open} ouvertes · ${resolved} résolues`,
                color: 'text-rose-600', bg: 'bg-rose-50', bar: 'from-rose-500 to-pink-400',
                action: () => navigate('/claims'),
                icon: (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75a3.375 3.375 0 01-3.375 3.375h-1.5a3.375 3.375 0 01-3.375-3.375V6m10.5 10.5l-3-3m0 0l-3 3m3-3v9M6.75 7.5H5.625c-.621 0-1.125.504-1.125 1.125v12.75c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V15.75" />
                  </svg>
                ),
              },
            ].map((card) => (
              <button key={card.label} onClick={card.action}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm text-left hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden group">
                <div className={`h-1 w-full bg-gradient-to-r ${card.bar}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-10 w-10 rounded-xl ${card.bg} flex items-center justify-center ${card.color}`}>
                      {card.icon}
                    </div>
                    <svg className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                  </div>
                  <p className="text-3xl font-black text-slate-800 tabular-nums">{card.value}</p>
                  <p className="text-xs font-bold text-slate-600 mt-1">{card.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{card.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── SAV ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                <svg className="h-4 w-4 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Mes Réclamations SAV</p>
                <p className="text-[11px] text-slate-400">Suivi de vos tickets</p>
              </div>
            </div>
            <button onClick={() => navigate('/claims')}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 hover:underline underline-offset-2 transition-colors">
              Voir tout →
            </button>
          </div>
          <div className="grid grid-cols-3 divide-x divide-slate-100">
            {[
              { label: 'Ouvertes',  value: open,       sub: 'En attente',    dot: 'bg-rose-400',    text: 'text-rose-700',    bg: 'bg-rose-50',    num: 'text-rose-700' },
              { label: 'En cours',  value: inProgress, sub: 'En traitement', dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50',   num: 'text-amber-700' },
              { label: 'Résolues',  value: resolved,   sub: 'Terminées',     dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50', num: 'text-emerald-700' },
            ].map((s) => (
              <div key={s.label} className="p-5 flex flex-col items-center justify-center text-center gap-2">
                <div className={`h-12 w-12 rounded-2xl ${s.bg} flex items-center justify-center`}>
                  <span className={`text-2xl font-black ${s.num}`}>{s.value}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">{s.label}</p>
                  <p className="text-[10px] text-slate-400">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Actions rapides ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] mb-3">Actions rapides</p>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => navigate('/reglements')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0062AF] text-white rounded-xl text-sm font-bold hover:bg-[#004a85] transition-all shadow-sm shadow-blue-500/20 active:scale-95">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" /></svg>
              Mes paiements
            </button>
            <button onClick={() => navigate('/claims/new')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 transition-all active:scale-95">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Nouvelle réclamation
            </button>
            <button onClick={() => navigate('/devis')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all active:scale-95">
              <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              Voir mes devis
            </button>
            <button onClick={() => navigate('/messages')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all active:scale-95">
              <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
              Messages
            </button>
          </div>
        </div>

      </div>
    );
  }

  // ── Agent portal ─────────────────────────────────────────────────────────────
  if (isAgentDash) {
    // Year + period filter
    const { start: agStart, end: agEnd } = getRange(agentYear, agentPeriod);
    const periodLabel = agentYear !== 'all'
      ? `Année ${agentYear}`
      : { week:'Cette semaine', month:'Ce mois', '3months':'3 derniers mois', year:'Cette année' }[agentPeriod];

    const filtRec = rawReclamations.filter(r => { const d = new Date(r.DateOuverture); return d >= agStart && d < agEnd; });
    const filtAct = rawActivites.filter(a => { const d = new Date(a.Date_Activite || a.DateCreation || Date.now()); return d >= agStart && d < agEnd; });

    const filtOpen     = filtRec.filter(r => r.Statut === 'Ouvert').length;
    const filtInProg   = filtRec.filter(r => r.Statut === 'En cours').length;
    const filtResolved = filtRec.filter(r => r.Statut === 'Résolu' || r.Statut === 'Fermé').length;
    const filtRate     = filtRec.length > 0 ? ((filtResolved / filtRec.length) * 100).toFixed(0) : 0;

    const satScore = globalSatisfaction?.score || 0;
    const satLabel = satScore >= 8 ? 'Excellente' : satScore >= 6 ? 'Satisfaisante' : satScore > 0 ? 'À améliorer' : 'N/A';
    const satColor = satScore >= 8 ? { ring:'#10b981', bg:'bg-emerald-50', text:'text-emerald-700', border:'border-emerald-200' }
                   : satScore >= 6 ? { ring:'#f59e0b', bg:'bg-amber-50', text:'text-amber-700', border:'border-amber-200' }
                   : { ring:'#94a3b8', bg:'bg-slate-100', text:'text-slate-600', border:'border-slate-200' };
    return (
      <div className="space-y-5 pb-12">
        {/* Header */}
        <div className="bg-[#0062AF] rounded-2xl px-6 py-5 text-white">
          <p className="text-blue-200/80 text-xs font-semibold uppercase tracking-widest mb-1">{currentDate}</p>
          <h1 className="text-2xl font-black">Bonjour, <span className="text-sky-300">{(user?.FullName || 'Agent').split(' ')[0]}</span></h1>
          <p className="text-blue-200/70 text-sm mt-0.5">Tableau de bord agent</p>
        </div>

        {/* Filter bar — Agent */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-3.5 flex flex-wrap items-center gap-4">
          {/* Year */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Année</span>
            <select value={agentYear} onChange={e=>{setAgentYear(e.target.value);}}
              className="h-8 pl-3 pr-6 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#0062AF]/50 focus:ring-2 focus:ring-[#0062AF]/10 transition-all cursor-pointer">
              <option value="all">Toutes</option>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          {/* Period — disabled when year is selected */}
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${agentYear!=='all'?'text-slate-300':'text-slate-400'}`}>Période</span>
            <div className={`flex rounded-xl border border-slate-200 overflow-hidden text-xs font-bold ${agentYear!=='all'?'opacity-40 pointer-events-none':''}`}>
              {[{k:'week',l:'Semaine'},{k:'month',l:'Mois'},{k:'3months',l:'3 mois'},{k:'year',l:'Année'}].map(p => (
                <button key={p.k} onClick={()=>setAgentPeriod(p.k)}
                  className={`px-4 py-2 transition-all border-r border-slate-100 last:border-0 ${agentPeriod===p.k?'bg-[#0062AF] text-white':'text-slate-500 hover:bg-slate-50'}`}>
                  {p.l}
                </button>
              ))}
            </div>
          </div>
          {/* Result summary */}
          <span className="text-xs text-slate-400 ml-auto">
            <span className="font-semibold text-[#0062AF]">{filtRec.length}</span> réclamations ·
            <span className="font-semibold text-[#0062AF] ml-1">{filtAct.length}</span> activités
            <span className="ml-1">— {periodLabel}</span>
            {agentYear!=='all' && (
              <button onClick={()=>setAgentYear('all')} className="ml-2 text-slate-400 hover:text-slate-600 underline text-[10px]">Effacer</button>
            )}
          </span>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label:'SAV Ouverts',      value:filtOpen,               sub:'En attente de traitement', bg:'bg-rose-50',    text:'text-rose-600',    bar:'bg-rose-500',    icon:ClockIcon,              action:'/claims' },
            { label:'SAV En cours',     value:filtInProg,             sub:'Traitement en cours',      bg:'bg-amber-50',   text:'text-amber-600',   bar:'bg-amber-500',   icon:CheckCircleIcon,        action:'/claims' },
            { label:'Taux résolution',  value:`${filtRate}%`,         sub:`${filtResolved} résolus`,  bg:'bg-emerald-50', text:'text-emerald-600', bar:'bg-emerald-500', icon:ArrowTrendingUpIcon,    action:'/claims' },
            { label:'Activités',        value:filtAct.length,         sub:periodLabel,                bg:'bg-sky-50',     text:'text-sky-600',     bar:'bg-sky-500',     icon:CalendarIcon,           action:'/activites' },
          ].map((k,i) => (
            <button key={i} onClick={() => navigate(k.action)}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all text-left">
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${k.bar}`} />
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${k.bg}`}>
                <k.icon className={`h-5 w-5 ${k.text}`} />
              </div>
              <p className="text-2xl font-black text-slate-800 tabular-nums">{k.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{k.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{k.sub}</p>
            </button>
          ))}
        </div>

        {/* Satisfaction + Recent Activities */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Satisfaction */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <SparklesIcon className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Satisfaction Client</h3>
                <p className="text-xs text-slate-400">Score global — calculé par IA</p>
              </div>
            </div>
            <div className="p-6 flex flex-col items-center gap-4">
              <div className="relative h-36 w-36">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="72" cy="72" r="62" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                  <circle cx="72" cy="72" r="62" stroke={satColor.ring} strokeWidth="10" fill="transparent"
                    strokeDasharray={389.6}
                    strokeDashoffset={satScore ? 389.6 - (389.6 * satScore) / 10 : 389.6}
                    className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {satScore > 0
                    ? <><span className="text-3xl font-black text-slate-800">{satScore}</span><span className="text-xs text-slate-400">/ 10</span></>
                    : <span className="text-lg font-bold text-slate-400">N/A</span>
                  }
                </div>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${satColor.bg} ${satColor.text} ${satColor.border}`}>
                {satLabel}
              </span>
              <div className="w-full grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-emerald-50">
                  <p className="font-black text-emerald-700 text-base">{globalSatisfaction?.resolvedClaims ?? 0}</p>
                  <p className="text-emerald-500 font-semibold uppercase text-[9px] mt-0.5">Résolues</p>
                </div>
                <div className="p-2 rounded-xl bg-amber-50">
                  <p className="font-black text-amber-700 text-base">{globalSatisfaction?.inProgressClaims ?? 0}</p>
                  <p className="text-amber-500 font-semibold uppercase text-[9px] mt-0.5">En cours</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <p className="font-black text-slate-700 text-base">{globalSatisfaction?.openClaims ?? 0}</p>
                  <p className="text-slate-400 font-semibold uppercase text-[9px] mt-0.5">Ouvertes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent activities */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center">
                  <ClockIcon className="h-4 w-4 text-sky-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Activités récentes</h3>
                  <p className="text-xs text-slate-400">Dernières interactions</p>
                </div>
              </div>
              <button onClick={() => navigate('/activites')} className="text-xs font-semibold text-[#0062AF] hover:underline">Voir tout →</button>
            </div>
            <div className="divide-y divide-slate-50">
              {recentActivities.length > 0 ? recentActivities.map((a, i) => (
                <div key={i} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
                  <div className="h-9 w-9 rounded-xl bg-[#e0f0ff] border border-blue-100 flex items-center justify-center flex-none">
                    <DocumentTextIcon className="h-4 w-4 text-[#0062AF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">{a.Type_Activite || a.title || 'Activité'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{a.Description || a.client || ''}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{a.Date_Activite ? new Date(a.Date_Activite).toLocaleDateString('fr-FR') : (a.time || '')}</span>
                </div>
              )) : (
                <div className="px-5 py-10 text-center">
                  <p className="text-xs text-slate-400">Aucune activité récente</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SAV breakdown — filtered by period */}
        {filtRec.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                  <DocumentTextIcon className="h-4 w-4 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Réclamations SAV — {periodLabel}</h3>
                  <p className="text-xs text-slate-400">{filtRec.length} réclamations · Résolution : {filtRate}%</p>
                </div>
              </div>
              <button onClick={() => navigate('/claims')} className="text-xs font-semibold text-[#0062AF] hover:underline">Gérer →</button>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['Ouvert','En cours','Résolu','Fermé']).map(status => {
                const count = filtRec.filter(r => r.Statut === status).length;
                const pct = filtRec.length > 0 ? Math.round((count / filtRec.length) * 100) : 0;
                const clr = status==='Résolu'||status==='Fermé' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : status==='En cours' ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200';
                return (
                  <div key={status} className={`rounded-xl border p-4 text-center ${clr}`}>
                    <p className="text-2xl font-black">{count}</p>
                    <p className="text-xs font-bold mt-1">{status}</p>
                    <p className="text-[10px] opacity-70">{pct}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => navigate('/claims/new')} className="px-4 py-2.5 bg-[#0062AF] text-white rounded-xl text-sm font-semibold hover:bg-[#004a85] transition-colors shadow-sm">Nouvelle réclamation</button>
          <button onClick={() => navigate('/activites')} className="px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">Mes activités</button>
          <button onClick={() => navigate('/calendar')} className="px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">Calendrier</button>
          <button onClick={() => navigate('/messages')} className="px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">Messages</button>
        </div>
      </div>
    );
  }

  // ── Commercial portal ─────────────────────────────────────────────────────────
  if (isCommercialDash) {
    const myName = user?.FullName || user?.LoginName || '';
    const myIdx  = commercialStats.findIndex(c =>
      c.fullName === myName ||
      c.fullName === user?.LoginName ||
      c.fullName?.toLowerCase() === myName.toLowerCase()
    );
    const myStats = myIdx >= 0 ? commercialStats[myIdx] : null;

    // Date-filtered devis (client-side)
    const filteredDevis = rawDevis.filter(d => {
      const dd = new Date(d.DatUser || d.DatCreateUser || d.createdAt);
      if (commDateFrom && dd < new Date(commDateFrom)) return false;
      if (commDateTo   && dd > new Date(commDateTo + 'T23:59:59')) return false;
      return true;
    });

    const hasDateFilter = !!(commDateFrom || commDateTo);
    const workingDevis  = hasDateFilter ? filteredDevis : rawDevis;

    const myDevisTotal   = workingDevis.length;
    const myDevisValides = workingDevis.filter(d => isValidatedDevis(d)).length;
    const myCA           = workingDevis.reduce((s,d) => s + Number(d.TotTTC || d.Montant || 0), 0);
    const myConversion   = myDevisTotal > 0 ? Math.round((myDevisValides / myDevisTotal) * 100) : 0;

    // Monthly series from filtered devis
    const mnNames = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Août','Sep','Oct','Nov','Déc'];
    const nowD = new Date();
    const commMonthly = Array.from({length:6},(_,i) => {
      const dt = new Date(nowD.getFullYear(), nowD.getMonth()-5+i, 1);
      const dtNext = new Date(dt.getFullYear(), dt.getMonth()+1, 1);
      const slice = workingDevis.filter(d => {
        const dd = new Date(d.DatUser || d.DatCreateUser || d.createdAt);
        return dd >= dt && dd < dtNext;
      });
      return { name:mnNames[dt.getMonth()], devis:slice.length, valides:slice.filter(d=>isValidatedDevis(d)).length, montant:Math.round(slice.reduce((s,d)=>s+Number(d.TotTTC||d.Montant||0),0)/1000) };
    });

    return (
      <div className="space-y-5 pb-12">
        {/* Header */}
        <div className="bg-[#0062AF] rounded-2xl px-6 py-5 text-white">
          <p className="text-blue-200/80 text-xs font-semibold uppercase tracking-widest mb-1">{currentDate}</p>
          <h1 className="text-2xl font-black">Mes performances, <span className="text-sky-300">{(user?.FullName || 'Commercial').split(' ')[0]}</span></h1>
          <p className="text-blue-200/70 text-sm mt-0.5">Tableau de bord commercial — vos données uniquement</p>
        </div>

        {/* Filter bar — Commercial */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-3.5 flex flex-wrap items-center gap-4">
          {/* Year quick-select */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Année</span>
            <select value={commYear} onChange={e=>{
              const y = e.target.value;
              setCommYear(y);
              if (y !== 'all') { setCommDateFrom(`${y}-01-01`); setCommDateTo(`${y}-12-31`); }
              else { setCommDateFrom(''); setCommDateTo(''); }
            }}
              className="h-8 pl-3 pr-6 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#0062AF]/50 focus:ring-2 focus:ring-[#0062AF]/10 transition-all cursor-pointer">
              <option value="all">Toutes</option>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          {/* Manual date range */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" /> Plage
            </span>
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-bold text-slate-400">Du</label>
              <input type="date" value={commDateFrom} onChange={e=>{setCommDateFrom(e.target.value);setCommYear('all');}}
                className="h-8 px-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#0062AF]/50 focus:ring-2 focus:ring-[#0062AF]/10 transition-all cursor-pointer" />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-bold text-slate-400">Au</label>
              <input type="date" value={commDateTo} onChange={e=>{setCommDateTo(e.target.value);setCommYear('all');}}
                className="h-8 px-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#0062AF]/50 focus:ring-2 focus:ring-[#0062AF]/10 transition-all cursor-pointer" />
            </div>
            {hasDateFilter && (
              <button onClick={()=>{setCommDateFrom('');setCommDateTo('');setCommYear('all');}}
                className="h-8 px-3 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5">
                <XMarkIcon className="h-3.5 w-3.5" /> Effacer
              </button>
            )}
          </div>
          {hasDateFilter && (
            <span className="text-xs font-semibold text-[#0062AF] bg-[#e0f0ff] px-2.5 py-1 rounded-full border border-blue-200 ml-auto">
              {myDevisTotal} devis — {commYear!=='all' ? `Année ${commYear}` : `${commDateFrom} → ${commDateTo}`}
            </span>
          )}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label:'Mes Devis',         value:myDevisTotal,                       sub:'Total créés',               bar:'bg-sky-500',     bg:'bg-sky-50',     text:'text-sky-600',     icon:DocumentTextIcon    },
            { label:'Devis Validés',      value:myDevisValides,                     sub:'Validés + Transformés',     bar:'bg-emerald-500', bg:'bg-emerald-50', text:'text-emerald-600', icon:CheckCircleIcon     },
            { label:'Mon CA',             value:`${(myCA/1000).toFixed(1)}k`,       sub:'TND total',                 bar:'bg-violet-500',  bg:'bg-violet-50',  text:'text-violet-600',  icon:CurrencyDollarIcon  },
            { label:'Taux Conversion',    value:`${myConversion}%`,                 sub:'Devis → Ventes',            bar:'bg-amber-500',   bg:'bg-amber-50',   text:'text-amber-600',   icon:ArrowTrendingUpIcon },
          ].map((k,i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${k.bar}`} />
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${k.bg}`}>
                <k.icon className={`h-5 w-5 ${k.text}`} />
              </div>
              <p className="text-2xl font-black text-slate-800 tabular-nums">{k.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{k.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Devis trend + Status */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Monthly trend */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#e0f0ff] border border-blue-100 flex items-center justify-center">
                <ChartBarIcon className="h-4 w-4 text-[#0062AF]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Évolution mensuelle — Mes devis</h3>
                <p className="text-xs text-slate-400">6 derniers mois</p>
              </div>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={commMonthly}>
                  <defs>
                    <linearGradient id="gCommD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0062AF" stopOpacity={0.12} /><stop offset="95%" stopColor="#0062AF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gCommV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius:12, border:'1px solid #e2e8f0', fontSize:12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                  <Area type="monotone" dataKey="devis" stroke="#0062AF" strokeWidth={2.5} fill="url(#gCommD)" name="Devis créés" />
                  <Area type="monotone" dataKey="valides" stroke="#10b981" strokeWidth={2.5} fill="url(#gCommV)" name="Validés" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Devis status */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center">
                <DocumentTextIcon className="h-4 w-4 text-sky-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Statut de mes devis</h3>
                <p className="text-xs text-slate-400">{myDevisTotal} devis au total</p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {Object.entries(devisStats?.byStatus || {}).map(([status, count]) => {
                const total = devisStats?.total || 1;
                const pct = Math.round((count / total) * 100);
                const cm = { 'En attente':'bg-amber-400', 'Validé':'bg-emerald-400', 'Transformé':'bg-indigo-400' };
                const match = Object.entries(cm).find(([k]) => status.includes(k.split('é')[0]));
                const barColor = match ? match[1] : 'bg-slate-300';
                return (
                  <div key={status}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs text-slate-600">{status}</span>
                      <span className="text-xs font-bold text-slate-700">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width:`${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chiffre d'affaires</p>
                <p className="text-xl font-black text-slate-800 mt-1">{(myCA/1000).toFixed(1)}k TND</p>
              </div>
            </div>
          </div>
        </div>

        {/* Objectives */}
        {objectifStats?.total > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-violet-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Mes objectifs</h3>
                  <p className="text-xs text-slate-400">Taux d'atteinte : {objectifStats?.achievementRate}%</p>
                </div>
              </div>
              <button onClick={() => navigate('/objectifs')} className="text-xs font-semibold text-[#0062AF] hover:underline">Voir tout →</button>
            </div>
            <div className="p-5 grid grid-cols-3 gap-4">
              {Object.entries(objectifStats?.byStatus || {}).map(([status, count]) => {
                const clr = status==='Atteint'  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : status==='En cours' ? 'bg-amber-50 text-amber-700 border-amber-200'
                          :                       'bg-rose-50 text-rose-700 border-rose-200';
                return (
                  <div key={status} className={`rounded-2xl border p-4 text-center ${clr}`}>
                    <p className="text-3xl font-black">{count}</p>
                    <p className="text-xs font-bold mt-1">{status}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => navigate('/devis/new')} className="px-4 py-2.5 bg-[#0062AF] text-white rounded-xl text-sm font-semibold hover:bg-[#004a85] transition-colors shadow-sm">Nouveau devis</button>
          <button onClick={() => navigate('/clients')} className="px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">Mes clients</button>
          <button onClick={() => navigate('/devis')} className="px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">Mes devis</button>
          <button onClick={() => navigate('/objectifs')} className="px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">Mes objectifs</button>
          <button onClick={() => navigate('/activites')} className="px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">Activités</button>
        </div>
      </div>
    );
  }

  // ── Technicien portal ─────────────────────────────────────────────────────────
  if (isTechnicienDash) {
    // Year + period filter
    const { start: tStart, end: tEnd } = getRange(techYear, techPeriod);
    const techLabel = techYear !== 'all'
      ? `Année ${techYear}`
      : { week:'Cette semaine', month:'Ce mois', '3months':'3 mois', year:'Cette année' }[techPeriod];

    // Find this technician's cases
    const techName = user?.FullName || user?.LoginName || '';
    const myRec = rawReclamations.filter(r =>
      !techName || r.NomTechnicien === techName || r.NomTechnicien?.includes(techName.split(' ')[0])
    );
    const myRecPeriod = myRec.filter(r => { const d = new Date(r.DateOuverture); return d >= tStart && d < tEnd; });

    const tOpen     = myRecPeriod.filter(r => r.Statut === 'Ouvert').length;
    const tInProg   = myRecPeriod.filter(r => r.Statut === 'En cours').length;
    const tResolved = myRecPeriod.filter(r => r.Statut === 'Résolu' || r.Statut === 'Fermé').length;
    const tRate     = myRecPeriod.length > 0 ? ((tResolved / myRecPeriod.length) * 100).toFixed(0) : 0;

    const myActs = rawActivites.filter(a => { const d = new Date(a.Date_Activite || Date.now()); return d >= tStart && d < tEnd; });

    // Monthly SAV trend for this tech
    const mnNames = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Août','Sep','Oct','Nov','Déc'];
    const nowT = new Date();
    const techMonthly = Array.from({length:6},(_,i) => {
      const dt = new Date(nowT.getFullYear(), nowT.getMonth()-5+i, 1);
      const dtNext = new Date(dt.getFullYear(), dt.getMonth()+1, 1);
      const slice = myRec.filter(r => { const d = new Date(r.DateOuverture); return d >= dt && d < dtNext; });
      return { name:mnNames[dt.getMonth()], assignées:slice.length, résolues:slice.filter(r=>r.Statut==='Résolu'||r.Statut==='Fermé').length };
    });

    // Priority breakdown
    const techPriorityData = [
      { name:'Haute',   value:myRecPeriod.filter(r=>r.Priorite==='Haute').length,   fill:'#ef4444' },
      { name:'Moyenne', value:myRecPeriod.filter(r=>r.Priorite==='Moyenne').length, fill:'#f59e0b' },
      { name:'Basse',   value:myRecPeriod.filter(r=>r.Priorite==='Basse').length,   fill:'#10b981' },
    ].filter(p => p.value > 0);

    // Pending interventions
    const pendingRec = myRec
      .filter(r => r.Statut === 'Ouvert' || r.Statut === 'En cours')
      .sort((a,b) => new Date(a.DateOuverture) - new Date(b.DateOuverture))
      .slice(0, 8);

    return (
      <div className="space-y-5 pb-12">
        {/* Header */}
        <div className="bg-[#0062AF] rounded-2xl px-6 py-5 text-white">
          <p className="text-blue-200/80 text-xs font-semibold uppercase tracking-widest mb-1">{currentDate}</p>
          <h1 className="text-2xl font-black">Bonjour, <span className="text-sky-300">{(user?.FullName || 'Technicien').split(' ')[0]}</span></h1>
          <p className="text-blue-200/70 text-sm mt-0.5">Tableau de bord technicien SAV</p>
        </div>

        {/* Filter bar — Technicien */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-3.5 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Année</span>
            <select value={techYear} onChange={e=>setTechYear(e.target.value)}
              className="h-8 pl-3 pr-6 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#0062AF]/50 focus:ring-2 focus:ring-[#0062AF]/10 transition-all cursor-pointer">
              <option value="all">Toutes</option>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${techYear!=='all'?'text-slate-300':'text-slate-400'}`}>Période</span>
            <div className={`flex rounded-xl border border-slate-200 overflow-hidden text-xs font-bold ${techYear!=='all'?'opacity-40 pointer-events-none':''}`}>
              {[{k:'week',l:'Semaine'},{k:'month',l:'Mois'},{k:'3months',l:'3 mois'},{k:'year',l:'Année'}].map(p => (
                <button key={p.k} onClick={()=>setTechPeriod(p.k)}
                  className={`px-4 py-2 transition-all border-r border-slate-100 last:border-0 ${techPeriod===p.k?'bg-[#0062AF] text-white':'text-slate-500 hover:bg-slate-50'}`}>
                  {p.l}
                </button>
              ))}
            </div>
          </div>
          <span className="text-xs text-slate-400 ml-auto">
            <span className="font-semibold text-[#0062AF]">{myRecPeriod.length}</span> interventions —
            <span className="ml-1 font-semibold text-slate-600">{techLabel}</span>
            {techName && <span className="ml-1 text-slate-300">· {techName}</span>}
            {techYear!=='all' && (
              <button onClick={()=>setTechYear('all')} className="ml-2 text-slate-400 hover:text-slate-600 underline text-[10px]">Effacer</button>
            )}
          </span>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label:'Cas ouverts',      value:tOpen,             sub:'En attente',           bg:'bg-rose-50',    text:'text-rose-600',    bar:'bg-rose-500',    icon:ClockIcon          },
            { label:'En cours',         value:tInProg,           sub:'Traitement actif',      bg:'bg-amber-50',   text:'text-amber-600',   bar:'bg-amber-500',   icon:CheckCircleIcon    },
            { label:'Résolus',          value:tResolved,         sub:techLabel,               bg:'bg-emerald-50', text:'text-emerald-600', bar:'bg-emerald-500', icon:ArrowTrendingUpIcon },
            { label:'Taux résolution',  value:`${tRate}%`,       sub:`/${myRecPeriod.length} cas`, bg:'bg-sky-50', text:'text-sky-600',   bar:'bg-sky-500',     icon:ChartBarIcon       },
          ].map((k,i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden hover:shadow-md transition-all">
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${k.bar}`} />
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${k.bg}`}>
                <k.icon className={`h-5 w-5 ${k.text}`} />
              </div>
              <p className="text-2xl font-black text-slate-800 tabular-nums">{k.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{k.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts: Trend + Priority */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Monthly trend */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                <ChartBarIcon className="h-4 w-4 text-teal-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Évolution mensuelle — Mes interventions</h3>
                <p className="text-xs text-slate-400">6 derniers mois</p>
              </div>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={techMonthly}>
                  <defs>
                    <linearGradient id="gTA" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#14b8a6" stopOpacity={0.12}/><stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gTR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.12}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius:12, border:'1px solid #e2e8f0', fontSize:12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                  <Area type="monotone" dataKey="assignées" stroke="#14b8a6" strokeWidth={2.5} fill="url(#gTA)" name="Assignées" />
                  <Area type="monotone" dataKey="résolues" stroke="#10b981" strokeWidth={2.5} fill="url(#gTR)" name="Résolues" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                <DocumentTextIcon className="h-4 w-4 text-rose-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Par priorité</h3>
                <p className="text-xs text-slate-400">{techLabel}</p>
              </div>
            </div>
            <div className="p-5">
              {techPriorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={techPriorityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} width={55} />
                    <Tooltip contentStyle={{ borderRadius:12, border:'1px solid #e2e8f0', fontSize:12 }} />
                    <Bar dataKey="value" radius={[0,6,6,0]} name="Cas">
                      {techPriorityData.map((e,i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <CheckCircleIcon className="h-10 w-10 text-emerald-300" />
                  <p className="text-sm font-semibold text-slate-500">Aucun cas sur cette période</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Open/In-progress cases list */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                <ClockIcon className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Interventions en attente</h3>
                <p className="text-xs text-slate-400">{pendingRec.length} cas ouverts ou en cours</p>
              </div>
            </div>
            <button onClick={() => navigate('/claims')} className="text-xs font-semibold text-[#0062AF] hover:underline">Tout voir →</button>
          </div>
          {pendingRec.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {pendingRec.map((r, i) => {
                const prioBg = r.Priorite==='Haute' ? 'bg-rose-100 text-rose-700' : r.Priorite==='Moyenne' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
                const statBg = r.Statut==='En cours' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-rose-50 text-rose-600 border-rose-200';
                return (
                  <div key={i} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-slate-800 truncate">{r.Titre || r.Description?.slice(0,40) || `Réclamation #${r.ID || r.id || i+1}`}</p>
                        {r.Priorite && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${prioBg}`}>{r.Priorite}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-slate-400">{r.NomClient || r.CodeTiers || '—'}</p>
                        {r.TypeReclamation && <span className="text-[10px] text-slate-300">· {r.TypeReclamation}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-none">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statBg}`}>{r.Statut}</span>
                      <span className="text-[10px] text-slate-400">{r.DateOuverture ? new Date(r.DateOuverture).toLocaleDateString('fr-FR') : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <CheckCircleIcon className="h-10 w-10 text-emerald-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-500">Aucune intervention en attente</p>
            </div>
          )}
        </div>

        {/* Activities */}
        {myActs.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center">
                  <CalendarIcon className="h-4 w-4 text-sky-500" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Activités — {techLabel}</h3>
              </div>
              <button onClick={() => navigate('/activites')} className="text-xs font-semibold text-[#0062AF] hover:underline">Voir tout →</button>
            </div>
            <div className="divide-y divide-slate-50">
              {myActs.slice(0,6).map((a,i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-700">{a.Type_Activite || a.Categ || 'Activité'}</p>
                    <p className="text-[10px] text-slate-400">{a.Description || ''}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                    {a.Date_Activite ? new Date(a.Date_Activite).toLocaleDateString('fr-FR') : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => navigate('/claims')} className="px-4 py-2.5 bg-[#0062AF] text-white rounded-xl text-sm font-semibold hover:bg-[#004a85] transition-colors shadow-sm">Mes réclamations</button>
          <button onClick={() => navigate('/claims/new')} className="px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">Nouvelle intervention</button>
          <button onClick={() => navigate('/calendar')} className="px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">Calendrier</button>
          <button onClick={() => navigate('/messages')} className="px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">Messages</button>
        </div>
      </div>
    );
  }

  // â”€â”€ Derived filtered data (commercial filter applied client-side) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const selectedIdx = selectedCommercial === 'all'
    ? -1
    : commercialStats.findIndex(c => c.fullName === selectedCommercial);

  const filteredCommercialStats = selectedIdx === -1
    ? commercialStats
    : commercialStats.filter((_, i) => i === selectedIdx);

  const filteredCommercialDevisData = selectedIdx === -1
    ? commercialDevisData
    : commercialDevisData.filter((_, i) => i === selectedIdx);

  const DASH_TABS = [
    { id: 'apercu',  label: 'Aperçu Général',       icon: ChartBarIcon },
    { id: 'ventes',  label: 'Ventes & Commerciaux',  icon: CurrencyDollarIcon },
    { id: 'sav',     label: 'SAV & Projets',          icon: DocumentTextIcon },
    { id: 'ia',      label: 'IA & Régions',           icon: SparklesIcon },
  ];

  // Shared card header component
  const CH = ({ title, subtitle, icon: Icon, bg, border, text }) => (
    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-none ${bg} border ${border}`}>
        <Icon className={`h-4 w-4 ${text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-slate-800 truncate">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 pb-12">

      {/* â”€â”€ HEADER â”€â”€ */}
      <div className="relative bg-[#0062AF] rounded-2xl overflow-hidden shadow-md">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTYgNnY2aDZ2LTZoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-60 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/4 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 px-7 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-blue-200/80 text-xs font-semibold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <SparklesIcon className="h-3.5 w-3.5" />{currentDate}
              </p>
              <h1 className="text-[2rem] font-black text-white leading-tight">
                Bonjour,{' '}
                <span className="text-sky-300">{(user?.FullName || 'Admin').split(' ')[0]}</span>
              </h1>
              <p className="text-blue-200/60 text-sm mt-1">Vue d'ensemble de l'activité en temps réel</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: `${reclamationStats?.openCount || 0} SAV ouverts`,           dot: 'bg-rose-400',    color: 'bg-rose-500/20 text-rose-200 border-rose-400/30' },
                { label: `${projectStats?.activeCount || 0} projets actifs`,           dot: 'bg-sky-400',     color: 'bg-sky-500/20 text-sky-200 border-sky-400/30' },
                { label: `${objectifStats?.achievedCount || 0}/${objectifStats?.total || 0} objectifs`, dot: 'bg-emerald-400', color: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' },
                { label: `${messagesStats?.unread || 0} non lus`,                      dot: 'bg-violet-400',  color: 'bg-violet-500/20 text-violet-200 border-violet-400/30' },
              ].map((pill, i) => (
                <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${pill.color}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${pill.dot} animate-pulse`} />{pill.label}
                </span>
              ))}
              <button onClick={() => navigate('/claims')}
                className="ml-1 h-8 px-4 bg-white text-[#0062AF] text-xs font-bold rounded-xl hover:bg-blue-50 transition-all shadow-sm">
                Voir SAV →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ FILTER BAR â”€â”€ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filtres</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Année</label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="h-8 pl-3 pr-6 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#0062AF]/50 focus:ring-2 focus:ring-[#0062AF]/10 transition-all cursor-pointer"
              >
                <option value="all">Toutes</option>
                {Array.from({length: 5}, (_, i) => new Date().getFullYear() + i).map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Commercial</label>
              <select
                value={selectedCommercial}
                onChange={e => setSelectedCommercial(e.target.value)}
                className="h-8 pl-3 pr-6 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#0062AF]/50 focus:ring-2 focus:ring-[#0062AF]/10 transition-all cursor-pointer"
              >
                <option value="all">Tous les commerciaux</option>
                {[...new Set([
                  ...allCommercialNames,
                  ...commercialStats.map(c => c.fullName)
                ])].sort().map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            {(selectedYear !== 'all' || selectedCommercial !== 'all') && (
              <button
                onClick={() => { setSelectedYear('all'); setSelectedCommercial('all'); }}
                className="h-8 px-3 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <XMarkIcon className="h-3.5 w-3.5" /> Réinitialiser
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {selectedYear !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#e0f0ff] text-[#0062AF] text-[10px] font-bold rounded-full border border-blue-200">
                Année {selectedYear}
              </span>
            )}
            {selectedCommercial !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-violet-700 text-[10px] font-bold rounded-full border border-violet-200">
                {selectedCommercial}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* â”€â”€ TAB NAVIGATION â”€â”€ */}
      <div className="flex items-center gap-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-1.5">
        {DASH_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveDashTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeDashTab === tab.id
                ? 'bg-[#0062AF] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="hidden sm:inline truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           TAB: APERÃ‡U GÉNÉRAL
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeDashTab === 'apercu' && (
      <div className="space-y-5">

      {selectedCommercial !== 'all' && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#e0f0ff] border border-blue-200 rounded-xl">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-4 w-4 text-[#0062AF] flex-shrink-0" />
            <p className="text-sm font-semibold text-[#0062AF]">
              Filtre actif — Commercial : <span className="font-black">{selectedCommercial}</span>
            </p>
          </div>
          <p className="text-xs text-[#0062AF]/70 hidden sm:block">
            Détails disponibles dans l'onglet <strong>Ventes</strong>
          </p>
        </div>
      )}

      {/* KPI row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients',  value: tiersStats?.total || 0,              sub: 'Base active',                                          bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-500', icon: UserGroupIcon },
          { label: 'Devis',          value: devisStats?.total || 0,              sub: `${((devisStats?.totalAmount||0)/1000).toFixed(1)}k TND`, bg: 'bg-sky-50',     text: 'text-sky-600',     bar: 'bg-sky-500',     icon: DocumentTextIcon },
          { label: 'Projets Actifs', value: projectStats?.activeCount || 0,      sub: `${projectStats?.total||0} au total`,                    bg: 'bg-indigo-50',  text: 'text-indigo-600',  bar: 'bg-indigo-500',  icon: BriefcaseIcon },
          { label: 'Taux Objectifs', value: `${objectifStats?.achievementRate||0}%`, sub: `${objectifStats?.achievedCount||0}/${objectifStats?.total||0} atteints`, bg: 'bg-violet-50', text: 'text-violet-600', bar: 'bg-violet-500', icon: ArrowTrendingUpIcon },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${k.bar}`} />
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${k.bg}`}>
              <k.icon className={`h-5 w-5 ${k.text}`} />
            </div>
            <p className="text-2xl font-black text-slate-800 leading-none mb-1 tabular-nums">{k.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{k.label}</p>
            <p className="text-[11px] text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'SAV Ouverts',  value: reclamationStats?.openCount || 0,                  sub: `Résol. ${resolutionRate}%`,                bg: 'bg-rose-50',   text: 'text-rose-600',   bar: 'bg-rose-500',   icon: ClockIcon },
          { label: 'Utilisateurs', value: userStats?.total || 0,                              sub: `${userStats?.activeCount||0} actifs`,      bg: 'bg-amber-50',  text: 'text-amber-600',  bar: 'bg-amber-500',  icon: UsersIcon },
          { label: 'Livraisons',   value: stats.find(s=>s.name==='Livraisons')?.value || 0,   sub: 'Total livraisons',                        bg: 'bg-teal-50',   text: 'text-teal-600',   bar: 'bg-teal-500',   icon: TruckIcon },
          { label: 'Factures',     value: stats.find(s=>s.name==='Factures')?.value || 0,     sub: 'Total factures',                          bg: 'bg-cyan-50',   text: 'text-cyan-600',   bar: 'bg-cyan-500',   icon: CurrencyDollarIcon },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${k.bar}`} />
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${k.bg}`}>
              <k.icon className={`h-5 w-5 ${k.text}`} />
            </div>
            <p className="text-2xl font-black text-slate-800 leading-none mb-1 tabular-nums">{k.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{k.label}</p>
            <p className="text-[11px] text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* â”€â”€ Aperçu: SAV donut · Projects · Objectifs â”€â”€ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* SAV by status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CH title="SAV par Statut" subtitle={`Total: ${reclamationStats?.total || 0} · Résolution: ${resolutionRate}%`} icon={DocumentTextIcon} bg="bg-rose-50" border="border-rose-100" text="text-rose-500" />
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
          <CH title="Projets" subtitle={`${projectStats?.activeCount || 0} actifs / ${projectStats?.total || 0} total`} icon={BriefcaseIcon} bg="bg-indigo-50" border="border-indigo-100" text="text-indigo-500" />
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
          <CH title="Objectifs" subtitle="Taux d'atteinte global" icon={ArrowTrendingUpIcon} bg="bg-violet-50" border="border-violet-100" text="text-violet-500" />
          <div className="p-5 flex flex-col items-center gap-4">
            <div className="relative h-40 w-40">
              <svg className="w-full h-full -rotate-90">
                <circle cx="80" cy="80" r="68" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                <circle cx="80" cy="80" r="68"
                  stroke={Number(objectifStats?.achievementRate || 0) >= 100 ? '#10b981' : Number(objectifStats?.achievementRate || 0) >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="10" fill="transparent"
                  strokeDasharray={427}
                  strokeDashoffset={427 - (427 * Number(objectifStats?.achievementRate || 0)) / 100}
                  className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800">{objectifStats?.achievementRate || 0}</span>
                <span className="text-sm font-bold" style={{ color: Number(objectifStats?.achievementRate || 0) >= 100 ? '#10b981' : Number(objectifStats?.achievementRate || 0) >= 50 ? '#f59e0b' : '#ef4444' }}>%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  {Number(objectifStats?.achievementRate || 0) >= 100 ? 'Atteint' : Number(objectifStats?.achievementRate || 0) >= 50 ? 'En cours' : 'À risque'}
                </span>
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

      {/* â”€â”€ Aperçu: Satisfaction + Recent Activities â”€â”€ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CH title="Satisfaction Client" subtitle="Score global IA" icon={SparklesIcon} bg="bg-emerald-50" border="border-emerald-100" text="text-emerald-500" />
          <div className="p-5 flex flex-col items-center gap-3">
            <div className="relative h-32 w-32">
              <svg className="w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="54" stroke="#f1f5f9" strokeWidth="9" fill="transparent" />
                <circle cx="64" cy="64" r="54"
                  stroke={(globalSatisfaction?.score || 0) >= 8 ? '#10b981' : (globalSatisfaction?.score || 0) >= 6 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="9" fill="transparent"
                  strokeDasharray={339.3}
                  strokeDashoffset={339.3 - (339.3 * (globalSatisfaction?.score || 0)) / 10}
                  className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800">{globalSatisfaction?.score || '—'}</span>
                <span className="text-[10px] font-bold text-slate-400">/ 10</span>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${(globalSatisfaction?.score || 0) >= 8 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : (globalSatisfaction?.score || 0) >= 6 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
              {globalSatisfaction?.label || 'Excellente'}
            </span>
            <div className="w-full grid grid-cols-3 gap-2">
              {[{v: globalSatisfaction?.resolvedClaims??0, l:'Résolues', bg:'bg-emerald-50', t:'text-emerald-700', s:'text-emerald-500'},
                {v: globalSatisfaction?.inProgressClaims??0, l:'En cours', bg:'bg-amber-50', t:'text-amber-700', s:'text-amber-500'},
                {v: globalSatisfaction?.openClaims??0, l:'Ouvertes', bg:'bg-slate-50', t:'text-slate-700', s:'text-slate-400'},
              ].map((x,i) => (
                <div key={i} className={`flex flex-col items-center p-2 rounded-xl ${x.bg}`}>
                  <span className={`text-sm font-black ${x.t}`}>{x.v}</span>
                  <span className={`text-[9px] font-bold uppercase mt-0.5 ${x.s}`}>{x.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <CH title="Activités Récentes" subtitle="Dernières interactions" icon={ClockIcon} bg="bg-sky-50" border="border-sky-100" text="text-sky-500" />
            <button onClick={() => navigate('/activites')} className="text-xs font-semibold text-[#0062AF] hover:underline mr-1 shrink-0">Voir tout →</button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentActivities.length > 0 ? recentActivities.map((a, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
                <div className="h-9 w-9 rounded-xl bg-[#e0f0ff] border border-blue-100 flex items-center justify-center flex-none">
                  <DocumentTextIcon className="h-4 w-4 text-[#0062AF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">{a.title}</p>
                  <p className="text-[10px] text-slate-400 truncate">{a.client}</p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg whitespace-nowrap">{a.time}</span>
              </div>
            )) : <div className="px-5 py-10 text-center"><p className="text-xs text-slate-400">Aucune activité récente</p></div>}
          </div>
        </div>
      </div>

      </div>)} {/* end apercu tab */}


      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           TAB: VENTES & COMMERCIAUX
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeDashTab === 'ventes' && (
      <div className="space-y-5">

        {selectedCommercial !== 'all' && (
          <div className="flex items-center gap-2 px-4 py-3 bg-[#e0f0ff] border border-blue-200 rounded-xl">
            <UserGroupIcon className="h-4 w-4 text-[#0062AF]" />
            <p className="text-sm font-semibold text-[#0062AF]">Filtré par : <span className="font-black">{selectedCommercial}</span></p>
          </div>
        )}

        {/* KPI ventes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Devis Total',     value: selectedCommercial==='all' ? devisStats?.total||0 : filteredCommercialStats[0]?.total||0,       sub: 'Tous statuts',         bar:'bg-sky-500',     bg:'bg-sky-50',     text:'text-sky-600',     icon: DocumentTextIcon },
            { label: 'Devis Validés',   value: selectedCommercial==='all' ? devisStats?.validatedCount||0 : filteredCommercialStats[0]?.validated||0, sub:'Validés + Transformés', bar:'bg-emerald-500', bg:'bg-emerald-50', text:'text-emerald-600', icon: CheckCircleIcon },
            { label: 'CA Total (k TND)',value: `${selectedCommercial==='all' ? ((devisStats?.totalAmount||0)/1000).toFixed(1) : ((filteredCommercialStats[0]?.totalAmount||0)/1000).toFixed(1)}k`, sub:'TND', bar:'bg-violet-500', bg:'bg-violet-50', text:'text-violet-600', icon: CurrencyDollarIcon },
            { label: 'Taux Conversion', value: `${selectedCommercial==='all' ? (commercialStats.length ? Math.round(commercialStats.reduce((s,c)=>s+c.conversionRate,0)/commercialStats.length) : 0) : filteredCommercialStats[0]?.conversionRate||0}%`, sub:'Devis → Ventes', bar:'bg-amber-500', bg:'bg-amber-50', text:'text-amber-600', icon: ArrowTrendingUpIcon },
          ].map((k,i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${k.bar}`} />
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${k.bg}`}><k.icon className={`h-5 w-5 ${k.text}`} /></div>
              <p className="text-2xl font-black text-slate-800 tabular-nums">{k.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{k.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Monthly trend */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CH title="Tendance Mensuelle — Devis" subtitle="6 derniers mois" icon={ChartBarIcon} bg="bg-[#e0f0ff]" border="border-blue-100" text="text-[#0062AF]" />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyDevisData}>
                <defs>
                  <linearGradient id="gDM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0062AF" stopOpacity={0.12} /><stop offset="95%" stopColor="#0062AF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gVM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.12} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="devis" stroke="#0062AF" strokeWidth={2.5} fill="url(#gDM)" name="Devis" />
                <Area type="monotone" dataKey="valides" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gVM)" name="Validés" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Commercial chart + ranking */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <CH title="Performance Commerciaux" subtitle="Devis par commercial" icon={ChartBarIcon} bg="bg-[#e0f0ff]" border="border-blue-100" text="text-[#0062AF]" />
            <div className="p-5">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={filteredCommercialDevisData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="devis" fill="#0062AF" radius={[4,4,0,0]} name="Total devis" />
                  <Bar dataKey="valides" fill="#8b5cf6" radius={[4,4,0,0]} name="Validés" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <CH title="Classement Commerciaux" subtitle="Par montant total généré" icon={ArrowTrendingUpIcon} bg="bg-violet-50" border="border-violet-100" text="text-violet-500" />
            <div className="p-5 space-y-2.5">
              {filteredCommercialStats.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <span className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black flex-none ${i===0?'bg-amber-100 text-amber-600':i===1?'bg-slate-200 text-slate-600':i===2?'bg-orange-100 text-orange-600':'bg-slate-100 text-slate-500'}`}>{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">{c.fullName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0062AF] rounded-full" style={{ width:`${c.conversionRate}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">{c.conversionRate}% conv.</span>
                    </div>
                  </div>
                  <div className="text-right flex-none">
                    <span className="text-xs font-black text-slate-800 tabular-nums">{(c.totalAmount/1000).toFixed(1)}k</span>
                    <p className="text-[10px] text-slate-400">{c.total} devis</p>
                  </div>
                </div>
              ))}
              {filteredCommercialStats.length === 0 && <p className="text-xs text-slate-400 text-center py-6">Aucune donnée</p>}
            </div>
          </div>
        </div>

        {/* Devis status + Forecast */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <CH title="Statut Devis" subtitle={`${devisStats?.total||0} au total`} icon={DocumentTextIcon} bg="bg-sky-50" border="border-sky-100" text="text-sky-500" />
            <div className="p-5 space-y-3">
              {Object.entries(devisStats?.byStatus || {}).map(([status, count]) => {
                const total = devisStats?.total || 1, pct = Math.round((count/total)*100);
                const cm = {'En attente':'bg-amber-400','Validé':'bg-emerald-400','Transformé':'bg-indigo-400'};
                return (
                  <div key={status}>
                    <div className="flex justify-between mb-1.5"><span className="text-xs text-slate-600">{status}</span><span className="text-xs font-bold text-slate-700">{count} ({pct}%)</span></div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${cm[status]||'bg-slate-400'}`} style={{ width:`${pct}%` }} /></div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Montant total</p>
                <p className="text-xl font-black text-slate-800 mt-1">{((devisStats?.totalAmount||0)/1000).toFixed(1)}k TND</p>
              </div>
            </div>
          </div>

          {(() => {
            const hist = monthlyDevisData || [], n = hist.length;
            const xM = (n-1)/2;
            const yMd = n ? hist.reduce((s,d)=>s+(d.devis||0),0)/n : 0;
            const yMm = n ? hist.reduce((s,d)=>s+(d.montant||0),0)/n : 0;
            let nd=0,nm=0,den=0;
            hist.forEach((d,i)=>{ nd+=(i-xM)*((d.devis||0)-yMd); nm+=(i-xM)*((d.montant||0)-yMm); den+=(i-xM)**2; });
            const sd=den?nd/den:0, id=yMd-sd*xM, sm=den?nm/den:0, im=yMm-sm*xM;
            const mn=['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Août','Sep','Oct','Nov','Déc'];
            const now=new Date();
            const future=[1,2,3].map(i=>{ const dt=new Date(now.getFullYear(),now.getMonth()+i,1); return { name:mn[dt.getMonth()], prevDevis:Math.max(0,Math.round(id+sd*(n+i-1))), prevMontant:Math.max(0,Math.round(im+sm*(n+i-1))) }; });
            const combined=[...hist.map(d=>({name:d.name,actuel:d.devis})),...future.map(f=>({name:f.name+' â˜…',prevDevis:f.prevDevis}))];
            if(n>0) combined[n-1].prevDevis=hist[n-1].devis;
            const growth=sd>0?'hausse':sd<0?'baisse':'stable';
            const gc=sd>0?'text-emerald-600 bg-emerald-50 border-emerald-200':sd<0?'text-rose-600 bg-rose-50 border-rose-200':'text-slate-600 bg-slate-100 border-slate-200';
            return (
              <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <CH title="Prévisions des Ventes" subtitle="Projection 3 prochains mois (â˜…)" icon={SparklesIcon} bg="bg-violet-50" border="border-violet-100" text="text-violet-500" />
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border mr-1 shrink-0 ${gc}`}>Tendance : {growth}</span>
                </div>
                <div className="p-5">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={combined}>
                      <defs>
                        <linearGradient id="gFa" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0062AF" stopOpacity={0.12}/><stop offset="95%" stopColor="#0062AF" stopOpacity={0}/></linearGradient>
                        <linearGradient id="gFp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius:12, border:'1px solid #e2e8f0', fontSize:12 }} formatter={(v,n)=>[v,n==='actuel'?'Réel':'Prévu']} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} formatter={v=>v==='actuel'?'Devis réels':'Devis prévus â˜…'} />
                      <Area type="monotone" dataKey="actuel" stroke="#0062AF" strokeWidth={2.5} fill="url(#gFa)" dot={false} />
                      <Area type="monotone" dataKey="prevDevis" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gFp)" dot={false} strokeDasharray="5 3" connectNulls />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {future.map((f,i)=>(
                      <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{f.name}</p>
                        <p className="text-lg font-black text-slate-800 mt-1">{f.prevDevis}</p>
                        <p className="text-[10px] text-violet-600 font-semibold">{f.prevMontant}k TND</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

      </div>)} {/* end ventes tab */}


      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           TAB: SAV & PROJETS
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeDashTab === 'sav' && (
      <div className="space-y-5">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label:'Total SAV',      value:reclamationStats?.total||0,           sub:'Tous statuts',              bar:'bg-rose-500',    bg:'bg-rose-50',    text:'text-rose-600',    icon:DocumentTextIcon },
            { label:'SAV Ouverts',    value:reclamationStats?.openCount||0,        sub:'En attente',                bar:'bg-amber-500',   bg:'bg-amber-50',   text:'text-amber-600',   icon:ClockIcon },
            { label:'Taux Résol.',    value:`${resolutionRate}%`,                  sub:'Résolus + Fermés',          bar:'bg-emerald-500', bg:'bg-emerald-50', text:'text-emerald-600', icon:CheckCircleIcon },
            { label:'Projets Actifs', value:projectStats?.activeCount||0,          sub:`${projectStats?.completedCount||0} complétés`, bar:'bg-indigo-500', bg:'bg-indigo-50', text:'text-indigo-600', icon:BriefcaseIcon },
          ].map((k,i)=>(
            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${k.bar}`} />
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${k.bg}`}><k.icon className={`h-5 w-5 ${k.text}`} /></div>
              <p className="text-2xl font-black text-slate-800 tabular-nums">{k.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{k.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <CH title="Tendance SAV Mensuelle" subtitle="6 derniers mois" icon={ChartBarIcon} bg="bg-rose-50" border="border-rose-100" text="text-rose-500" />
            <div className="p-5">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyTrendData}>
                  <defs>
                    <linearGradient id="gSO" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.12}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gSR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.12}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius:12, border:'1px solid #e2e8f0', fontSize:12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                  <Area type="monotone" dataKey="ouvertes" stroke="#ef4444" strokeWidth={2.5} fill="url(#gSO)" name="Ouvertes" />
                  <Area type="monotone" dataKey="resolues" stroke="#10b981" strokeWidth={2.5} fill="url(#gSR)" name="Résolues" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <CH title="SAV par Priorité" subtitle="Distribution actuelle" icon={ChartBarIcon} bg="bg-amber-50" border="border-amber-100" text="text-amber-500" />
            <div className="p-5">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={priorityChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} width={55} />
                  <Tooltip contentStyle={{ borderRadius:12, border:'1px solid #e2e8f0', fontSize:12 }} />
                  <Bar dataKey="value" radius={[0,6,6,0]} name="Nombre">{priorityChartData.map((e,i)=><Cell key={i} fill={e.fill} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <CH title="Top Techniciens" subtitle="Réclamations assignées" icon={UsersIcon} bg="bg-teal-50" border="border-teal-100" text="text-teal-500" />
            <div className="p-5">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={technicianStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius:12, border:'1px solid #e2e8f0', fontSize:12 }} />
                  <Bar dataKey="total" fill="#14b8a6" radius={[4,4,0,0]} name="Total" />
                  <Bar dataKey="resolved" fill="#99f6e4" radius={[4,4,0,0]} name="Résolues" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <CH title="Types de SAV" subtitle="Répartition par catégorie" icon={ChartBarIcon} bg="bg-amber-50" border="border-amber-100" text="text-amber-500" />
            <div className="p-5">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={typeReclamationData} cx="50%" cy="50%" outerRadius={75} dataKey="value" paddingAngle={2}>
                    {typeReclamationData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius:12, border:'1px solid #e2e8f0', fontSize:12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <CH title="Projets par Statut" subtitle={`${projectStats?.total||0} au total`} icon={BriefcaseIcon} bg="bg-indigo-50" border="border-indigo-100" text="text-indigo-500" />
            <div className="p-5 space-y-4">
              {Object.entries(projectStats?.byStatus||{}).map(([status,count])=>{
                const total=projectStats?.total||1, pct=Math.round((count/total)*100);
                const cm={'Actif':'bg-indigo-400','Complété':'bg-emerald-400','En attente':'bg-amber-400','Suspendu':'bg-rose-400'};
                return (
                  <div key={status}>
                    <div className="flex justify-between mb-1.5"><span className="text-xs font-medium text-slate-600">{status}</span><span className="text-xs font-bold text-slate-700">{count} ({pct}%)</span></div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${cm[status]||'bg-slate-400'}`} style={{ width:`${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <CH title="Utilisateurs par Rôle" subtitle={`${userStats?.activeCount||0} actifs / ${userStats?.total||0} total`} icon={UsersIcon} bg="bg-amber-50" border="border-amber-100" text="text-amber-500" />
            <div className="p-5">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={Object.entries(userStats?.byRole||{}).map(([name,value])=>({name,value}))} cx="50%" cy="50%" outerRadius={70} dataKey="value" paddingAngle={2}>
                    {Object.keys(userStats?.byRole||{}).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius:12, border:'1px solid #e2e8f0', fontSize:12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>)} {/* end sav tab */}


      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           TAB: IA & RÉGIONS
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeDashTab === 'ia' && (
      <div className="space-y-5">

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Satisfaction */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <CH title="Satisfaction Client" subtitle="Score global" icon={SparklesIcon} bg="bg-emerald-50" border="border-emerald-100" text="text-emerald-500" />
            <div className="p-5 flex flex-col items-center gap-3">
              <div className="relative h-36 w-36">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="72" cy="72" r="62" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                  <circle cx="72" cy="72" r="62"
                    stroke={(globalSatisfaction?.score||0)>=8?'#10b981':(globalSatisfaction?.score||0)>=6?'#f59e0b':'#ef4444'}
                    strokeWidth="10" fill="transparent" strokeDasharray={389.6}
                    strokeDashoffset={389.6-(389.6*(globalSatisfaction?.score||0))/10} className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-800">{globalSatisfaction?.score||'—'}</span>
                  <span className="text-[10px] font-bold text-slate-400">/ 10</span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${(globalSatisfaction?.score||0)>=8?'bg-emerald-50 text-emerald-600 border-emerald-200':(globalSatisfaction?.score||0)>=6?'bg-amber-50 text-amber-600 border-amber-200':'bg-rose-50 text-rose-600 border-rose-200'}`}>
                {globalSatisfaction?.label||'Excellente'}
              </span>
              <div className="w-full grid grid-cols-3 gap-2 mt-1">
                {[{v:globalSatisfaction?.resolvedClaims??0,l:'Résolues',bg:'bg-emerald-50',t:'text-emerald-700',s:'text-emerald-500'},
                  {v:globalSatisfaction?.inProgressClaims??0,l:'En cours',bg:'bg-amber-50',t:'text-amber-700',s:'text-amber-500'},
                  {v:globalSatisfaction?.openClaims??0,l:'Ouvertes',bg:'bg-slate-50',t:'text-slate-700',s:'text-slate-400'},
                ].map((x,i)=>(
                  <div key={i} className={`flex flex-col items-center p-2.5 rounded-xl ${x.bg}`}>
                    <span className={`text-sm font-black ${x.t}`}>{x.v}</span>
                    <span className={`text-[9px] font-bold uppercase mt-0.5 ${x.s}`}>{x.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Goal predictions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <CH title="Prédiction Objectifs" subtitle="Analyse prédictive" icon={ArrowTrendingUpIcon} bg="bg-violet-50" border="border-violet-100" text="text-violet-500" />
            <div className="p-5 space-y-3 overflow-y-auto max-h-72">
              {goalPredictions.length > 0 ? goalPredictions.slice(0,4).map((pred,i)=>(
                <div key={i} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-bold text-slate-700 truncate flex-1">{pred.commercial}</p>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${pred.willReach?'bg-emerald-100 text-emerald-700':'bg-rose-100 text-rose-700'}`}>
                      {pred.willReach?'âœ“ Atteindra':'âœ— À risque'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pred.willReach?'bg-emerald-400':'bg-rose-400'}`} style={{ width:`${Math.min(100,Math.round((pred.currentProgress/pred.target)*100)||0)}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{Math.round((pred.currentProgress/pred.target)*100)||0}% — {pred.target.toLocaleString()} DT</p>
                </div>
              )) : <p className="text-xs text-slate-400 text-center py-8">Aucune prédiction disponible</p>}
            </div>
          </div>

          {/* IA recommendations */}
          <div className="bg-[#0062AF] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-none">
                <SparklesIcon className="h-4 w-4 text-sky-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Recommandations IA</h3>
                <p className="text-xs text-blue-300/70">Insights intelligents</p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {(recommendations.length>0?recommendations.slice(0,4):[
                `Taux de résolution SAV : ${resolutionRate}%`,
                `${projectStats?.activeCount||0} projets actifs en cours`,
                `${objectifStats?.achievementRate||0}% des objectifs atteints`,
                `${commercialStats.length} commerciaux actifs`,
              ]).map((rec,i)=>(
                <div key={i} className="flex gap-2">
                  <span className="mt-0.5 h-5 w-5 rounded-full bg-white/10 text-sky-300 flex items-center justify-center text-[9px] font-bold flex-none">{i+1}</span>
                  <p className="text-xs text-blue-100 leading-relaxed">{rec.message||rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Products yield */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CH title="Rendement Produits" subtitle="Top 5 — Performance relative" icon={ChartBarIcon} bg="bg-emerald-50" border="border-emerald-100" text="text-emerald-500" />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={productYield.slice(0,5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ borderRadius:12, border:'1px solid #e2e8f0', fontSize:12 }} />
                <Bar dataKey="yield" fill="#10b981" radius={[0,6,6,0]} name="Rendement" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 24 Gouvernorats */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Section header */}
          <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center gap-4 justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#e0f0ff] border border-blue-100 flex items-center justify-center flex-none">
                <SparklesIcon className="h-5 w-5 text-[#0062AF]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Déploiement Commerciaux — Tunisie</h3>
                <p className="text-xs text-slate-400 mt-0.5">Analyse ML · 24 gouvernorats · Recommandations par trimestre</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Trimestre selector */}
              <div className="flex rounded-lg border border-slate-200 overflow-hidden text-[11px] font-bold bg-white">
                {[1,2,3,4].map(t=>(
                  <button key={t} onClick={()=>{ setMlTrimestre(t); fetchMlPredictions(t,mlYear); }}
                    className={`px-3.5 py-1.5 transition-all border-r border-slate-100 last:border-0 ${mlTrimestre===t?'bg-[#0062AF] text-white':'text-slate-500 hover:bg-slate-50'}`}>
                    T{t}
                  </button>
                ))}
              </div>
              {/* Year selector — from current year + 4 */}
              <select value={mlYear} onChange={e=>{const y=Number(e.target.value);setMlYear(y);fetchMlPredictions(mlTrimestre,y);}}
                className="h-8 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#0062AF]/40 cursor-pointer">
                {Array.from({length:5},(_, i)=>new Date().getFullYear()+i).map(y=>(
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              {mlLoading && <span className="text-[10px] text-slate-400 animate-pulse">Analyse…</span>}
              {/* Legend */}
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="text-xs">↑</span> Renforcer
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="text-xs">→</span> Maintenir
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  <span className="text-xs">↓</span> Réduire
                </span>
              </div>
              {isMLAvailable
                ? <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#e0f0ff] text-[#0062AF] border border-blue-200 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#0062AF] animate-pulse inline-block" />ML actif</span>
                : <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 border border-slate-200">ML hors ligne</span>}
            </div>
          </div>

          {isMLAvailable && (()=>{
            const getReco=r=>(r.recommandation||'').toUpperCase().replace(/[Éé]/g,'E');
            const aug=(regionalPredictions||[]).filter(r=>getReco(r)==='AUGMENTER').length;
            const mai=(regionalPredictions||[]).filter(r=>getReco(r)==='MAINTENIR').length;
            const red=(regionalPredictions||[]).filter(r=>getReco(r)==='REDUIRE').length;
            return (
              <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
                {[{count:aug,arrow:'↑',label:'Renforcer',sub:'gouvernorats où augmenter',bg:'bg-emerald-50 border-emerald-200',t:'text-emerald-700',s:'text-emerald-500'},
                  {count:mai,arrow:'→',label:'Maintenir',sub:'gouvernorats stables',bg:'bg-amber-50 border-amber-200',t:'text-amber-700',s:'text-amber-500'},
                  {count:red,arrow:'↓',label:'Réduire',sub:'gouvernorats à alléger',bg:'bg-rose-50 border-rose-200',t:'text-rose-700',s:'text-rose-500'},
                ].map((item,i)=>(
                  <div key={i} className={`flex items-center gap-4 border rounded-2xl px-6 py-4 min-w-[180px] ${item.bg}`}>
                    <div className={`text-4xl font-black leading-none ${item.t}`}>{item.count}</div>
                    <div>
                      <p className={`text-sm font-black flex items-center gap-1 ${item.t}`}>
                        <span>{item.arrow}</span> {item.label}
                      </p>
                      <p className={`text-[11px] mt-0.5 ${item.s}`}>{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {GOUVERNORATS.map(g=>{
              const r=(regionalPredictions||[]).find(x=>x.region===g.key);
              const prob=r!=null?Math.round(r.probabilite_hausse??0):null;
              const reco=(r?.recommandation||'').toUpperCase().replace(/[Éé]/g,'E');
              const confiance=r!=null?Math.round(r.confiance??0):null;
              const hasData=!!r;
              const styles={
                AUGMENTER:{
                  card:'border-emerald-200 bg-emerald-50/40',topBar:'bg-emerald-400',
                  badge:'bg-emerald-100 text-emerald-700 border border-emerald-200',
                  text:'text-emerald-700',bar:'#10b981',icon:'↑',label:'Renforcer',sub:'Augmenter'
                },
                MAINTENIR:{
                  card:'border-amber-200 bg-amber-50/30',topBar:'bg-amber-400',
                  badge:'bg-amber-100 text-amber-700 border border-amber-200',
                  text:'text-amber-700',bar:'#f59e0b',icon:'→',label:'Maintenir',sub:'Stable'
                },
                REDUIRE:{
                  card:'border-rose-200 bg-rose-50/30',topBar:'bg-rose-400',
                  badge:'bg-rose-100 text-rose-700 border border-rose-200',
                  text:'text-rose-700',bar:'#f43f5e',icon:'↓',label:'Réduire',sub:'Alléger'
                },
                DEFAULT:{
                  card:'border-slate-200 bg-white',topBar:'bg-slate-200',
                  badge:'bg-slate-100 text-slate-400 border border-slate-200',
                  text:'text-slate-400',bar:'#cbd5e1',icon:'—',label:'—',sub:''
                },
              };
              const s=styles[reco]||styles.DEFAULT;
              const radius=26, circ=2*Math.PI*radius;
              const offset=hasData?circ-(circ*(prob/100)):circ;
              return (
                <div key={g.name} className={`border rounded-2xl overflow-hidden flex flex-col hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ${s.card}`}>
                  <div className={`h-0.5 ${s.topBar}`} />
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-xs font-black text-slate-800 leading-tight">{g.name}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap flex-none ${s.badge}`}>{s.icon} {s.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg width="60" height="60" className="flex-none -rotate-90">
                        <circle cx="30" cy="30" r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="5" />
                        <circle cx="30" cy="30" r={radius} fill="none" stroke={!hasData?'#cbd5e1':s.bar} strokeWidth="5"
                          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                          style={{ transition:'stroke-dashoffset 0.8s ease' }} />
                        <text x="30" y="30" textAnchor="middle" dominantBaseline="central"
                          style={{ transform:'rotate(90deg)', transformOrigin:'30px 30px', fontSize:11, fontWeight:900, fill:!hasData?'#94a3b8':s.bar }}>
                          {hasData?`${prob}%`:'—'}
                        </text>
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-bold leading-tight ${s.text}`}>{s.sub}</p>
                        {hasData
                          ?<p className="text-[10px] text-slate-400 mt-1">Confiance <span className="font-bold text-slate-600">{confiance}%</span></p>
                          :<p className="text-[10px] text-slate-300 mt-1">en attente ML</p>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>)} {/* end ia tab */}

    </div>
  );
};

export default Dashboard;
