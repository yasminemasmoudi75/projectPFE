import { useState, useEffect, useMemo, useCallback } from 'react';
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
    CurrencyDollarIcon,
    ArrowDownTrayIcon,
    PrinterIcon,
    ShieldCheckIcon,
    CubeIcon,
    Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import StockConfigPage from '../admin/StockConfigPage';
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

/* ── Stock badge config ── */
const STOCK_CFG = {
    ok:      { label: 'Dispo',   badge: 'bg-emerald-50 text-emerald-600 border border-emerald-200', dot: 'bg-emerald-400' },
    low:     { label: 'Faible',  badge: 'bg-amber-50 text-amber-600 border border-amber-200',       dot: 'bg-amber-400'   },
    rupture: { label: 'Rupture', badge: 'bg-rose-50 text-rose-600 border border-rose-200',           dot: 'bg-rose-400'    },
};

const stockBadge = (product) => {
    const q = Number(product.Qte) || 0;
    if (q === 0)  return { key: 'rupture', ...STOCK_CFG.rupture };
    if (q <= 5)   return { key: 'low',     ...STOCK_CFG.low     };
    return              { key: 'ok',      ...STOCK_CFG.ok      };
};

const inputCls = 'w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all';

const TABS = [
    { id: 'catalogue',  label: 'Inventaire',       icon: CubeIcon },
    { id: 'parametres', label: 'Paramètres Stock',  icon: Cog6ToothIcon },
];

