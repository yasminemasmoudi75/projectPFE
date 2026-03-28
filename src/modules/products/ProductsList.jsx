import { useState, useEffect } from 'react';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    ArchiveBoxIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
    PencilIcon,
    SparklesIcon,
    PhotoIcon,
    TrashIcon,
    EyeIcon,
    Squares2X2Icon,
    ListBulletIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import axios from '../../app/axios';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUrl';

const ProductsList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        collection: '',
        priceMin: '',
        priceMax: '',
        stockStatus: '', // all, ok, low, rupture
        marque: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchProducts(searchTerm);
        }, 500); // 500ms debounce
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const fetchProducts = async (search = '') => {
        setLoading(true);
        try {
            const response = await axios.get('/products', {
                params: { search, sort: 'recent' }
            });
            // Handle both { data: [...] } and directly [...]
            const productData = response?.data || response;
            setProducts(Array.isArray(productData) ? productData : []);
        } catch (error) {
            console.error("Error fetching products:", error);
            // toast.error("Impossible de charger les produits");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
            try {
                await axios.delete(`/products/${id}`);
                setProducts(products.filter(p => p.IDArt !== id));
                toast.success('Produit supprimé avec succès');
            } catch (error) {
                console.error("Error deleting product:", error);
                toast.error("Erreur lors de la suppression");
            }
        }
    };

    // Removal of local filtering
    const filteredProducts = products.filter(product => {
        const matchesSearch = searchTerm === '' || 
            product.CodArt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.LibArt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.Marque?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCollection = filters.collection === '' || product.Collection === filters.collection;
        const matchesBrand = filters.marque === '' || product.Marque === filters.marque;
        
        const priceMin = filters.priceMin === '' ? 0 : parseFloat(filters.priceMin);
        const priceMax = filters.priceMax === '' ? Infinity : parseFloat(filters.priceMax);
        const matchesPrice = product.PrixVente >= priceMin && product.PrixVente <= priceMax;
        
        let matchesStock = true;
        if (filters.stockStatus === 'ok') matchesStock = product.Qte > 5;
        else if (filters.stockStatus === 'low') matchesStock = product.Qte > 0 && product.Qte <= 5;
        else if (filters.stockStatus === 'rupture') matchesStock = product.Qte === 0;
        
        return matchesSearch && matchesCollection && matchesBrand && matchesPrice && matchesStock;
    });

    // Get unique values for filter dropdowns
    const uniqueCollections = [...new Set(products.map(p => p.Collection).filter(Boolean))];
    const uniqueMarques = [...new Set(products.map(p => p.Marque).filter(Boolean))];

    if (loading) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in space-y-8 pb-12">
            {/* Header section with Soft UI */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-4 w-4 bg-gradient-soft-blue rounded-md flex items-center justify-center ring-4 ring-blue-50">
                            <ArchiveBoxIcon className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="text-[10px] font-black text-[#2152ff] uppercase tracking-widest">Inventaire Logistique</span>
                    </div>
                    <h1 className="text-2xl font-black text-[#344767] tracking-tight">Stock & Produits</h1>
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2 text-[#67748e] hover:text-[#344767] font-bold text-[10px] uppercase tracking-widest transition-all">
                        Mouvements
                    </button>
                    <button
                        onClick={() => navigate('/products/new')}
                        className="btn-soft-primary flex items-center gap-2"
                    >
                        <PlusIcon className="h-4 w-4 stroke-[3]" />
                        Ajouter Produit
                    </button>
                </div>
            </div>

            {/* Stats Cards - Soft UI Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-luxury p-6 flex items-center justify-between transition-transform hover:scale-[1.02]">
                    <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Références</p>
                        <p className="text-2xl font-black text-[#344767]">{products.length}</p>
                    </div>
                    <div className="icon-shape bg-gradient-soft-blue shadow-soft">
                        <ArchiveBoxIcon className="h-5 w-5 text-white" />
                    </div>
                </div>
                <div className="card-luxury p-6 flex items-center justify-between transition-transform hover:scale-[1.02]">
                    <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Alertes Stock</p>
                        <p className="text-2xl font-black text-rose-500">
                            {products.filter(p => p.Qte <= 5 && p.Qte > 0).length}
                        </p>
                    </div>
                    <div className="icon-shape shadow-soft" style={{ backgroundImage: 'linear-gradient(310deg, #ea0606 0%, #ff667c 100%)' }}>
                        <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                    </div>
                </div>
                <div className="card-luxury p-6 flex items-center justify-between transition-transform hover:scale-[1.02]">
                    <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Ruptures</p>
                        <p className="text-2xl font-black text-rose-600 font-mono">
                            {products.filter(p => p.Qte === 0).length}
                        </p>
                    </div>
                    <div className="icon-shape shadow-soft bg-gradient-dark">
                        <SparklesIcon className="h-5 w-5 text-white" />
                    </div>
                </div>
            </div>

            {/* Main Display Card */}
            <div className="card-luxury p-0 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 flex flex-col gap-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <h3 className="text-[11px] font-black text-[#344767] uppercase tracking-widest">Registre Catalogue</h3>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full lg:w-auto">
                            {/* Search Bar */}
                            <div className="relative group flex-1 sm:flex-none sm:min-w-[350px]">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Rechercher par référence, nom ou marque..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm hover:shadow-md placeholder:text-slate-400"
                                />
                            </div>
                            
                            {/* Filter Toggle Button */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`px-5 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2 ${
                                    showFilters 
                                        ? 'bg-blue-500 text-white shadow-lg' 
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                🔽 Filtres {Object.values(filters).some(v => v !== '') && '●'}
                            </button>
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-5 bg-gradient-to-r from-blue-50 to-slate-50 rounded-2xl border-2 border-blue-100/50">
                            {/* Category/Collection Filter */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Catégorie</label>
                                <select
                                    value={filters.collection}
                                    onChange={(e) => setFilters({...filters, collection: e.target.value})}
                                    className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                >
                                    <option value="">Toutes</option>
                                    {uniqueCollections.map(col => (
                                        <option key={col} value={col}>{col}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Brand/Marque Filter */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Marque</label>
                                <select
                                    value={filters.marque}
                                    onChange={(e) => setFilters({...filters, marque: e.target.value})}
                                    className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                >
                                    <option value="">Toutes</option>
                                    {uniqueMarques.map(marque => (
                                        <option key={marque} value={marque}>{marque}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Price Min */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Prix Min (TND)</label>
                                <input
                                    type="number" min="0"
                                    placeholder="0"
                                    value={filters.priceMin}
                                    onChange={(e) => setFilters({...filters, priceMin: e.target.value})}
                                    className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                />
                            </div>

                            {/* Price Max */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Prix Max (TND)</label>
                                <input
                                    type="number" min="0"
                                    placeholder="∞"
                                    value={filters.priceMax}
                                    onChange={(e) => setFilters({...filters, priceMax: e.target.value})}
                                    className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                />
                            </div>

                            {/* Stock Status Filter */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">État Stock</label>
                                <select
                                    value={filters.stockStatus}
                                    onChange={(e) => setFilters({...filters, stockStatus: e.target.value})}
                                    className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                >
                                    <option value="">Tous</option>
                                    <option value="ok">✓ Disponible</option>
                                    <option value="low">⚠ Faible</option>
                                    <option value="rupture">✕ Rupture</option>
                                </select>
                            </div>

                            {/* Clear Filters Button */}
                            <div className="flex items-end">
                                <button
                                    onClick={() => setFilters({collection: '', priceMin: '', priceMax: '', stockStatus: '', marque: ''})}
                                    className="w-full px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm rounded-lg transition-all shadow-sm"
                                >
                                    ↻ Réinitialiser
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Table View - Now Default and Only View */}
                <div className="overflow-x-auto min-h-[500px] bg-gradient-to-b from-white via-white to-blue-50/20">
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-16">
                            <PhotoIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold text-lg">Aucun produit trouvé</p>
                            <p className="text-slate-400 text-sm mt-1">Ajustez votre recherche ou</p>
                            <button
                                onClick={() => navigate('/products/new')}
                                className="mt-4 btn-soft-primary inline-flex items-center gap-2"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Créer un produit
                            </button>
                        </div>
                    ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gradient-to-r from-slate-100 via-blue-50 to-slate-100 border-b-2 border-slate-200 sticky top-0 shadow-sm">
                                <th className="px-6 py-5 text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] w-12">#</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">Référence</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">Désignation</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">Prix VT</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">Stock</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">État</th>
                                <th className="px-6 py-5 text-right text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredProducts.map((product, idx) => {
                                const stockState = product.Qte === 0 ? 'Rupture' : (product.Qte <= 5 ? 'Faible' : 'OK');
                                const stockClass = product.Qte === 0 ? 'bg-rose-100 text-rose-700 border border-rose-200' : (product.Qte <= 5 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200');
                                return (
                                    <tr
                                        key={product.IDArt}
                                        className="group hover:bg-blue-50/60 transition-all duration-200 cursor-pointer border-l-4 border-l-slate-100 hover:border-l-blue-500 hover:shadow-md"
                                        onClick={() => navigate(`/products/${product.IDArt}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg font-bold text-xs">{idx + 1}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-[10px] font-black text-blue-700">{product.CodArt.substring(0, 2).toUpperCase()}</span>
                                                </div>
                                                <span className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">{product.CodArt}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3 max-w-md">
                                                {product.urlimg ? (
                                                    <img
                                                        src={getImageUrl(product.urlimg)}
                                                        alt={product.LibArt}
                                                        className="w-12 h-12 rounded-xl object-cover bg-slate-100 group-hover:shadow-lg transition-shadow flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
                                                        <PhotoIcon className="h-5 w-5 text-slate-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">{product.LibArt}</div>
                                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{product.Collection || 'Divers'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-blue-600">{Number(product.PrixVente).toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">TND</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-black ${product.Qte === 0 ? 'text-rose-600' : product.Qte <= 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    {product.Qte}
                                                </span>
                                                <span className="text-[9px] font-semibold text-slate-400 uppercase">{product.Unite || 'Utés'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="inline-flex">
                                                <span className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm ${stockClass} backdrop-blur-sm`}>
                                                    {stockState}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.IDArt}`); }}
                                                    className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white shadow-sm transition-all duration-200 hover:shadow-md transform hover:scale-110"
                                                    title="Voir détails"
                                                >
                                                    <EyeIcon className="h-4 w-4 stroke-[2.5]" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/products/edit/${product.IDArt}`); }}
                                                    className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white shadow-sm transition-all duration-200 hover:shadow-md transform hover:scale-110"
                                                    title="Éditer"
                                                >
                                                    <PencilIcon className="h-4 w-4 stroke-[2.5]" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(product.IDArt); }}
                                                    className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white shadow-sm transition-all duration-200 hover:shadow-md transform hover:scale-110"
                                                    title="Supprimer"
                                                >
                                                    <TrashIcon className="h-4 w-4 stroke-[2.5]" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    )}
                </div>

                <div className="p-6 bg-slate-50/20 border-t border-slate-50 text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Audit de stock certifié - AMS Lab Logistique</p>
                </div>
            </div>
        </div>
    );
};

export default ProductsList;
