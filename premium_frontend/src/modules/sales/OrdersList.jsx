import { useState, useEffect } from 'react';
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
    ArrowUpRightIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';
import clsx from 'clsx';

const MOCK_ORDERS = [
    { Guid: 'o1', Prfx: 'BC', Nf: 240001, Client: 'Société ABC', Date: '2024-02-05', Total: 1786.000, Statut: 'En préparation', Source: 'Devis DV240001' },
    { Guid: 'o2', Prfx: 'BC', Nf: 240002, Client: 'Global Import', Date: '2024-02-06', Total: 14281.000, Statut: 'Livré', Source: 'Devis DV240003' },
];

const OrdersList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => setLoading(false), 600);
    }, []);

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
                        onClick={() => setLoading(true) || setTimeout(() => setLoading(false), 500)}
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
                            <p className="text-2xl font-extrabold text-slate-800">18 Documents</p>
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
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Volume Expédié</p>
                            <p className="text-2xl font-extrabold text-slate-800">142,8k <span className="text-xs text-slate-400 font-bold">TND</span></p>
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
                            {MOCK_ORDERS.map((order) => (
                                <tr key={order.Guid} className="group hover:bg-blue-50/30 transition-all cursor-pointer">
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-blue-600 font-mono tracking-tight group-hover:underline">{order.Prfx}{order.Nf}</span>
                                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">{order.Source}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-gradient-blue flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                                {order.Client.charAt(0)}
                                            </div>
                                            <p className="text-sm font-bold text-slate-800 uppercase truncate max-w-[150px]">{order.Client}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-xs font-bold text-slate-500 uppercase">{formatDate(order.Date)}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-sm font-extrabold text-slate-800">{formatCurrency(order.Total)}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={clsx(
                                            "inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider",
                                            order.Statut === 'Livré' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                        )}>
                                            {order.Statut}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-all" title="Imprimer">
                                                <PrinterIcon className="h-5 w-5" />
                                            </button>
                                            <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-all" title="Voir">
                                                <ArrowUpRightIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
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
