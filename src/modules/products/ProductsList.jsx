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
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import axios from '../../app/axios';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUrl';
import { formatCurrency } from '../../utils/format';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [bootstrapping, setBootstrapping] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('table');
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

    const fetchProducts = async (search = '') => {
        if (!firstFetchDone.current) setBootstrapping(true);
        else setRefreshing(true);
        try {
            const response = await axios.get('/products', {
                params: { search, sort: 'recent' },
            });
            const productData = response?.data || response;
            setProducts(Array.isArray(productData) ? productData : []);
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

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
            try {
                await axios.delete(`/products/${id}`);
                setProducts((prev) => prev.filter((p) => p.IDArt !== id));
                toast.success('Produit supprimé avec succès');
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

            return (
                matchesSearch &&
                matchesCollection &&
                matchesBrand &&
                matchesPrice &&
                matchesStock
            );
        });
    }, [products, searchTerm, filters]);

    const activeAdvancedCount = [
        filters.collection,
        filters.priceMin,
        filters.priceMax,
        filters.marque,
    ].filter((v) => v !== '').length;

    const filteredValueTTC = useMemo(
        () =>
            filteredProducts.reduce(
                (acc, p) => acc + (Number(p.PrixVente) || 0) * (Number(p.Qte) || 0),
                0
            ),
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
    const paginatedProducts = filteredProducts.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    const stockBadge = (product) => {
        const q = Number(product.Qte) || 0;
        if (q === 0)
            return {
                label: 'Rupture',
                className: 'bg-rose-50 text-rose-700 border-rose-200',
            };
        if (q <= 5)
            return {
                label: 'Faible',
                className: 'bg-amber-50 text-amber-700 border-amber-200',
            };
        return {
            label: 'OK',
            className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
    };

    if (bootstrapping && products.length === 0) return <LoadingSpinner />;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-12"
        >
            {/* Header — style DevisList */}
            <motion.div
                variants={itemVariants}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        Registre des Produits
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                        </span>
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-2">
                        Catalogue, prix et stocks — même expérience que vos devis, avec mise à jour
                        dynamique.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05, rotate: 180 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fetchProducts(searchTerm)}
                        disabled={refreshing}
                        className="p-3 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 hover:border-blue-300 transition-colors shadow-sm disabled:opacity-60"
                        title="Rafraîchir"
                    >
                        <ArrowPathIcon
                            className={clsx('h-5 w-5', refreshing && 'animate-spin')}
                        />
                    </motion.button>
                    <div className="flex rounded-2xl border-2 border-slate-200 bg-white p-1 shadow-sm">
                        <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={clsx(
                                'px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all',
                                viewMode === 'table'
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'text-slate-600 hover:text-blue-600'
                            )}
                        >
                            <ListBulletIcon className="h-4 w-4" />
                            Liste
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('grid')}
                            className={clsx(
                                'px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all',
                                viewMode === 'grid'
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'text-slate-600 hover:text-blue-600'
                            )}
                        >
                            <Squares2X2Icon className="h-4 w-4" />
                            Grille
                        </button>
                    </div>
                    <motion.button
                        whileHover={{
                            scale: 1.03,
                            boxShadow: '0px 10px 20px rgba(59, 130, 246, 0.3)',
                        }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/products/new')}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-soft transition-all hover:from-blue-700 hover:to-indigo-700"
                    >
                        <PlusIcon className="h-5 w-5 stroke-[3]" />
                        Nouveau produit
                    </motion.button>
                </div>
            </motion.div>

            {/* Stats — 2 cartes comme Devis */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    whileHover={{ y: -5 }}
                    className="card-luxury p-0 overflow-hidden relative group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="p-6 flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Valeur stock (filtré)
                            </p>
                            <p className="text-3xl font-extrabold text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                                {filteredValueTTC > 0
                                    ? (filteredValueTTC / 1000).toFixed(1) + 'k'
                                    : '0'}{' '}
                                <span className="text-sm text-slate-400 font-bold ml-1">TND</span>
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium mt-1">
                                {totalItems} référence{totalItems !== 1 ? 's' : ''} dans la vue
                            </p>
                        </div>
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                            <CurrencyDollarIcon className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />
                </motion.div>

                <motion.div
                    whileHover={{ y: -5 }}
                    className="card-luxury p-0 overflow-hidden relative group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="p-6 flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Santé stock (filtré)
                            </p>
                            <div className="flex items-end gap-2">
                                <p className="text-3xl font-extrabold text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-600">
                                    {stockHealthPct}%
                                </p>
                                <span className="mb-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center gap-1">
                                    <ArrowTrendingUpIcon className="h-3 w-3" />
                                    Disponible
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium mt-1">
                                Part des lignes avec stock &gt; 5
                            </p>
                        </div>
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center transform group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300">
                            <CheckCircleIcon className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
                </motion.div>
            </motion.div>

            {/* Filtres — carte DevisList */}
            <motion.div
                variants={itemVariants}
                className="card-luxury p-0 overflow-hidden bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-xl shadow-slate-200/40 rounded-3xl relative"
            >
                {refreshing && (
                    <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] flex items-center justify-center pointer-events-none rounded-3xl">
                        <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-lg border border-slate-200 text-xs font-bold text-slate-600">
                            <ArrowPathIcon className="h-4 w-4 animate-spin text-blue-600" />
                            Synchronisation…
                        </span>
                    </div>
                )}
                <div className="p-4 sm:p-6 flex flex-col xl:flex-row gap-4 xl:items-center">
                    <div className="relative flex-1 w-full group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform group-focus-within:scale-110 group-focus-within:text-blue-500">
                            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Référence, désignation, marque…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border-2 border-slate-100 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {[
                            { id: 'all', label: 'Tous', color: null },
                            { id: 'ok', label: 'Dispo', color: 'emerald' },
                            { id: 'low', label: 'Faible', color: 'yellow' },
                            { id: 'rupture', label: 'Rupture', color: 'rose' },
                        ].map((s) => {
                            const active = filters.stockStatus === s.id;
                            let colors =
                                'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50';
                            if (active) {
                                if (s.color === 'yellow')
                                    colors =
                                        'bg-yellow-50 text-yellow-700 border-yellow-300 shadow-sm shadow-yellow-200/50';
                                else if (s.color === 'emerald')
                                    colors =
                                        'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm shadow-emerald-200/50';
                                else if (s.color === 'rose')
                                    colors =
                                        'bg-rose-50 text-rose-700 border-rose-300 shadow-sm shadow-rose-200/50';
                                else
                                    colors =
                                        'bg-slate-800 text-white border-slate-800 shadow-sm shadow-slate-400/50';
                            }
                            return (
                                <motion.button
                                    key={s.id}
                                    type="button"
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleFilterChange('stockStatus', s.id)}
                                    className={clsx(
                                        'px-5 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest border-2 transition-all duration-200',
                                        colors
                                    )}
                                >
                                    {s.label}
                                </motion.button>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className={clsx(
                            'px-5 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap border-2 active:scale-95',
                            showFilters
                                ? 'bg-slate-100 border-slate-300 text-slate-800'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                        )}
                    >
                        <FunnelIcon className="h-4 w-4" />
                        Filtres avancés
                        {activeAdvancedCount > 0 && (
                            <span className="flex items-center justify-center h-5 w-5 bg-indigo-500 text-white text-[10px] rounded-full shadow-sm">
                                {activeAdvancedCount}
                            </span>
                        )}
                        <ChevronDownIcon
                            className={clsx(
                                'h-3 w-3 transition-transform duration-300',
                                showFilters && 'rotate-180'
                            )}
                        />
                    </button>
                </div>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-6 pt-0 border-t border-slate-100/80 bg-slate-50/30">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                                            Collection
                                        </label>
                                        <select
                                            value={filters.collection}
                                            onChange={(e) =>
                                                handleFilterChange('collection', e.target.value)
                                            }
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                                        >
                                            <option value="">Toutes</option>
                                            {uniqueCollections.map((col) => (
                                                <option key={col} value={col}>
                                                    {col}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                                            Marque
                                        </label>
                                        <select
                                            value={filters.marque}
                                            onChange={(e) =>
                                                handleFilterChange('marque', e.target.value)
                                            }
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                                        >
                                            <option value="">Toutes</option>
                                            {uniqueMarques.map((m) => (
                                                <option key={m} value={m}>
                                                    {m}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                            <CurrencyDollarIcon className="h-3.5 w-3.5" />
                                            Prix min (TND)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={filters.priceMin}
                                            onChange={(e) =>
                                                handleFilterChange('priceMin', e.target.value)
                                            }
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                            <CurrencyDollarIcon className="h-3.5 w-3.5" />
                                            Prix max (TND)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="∞"
                                            value={filters.priceMax}
                                            onChange={(e) =>
                                                handleFilterChange('priceMax', e.target.value)
                                            }
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-8">
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                                    >
                                        <XMarkIcon className="h-4 w-4 stroke-[3]" />
                                        Réinitialiser
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Table / Grid — carte DevisList */}
            <motion.div
                variants={itemVariants}
                className="card-luxury p-0 overflow-hidden border border-slate-200/50 shadow-xl shadow-slate-200/30 rounded-3xl"
            >
                <div className="px-8 py-6 border-b border-slate-100 bg-white flex items-center justify-between flex-wrap gap-3">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <ArchiveBoxIcon className="h-5 w-5 text-blue-500" />
                        Catalogue produits
                    </h3>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold shadow-sm border border-slate-200/60">
                        {totalItems} article{totalItems !== 1 ? 's' : ''} (page {currentPage}/
                        {totalPages})
                    </span>
                </div>

                <div className="overflow-x-auto bg-slate-50/30 min-h-[320px]">
                    {totalItems === 0 ? (
                        <div className="px-8 py-32 text-center">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex flex-col items-center gap-4 max-w-xs mx-auto"
                            >
                                <div className="h-20 w-20 bg-gradient-to-tr from-slate-100 to-slate-50 rounded-full flex items-center justify-center text-slate-300 shadow-inner border border-slate-200/50">
                                    <PhotoIcon className="h-10 w-10" />
                                </div>
                                <div>
                                    <p className="text-slate-800 font-bold mb-1">
                                        {products.length > 0
                                            ? 'Aucun résultat'
                                            : 'Catalogue vide'}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        {products.length > 0
                                            ? 'Ajustez la recherche ou les filtres.'
                                            : 'Ajoutez votre premier produit.'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate('/products/new')}
                                    className="mt-2 text-sm text-blue-600 font-bold hover:text-blue-700"
                                >
                                    + Nouveau produit
                                </button>
                            </motion.div>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                            <AnimatePresence mode="popLayout">
                                {paginatedProducts.map((product) => {
                                    const badge = stockBadge(product);
                                    return (
                                        <motion.div
                                            key={product.IDArt}
                                            layout
                                            variants={gridItemVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="hidden"
                                            whileHover={{ y: -4 }}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() =>
                                                navigate(`/products/${product.IDArt}`)
                                            }
                                            onKeyDown={(e) =>
                                                e.key === 'Enter' &&
                                                navigate(`/products/${product.IDArt}`)
                                            }
                                            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer text-left"
                                        >
                                            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 mb-3">
                                                {product.urlimg ? (
                                                    <img
                                                        src={getImageUrl(product.urlimg)}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <PhotoIcon className="h-12 w-12 text-slate-300" />
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider">
                                                {product.CodArt}
                                            </p>
                                            <h4 className="font-extrabold text-slate-900 text-sm line-clamp-2 mt-1">
                                                {product.LibArt}
                                            </h4>
                                            <div className="mt-3 flex items-center justify-between gap-2">
                                                <span className="text-sm font-black text-slate-900">
                                                    {formatCurrency(product.PrixVente || 0)}
                                                </span>
                                                <span
                                                    className={clsx(
                                                        'text-[10px] font-black uppercase px-2 py-1 rounded-lg border',
                                                        badge.className
                                                    )}
                                                >
                                                    {badge.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2 font-bold">
                                                Qté {product.Qte}
                                            </p>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/80 backdrop-blur-sm border-b border-slate-200/80 shadow-sm">
                                    <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-14">
                                        #
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                        Référence
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                        Produit
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                        Prix VT
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                        Stock
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                        État
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/80 bg-white">
                                <AnimatePresence>
                                    {paginatedProducts.map((product, idx) => {
                                        const badge = stockBadge(product);
                                        const cod = product.CodArt || '';
                                        const initials =
                                            cod.length >= 2
                                                ? cod.substring(0, 2).toUpperCase()
                                                : (cod || '?').toUpperCase();
                                        return (
                                            <motion.tr
                                                key={product.IDArt}
                                                variants={rowVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="exit"
                                                layout
                                                custom={idx}
                                                transition={{ delay: idx * 0.03 }}
                                                className="group hover:bg-blue-50/60 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500"
                                                onClick={() =>
                                                    navigate(`/products/${product.IDArt}`)
                                                }
                                            >
                                                <td className="px-8 py-4">
                                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg font-bold text-xs shadow-md shadow-blue-500/20">
                                                        {startIndex + idx + 1}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-[10px] font-black text-blue-700">
                                                                {initials}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                                                            {product.CodArt}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-3 max-w-md">
                                                        {product.urlimg ? (
                                                            <img
                                                                src={getImageUrl(product.urlimg)}
                                                                alt=""
                                                                className="w-11 h-11 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                                <PhotoIcon className="h-5 w-5 text-slate-400" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                                                                {product.LibArt}
                                                            </div>
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                                {product.Collection || '—'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <span className="text-sm font-black text-blue-600 tabular-nums">
                                                        {formatCurrency(product.PrixVente || 0)}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <span
                                                        className={clsx(
                                                            'text-sm font-black tabular-nums',
                                                            (Number(product.Qte) || 0) === 0
                                                                ? 'text-rose-600'
                                                                : (Number(product.Qte) || 0) <= 5
                                                                  ? 'text-amber-600'
                                                                  : 'text-emerald-600'
                                                        )}
                                                    >
                                                        {product.Qte}
                                                    </span>
                                                    <span className="block text-[9px] font-semibold text-slate-400 uppercase">
                                                        {product.Unite || ''}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <span
                                                        className={clsx(
                                                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border',
                                                            badge.className
                                                        )}
                                                    >
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(
                                                                    `/products/${product.IDArt}`
                                                                );
                                                            }}
                                                            className="p-2.5 text-slate-400 bg-white border border-slate-200 shadow-sm hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 rounded-xl transition-all"
                                                            title="Voir"
                                                        >
                                                            <EyeIcon className="h-4 w-4 stroke-[2.5]" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(
                                                                    `/products/edit/${product.IDArt}`
                                                                );
                                                            }}
                                                            className="p-2.5 text-slate-400 bg-white border border-slate-200 shadow-sm hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 rounded-xl transition-all"
                                                            title="Modifier"
                                                        >
                                                            <PencilSquareIcon className="h-4 w-4 stroke-[2.5]" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(product.IDArt);
                                                            }}
                                                            className="p-2.5 text-slate-400 bg-white border border-slate-200 shadow-sm hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 rounded-xl transition-all"
                                                            title="Supprimer"
                                                        >
                                                            <TrashIcon className="h-4 w-4 stroke-[2.5]" />
                                                        </button>
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

                {totalPages > 1 && totalItems > 0 && (
                    <div className="px-8 py-4 bg-slate-50/80 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <span className="text-xs font-medium text-slate-500">
                            Affichage {startIndex + 1} -{' '}
                            {Math.min(startIndex + itemsPerPage, totalItems)} sur {totalItems}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() =>
                                    setCurrentPage((p) => Math.max(1, p - 1))
                                }
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            >
                                Précédent
                            </button>
                            <div className="flex items-center gap-1 px-2">
                                {Array.from({ length: totalPages }).map((_, idx) => {
                                    const pageNumber = idx + 1;
                                    if (
                                        pageNumber === 1 ||
                                        pageNumber === totalPages ||
                                        (pageNumber >= currentPage - 1 &&
                                            pageNumber <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={pageNumber}
                                                type="button"
                                                onClick={() => setCurrentPage(pageNumber)}
                                                className={clsx(
                                                    'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors',
                                                    currentPage === pageNumber
                                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                                        : 'bg-transparent text-slate-600 hover:bg-slate-200'
                                                )}
                                            >
                                                {pageNumber}
                                            </button>
                                        );
                                    }
                                    if (
                                        pageNumber === currentPage - 2 ||
                                        pageNumber === currentPage + 2
                                    ) {
                                        return (
                                            <span
                                                key={`e-${pageNumber}`}
                                                className="text-slate-400 text-xs"
                                            >
                                                …
                                            </span>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                            <button
                                type="button"
                                disabled={currentPage === totalPages}
                                onClick={() =>
                                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                                }
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            >
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
