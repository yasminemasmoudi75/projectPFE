import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon, PencilSquareIcon, ArchiveBoxIcon,
    CurrencyDollarIcon, PhotoIcon, CubeIcon, BuildingStorefrontIcon,
    ScaleIcon, CalendarIcon, HashtagIcon,
    CheckCircleIcon, ExclamationTriangleIcon,
    XCircleIcon, SwatchIcon, InformationCircleIcon,
    MagnifyingGlassPlusIcon, TagIcon,
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
const fmtDate = (v) => {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getStock = (qte, minStk) => {
    if (qte <= 0)              return { label: 'Rupture de stock', Icon: XCircleIcon,             text: 'text-rose-500',   bg: 'bg-rose-50',   border: 'border-rose-200',   dot: 'bg-rose-400',    bar: 'from-rose-300 to-rose-400',     pct: 3   };
    if (minStk > 0 && qte <= minStk) return { label: 'Stock faible',     Icon: ExclamationTriangleIcon, text: 'text-amber-500',  bg: 'bg-amber-50',  border: 'border-amber-200',  dot: 'bg-amber-400',   bar: 'from-amber-300 to-orange-300',  pct: Math.min(45, Math.round((qte / minStk) * 45)) };
    return                             { label: 'En stock',             Icon: CheckCircleIcon,         text: 'text-teal-600',   bg: 'bg-teal-50',   border: 'border-teal-200',   dot: 'bg-teal-400',    bar: 'from-teal-300 to-cyan-300',     pct: 100 };
};

/* ── InfoRow ── */
const InfoRow = ({ label, value, mono }) => (
    <div className="grid grid-cols-[140px_1fr] items-start py-3 border-b border-slate-100 last:border-0 gap-3">
        <span className="text-xs text-slate-400 font-medium pt-0.5 leading-snug">{label}</span>
        {value != null && value !== '' ? (
            <span className={`text-sm text-slate-700 font-medium text-right leading-snug ${mono ? 'font-mono text-xs bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-slate-600 tracking-tight' : ''}`}>
                {value}
            </span>
        ) : (
            <span className="text-xs text-slate-300 italic text-right">—</span>
        )}
    </div>
);

/* ── SectionCard ── */
const SectionCard = ({ title, icon: Icon, accent = 'bg-blue-400', children }) => (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex">
        <div className={`w-1 shrink-0 ${accent}`} />
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
                <Icon className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-sm font-semibold text-slate-600">{title}</span>
            </div>
            <div className="px-5 py-1">{children}</div>
        </div>
    </div>
);

/* ── PriceCard ── */
const PriceCard = ({ label, value, unit, accent = 'bg-slate-200', textColor = 'text-slate-700' }) => (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className={`h-1 ${accent}`} />
        <div className="px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">{label}</p>
            <p className={`text-xl font-bold tabular-nums leading-none ${textColor}`}>{value}</p>
            <p className="text-xs text-slate-400 mt-1.5">{unit}</p>
        </div>
    </div>
);

/* ══ Page ══ */
const ProductDetail = () => {
    const { id }       = useParams();
    const navigate     = useNavigate();
    const { isClient } = useAuth();

    const [loading, setLoading]     = useState(true);
    const [product, setProduct]     = useState(null);
    const [variants, setVariants]   = useState([]);
    const [activeTab, setActiveTab] = useState('details');
    const [imgErr, setImgErr]       = useState(false);
    const [imgZoom, setImgZoom]     = useState(false);

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
        { id: 'details',  label: 'Fiche produit', icon: InformationCircleIcon },
        { id: 'variants', label: 'Variantes',      icon: SwatchIcon, count: variants.length },
    ];

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
                    className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors group"
                >
                    <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:border-slate-300 group-hover:bg-slate-50 transition-all">
                        <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                    </span>
                    Retour aux produits
                </button>
                {!isClient && (
                    <button
                        onClick={() => navigate(`/products/edit/${id}`)}
                        className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold transition-all shadow-sm active:scale-95"
                    >
                        <PencilSquareIcon className="h-4 w-4" />
                        Modifier
                    </button>
                )}
            </div>

            {/* ══ HERO ══ */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr]">

                    {/* ─ Image ─ */}
                    <div
                        className="relative flex flex-col items-center justify-center gap-5 min-h-[320px] p-8 cursor-pointer overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-100 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100"
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

                        {/* Type + code */}
                        <div className="flex flex-wrap items-center gap-2">
                            {product.CodArt && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                                    <HashtagIcon className="h-3 w-3 text-slate-400" />{product.CodArt}
                                </span>
                            )}
                            {product.Collection && (
                                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">{product.Collection}</span>
                            )}
                            {product.LibFam && (
                                <span className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">{product.LibFam}</span>
                            )}
                        </div>

                        {/* Titre */}
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 leading-snug">{product.LibArt || '—'}</h1>
                            <div className="flex flex-wrap gap-3 mt-2.5">
                                {product.LibFour && (
                                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                                        <BuildingStorefrontIcon className="h-3.5 w-3.5" />{product.LibFour}
                                    </span>
                                )}
                                {product.Unite && (
                                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                                        <ScaleIcon className="h-3.5 w-3.5" />{product.Unite}
                                    </span>
                                )}
                            </div>
                        </div>

                        {product.Description && (
                            <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 border-l-2 border-slate-200 pl-3">{product.Description}</p>
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

            {/* ── Tabs ── */}
            <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-xl w-fit border border-slate-200/60">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`inline-flex items-center gap-2 h-8 px-4 rounded-lg text-sm font-semibold transition-all ${
                            activeTab === t.id
                                ? 'bg-white text-slate-700 shadow-sm border border-slate-200/60'
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <t.icon className="h-4 w-4" />
                        {t.label}
                        {t.count !== undefined && (
                            <span className={`h-5 min-w-[20px] px-1.5 rounded-md text-[10px] font-bold flex items-center justify-center ${
                                activeTab === t.id ? 'bg-slate-100 text-slate-500' : 'bg-slate-200 text-slate-400'
                            }`}>{t.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Contenu onglets ── */}
            <AnimatePresence mode="wait">

                {activeTab === 'details' && (
                    <motion.div key="details"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.16 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                    >
                        <SectionCard title="Identification" icon={HashtagIcon} accent="bg-blue-300">
                            <InfoRow label="Code article"  value={product.CodArt}    mono />
                            <InfoRow label="Désignation"   value={product.LibArt} />
                            <InfoRow label="Collection"    value={product.Collection} />
                            <InfoRow label="Marque"        value={product.Marque} />
                            <InfoRow label="Famille"       value={product.LibFam} />
                            <InfoRow label="Fournisseur"   value={product.LibFour} />
                            <InfoRow label="Unité"         value={product.Unite} />
                            <InfoRow label="ID interne"    value={product.IDArt}     mono />
                        </SectionCard>

                        <div className="flex flex-col gap-4">
                            <SectionCard title="Tarification" icon={CurrencyDollarIcon} accent="bg-teal-300">
                                <InfoRow label="Prix vente HT" value={`${fmtNum(product.PrixVente)} TND`} />
                                <InfoRow label="Prix achat HT" value={`${fmtNum(product.PrixAchat)} TND`} />
                                <InfoRow label="TVA"           value={`${num(product.Tva, 0).toLocaleString('fr-TN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`} />
                                {!isClient && (
                                    <>
                                        <InfoRow label="Marge brute" value={`${marge >= 0 ? '+' : ''}${fmtNum(marge, 2)} TND`} />
                                        <InfoRow label="Marge %"     value={`${margePct}%`} />
                                    </>
                                )}
                            </SectionCard>

                            {!isClient && (
                                <SectionCard title="Stock" icon={ArchiveBoxIcon} accent="bg-amber-300">
                                    <InfoRow label="Quantité disponible" value={fmtInt(product.Qte)} />
                                    <InfoRow label="Seuil minimal"       value={minStk > 0 ? fmtInt(minStk) : null} />
                                    <InfoRow label="Statut"              value={stock.label} />
                                </SectionCard>
                            )}

                            <SectionCard title="Dates & Historique" icon={CalendarIcon} accent="bg-violet-300">
                                {fmtDate(product.DateUser) && (
                                    <InfoRow label="Créé le" value={fmtDate(product.DateUser)} />
                                )}
                                {fmtDate(product.LastDateUpdate) && (
                                    <InfoRow label="Dernière MAJ" value={fmtDate(product.LastDateUpdate)} />
                                )}
                                {fmtDate(product.DateUpdate) && fmtDate(product.DateUpdate) !== fmtDate(product.LastDateUpdate) && (
                                    <InfoRow label="Modifié le" value={fmtDate(product.DateUpdate)} />
                                )}
                                {!fmtDate(product.DateUser) && !fmtDate(product.LastDateUpdate) && !fmtDate(product.DateUpdate) && (
                                    <p className="text-xs text-slate-300 italic py-3">Aucune date disponible</p>
                                )}
                            </SectionCard>
                        </div>

                        {product.Description && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.15 }}
                                className="lg:col-span-2 bg-slate-50/60 rounded-2xl border border-slate-200/70 px-6 py-5"
                            >
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Description</p>
                                <p className="text-sm text-slate-500 leading-relaxed">{product.Description}</p>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'variants' && (
                    <motion.div key="variants"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.16 }}
                    >
                        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
                            {variants.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                                        <SwatchIcon className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-400">Aucune variante disponible</p>
                                    <p className="text-xs text-slate-300">Ce produit n'a pas de variantes configurées</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                                        <SwatchIcon className="h-4 w-4 text-slate-400" />
                                        <span className="text-sm font-semibold text-slate-600">{variants.length} variante{variants.length > 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-100 bg-slate-50/60">
                                                    {['#', 'Code', 'Couleur', 'Désignation', 'Taille', 'Qté'].map((h, i) => (
                                                        <th key={h} className={`px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider ${i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {variants.map((row, idx) => {
                                                    const qty  = num(row.Qte);
                                                    const qCls = qty === 0 ? 'text-rose-500 bg-rose-50 border-rose-200' : qty <= 5 ? 'text-amber-500 bg-amber-50 border-amber-200' : 'text-teal-600 bg-teal-50 border-teal-200';
                                                    return (
                                                        <motion.tr
                                                            key={row.ID || idx}
                                                            initial={{ opacity: 0, x: -4 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: idx * 0.04 }}
                                                            className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
                                                        >
                                                            <td className="px-5 py-3.5">
                                                                <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">{idx + 1}</span>
                                                            </td>
                                                            <td className="px-5 py-3.5">
                                                                <code className="text-xs font-semibold font-mono text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">{row.CodArtD || '—'}</code>
                                                            </td>
                                                            <td className="px-5 py-3.5">
                                                                {row.CodColor ? (
                                                                    <span className="flex items-center gap-2 text-xs text-slate-600">
                                                                        <span className="w-5 h-5 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200 shrink-0" style={{ backgroundColor: row.HexColor || '#cbd5e1' }} />
                                                                        {row.CodColor}
                                                                    </span>
                                                                ) : <span className="text-slate-300 text-xs">—</span>}
                                                            </td>
                                                            <td className="px-5 py-3.5 text-xs text-slate-600 max-w-[160px] truncate">{row.DesColor || '—'}</td>
                                                            <td className="px-5 py-3.5">
                                                                {row.Taille ? <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">{row.Taille}</span> : <span className="text-slate-300 text-xs">—</span>}
                                                            </td>
                                                            <td className="px-5 py-3.5 text-right">
                                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border tabular-nums ${qCls}`}>{fmtInt(qty)}</span>
                                                            </td>
                                                        </motion.tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
