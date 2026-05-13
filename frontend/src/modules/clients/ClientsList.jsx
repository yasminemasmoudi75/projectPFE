import { useState, useEffect, useMemo, useRef } from 'react';
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
import { getWhatsAppLink, getPhoneLink } from '../../utils/format';

const ClientSatisfactionBadge = ({ codTiers }) => {
    const [score, setScore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isProspect, setIsProspect] = useState(false);
    const badgeRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                fetchScore();
                observer.disconnect();
            }
        }, { threshold: 0.1 });

        if (badgeRef.current) observer.observe(badgeRef.current);

        const fetchScore = async () => {
            try {
                const result = await axios.get(`/ia/satisfaction/${codTiers}`);
                if (isMounted) {
                    setScore(result?.data?.score);
                    setIsProspect(result?.data?.isProspect);
                }
            } catch (error) {
                console.warn('Error fetching row satisfaction:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        return () => {
            isMounted = false;
            observer.disconnect();
        };
    }, [codTiers]);

    return (
        <div ref={badgeRef} className="min-w-[80px] flex justify-center">
            {loading ? (
                <div className="h-4 w-12 bg-slate-100 animate-pulse rounded"></div>
            ) : isProspect ? (
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 w-fit">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Prospect</span>
                </div>
            ) : (
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border w-fit ${(score ?? 0) >= 8 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    (score ?? 0) >= 5 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                    <span className="text-xs font-bold">
                        {score !== null ? `${score} / 10` : '—'}
                    </span>
                </div>
            )}
        </div>
    );
};

