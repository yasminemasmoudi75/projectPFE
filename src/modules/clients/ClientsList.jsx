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
    ArrowPathIcon,
    ArrowDownTrayIcon,
    PrinterIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import axios from '../../app/axios';
import toast from 'react-hot-toast';
import usePermission from '../../hooks/usePermission';
import { MODULE_CODES } from '../../utils/constants';

const ClientsList = () => {
    const navigate = useNavigate();
    const { canCreate, canEdit } = usePermission(MODULE_CODES.CLIENTS);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [clients, setClients] = useState([]);
    const [commercialsList, setCommercialsList] = useState([]);
    const [tiersGouvernorats, setTiersGouvernorats] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [filters, setFilters] = useState({
        status: '',
        city: '',
        classe: '',
        commercial: '',
        paymentType: '',
        email: '',
        phone: '',
        clientCode: ''
    });

    const fetchClients = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        try {
            const response = await axios.get('/tiers?sort=recent&limit=10000');
            const payload = response?.data ?? response;
            const list = payload?.data ?? payload;

            if (Array.isArray(list)) {
                setClients(list);
            } else {
                setClients([]);
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
        const fetchTiersGouvernorats = async () => {
            try {
                const response = await axios.get('/tiers-gouvernorats');
                setTiersGouvernorats(response.data.data || response.data || []);
            } catch (error) {
                console.error('Error fetching tiers gouvernorats:', error);
            }
        };

        fetchTiersGouvernorats();

        // Fetch commercials filtered by filtrerepres
        const fetchCommerciaux = async () => {
            try {
                const response = await axios.get('/users/commercials/assignable');
                const data = response.data;
                const rawList = Array.isArray(data) ? data : data.data || [];
                setCommercialsList(rawList.map(c => ({
                    value: String(c.userId || c.value || c.UserID),
                    label: c.fullName || c.label || c.login || `Commercial ${c.userId}`
                })));
            } catch (error) {
                console.error('Error fetching commercials:', error);
            }
        };
        fetchCommerciaux();
    }, []);

    const filteredClients = useMemo(() => {
        return clients.filter(c => {
            const matchesSearch = (c.Raisoc || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.CodTiers || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.Ville || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.Email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.Tel || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = !filters.status ||
                (filters.status === 'active' && c.Actif === true) ||
                (filters.status === 'inactive' && c.Actif === false) ||
                (filters.status === 'fictif' && c.Fictif === true);

            const selectedCity = String(filters.city || '').trim();
            const clientCityId = String(c.Gouvernorat ?? c.gouvernorat ?? c.region?.id ?? c.Region?.id ?? c.tiersGouvernorat?.id ?? c.TiersGouvernorat?.id ?? '').trim();
            const clientCityLabel = String(c.region?.libelle || c.Region?.libelle || c.tiersGouvernorat?.libelle || c.TiersGouvernorat?.libelle || c.Ville || '').trim().toLowerCase();
            const matchesCity = !selectedCity || clientCityId === selectedCity || clientCityLabel === selectedCity.toLowerCase();

            const clientClasse = (c.tiersClasse?.libelle || c.Classe || '').toString().trim().toLowerCase();
            const selectedClasse = String(filters.classe || '').trim().toLowerCase();
            const matchesClasse = !selectedClasse || clientClasse === selectedClasse;

            const matchesCommercial = !filters.commercial ||
                String(c.codRepresTiers || '') === filters.commercial;

            const matchesPaymentType = !filters.paymentType ||
                (c.ModReg || '') === filters.paymentType;

            const matchesEmail = !filters.email ||
                (c.Email || '').toLowerCase().includes(filters.email.toLowerCase());

            const matchesPhone = !filters.phone ||
                (c.Tel || '').includes(filters.phone);

            const matchesClientCode = !filters.clientCode ||
                (c.CodTiers || '').toLowerCase().includes(filters.clientCode.toLowerCase());

            return matchesSearch && matchesStatus && matchesCity && matchesClasse && matchesCommercial &&
                matchesPaymentType && matchesEmail && matchesPhone && matchesClientCode;
        });
    }, [clients, searchTerm, filters]);

    const totalPages = Math.max(1, Math.ceil(filteredClients.length / itemsPerPage));

    const paginatedClients = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredClients.slice(start, start + itemsPerPage);
    }, [filteredClients, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filters, itemsPerPage]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    // Export functions
    const exportToCSV = () => {
        const headers = ['Code', 'Raison Sociale', 'Ville', 'Téléphone', 'Email', 'Statut'];
        const rows = filteredClients.map(c => [
            c.CodTiers || '',
            c.Raisoc || '',
            c.Ville || '',
            c.Tel || '',
            c.Email || '',
            c.Actif ? 'Actif' : 'Inactif'
        ]);
        
        const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `clients_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success('Export CSV réussi');
    };

    const exportToPDF = () => {
        const printWindow = window.open('', '_blank');
        const html = `
          <html>
            <head>
              <title>Liste des Clients</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background: #3b82f6; color: white; }
                tr:nth-child(even) { background: #f8fafc; }
                .header { margin-bottom: 20px; }
                .header h1 { color: #1e293b; margin: 0; }
                .header p { color: #64748b; margin: 5px 0; }
                .badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
                .badge-active { background: #d1fae5; color: #065f46; }
                .badge-inactive { background: #f1f5f9; color: #475569; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Liste des Clients</h1>
                <p>Exporté le ${new Date().toLocaleDateString('fr-FR')} - ${filteredClients.length} clients</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Raison Sociale</th>
                    <th>Ville</th>
                    <th>Téléphone</th>
                    <th>Email</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredClients.map(c => {
                    const statusClass = c.Actif ? 'badge-active' : 'badge-inactive';
                    const statusText = c.Actif ? 'Actif' : 'Inactif';
                    return `
                      <tr>
                        <td>${c.CodTiers || '-'}</td>
                        <td>${c.Raisoc || '-'}</td>
                        <td>${c.Ville || '-'}</td>
                        <td>${c.Tel || '-'}</td>
                        <td>${c.Email || '-'}</td>
                        <td><span class="badge ${statusClass}">${statusText}</span></td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </body>
          </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    };

    const stats = useMemo(() => ({
        total: clients.length,
        active: clients.filter(c => c.Actif === true).length,
        revenue: '—'
    }), [clients]);

    // Extract unique values for filter dropdowns
    const uniqueCities = useMemo(() => {
        const byId = new Map();
        tiersGouvernorats.forEach((g) => {
            const id = String(g.id || '').trim();
            const libelle = String(g.libelle || '').trim();
            if (!id || !libelle || byId.has(id)) return;
            byId.set(id, { id, libelle });
        });

        return Array.from(byId.values()).sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'));
    }, [tiersGouvernorats]);

    const uniqueClasses = useMemo(() => {
        return [...new Set(clients.map(c => c.tiersClasse?.libelle || c.Classe).filter(Boolean))].sort();
    }, [clients]);

    // Use backend-fetched commercials (filtered by filtrerepres) if available,
    // fallback to extracting from loaded clients
    const uniqueCommercials = useMemo(() => {
        if (commercialsList.length > 0) return commercialsList;
        const codes = [...new Set(clients.map(c => c.codRepresTiers).filter(Boolean))].sort();
        return codes.map(code => ({ value: code, label: code }));
    }, [clients, commercialsList]);

    const uniquePaymentTypes = useMemo(() => {
        return [...new Set(clients.map(c => c.ModReg).filter(Boolean))].sort();
    }, [clients]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleResetFilters = () => {
        setFilters({
            status: '',
            city: '',
            classe: '',
            commercial: '',
            paymentType: '',
            email: '',
            phone: '',
            clientCode: ''
        });
        setCurrentPage(1);
    };

    const hasActiveFilters = Object.values(filters).some(f => f !== '');

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
                    
                    {/* Export Buttons */}
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-semibold hover:bg-emerald-100 transition-colors shadow-soft"
                        title="Exporter en CSV"
                    >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                        <span className="hidden sm:inline">CSV</span>
                    </button>
                    
                    <button
                        onClick={exportToPDF}
                        className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-semibold hover:bg-rose-100 transition-colors shadow-soft"
                        title="Imprimer / PDF"
                    >
                        <PrinterIcon className="h-5 w-5" />
                        <span className="hidden sm:inline">PDF</span>
                    </button>
                    
                    {canCreate && (
                        <button
                            onClick={() => navigate('/clients/new')}
                            className="btn-soft-primary flex items-center gap-2"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Nouveau Client
                        </button>
                    )}
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
                <div className="p-6 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
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
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${showFilters
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                                }`}
                        >
                            <FunnelIcon className="h-4 w-4" />
                            Filtres {hasActiveFilters && <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">{Object.values(filters).filter(f => f !== '').length}</span>}
                        </button>
                    </div>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Status Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Statut</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="input-modern text-sm"
                                >
                                    <option value="">Tous les statuts</option>
                                    <option value="active">Actif</option>
                                    <option value="inactive">Inactif</option>
                                    <option value="fictif">Fictif</option>
                                </select>
                            </div>

                            {/* Client Code Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Code Client</label>
                                <input
                                    type="text"
                                    value={filters.clientCode}
                                    onChange={(e) => handleFilterChange('clientCode', e.target.value)}
                                    placeholder="Filtrer par code..."
                                    className="input-modern text-sm"
                                />
                            </div>

                            {/* City Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Gouvernorat</label>
                                <select
                                    value={filters.city}
                                    onChange={(e) => handleFilterChange('city', e.target.value)}
                                    className="input-modern text-sm"
                                >
                                    <option value="">Tous les gouvernorats</option>
                                    {uniqueCities.map(city => (
                                        <option key={city.id} value={city.id}>{city.libelle}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Class Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Classe</label>
                                <select
                                    value={filters.classe}
                                    onChange={(e) => handleFilterChange('classe', e.target.value)}
                                    className="input-modern text-sm"
                                >
                                    <option value="">Toutes les classes</option>
                                    {uniqueClasses.map(classe => (
                                        <option key={classe} value={classe}>{classe}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Commercial Representative Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Commercial</label>
                                <select
                                    value={filters.commercial}
                                    onChange={(e) => handleFilterChange('commercial', e.target.value)}
                                    className="input-modern text-sm"
                                >
                                    <option value="">Tous les commerciaux</option>
                                    {uniqueCommercials.map(c => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Payment Type Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Mode de Paiement</label>
                                <select
                                    value={filters.paymentType}
                                    onChange={(e) => handleFilterChange('paymentType', e.target.value)}
                                    className="input-modern text-sm"
                                >
                                    <option value="">Tous les modes</option>
                                    {uniquePaymentTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Email Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email</label>
                                <input
                                    type="text"
                                    value={filters.email}
                                    onChange={(e) => handleFilterChange('email', e.target.value)}
                                    placeholder="Filtrer par email..."
                                    className="input-modern text-sm"
                                />
                            </div>

                            {/* Phone Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Téléphone</label>
                                <input
                                    type="text"
                                    value={filters.phone}
                                    onChange={(e) => handleFilterChange('phone', e.target.value)}
                                    placeholder="Filtrer par tél..."
                                    className="input-modern text-sm"
                                />
                            </div>

                            {/* Reset Button */}
                            {hasActiveFilters && (
                                <div className="flex items-end">
                                    <button
                                        onClick={handleResetFilters}
                                        className="w-full px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-200 transition-all"
                                    >
                                        Réinitialiser les filtres
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
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
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Classe</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fonction</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catégorie</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Domaine</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gouvernorat</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            {filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                                                <UserGroupIcon className="h-8 w-8" />
                                            </div>
                                            <p className="text-slate-500 font-medium">Aucun client trouvé</p>
                                            {canCreate && (
                                                <button
                                                    onClick={() => navigate('/clients/new')}
                                                    className="btn-soft-primary text-xs"
                                                >
                                                    Ajouter un client
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedClients.map((client) => (
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
                                            <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full font-medium">
                                                {client.tiersClasse?.libelle || '-'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm text-slate-600">
                                                {client.Fonction || 'Non renseigné'}
                                            </p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-sm text-slate-600 bg-blue-100 px-3 py-1 rounded-full font-medium">
                                                {client.tiersCategorieObj?.libelle || client.Categorie || '-'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm text-slate-600">
                                                {client.Domaine || 'Non renseigné'}
                                            </p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-sm text-slate-600 bg-amber-100 px-3 py-1 rounded-full font-medium">
                                                {client.region?.libelle || client.Region?.libelle || client.tiersGouvernorat?.libelle || client.TiersGouvernorat?.libelle || '-'}
                                            </span>
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
                                                {canEdit && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/clients/edit/${client.IDTiers}`); }}
                                                        className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-100 rounded-xl transition-all"
                                                        title="Modifier"
                                                    >
                                                        <PencilSquareIcon className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredClients.length > 0 && (
                    <div className="px-8 py-4 border-t border-slate-100/50 bg-white/70 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                            <span>Éléments par page</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="input-modern py-1.5 px-2 text-xs w-20"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Précédent
                            </button>
                            <span className="text-xs font-semibold text-slate-600 min-w-20 text-center">
                                Page {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Suivant
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100/50 text-xs font-medium text-slate-500 flex justify-between items-center">
                    <span>
                        Affichage de {paginatedClients.length} sur {filteredClients.length} clients filtrés ({clients.length} au total)
                    </span>
                    <span className="text-slate-400">NexusCRM v2.0</span>
                </div>
            </div>
        </div>
    );
};

export default ClientsList;
