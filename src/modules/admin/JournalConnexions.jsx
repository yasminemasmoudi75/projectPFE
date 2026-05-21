import { useState, useEffect, useCallback } from 'react';
import {
    ShieldCheckIcon, MagnifyingGlassIcon, ArrowPathIcon,
    ChevronLeftIcon, ChevronRightIcon, ComputerDesktopIcon,
    UserCircleIcon, CalendarDaysIcon,
    ArrowRightOnRectangleIcon, ArrowLeftOnRectangleIcon,
    UsersIcon, XCircleIcon
} from '@heroicons/react/24/outline';
import axios from '../../app/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';

const fmtDate = (v) => {
    if (!v) return '—';
    return new Date(v).toLocaleString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const ACTION_META = {
    LOGIN_SUCCESS: { label: 'Connexion',    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', icon: ArrowLeftOnRectangleIcon  },
    LOGIN_FAILED:  { label: 'Échec',        bg: 'bg-rose-50 text-rose-700 border-rose-200',           dot: 'bg-rose-400',    icon: XCircleIcon                },
    LOGOUT:        { label: 'Déconnexion',  bg: 'bg-slate-100 text-slate-600 border-slate-200',       dot: 'bg-slate-400',   icon: ArrowRightOnRectangleIcon  },
};

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-none ${color}`}>
            <Icon className="h-5 w-5" />
        </div>
        <div>
            <p className="text-2xl font-black text-slate-800 leading-none">{value ?? 0}</p>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
            {sub && <p className="text-[10px] text-slate-300 mt-0.5">{sub}</p>}
        </div>
    </div>
);

const JournalConnexions = () => {
    const [logs, setLogs]             = useState([]);
    const [stats, setStats]           = useState({});
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState('');
    const [dateFrom, setDateFrom]     = useState('');
    const [dateTo, setDateTo]         = useState('');
    const [actionFilter, setActionFilter] = useState('ALL');
    const [page, setPage]             = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal]           = useState(0);
    const LIMIT = 50;

    const fetchLogs = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const params = { page: p, limit: LIMIT };
            if (search)       params.search   = search;
            if (dateFrom)     params.dateFrom = dateFrom;
            if (dateTo)       params.dateTo   = dateTo;
            if (actionFilter && actionFilter !== 'ALL') params.action = actionFilter;

            const data = await axios.get('/auth/logs', { params });

            setLogs(data.data || []);
            setStats(data.stats || {});
            setTotal(data.count || 0);
            setTotalPages(data.totalPages || 1);
            setPage(p);
        } catch {
            toast.error('Erreur lors du chargement du journal');
        } finally {
            setLoading(false);
        }
    }, [search, dateFrom, dateTo, actionFilter]);

    useEffect(() => { fetchLogs(1); }, [dateFrom, dateTo, actionFilter]);

    const handleSearch = (e) => { e.preventDefault(); fetchLogs(1); };
    const handleReset  = () => {
        setSearch(''); setDateFrom(''); setDateTo(''); setActionFilter('ALL');
    };

    return (
        <div className="min-h-screen bg-slate-50/70 pb-16">

            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-6 py-5">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center">
                            <ShieldCheckIcon className="h-6 w-6 text-indigo-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800">Journal des Connexions</h1>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Historique complet des sessions — {total.toLocaleString('fr-FR')} entrées
                            </p>
                        </div>
                    </div>
                    <button onClick={() => fetchLogs(page)}
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-all">
                        <ArrowPathIcon className="h-4 w-4" /> Actualiser
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard icon={ComputerDesktopIcon}      label="Sessions aujourd'hui"  value={stats.totalToday}   color="bg-indigo-50 text-indigo-500"  sub="depuis minuit" />
                    <StatCard icon={ArrowLeftOnRectangleIcon}  label="Connexions réussies"   value={stats.successToday} color="bg-emerald-50 text-emerald-500" />
                    <StatCard icon={XCircleIcon}               label="Échecs (auj.)"         value={stats.failedToday}  color="bg-rose-50 text-rose-500"      />
                    <StatCard icon={UsersIcon}                 label="Déconnexions (auj.)"   value={stats.logoutToday}  color="bg-violet-50 text-violet-500"  />
                </div>

                {/* Filtres */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Nom, login, IP…"
                                className="w-full h-9 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
                        </div>

                        {/* Filtre action */}
                        <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs font-bold">
                            {[
                                { val: 'ALL',           label: 'Tous'       },
                                { val: 'LOGIN_SUCCESS', label: 'Connexions' },
                                { val: 'LOGIN_FAILED',  label: 'Échecs'     },
                                { val: 'LOGOUT',        label: 'Déco.'      },
                            ].map(({ val, label }) => (
                                <button key={val} type="button" onClick={() => setActionFilter(val)}
                                    className={`px-3 py-1.5 transition-all ${actionFilter === val ? 'bg-indigo-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="h-4 w-4 text-slate-400 flex-none" />
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                                className="h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 transition-all" />
                            <span className="text-slate-300 text-xs">→</span>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                                className="h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 transition-all" />
                        </div>

                        <button type="submit"
                            className="h-9 px-4 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
                            Filtrer
                        </button>
                        {(search || dateFrom || dateTo || actionFilter !== 'ALL') && (
                            <button type="button" onClick={handleReset}
                                className="h-9 px-3 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
                                Réinitialiser
                            </button>
                        )}
                    </form>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {total.toLocaleString('fr-FR')} événement{total !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-slate-400">Page {page} / {totalPages}</p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <LoadingSpinner />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                                <ShieldCheckIcon className="h-8 w-8 text-slate-300" />
                            </div>
                            <p className="text-sm font-semibold text-slate-400">Aucun événement trouvé</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        {['Date', 'Action', 'Utilisateur', 'Rôle', 'Détails'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {logs.map((log, idx) => {
                                        const meta = ACTION_META[log.Action] || ACTION_META.LOGOUT;
                                        const ActionIcon = meta.icon;
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-xs text-slate-600 font-mono">{fmtDate(log.DateConnexion)}</span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${meta.bg}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                                                        {meta.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <UserCircleIcon className="h-6 w-6 text-slate-300 flex-none" />
                                                        <div>
                                                            <p className="text-xs font-semibold text-slate-700 leading-tight">
                                                                {log.FullName || log.LoginName || `#${log.ID_Utilisateur}`}
                                                            </p>
                                                            {log.FullName && log.LoginName && (
                                                                <p className="text-[10px] text-slate-400">{log.LoginName}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">{log.Role || '—'}</span>
                                                </td>
                                                <td className="px-4 py-3 max-w-[200px]">
                                                    <span className="text-xs text-slate-400 truncate block">{log.Details || '—'}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                            <button onClick={() => fetchLogs(page - 1)} disabled={page <= 1}
                                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                <ChevronLeftIcon className="h-4 w-4" /> Précédent
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                    const p = totalPages <= 7 ? i + 1 : Math.max(1, page - 3) + i;
                                    if (p < 1 || p > totalPages) return null;
                                    return (
                                        <button key={p} onClick={() => fetchLogs(p)}
                                            className={`h-8 w-8 rounded-lg text-xs font-semibold transition-all ${p === page ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>
                                            {p}
                                        </button>
                                    );
                                })}
                            </div>
                            <button onClick={() => fetchLogs(page + 1)} disabled={page >= totalPages}
                                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                Suivant <ChevronRightIcon className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JournalConnexions;