const ProductsList = () => {
    const navigate = useNavigate();
    const { isClient } = useAuth();
    const { canCreate, canEdit, canDelete } = usePermission(MODULE_CODES.STOCK);
    const [activeTab, setActiveTab] = useState('catalogue');

    const [bootstrapping, setBootstrapping] = useState(true);
    const [loadingMore, setLoadingMore]     = useState(false);
    const [products, setProducts]           = useState([]);
    const [page, setPage]                   = useState(1);
    const [totalPages, setTotalPages]       = useState(1);
    const [totalCount, setTotalCount]       = useState(0);
    const [stockFilterMeta, setStockFilterMeta] = useState({
        all:     { id: 'all',     label: 'Tous',    count: 0, visible: true },
        ok:      { id: 'ok',      label: 'Dispo',   count: 0, visible: true },
        low:     { id: 'low',     label: 'Faible',  count: 0, visible: true },
        rupture: { id: 'rupture', label: 'Rupture', count: 0, visible: true },
    });
    const [searchTerm, setSearchTerm]   = useState('');
    const [viewMode, setViewMode]       = useState(isClient ? 'grid' : 'table');
    const [filters, setFilters]         = useState({ collection: '', priceMin: '', priceMax: '', stockStatus: 'all', marque: '' });
    const [showFilters, setShowFilters] = useState(false);
    const LIMIT = 20;

    const fetchProducts = useCallback(async (search = '', pageNum = 1) => {
        if (pageNum === 1) setBootstrapping(true);
        else setLoadingMore(true);
        try {
            const apiData = await axios.get('/products', { params: { search, sort: 'recent', limit: LIMIT, page: pageNum } }) || {};
            const productData = apiData?.data || [];
            setProducts(Array.isArray(productData) ? productData : []);
            setTotalPages(apiData?.pagination?.pages || Math.ceil((apiData?.pagination?.total || 0) / LIMIT) || 1);
            setTotalCount(apiData?.pagination?.total || 0);
            if (apiData?.meta?.stockFilters) {
                setStockFilterMeta(apiData.meta.stockFilters);
                const selected = apiData.meta.stockFilters?.[filters.stockStatus];
                if (selected?.visible === false) setFilters(p => ({ ...p, stockStatus: 'all' }));
            }
        } catch (err) {
            console.error('[ProductsList] fetchProducts error:', err?.response?.status, err?.response?.data || err?.message);
        }
        finally { setBootstrapping(false); setLoadingMore(false); }
    }, [filters.stockStatus]);

    // Reset to page 1 on search change
    useEffect(() => {
        setPage(1);
        const t = setTimeout(() => fetchProducts(searchTerm, 1), 500);
        return () => clearTimeout(t);
    }, [searchTerm]);

    // Fetch when page changes
    useEffect(() => {
        if (page === 1) return;
        fetchProducts(searchTerm, page);
    }, [page]);

    const goToPage = (p) => {
        const clamped = Math.max(1, Math.min(totalPages, p));
        setPage(clamped);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        if (isClient) { setViewMode('grid'); setShowFilters(false); }
    }, [isClient]);

    const handleFilterChange = (key, value) => setFilters(p => ({ ...p, [key]: value }));
    const resetFilters = () => setFilters({ collection: '', priceMin: '', priceMax: '', stockStatus: 'all', marque: '' });

    const exportToCSV = async () => {
        const toastId = toast.loading('Chargement de tous les produits…');
        try {
            const apiData = await axios.get('/products', { params: { search: searchTerm, sort: 'recent', limit: 10000, page: 1 } }) || {};
            const allProducts = applyFilters(Array.isArray(apiData?.data) ? apiData.data : []);
            toast.dismiss(toastId);
            const headers = isClient ? ['Code', 'Libelle', 'Marque', 'Prix'] : ['Code', 'Libelle', 'Marque', 'Prix', 'Stock'];
            const rows = allProducts.map(p => isClient
                ? [p.CodArt || '', p.LibArt || '', p.Marque || '', p.PrixVente || 0]
                : [p.CodArt || '', p.LibArt || '', p.Marque || '', p.PrixVente || 0, p.Qte || 0]
            );
            const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `produits_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            toast.success(`Export CSV réussi · ${allProducts.length} produits`);
        } catch {
            toast.dismiss(toastId);
            toast.error('Erreur lors de l\'export CSV');
        }
    };

    const exportToPDF = async () => {
        const toastId = toast.loading('Chargement de tous les produits…');
        try {
            const apiData = await axios.get('/products', { params: { search: searchTerm, sort: 'recent', limit: 10000, page: 1 } }) || {};
            const allProducts = applyFilters(Array.isArray(apiData?.data) ? apiData.data : []);
            toast.dismiss(toastId);
            const printWindow = window.open('', '_blank');
            const html = `<html><head><title>Produits</title>
              <style>body{font-family:Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #e2e8f0;padding:10px;text-align:left}th{background:#f8fafc;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#64748b}tr:nth-child(even){background:#f8fafc}</style>
              </head><body>
              <h2 style="color:#1e293b;margin-bottom:4px">Liste des Produits</h2>
              <p style="color:#94a3b8;font-size:12px;margin-bottom:20px">Exporté le ${new Date().toLocaleDateString('fr-FR')} · ${allProducts.length} produits</p>
              <table><thead><tr><th>Code</th><th>Désignation</th><th>Marque</th><th>Prix</th>${isClient ? '' : '<th>Stock</th>'}</tr></thead>
              <tbody>${allProducts.map(p => `<tr><td>${p.CodArt || '-'}</td><td>${p.LibArt || '-'}</td><td>${p.Marque || '-'}</td><td>${(p.PrixVente || 0).toFixed(2)} TND</td>${isClient ? '' : `<td>${p.Qte || 0}</td>`}</tr>`).join('')}</tbody>
              </table></body></html>`;
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.print();
        } catch {
            toast.dismiss(toastId);
            toast.error('Erreur lors de l\'export PDF');
        }
    };

    const handleDelete = async (id) => {
        if (isClient || !canDelete) return;
        if (!window.confirm('Supprimer ce produit ?')) return;
        try {
            await axios.delete(`/products/${id}`);
            setProducts(p => p.filter(x => x.IDArt !== id));
            toast.success('Produit supprimé');
        } catch { toast.error('Erreur lors de la suppression'); }
    };

    const applyFilters = useCallback((list) => list.filter(p => {
        const q = Number(p.Qte) || 0;
        const price = Number(p.PrixVente) || 0;
        const s = searchTerm.toLowerCase();
        const matchSearch = !s || p.CodArt?.toLowerCase().includes(s) || p.LibArt?.toLowerCase().includes(s) || p.Marque?.toLowerCase().includes(s);
        const matchColl   = !filters.collection || p.Collection === filters.collection;
        const matchBrand  = !filters.marque     || p.Marque === filters.marque;
        const matchPrice  = price >= (filters.priceMin === '' ? 0 : +filters.priceMin) && price <= (filters.priceMax === '' ? Infinity : +filters.priceMax);
        let matchStock = true;
        if (filters.stockStatus === 'ok')      matchStock = q > 5;
        else if (filters.stockStatus === 'low') matchStock = q > 0 && q <= 5;
        else if (filters.stockStatus === 'rupture') matchStock = q === 0;
        return matchSearch && matchColl && matchBrand && matchPrice && matchStock;
    }), [searchTerm, filters]);

    const filteredProducts = useMemo(() => applyFilters(products), [applyFilters, products]);

    const activeAdvancedCount = [filters.collection, filters.priceMin, filters.priceMax, filters.marque].filter(Boolean).length;
    const filteredValueTTC    = useMemo(() => filteredProducts.reduce((a, p) => a + (Number(p.PrixVente) || 0) * (Number(p.Qte) || 0), 0), [filteredProducts]);
    const stockHealthPct      = useMemo(() => filteredProducts.length ? +((filteredProducts.filter(p => (Number(p.Qte) || 0) > 5).length / filteredProducts.length) * 100).toFixed(1) : 0, [filteredProducts]);
    const ruptureCount        = useMemo(() => filteredProducts.filter(p => (Number(p.Qte) || 0) === 0).length, [filteredProducts]);

    const uniqueCollections = useMemo(() => [...new Set(products.map(p => p.Collection).filter(Boolean))], [products]);
    const uniqueMarques     = useMemo(() => [...new Set(products.map(p => p.Marque).filter(Boolean))], [products]);

    const totalItems = filteredProducts.length;

    if (bootstrapping && products.length === 0) return <LoadingSpinner />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
            className="space-y-5 pb-12">

            {/* ── Tabs ── */}
            {!isClient && (
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm w-fit">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                                activeTab === tab.id
                                    ? 'bg-white border border-slate-200 text-slate-700 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                            )}
                        >
                            <tab.icon className={clsx('h-4 w-4', activeTab === tab.id ? 'text-indigo-500' : 'text-slate-400')} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Paramètres Stock tab ── */}
            {activeTab === 'parametres' && !isClient && (
                <StockConfigPage />
            )}

            {/* ── Catalogue tab ── */}
            {(activeTab === 'catalogue' || isClient) && (
            <>

            {/* ── Top bar ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-7 w-7 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                            <CubeIcon className="h-4 w-4 text-indigo-500" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800">Catalogue Produits</h1>
                        {loadingMore && <ArrowPathIcon className="h-4 w-4 text-slate-400 animate-spin" />}
                    </div>
                    <p className="text-xs text-slate-400 font-medium pl-9">Références, prix et stocks</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => { setPage(1); fetchProducts(searchTerm, 1); }} disabled={loadingMore}
                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
                        title="Actualiser">
                        <ArrowPathIcon className={clsx('h-4 w-4', loadingMore && 'animate-spin')} />
                    </button>

                    {!isClient && (
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                            {[{ id: 'table', icon: ListBulletIcon, label: 'Liste' }, { id: 'grid', icon: Squares2X2Icon, label: 'Grille' }].map(v => (
                                <button key={v.id} onClick={() => setViewMode(v.id)}
                                    className={clsx('inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-semibold transition-all', viewMode === v.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                                    <v.icon className="h-3.5 w-3.5" /> {v.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {!isClient && (
                        <>
                            <button onClick={exportToCSV}
                                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-slate-50 transition-all shadow-sm">
                                <ArrowDownTrayIcon className="h-4 w-4" /> CSV
                            </button>
                            <button onClick={exportToPDF}
                                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-slate-50 transition-all shadow-sm">
                                <PrinterIcon className="h-4 w-4" /> PDF
                            </button>
                        </>
                    )}

                    {!isClient && canCreate && (
                        <button onClick={() => navigate('/products/new')}
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-all shadow-sm">
                            <PlusIcon className="h-4 w-4" /> Nouveau produit
                        </button>
                    )}
                </div>
            </div>

            {/* ── KPI strip (admin only) ── */}
            {!isClient && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total produits',   value: totalCount,                                         icon: CubeIcon,           iconCls: 'text-indigo-500',  iconBg: 'bg-indigo-50 border-indigo-200'   },
                        { label: 'Valeur stock',      value: filteredValueTTC > 0 ? (filteredValueTTC / 1000).toFixed(1) + 'k TND' : '0 TND', icon: CurrencyDollarIcon, iconCls: 'text-emerald-500', iconBg: 'bg-emerald-50 border-emerald-200' },
                        { label: 'Santé stock',       value: stockHealthPct + '%',                               icon: ShieldCheckIcon,    iconCls: 'text-sky-500',     iconBg: 'bg-sky-50 border-sky-200'         },
                        { label: 'En rupture',        value: ruptureCount,                                       icon: ArchiveBoxIcon,     iconCls: 'text-rose-500',    iconBg: 'bg-rose-50 border-rose-200'       },
                    ].map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                            <div className={`h-9 w-9 rounded-xl border flex items-center justify-center flex-none ${s.iconBg}`}>
                                <s.icon className={`h-4 w-4 ${s.iconCls}`} />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{s.label}</p>
                                <p className="text-xl font-bold text-slate-700 leading-tight tabular-nums">{s.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ── Toolbar ── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {/* Search */}
                    <div className="relative flex-1 w-full">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input type="text" placeholder="Référence, désignation, marque…"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all" />
                    </div>

                    {/* Stock pills */}
                    {!isClient && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {[
                                { id: 'all',     label: 'Tous' },
                                { id: 'ok',      label: 'Dispo' },
                                { id: 'low',     label: 'Faible' },
                                { id: 'rupture', label: 'Rupture' },
                            ].filter(s => stockFilterMeta?.[s.id]?.visible !== false).map(s => {
                                const active = filters.stockStatus === s.id;
                                return (
                                    <button key={s.id} type="button"
                                        onClick={() => handleFilterChange('stockStatus', s.id)}
                                        className={clsx(
                                            'h-8 px-3 rounded-full text-xs font-semibold border transition-all',
                                            active
                                                ? s.id === 'ok'      ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                                                : s.id === 'low'     ? 'bg-amber-50 text-amber-600 border-amber-300'
                                                : s.id === 'rupture' ? 'bg-rose-50 text-rose-600 border-rose-300'
                                                : 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        )}>
                                        {stockFilterMeta?.[s.id]?.label || s.label}
                                        <span className="ml-1.5 opacity-60">{stockFilterMeta?.[s.id]?.count ?? 0}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Advanced filters toggle */}
                    {!isClient && (
                        <button type="button" onClick={() => setShowFilters(!showFilters)}
                            className={clsx('inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border text-xs font-semibold transition-all flex-none',
                                showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300')}>
                            <FunnelIcon className="h-3.5 w-3.5" /> Filtres
                            {activeAdvancedCount > 0 && (
                                <span className="h-4 w-4 bg-indigo-600 text-white text-[9px] rounded-full flex items-center justify-center">{activeAdvancedCount}</span>
                            )}
                        </button>
                    )}
                </div>

                {/* Advanced filters panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 block">Collection</label>
                                    <select value={filters.collection} onChange={e => handleFilterChange('collection', e.target.value)} className={inputCls}>
                                        <option value="">Toutes</option>
                                        {uniqueCollections.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 block">Marque</label>
                                    <select value={filters.marque} onChange={e => handleFilterChange('marque', e.target.value)} className={inputCls}>
                                        <option value="">Toutes</option>
                                        {uniqueMarques.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 block">Prix min</label>
                                    <input type="number" min="0" placeholder="0" value={filters.priceMin}
                                        onChange={e => handleFilterChange('priceMin', e.target.value)} className={inputCls} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 block">Prix max</label>
                                    <input type="number" min="0" placeholder="∞" value={filters.priceMax}
                                        onChange={e => handleFilterChange('priceMax', e.target.value)} className={inputCls} />
                                </div>
                            </div>
                            <div className="flex justify-end mt-3">
                                <button type="button" onClick={resetFilters}
                                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-500 hover:bg-slate-50 transition-all">
                                    <XMarkIcon className="h-3.5 w-3.5" /> Réinitialiser
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Product list/grid ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Table header */}
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ArchiveBoxIcon className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Catalogue</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs font-semibold">
                        {totalCount} article{totalCount !== 1 ? 's' : ''}
                    </span>
                </div>

                {totalItems === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                            <PhotoIcon className="h-7 w-7 text-slate-300" />
                        </div>
                        <p className="text-sm font-semibold text-slate-500">
                            {products.length > 0 ? 'Aucun résultat' : 'Catalogue vide'}
                        </p>
                        <p className="text-xs text-slate-400">
                            {products.length > 0 ? 'Ajustez la recherche ou les filtres' : 'Ajoutez votre premier produit'}
                        </p>
                    </div>

                ) : viewMode === 'grid' ? (
                    /* ── Grid view ── */
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        <AnimatePresence mode="popLayout">
                            {filteredProducts.map((product, i) => {
                                const badge = stockBadge(product);
                                const showBadge = stockFilterMeta?.[badge.key]?.visible !== false;
                                return (
                                    <motion.div key={product.IDArt}
                                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        onClick={() => navigate(`/products/${product.IDArt}`)}
                                        className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                                        {/* Image */}
                                        <div className="aspect-[4/3] bg-slate-50 overflow-hidden border-b border-slate-100">
                                            {product.urlimg ? (
                                                <img src={getImageUrl(product.urlimg)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <PhotoIcon className="h-10 w-10 text-slate-300" />
                                                </div>
                                            )}
                                        </div>
                                        {/* Info */}
                                        <div className="p-3.5">
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">{product.CodArt}</p>
                                            <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">{product.LibArt}</h4>
                                            <div className="mt-3 flex items-center justify-between gap-2">
                                                <span className="text-sm font-bold text-slate-800 tabular-nums">{formatCurrency(product.PrixVente || 0)}</span>
                                                {!isClient && showBadge && (
                                                    <span className={clsx('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full', badge.badge)}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                                                        {badge.label}
                                                    </span>
                                                )}
                                            </div>
                                            {!isClient && (
                                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Qté : {product.Qte ?? '—'}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                ) : (
                    /* ── Table view ── */
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-left w-12">#</th>
                                    <th className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-left">Référence</th>
                                    <th className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-left">Produit</th>
                                    <th className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">Prix</th>
                                    {!isClient && (
                                        <>
                                            <th className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">Stock</th>
                                            <th className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-left">État</th>
                                        </>
                                    )}
                                    <th className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <AnimatePresence>
                                    {filteredProducts.map((product, idx) => {
                                        const badge = stockBadge(product);
                                        const showBadge = stockFilterMeta?.[badge.key]?.visible !== false;
                                        return (
                                            <motion.tr key={product.IDArt}
                                                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2, delay: idx * 0.03 }}
                                                onClick={() => navigate(`/products/${product.IDArt}`)}
                                                className="group hover:bg-indigo-50/40 transition-colors cursor-pointer">
                                                <td className="px-5 py-3.5">
                                                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold">
                                                        {idx + 1}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="text-xs font-bold text-slate-600 font-mono group-hover:text-indigo-600 transition-colors">{product.CodArt}</span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-none">
                                                            {product.urlimg
                                                                ? <img src={getImageUrl(product.urlimg)} alt="" className="w-full h-full object-cover" />
                                                                : <div className="w-full h-full flex items-center justify-center"><PhotoIcon className="h-4 w-4 text-slate-300" /></div>
                                                            }
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors line-clamp-1">{product.LibArt}</p>
                                                            {product.Collection && <p className="text-[10px] text-slate-400">{product.Collection}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <span className="text-sm font-bold text-slate-700 tabular-nums">{formatCurrency(product.PrixVente || 0)}</span>
                                                </td>
                                                {!isClient && (
                                                    <>
                                                        <td className="px-5 py-3.5 text-right">
                                                            <span className={clsx('text-sm font-semibold tabular-nums',
                                                                (Number(product.Qte) || 0) === 0 ? 'text-rose-500' :
                                                                (Number(product.Qte) || 0) <= 5 ? 'text-amber-600' : 'text-emerald-600')}>
                                                                {product.Qte ?? '—'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            {showBadge ? (
                                                                <span className={clsx('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full', badge.badge)}>
                                                                    <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                                                                    {badge.label}
                                                                </span>
                                                            ) : <span className="text-xs text-slate-300">—</span>}
                                                        </td>
                                                    </>
                                                )}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button type="button" onClick={e => { e.stopPropagation(); navigate(`/products/${product.IDArt}`); }}
                                                            className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all">
                                                            <EyeIcon className="h-3.5 w-3.5" />
                                                        </button>
                                                        {!isClient && canEdit && (
                                                            <button type="button" onClick={e => { e.stopPropagation(); navigate(`/products/edit/${product.IDArt}`); }}
                                                                className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-all">
                                                                <PencilSquareIcon className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                        {!isClient && canDelete && (
                                                            <button type="button" onClick={e => { e.stopPropagation(); handleDelete(product.IDArt); }}
                                                                className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all">
                                                                <TrashIcon className="h-3.5 w-3.5" />
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
                    </div>
                )}

            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-xs text-slate-400">
                        Page {page} / {totalPages} · {totalCount} produits
                    </p>
                    <div className="flex items-center gap-1">
                        <button onClick={() => goToPage(page - 1)} disabled={page <= 1}
                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-all text-xs font-bold">
                            ‹
                        </button>
                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                            let p;
                            if (totalPages <= 7) p = i + 1;
                            else if (page <= 4) p = i + 1;
                            else if (page >= totalPages - 3) p = totalPages - 6 + i;
                            else p = page - 3 + i;
                            if (p < 1 || p > totalPages) return null;
                            return (
                                <button key={p} onClick={() => goToPage(p)}
                                    className={clsx('h-8 w-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all',
                                        p === page ? 'bg-indigo-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50')}>
                                    {p}
                                </button>
                            );
                        })}
                        <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages}
                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-all text-xs font-bold">
                            ›
                        </button>
                    </div>
                </div>
            )}

            </>
            )}

        </motion.div>
    );
};

export default ProductsList;
