import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    CheckIcon,
    ArchiveBoxIcon,
    TagIcon,
    CurrencyDollarIcon,
    InformationCircleIcon,
    PhotoIcon,
    ScaleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';

const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        CodArt: '',
        LibArt: '',
        CodFam: 'Informatique',
        PuHT: '',
        Tva: '19',
        Unite: 'PC',
        StockActual: '0',
        StockMin: '5',
        Description: '',
        Photo: ''
    });

    useEffect(() => {
        if (isEdit) {
            // Simulation chargement données existantes
            // Dans un cas réel, on appellerait l'api GET /api/articles/:id
            setTimeout(() => {
                setFormData({
                    CodArt: 'ART-001',
                    LibArt: 'Ordinateur Portable Dell Latitude',
                    CodFam: 'Informatique',
                    PuHT: '2450.000',
                    Tva: '19',
                    Unite: 'PC',
                    StockActual: '15',
                    StockMin: '5',
                    Description: 'Ordinateur haute performance pour professionnels.',
                    Photo: ''
                });
                setLoading(false);
            }, 600);
        }
    }, [id, isEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSaving(true);
        // Simulation sauvegarde
        // Dans un cas réel, on appellerait l'api POST /api/articles ou PUT /api/articles/:id
        setTimeout(() => {
            toast.success(isEdit ? 'Produit mis à jour avec succès' : 'Produit créé avec succès');
            setSaving(false);
            navigate('/products');
        }, 1000);
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-500 hover:text-primary-600 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 font-bold text-sm"
                >
                    <ArrowLeftIcon className="h-5 w-5 mr-1" />
                    Annuler
                </button>
                <h1 className="text-2xl font-black text-slate-800 border-l-4 border-primary-600 pl-4">
                    {isEdit ? `Modifier : ${formData.LibArt}` : 'Nouveau Produit / Article'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pb-12">
                {/* Identification Section */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
                        <TagIcon className="h-5 w-5 text-primary-600" />
                        <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Identification du Produit</h2>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">Code Article / Référence</label>
                            <input
                                type="text"
                                name="CodArt"
                                value={formData.CodArt}
                                onChange={handleChange}
                                disabled={isEdit}
                                className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-mono ${isEdit ? 'bg-gray-50 text-gray-400' : 'font-bold'}`}
                                placeholder="Ex: ART-001"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">Désignation / Libellé</label>
                            <input
                                type="text"
                                name="LibArt"
                                value={formData.LibArt}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-bold"
                                placeholder="Nom du produit"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">Catégorie / Famille</label>
                            <select
                                name="CodFam"
                                value={formData.CodFam}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all appearance-none cursor-pointer font-semibold"
                            >
                                <option>Informatique</option>
                                <option>Périphériques</option>
                                <option>Bureautique</option>
                                <option>Réseau</option>
                                <option>Services</option>
                                <option>Logiciels</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">Unité de Mesure</label>
                            <input
                                type="text"
                                name="Unite"
                                value={formData.Unite}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                                placeholder="PC, KG, M, etc."
                            />
                        </div>
                    </div>
                </div>

                {/* Tarification Section */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
                        <CurrencyDollarIcon className="h-5 w-5 text-emerald-600" />
                        <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Tarification & Taxes</h2>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 text-emerald-700">Prix Unitaire HT (TND)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.001"
                                    name="PuHT"
                                    value={formData.PuHT}
                                    onChange={handleChange}
                                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-black"
                                    placeholder="0.000"
                                    required
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase">TND</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">Taux TVA (%)</label>
                            <select
                                name="Tva"
                                value={formData.Tva}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                            >
                                <option value="19">19% (Standard)</option>
                                <option value="13">13%</option>
                                <option value="7">7%</option>
                                <option value="0">0% (Exonéré)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Stock Section */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
                        <ArchiveBoxIcon className="h-5 w-5 text-orange-600" />
                        <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Gestion du Stock</h2>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 text-orange-700 font-black">Stock Actuel (Initial)</label>
                            <input
                                type="number"
                                name="StockActual"
                                value={formData.StockActual}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 text-red-700">Seuil de Stock Minimum (Alerte)</label>
                            <input
                                type="number"
                                name="StockMin"
                                value={formData.StockMin}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-bold"
                            />
                        </div>
                    </div>
                </div>

                {/* Additional Details */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
                        <InformationCircleIcon className="h-5 w-5 text-gray-600" />
                        <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Détails Complémentaires</h2>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">Description détaillée</label>
                            <textarea
                                name="Description"
                                value={formData.Description}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all resize-none"
                                placeholder="Spécifications techniques, notes..."
                            ></textarea>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 flex items-center gap-2">
                                <PhotoIcon className="h-4 w-4" /> URL de l'image du produit
                            </label>
                            <input
                                type="text"
                                name="Photo"
                                value={formData.Photo}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                                placeholder="https://exemple.com/image.jpg"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-8 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-black text-sm hover:bg-gray-50 transition-all"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-12 py-4 bg-primary-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-primary-500/30 hover:bg-primary-700 transition-all flex items-center gap-2"
                    >
                        {saving ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <CheckIcon className="h-5 w-5" />}
                        {isEdit ? 'Mettre à jour le Produit' : 'Enregistrer le Produit'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
