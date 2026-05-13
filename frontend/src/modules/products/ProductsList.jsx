import { useState, useEffect, useMemo, useRef } from 'react';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    ArchiveBoxIcon,
    ArrowPathIcon,
    PencilSquareIcon,
    PhotoIcon,
    TrashIcon,
    EyeIcon,
    Squares2X2Icon,
    ListBulletIcon,
    FunnelIcon,
    XMarkIcon,
    ChevronDownIcon,
    CurrencyDollarIcon,
    ArrowUpRightIcon,
    ArrowTrendingUpIcon,
    CheckCircleIcon,
    ArrowDownTrayIcon,
    PrinterIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import axios from '../../app/axios';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUrl';
import { formatCurrency } from '../../utils/format';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import usePermission from '../../hooks/usePermission';
import useAuth from '../../hooks/useAuth';
import { MODULE_CODES } from '../../utils/constants';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.12 },
    },
};

const itemVariants = {
    hidden: { y: 16, opacity: 0, scale: 0.98 },
    visible: {
        y: 0,
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', stiffness: 320, damping: 26 },
    },
};

const rowVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', bounce: 0, duration: 0.35 } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15 } },
};

const gridItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

const ProductsList = () => {
    const navigate = useNavigate();
    const { isClient } = useAuth();
    const { canCreate, canEdit } = usePermission(MODULE_CODES.STOCK);
    const [bootstrapping, setBootstrapping] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [products, setProducts] = useState([]);
    const [stockFilterMeta, setStockFilterMeta] = useState({
        all: { id: 'all', label: 'Tous', count: 0, visible: true },
        ok: { id: 'ok', label: 'Dispo', count: 0, visible: true },
        low: { id: 'low', label: 'Faible', count: 0, visible: true },
        rupture: { id: 'rupture', label: 'Rupture', count: 0, visible: true },
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState(isClient ? 'grid' : 'table');
    const [filters, setFilters] = useState({
        collection: '',
        priceMin: '',
        priceMax: '',
        stockStatus: 'all',
        marque: '',
    });
    const [showFilters, setShowFilters] = useState(false);
    const firstFetchDone = useRef(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchProducts(searchTerm);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, searchTerm]);

    useEffect(() => {
        if (isClient) {
            setViewMode('grid');
            setShowFilters(false);
        }
    }, [isClient]);

    const fetchProducts = async (search = '') => {
        if (!firstFetchDone.current) setBootstrapping(true);
        else setRefreshing(true);
        try {
            const response = await axios.get('/products', {
                params: { search, sort: 'recent' },
            });
            // Axios interceptor already returns response.data, so response IS the apiData
            // response = { status, data: [...], meta: { stockFilters } }
            const apiData = response || {};
            const productData = apiData?.data || [];
            setProducts(Array.isArray(productData) ? productData : []);
            
            // Get filter visibility from backend
            console.log('[ProductsList] apiData?.meta?.stockFilters exists:', !!apiData?.meta?.stockFilters);
            console.log('[ProductsList] full response:', JSON.stringify(apiData?.meta, null, 2));
            if (apiData?.meta?.stockFilters) {
                console.log('[ProductsList] stockFilters:', apiData.meta.stockFilters);
                setStockFilterMeta(apiData.meta.stockFilters);
                const selected = apiData.meta.stockFilters?.[filters.stockStatus];
                if (selected && selected.visible === false) {
                    setFilters((prev) => ({ ...prev, stockStatus: 'all' }));
                }
            }
            firstFetchDone.current = true;
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setBootstrapping(false);
            setRefreshing(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setFilters({
            collection: '',
            priceMin: '',
            priceMax: '',
            stockStatus: 'all',
            marque: '',
        });
    };

    const exportToCSV = () => {
        // For clients, exclude stock column
        const headers = isClient 
            ? ['Code', 'Libelle', 'Marque', 'Prix']
            : ['Code', 'Libelle', 'Marque', 'Prix', 'Stock'];
        const rows = filteredProducts.map(p => isClient
            ? [p.CodArt || '', p.LibArt || '', p.Marque || '', p.PrixVente || 0]
            : [p.CodArt || '', p.LibArt || '', p.Marque || '', p.PrixVente || 0, p.Qte || 0]
        );
        const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `produits_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success('Export CSV reussi');
    };

    const exportToPDF = () => {
        const printWindow = window.open('', '_blank');
        const stockHeader = isClient ? '' : '<th>Stock</th>';
        const stockCell = isClient ? '' : '<td>${p.Qte || 0}</td>';
        const html = `
          <html>
            <head>
              <title>Liste des Produits</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background: #3b82f6; color: white; }
                tr:nth-child(even) { background: #f8fafc; }
              </style>
            </head>
            <body>
              <h1>Liste des Produits</h1>
              <p>Exporte le ${new Date().toLocaleDateString('fr-FR')} - ${filteredProducts.length} produits</p>
              <table>
                <thead>
                  <tr>
                    <th>Code</th><th>Libelle</th><th>Marque</th><th>Prix</th>${stockHeader}
                  </tr>
                </thead>
                <tbody>
                  ${filteredProducts.map(p => `
                    <tr>
                      <td>${p.CodArt || '-'}</td>
                      <td>${p.LibArt || '-'}</td>
                      <td>${p.Marque || '-'}</td>
                      <td>${(p.PrixVente || 0).toFixed(2)} TND</td>
                      ${isClient ? '' : `<td>${p.Qte || 0}</td>`}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </body>
          </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    };

    const handleDelete = async (id) => {
        if (isClient) return;
        if (window.confirm('Etes-vous sur de vouloir supprimer ce produit ?')) {
            try {
                await axios.delete(`/products/${id}`);
                setProducts((prev) => prev.filter((p) => p.IDArt !== id));
                toast.success('Produit supprime avec succes');
            } catch (error) {
                console.error('Error deleting product:', error);
                toast.error('Erreur lors de la suppression');
            }
        }
    };

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesSearch =
                searchTerm === '' ||
                product.CodArt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.LibArt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.Marque?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCollection =
                filters.collection === '' || product.Collection === filters.collection;
            const matchesBrand = filters.marque === '' || product.Marque === filters.marque;

            const priceMin = filters.priceMin === '' ? 0 : parseFloat(filters.priceMin);
            const priceMax = filters.priceMax === '' ? Infinity : parseFloat(filters.priceMax);
            const matchesPrice =
                (Number(product.PrixVente) || 0) >= priceMin &&
                (Number(product.PrixVente) || 0) <= priceMax;

            const q = Number(product.Qte) || 0;
            let matchesStock = true;
            if (filters.stockStatus === 'ok') matchesStock = q > 5;
            else if (filters.stockStatus === 'low') matchesStock = q > 0 && q <= 5;
            else if (filters.stockStatus === 'rupture') matchesStock = q === 0;

            return matchesSearch && matchesCollection && matchesBrand && matchesPrice && matchesStock;
        });
    }, [products, searchTerm, filters]);

    const activeAdvancedCount = [
        filters.collection, filters.priceMin, filters.priceMax, filters.marque,
    ].filter((v) => v !== '').length;

    const filteredValueTTC = useMemo(
        () => filteredProducts.reduce((acc, p) => acc + (Number(p.PrixVente) || 0) * (Number(p.Qte) || 0), 0),
        [filteredProducts]
    );

    const stockHealthPct = useMemo(() => {
        if (!filteredProducts.length) return 0;
        const ok = filteredProducts.filter((p) => (Number(p.Qte) || 0) > 5).length;
        return ((ok / filteredProducts.length) * 100).toFixed(1);
    }, [filteredProducts]);

    const uniqueCollections = useMemo(
        () => [...new Set(products.map((p) => p.Collection).filter(Boolean))],
        [products]
    );
    const uniqueMarques = useMemo(
        () => [...new Set(products.map((p) => p.Marque).filter(Boolean))],
        [products]
    );

    const totalItems = filteredProducts.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

    const stockBadge = (product) => {
        const q = Number(product.Qte) || 0;
        if (q === 0) return { key: 'rupture', label: 'Rupture', className: 'bg-rose-50 text-rose-700 border-rose-200' };
        if (q <= 5) return { key: 'low', label: 'Faible', className: 'bg-amber-50 text-amber-700 border-amber-200' };
        return { key: 'ok', label: 'OK', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    };

    if (bootstrapping && products.length === 0) return <LoadingSpinner />;

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 pb-12">
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        Registre des Produits
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                        </span>
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-2">
                        Catalogue, prix et stocks
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05, rotate: 180 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fetchProducts(searchTerm)}
                        disabled={refreshing}
                        className="p-3 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 hover:border-blue-300 transition-colors shadow-sm disabled:opacity-60"
                        title="Rafraichir"
                    >
                        <ArrowPathIcon className={clsx('h-5 w-5', refreshing && 'animate-spin')} />
                    </motion.button>
                    {!isClient && (
                    <div className="flex rounded-2xl border-2 border-slate-200 bg-white p-1 shadow-sm">
                        <button type="button" onClick={() => setViewMode('table')}
                            className={clsx('px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all',
                                viewMode === 'table' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-blue-600')}>
                            <ListBulletIcon className="h-4 w-4" /> Liste
                        </button>
                        <button type="button" onClick={() => setViewMode('grid')}
                            className={clsx('px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all',
                                viewMode === 'grid' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-blue-600')}>
                            <Squares2X2Icon className="h-4 w-4" /> Grille
                        </button>
                    </div>
                    )}
                                        {/* Export buttons - hidden for clients */}
                    {!isClient && (
                    <>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl font-semibold hover:bg-emerald-100 transition-colors shadow-sm">
                        <ArrowDownTrayIcon className="h-5 w-5" />
                        <span className="hidden sm:inline">CSV</span>
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={exportToPDF}
                        className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl font-semibold hover:bg-rose-100 transition-colors shadow-sm">
                        <PrinterIcon className="h-5 w-5" />
                        <span className="hidden sm:inline">PDF</span>
                    </motion.button>
                    </>
                    )}
                    {!isClient && canCreate && (
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/products/new')}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700">
                            <PlusIcon className="h-5 w-5 stroke-[3]" /> Nouveau produit
                        </motion.button>
                    )}
                </div>
            </motion.div>

            {/* Stats - hidden for clients */}
            {!isClient && (
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div whileHover={{ y: -5 }} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Valeur stock (filtre)</p>
                    <p className="text-3xl font-extrabold text-slate-900">
                        {filteredValueTTC > 0 ? (filteredValueTTC / 1000).toFixed(1) + 'k' : '0'} <span className="text-sm text-slate-400 font-bold ml-1">TND</span>
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">{totalItems} references</p>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sante stock (filtre)</p>
                    <p className="text-3xl font-extrabold text-emerald-600">{stockHealthPct}%</p>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">Part avec stock &gt; 5</p>
                </motion.div>
            </motion.div>
            )}

            {/* Filters */}
            <motion.div variants={itemVariants} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex flex-col xl:flex-row gap-4 xl:items-center">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input type="text" placeholder="Reference, designation, marque..."
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all" />
                    </div>
                    {/* Stock filters - hidden for clients */}
                    {!isClient && (
                    <div className="flex flex-wrap items-center gap-2">
                        {[
                            { id: 'all', label: stockFilterMeta?.all?.label || 'Tous', color: null },
                            { id: 'ok', label: stockFilterMeta?.ok?.label || 'Dispo', color: 'emerald' },
                            { id: 'low', label: stockFilterMeta?.low?.label || 'Faible', color: 'yellow' },
                            { id: 'rupture', label: stockFilterMeta?.rupture?.label || 'Rupture', color: 'rose' },
                        ].filter((s) => stockFilterMeta?.[s.id]?.visible !== false).map((s) => {
                            const active = filters.stockStatus === s.id;
                            let colors = 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50';
                            if (active) {
                                if (s.color === 'yellow') colors = 'bg-yellow-50 text-yellow-700 border-yellow-300';
                                else if (s.color === 'emerald') colors = 'bg-emerald-50 text-emerald-700 border-emerald-300';
                                else if (s.color === 'rose') colors = 'bg-rose-50 text-rose-700 border-rose-300';
                                else colors = 'bg-slate-800 text-white border-slate-800';
                            }
                            return (
                                <motion.button key={s.id} type="button" whileTap={{ scale: 0.95 }}
                                    onClick={() => handleFilterChange('stockStatus', s.id)}
                                    className={clsx('px-5 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest border-2 transition-all', colors)}>
                                    {s.label} ({stockFilterMeta?.[s.id]?.count ?? 0})
                                </motion.button>
                            );
                        })}
                    </div>
                    )}
                    {!isClient && (
                    <button type="button" onClick={() => setShowFilters(!showFilters)}
                        className={clsx('px-5 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 border-2',
                            showFilters ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300')}>
                        <FunnelIcon className="h-4 w-4" /> Filtres avances
                        {activeAdvancedCount > 0 && <span className="h-5 w-5 bg-indigo-500 text-white text-[10px] rounded-full flex items-center justify-center">{activeAdvancedCount}</span>}
                    </button>
                    )}
                </div>
                <AnimatePresence>
                    {showFilters && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Collection</label>
                                    <select value={filters.collection} onChange={(e) => handleFilterChange('collection', e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none">
                                        <option value="">Toutes</option>
                                        {uniqueCollections.map((col) => <option key={col} value={col}>{col}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Marque</label>
                                    <select value={filters.marque} onChange={(e) => handleFilterChange('marque', e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none">
                                        <option value="">Toutes</option>
                                        {uniqueMarques.map((m) => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Prix min</label>
                                    <input type="number" min="0" placeholder="0" value={filters.priceMin}
                                        onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Prix max</label>
                                    <input type="number" min="0" placeholder="Infini" value={filters.priceMax}
                                        onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none" />
                                </div>
                            </div>
                            <div className="flex justify-end mt-4">
                                <button type="button" onClick={resetFilters}
                                    className="px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                                    <XMarkIcon className="h-4 w-4 stroke-[3]" /> Reinitialiser
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Table / Grid */}
            <motion.div variants={itemVariants} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <ArchiveBoxIcon className="h-5 w-5 text-blue-500" /> Catalogue produits
                    </h3>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                        {totalItems} articles (page {currentPage}/{totalPages})
                    </span>
                </div>

                <div className="overflow-x-auto min-h-[320px]">
                    {totalItems === 0 ? (
                        <div className="py-32 text-center">
                            <PhotoIcon className="h-12 w-12 mx-auto text-slate-300" />
                            <p className="mt-4 text-slate-800 font-bold">{products.length > 0 ? 'Aucun resultat' : 'Catalogue vide'}</p>
                            <p className="text-xs text-slate-500 mt-1">{products.length > 0 ? 'Ajustez la recherche' : 'Ajoutez votre premier produit'}</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                            <AnimatePresence mode="popLayout">
                                {paginatedProducts.map((product) => {
                                    const badge = stockBadge(product);
                                    const showBadge = stockFilterMeta?.[badge.key]?.visible !== false;
                                    return (
                                        <motion.div key={product.IDArt} layout variants={gridItemVariants} initial="hidden" animate="visible" exit="hidden"
                                            whileHover={{ y: -4 }} onClick={() => navigate(`/products/${product.IDArt}`)}
                                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer text-left">
                                            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 mb-3">
                                                {product.urlimg ? (
                                                    <img src={getImageUrl(product.urlimg)} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <PhotoIcon className="h-12 w-12 text-slate-300" />
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider">{product.CodArt}</p>
                                            <h4 className="font-extrabold text-slate-900 text-sm line-clamp-2 mt-1">{product.LibArt}</h4>
                                            <div className="mt-3 flex items-center justify-between gap-2">
                                                <span className="text-sm font-black text-slate-900">{formatCurrency(product.PrixVente || 0)}</span>
                                                {/* Stock badge hidden for clients */}
                                                {!isClient && showBadge && (
                                                    <span className={clsx('text-[10px] font-black uppercase px-2 py-1 rounded-lg border', badge.className)}>{badge.label}</span>
                                                )}
                                            </div>
                                            {/* Quantity hidden for clients */}
                                            {!isClient && (
                                                <p className="text-xs text-slate-500 mt-2 font-bold">Qte {product.Qte}</p>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-14">#</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Reference</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Produit</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Prix</th>
                                    {/* Stock and Etat columns hidden for clients */}
                                    {!isClient && (
                                        <>
                                            <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Stock</th>
                                            <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Etat</th>
                                        </>
                                    )}
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                <AnimatePresence>
                                    {paginatedProducts.map((product, idx) => {
                                        const badge = stockBadge(product);
                                        const showBadge = stockFilterMeta?.[badge.key]?.visible !== false;
                                        return (
                                            <motion.tr key={product.IDArt} variants={rowVariants} initial="hidden" animate="visible" exit="exit" layout
                                                className="group hover:bg-blue-50/60 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500"
                                                onClick={() => navigate(`/products/${product.IDArt}`)}>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-lg font-bold text-xs">{startIndex + idx + 1}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">{product.CodArt}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {product.urlimg ? (
                                                            <img src={getImageUrl(product.urlimg)} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-100" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                                                <PhotoIcon className="h-5 w-5 text-slate-400" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{product.LibArt}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{product.Collection || '-'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-black text-blue-600">{formatCurrency(product.PrixVente || 0)}</span>
                                                </td>
                                                {/* Stock and Etat cells hidden for clients */}
                                                {!isClient && (
                                                    <>
                                                        <td className="px-6 py-4">
                                                            <span className={clsx('text-sm font-black', (Number(product.Qte) || 0) === 0 ? 'text-rose-600' : (Number(product.Qte) || 0) <= 5 ? 'text-amber-600' : 'text-emerald-600')}>
                                                                {product.Qte}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {showBadge ? (
                                                                <span className={clsx('inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border', badge.className)}>
                                                                    {badge.label}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs font-semibold text-slate-400">-</span>
                                                            )}
                                                        </td>
                                                    </>
                                                )}
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.IDArt}`); }}
                                                            className="p-2.5 text-slate-400 bg-white border border-slate-200 shadow-sm hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 rounded-xl transition-all">
                                                            <EyeIcon className="h-4 w-4 stroke-[2.5]" />
                                                        </button>
                                                        {!isClient && canEdit && (
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/products/edit/${product.IDArt}`); }}
                                                                className="p-2.5 text-slate-400 bg-white border border-slate-200 shadow-sm hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 rounded-xl transition-all">
                                                                <PencilSquareIcon className="h-4 w-4 stroke-[2.5]" />
                                                            </button>
                                                        )}
                                                        {!isClient && (
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(product.IDArt); }}
                                                                className="p-2.5 text-slate-400 bg-white border border-slate-200 shadow-sm hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 rounded-xl transition-all">
                                                                <TrashIcon className="h-4 w-4 stroke-[2.5]" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                            Affichage {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} sur {totalItems}
                        </span>
                        <div className="flex items-center gap-2">
                            <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-bold disabled:opacity-50 hover:bg-slate-50">
                                Precedent
                            </button>
                            <span className="px-3 py-1.5 text-xs font-bold text-slate-600">Page {currentPage}/{totalPages}</span>
                            <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-bold disabled:opacity-50 hover:bg-slate-50">
                                Suivant
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default ProductsList;
