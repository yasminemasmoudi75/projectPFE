import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    MagnifyingGlassIcon,
    ArrowPathIcon,
    ArrowUpRightIcon,
    TruckIcon,
    CheckBadgeIcon,
    CurrencyDollarIcon,
    ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { fetchBlv } from './blvSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';
import clsx from 'clsx';

const BlvList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { blvList, loading, error } = useSelector((s) => s.blv);

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    const refresh = () => dispatch(fetchBlv({ search }));

    useEffect(() => {
        dispatch(fetchBlv({}));
    }, [dispatch]);

    const filtered = useMemo(() => {
        let list = [...(blvList || [])];
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
        return list;
    }, [blvList, search, filter]);

    const total = (blvList || []).length;
    const validated = (blvList || []).filter((b) => b.Valid).length;
    const totalTTC = (blvList || []).reduce((s, b) => s + (b.TotTTC || 0), 0);

    if (loading) return <LoadingSpinner />;

    if (error) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <ExclamationCircleIcon className="h-12 w-12 text-red-400" />
            <p className="text-red-500 font-medium">{error}</p>
            <button onClick={refresh} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">
                Réessayer
            </button>
        </div>
    );

    return (
        <div className="animate-fade-in space-y-8 pb-12">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="badge badge-primary">
                            <TruckIcon className="h-3 w-3 mr-1" />
                            Logistique
                        </span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                        Registre des Livraisons
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Suivez l'état de vos bons de livraison et expéditions.
                    </p>
                </div>
                <button onClick={refresh} className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-all shadow-soft self-start">
                    <ArrowPathIcon className="h-5 w-5" />
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                    { label: 'Total Livraisons', value: total, icon: TruckIcon, grad: 'bg-gradient-blue', suffix: 'Bons' },
                    { label: 'Validées', value: validated, icon: CheckBadgeIcon, grad: 'bg-gradient-success', suffix: `sur ${total}` },
                    { label: 'Valeur Livrée TTC', value: formatCurrency(totalTTC), icon: CurrencyDollarIcon, grad: 'bg-gradient-blue-cyan', suffix: 'TND' },
                ].map((kpi) => (
                    <div key={kpi.label} className="card-luxury p-0 overflow-hidden">
                        <div className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{kpi.label}</p>
                                <p className="text-2xl font-extrabold text-slate-800">{kpi.value} <span className="text-xs text-slate-400 font-bold">{kpi.suffix}</span></p>
                            </div>
                            <div className={clsx('icon-shape', kpi.grad)}>
                                <kpi.icon className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <div className={clsx('h-1', kpi.grad)} />
                    </div>
                ))}
            </div>

            <div className="card-luxury p-0 overflow-hidden">
                <div className="p-5 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="input-modern pl-11" />
                    </div>
                    <div className="flex items-center gap-2">
                        {['all', 'valid', 'pending'].map((f) => (
                            <button key={f} onClick={() => setFilter(f)} className={clsx('px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all', filter === f ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200')}>
                                {f === 'all' ? 'Tous' : f === 'valid' ? 'Validés' : 'Brouillons'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card-luxury p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/30 border-b border-slate-100/50">
                                {['N° BL', 'Client', 'Montant TTC', 'Date', 'Statut', ''].map((h) => (
                                    <th key={h} className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            {total === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center text-slate-400 font-medium">
                                        ⚠️ Aucune donnée. Cliquez sur ↻ pour recharger.
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center text-slate-400 font-medium">
                                        Aucun résultat pour ce filtre.
                                    </td>
                                </tr>
                            ) : filtered.map((item) => (
                                <tr key={item.Guid} className="group hover:bg-blue-50/30 transition-all cursor-pointer" onClick={() => navigate(`/blv/${item.Guid}`)}>
                                    <td className="px-6 py-5 font-bold text-blue-600 font-mono tracking-tight text-sm">{item.Prfx || 'BL'}{item.Nf}</td>
                                    <td className="px-6 py-5 text-sm font-bold text-slate-800 uppercase truncate max-w-[200px]">{item.LibTiers || '—'}</td>
                                    <td className="px-6 py-5 text-sm font-extrabold text-slate-800">{formatCurrency(item.TotTTC)}</td>
                                    <td className="px-6 py-5 text-xs font-medium text-slate-500">{formatDate(item.DatUser)}</td>
                                    <td className="px-6 py-5">
                                        <span className={clsx('inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider', item.Valid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                                            {item.Valid ? 'Validé' : 'Brouillon'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <ArrowUpRightIcon className="h-5 w-5 text-slate-400 group-hover:text-blue-600 inline" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BlvList;
