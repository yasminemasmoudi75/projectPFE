import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../app/axios';
import toast from 'react-hot-toast';
import usePermission from '../../hooks/usePermission';
import { MODULE_CODES } from '../../utils/constants';

const ClientsListMaquette = () => {
    const navigate = useNavigate();
    const { canCreate, canEdit } = usePermission(MODULE_CODES.CLIENTS);
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    
    // Filtres
    const [filters, setFilters] = useState({
        status: '',
        city: '',
        classe: '',
        type: ''
    });
    
    const [tiersClasses, setTiersClasses] = useState([]);
    const [tiersGouvernorats, setTiersGouvernorats] = useState([]);

    // Fetch clients
    useEffect(() => {
        const fetchClients = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/tiers?sort=recent&limit=1000');
                const list = response?.data?.data ?? response?.data ?? [];
                setClients(Array.isArray(list) ? list : []);
            } catch (error) {
                console.error('Error fetching clients:', error);
                toast.error('Impossible de charger les clients');
            } finally {
                setLoading(false);
            }
        };

        const fetchFilters = async () => {
            try {
                const [gouvRes, classesRes] = await Promise.all([
                    axios.get('/tiers-gouvernorats').catch(() => ({ data: { data: [] } })),
                    axios.get('/tiers-classes').catch(() => ({ data: { data: [] } }))
                ]);
                setTiersGouvernorats(gouvRes.data?.data || gouvRes.data || []);
                setTiersClasses(classesRes.data?.data || classesRes.data || []);
            } catch (error) {
                console.error('Error fetching filter data:', error);
            }
        };

        fetchClients();
        fetchFilters();
    }, []);

    // Filter logic
    const filteredClients = useMemo(() => {
        return clients.filter(c => {
            const matchesSearch = !searchTerm || 
                (c.Raisoc || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.CodTiers || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.Ville || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = !filters.status ||
                (filters.status === 'active' && c.Actif === true) ||
                (filters.status === 'inactive' && c.Actif === false);

            const matchesCity = !filters.city || 
                String(c.gouvernorat || c.Gouvernorat || '').toLowerCase() === filters.city.toLowerCase();

            const matchesClasse = !filters.classe || 
                String(c.Classe || '').toLowerCase() === filters.classe.toLowerCase();

            return matchesSearch && matchesStatus && matchesCity && matchesClasse;
        });
    }, [clients, searchTerm, filters]);

    // Pagination
    const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
    const paginatedClients = filteredClients.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const getStatusBadge = (client) => {
        if (client.Actif === false) {
            return <span className="table-cell-status status-draft">Inactif</span>;
        }
        return <span className="table-cell-status status-validated">Actif</span>;
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
                        <button onClick={() => navigate('/clients/new')} className="btn btn-primary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Nouveau Client
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
                        <select 
                            className="form-input" 
                            style={{ width: '140px' }}
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="">Tous les statuts</option>
                            <option value="active">Actif</option>
                            <option value="inactive">Inactif</option>
                        </select>
                        <select 
                            className="form-input" 
                            style={{ width: '140px' }}
                            value={filters.city}
                            onChange={(e) => handleFilterChange('city', e.target.value)}
                        >
                            <option value="">Tous les gouvernorats</option>
                            {tiersGouvernorats.map(g => (
                                <option key={g.id || g} value={g.libelle || g}>
                                    {g.libelle || g}
                                </option>
                            ))}
                        </select>
                        <select 
                            className="form-input" 
                            style={{ width: '140px' }}
                            value={filters.classe}
                            onChange={(e) => handleFilterChange('classe', e.target.value)}
                        >
                            <option value="">Toutes les classes</option>
                            {tiersClasses.map(c => (
                                <option key={c.id || c} value={c.libelle || c}>
                                    {c.libelle || c}
                                </option>
                            ))}
                        </select>
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
                                    <th>Code</th>
                                    <th>Raison Sociale</th>
                                    <th>Contact</th>
                                    <th>Adresse</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedClients.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                                            <p style={{ color: '#64748b' }}>Aucun client trouvé</p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedClients.map((client) => (
                                        <tr key={client.TiersId || client.id || client.CodTiers}>
                                            <td>
                                                <span className="table-cell-ref">{client.CodTiers || '-'}</span>
                                            </td>
                                            <td>
                                                <span className="table-cell-client">{client.Raisoc || '-'}</span>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                                    {client.Classe || 'Standard'}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    <span style={{ fontWeight: 500 }}>{client.Nom || client.Prenom || '-'}</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                        {client.Tel || client.Gsm || '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    <span>{client.Adresse || '-'}</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                        {client.Ville || '-'} {client.gouvernorat || client.Gouvernorat || ''}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>{getStatusBadge(client)}</td>
                                            <td>
                                                <div className="table-actions">
                                                    <button 
                                                        title="Voir"
                                                        onClick={() => navigate(`/clients/${client.TiersId || client.id}`)}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                            <circle cx="12" cy="12" r="3"></circle>
                                                        </svg>
                                                    </button>
                                                    {canEdit && (
                                                        <button 
                                                            title="Modifier"
                                                            onClick={() => navigate(`/clients/edit/${client.TiersId || client.id}`)}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
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
                                    Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredClients.length)} sur {filteredClients.length} clients
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

export default ClientsListMaquette;
