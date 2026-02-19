import { useState, useEffect } from 'react';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    ArchiveBoxIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
    PencilIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';

const MOCK_PRODUCTS = [
    { id: '1', ref: 'ART-001', name: 'Ordinateur Portable Dell Latitude', category: 'Informatique', price: 2450.000, stock: 15, minStock: 5 },
    { id: '2', ref: 'ART-002', name: 'Écran 24" Full HD Samsung', category: 'Périphériques', price: 420.000, stock: 3, minStock: 10 },
    { id: '3', ref: 'ART-003', name: 'Imprimante HP LaserJet', category: 'Bureautique', price: 890.000, stock: 0, minStock: 2 },
    { id: '4', ref: 'ART-004', name: 'Clavier Mécanique RGB', category: 'Périphériques', price: 180.000, stock: 45, minStock: 10 },
    { id: '5', ref: 'ART-005', name: 'Switch Cisco 24 Ports', category: 'Réseau', price: 1250.000, stock: 8, minStock: 3 },
];

const ProductsList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        setTimeout(() => {
            setProducts(MOCK_PRODUCTS);
            setLoading(false);
        }, 600);
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in space-y-8 pb-12">
            {/* Header section with Soft UI */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-4 w-4 bg-gradient-soft-blue rounded-md flex items-center justify-center ring-4 ring-blue-50">
                            <ArchiveBoxIcon className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="text-[10px] font-black text-[#2152ff] uppercase tracking-widest">Inventaire Logistique</span>
                    </div>
                    <h1 className="text-2xl font-black text-[#344767] tracking-tight">Stock & Produits</h1>
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2 text-[#67748e] hover:text-[#344767] font-bold text-[10px] uppercase tracking-widest transition-all">
                        Mouvements
                    </button>
                    <button
                        onClick={() => navigate('/products/new')}
                        className="btn-soft-primary flex items-center gap-2"
                    >
                        <PlusIcon className="h-4 w-4 stroke-[3]" />
                        Ajouter Produit
                    </button>
                </div>
            </div>

            {/* Stats Cards - Soft UI Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-luxury p-6 flex items-center justify-between transition-transform hover:scale-[1.02]">
                    <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Références</p>
                        <p className="text-2xl font-black text-[#344767]">{products.length}</p>
                    </div>
                    <div className="icon-shape bg-gradient-soft-blue shadow-soft">
                        <ArchiveBoxIcon className="h-5 w-5 text-white" />
                    </div>
                </div>
                <div className="card-luxury p-6 flex items-center justify-between transition-transform hover:scale-[1.02]">
                    <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Alertes Stock</p>
                        <p className="text-2xl font-black text-rose-500">
                            {products.filter(p => p.stock <= p.minStock && p.stock > 0).length}
                        </p>
                    </div>
                    <div className="icon-shape shadow-soft" style={{ backgroundImage: 'linear-gradient(310deg, #ea0606 0%, #ff667c 100%)' }}>
                        <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                    </div>
                </div>
                <div className="card-luxury p-6 flex items-center justify-between transition-transform hover:scale-[1.02]">
                    <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Ruptures</p>
                        <p className="text-2xl font-black text-rose-600 font-mono">
                            {products.filter(p => p.stock === 0).length}
                        </p>
                    </div>
                    <div className="icon-shape shadow-soft bg-gradient-dark">
                        <SparklesIcon className="h-5 w-5 text-white" />
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="card-luxury p-0 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-[11px] font-black text-[#344767] uppercase tracking-widest">Registre Catalogue</h3>
                    <div className="relative group min-w-[300px]">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Rechercher référence ou nom..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#344767] focus:ring-4 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/10">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Identifiant</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Désignation</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Prix HT</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Quantité</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">État</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {products.map((product) => (
                                <tr key={product.id} className="group hover:bg-slate-50/50 transition-all cursor-pointer">
                                    <td className="px-8 py-5">
                                        <span className="text-[11px] font-black text-slate-400 bg-slate-100/50 px-2 py-0.5 rounded uppercase">{product.ref}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="text-sm font-black text-[#344767] group-hover:text-[#2152ff] transition-colors">{product.name}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase italic">{product.category}</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-sm font-black text-[#344767]">
                                            {product.price.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-400 ml-1 uppercase tracking-tighter">TND</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-black ${product.stock === 0 ? 'text-rose-600' : product.stock <= product.minStock ? 'text-amber-500' : 'text-[#344767]'}`}>
                                                {product.stock} <span className="text-[10px] text-slate-400 uppercase font-black">Utés</span>
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">Seuil alerte: {product.minStock}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        {product.stock === 0 ? (
                                            <span className="inline-flex px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-100 italic">En Reliquat</span>
                                        ) : product.stock <= product.minStock ? (
                                            <span className="inline-flex px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-100">Stock Critique</span>
                                        ) : (
                                            <span className="inline-flex px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">Disponible</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => navigate(`/products/edit/${product.id}`)}
                                            className="h-9 w-9 bg-slate-50 text-[#67748e] rounded-xl flex items-center justify-center hover:bg-gradient-soft-blue hover:text-white shadow-soft transition-all"
                                        >
                                            <PencilIcon className="h-4 w-4 stroke-[3]" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-slate-50/20 border-t border-slate-50 text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Audit de stock certifié - AMS Lab Logistique</p>
                </div>
            </div>
        </div>
    );
};

export default ProductsList;
