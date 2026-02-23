import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    DocumentCheckIcon,
    MagnifyingGlassIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    PrinterIcon,
    SparklesIcon,
    ArrowPathIcon,
    ShoppingBagIcon,
    ArrowUpRightIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';
import { fetchOrders } from './ordersSlice';
import clsx from 'clsx';

const OrdersList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { orders, loading } = useSelector((state) => state.orders);

    const refreshData = () => {
        dispatch(fetchOrders({ page: 1, limit: 100 }));
    };

    useEffect(() => {
        refreshData();
    }, [dispatch]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="badge badge-primary">
                            <DocumentCheckIcon className="h-3 w-3 mr-1" />
                            Logistique & Ventes
                        </span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Bons de Commande</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Suivi des commandes clients transformées depuis les devis.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={refreshData}
                        className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-all shadow-soft"
                    >
                        <ArrowPathIcon className="h-5 w-5" />
                    </button>
                    <button className="btn-outline flex items-center gap-2">
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Exporter
                    </button>
                </div>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-luxury p-0 overflow-hidden">
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Commandes en cours</p>
                            <p className="text-2xl font-extrabold text-slate-800">{orders.length} Documents</p>
                        </div>
                        <div className="icon-shape bg-gradient-blue shadow-glow-blue">
                            <ShoppingBagIcon className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <div className="h-1 bg-gradient-blue"></div>
                </div>
                <div className="card-luxury p-0 overflow-hidden">
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Volume Total</p>
                            <p className="text-2xl font-extrabold text-slate-800">
                                {formatCurrency(orders.reduce((sum, order) => sum + (order.TotTTC || 0), 0))}
                            </p>
                        </div>
                        <div className="icon-shape bg-gradient-success shadow-glow-emerald">
                            <ArrowDownTrayIcon className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <div className="h-1 bg-gradient-success"></div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="card-luxury p-0 overflow-hidden">
                <div className="p-6">
                    <div className="relative max-w-md w-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Rechercher une commande, un client..."
                            className="input-modern pl-11"
                        />
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="card-luxury p-0 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-transparent">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-[11px]">Commandes Clients Transformées</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/30 text-left border-b border-slate-100/50">
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Référence / Source</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Client</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Montant TTC</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">État</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            {!orders || orders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-8 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                <DocumentTextIcon className="h-8 w-8" />
                                            </div>
                                            <p className="text-slate-500 font-medium">Aucun bon de commande trouvé</p>
                                            <p className="text-xs text-slate-400">Les devis convertis apparaîtront ici</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr
                                        key={order.Guid}
                                        className="group hover:bg-blue-50/30 transition-all cursor-pointer"
                                        onClick={() => navigate(`/devis/${order.Guid}`)}
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-blue-600 font-mono tracking-tight group-hover:underline">
                                                    BC{order.Nf}
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                                                    Devis {order.Prfx}{order.Nf}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-xl bg-gradient-blue flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                                    {order.LibTiers?.charAt(0) || 'C'}
                                                </div>
                                                <p className="text-sm font-bold text-slate-800 uppercase truncate max-w-[150px]">
                                                    {order.LibTiers || order.tiers?.Raisoc || 'Client'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-bold text-slate-500 uppercase">
                                                {formatDate(order.DatUser)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-sm font-extrabold text-slate-800">
                                                {formatCurrency(order.TotTTC || 0)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                                                Converti
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                                                    title="Imprimer"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <PrinterIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                                                    title="Voir"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/devis/${order.Guid}`);
                                                    }}
                                                >
                                                    <ArrowUpRightIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Footer info */}
                <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between">
                    <span>Gestion des stocks synchronisée</span>
                    <span>BC-Logistics Module v1.0</span>
                </div>
            </div>
        </div>
    );
};

export default OrdersList;
