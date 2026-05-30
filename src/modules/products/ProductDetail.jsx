import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon, PencilSquareIcon, ArchiveBoxIcon,
    PhotoIcon, BuildingStorefrontIcon,
    ScaleIcon, HashtagIcon,
    CheckCircleIcon, ExclamationTriangleIcon,
    XCircleIcon, SwatchIcon,
    MagnifyingGlassPlusIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import axios from '../../app/axios';
import { getImageUrl } from '../../utils/imageUrl';
import useAuth from '../../hooks/useAuth';

const num     = (v, fb = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
const fmtNum  = (v, d = 3)  => num(v).toLocaleString('fr-TN', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtInt  = (v)          => num(v).toLocaleString('fr-TN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const getStock = (qte, minStk) => {
    if (qte <= 0)              return { label: 'Rupture de stock', Icon: XCircleIcon,             text: 'text-rose-500',   bg: 'bg-rose-50',   border: 'border-rose-200',   dot: 'bg-rose-400',    bar: 'from-rose-300 to-rose-400',     pct: 3   };
    if (minStk > 0 && qte <= minStk) return { label: 'Stock faible',     Icon: ExclamationTriangleIcon, text: 'text-amber-500',  bg: 'bg-amber-50',  border: 'border-amber-200',  dot: 'bg-amber-400',   bar: 'from-amber-300 to-orange-300',  pct: Math.min(45, Math.round((qte / minStk) * 45)) };
    return                             { label: 'En stock',             Icon: CheckCircleIcon,         text: 'text-teal-600',   bg: 'bg-teal-50',   border: 'border-teal-200',   dot: 'bg-teal-400',    bar: 'from-teal-300 to-cyan-300',     pct: 100 };
};


/* ── PriceCard ── */
const PriceCard = ({ label, value, unit, accent = 'bg-slate-200', textColor = 'text-slate-700' }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className={`h-1 ${accent}`} />
        <div className="px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{label}</p>
            <p className={`text-xl font-black tabular-nums leading-none ${textColor}`}>{value}</p>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">{unit}</p>
        </div>
    </div>
);

/* ══ Page ══ */
const ProductDetail = () => {
    const { id }       = useParams();
    const navigate     = useNavigate();
    const { isClient } = useAuth();

    const [loading, setLoading]   = useState(true);
    const [product, setProduct]   = useState(null);
    const [variants, setVariants] = useState([]);
    const [imgErr, setImgErr]     = useState(false);
    const [imgZoom, setImgZoom]   = useState(false);

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

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-5xl mx-auto pb-20 space-y-5"
        >
            {/* ── Top bar ── */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/products')}
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors group"
                >
                    <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:border-[#0062AF]/30 group-hover:bg-blue-50 transition-all">
                        <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform group-hover:text-[#0062AF]" />
                    </span>
                    Retour aux produits
                </button>
                {!isClient && (
                    <button
                        onClick={() => navigate(`/products/edit/${id}`)}
                        className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-[#0062AF] hover:bg-[#004a85] text-white text-sm font-semibold transition-all shadow-md shadow-blue-500/20 active:scale-95"
                    >
                        <PencilSquareIcon className="h-4 w-4" />
                        Modifier
                    </button>
                )}
            </div>

            {/* ══ HERO ══ */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                {/* Accent top */}
                <div className="h-0.5 bg-gradient-to-r from-[#0062AF] via-sky-400 to-teal-400" />
                <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr]">

                    {/* ─ Image ─ */}
                    <div
                        className="relative flex flex-col items-center justify-center gap-5 min-h-[320px] p-8 cursor-pointer overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-100 bg-gradient-to-br from-blue-50/40 via-slate-50 to-teal-50/20"
                        onClick={() => product.urlimg && !imgErr && setImgZoom(true)}
                    >
                        <div className="absolute inset-0 opacity-[0.035]"
                            style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                        {product.urlimg && !imgErr ? (
                            <motion.img
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.4 }}
                                src={getImageUrl(product.urlimg)}
                                alt={product.LibArt}
                                onError={() => setImgErr(true)}
                                className="relative z-10 w-72 h-72 object-contain hover:scale-105 transition-transform duration-500 drop-shadow-lg"
                            />
                        ) : (
                            <div className="relative z-10 flex flex-col items-center gap-3">
                                <div className="w-28 h-28 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                                    <PhotoIcon className="h-14 w-14 text-slate-300" />
                                </div>
                                <span className="text-xs text-slate-400">Aucune image</span>
                            </div>
                        )}

                        {/* Stock pill */}
                        {!isClient && (
                            <div className={`relative z-10 inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-full border ${stock.bg} ${stock.border} ${stock.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${stock.dot} animate-pulse`} />
                                {stock.label}
                            </div>
                        )}

                        {product.urlimg && !imgErr && (
                            <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/80 border border-slate-200 shadow-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <MagnifyingGlassPlusIcon className="w-4 h-4 text-slate-400" />
                            </div>
                        )}
                    </div>

                    {/* ─ Info ─ */}
                    <div className="p-7 flex flex-col gap-5">

                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                            {product.CodArt && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#0062AF] bg-blue-50 border border-[#0062AF]/20 px-2.5 py-1 rounded-lg">
                                    <HashtagIcon className="h-3 w-3" />
                                    <span className="text-[10px] font-bold text-[#0062AF]/50 uppercase tracking-wider not-italic font-sans mr-0.5">Code article</span>
                                    {product.CodArt}
                                </span>
                            )}
                            {product.Collection && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-600 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg">
                                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Collection</span>
                                    <span className="w-px h-3 bg-sky-200" />
                                    {product.Collection}
                                </span>
                            )}
                            {product.LibFam && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Famille</span>
                                    <span className="w-px h-3 bg-slate-200" />
                                    {product.LibFam}
                                </span>
                            )}
                            {product.Marque && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-violet-600 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-lg">
                                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Marque</span>
                                    <span className="w-px h-3 bg-violet-200" />
                                    {product.Marque}
                                </span>
                            )}
                        </div>

                        {/* Titre */}
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 leading-snug tracking-tight">{product.LibArt || '—'}</h1>
                            <div className="flex flex-wrap gap-3 mt-2">
                                {product.LibFour && (
                                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                        <BuildingStorefrontIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fournisseur</span>
                                        <span className="text-slate-300">·</span>
                                        <span className="font-semibold text-slate-600">{product.LibFour}</span>
                                    </span>
                                )}
                                {product.Unite && (
                                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                        <ScaleIcon className="h-3.5 w-3.5 text-slate-300" />Unité : {product.Unite}
                                    </span>
                                )}
                            </div>
                        </div>

                        {product.Description && (
                            <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 border-l-2 border-[#0062AF]/20 pl-3 italic">{product.Description}</p>
                        )}

                        <div className="border-t border-slate-100" />

                        {/* Prix */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <PriceCard
                                label="Prix vente HT"
                                value={fmtNum(product.PrixVente)}
                                unit="TND"
                                accent="bg-blue-300"
                                textColor="text-blue-700"
                            />
                            <PriceCard
                                label="Prix achat HT"
                                value={fmtNum(product.PrixAchat)}
                                unit="TND"
                                accent="bg-slate-200"
                                textColor="text-slate-600"
                            />
                            <PriceCard
                                label="TVA"
                                value={`${num(product.Tva, 0).toLocaleString('fr-TN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
                                unit="Taux appliqué"
                                accent="bg-teal-300"
                                textColor="text-teal-700"
                            />
                            {!isClient ? (
                                <PriceCard
                                    label="Marge brute"
                                    value={`${marge >= 0 ? '+' : ''}${fmtNum(marge, 2)}`}
                                    unit={`${margePct}% du PV`}
                                    accent={marge >= 0 ? 'bg-emerald-300' : 'bg-rose-300'}
                                    textColor={marge >= 0 ? 'text-emerald-700' : 'text-rose-600'}
                                />
                            ) : (
                                <PriceCard
                                    label="Famille"
                                    value={product.LibFam || '—'}
                                    unit="Catégorie"
                                    accent="bg-slate-200"
                                    textColor="text-slate-600"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stock ── */}
            {!isClient && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex"
                >
                    <div className={`w-1 shrink-0 bg-gradient-to-b ${stock.bar}`} />
                    <div className="flex-1 px-6 py-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${stock.bg} ${stock.border}`}>
                                    <stock.Icon className={`h-5 w-5 ${stock.text}`} />
                                </div>
                                <div>
                                    <p className={`text-sm font-semibold ${stock.text}`}>{stock.label}</p>
                                    {minStk > 0 && (
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Seuil minimum : <span className="font-semibold text-slate-500">{fmtInt(minStk)} {product.Unite || 'u.'}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-4xl font-black text-slate-800 tabular-nums leading-none">{fmtInt(qte)}</p>
                                <p className="text-xs text-slate-400 mt-1 font-medium">{product.Unite || 'unités'} disponibles</p>
                            </div>
                        </div>
                        {minStk > 0 && (
                            <>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stock.pct}%` }}
                                        transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                                        className={`h-full rounded-full bg-gradient-to-r ${stock.bar}`}
                                    />
                                </div>
                                <div className="flex justify-between mt-1.5">
                                    <span className="text-[10px] text-slate-400">0</span>
                                    <span className="text-[10px] text-slate-400">Seuil : {fmtInt(minStk)}</span>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            )}

            {/* ── Variantes (visible seulement si le produit en a) ── */}
            {variants.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/40">
                        <div className="flex items-center gap-2.5">
                            <SwatchIcon className="h-4 w-4 text-slate-400" />
                            <span className="text-sm font-bold text-slate-700">Variantes</span>
                            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">
                                {variants.length}
                            </span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/60 border-b border-slate-100">
                                    {['#', 'Code', 'Couleur', 'Désignation', 'Taille', 'Qté'].map((h, i) => (
                                        <th key={h} className={`px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider ${i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {variants.map((row, idx) => {
                                    const qty = num(row.Qte);
                                    const qCls = qty === 0
                                        ? 'text-rose-500 bg-rose-50 border-rose-200'
                                        : qty <= 5
                                            ? 'text-amber-500 bg-amber-50 border-amber-200'
                                            : 'text-teal-600 bg-teal-50 border-teal-200';
                                    return (
                                        <tr key={row.ID || idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <span className="w-6 h-6 rounded-lg bg-slate-100 inline-flex items-center justify-center text-[10px] font-bold text-slate-500">{idx + 1}</span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <code className="text-xs font-mono font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">{row.CodArtD || '—'}</code>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {row.CodColor ? (
                                                    <span className="flex items-center gap-2 text-xs text-slate-600">
                                                        <span className="w-5 h-5 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200 flex-shrink-0" style={{ backgroundColor: row.HexColor || '#cbd5e1' }} />
                                                        {row.CodColor}
                                                    </span>
                                                ) : <span className="text-slate-300 text-xs">—</span>}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-slate-600 max-w-[160px] truncate">{row.DesColor || '—'}</td>
                                            <td className="px-5 py-3.5">
                                                {row.Taille
                                                    ? <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">{row.Taille}</span>
                                                    : <span className="text-slate-300 text-xs">—</span>}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border tabular-nums ${qCls}`}>{fmtInt(qty)}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* ── Lightbox ── */}
            <AnimatePresence>
                {imgZoom && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setImgZoom(false)}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-8 cursor-zoom-out"
                    >
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                            className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg"
                            onClick={e => e.stopPropagation()}
                        >
                            <img src={getImageUrl(product.urlimg)} alt={product.LibArt} className="max-w-full max-h-[65vh] object-contain" />
                            <p className="text-center text-sm text-slate-400 mt-4 font-medium">{product.LibArt}</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ProductDetail;
