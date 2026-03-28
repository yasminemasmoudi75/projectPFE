import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    PencilIcon,
    ArchiveBoxIcon,
    TagIcon,
    CurrencyDollarIcon,
    PhotoIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import axios from '../../app/axios';
import { getImageUrl } from '../../utils/imageUrl';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState(null);
    const [variants, setVariants] = useState([]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const [productResponse, variantsResponse] = await Promise.all([
                    axios.get(`/products/${id}`),
                    axios.get(`/products/${id}/variants`).catch(() => ({ data: { data: [] } }))
                ]);

                const data = productResponse?.data?.data || productResponse?.data || {};
                const variantRows = variantsResponse?.data || variantsResponse || [];

                setProduct(data);
                setVariants(Array.isArray(variantRows) ? variantRows : []);
            } catch (error) {
                console.error("Error fetching product:", error);
                toast.error("Impossible de charger le produit");
                navigate('/products');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, navigate]);

    if (loading) return <LoadingSpinner />;
    if (!product) return null;

    const numberValue = (value, fallback = 0) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    };

    const formatNumber = (value, digits = 3) => numberValue(value).toLocaleString('fr-TN', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    });

    const formatInteger = (value) => numberValue(value).toLocaleString('fr-TN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });

    const formatDate = (value) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('fr-FR');
    };

    const qte = numberValue(product.Qte);
    const minStk = numberValue(product.MinStk);
    const stockState = qte <= 0 ? 'Rupture' : (qte <= minStk ? 'Stock Faible' : 'En Stock');
    const stockStateClass = qte <= 0
        ? 'bg-rose-100 text-rose-700'
        : (qte <= minStk ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700');
    const marge = numberValue(product.PrixVente) - numberValue(product.PrixAchat);

    const allFields = [
        ['IDArt', product.IDArt || '-'],
        ['CodArt', product.CodArt || '-'],
        ['LibArt', product.LibArt || '-'],
        ['Collection', product.Collection || '-'],
        ['Marque', product.Marque || '-'],
        ['LibFam', product.LibFam || '-'],
        ['LibFour', product.LibFour || '-'],
        ['Unite', product.Unite || '-'],
        ['Qte', formatInteger(product.Qte)],
        ['MinStk', formatInteger(product.MinStk)],
        ['PrixVente', `${formatNumber(product.PrixVente)} TND`],
        ['PrixAchat', `${formatNumber(product.PrixAchat)} TND`],
        ['Tva', `${numberValue(product.Tva, 0).toLocaleString('fr-TN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`],
        ['urlimg', product.urlimg || '-'],
        ['DateUser', formatDate(product.DateUser)],
        ['LastDateUpdate', formatDate(product.LastDateUpdate)],
        ['DateUpdate', formatDate(product.DateUpdate)],
        ['Description', product.Description || '-']
    ];

    return (
        <div className="animate-fade-in min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50">
            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6">
                {/* Header Premium */}
                <div className="flex items-center justify-between gap-3 p-6 bg-gradient-to-r from-white via-blue-50/50 to-slate-50 rounded-2xl border-2 border-blue-100/40 shadow-lg hover:shadow-xl transition-all">
                    <button
                        onClick={() => navigate('/products')}
                        className="flex items-center gap-2 px-5 py-2 text-slate-700 hover:text-blue-700 transition-all bg-white border-2 border-slate-200 rounded-lg font-bold text-xs hover:bg-blue-50 hover:border-blue-300 hover:shadow-md"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Retour
                    </button>
                    <h1 className="text-2xl font-black text-slate-900 hidden md:block flex-1 text-center bg-gradient-to-r from-blue-700 to-slate-700 bg-clip-text text-transparent">Détail Produit</h1>
                    <button
                        onClick={() => navigate(`/products/edit/${id}`)}
                        className="btn-soft-primary flex items-center gap-2 px-5 py-2 font-bold text-xs shadow-lg hover:shadow-xl"
                    >
                        <PencilIcon className="h-4 w-4 stroke-[3]" />
                        Éditer
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Image & Quick Info */}
                <div className="space-y-6">
                    {/* Image Card */}
                    <div className="card-luxury overflow-hidden group hover:shadow-2xl transition-all duration-700">
                        <div className="p-6 bg-gradient-to-br from-white via-blue-50/20 to-slate-50/30 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-transparent to-blue-400/8 pointer-events-none" />
                            {product.urlimg ? (
                                <img
                                    src={getImageUrl(product.urlimg)}
                                    alt={product.LibArt}
                                    className="w-full aspect-square object-contain rounded-2xl bg-white border-2 border-blue-100/40 group-hover:scale-110 transition-transform duration-700"
                                />
                            ) : (
                                <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center border-3 border-dashed border-slate-300/50">
                                    <PhotoIcon className="h-24 w-24 text-slate-300 mb-4 group-hover:scale-125 transition-transform duration-500" />
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pas d'image</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 space-y-4 relative">
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 leading-tight line-clamp-2 mb-2">{product.LibArt}</h1>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="text-xs font-black text-blue-700 bg-gradient-to-r from-blue-50 to-blue-100 px-5 py-2 rounded-full border border-blue-200 shadow-sm">{product.Collection || 'Divers'}</span>
                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-4 py-1.5 rounded-lg">ID: {product.IDArt}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-4 border-t-2 border-slate-200">
                                <div className="group/card bg-gradient-to-br from-blue-50 to-white rounded-lg p-3 border-2 border-blue-100/40 hover:border-blue-300 hover:shadow-md hover:bg-blue-50/50 transition-all duration-300">
                                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-wider mb-1">Réf</p>
                                    <p className="text-xs font-black text-blue-700">{product.CodArt}</p>
                                </div>
                                <div className="group/card bg-gradient-to-br from-slate-50 to-white rounded-lg p-3 border-2 border-slate-200/50 hover:border-slate-300 hover:shadow-md transition-all duration-300">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Marque</p>
                                    <p className="text-xs font-bold text-slate-800">{product.Marque || '—'}</p>
                                </div>
                                <div className="group/card bg-gradient-to-br from-slate-50 to-white rounded-lg p-3 border-2 border-slate-200/50 hover:border-slate-300 hover:shadow-md transition-all duration-300">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Famille</p>
                                    <p className="text-xs font-bold text-slate-800">{product.LibFam || '—'}</p>
                                </div>
                                <div className="group/card bg-gradient-to-br from-slate-50 to-white rounded-lg p-3 border-2 border-slate-200/50 hover:border-slate-300 hover:shadow-md transition-all duration-300">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Fourni</p>
                                    <p className="text-xs font-bold text-slate-800">{product.LibFour || '—'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stock Card */}
                    <div className="card-luxury p-6 bg-gradient-to-br from-white via-amber-50/20 to-white border-2 border-amber-200/40 overflow-hidden group hover:shadow-xl transition-all duration-500">
                        <div className="flex items-start justify-between mb-6">
                            <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg group-hover:shadow-lg transition-all duration-300">
                                <ArchiveBoxIcon className="h-6 w-6 text-amber-700" />
                            </div>
                            <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg ${stockStateClass}`}>
                                {stockState}
                            </span>
                        </div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">Stock</p>
                        <p className="text-5xl font-black text-amber-700 leading-none mb-2">
                            {formatInteger(product.Qte)}
                        </p>
                        <p className="text-sm font-bold text-slate-600 mb-4">{product.Unite || 'Unités'}</p>
                        <div className="border-t-2 border-amber-200/50 pt-4 space-y-2">
                            <div className="flex items-center justify-between p-3 bg-amber-50/30 rounded-lg text-sm">
                                <p className="text-xs font-bold text-slate-700">Min</p>
                                <p className="font-black text-amber-700">{formatInteger(product.MinStk)}</p>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-amber-50/30 rounded-lg text-sm">
                                <p className="text-xs font-bold text-slate-700">Alerte</p>
                                <p className="text-xs font-bold text-slate-600">{formatInteger(product.MinStk)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Details & Pricing */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Identification */}
                    <div className="card-luxury overflow-hidden hover:shadow-lg transition-all duration-500">
                        <div className="bg-gradient-to-r from-white via-blue-50/40 to-white px-6 py-6 border-b-2 border-blue-100/50 flex items-center gap-4">
                            <div className="p-2.5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                                <TagIcon className="h-5 w-5 text-blue-700" />
                            </div>
                            <div>
                                <h2 className="font-black text-slate-900 uppercase tracking-wider text-base">Caractéristiques</h2>
                                <p className="text-[9px] text-slate-500 font-black mt-0.5 uppercase tracking-widest">Infos clés</p>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-white to-blue-50/20">
                            <div className="p-4 bg-white rounded-lg border-2 border-blue-100/40 hover:border-blue-300 hover:shadow-md transition-all duration-300 hover:bg-blue-50/30">
                                <h3 className="text-[9px] font-black text-blue-600 uppercase tracking-wider mb-2">Désignation</h3>
                                <p className="text-sm font-black text-slate-900">{product.LibArt}</p>
                            </div>
                            <div className="p-4 bg-white rounded-lg border-2 border-slate-200/50 hover:border-slate-300 hover:shadow-md transition-all duration-300">
                                <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-wider mb-2">Catégorie</h3>
                                <p className="text-sm font-bold text-slate-800">{product.Collection || '—'}</p>
                            </div>
                            <div className="md:col-span-2 p-4 bg-gradient-to-br from-white to-slate-50 rounded-lg border-2 border-slate-200/50 hover:border-slate-300 hover:shadow-md transition-all duration-300">
                                <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-wider mb-2">Description</h3>
                                <p className="text-xs text-slate-700 leading-relaxed font-medium line-clamp-2">
                                    {product.Description || "—"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="card-luxury overflow-hidden hover:shadow-lg transition-all duration-500">
                        <div className="bg-gradient-to-r from-white via-emerald-50/40 to-white px-6 py-6 border-b-2 border-emerald-100/50 flex items-center gap-4">
                            <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg">
                                <CurrencyDollarIcon className="h-5 w-5 text-emerald-700" />
                            </div>
                            <div>
                                <h2 className="font-black text-slate-900 uppercase tracking-wider text-base">Tarification</h2>
                                <p className="text-[9px] text-slate-500 font-black mt-0.5 uppercase tracking-widest">💰 Détails</p>
                            </div>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-white to-emerald-50/20">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="p-4 bg-gradient-to-br from-emerald-50 to-white rounded-lg border-2 border-emerald-200/50 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 group">
                                    <h3 className="text-[9px] font-black text-emerald-700 uppercase tracking-wider mb-2">Vente HT</h3>
                                    <p className="text-2xl font-black text-emerald-700 group-hover:text-emerald-800 transition-colors">
                                        {formatNumber(product.PrixVente)}
                                        <span className="text-xs ml-2 opacity-70 font-bold">TND</span>
                                    </p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-lg border-2 border-slate-200/50 hover:border-slate-300 hover:shadow-lg transition-all duration-300 group">
                                    <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-wider mb-2">Achat HT</h3>
                                    <p className="text-2xl font-black text-slate-700 group-hover:text-slate-900 transition-colors">
                                        {formatNumber(product.PrixAchat)}
                                        <span className="text-xs ml-2 opacity-70 font-bold">TND</span>
                                    </p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-lg border-2 border-slate-200/50 hover:border-slate-300 hover:shadow-lg transition-all duration-300 group">
                                    <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-wider mb-2">TVA</h3>
                                    <p className="text-2xl font-black text-slate-700 group-hover:text-slate-900 transition-colors">{numberValue(product.Tva, 0).toLocaleString('fr-TN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</p>
                                </div>
                            </div>

                            <div className="p-4 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 rounded-lg border-2 border-emerald-200/60 hover:shadow-lg transition-all duration-300 group">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <p className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">Marge Brute</p>
                                    </div>
                                    <p className="text-2xl font-black text-emerald-700 group-hover:text-emerald-800 transition-colors">
                                        +{marge.toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        <span className="text-xs ml-1 font-bold opacity-75">TND</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-luxury overflow-hidden hover:shadow-lg transition-all duration-500">
                        <div className="bg-gradient-to-r from-white via-blue-50/40 to-white px-6 py-6 border-b-2 border-blue-100 flex items-center gap-4">
                            <div className="p-2.5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                                <TagIcon className="h-5 w-5 text-blue-700" />
                            </div>
                            <div>
                                <h2 className="font-black text-slate-900 uppercase tracking-wider text-base">Specs Complets</h2>
                                <p className="text-[9px] text-slate-500 font-black mt-0.5 uppercase tracking-widest">Champs TabStock</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-gradient-to-r from-slate-100 to-blue-50 border-b-2 border-slate-200">
                                    <tr className="text-left text-[9px] font-black text-slate-700 uppercase tracking-wider">
                                        <th className="px-4 py-3 w-2/5">Champ</th>
                                        <th className="px-4 py-3">Valeur</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {allFields.map(([label, value]) => {
                                        const isEmpty = !value || value.toString().trim() === '';
                                        const displayValue = value?.toString() || '—';
                                        
                                        return (
                                            <tr key={label} className="hover:bg-blue-50/40 transition-colors">
                                                <td className="px-4 py-3 font-black text-slate-700 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    {label}
                                                </td>
                                                <td className="px-4 py-3 text-slate-800 font-semibold">
                                                    {isEmpty ? (
                                                        <span className="text-slate-300 italic">-</span>
                                                    ) : (
                                                        displayValue
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Variants Table */}
                    <div className="card-luxury overflow-hidden">
                        <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <ArchiveBoxIcon className="h-5 w-5 text-purple-600" />
                                </div>
                                <h2 className="font-black text-slate-800 uppercase tracking-wider text-xs">Variantes</h2>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200">
                                {variants.length}
                            </span>
                        </div>

                        {variants.length === 0 ? (
                            <div className="p-12 text-center">
                                <ArchiveBoxIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm font-semibold text-slate-500">Aucune variante trouvée pour ce produit</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-gradient-to-r from-slate-100 to-purple-50 border-b-2 border-slate-200">
                                        <tr className="text-left text-[9px] font-black text-slate-700 uppercase tracking-wider">
                                            <th className="px-4 py-3">#</th>
                                            <th className="px-4 py-3">Code</th>
                                            <th className="px-4 py-3">Couleur</th>
                                            <th className="px-4 py-3">Désig</th>
                                            <th className="px-4 py-3">Taille</th>
                                            <th className="px-4 py-3">Qté</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {variants.map((row, idx) => (
                                            <tr key={row.ID || `${row.CodArtD}-${row.CodColor}-${row.CodTaille}`} className="hover:bg-purple-50/40 transition-colors">
                                                <td className="px-4 py-3"><span className="inline-flex items-center justify-center w-5 h-5 bg-purple-100 text-purple-700 rounded font-bold text-[8px]">{idx + 1}</span></td>
                                                <td className="px-4 py-3 font-black text-slate-800 text-xs">{row.CodArtD || '—'}</td>
                                                <td className="px-4 py-3 text-slate-700 text-xs">{row.CodColor || '—'}</td>
                                                <td className="px-4 py-3 text-slate-700 text-xs">{row.DesColor || '—'}</td>
                                                <td className="px-4 py-3 text-slate-700 text-xs">{row.Taille || '—'}</td>
                                                <td className="px-4 py-3 font-bold text-slate-800 text-xs">{formatInteger(row.Qte)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
};

export default ProductDetail;
