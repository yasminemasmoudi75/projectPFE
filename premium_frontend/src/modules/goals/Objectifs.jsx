import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChartBarIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    TrophyIcon,
    FlagIcon,
    ShoppingBagIcon,
    UserPlusIcon,
    UserGroupIcon,
    CalendarIcon,
    PlusIcon,
    SparklesIcon,
    ArrowRightIcon,
    ChevronDownIcon,
    CheckCircleIcon,
    BriefcaseIcon,
    ArrowTrendingUpIcon,
    BanknotesIcon,
    UsersIcon,
    DocumentTextIcon,
    ArrowPathIcon,
    EyeIcon
} from '@heroicons/react/24/outline';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchObjectifs, updateObjectif } from './objectifSlice';

const Objectifs = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [selectedCommercial, setSelectedCommercial] = useState('Ahmed');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const commercials = [
        { id: 1, name: 'Ahmed', role: 'Business Developer Senior', avatar: 'https://ui-avatars.com/api/?name=Ahmed&background=2563eb&color=fff', userId: 1 },
        { id: 2, name: 'Sami', role: 'Chargé de Compte', avatar: 'https://ui-avatars.com/api/?name=Sami&background=2563eb&color=fff', userId: 2 },
        { id: 3, name: 'Youssef', role: 'Consultant Avant-vente', avatar: 'https://ui-avatars.com/api/?name=Youssef&background=2563eb&color=fff', userId: 3 },
        { id: 4, name: 'Amine', role: 'Directeur Commercial', avatar: 'https://ui-avatars.com/api/?name=Amine&background=2563eb&color=fff', userId: 4 }
    ];

    const months = [
        { id: 1, name: 'Janvier' }, { id: 2, name: 'Février' }, { id: 3, name: 'Mars' },
        { id: 4, name: 'Avril' }, { id: 5, name: 'Mai' }, { id: 6, name: 'Juin' },
        { id: 7, name: 'Juillet' }, { id: 8, name: 'Août' }, { id: 9, name: 'Septembre' },
        { id: 10, name: 'Octobre' }, { id: 11, name: 'Novembre' }, { id: 12, name: 'Décembre' }
    ];

    const chartData = [
        { month: 'Oct', sales: 12000 },
        { month: 'Nov', sales: 15000 },
        { month: 'Déc', sales: 18000 },
        { month: 'Jan', sales: 21500 },
        { month: 'Fév', sales: 18450 },
    ];

    const MOCK_DB_OBJECTIFS = [
        { id: 1, commercial: 'Ahmed', mois: 2, annee: 2026, type: "Volume de Ventes", cible: 25000, realise: 18450, color: 'blue', icon: BanknotesIcon, unit: 'TND' },
        { id: 2, commercial: 'Ahmed', mois: 2, annee: 2026, type: "Nouvelles Acquisitions", cible: 10, realise: 7, color: 'emerald', icon: UsersIcon, unit: 'Client(s)' },
        { id: 3, commercial: 'Ahmed', mois: 2, annee: 2026, type: "Pipeline RDV", cible: 40, realise: 32, color: 'blue', icon: CalendarIcon, unit: 'RDV' },
        { id: 4, commercial: 'Sami', mois: 2, annee: 2026, type: "Volume de Ventes", cible: 30000, realise: 21000, color: 'blue', icon: BanknotesIcon, unit: 'TND' },
    ];

    const dispatch = useDispatch();
    const { objectifs, loading: reduxLoading } = useSelector((state) => state.objectifs);

    useEffect(() => {
        const comm = commercials.find(c => c.name === selectedCommercial);
        dispatch(fetchObjectifs({
            userId: comm?.userId,
            mois: selectedMonth,
            annee: selectedYear
        }));
    }, [selectedCommercial, selectedMonth, selectedYear, dispatch]);

    const handleUpdateProgress = async (id, val) => {
        try {
            await dispatch(updateObjectif({ id, data: { Montant_Realise_Actuel: parseFloat(val) } })).unwrap();
            toast.success("Mise à jour effectuée");
        } catch (error) {
            toast.error("Erreur lors de la mise à jour");
        }
    };

    if (reduxLoading && objectifs.length === 0) return <LoadingSpinner />;

    const currentComm = commercials.find(c => c.name === selectedCommercial);
    const totalTarget = objectifs.reduce((acc, curr) => acc + (curr.MontantCible || 0), 0);
    const totalRealised = objectifs.reduce((acc, curr) => acc + (curr.Montant_Realise_Actuel || 0), 0);
    const globalProgress = totalTarget > 0 ? (totalRealised / totalTarget) * 100 : 0;

    return (
        <div className="animate-fade-in space-y-8 pb-12">
            {/* Executive Top Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="badge badge-primary">
                            <SparklesIcon className="h-3 w-3 mr-1" />
                            Performances
                        </span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Objectifs Commerciaux</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                        Pilotage des indicateurs clés • {months.find(m => m.id === parseInt(selectedMonth)).name} {selectedYear}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white p-1.5 rounded-2xl shadow-soft border border-slate-200">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 cursor-pointer px-4 outline-none"
                        >
                            {months.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <div className="w-px h-5 bg-slate-200 self-center"></div>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 cursor-pointer px-4 outline-none"
                        >
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={() => navigate('/objectifs/new')}
                        className="btn-soft-primary flex items-center gap-2"
                    >
                        <PlusIcon className="h-4 w-4" /> Nouvel Objectif
                    </button>
                </div>
            </div>

            {/* KPI Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Atteinte Cible', value: `${Math.round(globalProgress)}%`, sub: 'Progress. Globale', color: 'blue', icon: ArrowTrendingUpIcon, gradient: 'bg-gradient-blue' },
                    { label: 'Objectif Mensuel', value: `${(totalTarget / 1000).toFixed(1)}k`, sub: 'TND / Période', color: 'cyan', icon: BanknotesIcon, gradient: 'bg-gradient-blue-cyan' },
                    { label: 'Réalisé à date', value: `${(totalRealised / 1000).toFixed(1)}k`, sub: 'TND cumulés', color: 'emerald', icon: CheckCircleIcon, gradient: 'bg-gradient-success' },
                    { label: 'Reste à faire', value: `${((totalTarget - totalRealised) / 1000).toFixed(1)}k`, sub: 'Écart restant', color: 'amber', icon: FlagIcon, gradient: 'bg-gradient-warning' },
                ].map((kpi, i) => (
                    <div key={i} className="card-luxury p-0 overflow-hidden group">
                        <div className="p-6 flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                                <div className="flex items-baseline gap-1.5">
                                    <h3 className="text-2xl font-extrabold text-slate-800">{kpi.value}</h3>
                                    <span className="text-[10px] font-bold text-slate-400">{kpi.sub}</span>
                                </div>
                            </div>
                            <div className={`icon-shape shadow-soft group-hover:scale-110 transition-transform ${kpi.gradient}`}>
                                <kpi.icon className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <div className={`h-1 ${kpi.gradient}`}></div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Commercial Selection */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="px-8 py-5 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-transparent">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Équipe Commerciale</h3>
                        </div>
                        <div className="p-4 space-y-2">
                            {commercials.map(comm => (
                                <button
                                    key={comm.id}
                                    onClick={() => setSelectedCommercial(comm.name)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border ${selectedCommercial === comm.name
                                        ? 'bg-blue-50/50 border-blue-200 shadow-sm ring-1 ring-blue-100'
                                        : 'bg-white border-transparent hover:bg-slate-50'
                                        }`}
                                >
                                    <img src={comm.avatar} className="h-10 w-10 rounded-xl shadow-inner border border-white" alt="" />
                                    <div className="text-left flex-1 min-w-0">
                                        <p className={`text-sm font-bold truncate ${selectedCommercial === comm.name ? 'text-blue-700' : 'text-slate-700'}`}>
                                            {comm.name}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-medium truncate">{comm.role}</p>
                                    </div>
                                    {selectedCommercial === comm.name && (
                                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* AI Insight Card for Objectives */}
                    <div className="card-luxury p-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-gradient-blue rounded-xl shadow-glow-blue">
                                    <SparklesIcon className="h-5 w-5 text-white" />
                                </div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-white/70">Analyse IA</h4>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed font-medium mb-6">
                                Le commercial <span className="text-white font-bold">{selectedCommercial}</span> est sur une trajectoire de croissance. Prévision de clôture à <span className="text-emerald-400 font-bold">105%</span>.
                            </p>
                            <button className="w-full py-3 bg-white/10 hover:bg-white/20 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center justify-center gap-2">
                                <DocumentTextIcon className="h-4 w-4" />
                                Rapport Détaillé
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Side: Analytics & Objectives */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Progress Charts */}
                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-transparent flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Saisonalité du CA</h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">Performance sur les 5 derniers mois</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Réalisé</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                        tickFormatter={(val) => `${val / 1000}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)', background: '#fff' }}
                                        itemStyle={{ fontWeight: 700, fontSize: '12px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="sales"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorSales)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Detailed Goal Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {objectifs.length > 0 ? objectifs.map((goal) => {
                            const progress = Math.min(((goal.Montant_Realise_Actuel || 0) / (goal.MontantCible || 1)) * 100, 100);
                            return (
                                <div key={goal.ID_Objectif} className="card-luxury p-8 group flex flex-col hover:border-blue-300">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className={`icon-shape icon-shape-sm shadow-soft bg-gradient-blue`}>
                                            <BanknotesIcon className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-slate-800 tracking-tight">{Math.round(progress)}%</p>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Achèvement</span>
                                        </div>
                                    </div>

                                    <div className="mb-8">
                                        <h4 className="text-base font-bold text-slate-800 mb-1">{goal.TypeObjectif || 'Objectif Commercial'}</h4>
                                        <div className="flex items-baseline gap-2 mt-4">
                                            <span className={`text-2xl font-black text-slate-800`}>{(goal.Montant_Realise_Actuel || 0).toLocaleString()}</span>
                                            <span className="text-xs font-bold text-slate-400">/ {(goal.MontantCible || 0).toLocaleString()} TND</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto space-y-6">
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 bg-blue-500 shadow-glow-blue`}
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                placeholder="Nouvelle valeur..."
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') handleUpdateProgress(goal.ID_Objectif, e.target.value);
                                                }}
                                                className="input-modern px-4 py-2 text-xs h-10"
                                            />
                                            <button
                                                onClick={(e) => {
                                                    const input = e.currentTarget.previousSibling;
                                                    handleUpdateProgress(goal.ID_Objectif, input.value);
                                                }}
                                                className="h-10 w-10 shrink-0 flex items-center justify-center bg-blue-600 text-white rounded-xl shadow-soft hover:bg-blue-700 transition-all active:scale-95"
                                            >
                                                <PlusIcon className="h-4 w-4 stroke-[3]" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="col-span-2 py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                                <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-soft mb-6">
                                    <FlagIcon className="h-8 w-8" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-500 mb-1">Aucun objectif défini</h3>
                                <p className="text-xs text-slate-400 mb-6">Initialisez les cibles pour cette période</p>
                                <button
                                    onClick={() => navigate('/objectifs/new')}
                                    className="btn-soft-primary px-8"
                                >
                                    Configurer maintenant
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Team Ranking Table */}
            <div className="card-luxury p-0 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-transparent flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="icon-shape icon-shape-sm bg-gradient-blue shadow-glow-blue">
                            <TrophyIcon className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Classement Performance</h3>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/30 text-left border-b border-slate-100/50">
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-4">Rang</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Commercial</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Objectif Atteint</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Volume (TND)</th>
                                <th className="px-8 py-5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest pr-4">Tendance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            {[
                                { rank: 1, name: 'Amine', role: 'Sales Lead', progress: 92, trend: 'up' },
                                { rank: 2, name: 'Ahmed', role: 'Senior User', progress: 74, trend: 'up' },
                                { rank: 3, name: 'Youssef', role: 'Support Specialist', progress: 68, trend: 'steady' },
                                { rank: 4, name: 'Sami', role: 'Account Mgr', progress: 62, trend: 'down' },
                            ].map((row, idx) => (
                                <tr key={idx} className="group hover:bg-blue-50/30 transition-all">
                                    <td className="px-8 py-5 pl-4">
                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-amber-100 text-amber-600 shadow-sm border border-amber-200' : 'bg-slate-100 text-slate-500'}`}>
                                            #{idx + 1}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-gradient-blue rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                                                {row.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 leading-none mb-1 group-hover:text-blue-600 transition-colors">{row.name}</p>
                                                <p className="text-[10px] font-medium text-slate-400">{row.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 max-w-[120px] h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 rounded-full shadow-glow-blue" style={{ width: `${row.progress}%` }}></div>
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">{row.progress}%</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-bold text-slate-600">
                                        {(24500 * (row.progress / 100)).toLocaleString()} TND
                                    </td>
                                    <td className="px-8 py-5 pr-4 text-right">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold ${row.trend === 'up' ? 'text-emerald-700 bg-emerald-100' :
                                            row.trend === 'down' ? 'text-rose-700 bg-rose-100' : 'text-slate-600 bg-slate-100'
                                            }`}>
                                            {row.trend === 'up' ? <ArrowUpIcon className="h-3 w-3" /> :
                                                row.trend === 'down' ? <ArrowDownIcon className="h-3 w-3" /> :
                                                    <ArrowPathIcon className="h-3 w-3" />}
                                            {row.trend === 'up' ? 'Hausse' : row.trend === 'down' ? 'Baisse' : 'Stable'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Footer info */}
                <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between">
                    <span>Dernière synchronisation des données : il y a 5 min</span>
                    <span>Système de Scoring v2.4</span>
                </div>
            </div>
        </div>
    );
};

export default Objectifs;
