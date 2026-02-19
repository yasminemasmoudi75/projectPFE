import { useState } from 'react';
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
  EyeIcon
} from '@heroicons/react/24/outline';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import useAuth from '../../hooks/useAuth';

const dataPerformance = [
  { name: 'Lun', sales: 4200, projects: 2800 },
  { name: 'Mar', sales: 3100, projects: 1500 },
  { name: 'Mer', sales: 5200, projects: 4200 },
  { name: 'Jeu', sales: 2900, projects: 3100 },
  { name: 'Ven', sales: 5100, projects: 4900 },
  { name: 'Sam', sales: 2500, projects: 2200 },
  { name: 'Dim', sales: 3600, projects: 2800 },
];

const recentActivities = [
  { id: 1, type: 'devis', title: 'Devis #DV-2024-0089', client: 'Tech Solutions SA', amount: '12,500 TND', status: 'pending', time: 'Il y a 2h' },
  { id: 2, type: 'client', title: 'Nouveau client ajouté', client: 'Global Import SARL', amount: null, status: 'success', time: 'Il y a 4h' },
  { id: 3, type: 'project', title: 'Projet livré avec succès', client: 'Pharma Plus', amount: '45,000 TND', status: 'completed', time: 'Hier' },
  { id: 4, type: 'alert', title: 'Relance commerciale requise', client: 'ABC Corporation', amount: '8,200 TND', status: 'warning', time: 'Il y a 2j' },
];

const topClients = [
  { name: 'Tech Solutions SA', revenue: '125,400 TND', growth: '+18%', avatar: 'TS' },
  { name: 'Global Import SARL', revenue: '98,200 TND', growth: '+12%', avatar: 'GI' },
  { name: 'Pharma Plus', revenue: '87,500 TND', growth: '+8%', avatar: 'PP' },
  { name: 'ABC Corporation', revenue: '65,300 TND', growth: '-2%', avatar: 'AC' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('week');

  const stats = [
    {
      name: "Chiffre d'affaires",
      value: '248,500',
      unit: 'TND',
      icon: CurrencyDollarIcon,
      trend: '+18.2%',
      trendUp: true,
      color: 'blue',
      description: 'vs mois dernier'
    },
    {
      name: 'Nouveaux Clients',
      value: '2,300',
      unit: '',
      icon: UserGroupIcon,
      trend: '+3%',
      trendUp: true,
      color: 'emerald',
      description: 'ce trimestre'
    },
    {
      name: 'Contrats Signés',
      value: '3,462',
      unit: '',
      icon: DocumentTextIcon,
      trend: '-2%',
      trendUp: false,
      color: 'amber',
      description: 'en cours'
    },
    {
      name: 'Performance',
      value: '103,430',
      unit: 'TND',
      icon: ArrowTrendingUpIcon,
      trend: '+5%',
      trendUp: true,
      color: 'purple',
      description: 'objectif atteint'
    },
  ];

  const getIconStyle = (color) => {
    const styles = {
      blue: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
      emerald: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      amber: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      purple: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)'
    };
    return styles[color] || styles.blue;
  };

  return (
    <div className="animate-fade-in space-y-8 pb-12">

      {/* Welcome Banner */}
      <div className="card-luxury p-0 overflow-hidden">
        <div className="relative p-8 lg:p-10 bg-gradient-blue">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="text-white">
              <p className="text-white/60 text-sm font-medium mb-2">Bienvenue,</p>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-2">
                {user?.FullName || 'Utilisateur'} 👋
              </h1>
              <p className="text-white/70 text-sm max-w-md">
                Voici un aperçu de votre activité commerciale. Vous avez <span className="text-white font-bold">3 nouvelles opportunités</span> à explorer.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/devis/new')}
                className="px-5 py-2.5 bg-white text-blue-600 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Nouveau Devis
              </button>
              <button className="px-5 py-2.5 border-2 border-white/30 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all">
                Voir Rapports
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card-luxury p-0 overflow-hidden group hover:-translate-y-1 transition-all">
            <div className="p-6 flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{stat.name}</p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-extrabold text-slate-800">{stat.value}</span>
                  {stat.unit && <span className="text-sm font-medium text-slate-400">{stat.unit}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold flex items-center gap-1 ${stat.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {stat.trendUp ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                    {stat.trend}
                  </span>
                  <span className="text-xs text-slate-400">{stat.description}</span>
                </div>
              </div>
              <div
                className="icon-shape shadow-soft group-hover:scale-110 transition-transform"
                style={{ background: getIconStyle(stat.color) }}
              >
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="h-1" style={{ background: getIconStyle(stat.color) }}></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* Sales Chart Section */}
        <div className="xl:col-span-8 card-luxury p-0 overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Analyse des Ventes</h2>
              <p className="text-sm text-slate-500 mt-1">
                <span className="text-emerald-600 font-semibold">+5% de croissance</span> comparé à l'année précédente
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {['week', 'month', 'year'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === tab
                    ? 'bg-white shadow-soft text-slate-800'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  {tab === 'week' ? 'Semaine' : tab === 'month' ? 'Mois' : 'Année'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 lg:p-8">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataPerformance} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSalesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                      background: '#fff'
                    }}
                    itemStyle={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}
                    labelStyle={{ fontWeight: 600, color: '#64748b', marginBottom: '8px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSalesGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Sidebar - AI & Activities */}
        <div className="xl:col-span-4 space-y-6">

          {/* AI Insight Card */}
          <div className="card-luxury p-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-blue shadow-glow-blue">
                  <SparklesIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Nexus AI</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Intelligence Artificielle</p>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed mb-5">
                "Opportunité détectée: <span className="text-white font-semibold">Tech Solutions</span> présente un potentiel de croissance de <span className="text-emerald-400 font-bold">+35%</span>."
              </p>

              <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-white/10">
                <EyeIcon className="h-4 w-4" />
                Explorer les insights
              </button>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="card-luxury p-0 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-transparent flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Activités Récentes</h3>
              <button className="text-xs font-bold text-blue-600 uppercase tracking-wider hover:underline">
                Voir tout
              </button>
            </div>
            <div className="divide-y divide-slate-100/50">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="p-4 px-6 hover:bg-blue-50/30 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 ${activity.status === 'success' ? 'bg-emerald-100 text-emerald-600' :
                      activity.status === 'warning' ? 'bg-amber-100 text-amber-600' :
                        activity.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                          'bg-slate-100 text-slate-600'
                      }`}>
                      {activity.type === 'devis' ? <DocumentTextIcon className="h-5 w-5" /> :
                        activity.type === 'client' ? <UserGroupIcon className="h-5 w-5" /> :
                          <BriefcaseIcon className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{activity.title}</p>
                      <p className="text-xs text-slate-500 truncate">{activity.client}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-400">{activity.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Clients */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Top Partenaires</h3>
            <p className="text-sm text-slate-500">Vos clients les plus performants ce mois</p>
          </div>
          <button className="btn-outline flex items-center gap-2">
            <ChartBarIcon className="h-4 w-4" />
            Voir Analytics
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {topClients.map((client, index) => (
            <div key={index} className="card-luxury p-6 group hover:-translate-y-1 transition-all cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-blue flex items-center justify-center text-white font-bold text-lg shadow-glow-blue group-hover:scale-110 transition-transform">
                  {client.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{client.name}</p>
                  <p className={`text-xs font-semibold ${client.growth.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {client.growth} croissance
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Revenu Total</p>
                <p className="text-xl font-extrabold text-slate-800">{client.revenue}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
