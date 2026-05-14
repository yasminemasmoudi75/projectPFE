
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

    const fieldCls = 'w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 focus:bg-white transition-all placeholder:text-slate-300';
    const labelCls = 'block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5';
    const prixTTC = formData.PrixVente > 0
        ? (Number(formData.PrixVente) * (1 + Number(formData.Tva) / 100)).toFixed(3)
        : null;
    const montantTVA = formData.PrixVente > 0
        ? (Number(formData.PrixVente) * Number(formData.Tva) / 100).toFixed(3)
        : null;
    const isLowStock = Number(formData.Qte) > 0 && Number(formData.MinStk) > 0 && Number(formData.Qte) <= Number(formData.MinStk);
    const stockPct = Number(formData.MinStk) > 0
        ? Math.min(100, Math.round((Number(formData.Qte) / Number(formData.MinStk)) * 100))
        : null;
    const filledRequired = [formData.CodArt, formData.LibArt].filter(Boolean).length;

    return (
        <div className="min-h-screen bg-slate-50/70 pb-16">

            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)}
                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all group">
                            <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
                                <TagIcon className="h-5 w-5 text-indigo-500" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold text-slate-800 leading-tight">
                                    {isEdit ? (formData.LibArt || 'Modifier Article') : 'Nouvel Article'}
                                </h1>
                                <p className="text-[11px] text-slate-400">{isEdit ? formData.CodArt : 'Nouveau produit'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => navigate(-1)}
                            className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                            Annuler
                        </button>
                        <button type="submit" form="product-form" disabled={saving}
                            className="flex items-center gap-2 px-5 h-9 text-sm font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl shadow-sm shadow-indigo-100 transition-all disabled:opacity-60">
                            {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckIcon className="h-4 w-4" />}
                            {isEdit ? 'Sauvegarder' : 'Enregistrer'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Page title bar */}
            <div className="bg-white border-b border-slate-100">
                <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center">
                            <TagIcon className="h-7 w-7 text-indigo-500" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">Catalogue</span>
                                <span className="text-slate-300 text-xs">/</span>
                                <span className="text-[11px] text-slate-400">{isEdit ? 'Modifier' : 'Nouveau'}</span>
                            </div>
                            <h2 className="text-xl font-black text-slate-800">
                                {isEdit ? (formData.LibArt || 'Modifier Article') : 'Nouvel Article'}
                            </h2>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                        {filledRequired >= 2 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold rounded-xl">
                                <CheckIcon className="h-3.5 w-3.5" /> Pret a enregistrer
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-600 text-xs font-semibold rounded-xl">
                                {filledRequired}/2 champs requis
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <form id="product-form" onSubmit={handleSubmit} className="max-w-6xl mx-auto px-6 pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                    {/* ── Left column ── */}
                    <div className="lg:col-span-2 space-y-5">

                        {/* 01 · Identification */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl font-black text-slate-100 leading-none select-none w-8">01</span>
                                    <div className="h-9 w-9 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
                                        <TagIcon className="h-5 w-5 text-indigo-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-700">Identification</h2>
                                        <p className="text-[11px] text-slate-400">Code et designation du produit</p>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold text-rose-400 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full">Requis</span>
                            </div>
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelCls}>Code Article <span className="text-rose-400 normal-case">*</span></label>
                                    <input type="text" name="CodArt" value={formData.CodArt} onChange={handleChange} required
                                        className={fieldCls} placeholder="ex: MED-001" />
                                </div>
                                <div>
                                    <label className={labelCls}>Designation <span className="text-rose-400 normal-case">*</span></label>
                                    <input type="text" name="LibArt" value={formData.LibArt} onChange={handleChange} required
                                        className={fieldCls} placeholder="ex: Paracetamol 500mg" />
                                </div>
                                <div>
                                    <label className={labelCls}>Collection / Famille</label>
                                    <select name="Collection" value={formData.Collection} onChange={handleChange} className={fieldCls}>
                                        <option value="">Selectionner une famille</option>
                                        {collections.map((col, index) => (
                                            <option key={col.Collection ?? col.ID ?? `collection-${index}`} value={col.Collection || ''}>
                                                {col.Collection}
                                            </option>
                                        ))}
                                        {!collections.length && <option value="Divers">Divers</option>}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Marque</label>
                                    <input type="text" name="Marque" value={formData.Marque} onChange={handleChange}
                                        className={fieldCls} placeholder="ex: BioPharm" />
                                </div>
                            </div>
                        </div>

                        {/* 02 · Description */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                <span className="text-3xl font-black text-slate-100 leading-none select-none w-8">02</span>
                                <div className="h-9 w-9 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center">
                                    <InformationCircleIcon className="h-5 w-5 text-amber-500" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-700">Description</h2>
                                    <p className="text-[11px] text-slate-400">Categorie, fournisseur et details</p>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className={labelCls}>Categorie / Famille</label>
                                        <input type="text" name="LibFam" value={formData.LibFam} onChange={handleChange}
                                            className={fieldCls} placeholder="ex: Medicaments" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Fournisseur</label>
                                        <input type="text" name="LibFour" value={formData.LibFour} onChange={handleChange}
                                            className={fieldCls} placeholder="ex: Pharma Distribution" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Description detaillee</label>
                                    <textarea name="Description" value={formData.Description} onChange={handleChange} rows={3}
                                        className={`${fieldCls} resize-none`}
                                        placeholder="Caracteristiques principales, utilisation, composition..." />
                                </div>
                            </div>
                        </div>

                        {/* 03 · Image */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                <span className="text-3xl font-black text-slate-100 leading-none select-none w-8">03</span>
                                <div className="h-9 w-9 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center">
                                    <PhotoIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-700">Image du produit</h2>
                                    <p className="text-[11px] text-slate-400">Photo ou URL de l'article</p>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <label className="relative block cursor-pointer group">
                                        <div className={`border-2 border-dashed rounded-2xl transition-all min-h-[190px] flex items-center justify-center
                                            ${(previewUrl || formData.urlimg) ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/20'}`}>
                                            {(previewUrl || formData.urlimg) ? (
                                                <div className="flex flex-col items-center gap-3 p-5 w-full">
                                                    <img src={previewUrl || getImageUrl(formData.urlimg)} alt="Preview"
                                                        className="max-h-36 max-w-full object-contain rounded-xl shadow-sm" />
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold
                                                        ${previewUrl ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' : 'bg-slate-100 text-slate-500'}`}>
                                                        <CheckIcon className="h-3.5 w-3.5" />
                                                        {previewUrl ? 'Fichier selectionne' : 'Cliquer pour changer'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-3 p-6 text-center">
                                                    <div className="h-16 w-16 rounded-2xl bg-slate-100 group-hover:bg-indigo-50 border border-slate-200 group-hover:border-indigo-200 flex items-center justify-center transition-all">
                                                        <PhotoIcon className="h-8 w-8 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-500 group-hover:text-indigo-500 transition-colors">Cliquer pour uploader</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">JPG, PNG · max 5 MB</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" name="image" onChange={handleChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
                                    </label>

                                    <div className="flex flex-col justify-center space-y-3">
                                        <div>
                                            <label className={labelCls}>Ou entrer une URL</label>
                                            <input type="text" name="urlimg" value={formData.urlimg} onChange={handleChange}
                                                className={fieldCls} placeholder="https://example.com/img.jpg" disabled={!!selectedFile} />
                                        </div>
                                        {selectedFile ? (
                                            <div className="flex items-center gap-2.5 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                                <CheckIcon className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                                                <p className="text-xs text-indigo-700 font-semibold">Fichier local actif — URL ignoree</p>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Format recommande</p>
                                                <p className="text-xs text-slate-400 leading-relaxed">JPG ou PNG · min 400×400 px<br/>Taille max 5 MB</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 04 · Variantes */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <button type="button" onClick={() => setShowDetails(!showDetails)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/70 transition-all">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl font-black text-slate-100 leading-none select-none w-8">04</span>
                                    <div className="h-9 w-9 bg-violet-50 border border-violet-100 rounded-xl flex items-center justify-center">
                                        <SparklesIcon className="h-5 w-5 text-violet-500" />
                                    </div>
                                    <div className="text-left">
                                        <h2 className="text-sm font-bold text-slate-700">Variantes</h2>
                                        <p className="text-[11px] text-slate-400">Couleur, taille et quantite par variante</p>
                                    </div>
                                    {variants.length > 0 && (
                                        <span className="px-2.5 py-0.5 bg-violet-100 text-violet-600 text-[11px] font-bold rounded-full">
                                            {variants.length}
                                        </span>
                                    )}
                                </div>
                                <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${showDetails ? 'bg-slate-200' : 'bg-slate-100'}`}>
                                    <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} />
                                </div>
                            </button>

                            {showDetails && (
                                <div className="border-t border-slate-100 p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{variants.length} variante{variants.length !== 1 ? 's' : ''}</p>
                                        <button type="button" onClick={() => setVariants(prev => [...prev, emptyVariant()])}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-violet-100">
                                            <PlusIcon className="h-3.5 w-3.5" /> Ajouter
                                        </button>
                                    </div>

                                    {variants.length === 0 ? (
                                        <div className="py-12 flex flex-col items-center gap-3 border-2 border-dashed border-slate-100 rounded-2xl">
                                            <div className="h-12 w-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                                                <SparklesIcon className="h-6 w-6 text-violet-300" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-semibold text-slate-400">Aucune variante</p>
                                                <p className="text-xs text-slate-300 mt-0.5">Cliquez sur Ajouter pour commencer</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200">
                                                        {['Code Detail', 'Couleur', 'Designation', 'Taille', 'Code Taille', 'Qte', ''].map(h => (
                                                            <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {variants.map((v, i) => (
                                                        <tr key={i} className="hover:bg-violet-50/30 transition-colors">
                                                            {['CodArtD', 'CodColor', 'DesColor', 'Taille', 'CodTaille'].map(field => (
                                                                <td key={field} className="px-3 py-2">
                                                                    <input type="text" value={v[field]}
                                                                        onKeyDown={isVariantCodeField(field) ? preventMinusTextInput : undefined}
                                                                        onPaste={isVariantCodeField(field) ? preventMinusTextPaste : undefined}
                                                                        onChange={e => {
                                                                            const updated = [...variants];
                                                                            updated[i] = { ...updated[i], [field]: sanitizeVariantTextValue(field, e.target.value) };
                                                                            setVariants(updated);
                                                                        }}
                                                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:border-violet-300 focus:ring-1 focus:ring-violet-100 focus:outline-none transition-all"
                                                                        placeholder="—" />
                                                                </td>
                                                            ))}
                                                            <td className="px-3 py-2">
                                                                <input type="number" value={v.Qte} min="0"
                                                                    onKeyDown={preventNegativeInput} onPaste={preventNegativePaste}
                                                                    onChange={e => {
                                                                        const updated = [...variants];
                                                                        updated[i] = { ...updated[i], Qte: e.target.value === '' ? '' : String(Math.max(0, Number(e.target.value) || 0)) };
                                                                        setVariants(updated);
                                                                    }}
                                                                    className="w-16 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-violet-600 text-center focus:border-violet-300 focus:outline-none" />
                                                            </td>
                                                            <td className="px-3 py-2 text-center">
                                                                <button type="button" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}
                                                                    className="p-1.5 text-slate-300 hover:text-rose-400 hover:bg-rose-50 rounded-lg transition-all">
                                                                    <TrashIcon className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Right sidebar ── */}
                    <div className="lg:col-span-1">
                        <div className="lg:sticky lg:top-24 space-y-4">

                            {/* Live product preview */}
                            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                                <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-indigo-50/80 to-blue-50/50 border-b border-slate-100">
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-4">Apercu en direct</p>
                                    <div className="flex items-start gap-3.5">
                                        <div className="h-16 w-16 rounded-xl bg-white border border-indigo-100 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {(previewUrl || formData.urlimg) ? (
                                                <img src={previewUrl || getImageUrl(formData.urlimg)} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <TagIcon className="h-7 w-7 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 text-sm leading-snug truncate">
                                                {formData.LibArt || <span className="text-slate-400 font-normal italic text-xs">Nom du produit</span>}
                                            </p>
                                            <p className="text-indigo-400 text-xs mt-0.5">
                                                {formData.CodArt || <span className="text-slate-300 italic">Code article</span>}
                                            </p>
                                            {prixTTC ? (
                                                <p className="text-indigo-600 font-black text-lg mt-2 leading-none">
                                                    {prixTTC} <span className="text-xs font-semibold text-indigo-400">TND TTC</span>
                                                </p>
                                            ) : (
                                                <p className="text-slate-300 text-sm mt-2 italic text-xs">Prix non defini</p>
                                            )}
                                        </div>
                                    </div>
                                    {(formData.Collection || formData.Marque) && (
                                        <div className="flex flex-wrap gap-1.5 mt-3.5">
                                            {formData.Collection && (
                                                <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-600 px-2.5 py-0.5 rounded-full">{formData.Collection}</span>
                                            )}
                                            {formData.Marque && (
                                                <span className="text-[11px] font-semibold bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full">{formData.Marque}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {formData.Qte !== '' && formData.Qte !== undefined && (
                                    <div className={`px-5 py-2.5 flex items-center justify-between text-xs font-bold border-t ${isLowStock ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                                        <span className={isLowStock ? 'text-rose-400' : 'text-slate-400'}>Stock</span>
                                        <span className={isLowStock ? 'text-rose-600' : 'text-slate-600'}>{formData.Qte} {formData.Unite || 'UNI'}</span>
                                    </div>
                                )}
                            </div>

                            {/* Tarification */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                                    <div className="h-9 w-9 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center">
                                        <CurrencyDollarIcon className="h-5 w-5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-700">Tarification</h2>
                                        <p className="text-[11px] text-slate-400">Prix hors taxe</p>
                                    </div>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div>
                                        <label className={labelCls}>Prix Achat</label>
                                        <div className="relative">
                                            <input type="number" min="0" name="PrixAchat" value={formData.PrixAchat} onChange={handleChange}
                                                onKeyDown={preventNegativeInput} onPaste={preventNegativePaste}
                                                className={`${fieldCls} pr-12`} placeholder="0.000" step="0.001" />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">TND</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Prix Vente HT</label>
                                        <div className="relative">
                                            <input type="number" min="0" name="PrixVente" value={formData.PrixVente} onChange={handleChange}
                                                onKeyDown={preventNegativeInput} onPaste={preventNegativePaste}
                                                className={`${fieldCls} pr-12 font-bold text-emerald-600`} placeholder="0.000" step="0.001" />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">TND</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>TVA</label>
                                        <select name="Tva" value={formData.Tva} onChange={handleChange} className={fieldCls}>
                                            <option value="19">19% — Standard</option>
                                            <option value="7">7% — Reduit</option>
                                            <option value="0">0% — Exonere</option>
                                        </select>
                                    </div>

                                    {prixTTC && (
                                        <div className="rounded-xl overflow-hidden border border-emerald-200">
                                            <div className="px-4 py-3 flex items-center justify-between bg-emerald-50 border-b border-emerald-100">
                                                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Prix TTC</p>
                                                <p className="text-xl font-black text-emerald-700">
                                                    {prixTTC} <span className="text-sm font-semibold text-emerald-500">TND</span>
                                                </p>
                                            </div>
                                            <div className="px-4 py-2.5 flex justify-between text-xs text-slate-500 bg-white">
                                                <span>HT : <b className="text-slate-700">{Number(formData.PrixVente).toFixed(3)}</b></span>
                                                <span className="text-slate-300">+</span>
                                                <span>TVA {formData.Tva}% : <b className="text-emerald-600">{montantTVA}</b></span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stock */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                                    <div className="h-9 w-9 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center">
                                        <ArchiveBoxIcon className="h-5 w-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-700">Stock</h2>
                                        <p className="text-[11px] text-slate-400">Quantites et seuils</p>
                                    </div>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div>
                                        <label className={labelCls}>Quantite en stock</label>
                                        <div className="relative">
                                            <input type="number" min="0" name="Qte" value={formData.Qte} onChange={handleChange}
                                                onKeyDown={preventNegativeInput} onPaste={preventNegativePaste}
                                                className={`${fieldCls} pr-12 font-bold ${isLowStock ? 'text-rose-500 border-rose-200 focus:border-rose-300 focus:ring-rose-50' : 'text-amber-600'}`}
                                                placeholder="0" />
                                            {formData.Unite && (
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">{formData.Unite}</span>
                                            )}
                                        </div>
                                    </div>

                                    {stockPct !== null && (
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between">
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Niveau stock</p>
                                                <p className={`text-[11px] font-bold ${isLowStock ? 'text-rose-400' : 'text-emerald-500'}`}>{stockPct}%</p>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-500 ${stockPct <= 50 ? 'bg-rose-300' : stockPct <= 80 ? 'bg-amber-300' : 'bg-emerald-400'}`}
                                                    style={{ width: `${stockPct}%` }} />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className={labelCls}>Stock Minimum</label>
                                        <input type="number" min="0" name="MinStk" value={formData.MinStk} onChange={handleChange}
                                            onKeyDown={preventNegativeInput} onPaste={preventNegativePaste}
                                            className={fieldCls} placeholder="0" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Unite de Mesure</label>
                                        <select name="Unite" value={formData.Unite} onChange={handleChange} className={fieldCls}>
                                            <option value="UNI">Unite</option>
                                            <option value="KG">Kilogramme</option>
                                            <option value="L">Litre</option>
                                            <option value="M">Metre</option>
                                            <option value="BOX">Boite</option>
                                        </select>
                                    </div>

                                    {isLowStock && (
                                        <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-100 rounded-xl">
                                            <div className="h-8 w-8 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                                                <ArchiveBoxIcon className="h-4 w-4 text-rose-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-rose-600">Stock critique</p>
                                                <p className="text-[11px] text-rose-400 mt-0.5">En dessous du seuil minimum</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="px-5 pb-5">
                                    <button type="submit" form="product-form" disabled={saving}
                                        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl shadow-sm shadow-indigo-100 transition-all disabled:opacity-60">
                                        {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckIcon className="h-4 w-4" />}
                                        {isEdit ? 'Sauvegarder les modifications' : 'Enregistrer le produit'}
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
