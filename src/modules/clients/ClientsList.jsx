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
    TrashIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import axios from '../../app/axios';
import toast from 'react-hot-toast';
import usePermission from '../../hooks/usePermission';
import useAuth from '../../hooks/useAuth';
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
    const { isCommercial } = useAuth();
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
            const url = isCommercial ? '/tiers?sort=recent' : '/tiers?sort=recent&selectedCommercial=all';
            const response = await axios.get(url);
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

        // Fetch commercials list only for admin/agent roles
        if (!isCommercial) {
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
        }
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
                    : (
                        String(c.commercialObj?.UserID ?? '') === filters.commercial ||
                        String(c.codRepresTiers || '').trim() === String(filters.commercial).trim()
                    ));

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
            : [...new Set(clients.map(c => {
                if (c.commercialObj?.UserID != null) return String(c.commercialObj.UserID);
                return c.codRepresTiers ? String(c.codRepresTiers).trim() : null;
              }).filter(Boolean))].sort().map(code => ({ value: code, label: code }));

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
        <div className="animate-fade-in space-y-5 pb-12">

            {/* ── Hero ── */}
            <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0062AF] via-sky-400 to-teal-400" />
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#0062AF]/4 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-10 bottom-0 w-48 h-48 bg-sky-400/4 rounded-full blur-3xl pointer-events-none" />

                <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#0062AF] to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                            <UserGroupIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Portefeuille Clients</h1>
                            <p className="text-sm text-slate-400 font-medium mt-0.5">
                                {stats.total} clients · {stats.active} actifs
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => fetchClients(true)}
                            disabled={refreshing}
                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50"
                            title="Rafraîchir"
                        >
                            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={exportToCSV}
                            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-slate-50 transition-all shadow-sm"
                            title="Exporter en CSV"
                        >
                            <ArrowDownTrayIcon className="h-4 w-4 text-emerald-500" /> CSV
                        </button>
                        <button
                            onClick={exportToPDF}
                            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-slate-50 transition-all shadow-sm"
                            title="Imprimer / PDF"
                        >
                            <PrinterIcon className="h-4 w-4 text-rose-400" /> PDF
                        </button>
                        {canCreate && (
                            <button
                                onClick={() => navigate('/clients/new')}
                                className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-[#0062AF] hover:bg-[#004a85] text-white text-sm font-semibold transition-all shadow-md shadow-blue-500/20 active:scale-95"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Nouveau client
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── KPI cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                    { label: 'Total',   value: stats.total,  sub: 'enregistrés',  icon: UserGroupIcon,    accent: 'from-[#0062AF] to-sky-500',     bg: 'bg-blue-50',    text: 'text-[#0062AF]'   },
                    { label: 'Actifs',  value: stats.active, sub: `${stats.total > 0 ? Math.round(stats.active / stats.total * 100) : 0}%`, icon: ChartBarIcon, accent: 'from-emerald-500 to-teal-400', bg: 'bg-emerald-50', text: 'text-emerald-600' },
                    { label: 'CA Mois', value: stats.revenue, sub: 'global',      icon: CreditCardIcon,   accent: 'from-amber-400 to-orange-400',  bg: 'bg-amber-50',   text: 'text-amber-600'   },
                ].map((s, i) => (
                    <div key={i} className="relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${s.accent}`} />
                        <div className="p-4 pt-5 flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{s.label}</p>
                                <p className={`text-2xl font-black leading-none tabular-nums ${s.text}`}>{s.value}</p>
                                <p className="text-[11px] text-slate-400 font-medium mt-1">{s.sub}</p>
                            </div>
                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                                <s.icon className={`h-4 w-4 ${s.text}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#0062AF]/50 focus:ring-2 focus:ring-[#0062AF]/8 focus:bg-white transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`inline-flex items-center gap-2 h-10 px-4 rounded-xl border text-sm font-semibold transition-all flex-none ${showFilters
                            ? 'bg-blue-50 border-blue-200 text-[#0062AF]'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                    >
                        <FunnelIcon className="h-4 w-4" />
                        Filtres
                        {hasActiveFilters && (
                            <span className="h-5 w-5 bg-[#0062AF] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                                {Object.values(filters).filter(f => f !== '').length}
                            </span>
                        )}
                    </button>
                </div>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Status Filter */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Statut</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-[#0062AF]/50 focus:outline-none focus:ring-2 focus:ring-[#0062AF]/8 transition-all"
                                >
                                    <option value="">Tous les statuts</option>
                                    <option value="active">Actif</option>
                                    <option value="inactive">Inactif</option>
                                    <option value="fictif">Fictif</option>
                                </select>
                            </div>

                            {/* Client Code Filter */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Code Client</label>
                                <input
                                    type="text"
                                    value={filters.clientCode}
                                    onChange={(e) => handleFilterChange('clientCode', e.target.value)}
                                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-[#0062AF]/50 focus:outline-none focus:ring-2 focus:ring-[#0062AF]/8 transition-all"
                                />
                            </div>

                            {/* City Filter */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gouvernorat</label>
                                <select
                                    value={filters.city}
                                    onChange={(e) => handleFilterChange('city', e.target.value)}
                                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-[#0062AF]/50 focus:outline-none focus:ring-2 focus:ring-[#0062AF]/8 transition-all"
                                >
                                    <option value="">Tous les gouvernorats</option>
                                    {uniqueCities.map(city => (
                                        <option key={city.id} value={city.id}>{city.libelle}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Class Filter */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classe</label>
                                <select
                                    value={filters.classe}
                                    onChange={(e) => handleFilterChange('classe', e.target.value)}
                                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-[#0062AF]/50 focus:outline-none focus:ring-2 focus:ring-[#0062AF]/8 transition-all"
                                >
                                    <option value="">Toutes les classes</option>
                                    {uniqueClasses.map(classe => (
                                        <option key={classe.id} value={classe.id}>{classe.libelle}</option>
                                    ))}
                                </select>
                            </div>

                            {!isCommercial && (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commercial</label>
                                    <select
                                        value={filters.commercial}
                                        onChange={(e) => handleFilterChange('commercial', e.target.value)}
                                        className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-[#0062AF]/50 focus:outline-none focus:ring-2 focus:ring-[#0062AF]/8 transition-all"
                                    >
                                        <option value="">Tous les commerciaux</option>
                                        {uniqueCommercials.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Email Filter */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</label>
                                <input
                                    type="text"
                                    value={filters.email}
                                    onChange={(e) => handleFilterChange('email', e.target.value)}
                                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-[#0062AF]/50 focus:outline-none focus:ring-2 focus:ring-[#0062AF]/8 transition-all"
                                />
                            </div>

                            {/* Phone Filter */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Téléphone</label>
                                <input
                                    type="text"
                                    value={filters.phone}
                                    onChange={(e) => handleFilterChange('phone', e.target.value)}
                                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-[#0062AF]/50 focus:outline-none focus:ring-2 focus:ring-[#0062AF]/8 transition-all"
                                />
                            </div>

                            {hasActiveFilters && (
                                <div className="flex items-end">
                                    <button
                                        onClick={handleResetFilters}
                                        className="w-full inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-rose-200 text-rose-500 bg-rose-50 hover:bg-rose-100 text-xs font-semibold transition-all"
                                    >
                                        <XMarkIcon className="h-3.5 w-3.5" /> Réinitialiser
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
            </div>

            {/* ── Table ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50/40">
                    <div className="flex items-center gap-2">
                        <UserGroupIcon className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-700">Partenaires clients</span>
                    </div>
                    <span className="text-xs text-slate-400">
                        <span className="font-semibold text-slate-600">{filteredClients.length}</span> résultat{filteredClients.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="w-0 p-0" />
                                <th className="pl-6 pr-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">Client</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">Contact</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">Classe</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left hidden xl:table-cell">Catégorie</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left hidden lg:table-cell">Gouvernorat</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">Satisfaction</th>
                                <th className="pr-5 pl-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                                                <UserGroupIcon className="h-7 w-7 text-slate-300" />
                                            </div>
                                            <p className="text-sm font-semibold text-slate-500">Aucun client trouvé</p>
                                            {canCreate && (
                                                <button
                                                    onClick={() => navigate('/clients/new')}
                                                    className="text-xs text-[#0062AF] font-semibold hover:underline"
                                                >
                                                    Ajouter un client
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedClients.map((client) => {
                                    const categorie = client.tiersCategorieObj?.libelle || client.Categorie || '';
                                    const gouvernorat = client.region?.libelle || client.Region?.libelle || client.tiersGouvernorat?.libelle || client.TiersGouvernorat?.libelle || '';
                                    const classeLabel = client.classeAuto?.ClasseCalculee || client.tiersClasse?.libelle || '';
                                    const classeCls = client.classeAuto ? (
                                        classeLabel === 'Diamant' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                        classeLabel === 'Gold'    ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        classeLabel === 'Silver'  ? 'bg-slate-50 text-slate-600 border-slate-200' :
                                        classeLabel === 'Passif'  ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                        classeLabel === 'Inactif' ? 'bg-slate-100 text-slate-500 border-slate-300' :
                                        'bg-sky-50 text-sky-700 border-sky-200'
                                    ) : 'bg-slate-100 text-slate-600 border-slate-200';

                                    return (
                                        <tr
                                            key={client.IDTiers}
                                            className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-all cursor-pointer relative"
                                            onClick={() => navigate(`/clients/${client.IDTiers}`)}
                                        >
                                            {/* Left accent bar */}
                                            <td className="w-0 p-0">
                                                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0062AF] opacity-0 group-hover:opacity-100 transition-opacity rounded-r-full" />
                                            </td>

                                            {/* Client */}
                                            <td className="pl-6 pr-4 py-3.5">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${client.Actif ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                                                        <p className="text-sm font-semibold text-slate-800 truncate leading-tight group-hover:text-[#0062AF] transition-colors">
                                                            {client.Raisoc || 'Client'}
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-[#0062AF] bg-blue-50 border border-[#0062AF]/15 px-2 py-0.5 rounded-md font-mono">
                                                        {client.CodTiers}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Contact */}
                                            <td className="px-4 py-3.5">
                                                <div className="space-y-1">
                                                    {client.Email ? (
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-600 truncate max-w-[180px]">
                                                            <EnvelopeIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                            {client.Email}
                                                        </div>
                                                    ) : null}
                                                    {client.Tel ? (
                                                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                                            <a href={getPhoneLink(client.Tel)} className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#0062AF] transition-colors" title="Appeler">
                                                                <PhoneIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                                {client.Tel}
                                                            </a>
                                                            <a href={getWhatsAppLink(client.Tel)} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="ml-0.5">
                                                                <svg className="h-3.5 w-3.5 text-emerald-500 hover:text-emerald-600 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                                </svg>
                                                            </a>
                                                        </div>
                                                    ) : null}
                                                    {!client.Email && !client.Tel && (
                                                        <span className="text-xs text-slate-300">—</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Classe */}
                                            <td className="px-4 py-3.5">
                                                {classeLabel ? (
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${classeCls}`}>
                                                        {client.classeAuto && <SparklesIcon className="h-2.5 w-2.5" />}
                                                        {classeLabel}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-300">—</span>
                                                )}
                                            </td>

                                            {/* Catégorie */}
                                            <td className="px-4 py-3.5 hidden xl:table-cell">
                                                {categorie ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 text-[10px] font-semibold border border-sky-100">
                                                        {categorie}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-300">—</span>
                                                )}
                                            </td>

                                            {/* Gouvernorat */}
                                            <td className="px-4 py-3.5 hidden lg:table-cell">
                                                {gouvernorat ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                                        <MapPinIcon className="h-2.5 w-2.5 text-slate-400" />
                                                        {gouvernorat}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-300">—</span>
                                                )}
                                            </td>

                                            {/* Satisfaction */}
                                            <td className="px-4 py-3.5">
                                                <ClientSatisfactionBadge codTiers={client.CodTiers} />
                                            </td>

                                            {/* Actions */}
                                            <td className="pr-5 pl-4 py-3.5" onClick={e => e.stopPropagation()}>
                                                <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => navigate(`/clients/${client.IDTiers}`)}
                                                        className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-[#0062AF] hover:bg-blue-50 hover:border hover:border-blue-200 transition-all"
                                                        title="Voir"
                                                    >
                                                        <EyeIcon className="h-3.5 w-3.5" />
                                                    </button>
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => navigate(`/clients/edit/${client.IDTiers}`)}
                                                            className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-amber-600 hover:bg-amber-50 hover:border hover:border-amber-200 transition-all"
                                                            title="Modifier"
                                                        >
                                                            <PencilSquareIcon className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDelete(client.IDTiers, client.Raisoc)}
                                                            className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 hover:border hover:border-rose-200 transition-all"
                                                            title="Supprimer"
                                                        >
                                                            <TrashIcon className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/30">
                        <p className="text-xs text-slate-400">
                            Page <span className="font-semibold text-slate-600">{currentPage}</span> sur <span className="font-semibold text-slate-600">{totalPages}</span>
                        </p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold">
                                ‹
                            </button>
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                let p;
                                if (totalPages <= 7) p = i + 1;
                                else if (currentPage <= 4) p = i + 1;
                                else if (currentPage >= totalPages - 3) p = totalPages - 6 + i;
                                else p = currentPage - 3 + i;
                                if (p < 1 || p > totalPages) return null;
                                return (
                                    <button key={p} onClick={() => setCurrentPage(p)}
                                        className={`h-7 w-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                                            p === currentPage
                                                ? 'bg-[#0062AF] text-white shadow-sm'
                                                : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                        }`}>
                                        {p}
                                    </button>
                                );
                            })}
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold">
                                ›
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer count */}
                <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/30 text-xs text-slate-400 font-medium">
                    Affichage de {paginatedClients.length} sur {filteredClients.length} clients filtrés ({clients.length} au total)
                </div>
            </div>
        </div>
    );
};

export default ClientsList;
