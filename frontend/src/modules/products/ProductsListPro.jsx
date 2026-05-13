import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  EyeIcon,
  FunnelIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  Squares2X2Icon,
  ListBulletIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { StatCard, DataTable, PageHeader, SearchBar } from '../../components/ui';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import axios from '../../app/axios';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUrl';
import { formatCurrency } from '../../utils/format';
import usePermission from '../../hooks/usePermission';
import { MODULE_CODES } from '../../utils/constants';

const ProductsListPro = () => {
  const navigate = useNavigate();
  const { canCreate, canEdit, canDelete } = usePermission(MODULE_CODES.STOCK);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [filters, setFilters] = useState({
    collection: 'all',
    stockStatus: 'all',
    priceMin: '',
    priceMax: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [collections, setCollections] = useState([]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/products', { params: { sort: 'recent' } });
      const data = response?.data || response;
      setProducts(Array.isArray(data) ? data : []);
      
      // Extract unique collections
      const uniqueCollections = [...new Set(data.map(p => p.collection?.Libelle).filter(Boolean))];
      setCollections(uniqueCollections);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Impossible de charger les produits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const total = products.length;
    const totalValue = products.reduce((sum, p) => sum + ((p.PrixVente || 0) * (p.QteStock || 0)), 0);
    const lowStock = products.filter(p => (p.QteStock || 0) < (p.QteMin || 10)).length;
    const outOfStock = products.filter(p => (p.QteStock || 0) === 0).length;
    const withImages = products.filter(p => p.Image).length;
    return { total, totalValue, lowStock, outOfStock, withImages };
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !searchTerm ||
        (p.Libelle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.CodArt || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.Marque || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCollection = filters.collection === 'all' ||
        p.collection?.Libelle === filters.collection;

      const matchesStock = filters.stockStatus === 'all' ||
        (filters.stockStatus === 'in' && (p.QteStock || 0) > (p.QteMin || 10)) ||
        (filters.stockStatus === 'low' && (p.QteStock || 0) <= (p.QteMin || 10) && (p.QteStock || 0) > 0) ||
        (filters.stockStatus === 'out' && (p.QteStock || 0) === 0);

      const matchesPriceMin = !filters.priceMin || (p.PrixVente || 0) >= parseFloat(filters.priceMin);
      const matchesPriceMax = !filters.priceMax || (p.PrixVente || 0) <= parseFloat(filters.priceMax);

      return matchesSearch && matchesCollection && matchesStock && matchesPriceMin && matchesPriceMax;
    });
  }, [products, searchTerm, filters]);

  // Columns for table view
  const columns = [
    {
      key: 'Image',
      title: '',
      sortable: false,
      render: (value, row) => (
        <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
          {value ? (
            <img 
              src={getImageUrl(value)} 
              alt={row.Libelle}
              className="h-full w-full object-cover"
              onError={(e) => { e.target.src = '/placeholder-product.png'; }}
            />
          ) : (
            <PhotoIcon className="h-6 w-6 text-slate-400" />
          )}
        </div>
      )
    },
    {
      key: 'CodArt',
      title: 'Code',
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
          {value || '-'}
        </span>
      )
    },
    {
      key: 'Libelle',
      title: 'Produit',
      render: (value, row) => (
        <div>
          <p className="font-semibold text-slate-800">{value || 'N/A'}</p>
          {row.Marque && <p className="text-xs text-slate-500">{row.Marque}</p>}
        </div>
      )
    },
    {
      key: 'collection',
      title: 'Collection',
      render: (value) => value?.Libelle ? (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs font-medium">
          {value.Libelle}
        </span>
      ) : <span className="text-slate-400">-</span>
    },
    {
      key: 'PrixVente',
      title: 'Prix',
      render: (value) => (
        <span className="font-bold text-slate-800">{formatCurrency(value)}</span>
      )
    },
    {
      key: 'QteStock',
      title: 'Stock',
      render: (value, row) => {
        const stock = value || 0;
        const min = row.QteMin || 10;
        let status = 'ok';
        if (stock === 0) status = 'out';
        else if (stock <= min) status = 'low';
        
        return (
          <div className="flex items-center gap-2">
            <span className={`font-bold ${
              status === 'out' ? 'text-rose-600' : 
              status === 'low' ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {stock}
            </span>
            {status === 'out' && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-medium">
                Épuisé
              </span>
            )}
            {status === 'low' && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                Critique
              </span>
            )}
          </div>
        );
      }
    }
  ];

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    try {
      await axios.delete(`/products/${id}`);
      toast.success('Produit supprimé');
      fetchProducts();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleExport = () => {
    const csv = [
      ['Code', 'Libellé', 'Marque', 'Collection', 'Prix', 'Stock'].join(';'),
      ...filteredProducts.map(p => [
        p.CodArt || '',
        p.Libelle || '',
        p.Marque || '',
        p.collection?.Libelle || '',
        p.PrixVente || 0,
        p.QteStock || 0
      ].join(';'))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `produits_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Export CSV réussi');
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Gestion des Produits"
        subtitle={`${stats.total} produits • Valeur stock: ${formatCurrency(stats.totalValue)}`}
        icon={ArchiveBoxIcon}
        action={canCreate && (
          <button
            onClick={() => navigate('/products/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            <PlusIcon className="h-5 w-5" />
            Nouveau Produit
          </button>
        )}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Total Produits"
          value={stats.total}
          icon={CubeIcon}
          color="blue"
        />
        <StatCard
          title="Valeur Stock"
          value={formatCurrency(stats.totalValue)}
          icon={CurrencyDollarIcon}
          color="emerald"
        />
        <StatCard
          title="Stock Faible"
          value={stats.lowStock}
          subtitle="Nécessite réapprovisionnement"
          icon={ExclamationTriangleIcon}
          color="amber"
        />
        <StatCard
          title="Rupture Stock"
          value={stats.outOfStock}
          icon={XMarkIcon}
          color="rose"
        />
        <StatCard
          title="Avec Images"
          value={stats.withImages}
          subtitle={`${Math.round((stats.withImages / stats.total) * 100) || 0}%`}
          icon={CheckCircleIcon}
          color="purple"
        />
      </div>

      {/* Filters & View Toggle */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Rechercher par nom, code, marque..."
            className="flex-1"
          />
          
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                showFilters ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
              onClick={fetchProducts}
              className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Collection</label>
              <select
                value={filters.collection}
                onChange={(e) => setFilters(f => ({ ...f, collection: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="all">Toutes les collections</option>
                {collections.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Stock</label>
              <select
                value={filters.stockStatus}
                onChange={(e) => setFilters(f => ({ ...f, stockStatus: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="all">Tous les stocks</option>
                <option value="in">En stock</option>
                <option value="low">Stock faible</option>
                <option value="out">Rupture</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Prix min</label>
              <input
                type="number"
                value={filters.priceMin}
                onChange={(e) => setFilters(f => ({ ...f, priceMin: e.target.value }))}
                placeholder="0"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Prix max</label>
              <input
                type="number"
                value={filters.priceMax}
                onChange={(e) => setFilters(f => ({ ...f, priceMax: e.target.value }))}
                placeholder="∞"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={filteredProducts}
          loading={loading}
          onRowClick={(row) => navigate(`/products/${row.CodArt}`)}
          actions={(row) => (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/products/${row.CodArt}`);
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
                    navigate(`/products/${row.CodArt}/edit`);
                  }}
                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Modifier"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(row.CodArt);
                  }}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </>
          )}
        />
      ) : (
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.CodArt}
              onClick={() => navigate(`/products/${product.CodArt}`)}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="h-48 bg-slate-100 relative overflow-hidden">
                {product.Image ? (
                  <img
                    src={getImageUrl(product.Image)}
                    alt={product.Libelle}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <PhotoIcon className="h-16 w-16 text-slate-300" />
                  </div>
                )}
                {(product.QteStock || 0) === 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="px-4 py-2 bg-rose-500 text-white rounded-full text-sm font-bold">
                      Rupture de stock
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500">{product.CodArt}</span>
                  {product.collection?.Libelle && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                      {product.collection.Libelle}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-800 mb-2 line-clamp-2">{product.Libelle}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(product.PrixVente)}</span>
                  <span className={`text-sm font-medium ${
                    (product.QteStock || 0) > 10 ? 'text-emerald-600' :
                    (product.QteStock || 0) > 0 ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    Stock: {product.QteStock || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsListPro;
