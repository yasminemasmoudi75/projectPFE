import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    UserGroupIcon,
    ArrowUpRightIcon,
    BuildingOffice2Icon,
    MapPinIcon,
    PhoneIcon,
    EnvelopeIcon,
    CreditCardIcon,
    ChartBarIcon,
    SparklesIcon,
    EyeIcon,
    PencilSquareIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import axios from '../../app/axios';
import toast from 'react-hot-toast';

const ClientsList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchClients = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        try {
            const response = await axios.get('/tiers');
            if (response.status === 'success' && Array.isArray(response.data)) {
                setClients(response.data);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
            toast.error('Impossible de charger les clients');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const filteredClients = useMemo(() => {
        return clients.filter(c =>
            (c.Raisoc || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.CodTiers || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.Ville || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [clients, searchTerm]);

    const stats = useMemo(() => ({
        total: clients.length,
        active: clients.length,
        revenue: '—'
    }), [clients]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="badge badge-primary">
                            <SparklesIcon className="h-3 w-3 mr-1" />
                            Gestion CRM
                        </span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Clients</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Gérez votre portefeuille de clients et partenaires
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchClients(true)}
                        className={`p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-all shadow-soft ${refreshing ? 'animate-spin' : ''}`}
                        title="Rafraîchir"
                    >
                        <ArrowPathIcon className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => navigate('/clients/new')}
                        className="btn-soft-primary flex items-center gap-2"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Nouveau Client
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-luxury p-0 overflow-hidden">
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Clients</p>
                            <p className="text-2xl font-extrabold text-slate-800">
                                {stats.total}
                            </p>
                        </div>
                        <div className="icon-shape shadow-glow-blue">
                            <UserGroupIcon className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <div className="h-1 bg-gradient-blue"></div>
                </div>

                <div className="card-luxury p-0 overflow-hidden">
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Clients Actifs</p>
                            <p className="text-2xl font-extrabold text-slate-800 flex items-baseline gap-2">
                                {stats.active}
                                <span className="text-xs text-emerald-500 font-bold">100%</span>
                            </p>
                        </div>
                        <div className="icon-shape shadow-soft" style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }}>
                            <ChartBarIcon className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <div className="h-1 bg-gradient-success"></div>
                </div>

                <div className="card-luxury p-0 overflow-hidden">
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">CA Mensuel (global)</p>
                            <p className="text-2xl font-extrabold text-slate-800">
                                {stats.revenue}
                            </p>
                        </div>
                        <div className="icon-shape shadow-soft" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' }}>
                            <CreditCardIcon className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <div className="h-1" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' }}></div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="card-luxury p-0 overflow-hidden">
                <div className="p-6 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Rechercher un client..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-modern pl-11"
                        />
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="card-luxury p-0 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-transparent flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">Liste des Partenaires</h3>
                    <span className="text-xs font-medium text-slate-500">{filteredClients.length} résultats</span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/30 text-left border-b border-slate-100/50">
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Client</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Localisation</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            {filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                                                <UserGroupIcon className="h-8 w-8" />
                                            </div>
                                            <p className="text-slate-500 font-medium">Aucun client trouvé</p>
                                            <button
                                                onClick={() => navigate('/clients/new')}
                                                className="btn-soft-primary text-xs"
                                            >
                                                Ajouter un client
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr
                                        key={client.IDTiers}
                                        className="group hover:bg-blue-50/30 transition-all cursor-pointer"
                                        onClick={() => navigate(`/clients/${client.IDTiers}`)}
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-gradient-blue flex items-center justify-center font-bold text-white shadow-glow-blue transform transition-transform group-hover:scale-105">
                                                    {(client.Raisoc || 'C').charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800 mb-0.5 group-hover:text-blue-600 transition-colors">
                                                        {client.Raisoc || 'Client'}
                                                    </p>
                                                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                                        {client.CodTiers}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <EnvelopeIcon className="h-4 w-4 text-blue-500" />
                                                    {client.Email || 'Non renseigné'}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <PhoneIcon className="h-4 w-4 text-blue-500" />
                                                    {client.Tel || 'Non renseigné'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <MapPinIcon className="h-4 w-4 text-emerald-500" />
                                                {client.Ville || 'Non renseigné'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client.IDTiers}`); }}
                                                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                                                    title="Voir"
                                                >
                                                    <EyeIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/clients/edit/${client.IDTiers}`); }}
                                                    className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-100 rounded-xl transition-all"
                                                    title="Modifier"
                                                >
                                                    <PencilSquareIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100/50 text-xs font-medium text-slate-500 flex justify-between items-center">
                    <span>Affichage de {filteredClients.length} sur {clients.length} clients</span>
                    <span className="text-slate-400">NexusCRM v2.0</span>
                </div>
            </div>
        </div>
    );
};

export default ClientsList;
