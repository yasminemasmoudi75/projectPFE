
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
    ChevronDownIcon,
    SparklesIcon,
    PlusIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import axios from '../../app/axios';
import { getImageUrl } from '../../utils/imageUrl';

const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [collections, setCollections] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [variants, setVariants] = useState([]);

    const emptyVariant = () => ({ CodArtD: '', CodColor: '', DesColor: '', CodTaille: '', Taille: '', Qte: '0' });

    const [formData, setFormData] = useState({
        CodArt: '',
        LibArt: '',
        Collection: '',
        Marque: '',
        PrixVente: '0',
        PrixAchat: '0',
        Qte: '0',
        MinStk: '0',
        Tva: '19',
        Description: '',
        Unite: 'UNI',
        LibFam: '',
        LibFour: '',
        urlimg: '',
        imgArt: ''
    });

    useEffect(() => {
        const fetchCollections = async () => {
            try {
                const response = await axios.get('/categories/collections/all');
                const data = response?.data || response || [];
                setCollections(Array.isArray(data) ? data : []);
                if (!isEdit && Array.isArray(data) && data.length > 0) {
                    setFormData(prev => ({ ...prev, Collection: data[0].Collection }));
                }
            } catch (error) {
                console.error("Error fetching collections:", error);
                toast.error("Erreur chargement des familles");
            }
        };

        fetchCollections();

        if (isEdit) {
            const fetchProduct = async () => {
                try {
                    // Load variants
                    const varRes = await axios.get(`/products/${id}/variants`);
                    const varData = varRes?.data || varRes || [];
                    if (Array.isArray(varData) && varData.length > 0) {
                        setVariants(varData.map(v => ({
                            CodArtD: v.CodArtD || '',
                            CodColor: v.CodColor || '',
                            DesColor: v.DesColor || '',
                            CodTaille: v.CodTaille || '',
                            Taille: v.Taille || '',
                            Qte: v.Qte ?? '0'
                        })));
                    }
                    const response = await axios.get(`/products/${id}`);
                    const product = response?.data || response || {};
                    setFormData({
                        CodArt: product.CodArt || '',
                        LibArt: product.LibArt || '',
                        Collection: product.Collection || '',
                        Marque: product.Marque || '',
                        PrixVente: product.PrixVente || '0',
                        PrixAchat: product.PrixAchat || '0',
                        Qte: product.Qte || '0',
                        MinStk: product.MinStk || '0',
                        Tva: product.Tva || '19',
                        Description: product.Description || '',
                        Unite: product.Unite || 'UNI',
                        LibFam: product.LibFam || '',
                        LibFour: product.LibFour || '',
                        urlimg: product.urlimg || '',
                        imgArt: product.imgArt || ''
                    });
                    // Set preview for existing image
                    if (product.urlimg) {
                        setPreviewUrl(getImageUrl(product.urlimg));
                    }
                } catch (error) {
                    console.error("Error fetching product:", error);
                    toast.error("Impossible de charger le produit");
                    navigate('/products');
                } finally {
                    setLoading(false);
                }
            };
            fetchProduct();
        }
    }, [id, isEdit, navigate]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image' && files && files[0]) {
            const file = files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            if (['PrixVente', 'PrixAchat', 'Qte', 'MinStk'].includes(name)) {
                const normalizedValue = value === '' ? '' : String(Math.max(0, Number(value) || 0));
                setFormData(prev => ({ ...prev, [name]: normalizedValue }));
                return;
            }

            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const preventNegativeInput = (e) => {
        if (e.key === '-' || e.key === 'Minus' || e.key === 'Subtract') {
            e.preventDefault();
        }
    };

    const preventNegativePaste = (e) => {
        const pastedText = (e.clipboardData || window.clipboardData)?.getData('text') || '';
        if (pastedText.includes('-')) {
            e.preventDefault();
        }
    };

    const isVariantCodeField = (field) => ['CodArtD', 'CodTaille'].includes(field);

    const sanitizeVariantTextValue = (field, value) => {
        if (isVariantCodeField(field)) {
            return String(value || '').replace(/-/g, '');
        }

        return value;
    };

    const preventMinusTextInput = (e) => {
        if (e.key === '-' || e.key === 'Minus' || e.key === 'Subtract') {
            e.preventDefault();
        }
    };

    const preventMinusTextPaste = (e) => {
        const pastedText = (e.clipboardData || window.clipboardData)?.getData('text') || '';
        if (pastedText.includes('-')) {
            e.preventDefault();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const prixAchatValue = Number(formData.PrixAchat);
        const prixVenteValue = Number(formData.PrixVente);
        const qteValue = Number(formData.Qte);
        const minStkValue = Number(formData.MinStk);
        const hasNegativeVariantQuantity = variants.some((variant) => Number(variant.Qte) < 0);

        if ((Number.isFinite(prixAchatValue) && prixAchatValue < 0) || (Number.isFinite(prixVenteValue) && prixVenteValue < 0)) {
            toast.error('Les prix d\'achat et de vente ne peuvent pas être négatifs');
            return;
        }

        if ((Number.isFinite(qteValue) && qteValue < 0) || (Number.isFinite(minStkValue) && minStkValue < 0) || hasNegativeVariantQuantity) {
            toast.error('Les quantités ne peuvent pas être négatives');
            return;
        }

        setSaving(true);
        const toNumber = (value, fallback = 0) => {
            const normalized = typeof value === 'string' ? value.trim() : value;
            const parsed = Number(normalized);
            return Number.isFinite(parsed) ? parsed : fallback;
        };

        const toNonNegativeNumber = (value, fallback = 0) => Math.max(0, toNumber(value, fallback));

        console.log("Saving product. isEdit:", isEdit);
        console.log("Selected file:", selectedFile);
        console.log("Form data urlimg:", formData.urlimg);

        const fData = new FormData();
        fData.append('CodArt', formData.CodArt);
        fData.append('LibArt', formData.LibArt);
        fData.append('PrixVente', toNonNegativeNumber(formData.PrixVente));
        fData.append('PrixAchat', toNonNegativeNumber(formData.PrixAchat));
        fData.append('Qte', toNonNegativeNumber(formData.Qte));
        fData.append('MinStk', toNonNegativeNumber(formData.MinStk));
        fData.append('Tva', toNumber(formData.Tva));
        fData.append('Collection', formData.Collection || '');
        fData.append('Marque', formData.Marque || '');
        fData.append('Unite', formData.Unite || 'UNI');
        fData.append('LibFam', formData.LibFam || '');
        fData.append('LibFour', formData.LibFour || '');
        fData.append('Description', formData.Description || '');

        if (selectedFile) {
            console.log("Appending image file to FormData");
            fData.append('image', selectedFile);
        } else {
            console.log("Appending urlimg string to FormData:", formData.urlimg);
            fData.append('urlimg', formData.urlimg || '');
        }

        try {
            let savedId = id;
            if (isEdit) {
                console.log("Sending PUT request to /products/", id);
                await axios.put(`/products/${id}`, fData);
                toast.success('Produit mis à jour avec succès');
            } else {
                console.log("Sending POST request to /products");
                const res = await axios.post('/products', fData);
                savedId = res?.data?.data?.IDArt || id;
                toast.success('Produit créé avec succès');
            }
            // Save variants if any
            if (variants.length > 0 && savedId) {
                try {
                    await axios.post(`/products/${savedId}/variants`, {
                        variants: variants.map((variant) => ({
                            ...variant,
                            Qte: toNonNegativeNumber(variant.Qte)
                        }))
                    });
                } catch (e) {
                    console.warn('Variants save failed:', e.message);
                }
            }
            navigate('/products');
        } catch (error) {
            console.error("Error saving product:", error);
            const message = error.response?.data?.message || (isEdit ? "Erreur lors de la mise à jour" : "Erreur lors de la création");
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in min-h-screen bg-white pb-16">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-all font-semibold text-sm mb-6"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Retour
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 leading-tight">
                            {isEdit ? 'Modifier Article' : 'Ajouter un Article'}
                        </h1>
                        <p className="text-slate-500 font-medium mt-2 text-sm">
                            {isEdit ? `${formData.LibArt || 'Produit'}` : 'Remplissez les informations du produit'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                {/* Identification Section */}
                <div className="card-luxury overflow-hidden">
                    <div className="bg-slate-50 px-8 py-6 flex items-center gap-3 border-b border-slate-100">
                        <div className="p-2.5 bg-blue-100 rounded-xl">
                            <TagIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="font-black text-slate-800 text-sm uppercase tracking-wider">Identification</h2>
                            <p className="text-slate-500 text-xs mt-0.5">Code et désignation du produit</p>
                        </div>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Code Article</label>
                            <input
                                type="text"
                                name="CodArt"
                                value={formData.CodArt}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-semibold text-slate-800 placeholder:text-slate-400"
                                placeholder="ex: MED-001"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Désignation</label>
                            <input
                                type="text"
                                name="LibArt"
                                value={formData.LibArt}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-semibold text-slate-800 placeholder:text-slate-400"
                                placeholder="ex: Paracétamol 500mg"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Collection / Famille</label>
                            <div className="relative">
                                <select
                                    name="Collection"
                                    value={formData.Collection}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-semibold text-slate-800 appearance-none"
                                >
                                    <option value="">Sélectionner une famille</option>
                                    {collections.map((col, index) => (
                                        <option
                                            key={col.Collection ?? col.ID ?? `collection-${index}`}
                                            value={col.Collection || ''}
                                        >
                                            {col.Collection}
                                        </option>
                                    ))}
                                    {!collections.length && <option value="Divers">Divers</option>}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Marque</label>
                            <input
                                type="text"
                                name="Marque"
                                value={formData.Marque}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-semibold text-slate-800 placeholder:text-slate-400"
                                placeholder="ex: Sanicure, BioPharm..."
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tarification */}
                    <div className="card-luxury overflow-hidden">
                        <div className="bg-slate-50 px-8 py-6 flex items-center gap-3 border-b border-slate-100">
                            <div className="p-2.5 bg-emerald-100 rounded-xl">
                                <CurrencyDollarIcon className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="font-black text-slate-800 text-sm uppercase tracking-wider">Tarification</h2>
                                <p className="text-slate-500 text-xs mt-0.5">Prix achat et vente HT</p>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Prix Achat</label>
                                    <input
                                        type="number" min="0"
                                        name="PrixAchat"
                                        value={formData.PrixAchat}
                                        onChange={handleChange}
                                        onKeyDown={preventNegativeInput}
                                        onPaste={preventNegativePaste}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all font-semibold text-slate-800"
                                        placeholder="0.000"
                                        step="0.001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Prix Vente</label>
                                    <input
                                        type="number" min="0"
                                        name="PrixVente"
                                        value={formData.PrixVente}
                                        onChange={handleChange}
                                        onKeyDown={preventNegativeInput}
                                        onPaste={preventNegativePaste}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all font-semibold text-slate-800"
                                        placeholder="0.000"
                                        step="0.001"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">TVA Applicable</label>
                                <select
                                    name="Tva"
                                    value={formData.Tva}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all font-semibold text-slate-800"
                                >
                                    <option value="19">19% (Standard)</option>
                                    <option value="7">7% (Réduit)</option>
                                    <option value="0">0% (Exonéré)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Stock */}
                    <div className="card-luxury overflow-hidden">
                        <div className="bg-slate-50 px-8 py-6 flex items-center gap-3 border-b border-slate-100">
                            <div className="p-2.5 bg-amber-100 rounded-xl">
                                <ArchiveBoxIcon className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="font-black text-slate-800 text-sm uppercase tracking-wider">Stock</h2>
                                <p className="text-slate-500 text-xs mt-0.5">Quantités et unités de mesure</p>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Quantité</label>
                                    <input
                                        type="number" min="0"
                                        name="Qte"
                                        value={formData.Qte}
                                        onChange={handleChange}
                                        onKeyDown={preventNegativeInput}
                                        onPaste={preventNegativePaste}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all font-semibold text-slate-800"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Stock Minimum</label>
                                    <input
                                        type="number" min="0"
                                        name="MinStk"
                                        value={formData.MinStk}
                                        onChange={handleChange}
                                        onKeyDown={preventNegativeInput}
                                        onPaste={preventNegativePaste}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all font-semibold text-slate-800"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Unité de Mesure</label>
                                <select
                                    name="Unite"
                                    value={formData.Unite}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all font-semibold text-slate-800"
                                >
                                    <option value="UNI">Unité</option>
                                    <option value="KG">Kilogramme</option>
                                    <option value="L">Litre</option>
                                    <option value="M">Mètre</option>
                                    <option value="BOX">Boîte</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Variantes Premium */}
                    <div className="card-luxury overflow-hidden md:col-span-2">
                        <button
                            type="button"
                            onClick={() => setShowDetails(!showDetails)}
                            className="w-full px-8 py-6 bg-slate-50 flex items-center justify-between hover:bg-blue-50 transition-all border-b border-slate-100"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-blue-100 rounded-xl">
                                    <SparklesIcon className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <h2 className="font-black text-slate-800 uppercase tracking-widest text-sm">Variantes Détail</h2>
                                    <p className="text-slate-500 text-xs mt-1">Couleur, taille et quantité</p>
                                </div>
                                {variants.length > 0 && (
                                    <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-black px-3 py-1.5 rounded-full">
                                        {variants.length} ligne{variants.length > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            <ChevronDownIcon className={`h-5 w-5 text-slate-500 transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`} />
                        </button>

                        {showDetails && (
                            <div className="p-8 space-y-6 bg-white">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-3">Catégorie / Famille</label>
                                        <input
                                            type="text"
                                            name="LibFam"
                                            value={formData.LibFam}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-semibold text-slate-800"
                                            placeholder="ex: Médicaments"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-3">Fournisseur</label>
                                        <input
                                            type="text"
                                            name="LibFour"
                                            value={formData.LibFour}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-semibold text-slate-800"
                                            placeholder="ex: Pharma Distribution"
                                        />
                                    </div>
                                </div>

                                <div className="border-t-2 border-slate-100 pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-black text-slate-700 text-sm uppercase tracking-wider">Lignes de détail (TabStockD)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setVariants(prev => [...prev, emptyVariant()])}
                                            className="btn-soft-primary flex items-center gap-2 text-xs"
                                        >
                                            <PlusIcon className="h-4 w-4 stroke-[3]" />
                                            Ajouter ligne
                                        </button>
                                    </div>

                                    {variants.length === 0 ? (
                                        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                                            <p className="text-sm font-black text-slate-600">Aucune variante</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-hidden rounded-xl border border-slate-200">
                                            <table className="w-full">
                                                <thead className="bg-slate-100 border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left font-black text-slate-600 text-xs uppercase">Code Détail</th>
                                                        <th className="px-4 py-3 text-left font-black text-slate-600 text-xs uppercase">Couleur</th>
                                                        <th className="px-4 py-3 text-left font-black text-slate-600 text-xs uppercase">Désignation</th>
                                                        <th className="px-4 py-3 text-left font-black text-slate-600 text-xs uppercase">Taille</th>
                                                        <th className="px-4 py-3 text-left font-black text-slate-600 text-xs uppercase">Code</th>
                                                        <th className="px-4 py-3 text-left font-black text-slate-600 text-xs uppercase">Qté</th>
                                                        <th className="px-4 py-3 text-center font-black text-slate-600 text-xs uppercase">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 bg-white">
                                                    {variants.map((v, i) => (
                                                        <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                                                            {['CodArtD', 'CodColor', 'DesColor', 'Taille', 'CodTaille'].map(field => (
                                                                <td key={field} className="px-4 py-3">
                                                                    <input
                                                                        type="text"
                                                                        value={v[field]}
                                                                        onKeyDown={isVariantCodeField(field) ? preventMinusTextInput : undefined}
                                                                        onPaste={isVariantCodeField(field) ? preventMinusTextPaste : undefined}
                                                                        onChange={e => {
                                                                            const updated = [...variants];
                                                                            updated[i] = { ...updated[i], [field]: sanitizeVariantTextValue(field, e.target.value) };
                                                                            setVariants(updated);
                                                                        }}
                                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none font-semibold text-slate-700 text-sm"
                                                                        placeholder={field}
                                                                    />
                                                                </td>
                                                            ))}
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="number"
                                                                    value={v.Qte}
                                                                    min="0"
                                                                    onKeyDown={preventNegativeInput}
                                                                    onPaste={preventNegativePaste}
                                                                    onChange={e => {
                                                                        const updated = [...variants];
                                                                        updated[i] = { ...updated[i], Qte: e.target.value === '' ? '' : String(Math.max(0, Number(e.target.value) || 0)) };
                                                                        setVariants(updated);
                                                                    }}
                                                                    className="w-16 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none font-black text-slate-700 text-sm"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}
                                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all transform hover:scale-110"
                                                                >
                                                                    <TrashIcon className="h-5 w-5" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card-luxury overflow-hidden">
                    <div className="bg-slate-50 px-8 py-6 flex items-center gap-4 border-b border-slate-100">
                        <div className="p-2.5 bg-blue-100 rounded-xl">
                            <InformationCircleIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="font-black text-slate-800 text-sm uppercase tracking-wider">Contenu</h2>
                            <p className="text-slate-500 text-xs mt-0.5">Description et image du produit</p>
                        </div>
                    </div>
                    <div className="p-8 space-y-8">
                        <div>
                            <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-4">Description Détaillée</label>
                            <textarea
                                name="Description"
                                value={formData.Description}
                                onChange={handleChange}
                                rows="4"
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-semibold text-slate-800 placeholder:text-slate-400 resize-none"
                                placeholder="Décrivez les caractéristiques principales du produit..."
                            />
                        </div>

                        <div className="border-t-2 border-slate-100 pt-8">
                            <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-4">Image du Produit</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300 group cursor-pointer relative overflow-hidden">
                                    {(previewUrl || formData.urlimg) ? (
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <img
                                                src={previewUrl || getImageUrl(formData.urlimg)}
                                                alt="Preview"
                                                className="max-h-56 max-w-56 object-contain rounded-xl border border-slate-200 bg-slate-50 shadow-lg group-hover:shadow-xl transition-shadow"
                                            />
                                            {previewUrl && (
                                                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
                                                    <CheckIcon className="h-4 w-4" />
                                                    Nouveau fichier sélectionné
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-3 py-8">
                                            <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                                                <PhotoIcon className="h-8 w-8 text-blue-600" />
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-700">Télécharger une image</h3>
                                            <p className="text-xs text-slate-500">Cliquez ou drag & drop</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        name="image"
                                        onChange={handleChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept="image/*"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-3">Ou entrer une URL</label>
                                        <input
                                            type="text"
                                            name="urlimg"
                                            value={formData.urlimg}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-semibold text-slate-800 placeholder:text-slate-400"
                                            placeholder="https://example.com/image.jpg"
                                            disabled={!!selectedFile}
                                        />
                                    </div>
                                    {selectedFile && (
                                        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                                            <p className="text-xs text-amber-800 font-semibold">ℹ️ L'image uploadée sera utilisée en priorité</p>
                                        </div>
                                    )}
                                    <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 space-y-2">
                                        <p className="text-xs font-bold text-blue-900">Format recommandé:</p>
                                        <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                                            <li>JPG ou PNG</li>
                                            <li>Minimum 400x400px</li>
                                            <li>Maximum 5MB</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t-2 border-slate-100 sticky bottom-0 bg-white px-4 py-6 rounded-t-2xl shadow-xl">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 rounded-xl font-black text-slate-700 bg-white border-2 border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-md"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-soft-primary px-8 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <span className="w-5 h-5 border-3 border-white/40 border-t-white rounded-full animate-spin" />
                                <span>Traitement...</span>
                            </>
                        ) : (
                            <>
                                <CheckIcon className="h-5 w-5 stroke-[3]" />
                                <span>{isEdit ? 'Mettre à jour' : 'Enregistrer'}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
            </div>
        </div>
    );
};

export default ProductForm;
