import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon, PencilSquareIcon, ArchiveBoxIcon, TagIcon,
    CurrencyDollarIcon, PhotoIcon, CubeIcon, BuildingStorefrontIcon,
    SwatchIcon, ScaleIcon, CalendarIcon,
    HashtagIcon, ChartBarIcon, ShoppingCartIcon, CheckCircleIcon,
    ExclamationTriangleIcon, XCircleIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import axios from '../../app/axios';
import { getImageUrl } from '../../utils/imageUrl';
import useAuth from '../../hooks/useAuth';

/* ── helpers ── */
const num     = (v, fb = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
const fmtNum  = (v, d = 3)  => num(v).toLocaleString('fr-TN', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtInt  = (v)          => num(v).toLocaleString('fr-TN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDate = (v) => {
    if (!v) return '—';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

/* ── stock ── */
const getStock = (qte, minStk) => {
    if (qte <= 0)      return { label: 'Rupture',       Icon: XCircleIcon,            cls: 'text-red-500 bg-red-50 border-red-200',           dot: 'bg-red-400',     bar: 'from-red-400 to-red-500',         pct: 0 };
    if (qte <= minStk) return { label: 'Stock faible',  Icon: ExclamationTriangleIcon, cls: 'text-amber-600 bg-amber-50 border-amber-200',      dot: 'bg-amber-400',   bar: 'from-amber-400 to-orange-400',    pct: Math.min(55, Math.round((qte / Math.max(minStk, 1)) * 55)) };
    return                    { label: 'En stock',       Icon: CheckCircleIcon,         cls: 'text-emerald-600 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-400', bar: 'from-emerald-400 to-teal-400',    pct: 100 };
};

/* ── PriceCard ── */
const PriceCard = ({ icon: Icon, label, value, sub, primary }) => (
    <div className={`rounded-2xl border p-5 flex flex-col gap-1.5 ${primary
        ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-200'
        : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-sm transition-all'}`}>
        <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${primary ? 'text-blue-200' : 'text-slate-400'}`}>{label}</span>
            <span className={`h-7 w-7 rounded-lg flex items-center justify-center ${primary ? 'bg-white/15' : 'bg-slate-50 border border-slate-200'}`}>
                <Icon className={`h-3.5 w-3.5 ${primary ? 'text-white' : 'text-slate-400'}`} />
            </span>
        </div>
        <p className={`text-xl font-black tabular-nums leading-none ${primary ? 'text-white' : 'text-slate-800'}`}>{value}</p>
        {sub && <p className={`text-[11px] font-medium mt-0.5 ${primary ? 'text-blue-200' : 'text-slate-400'}`}>{sub}</p>}
    </div>
);

/* ── InfoRow ── */
const InfoRow = ({ label, value, mono, accent }) => (
    <div className="flex items-center justify-between gap-8 py-3 px-4 odd:bg-slate-50/50 rounded-xl">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex-none">{label}</span>
        <span className={`text-xs font-semibold text-right ${mono ? 'font-mono' : ''} ${accent ? 'text-blue-600' : 'text-slate-700'}`}>
            {value || '—'}
        </span>
    </div>
);

/* ── Card ── */
const Card = ({ icon: Icon, title, accent, children }) => (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${accent ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
            {Icon && (
                <span className={`h-6 w-6 rounded-lg flex items-center justify-center ${accent ? 'bg-blue-100' : 'bg-slate-100'}`}>
                    <Icon className={`h-3.5 w-3.5 ${accent ? 'text-blue-600' : 'text-slate-500'}`} />
                </span>
            )}
            <span className={`text-[11px] font-bold uppercase tracking-widest ${accent ? 'text-blue-700' : 'text-slate-500'}`}>{title}</span>
        </div>
        <div className="p-2">{children}</div>
    </div>
);

/* ── Tag ── */
const Tag = ({ label, color = 'slate' }) => {
    const c = { blue: 'bg-blue-50 text-blue-700 border-blue-200', slate: 'bg-slate-100 text-slate-600 border-slate-200', sky: 'bg-sky-50 text-sky-700 border-sky-200' };
    return <span className={`inline-flex items-center h-6 px-3 rounded-full text-[11px] font-semibold border ${c[color]}`}>{label}</span>;
};

/* ── Main ── */
const ProductDetail = () => {
    const { id }     = useParams();
    const navigate   = useNavigate();
    const { isClient } = useAuth();

    const [loading, setLoading]     = useState(true);
    const [product, setProduct]     = useState(null);
    const [variants, setVariants]   = useState([]);
    const [activeTab, setActiveTab] = useState('details');
    const [imgErr, setImgErr]       = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [pRes, vRes] = await Promise.all([
                    axios.get(`/products/${id}`),
                    axios.get(`/products/${id}/variants`).catch(() => null),
                ]);
                setProduct(pRes?.data?.data || pRes?.data || {});
                const rows = vRes?.data || vRes || [];
                setVariants(Array.isArray(rows) ? rows : []);
            } catch {
                toast.error('Impossible de charger le produit');
                navigate('/products');
            } finally { setLoading(false); }
        })();
    }, [id, navigate]);

    if (loading) return <LoadingSpinner />;
    if (!product) return null;

    const qte      = num(product.Qte);
    const minStk   = num(product.MinStk);
    const marge    = num(product.PrixVente) - num(product.PrixAchat);
    const margePct = num(product.PrixVente) > 0 ? ((marge / num(product.PrixVente)) * 100).toFixed(1) : '0';
    const stock    = getStock(qte, minStk);

    const TABS = [
        { id: 'details',  label: 'Informations', icon: TagIcon },
        { id: 'variants', label: 'Variantes',    icon: SwatchIcon, count: variants.length },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}
            className="space-y-4 pb-16 max-w-6xl mx-auto">

            {/* ── Nav bar ── */}
            <div className="flex items-center justify-between">
                <button onClick={() => navigate('/products')}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeftIcon className="h-4 w-4" /> Produits
                </button>
                {!isClient && (
                    <button onClick={() => navigate(`/products/edit/${id}`)}
                        className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shadow-md shadow-blue-200 active:scale-95">
                        <PencilSquareIcon className="h-4 w-4" /> Modifier
                    </button>
                )}
            </div>

            {/* ══════════════ HERO ══════════════ */}
            <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-md">
                {/* Blue gradient header */}
                <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 px-8 pt-8 pb-0 flex gap-8 items-end">
                    {/* decorative circle */}
                    <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                    <div className="absolute bottom-0 left-32 w-40 h-40 rounded-full bg-white/5 translate-y-1/2 pointer-events-none" />

                    {/* Image card floating up from the bottom */}
                    <div className="relative flex-none w-44 h-44 rounded-2xl bg-white border-4 border-white shadow-xl overflow-hidden flex items-center justify-center translate-y-6 z-10">
                        {product.urlimg && !imgErr ? (
                            <motion.img initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4 }}
                                src={getImageUrl(product.urlimg)} alt={product.LibArt}
                                onError={() => setImgErr(true)}
                                className="w-full h-full object-contain p-2" />
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <PhotoIcon className="h-12 w-12 text-slate-300" />
                                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Aucune image</span>
                            </div>
                        )}
                    </div>

                    {/* Text content */}
                    <div className="pb-8 flex-1 min-w-0 space-y-3">
                        {/* chips row */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 h-6 px-3 rounded-lg bg-white/20 text-white text-[10px] font-bold font-mono">
                                <HashtagIcon className="h-3 w-3 opacity-70" />{product.CodArt}
                            </span>
                            {product.Collection && <span className="inline-flex items-center h-6 px-3 rounded-full bg-white/15 text-white text-[10px] font-semibold">{product.Collection}</span>}
                            {product.Marque     && <span className="inline-flex items-center h-6 px-3 rounded-full bg-white/10 text-blue-100 text-[10px] font-semibold">{product.Marque}</span>}
                            {!isClient && (
                                <span className={`inline-flex items-center gap-1.5 h-6 px-3 rounded-full text-[10px] font-bold border ${stock.cls} ml-auto`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${stock.dot} animate-pulse`} />
                                    {stock.label}
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl font-black text-white leading-tight">{product.LibArt || '—'}</h1>
                        {product.Description && (
                            <p className="text-sm text-blue-100 leading-relaxed line-clamp-2 max-w-xl">{product.Description}</p>
                        )}
                        {/* meta tags */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            {product.LibFam  && <span className="inline-flex items-center gap-1 text-[11px] text-blue-200"><CubeIcon className="h-3.5 w-3.5" />{product.LibFam}</span>}
                            {product.LibFour && <span className="inline-flex items-center gap-1 text-[11px] text-blue-200"><BuildingStorefrontIcon className="h-3.5 w-3.5" />{product.LibFour}</span>}
                            {product.Unite   && <span className="inline-flex items-center gap-1 text-[11px] text-blue-200"><ScaleIcon className="h-3.5 w-3.5" />{product.Unite}</span>}
                            {!isClient && qte > 0 && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white"><ArchiveBoxIcon className="h-3.5 w-3.5" />{fmtInt(qte)} en stock</span>}
                        </div>
                    </div>
                </div>

                {/* White bottom: pricing grid */}
                <div className="bg-white px-8 pt-10 pb-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <PriceCard icon={CurrencyDollarIcon} label="Prix vente HT" value={`${fmtNum(product.PrixVente)} TND`} primary />
                        <PriceCard icon={ShoppingCartIcon}   label="Prix achat HT" value={`${fmtNum(product.PrixAchat)} TND`} />
                        <PriceCard icon={TagIcon}            label="TVA"           value={`${num(product.Tva, 0).toLocaleString('fr-TN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`} />
                        {!isClient
                            ? <PriceCard icon={ChartBarIcon} label="Marge brute" value={`${marge >= 0 ? '+' : ''}${fmtNum(marge, 2)} TND`} sub={`${margePct}% du prix de vente`} />
                            : <PriceCard icon={CubeIcon}     label="Famille"     value={product.LibFam || '—'} />
                        }
                    </div>
                </div>
            </div>

            {/* ── Stock bar (admin) ── */}
            {!isClient && (
                <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <span className={`h-9 w-9 rounded-xl flex items-center justify-center border ${stock.cls}`}>
                                <stock.Icon className="h-4.5 w-4.5" style={{ height: '1.1rem', width: '1.1rem' }} />
                            </span>
                            <div>
                                <p className="text-sm font-bold text-slate-700">{stock.label}</p>
                                <p className="text-[11px] text-slate-400">Seuil min. : <span className="font-semibold text-slate-600">{fmtInt(minStk)}</span> {product.Unite || 'u.'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-black text-slate-800 tabular-nums leading-none">{fmtInt(qte)}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{product.Unite || 'unités'} disponibles</p>
                        </div>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${stock.pct}%` }}
                            transition={{ duration: 1.3, ease: [0.34, 1.4, 0.64, 1] }}
                            className={`h-full rounded-full bg-gradient-to-r ${stock.bar}`} />
                    </div>
                </div>
            )}

            {/* ── Tabs ── */}
            <div className="flex items-center gap-1 border-b border-slate-200 pb-0">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                        className={`relative inline-flex items-center gap-2 h-10 px-5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                            activeTab === t.id
                                ? 'text-blue-600 border-blue-600'
                                : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
                        }`}>
                        <t.icon className="h-4 w-4" />
                        {t.label}
                        {t.count !== undefined && (
                            <span className={`inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[10px] font-bold ${
                                activeTab === t.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                            }`}>{t.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Tab content ── */}
            <AnimatePresence mode="wait">

                {/* Details tab */}
                {activeTab === 'details' && (
                    <motion.div key="details" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        <Card icon={HashtagIcon} title="Identification">
                            <InfoRow label="Code article"  value={product.CodArt}   mono accent />
                            <InfoRow label="Désignation"   value={product.LibArt} />
                            <InfoRow label="Collection"    value={product.Collection} />
                            <InfoRow label="Marque"        value={product.Marque} />
                            <InfoRow label="Famille"       value={product.LibFam} />
                            <InfoRow label="Fournisseur"   value={product.LibFour} />
                            <InfoRow label="Unité"         value={product.Unite} />
                            <InfoRow label="ID interne"    value={product.IDArt}    mono />
                        </Card>

                        <Card icon={CurrencyDollarIcon} title="Tarification" accent>
                            <InfoRow label="Prix vente HT" value={`${fmtNum(product.PrixVente)} TND`} accent />
                            <InfoRow label="Prix achat HT" value={`${fmtNum(product.PrixAchat)} TND`} />
                            <InfoRow label="TVA"           value={`${num(product.Tva, 0).toLocaleString('fr-TN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`} />
                            {!isClient && <>
                                <InfoRow label="Marge brute"  value={`${marge >= 0 ? '+' : ''}${fmtNum(marge, 2)} TND`} accent />
                                <InfoRow label="Marge %"      value={`${margePct}%`} accent />
                            </>}
                        </Card>

                        {!isClient && (
                            <Card icon={ArchiveBoxIcon} title="Stock">
                                <InfoRow label="Quantité disponible" value={fmtInt(product.Qte)} />
                                <InfoRow label="Seuil minimal"       value={fmtInt(product.MinStk)} />
                                <InfoRow label="Statut"              value={stock.label} />
                            </Card>
                        )}

                        <Card icon={CalendarIcon} title="Dates">
                            <InfoRow label="Créé le"          value={fmtDate(product.DateUser)} />
                            <InfoRow label="Dernière MAJ"     value={fmtDate(product.LastDateUpdate)} />
                            <InfoRow label="Modifié le"       value={fmtDate(product.DateUpdate)} />
                        </Card>

                        {product.Description && (
                            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Description</p>
                                <p className="text-sm text-slate-600 leading-relaxed border-l-4 border-blue-200 pl-4">{product.Description}</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Variants tab */}
                {activeTab === 'variants' && (
                    <motion.div key="variants" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            {variants.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-4">
                                    <div className="h-20 w-20 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                                        <SwatchIcon className="h-9 w-9 text-slate-300" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-semibold text-slate-500">Aucune variante</p>
                                        <p className="text-sm text-slate-400 mt-1">Les variantes couleur / taille apparaîtront ici.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                {['#', 'Code', 'Couleur', 'Désignation', 'Taille', 'Qté'].map((h, i) => (
                                                    <th key={h} className={`px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest ${i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {variants.map((row, idx) => {
                                                const qty = num(row.Qte);
                                                const qBadge = qty === 0
                                                    ? 'bg-red-50 text-red-600 border-red-200'
                                                    : qty <= 5
                                                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                                                        : 'bg-emerald-50 text-emerald-600 border-emerald-200';
                                                return (
                                                    <motion.tr key={row.ID || `${row.CodArtD}-${row.CodColor}-${row.CodTaille}`}
                                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.035, duration: 0.18 }}
                                                        className="border-b border-slate-50 hover:bg-blue-50/40 transition-colors group">
                                                        <td className="px-5 py-4">
                                                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-bold group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                                {idx + 1}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <code className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">{row.CodArtD || '—'}</code>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            {row.CodColor ? (
                                                                <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
                                                                    <span className="h-4 w-4 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200 flex-none"
                                                                        style={{ backgroundColor: row.HexColor || '#cbd5e1' }} />
                                                                    {row.CodColor}
                                                                </span>
                                                            ) : <span className="text-slate-300 text-xs">—</span>}
                                                        </td>
                                                        <td className="px-5 py-4 text-xs text-slate-600 max-w-[180px] truncate">{row.DesColor || '—'}</td>
                                                        <td className="px-5 py-4">
                                                            {row.Taille
                                                                ? <span className="inline-flex items-center justify-center h-6 min-w-[28px] px-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold">{row.Taille}</span>
                                                                : <span className="text-slate-300 text-xs">—</span>}
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <span className={`inline-flex items-center justify-center h-6 min-w-[36px] px-2.5 rounded-lg border text-[11px] font-bold tabular-nums ${qBadge}`}>
                                                                {fmtInt(qty)}
                                                            </span>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ProductDetail;