const ClientsList = () => {
    const navigate = useNavigate();
    const { canCreate, canEdit, canDelete } = usePermission(MODULE_CODES.CLIENTS);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [clients, setClients] = useState([]);
    const [commercialsList, setCommercialsList] = useState([]);
    const [tiersClasses, setTiersClasses] = useState([]);
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

        const fetchTiersClasses = async () => {
            try {
                const response = await axios.get('/tiers-classes');
                setTiersClasses(response.data.data || response.data || []);
            } catch (error) {
                console.error('Error fetching tiers classes:', error);
            }
        };

        fetchTiersGouvernorats();
        fetchTiersClasses();

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

            const selectedClasse = String(filters.classe || '').trim();
            const clientClasseId = String(c.tiersClasse?.id ?? c.Classe ?? '').trim();
            const clientClasseLabel = String(c.tiersClasse?.libelle || '').trim().toLowerCase();
            const matchesClasse = !selectedClasse
                || clientClasseId === selectedClasse
                || clientClasseLabel === selectedClasse.toLowerCase();

            const matchesCommercial = !filters.commercial ||
                (filters.commercial === '__UNASSIGNED__'
                    ? !c.codRepresTiers
                    : String(c.codRepresTiers || '') === filters.commercial);

            const matchesEmail = !filters.email ||
                (c.Email || '').toLowerCase().includes(filters.email.toLowerCase());

            const matchesPhone = !filters.phone ||
                (c.Tel || '').includes(filters.phone);

            const matchesClientCode = !filters.clientCode ||
                (c.CodTiers || '').toLowerCase().includes(filters.clientCode.toLowerCase());

            return matchesSearch && matchesStatus && matchesCity && matchesClasse && matchesCommercial &&
                matchesEmail && matchesPhone && matchesClientCode;
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
        const byId = new Map();
        tiersClasses.forEach((cl) => {
            const id = String(cl.id || '').trim();
            const libelle = String(cl.libelle || '').trim();
            if (!id || !libelle || byId.has(id)) return;
            byId.set(id, { id, libelle });
        });

        return Array.from(byId.values()).sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'));
    }, [tiersClasses]);

    // Use backend-fetched commercials (filtered by filtrerepres) if available,
    // fallback to extracting from loaded clients
    const uniqueCommercials = useMemo(() => {
        const base = commercialsList.length > 0
            ? commercialsList
            : [...new Set(clients.map(c => c.codRepresTiers).filter(Boolean))].sort().map(code => ({ value: code, label: code }));

        return [
            ...base,
            { value: '__UNASSIGNED__', label: '🛑 Clients non affectés' }
        ];
    }, [clients, commercialsList]);



    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleDelete = async (id, raisoc) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le client "${raisoc}" ? Cette action est irréversible.`)) {
            return;
        }

        try {
            await axios.delete(`/tiers/${id}`);
            toast.success('Client supprimé avec succès');
            fetchClients(); // Refresh list
        } catch (error) {
            console.error('Error deleting client:', error);
            toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
        }
    };

    const handleResetFilters = () => {
        setFilters({
            status: '',
            city: '',
            classe: '',
            commercial: '',
            email: '',
            phone: '',
            clientCode: ''
        });
        setCurrentPage(1);
    };

    const hasActiveFilters = Object.values(filters).some(f => f !== '');

    if (loading) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in space-y-6 pb-12">
            {/* Header - Modern Design */}
            <div className="card-luxury p-8 bg-gradient-to-r from-sky-50 via-white to-violet-50 border-none">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-600 text-xs font-medium mb-3">
                            <UserGroupIcon className="h-3 w-3" />
                            Gestion CRM
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Portefeuille Clients</h1>
                        <p className="text-slate-600 mt-1 flex items-center gap-2 text-sm">
                            <BuildingOffice2Icon className="h-4 w-4 text-sky-500" />
                            Gérez votre portefeuille de clients et partenaires
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchClients(true)}
                            className={`p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all ${refreshing ? 'animate-spin' : ''}`}
                            title="Rafraîchir"
                        >
                            <ArrowPathIcon className="h-5 w-5" />
                        </button>

                        {/* Export Buttons */}
                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100 transition-colors"
                            title="Exporter en CSV"
                        >
                            <ArrowDownTrayIcon className="h-5 w-5" />
                            <span className="hidden sm:inline">CSV</span>
                        </button>

                        <button
                            onClick={exportToPDF}
                            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium hover:bg-rose-100 transition-colors"
                            title="Imprimer / PDF"
                        >
                            <PrinterIcon className="h-5 w-5" />
                            <span className="hidden sm:inline">PDF</span>
                        </button>

                        {canCreate && (
                            <button
                                onClick={() => navigate('/clients/new')}
                                className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl shadow-md shadow-sky-200/50 transition-all flex items-center gap-2 font-medium"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Nouveau Client
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Total Clients', value: stats.total, sub: 'clients enregistrés', icon: UserGroupIcon, color: 'sky' },
                    { label: 'Clients Actifs', value: `${stats.active}`, sub: '100% actifs', icon: ChartBarIcon, color: 'emerald' },
                    { label: 'CA Mensuel', value: stats.revenue, sub: 'global', icon: CreditCardIcon, color: 'amber' },
                ].map((stat, i) => {
                    const colorMap = {
                        sky: { bg: 'bg-sky-50', text: 'text-sky-500', bar: 'bg-sky-400' },
                        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-500', bar: 'bg-emerald-400' },
                        amber: { bg: 'bg-amber-50', text: 'text-amber-500', bar: 'bg-amber-400' },
                    };
                    const colors = colorMap[stat.color];
                    return (
                        <div key={i} className="card-luxury shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
                            <div className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                                        <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                                        <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
                                    </div>
                                    <div className={`${colors.bg} p-2.5 rounded-xl group-hover:scale-110 transition-transform`}>
                                        <stat.icon className={`h-5 w-5 ${colors.text}`} />
                                    </div>
                                </div>
                                <div className={`h-1 ${colors.bar} mt-4 rounded-full`}></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filters & Search */}
            <div className="card-luxury shadow-sm">
                <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${showFilters
                                ? 'bg-sky-100 text-sky-700 border border-sky-200'
                                : 'bg-white border border-slate-200 text-slate-600 hover:border-sky-300'
                                }`}
                        >
                            <FunnelIcon className="h-4 w-4" />
                            Filtres {hasActiveFilters && <span className="bg-sky-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">{Object.values(filters).filter(f => f !== '').length}</span>}
                        </button>
                    </div>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="border-t border-slate-200 mt-6 pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Status Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-slate-500 uppercase tracking-wider">Statut</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                                >
                                    <option value="">Tous les statuts</option>
                                    <option value="active">Actif</option>
                                    <option value="inactive">Inactif</option>
                                    <option value="fictif">Fictif</option>
                                </select>
                            </div>

                            {/* Client Code Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-slate-500 uppercase tracking-wider">Code Client</label>
                                <input
                                    type="text"
                                    value={filters.clientCode}
                                    onChange={(e) => handleFilterChange('clientCode', e.target.value)}
                                    placeholder="Filtrer par code..."
                                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:border-sky-400 focus:outline-none"
                                />
                            </div>

                            {/* City Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-slate-500 uppercase tracking-wider">Gouvernorat</label>
                                <select
                                    value={filters.city}
                                    onChange={(e) => handleFilterChange('city', e.target.value)}
                                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                                >
                                    <option value="">Tous les gouvernorats</option>
                                    {uniqueCities.map(city => (
                                        <option key={city.id} value={city.id}>{city.libelle}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Class Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-slate-500 uppercase tracking-wider">Classe</label>
                                <select
                                    value={filters.classe}
                                    onChange={(e) => handleFilterChange('classe', e.target.value)}
                                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                                >
                                    <option value="">Toutes les classes</option>
                                    {uniqueClasses.map(classe => (
                                        <option key={classe.id} value={classe.id}>{classe.libelle}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Commercial Representative Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-slate-500 uppercase tracking-wider">Commercial</label>
                                <select
                                    value={filters.commercial}
                                    onChange={(e) => handleFilterChange('commercial', e.target.value)}
                                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                                >
                                    <option value="">Tous les commerciaux</option>
                                    {uniqueCommercials.map(c => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </div>



                            {/* Email Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-slate-500 uppercase tracking-wider">Email</label>
                                <input
                                    type="text"
                                    value={filters.email}
                                    onChange={(e) => handleFilterChange('email', e.target.value)}
                                    placeholder="Filtrer par email..."
                                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:border-sky-400 focus:outline-none"
                                />
                            </div>

                            {/* Phone Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-slate-500 uppercase tracking-wider">Téléphone</label>
                                <input
                                    type="text"
                                    value={filters.phone}
                                    onChange={(e) => handleFilterChange('phone', e.target.value)}
                                    placeholder="Filtrer par tél..."
                                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:border-sky-400 focus:outline-none"
                                />
                            </div>

                            {/* Reset Button */}
                            {hasActiveFilters && (
                                <div className="flex items-end">
                                    <button
                                        onClick={handleResetFilters}
                                        className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-200 transition-all"
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
            <div className="card-luxury shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50/50 py-4 px-6 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">Liste des Partenaires</h3>
                    <span className="text-xs text-slate-500 font-medium">{filteredClients.length} résultats</span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/30 text-left border-b border-slate-200">
                                <th className="px-6 py-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Classe</th>
                                <th className="px-6 py-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Fonction</th>
                                <th className="px-6 py-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Catégorie</th>
                                <th className="px-6 py-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Gouvernorat</th>
                                <th className="px-6 py-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Satisfaction</th>
                                <th className="px-6 py-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                                                <UserGroupIcon className="h-8 w-8" />
                                            </div>
                                            <p className="text-slate-500 font-medium">Aucun client trouvé</p>
                                            {canCreate && (
                                                <button
                                                    onClick={() => navigate('/clients/new')}
                                                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl shadow-md shadow-sky-200/50 transition-all text-sm font-medium"
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
                                        className="group hover:bg-sky-50/30 transition-all cursor-pointer"
                                        onClick={() => navigate(`/clients/${client.IDTiers}`)}
                                    >
                                        <td className="px-6 py-5">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 mb-0.5 group-hover:text-sky-600 transition-colors">
                                                    {client.Raisoc || 'Client'}
                                                </p>
                                                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                                    {client.CodTiers}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <EnvelopeIcon className="h-4 w-4 text-sky-500" />
                                                    {client.Email || 'Non renseigné'}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    {client.Tel ? (
                                                        <div className="flex items-center gap-2">
                                                            <a href={getPhoneLink(client.Tel)} className="flex items-center gap-1.5 hover:text-sky-600 transition-colors" title="Appeler">
                                                                <PhoneIcon className="h-4 w-4 text-sky-500" />
                                                                {client.Tel}
                                                            </a>
                                                            <a href={getWhatsAppLink(client.Tel)} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                                                                <svg className="h-4 w-4 text-emerald-500 hover:text-emerald-600 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                                </svg>
                                                            </a>
                                                        </div>
                                                    ) : 'Non renseigné'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {client.classeAuto ? (
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-sm ${client.classeAuto.ClasseCalculee === 'Diamant' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                    client.classeAuto.ClasseCalculee === 'Gold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        client.classeAuto.ClasseCalculee === 'Silver' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                                            client.classeAuto.ClasseCalculee === 'Passif' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                                client.classeAuto.ClasseCalculee === 'Inactif' ? 'bg-slate-100 text-slate-500 border-slate-300' :
                                                                    'bg-sky-50 text-sky-700 border-sky-200'
                                                    }`}>
                                                    <SparklesIcon className="h-3 w-3" />
                                                    {client.classeAuto.ClasseCalculee}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full font-medium">
                                                    {client.tiersClasse?.libelle || '-'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-sm text-slate-600">
                                                {client.Fonction || 'Non renseigné'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm text-slate-600 bg-sky-100 px-3 py-1 rounded-full font-medium">
                                                {client.tiersCategorieObj?.libelle || client.Categorie || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm text-slate-600 bg-amber-100 px-3 py-1 rounded-full font-medium">
                                                {client.region?.libelle || client.Region?.libelle || client.tiersGouvernorat?.libelle || client.TiersGouvernorat?.libelle || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <ClientSatisfactionBadge codTiers={client.CodTiers} />
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client.IDTiers}`); }}
                                                    className="p-2.5 text-slate-400 hover:text-sky-600 hover:bg-sky-100 rounded-xl transition-all"
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
                                                {canDelete && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(client.IDTiers, client.Raisoc); }}
                                                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-all"
                                                        title="Supprimer"
                                                    >
                                                        <TrashIcon className="h-5 w-5" />
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
