import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    MagnifyingGlassIcon,
    ArrowPathIcon,
    ArrowUpRightIcon,
    ShoppingCartIcon,
    CheckBadgeIcon,
    ClockIcon,
    CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { fetchBcv } from './bcvSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';
import clsx from 'clsx';

const BcvList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { bcvList, loading, pagination } = useSelector((s) => s.bcv);

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    const refresh = () => dispatch(fetchBcv({ search }));

    useEffect(() => {
        dispatch(fetchBcv({}));
    }, [dispatch]);

    // Tri / filtrage côté client (les données arrivent toutes en une fois)
    const filtered = useMemo(() => {
        let list = [...(bcvList || [])];
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (b) =>
                    b.LibTiers?.toLowerCase().includes(q) ||
                    String(b.Nf).includes(q) ||
                    b.CodTiers?.toLowerCase().includes(q)
            );
        }
        if (filter === 'valid') list = list.filter((b) => b.Valid);
        if (filter === 'pending') list = list.filter((b) => !b.Valid);
        if (filter === 'livr') list = list.filter((b) => b.bLivr);
        return list;
    }, [bcvList, search, filter]);

    // Statistiques rapides
    const total = bcvList.length;
    const validated = bcvList.filter((b) => b.Valid).length;
    const delivered = bcvList.filter((b) => b.bLivr).length;
    const totalTTC = bcvList.reduce((s, b) => s + (b.TotTTC || 0), 0);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in space-y-8 pb-12">

            {/* ─── Header ─── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="badge badge-primary">
                            <ShoppingCartIcon className="h-3 w-3 mr-1" />
                            Achats
                        </span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                        Bons de Commande
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Consultez et suivez l'ensemble de vos bons de commande.
                    </p>
                </div>
                <button
                    onClick={refresh}
                    className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-all shadow-soft self-start"
                    title="Rafraîchir"
                >
                    <ArrowPathIcon className="h-5 w-5" />
                </button>
            </div>

            {/* ─── KPI Cards ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                    {
                        label: 'Total BC',
                        value: total,
                        icon: ShoppingCartIcon,
                        grad: 'bg-gradient-blue',
                        glow: 'shadow-glow-blue',
                        bar: 'bg-gradient-blue',
                        suffix: 'documents',
                    },
                    {
                        label: 'Validés',
                        value: validated,
                        icon: CheckBadgeIcon,
                        grad: 'bg-gradient-success',
                        glow: 'shadow-glow-emerald',
                        bar: 'bg-gradient-success',
                        suffix: `sur ${total}`,
                    },
                    {
                        label: 'Livrés',
                        value: delivered,
                        icon: ClockIcon,
                        grad: 'bg-gradient-blue-cyan',
                        glow: 'shadow-glow-blue',
                        bar: 'bg-gradient-blue-cyan',
                        suffix: 'bons livrés',
                    },
                    {
                        label: 'C.A. Total TTC',
                        value: formatCurrency(totalTTC),
                        icon: CurrencyDollarIcon,
                        grad: 'bg-gradient-to-br from-violet-500 to-purple-600',
                        glow: '',
                        bar: 'bg-gradient-to-r from-violet-400 to-purple-600',
                        suffix: 'TND',
                    },
                ].map((kpi) => (
                    <div key={kpi.label} className="card-luxury p-0 overflow-hidden">
                        <div className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    {kpi.label}
                                </p>
                                <p className="text-2xl font-extrabold text-slate-800">
                                    {kpi.value}{' '}
                                    <span className="text-xs text-slate-400 font-bold">{kpi.suffix}</span>
                                </p>
                            </div>
                            <div className={clsx('icon-shape', kpi.grad, kpi.glow)}>
                                <kpi.icon className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <div className={clsx('h-1', kpi.bar)} />
                    </div>
                ))}
            </div>

            {/* ─── Filtres ─── */}
            <div className="card-luxury p-0 overflow-hidden">
                <div className="p-5 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher par client, N° de bon…"
                            className="input-modern pl-11"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {[
                            { key: 'all', label: 'Tous' },
                            { key: 'valid', label: 'Validés' },
                            { key: 'pending', label: 'En cours' },
                            { key: 'livr', label: 'Livrés' },
                        ].map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={clsx(
                                    'px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all',
                                    filter === f.key
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                                )}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Table ─── */}
            <div className="card-luxury p-0 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-transparent flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">
                        Liste des Bons de Commande
                    </h3>
                    <span className="text-xs font-medium text-slate-500">
                        {filtered.length} document{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/30 text-left border-b border-slate-100/50">
                                {['N° BC', 'Client', 'Magasin', 'Représentant', 'Montant TTC', 'Date', 'Statut', ''].map((h) => (
                                    <th key={h} className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                                                <ShoppingCartIcon className="h-8 w-8" />
                                            </div>
                                            <p className="text-slate-500 font-medium">Aucun bon de commande trouvé</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((item) => (
                                    <tr
                                        key={item.Guid}
                                        className="group hover:bg-blue-50/30 transition-all cursor-pointer"
                                        onClick={() => navigate(`/bcv/${item.Guid}`)}
                                    >
                                        {/* N° BC */}
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-blue-600 font-mono tracking-tight">
                                                    {item.Prfx || ''}{item.Nf}
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-400 uppercase">
                                                    {item.type || '—'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Client */}
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-xl bg-gradient-blue flex items-center justify-center text-white font-bold text-xs shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                                                    {item.LibTiers?.charAt(0) || '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 leading-none mb-0.5 group-hover:text-blue-600 transition-colors uppercase truncate max-w-[160px]">
                                                        {item.LibTiers || '—'}
                                                    </p>
                                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter truncate max-w-[160px]">
                                                        {item.Ville || item.CodTiers || '—'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Magasin */}
                                        <td className="px-6 py-5">
                                            <span className="text-sm text-slate-700 font-medium">{item.DesMag || item.CodMag || '—'}</span>
                                        </td>

                                        {/* Représentant */}
                                        <td className="px-6 py-5">
                                            <span className="text-sm text-slate-700 font-medium">{item.DesRepres || item.CodRepres || '—'}</span>
                                        </td>

                                        {/* Montant TTC */}
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-extrabold text-slate-800">
                                                {formatCurrency(item.TotTTC)}
                                            </span>
                                        </td>

                                        {/* Date */}
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-medium text-slate-500">{formatDate(item.DatUser)}</span>
                                        </td>

                                        {/* Statut */}
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                <span className={clsx(
                                                    'inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider w-fit',
                                                    item.Valid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                )}>
                                                    {item.Valid ? 'Validé' : 'En cours'}
                                                </span>
                                                {item.bLivr && (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 w-fit">
                                                        Livré
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Action */}
                                        <td className="px-6 py-5">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate(`/bcv/${item.Guid}`); }}
                                                className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                                                title="Voir le détail"
                                            >
                                                <ArrowUpRightIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100/50 text-xs font-medium text-slate-500 flex justify-between items-center">
                    <span>Total : {filtered.length} bon{filtered.length !== 1 ? 's' : ''} de commande</span>
                    <span className="text-slate-400">NexuxCRM Suite v1.2</span>
                </div>
            </div>
        </div>
    );
};

export default BcvList;
