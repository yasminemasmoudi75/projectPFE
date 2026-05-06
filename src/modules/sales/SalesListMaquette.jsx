import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../app/axios';
import toast from 'react-hot-toast';
import usePermission from '../../hooks/usePermission';

const SalesListMaquette = ({ 
    moduleCode, 
    endpoint, 
    title,
    documentType, // 'devis', 'bcv', 'blv', 'fav'
    columns,
    filters: filterConfig,
    getStatusBadge,
    canTransfer = false
}) => {
    const navigate = useNavigate();
    const { canCreate, canEdit, canDelete } = usePermission(moduleCode);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    
    // Dynamic filters
    const [filters, setFilters] = useState({});
    
    // Filter options
    const [filterOptions, setFilterOptions] = useState({
        clients: [],
        commercials: [],
        status: []
    });

    // Initialize filters from config
    useEffect(() => {
        if (filterConfig) {
            const initialFilters = {};
            filterConfig.forEach(f => initialFilters[f.key] = '');
            setFilters(initialFilters);
        }
    }, [filterConfig]);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${endpoint}?sort=recent&limit=1000`);
                const list = response?.data?.data ?? response?.data ?? [];
                setItems(Array.isArray(list) ? list : []);
            } catch (error) {
                console.error(`Error fetching ${documentType}:`, error);
                toast.error(`Impossible de charger les ${title.toLowerCase()}`);
            } finally {
                setLoading(false);
            }
        };

        const fetchFilterOptions = async () => {
            try {
                const [clientsRes, commercialsRes] = await Promise.all([
                    axios.get('/tiers?limit=1000').catch(() => ({ data: { data: [] } })),
                    axios.get('/users/commercials/assignable').catch(() => ({ data: [] }))
                ]);
                
                setFilterOptions(prev => ({
                    ...prev,
                    clients: clientsRes.data?.data || clientsRes.data || [],
                    commercials: Array.isArray(commercialsRes.data) 
                        ? commercialsRes.data 
                        : commercialsRes.data?.data || []
                }));
            } catch (error) {
                console.error('Error fetching filter options:', error);
            }
        };

        fetchData();
        fetchFilterOptions();
    }, [endpoint, documentType, title]);

    // Filter logic
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = !searchTerm || 
                (item.Num || item.NDoc || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.LibTiers || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.CodTiers || '').toLowerCase().includes(searchTerm.toLowerCase());

            // Apply dynamic filters
            let matchesFilters = true;
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    const itemValue = item[key] || item[key.charAt(0).toUpperCase() + key.slice(1)];
                    matchesFilters = matchesFilters && String(itemValue).toLowerCase() === String(filters[key]).toLowerCase();
                }
            });

            return matchesSearch && matchesFilters;
        });
    }, [items, searchTerm, filters]);

    // Pagination
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const formatCurrency = (value) => {
        if (!value) return '-';
        return new Intl.NumberFormat('fr-TN', {
            style: 'decimal',
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        }).format(value);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR');
    };

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <div></div>
                <div className="page-actions">
                    <button className="btn btn-secondary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Exporter
                    </button>
                    {canCreate && (
                        <button onClick={() => navigate(`/${documentType}/new`)} className="btn btn-primary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Nouveau {title.slice(0, -1)}
                        </button>
                    )}
                </div>
            </div>

            {/* Table Container */}
            <div className="table-container">
                {/* Toolbar with Filters */}
                <div className="table-toolbar">
                    <div className="table-search">
                        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <input 
                            type="text" 
                            placeholder=""
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {/* Dynamic Filter Dropdowns */}
                        {filterConfig?.map(filter => (
                            <select 
                                key={filter.key}
                                className="form-input" 
                                style={{ width: filter.width || '140px' }}
                                value={filters[filter.key] || ''}
                                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                            >
                                <option value="">{filter.label}</option>
                                {filter.optionsKey === 'clients' && filterOptions.clients.map(c => (
                                    <option key={c.TiersId || c.CodTiers} value={c.CodTiers}>
                                        {c.Raisoc || c.CodTiers}
                                    </option>
                                ))}
                                {filter.optionsKey === 'commercials' && filterOptions.commercials.map(c => (
                                    <option key={c.userId || c.UserID || c.value} value={c.userId || c.UserID || c.value}>
                                        {c.fullName || c.label || c.login}
                                    </option>
                                ))}
                                {filter.options?.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        ))}
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <div className="animate-pulse">Chargement...</div>
                    </div>
                ) : (
                    <>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    {columns.map(col => (
                                        <th key={col.key}>{col.label}</th>
                                    ))}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '3rem' }}>
                                            <p style={{ color: '#64748b' }}>Aucun {title.slice(0, -1).toLowerCase()} trouvé</p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedItems.map((item) => (
                                        <tr key={item.Num || item.NDoc || item.id}>
                                            {columns.map(col => (
                                                <td key={col.key}>
                                                    {col.type === 'reference' && (
                                                        <span className="table-cell-ref">
                                                            {item[col.key] || item[col.key.replace(/^[a-z]/, m => m.toUpperCase())] || '-'}
                                                        </span>
                                                    )}
                                                    {col.type === 'client' && (
                                                        <div>
                                                            <span className="table-cell-client">{item.LibTiers || '-'}</span>
                                                            {col.subField && (
                                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                                                    {item[col.subField] || '-'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {col.type === 'amount' && (
                                                        <span className="table-cell-amount">
                                                            {formatCurrency(item[col.key] || item.TotTTC || 0)}
                                                        </span>
                                                    )}
                                                    {col.type === 'date' && (
                                                        <span>{formatDate(item[col.key])}</span>
                                                    )}
                                                    {col.type === 'status' && getStatusBadge && (
                                                        getStatusBadge(item)
                                                    )}
                                                    {(!col.type || col.type === 'text') && (
                                                        <span>{item[col.key] || '-'}</span>
                                                    )}
                                                </td>
                                            ))}
                                            <td>
                                                <div className="table-actions">
                                                    <button 
                                                        title="Voir"
                                                        onClick={() => navigate(`/${documentType}/${item.Num || item.NDoc || item.id}`)}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                            <circle cx="12" cy="12" r="3"></circle>
                                                        </svg>
                                                    </button>
                                                    {canEdit && (
                                                        <button 
                                                            title="Modifier"
                                                            onClick={() => navigate(`/${documentType}/edit/${item.Num || item.NDoc || item.id}`)}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                            </svg>
                                                        </button>
                                                    )}
                                                    {canTransfer && documentType === 'bcv' && (
                                                        <button 
                                                            title="Transférer en BL"
                                                            onClick={() => navigate(`/blv/new?source=${item.Num || item.NDoc}`)}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"></path>
                                                            </svg>
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button 
                                                            title="Supprimer"
                                                            onClick={() => {/* Handle delete */}}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="table-pagination">
                                <span className="pagination-info">
                                    Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredItems.length)} sur {filteredItems.length} {title.toLowerCase()}
                                </span>
                                <div className="pagination-buttons">
                                    <button 
                                        className="pagination-btn" 
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => p - 1)}
                                    >
                                        Précédent
                                    </button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        return (
                                            <button 
                                                key={pageNum}
                                                className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                                                onClick={() => setCurrentPage(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                    <button 
                                        className="pagination-btn" 
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(p => p + 1)}
                                    >
                                        Suivant
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default SalesListMaquette;
