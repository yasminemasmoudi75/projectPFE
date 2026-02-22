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

    const [formData, setFormData] = useState({
        CodArt: '',
        LibArt: '',
        Collection: '',
        Marque: '',
        PrixVente: '0',
        PrixAchat: '0',
        Qte: '0',
        Tva: '19',
        Description: '',
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
                        Tva: product.Tva || '19',
                        Description: product.Description || '',
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
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const toNumber = (value, fallback = 0) => {
            const normalized = typeof value === 'string' ? value.trim() : value;
            const parsed = Number(normalized);
            return Number.isFinite(parsed) ? parsed : fallback;
        };

        console.log("Saving product. isEdit:", isEdit);
        console.log("Selected file:", selectedFile);
        console.log("Form data urlimg:", formData.urlimg);

        const fData = new FormData();
        fData.append('CodArt', formData.CodArt);
        fData.append('LibArt', formData.LibArt);
        fData.append('PrixVente', toNumber(formData.PrixVente));
        fData.append('PrixAchat', toNumber(formData.PrixAchat));
        fData.append('Qte', toNumber(formData.Qte));
        fData.append('Tva', toNumber(formData.Tva));
        fData.append('Collection', formData.Collection || '');
        fData.append('Marque', formData.Marque || '');
        fData.append('Description', formData.Description || '');

        if (selectedFile) {
            console.log("Appending image file to FormData");
            fData.append('image', selectedFile);
        } else {
            console.log("Appending urlimg string to FormData:", formData.urlimg);
            fData.append('urlimg', formData.urlimg || '');
        }

        try {
            if (isEdit) {
                console.log("Sending PUT request to /products/", id);
                await axios.put(`/products/${id}`, fData);
                toast.success('Produit mis à jour avec succès');
            } else {
                console.log("Sending POST request to /products");
                await axios.post('/products', fData);
                toast.success('Produit créé avec succès');
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
        <div className="animate-fade-in max-w-5xl mx-auto space-y-6">
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
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
                        <TagIcon className="h-5 w-5 text-primary-600" />
                        <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Identification du Produit</h2>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Référence (Code Art)</label>
                            <input
                                type="text"
                                name="CodArt"
                                value={formData.CodArt}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-bold text-gray-700"
                                placeholder="ex: ART-001"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Désignation</label>
                            <input
                                type="text"
                                name="LibArt"
                                value={formData.LibArt}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-bold text-gray-700"
                                placeholder="Nom du produit"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Famille / Collection</label>
                            <div className="relative">
                                <select
                                    name="Collection"
                                    value={formData.Collection}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-bold text-gray-700 appearance-none"
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
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Marque</label>
                            <input
                                type="text"
                                name="Marque"
                                value={formData.Marque}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-bold text-gray-700"
                                placeholder="ex: Dell, HP..."
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
                            <CurrencyDollarIcon className="h-5 w-5 text-emerald-600" />
                            <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Tarification</h2>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Prix Achat HT</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="PrixAchat"
                                            value={formData.PrixAchat}
                                            onChange={handleChange}
                                            className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all font-bold text-gray-700"
                                            placeholder="0.000"
                                            step="0.001"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Prix Vente HT</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="PrixVente"
                                            value={formData.PrixVente}
                                            onChange={handleChange}
                                            className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all font-bold text-gray-700"
                                            placeholder="0.000"
                                            step="0.001"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">TVA (%)</label>
                                <select
                                    name="Tva"
                                    value={formData.Tva}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all font-bold text-gray-700"
                                >
                                    <option value="19">19%</option>
                                    <option value="7">7%</option>
                                    <option value="0">0% (Exonéré)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
                            <ArchiveBoxIcon className="h-5 w-5 text-amber-600" />
                            <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Stock et Logistique</h2>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Quantité en Stock</label>
                                <input
                                    type="number"
                                    name="Qte"
                                    value={formData.Qte}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-500 outline-none transition-all font-bold text-gray-700"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
                        <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                        <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Informations Complémentaires</h2>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Description</label>
                            <textarea
                                name="Description"
                                value={formData.Description}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-gray-700"
                                placeholder="Description détaillée du produit..."
                            />
                        </div>
                        <div className="md:col-span-2">
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors group cursor-pointer relative min-h-96">
                                {(previewUrl || formData.urlimg) ? (
                                    <div className="flex flex-col items-center justify-center w-full h-full gap-4">
                                        <img
                                            src={previewUrl || getImageUrl(formData.urlimg)}
                                            alt="Preview"
                                            className="max-h-64 max-w-64 object-contain rounded-lg border border-gray-200 bg-white shadow-md"
                                        />
                                        {previewUrl && (
                                            <p className="text-xs font-bold text-blue-600">Nouveau fichier sélectionné</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center w-full h-full gap-2">
                                        <PhotoIcon className="h-12 w-12 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                        <h3 className="text-sm font-bold text-gray-700">Image du produit</h3>
                                        <p className="text-xs text-gray-500">Cliquez pour uploader depuis votre PC ou entrez une URL ci-dessous</p>
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

                            <div className="mt-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Ou URL de l'image</label>
                                <input
                                    type="text"
                                    name="urlimg"
                                    value={formData.urlimg}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700"
                                    placeholder="https://example.com/image.jpg"
                                    disabled={!!selectedFile}
                                />
                                {selectedFile && (
                                    <p className="mt-1 text-xs text-amber-600 font-medium italic">L'image uploadée sera utilisée à la place de l'URL</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 rounded-xl font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-700 transition-all shadow-sm"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3 rounded-xl font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Enregistrement...
                            </>
                        ) : (
                            <>
                                <CheckIcon className="h-5 w-5 stroke-[3]" />
                                {isEdit ? 'Mettre à jour' : 'Enregistrer le produit'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
