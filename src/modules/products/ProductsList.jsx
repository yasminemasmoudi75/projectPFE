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

const inputCls = 'w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0062AF]/10 focus:border-[#0062AF]/50 transition-all';

const TABS = [
    { id: 'catalogue',  label: 'Inventaire',       icon: CubeIcon },
    { id: 'parametres', label: 'Paramètres Stock',  icon: Cog6ToothIcon },
];

const ProductsList = () => {
    const navigate = useNavigate();
    const { isClient } = useAuth();
    const { canCreate, canEdit, canDelete } = usePermission(MODULE_CODES.STOCK);
    const [activeTab, setActiveTab] = useState('catalogue');

    const PAGE_SIZE = 20;
    const [bootstrapping, setBootstrapping] = useState(true);
    const [loadingMore, setLoadingMore]     = useState(false);
    const [products, setProducts]           = useState([]);
    const [totalCount, setTotalCount]       = useState(0);
    const [currentPage, setCurrentPage]     = useState(1);
    const [stockFilterMeta, setStockFilterMeta] = useState({
        all:     { id: 'all',     label: 'Tous',    count: 0, visible: true },
        ok:      { id: 'ok',      label: 'Dispo',   count: 0, visible: true },
        low:     { id: 'low',     label: 'Faible',  count: 0, visible: true },
        rupture: { id: 'rupture', label: 'Rupture', count: 0, visible: true },
    });
    const [searchTerm, setSearchTerm]   = useState('');
    const [viewMode, setViewMode]       = useState(isClient ? 'grid' : 'table');
    const [filters, setFilters]         = useState({ collection: '', price: '', stockStatus: 'all', marque: '' });
    const [showFilters, setShowFilters] = useState(false);
    const fetchProducts = useCallback(async (search = '') => {
        setBootstrapping(true);
        try {
            const apiData = await axios.get('/products', { params: { search, sort: 'recent', limit: 10000, page: 1 } }) || {};
            const productData = apiData?.data || [];
            setProducts(Array.isArray(productData) ? productData : []);
            setTotalCount(apiData?.pagination?.total || (Array.isArray(productData) ? productData.length : 0));
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

    useEffect(() => {
        setCurrentPage(1);
        const t = setTimeout(() => fetchProducts(searchTerm), 500);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        if (isClient) { setViewMode('grid'); setShowFilters(false); }
    }, [isClient]);

    const handleFilterChange = (key, value) => { setFilters(p => ({ ...p, [key]: value })); setCurrentPage(1); };
    const resetFilters = () => { setFilters({ collection: '', price: '', stockStatus: 'all', marque: '' }); setCurrentPage(1); };

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
        const price = p.PrixVente != null ? Number(p.PrixVente) : null;
        const s = searchTerm.toLowerCase();
        const matchSearch = !s || p.CodArt?.toLowerCase().includes(s) || p.LibArt?.toLowerCase().includes(s) || p.Marque?.toLowerCase().includes(s);
        const matchColl   = !filters.collection || p.Collection === filters.collection;
        const matchBrand  = !filters.marque     || p.Marque === filters.marque;
        const matchPrice  = filters.price === '' || (price !== null && price <= +filters.price);
        let matchStock = true;
        if (filters.stockStatus === 'ok')      matchStock = q > 5;
        else if (filters.stockStatus === 'low') matchStock = q > 0 && q <= 5;
        else if (filters.stockStatus === 'rupture') matchStock = q === 0;
        return matchSearch && matchColl && matchBrand && matchPrice && matchStock;
    }), [searchTerm, filters]);

    const filteredProducts  = useMemo(() => applyFilters(products), [applyFilters, products]);
    const totalPages        = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
    const pagedProducts     = useMemo(
        () => filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
        [filteredProducts, currentPage]
    );

    const goToPage = (p) => {
        const clamped = Math.max(1, Math.min(totalPages, p));
        setCurrentPage(clamped);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const activeAdvancedCount = [filters.collection, filters.price, filters.marque].filter(Boolean).length;
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
                            <tab.icon className={clsx('h-4 w-4', activeTab === tab.id ? 'text-[#0062AF]' : 'text-slate-400')} />
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

            {/* ── Hero Card ── */}
            <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
                {/* Accent top bar */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0062AF] via-sky-400 to-teal-400" />
                {/* Soft background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white to-teal-50/30 pointer-events-none" />
                {/* Decorative blob */}
                <div className="absolute -right-16 -top-16 w-48 h-48 bg-[#0062AF]/5 rounded-full blur-2xl pointer-events-none" />

                <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#0062AF] to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                            <CubeIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-slate-900">Catalogue Produits</h1>
                                {loadingMore && <ArrowPathIcon className="h-4 w-4 text-slate-400 animate-spin" />}
                            </div>
                            <p className="text-sm text-slate-400 font-medium mt-0.5">
                                Gérez vos références, prix et niveaux de stock
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => fetchProducts(searchTerm)}
                            disabled={loadingMore}
                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/80 border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-white hover:border-slate-300 transition-all shadow-sm disabled:opacity-50"
                            title="Actualiser"
                        >
                            <ArrowPathIcon className={clsx('h-4 w-4', loadingMore && 'animate-spin')} />
                        </button>

                        {!isClient && (
                            <div className="flex items-center gap-0.5 bg-slate-100 rounded-xl p-1">
                                {[{ id: 'table', icon: ListBulletIcon, label: 'Liste' }, { id: 'grid', icon: Squares2X2Icon, label: 'Grille' }].map(v => (
                                    <button key={v.id} onClick={() => setViewMode(v.id)}
                                        className={clsx(
                                            'inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-semibold transition-all',
                                            viewMode === v.id
                                                ? 'bg-white text-[#0062AF] shadow-sm border border-slate-200'
                                                : 'text-slate-500 hover:text-slate-700'
                                        )}>
                                        <v.icon className="h-3.5 w-3.5" /> {v.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {!isClient && (
                            <>
                                <button onClick={exportToCSV}
                                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white/80 border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-white hover:border-slate-300 transition-all shadow-sm">
                                    <ArrowDownTrayIcon className="h-4 w-4 text-emerald-500" /> CSV
                                </button>
                                <button onClick={exportToPDF}
                                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white/80 border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-white hover:border-slate-300 transition-all shadow-sm">
                                    <PrinterIcon className="h-4 w-4 text-rose-400" /> PDF
                                </button>
                            </>
                        )}

                        {!isClient && canCreate && (
                            <button onClick={() => navigate('/products/new')}
                                className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-[#0062AF] hover:bg-[#004a85] text-white text-sm font-semibold transition-all shadow-md shadow-blue-500/20 active:scale-95">
                                <PlusIcon className="h-4 w-4 stroke-[2.5]" /> Nouveau produit
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── KPI strip (admin only) ── */}
            {!isClient && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        {
                            label: 'Total produits', value: totalCount,
                            icon: CubeIcon,
                            accent: 'from-[#0062AF] to-sky-500',
                            bg: 'bg-blue-50', text: 'text-[#0062AF]',
                            sub: 'références'
                        },
                        {
                            label: 'Valeur stock', value: filteredValueTTC > 0 ? (filteredValueTTC / 1000).toFixed(1) + 'k' : '0',
                            icon: CurrencyDollarIcon,
                            accent: 'from-emerald-400 to-teal-500',
                            bg: 'bg-emerald-50', text: 'text-emerald-600',
                            sub: 'TND estimé'
                        },
                        {
                            label: 'Santé stock', value: stockHealthPct + '%',
                            icon: ShieldCheckIcon,
                            accent: 'from-sky-400 to-cyan-500',
                            bg: 'bg-sky-50', text: 'text-sky-600',
                            sub: 'disponible'
                        },
                        {
                            label: 'En rupture', value: ruptureCount,
                            icon: ArchiveBoxIcon,
                            accent: 'from-rose-400 to-red-500',
                            bg: 'bg-rose-50', text: 'text-rose-600',
                            sub: 'articles'
                        },
                    ].map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 28 }}
                            className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                        >
                            {/* Accent top line */}
                            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${s.accent}`} />
                            <div className="p-4 pt-5">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{s.label}</p>
                                        <p className={`text-2xl font-black leading-none tabular-nums ${s.text}`}>{s.value}</p>
                                        <p className="text-[11px] text-slate-400 mt-1 font-medium">{s.sub}</p>
                                    </div>
                                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-none ${s.bg} group-hover:scale-110 transition-transform`}>
                                        <s.icon className={`h-4 w-4 ${s.text}`} />
                                    </div>
                                </div>
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
                            className="w-full h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0062AF]/10 focus:border-[#0062AF]/50 transition-all" />
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
                                                : 'bg-[#0062AF] text-white border-[#0062AF]'
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
                                showFilters ? 'bg-blue-50 border-blue-200 text-[#0062AF]' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300')}>
                            <FunnelIcon className="h-3.5 w-3.5" /> Filtres
                            {activeAdvancedCount > 0 && (
                                <span className="h-4 w-4 bg-[#0062AF] text-white text-[9px] rounded-full flex items-center justify-center">{activeAdvancedCount}</span>
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
                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 block">Prix max (TND)</label>
                                    <input type="number" min="0" placeholder="∞" value={filters.price}
                                        onChange={e => handleFilterChange('price', e.target.value)} className={inputCls} />
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
                        {totalItems}{totalItems !== totalCount && <span className="text-slate-400 font-normal"> / {totalCount}</span>} article{totalItems !== 1 ? 's' : ''}
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
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                        <AnimatePresence mode="popLayout">
                            {pagedProducts.map((product, i) => {
                                const badge = stockBadge(product);
                                const showBadge = !isClient && stockFilterMeta?.[badge.key]?.visible !== false;
                                const hasImg = !!product.urlimg;
                                return (
                                    <motion.div
                                        key={product.IDArt}
                                        initial={{ opacity: 0, y: 14, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.97 }}
                                        transition={{ delay: i * 0.035, type: 'spring', stiffness: 280, damping: 26 }}
                                        onClick={() => navigate(`/products/${product.IDArt}`)}
                                        className="group rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg hover:border-[#0062AF]/20 hover:-translate-y-1 transition-all duration-250 cursor-pointer"
                                    >
                                        {/* Image area */}
                                        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100">
                                            {hasImg ? (
                                                <img
                                                    src={getImageUrl(product.urlimg)}
                                                    alt={product.LibArt}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                                    <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                                                        <CubeIcon className="h-7 w-7 text-slate-300" />
                                                    </div>
                                                    <span className="text-[10px] text-slate-300 font-medium">Pas d'image</span>
                                                </div>
                                            )}
                                            {/* Stock badge overlay */}
                                            {showBadge && (
                                                <div className="absolute top-3 right-3">
                                                    <span className={clsx(
                                                        'inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm',
                                                        badge.badge
                                                    )}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                                                        {badge.label}
                                                    </span>
                                                </div>
                                            )}
                                            {/* Gradient overlay on hover */}
                                            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>

                                        {/* Info */}
                                        <div className="p-4">
                                            {/* Code + collection */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-bold text-[#0062AF] bg-blue-50 px-2 py-0.5 rounded-md font-mono tracking-wide">
                                                    {product.CodArt}
                                                </span>
                                                {product.Collection && (
                                                    <span className="text-[10px] text-slate-400 font-medium truncate">
                                                        {product.Collection}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Name */}
                                            <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-[#0062AF] transition-colors mb-3">
                                                {product.LibArt}
                                            </h4>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                                <div>
                                                    <span className="text-base font-black text-slate-900 tabular-nums">
                                                        {formatCurrency(product.PrixVente || 0).replace(' TND', '')}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 ml-1 font-medium">TND</span>
                                                </div>
                                                {!isClient && (
                                                    <span className={clsx(
                                                        'text-[10px] font-semibold tabular-nums',
                                                        (Number(product.Qte) || 0) === 0 ? 'text-rose-500' :
                                                        (Number(product.Qte) || 0) <= 5 ? 'text-amber-600' : 'text-emerald-600'
                                                    )}>
                                                        {product.Qte ?? 0} {product.Unite || 'u.'}
                                                    </span>
                                                )}
                                            </div>
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
                                    {pagedProducts.map((product, idx) => {
                                        const badge = stockBadge(product);
                                        const showBadge = stockFilterMeta?.[badge.key]?.visible !== false;
                                        return (
                                            <motion.tr key={product.IDArt}
                                                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2, delay: idx * 0.03 }}
                                                onClick={() => navigate(`/products/${product.IDArt}`)}
                                                className="group hover:bg-blue-50/30 transition-colors cursor-pointer">
                                                <td className="px-5 py-3.5">
                                                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold">
                                                        {idx + 1}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="text-xs font-bold text-slate-600 font-mono group-hover:text-[#0062AF] transition-colors">{product.CodArt}</span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-none relative">
                                                            {product.urlimg ? (
                                                                <>
                                                                    <img src={getImageUrl(product.urlimg)} alt="" className="w-full h-full object-cover"
                                                                        onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }} />
                                                                    <div className="w-full h-full items-center justify-center absolute inset-0" style={{ display: 'none' }}>
                                                                        <PhotoIcon className="h-4 w-4 text-slate-300" />
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center"><PhotoIcon className="h-4 w-4 text-slate-300" /></div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-700 group-hover:text-[#0062AF] transition-colors line-clamp-1">{product.LibArt}</p>
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
                                                            className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-[#0062AF] hover:border-blue-200 hover:bg-blue-50 transition-all">
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
                        Page {currentPage} / {totalPages} · {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-1">
                        <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}
                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-all text-xs font-bold">
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
                                <button key={p} onClick={() => goToPage(p)}
                                    className={clsx('h-8 w-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all',
                                        p === currentPage ? 'bg-[#0062AF] text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50')}>
                                    {p}
                                </button>
                            );
                        })}
                        <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}
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
