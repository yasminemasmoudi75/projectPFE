import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    PencilIcon,
    ArchiveBoxIcon,
    TagIcon,
    CurrencyDollarIcon,
    InformationCircleIcon,
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

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`/products/${id}`);
                const data = response?.data || response || {};
                setProduct(data);
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

    return (
        <div className="animate-fade-in max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/products')}
                    className="flex items-center text-gray-500 hover:text-primary-600 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 font-bold text-sm"
                >
                    <ArrowLeftIcon className="h-5 w-5 mr-1" />
                    Retour
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(`/products/edit/${id}`)}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
                    >
                        <PencilIcon className="h-4 w-4 stroke-[3]" />
                        Modifier
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Image & Quick Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="p-2">
                            {product.urlimg ? (
                                <img
                                    src={getImageUrl(product.urlimg)}
                                    alt={product.LibArt}
                                    className="w-full aspect-square object-contain rounded-2xl bg-slate-50 border border-slate-100"
                                />
                            ) : (
                                <div className="w-full aspect-square rounded-2xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 border-dashed">
                                    <PhotoIcon className="h-12 w-12 text-slate-300" />
                                    <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Aucune Image</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 pt-2">
                            <h1 className="text-xl font-black text-slate-800 leading-tight">{product.LibArt}</h1>
                            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mt-1">{product.Collection || 'Divers'}</p>

                            <div className="mt-6 pt-6 border-t border-slate-50 space-y-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Référence interne</p>
                                    <p className="text-sm font-bold text-slate-700 bg-slate-50 inline-block px-2 py-1 rounded-md mt-1">{product.CodArt}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marque</p>
                                    <p className="text-sm font-bold text-slate-700">{product.Marque || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-primary-100 rounded-lg">
                                    <ArchiveBoxIcon className="h-6 w-6 text-primary-600" />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${product.Qte > 5 ? 'bg-emerald-100 text-emerald-700' :
                                    product.Qte > 0 ? 'bg-amber-100 text-amber-700' :
                                        'bg-rose-100 text-rose-700'
                                    }`}>
                                    {product.Qte > 5 ? 'En Stock' : product.Qte > 0 ? 'Stock Faible' : 'Rupture'}
                                </span>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quantité Disponible</p>
                            <p className="text-4xl font-black mt-1 text-slate-800">
                                {product.Qte}
                                <span className="text-xs text-slate-400 ml-2 font-bold uppercase">{product.Unite || 'Utés'}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column - Details & Pricing */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Identification */}
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="bg-slate-50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
                            <TagIcon className="h-5 w-5 text-primary-600" />
                            <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Informations Générales</h2>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Désignation du produit</h3>
                                <p className="text-base font-bold text-slate-800">{product.LibArt}</p>
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Famille / Famille Produit</h3>
                                <p className="text-base font-bold text-slate-800">{product.Collection || 'Non spécifiée'}</p>
                            </div>
                            <div className="md:col-span-2">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</h3>
                                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-50 italic">
                                    {product.Description || "Aucune description disponible pour cet article."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="bg-slate-50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
                            <CurrencyDollarIcon className="h-5 w-5 text-emerald-600" />
                            <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Détails Financiers</h2>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Prix Vente HT</h3>
                                    <p className="text-xl font-black text-emerald-700">
                                        {Number(product.PrixVente).toLocaleString('fr-TN', { minimumFractionDigits: 3 })}
                                        <span className="text-[10px] ml-1 opacity-60">TND</span>
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Prix Achat HT</h3>
                                    <p className="text-xl font-black text-slate-700">
                                        {Number(product.PrixAchat).toLocaleString('fr-TN', { minimumFractionDigits: 3 })}
                                        <span className="text-[10px] ml-1 opacity-60">TND</span>
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">TVA Appliquée</h3>
                                    <p className="text-xl font-black text-slate-700">{product.Tva}%</p>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <div>
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Marge Brute Estimée</p>
                                    <p className="text-xs text-slate-400 italic">Calculée sur le prix HT</p>
                                </div>
                                <p className="text-2xl font-black text-emerald-600">
                                    {((product.PrixVente - product.PrixAchat)).toLocaleString('fr-TN', { minimumFractionDigits: 3 })}
                                    <span className="text-[10px] ml-1 font-bold opacity-60">TND</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
