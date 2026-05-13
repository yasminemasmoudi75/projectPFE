import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  EyeIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { StatCard, DataTable, PageHeader, SearchBar } from '../../components/ui';
import axios from '../../app/axios';
import toast from 'react-hot-toast';
import usePermission from '../../hooks/usePermission';
import { MODULE_CODES } from '../../utils/constants';

const ClientsListPro = () => {
    const navigate = useNavigate();
    const { canCreate, canEdit } = usePermission(MODULE_CODES.CLIENTS);
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        type: 'all',
        ville: ''
    });

    const fetchClients = async () => {
        try {
            const response = await axios.get('/tiers?sort=recent');
            const payload = response?.data ?? response;
            const list = payload?.data ?? payload;
            setClients(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error('Error fetching clients:', error);
            toast.error('Impossible de charger les clients');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    // Stats
    const stats = useMemo(() => {
        const total = clients.length;
        const actifs = clients.filter(c => c.Actif === true).length;
        const inactifs = total - actifs;
        const villes = [...new Set(clients.map(c => c.Ville).filter(Boolean))].length;
        return { total, actifs, inactifs, villes };
    }, [clients]);

    // Filtered clients
    const filteredClients = useMemo(() => {
        return clients.filter(c => {
            const matchesSearch = !searchTerm || 
                (c.Raisoc || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.CodTiers || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.Ville || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.Email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.Tel || '').includes(searchTerm);

            const matchesStatus = filters.status === 'all' ||
                (filters.status === 'active' && c.Actif === true) ||
                (filters.status === 'inactive' && c.Actif === false);

            const matchesType = filters.type === 'all' ||
                (filters.type === 'fictif' && c.Fictif === true) ||
                (filters.type === 'real' && c.Fictif !== true);

            const matchesVille = !filters.ville ||
                (c.Ville || '').toLowerCase().includes(filters.ville.toLowerCase());

            return matchesSearch && matchesStatus && matchesType && matchesVille;
        });
    }, [clients, searchTerm, filters]);

    // Table columns
    const columns = [
        {
            key: 'CodTiers',
            title: 'Code',
            render: (value) => (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                    {value || '-'}
                </span>
            )
        },
        {
            key: 'Raisoc',
            title: 'Raison Sociale',
            render: (value, row) => (
                <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                        row.Actif ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                        {row.Fictif ? <BuildingStorefrontIcon className="h-5 w-5" /> : <BuildingOffice2Icon className="h-5 w-5" />}
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800">{value || 'N/A'}</p>
                        {row.Fictif && (
                            <span className="text-xs text-amber-600 font-medium">Fictif</span>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'Ville',
            title: 'Ville',
            render: (value) => value ? (
                <div className="flex items-center gap-2 text-slate-600">
                    <MapPinIcon className="h-4 w-4 text-slate-400" />
                    <span>{value}</span>
                </div>
            ) : <span className="text-slate-400">-</span>
        },
        {
            key: 'Tel',
            title: 'Contact',
            render: (value, row) => (
                <div className="space-y-1">
                    {value && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <PhoneIcon className="h-4 w-4 text-slate-400" />
                            <span>{value}</span>
                        </div>
                    )}
                    {row.Email && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                            <span className="truncate max-w-[200px]">{row.Email}</span>
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'Actif',
            title: 'Statut',
            render: (value) => value ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                    Actif
                </span>
            ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                    <XCircleIcon className="h-3.5 w-3.5" />
                    Inactif
                </span>
            )
        }
    ];

    const handleExport = () => {
        const csv = [
            ['Code', 'Raison Sociale', 'Ville', 'Téléphone', 'Email', 'Statut'].join(';'),
            ...filteredClients.map(c => [
                c.CodTiers || '',
                c.Raisoc || '',
                c.Ville || '',
                c.Tel || '',
                c.Email || '',
                c.Actif ? 'Actif' : 'Inactif'
            ].join(';'))
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clients_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('Export CSV réussi');
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <PageHeader
                title="Gestion des Clients"
                subtitle={`${stats.total} clients au total`}
                icon={UserGroupIcon}
                action={canCreate && (
                    <button
                        onClick={() => navigate('/clients/new')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Nouveau Client
                    </button>
                )}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="Total Clients"
                    value={stats.total}
                    subtitle="Tous les clients"
                    icon={UsersIcon}
                    color="blue"
                />
                <StatCard
                    title="Clients Actifs"
                    value={stats.actifs}
                    subtitle={`${Math.round((stats.actifs / stats.total) * 100) || 0}% du total`}
                    icon={CheckCircleIcon}
                    color="emerald"
                    trend={stats.actifs > stats.inactifs ? 1 : -1}
                />
                <StatCard
                    title="Clients Inactifs"
                    value={stats.inactifs}
                    subtitle="Nécessitent attention"
                    icon={XCircleIcon}
                    color="rose"
                />
                <StatCard
                    title="Villes Couvertes"
                    value={stats.villes}
                    subtitle="Zones géographiques"
                    icon={MapPinIcon}
                    color="purple"
                />
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Rechercher par nom, code, ville, email..."
                        className="flex-1"
                    />
                    
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                                showFilters 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            <FunnelIcon className="h-5 w-5" />
                            Filtres
                        </button>
                        
                        <button
                            onClick={handleExport}
                            className="inline-flex items-center gap-2 px-4 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-medium hover:bg-emerald-200 transition-all"
                        >
                            <ArrowDownTrayIcon className="h-5 w-5" />
                            Export
                        </button>
                        
                        <button
                            onClick={fetchClients}
                            className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                        >
                            <ArrowPathIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Statut</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="active">Actifs uniquement</option>
                                <option value="inactive">Inactifs uniquement</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                            <select
                                value={filters.type}
                                onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <option value="all">Tous les types</option>
                                <option value="real">Réels</option>
                                <option value="fictif">Fictifs</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Ville</label>
                            <input
                                type="text"
                                value={filters.ville}
                                onChange={(e) => setFilters(f => ({ ...f, ville: e.target.value }))}
                                placeholder="Filtrer par ville..."
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={filteredClients}
                loading={loading}
                onRowClick={(row) => navigate(`/clients/${row.CodTiers}`)}
                actions={(row) => (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/clients/${row.CodTiers}`);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir"
                        >
                            <EyeIcon className="h-5 w-5" />
                        </button>
                        {canEdit && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/clients/${row.CodTiers}/edit`);
                                }}
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Modifier"
                            >
                                <PencilSquareIcon className="h-5 w-5" />
                            </button>
                        )}
                    </>
                )}
            />
        </div>
    );
};

export default ClientsListPro;
