import { useState, useEffect } from 'react';
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    ArrowLeftIcon,
    CheckIcon,
    PlusIcon,
    TrashIcon,
    CalculatorIcon,
    DocumentTextIcon,
    UserIcon,
    CurrencyDollarIcon,
    SparklesIcon,
    UserGroupIcon,
    MapPinIcon,
    IdentificationIcon,
    BuildingOfficeIcon,
    ArrowPathIcon,
    TagIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';
import { createDevis, fetchDevisById, updateDevis, clearCurrentDevis } from './devisSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import axiosInstance from '../../app/axios';

const getProductName = (product = {}) => product.LibArt || product.Libelle || '';

const normalizeProduct = (product = {}) => ({
    ...product,
    LibArt: getProductName(product)
});

const getProductSearchLabel = (product = {}) => {
    const code = product.CodArt || '';
    const name = getProductName(product);
    return [code, name].filter(Boolean).join(' - ');
};

const NON_NEGATIVE_MASTER_FIELDS = new Set([
    'TotHT', 'TotTva', 'TotFodec', 'TotRem', 'TotTTC',
    'Frais', 'MntTotDev', 'Timbre', 'Cours', 'avanceforf',
    'MntDebit', 'MntCredit', 'Rest', 'MntAv', 'CodCateg'
]);

const NON_NEGATIVE_DETAIL_FIELDS = new Set([
    'Qt', 'PuHT', 'PuTTC', 'PvPub', 'PuDev', 'Tva',
    'MntRem', 'MntTVA', 'MntHT', 'MntFodec', 'MntFrais'
]);

const toNonNegativeNumber = (value, fallback = 0) => {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(0, parsed);
};

const DevisForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isEdit = Boolean(id);
    const { currentDevis, loading: loadingSlice } = useSelector((state) => state.devis);

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [productOptions, setProductOptions] = useState([]);
    const [productLookup, setProductLookup] = useState({});
    const [clients, setClients] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingClients, setLoadingClients] = useState(true);
    const [expandedItems, setExpandedItems] = useState({});
    const [activeProductRowId, setActiveProductRowId] = useState(null);

    const toggleItemExpanded = (tempId) => {
        setExpandedItems(prev => ({
            ...prev,
            [tempId]: !prev[tempId]
        }));
    };

    const loadProductsList = async () => {
        try {
            console.log('📦 Loading products...');
            const response = await axiosInstance.get('/products', {
                params: {
                    limit: 100,
                    page: 1
                }
            });
            
            const payload = response?.data ?? response;
            let list = Array.isArray(payload) ? payload : payload?.data;
            
            if (!Array.isArray(list)) {
                console.warn('⚠️ Response data is not an array:', payload);
                list = [];
            }

            if (list.length === 0) {
                console.warn('⚠️ No products returned from API');
                toast.error('Aucun produit trouvé dans la base de données');
                return;
            }

            const normalizedProducts = list
                .filter(p => p && (p.IDArt || p.Guid)) // Only include valid products
                .map(normalizeProduct);
            
            console.log(`✅ Successfully loaded ${normalizedProducts.length} products`);
            
            setProductOptions(normalizedProducts);
            setProductLookup((prev) => {
                const nextLookup = { ...prev };
                normalizedProducts.forEach((product) => {
                    nextLookup[String(product.IDArt)] = product;
                });
                return nextLookup;
            });
        } catch (error) {
            console.error('❌ Error loading products:', error);
            console.error('📍 Details:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            toast.error('Erreur lors du chargement des produits: ' + (error.response?.data?.message || error.message));
        }
    };

    // Form State matching complete TabDevm structure
    const [formData, setFormData] = useState({
        // Numbering
        Prfx: 'DV',
        Sufx: '',
        Nf: '',
        
        // Client Info
        CodTiers: '',
        LibTiers: '',
        IDContact: '',
        
        // Addresses
        Adresse: '',
        Ville: '',
        LibTiersA: '',
        AdresseA: '',
        VilleA: '',
        
        // Client Details
        Cin: '',
        CinA: '',
        AssujTiers: '',
        
        // Financial - Grand Totals
        TotHT: 0,
        TotTva: 0,
        TotFodec: 0,
        TotRem: 0,
        TotTTC: 0,
        
        // Financial - Details
        Frais: 0,
        MntTotDev: 0,
        Timbre: 0,
        
        // Documentation
        NatReg: '',
        NbrLett: '',
        
        // Printing
        NImpA: '',
        NImpB: '',
        DatImp: null,
        
        // Currency
        Devise: 'TND',
        CodDev: '',
        Cours: 1,
        
        // Representative & Warehouse
        CodRepres: '',
        DesRepres: '',
        CodMag: '',
        DesMag: '',
        
        // Notes
        Remarq: '',
        
        // Dates
        DatUser: null,
        DatCreateUser: null,
        MDate: null,
        DatLiv: null,
        
        // Flags
        Valid: false,
        bTransf: false,
        bLivr: false,
        
        // Classification
        categ: '',
        type: '',
        Classe: '',
        Fonction: '',
        Categorie: '',
        Domaine: '',
        
        // Driver
        CodChauff: '',
        DesChauff: '',
        
        // Advance Payment
        avanceforf: 0,
        
        // Legacy/Metadata
        IsConverted: false,
        MntDebit: 0,
        MntCredit: 0,
        Rest: 0,
        NFav: '',
        MntAv: 0,
        CodCateg: 0
    });

    // Cin is stored separately - it's a Tiers field, not part of DevisMaster
    const [clientCin, setClientCin] = useState('');

    const [items, setItems] = useState([
        { 
            tempId: Date.now(), 
            CodArt: '', 
            LibArt: '', 
            ExLibArt: '',
            Qt: 1, 
            PuHT: 0,
            PuTTC: 0,
            Tva: 19,
            MntRem: 0,
            MntTVA: 0,
            MntHT: 0,
            MntFodec: 0,
            PvPub: 0,
            CodColor: '',
            DesColor: '',
            CodTaille: '',
            Taille: '',
            PuDev: 0,
            MntFrais: 0,
            NumBL: '',
            DateBL: null,
            Codabar: '',
            NumImport: '',
            DatImport: null,
            productSearch: '' 
        }
    ]);

    const activeProductSearch = items.find(item => item.tempId === activeProductRowId)?.productSearch?.trim() || '';

    useEffect(() => {
        if (!activeProductRowId) {
            setLoadingProducts(false);
            return;
        }

        if (activeProductSearch.length < 2) {
            setProductOptions([]);
            setLoadingProducts(false);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setLoadingProducts(true);
            try {
                console.log('🔍 Product search started:', { activeProductSearch, activeProductRowId });
                
                const response = await axiosInstance.get('/products', {
                    params: {
                        search: activeProductSearch,
                        limit: 50,
                        page: 1
                    }
                });

                console.log('📦 Product API Response:', response.data);
                
                const payload = response?.data ?? response;
                let list = Array.isArray(payload) ? payload : payload?.data;

                // Handle various response formats
                if (!Array.isArray(list)) {
                    console.warn('⚠️ Unexpected response format:', payload);
                    list = [];
                }

                const normalizedProducts = list.map(normalizeProduct);
                console.log(`✅ Found ${normalizedProducts.length} products`);

                setProductOptions(normalizedProducts);
                setProductLookup((prev) => {
                    const nextLookup = { ...prev };
                    normalizedProducts.forEach((product) => {
                        nextLookup[String(product.IDArt)] = product;
                    });
                    return nextLookup;
                });
            } catch (error) {
                console.error('❌ Product search error:', error);
                console.error('📍 Error details:', {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                });
                toast.error('Erreur lors de la recherche des produits: ' + (error.response?.data?.message || error.message));
                setProductOptions([]);
            } finally {
                setLoadingProducts(false);
            }
        }, 350);

        return () => clearTimeout(timeoutId);
    }, [activeProductRowId, activeProductSearch]);

    // Fetch initial products on mount
    useEffect(() => {
        loadProductsList();
    }, []);

    // Fetch clients from database
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const response = await axiosInstance.get('/tiers');
                // axiosInstance interceptor returns response.data directly
                if (response.data && Array.isArray(response.data)) {
                    setClients(response.data);
                } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                    setClients(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching clients:', error);
                toast.error('Erreur lors du chargement des clients');
            } finally {
                setLoadingClients(false);
            }
        };
        fetchClients();
    }, []);

    useEffect(() => {
        if (isEdit && id) {
            dispatch(fetchDevisById(id));
        } else {
            dispatch(clearCurrentDevis());
            setLoading(false);
        }
    }, [id, isEdit, dispatch]);

    useEffect(() => {
        if (isEdit && currentDevis) {
            const { details, ...master } = currentDevis;
            setFormData({
                ...master,
                TotRem: master.TotRem || 0,
                TotHT: master.TotHT || 0,
                TotTva: master.TotTva || 0,
                TotTTC: master.TotTTC || 0,
                DatUser: master.DatUser || null,
                MDate: master.MDate || null,
                DatLiv: master.DatLiv || null,
                Valid: master.Valid || false,
                bTransf: master.bTransf || false,
                IsConverted: master.IsConverted || false
            });

            if (details && details.length > 0) {
                setItems(details.map(d => ({ ...d, tempId: d.NoDetail || Math.random() })));
            }
            setLoading(false);
        }
    }, [currentDevis, isEdit]);

    // Recalculate totals
    useEffect(() => {
        const subTotal = items.reduce((sum, item) => {
            const qt = toNonNegativeNumber(item.Qt, 0);
            const puHT = toNonNegativeNumber(item.PuHT, 0);
            return sum + (qt * puHT);
        }, 0);

        const totalTva = items.reduce((sum, item) => {
            const qt = toNonNegativeNumber(item.Qt, 0);
            const puHT = toNonNegativeNumber(item.PuHT, 0);
            const tva = toNonNegativeNumber(item.Tva, 0);
            return sum + (qt * puHT * (tva / 100));
        }, 0);

        const totalRem = toNonNegativeNumber(formData.TotRem, 0);
        const totalTTC = subTotal + totalTva - totalRem;

        setFormData(prev => ({
            ...prev,
            TotHT: subTotal,
            TotTva: totalTva,
            TotTTC: totalTTC
        }));
    }, [items, formData.TotRem]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (NON_NEGATIVE_MASTER_FIELDS.has(name)) {
            const normalized = value === '' ? '' : String(toNonNegativeNumber(value, 0));
            setFormData(prev => ({ ...prev, [name]: normalized }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addItem = () => {
        setItems([...items, { 
            tempId: Date.now(), 
            CodArt: '', 
            LibArt: '', 
            ExLibArt: '',
            Qt: 1, 
            PuHT: 0,
            PuTTC: 0,
            Tva: 19,
            MntRem: 0,
            MntTVA: 0,
            MntHT: 0,
            MntFodec: 0,
            PvPub: 0,
            CodColor: '',
            DesColor: '',
            CodTaille: '',
            Taille: '',
            PuDev: 0,
            MntFrais: 0,
            NumBL: '',
            DateBL: null,
            Codabar: '',
            NumImport: '',
            DatImport: null,
            productSearch: '' 
        }]);
    };

    const removeItem = (tempId) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.tempId !== tempId));
        }
    };

    const handleItemChange = (tempId, field, value) => {
        const normalizedValue = NON_NEGATIVE_DETAIL_FIELDS.has(field)
            ? toNonNegativeNumber(value, 0)
            : value;

        setItems(items.map(item => item.tempId === tempId ? { ...item, [field]: normalizedValue } : item));
    };

    const handleProductSearchChange = (tempId, value) => {
        setActiveProductRowId(tempId);
        setItems(items.map(item => item.tempId === tempId ? { ...item, productSearch: value } : item));
    };

    const handleProductSelect = (tempId, productId) => {
        const selectedProduct = productLookup[String(productId)] || productOptions.find(p => String(p.IDArt) === String(productId));
        if (selectedProduct) {
            const selectedPrice = Number.parseFloat(selectedProduct.PrixVente);
            const selectedTva = Number.parseFloat(selectedProduct.Tva);

            setItems(items.map(item =>
                item.tempId === tempId ? {
                    ...item,
                    IDArt: selectedProduct.IDArt,
                    CodArt: selectedProduct.CodArt,
                    LibArt: getProductName(selectedProduct),
                    productSearch: getProductSearchLabel(selectedProduct),
                    PuHT: Number.isFinite(selectedPrice) ? selectedPrice : 0,
                    Tva: Number.isFinite(selectedTva) ? selectedTva : 19
                } : item
            ));
            setActiveProductRowId(null);
            setProductOptions([]);
        }
    };

    const handleClientSelect = (clientCode) => {
        const selectedClient = clients.find(c => c.CodTiers === clientCode);
        if (selectedClient) {
            setFormData(prev => ({
                ...prev,
                CodTiers: selectedClient.CodTiers,
                LibTiers: selectedClient.Raisoc || '',   // Tiers uses Raisoc, DevisMaster stores it as LibTiers
                Adresse: selectedClient.Adresse || '',
                Ville: selectedClient.Ville || '',
            }));
            // Cin belongs to Tiers model, not DevisMaster - keep separate
            setClientCin(selectedClient.Cin || '');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        // Helper to serialize dates properly
        const serializeDate = (value) => {
            if (!value || value === '' || value === 'null') return null;
            try {
                if (value instanceof Date) {
                    return value.toISOString();
                }
                // Try to parse if it's a string
                const parsed = new Date(value);
                if (!isNaN(parsed.getTime())) {
                    return parsed.toISOString();
                }
            } catch (e) {
                console.warn('Invalid date:', value);
            }
            return null;
        };

        // Build master - include all TabDevm fields
        const payload = {
            master: {
                ...formData,
                // Ensure numeric fields are proper numbers
                TotHT: toNonNegativeNumber(formData.TotHT, 0),
                TotTva: toNonNegativeNumber(formData.TotTva, 0),
                TotFodec: toNonNegativeNumber(formData.TotFodec, 0),
                TotRem: toNonNegativeNumber(formData.TotRem, 0),
                TotTTC: toNonNegativeNumber(formData.TotTTC, 0),
                Frais: toNonNegativeNumber(formData.Frais, 0),
                MntTotDev: toNonNegativeNumber(formData.MntTotDev, 0),
                Timbre: toNonNegativeNumber(formData.Timbre, 0),
                Cours: toNonNegativeNumber(formData.Cours, 1),
                avanceforf: toNonNegativeNumber(formData.avanceforf, 0),
                MntDebit: toNonNegativeNumber(formData.MntDebit, 0),
                MntCredit: toNonNegativeNumber(formData.MntCredit, 0),
                Rest: toNonNegativeNumber(formData.Rest, 0),
                MntAv: toNonNegativeNumber(formData.MntAv, 0),
                CodCateg: Math.trunc(toNonNegativeNumber(formData.CodCateg, 0)),
                Nf: parseInt(formData.Nf) || null,
                // Properly serialize date fields
                DatUser: serializeDate(formData.DatUser),
                MDate: serializeDate(formData.MDate),
                DatLiv: serializeDate(formData.DatLiv),
                DatCreateUser: serializeDate(formData.DatCreateUser),
                DatImp: serializeDate(formData.DatImp),
                // Ensure boolean fields are booleans
                Valid: !!formData.Valid,
                bTransf: !!formData.bTransf,
                bLivr: !!formData.bLivr,
                IsConverted: !!formData.IsConverted
            },
            details: items.map(({ tempId, productSearch, ...rest }) => ({
                CodArt: rest.CodArt || '',
                LibArt: rest.LibArt || '',
                ExLibArt: rest.ExLibArt || '',
                IDArt: rest.IDArt || null,
                Qt: toNonNegativeNumber(rest.Qt, 0),
                PuHT: toNonNegativeNumber(rest.PuHT, 0),
                PuTTC: toNonNegativeNumber(rest.PuTTC, 0),
                PvPub: toNonNegativeNumber(rest.PvPub, 0),
                PuDev: toNonNegativeNumber(rest.PuDev, 0),
                Tva: toNonNegativeNumber(rest.Tva, 19),
                MntRem: toNonNegativeNumber(rest.MntRem, 0),
                MntTVA: toNonNegativeNumber(rest.MntTVA, 0),
                MntHT: toNonNegativeNumber(rest.MntHT, 0),
                MntFodec: toNonNegativeNumber(rest.MntFodec, 0),
                MntFrais: toNonNegativeNumber(rest.MntFrais, 0),
                CodColor: rest.CodColor || '',
                DesColor: rest.DesColor || '',
                CodTaille: rest.CodTaille || '',
                Taille: rest.Taille || '',
                NumBL: rest.NumBL || '',
                DateBL: serializeDate(rest.DateBL),
                Codabar: rest.Codabar || '',
                NumImport: rest.NumImport || '',
                DatImport: serializeDate(rest.DatImport)
            }))
        };
        console.log('📤 Payload envoyé:', JSON.stringify(payload, null, 2));

        try {
            if (isEdit) {
                await dispatch(updateDevis({ id, payload })).unwrap();
                toast.success('Devis mis à jour');
            } else {
                await dispatch(createDevis(payload)).unwrap();
                toast.success('Devis créé avec succès');
            }
            navigate('/devis');
        } catch (err) {
            console.error('❌ Erreur complète:', err);
            console.error('❌ Réponse serveur:', err?.response?.data || err?.data || 'Pas de réponse détaillée');
            const msg = err?.response?.data?.message || err?.message || 'Une erreur est survenue';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading || loadingSlice) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            {/* Header section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => navigate('/devis')}
                        className="h-11 w-11 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 rounded-xl transition-all shadow-soft flex items-center justify-center font-bold"
                    >
                        <ArrowLeftIcon className="h-5 w-5 stroke-[2.5]" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="badge badge-primary">
                                <DocumentTextIcon className="h-3 w-3 mr-1" />
                                Ventes & Offres
                            </span>
                        </div>
                        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                            {isEdit ? `Modification Devis N°${formData.Nf}` : 'Nouvelle Proposition Commerciale'}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all shadow-soft"
                    >
                        <ArrowPathIcon className="h-5 w-5" />
                    </button>
                    <button
                        form="devis-form"
                        type="submit"
                        disabled={saving}
                        className="btn-soft-primary flex items-center gap-2 px-8"
                    >
                        {saving ? (
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <CheckIcon className="h-4 w-4 stroke-[3]" />
                        )}
                        {isEdit ? 'Mettre à jour' : 'Finaliser le Devis'}
                    </button>
                </div>
            </div>

            <form id="devis-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
                {/* Left: General & Items */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Client Info Card */}
                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="px-8 py-5 border-b border-slate-100/50 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="icon-shape icon-shape-sm bg-gradient-blue shadow-glow-blue scale-90">
                                    <UserGroupIcon className="h-5 w-5 text-white" />
                                </div>
                                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Informations Client</h2>
                            </div>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Données du Master</span>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Client Selector */}
                            <div className="group md:col-span-2">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Sélectionner un Client</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <UserGroupIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <select
                                        value={formData.CodTiers || ''}
                                        onChange={(e) => handleClientSelect(e.target.value)}
                                        className="input-modern pl-11 w-full text-slate-700 bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">-- Choisir un client --</option>
                                        {clients.map(client => (
                                            <option key={client.CodTiers} value={client.CodTiers}>
                                                [{client.CodTiers}] {client.Raisoc}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Code Client (ID)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <IdentificationIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        name="CodTiers"
                                        value={formData.CodTiers || ''}
                                        onChange={handleChange}
                                        placeholder="CLI-0000"
                                        className="input-modern pl-11 font-mono uppercase"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Raison Sociale</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <BuildingOfficeIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        name="LibTiers"
                                        value={formData.LibTiers || ''}
                                        onChange={handleChange}
                                        placeholder="Nom de l'entreprise..."
                                        className="input-modern pl-11"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2 group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Adresse Complète</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <MapPinIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        name="Adresse"
                                        value={formData.Adresse || ''}
                                        onChange={handleChange}
                                        placeholder="Siège social, Rue, Code Postal..."
                                        className="input-modern pl-11"
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Commercial Assigné</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <UserIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        name="DesRepres"
                                        value={formData.DesRepres || ''}
                                        onChange={handleChange}
                                        className="input-modern pl-11"
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Gouvernorat / Ville</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <TagIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        name="Ville"
                                        value={formData.Ville || ''}
                                        onChange={handleChange}
                                        className="input-modern pl-11"
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Classe</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <TagIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <select
                                        name="Classe"
                                        value={formData.Classe || ''}
                                        onChange={handleChange}
                                        className="input-modern pl-11 text-slate-700 bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">-- Sélectionner --</option>
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="B+">B+</option>
                                    </select>
                                </div>
                            </div>
                            <div className="md:col-span-2 group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Numéro Social / Code Fiscal</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <IdentificationIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        name="Cin"
                                        value={clientCin}
                                        onChange={(e) => setClientCin(e.target.value)}
                                        placeholder="Sélectionnez un client..."
                                        className="input-modern pl-11 font-mono bg-slate-50 cursor-not-allowed"
                                        readOnly
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Fonction</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <BuildingOfficeIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        name="Fonction"
                                        value={formData.Fonction || ''}
                                        onChange={handleChange}
                                        placeholder="Fonction du client..."
                                        className="input-modern pl-11"
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Catégorie</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <TagIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <select
                                        name="Categorie"
                                        value={formData.Categorie || ''}
                                        onChange={handleChange}
                                        className="input-modern pl-11 text-slate-700 bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">-- Sélectionner --</option>
                                        <option value="Privé">Privé</option>
                                        <option value="Étatique">Étatique</option>
                                    </select>
                                </div>
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Domaine</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <BuildingOfficeIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        name="Domaine"
                                        value={formData.Domaine || ''}
                                        onChange={handleChange}
                                        placeholder="Domaine d'activité..."
                                        className="input-modern pl-11"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Billing Address Card (Alternative Address) */}
                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="px-8 py-5 border-b border-slate-100/50 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="icon-shape icon-shape-sm bg-gradient-amber shadow-glow-amber scale-90">
                                    <MapPinIcon className="h-5 w-5 text-white" />
                                </div>
                                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Adresse de Facturation (Optionnelle)</h2>
                            </div>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="group md:col-span-2">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Raison Sociale Facturation</label>
                                <input
                                    type="text"
                                    name="LibTiersA"
                                    value={formData.LibTiersA || ''}
                                    onChange={handleChange}
                                    className="input-modern w-full"
                                    placeholder="Même raison sociale si vide"
                                />
                            </div>
                            <div className="group md:col-span-2">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Adresse Facturation</label>
                                <input
                                    type="text"
                                    name="AdresseA"
                                    value={formData.AdresseA || ''}
                                    onChange={handleChange}
                                    className="input-modern w-full"
                                />
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Ville Facturation</label>
                                <input
                                    type="text"
                                    name="VilleA"
                                    value={formData.VilleA || ''}
                                    onChange={handleChange}
                                    className="input-modern w-full"
                                />
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Fiscal/Code Facturation</label>
                                <input
                                    type="text"
                                    name="CinA"
                                    value={formData.CinA || ''}
                                    onChange={handleChange}
                                    className="input-modern w-full font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Master Configuration Card */}
                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="px-8 py-5 border-b border-slate-100/50 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="icon-shape icon-shape-sm bg-gradient-indigo shadow-glow-indigo scale-90">
                                    <DocumentTextIcon className="h-5 w-5 text-white" />
                                </div>
                                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Configuration</h2>
                            </div>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Numbering */}
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Préfixe</label>
                                <input
                                    type="text"
                                    name="Prfx"
                                    value={formData.Prfx || ''}
                                    onChange={handleChange}
                                    className="input-modern w-full font-mono"
                                    placeholder="DV"
                                    maxLength="50"
                                />
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Suffixe</label>
                                <input
                                    type="text"
                                    name="Sufx"
                                    value={formData.Sufx || ''}
                                    onChange={handleChange}
                                    className="input-modern w-full font-mono"
                                    maxLength="10"
                                />
                            </div>

                            {/* Currency & Exchange */}
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Devise</label>
                                <input
                                    type="text"
                                    name="Devise"
                                    value={formData.Devise || ''}
                                    onChange={handleChange}
                                    className="input-modern w-full font-mono uppercase"
                                    placeholder="TND"
                                    maxLength="10"
                                />
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Code Devise</label>
                                <input
                                    type="text"
                                    name="CodDev"
                                    value={formData.CodDev || ''}
                                    onChange={handleChange}
                                    className="input-modern w-full font-mono"
                                    maxLength="10"
                                />
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Cours Conversion</label>
                                <input
                                    type="number" min="0"
                                    name="Cours"
                                    value={formData.Cours || 1}
                                    onChange={handleChange}
                                    className="input-modern w-full text-right"
                                    step="0.0001"
                                />
                            </div>

                            {/* Classification */}
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Catégorie</label>
                                <input
                                    type="text"
                                    name="categ"
                                    value={formData.categ || ''}
                                    onChange={handleChange}
                                    className="input-modern w-full"
                                    maxLength="30"
                                    placeholder="Type de catégorie"
                                />
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Type de Devis</label>
                                <input
                                    type="text"
                                    name="type"
                                    value={formData.type || ''}
                                    onChange={handleChange}
                                    className="input-modern w-full"
                                    maxLength="30"
                                    placeholder="Standard, Urgente, Spéciale"
                                />
                            </div>

                            {/* Notes & Remarks */}
                            <div className="md:col-span-2 group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Remarques / Notes Internes</label>
                                <textarea
                                    name="Remarq"
                                    value={formData.Remarq || ''}
                                    onChange={handleChange}
                                    className="input-modern w-full min-h-[100px] resize-vertical"
                                    placeholder="Notes internes sur ce devis..."
                                    maxLength="255"
                                />
                            </div>

                            {/* Subject to Tax */}
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Statut Fiscal</label>
                                <input
                                    type="text"
                                    name="AssujTiers"
                                    value={formData.AssujTiers || ''}
                                    onChange={handleChange}
                                    className="input-modern w-full"
                                    placeholder="Assujetti / Exonéré..."
                                    maxLength="30"
                                />
                            </div>

                            {/* Nature of Registration */}
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Nature Enregistrement</label>
                                <input
                                    type="text"
                                    name="NatReg"
                                    value={formData.NatReg || ''}
                                    onChange={handleChange}
                                    className="input-modern w-full"
                                    maxLength="255"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Printing & Documentation */}
                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="px-8 py-5 border-b border-slate-100/50 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="icon-shape icon-shape-sm bg-gradient-rose shadow-glow-rose scale-90">
                                    <DocumentTextIcon className="h-5 w-5 text-white" />
                                </div>
                                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Gestion Impression & Livraison</h2>
                            </div>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">N° Impression A</label>
                                <input
                                    type="text"
                                    name="NImpA"
                                    value={formData.NImpA || ''}
                                    onChange={handleChange}
                                    className="input-modern w-full font-mono"
                                    maxLength="5"
                                />
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">N° Impression B</label>
                                <input
                                    type="text"
                                    name="NImpB"
                                    value={formData.NImpB || ''}
                                    onChange={handleChange}
                                    className="input-modern w-full font-mono"
                                    maxLength="20"
                                />
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Date Impression</label>
                                <input
                                    type="datetime-local"
                                    name="DatImp"
                                    value={formData.DatImp ? new Date(formData.DatImp).toISOString().slice(0, 16) : ''}
                                    onChange={handleChange}
                                    className="input-modern w-full"
                                />
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Date Livraison Prevue</label>
                                <input
                                    type="datetime-local"
                                    name="DatLiv"
                                    value={formData.DatLiv ? new Date(formData.DatLiv).toISOString().slice(0, 16) : ''}
                                    onChange={handleChange}
                                    className="input-modern w-full"
                                />
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Frais / Charges</label>
                                <input
                                    type="number" min="0"
                                    name="Frais"
                                    value={formData.Frais || 0}
                                    onChange={handleChange}
                                    className="input-modern w-full text-right"
                                    step="0.001"
                                />
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Timbre / Droit</label>
                                <input
                                    type="number" min="0"
                                    name="Timbre"
                                    value={formData.Timbre || 0}
                                    onChange={handleChange}
                                    className="input-modern w-full text-right"
                                    step="0.001"
                                />
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">FODEC Total</label>
                                <input
                                    type="number" min="0"
                                    name="TotFodec"
                                    value={formData.TotFodec || 0}
                                    onChange={handleChange}
                                    className="input-modern w-full text-right"
                                    step="0.001"
                                />
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Acompte Forfaitaire</label>
                                <input
                                    type="number" min="0"
                                    name="avanceforf"
                                    value={formData.avanceforf || 0}
                                    onChange={handleChange}
                                    className="input-modern w-full text-right"
                                    step="0.001"
                                />
                            </div>

                            {/* Flags */}
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Flags</label>
                                <div className="flex flex-wrap gap-4 mt-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="Valid"
                                            checked={formData.Valid || false}
                                            onChange={(e) => handleChange({
                                                target: { name: 'Valid', value: e.target.checked }
                                            })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm font-medium text-slate-600">Validé</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="bTransf"
                                            checked={formData.bTransf || false}
                                            onChange={(e) => handleChange({
                                                target: { name: 'bTransf', value: e.target.checked }
                                            })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm font-medium text-slate-600">Transféré</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="bLivr"
                                            checked={formData.bLivr || false}
                                            onChange={(e) => handleChange({
                                                target: { name: 'bLivr', value: e.target.checked }
                                            })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm font-medium text-slate-600">Livré</span>
                                    </label>
                                </div>
                            </div>

                            {/* Contact ID & Driver */}
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">ID Contact</label>
                                <input
                                    type="text"
                                    name="IDContact"
                                    value={formData.IDContact || ''}
                                    onChange={handleChange}
                                    className="input-modern w-full font-mono"
                                    maxLength="40"
                                />
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Code Chauffeur</label>
                                <input
                                    type="text"
                                    name="CodChauff"
                                    value={formData.CodChauff || ''}
                                    onChange={handleChange}
                                    className="input-modern w-full font-mono"
                                    maxLength="50"
                                />
                            </div>
                            <div className="group md:col-span-2">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Chauffeur / Livreur</label>
                                <input
                                    type="text"
                                    name="DesChauff"
                                    value={formData.DesChauff || ''}
                                    onChange={handleChange}
                                    className="input-modern w-full"
                                    maxLength="255"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Line Items Card */}
                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="px-8 py-5 border-b border-slate-100/50 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="icon-shape icon-shape-sm bg-gradient-success shadow-glow-emerald scale-90">
                                    <PlusIcon className="h-5 w-5 text-white" />
                                </div>
                                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Articles & Détails (TabDevd)</h2>
                            </div>
                            <button
                                type="button"
                                onClick={addItem}
                                className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-soft"
                            >
                                + Ajouter Ligne
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/30 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <th className="px-4 py-4 w-6 text-center"></th>
                                        <th className="px-8 py-4 pl-8">Désignation</th>
                                        <th className="px-4 py-4 w-20 text-center">Qté</th>
                                        <th className="px-4 py-4 w-32 text-right">P.U HT</th>
                                        <th className="px-4 py-4 w-24 text-center">TVA</th>
                                        <th className="px-4 py-4 w-32 text-right">Total HT</th>
                                        <th className="px-4 py-4 w-24 text-right">Remise</th>
                                        <th className="px-8 py-4 w-10 pr-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/50">
                                    {items.map((item) => (
                                        <React.Fragment key={item.tempId}>
                                            <tr className="group hover:bg-blue-50/20 transition-all">
                                                <td className="px-4 py-5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleItemExpanded(item.tempId)}
                                                        className="text-slate-400 hover:text-blue-600 transition-colors"
                                                    >
                                                        <ChevronDownIcon className={`h-4 w-4 transition-transform ${expandedItems[item.tempId] ? 'rotate-180' : ''}`} />
                                                    </button>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-col gap-2">
                                                        <input
                                                            type="text"
                                                            value={item.productSearch ?? (item.LibArt ? getProductSearchLabel(item) : '')}
                                                            onFocus={() => setActiveProductRowId(item.tempId)}
                                                            onChange={(e) => handleProductSearchChange(item.tempId, e.target.value)}
                                                            placeholder="Rechercher code ou nom..."
                                                            className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-semibold text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                        />
                                                        <div className="flex gap-2 items-stretch">
                                                            <select
                                                                value={item.IDArt || ''}
                                                                onChange={(e) => handleProductSelect(item.tempId, e.target.value)}
                                                                className="flex-1 bg-white border border-slate-200 rounded px-3 py-2 text-sm font-bold text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                            >
                                                                <option value="">
                                                                    {loadingProducts && activeProductRowId === item.tempId 
                                                                        ? 'Recherche en cours...' 
                                                                        : activeProductRowId === item.tempId && (item.productSearch || '').trim().length >= 2
                                                                        ? `${productOptions.length} produit(s) trouvé(s)`
                                                                        : productOptions.length > 0
                                                                        ? `${productOptions.length} produit(s) disponible(s)`
                                                                        : '-- Sélectionner un produit --'
                                                                    }
                                                                </option>
                                                                {item.IDArt && item.LibArt && (
                                                                    <option value={item.IDArt}>
                                                                        {item.CodArt} - {item.LibArt}
                                                                    </option>
                                                                )}
                                                                {productOptions.length > 0 && (
                                                                    productOptions
                                                                        .filter(product => String(product.IDArt) !== String(item.IDArt))
                                                                        .slice(0, 100)
                                                                        .map(product => (
                                                                        <option key={product.IDArt} value={product.IDArt}>
                                                                            {product.CodArt} - {getProductName(product)}
                                                                        </option>
                                                                    ))
                                                                )}
                                                                {productOptions.length === 0 && activeProductRowId !== item.tempId && (
                                                                    <option value="" disabled>Chargement des produits...</option>
                                                                )}
                                                            </select>
                                                            {productOptions.length === 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => loadProductsList()}
                                                                    className="px-3 py-2 text-[10px] bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100 transition-colors font-semibold whitespace-nowrap"
                                                                    title="Recharger la liste des produits"
                                                                >
                                                                    ⟲ Recharger
                                                                </button>
                                                            )}
                                                        </div>
                                                        {activeProductRowId === item.tempId && !loadingProducts && (item.productSearch || '').trim().length > 0 && (item.productSearch || '').trim().length < 2 && (
                                                            <span className="text-[10px] text-amber-600 font-semibold">
                                                                Saisissez au moins 2 caractères pour lancer la recherche.
                                                            </span>
                                                        )}
                                                        {item.LibArt && (
                                                            <span className="text-[10px] text-slate-500 font-mono italic">
                                                                {item.CodArt} - {item.LibArt}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5">
                                                    <input
                                                        type="number" min="0"
                                                        value={item.Qt || 0}
                                                        onChange={(e) => handleItemChange(item.tempId, 'Qt', parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-black text-blue-600 text-center"
                                                    />
                                                </td>
                                                <td className="px-4 py-5">
                                                    <input
                                                        type="number" min="0"
                                                        value={item.PuHT || 0}
                                                        onChange={(e) => handleItemChange(item.tempId, 'PuHT', parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-bold text-slate-700 text-right"
                                                    />
                                                </td>
                                                <td className="px-4 py-5">
                                                    <select
                                                        value={item.Tva || 19}
                                                        onChange={(e) => handleItemChange(item.tempId, 'Tva', parseInt(e.target.value))}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs font-bold text-slate-400 text-center cursor-pointer hover:text-blue-500 transition-colors"
                                                    >
                                                        <option value="19">19%</option>
                                                        <option value="13">13%</option>
                                                        <option value="7">7%</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-5 text-sm font-black text-slate-800 text-right">
                                                    {(item.Qt * item.PuHT).toLocaleString(undefined, { minimumFractionDigits: 3 })}
                                                </td>
                                                <td className="px-4 py-5">
                                                    <input
                                                        type="number" min="0"
                                                        value={item.MntRem || 0}
                                                        onChange={(e) => handleItemChange(item.tempId, 'MntRem', parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-bold text-rose-600 text-right"
                                                        placeholder="0"
                                                    />
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(item.tempId)}
                                                        className="text-slate-300 hover:text-rose-500 transition-colors transform group-hover:scale-110"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Expandable Detail Row */}
                                            {expandedItems[item.tempId] && (
                                                <tr className="bg-blue-50/20">
                                                    <td colSpan="8" className="px-8 py-8">
                                                        <div className="space-y-8">
                                                            {/* Section: Description */}
                                                            <div className="border-b border-slate-200 pb-6">
                                                                <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                                                                    Description & Détails
                                                                </h4>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className="group md:col-span-2">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Description Étendue</label>
                                                                        <textarea
                                                                            value={item.ExLibArt || ''}
                                                                            onChange={(e) => handleItemChange(item.tempId, 'ExLibArt', e.target.value)}
                                                                            className="input-modern w-full min-h-[80px] resize-vertical text-sm"
                                                                            maxLength="1000"
                                                                            placeholder="Description détaillée du produit..."
                                                                        />
                                                                    </div>
                                                                    <div className="group">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Code Barre</label>
                                                                        <input
                                                                            type="text"
                                                                            value={item.Codabar || ''}
                                                                            onChange={(e) => handleItemChange(item.tempId, 'Codabar', e.target.value)}
                                                                            className="input-modern w-full text-sm font-mono text-slate-600"
                                                                            maxLength="50"
                                                                            placeholder="EAN-13"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Section: Attributes */}
                                                            <div className="border-b border-slate-200 pb-6">
                                                                <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                                                                    Attributs (Couleur & Taille)
                                                                </h4>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                                    <div className="group">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Code Couleur</label>
                                                                        <input
                                                                            type="text"
                                                                            value={item.CodColor || ''}
                                                                            onChange={(e) => handleItemChange(item.tempId, 'CodColor', e.target.value)}
                                                                            className="input-modern w-full text-sm"
                                                                            maxLength="10"
                                                                            placeholder="Ex: BLU"
                                                                        />
                                                                    </div>
                                                                    <div className="group">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Couleur</label>
                                                                        <input
                                                                            type="text"
                                                                            value={item.DesColor || ''}
                                                                            onChange={(e) => handleItemChange(item.tempId, 'DesColor', e.target.value)}
                                                                            className="input-modern w-full text-sm"
                                                                            maxLength="50"
                                                                            placeholder="Bleu foncé"
                                                                        />
                                                                    </div>
                                                                    <div className="group">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Code Taille</label>
                                                                        <input
                                                                            type="text"
                                                                            value={item.CodTaille || ''}
                                                                            onChange={(e) => handleItemChange(item.tempId, 'CodTaille', e.target.value)}
                                                                            className="input-modern w-full text-sm"
                                                                            maxLength="10"
                                                                            placeholder="XL"
                                                                        />
                                                                    </div>
                                                                    <div className="group">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Taille</label>
                                                                        <input
                                                                            type="text"
                                                                            value={item.Taille || ''}
                                                                            onChange={(e) => handleItemChange(item.tempId, 'Taille', e.target.value)}
                                                                            className="input-modern w-full text-sm"
                                                                            maxLength="10"
                                                                            placeholder="Extra Large"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Section: Pricing */}
                                                            <div className="border-b border-slate-200 pb-6">
                                                                <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600"></span>
                                                                    Tarification
                                                                </h4>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                    <div className="group">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Prix Public (PvPub)</label>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="number" min="0"
                                                                                value={item.PvPub || 0}
                                                                                onChange={(e) => handleItemChange(item.tempId, 'PvPub', parseFloat(e.target.value) || 0)}
                                                                                className="input-modern w-full text-sm text-right font-semibold text-slate-700"
                                                                                step="0.001"
                                                                                placeholder="0.000"
                                                                            />
                                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">TND</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="group">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">P.U Devis</label>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="number" min="0"
                                                                                value={item.PuDev || 0}
                                                                                onChange={(e) => handleItemChange(item.tempId, 'PuDev', parseFloat(e.target.value) || 0)}
                                                                                className="input-modern w-full text-sm text-right font-semibold text-blue-600"
                                                                                step="0.001"
                                                                                placeholder="0.000"
                                                                            />
                                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">TND</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="group">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">P.U TTC</label>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="number" min="0"
                                                                                value={item.PuTTC || 0}
                                                                                onChange={(e) => handleItemChange(item.tempId, 'PuTTC', parseFloat(e.target.value) || 0)}
                                                                                className="input-modern w-full text-sm text-right font-semibold text-slate-700 bg-slate-50"
                                                                                step="0.001"
                                                                                placeholder="0.000"
                                                                            />
                                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">TND</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Section: Line Amounts */}
                                                            <div className="border-b border-slate-200 pb-6">
                                                                <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
                                                                    Montants de la Ligne
                                                                </h4>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                                    <div className="group">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Montant HT</label>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="number" min="0"
                                                                                value={item.MntHT || 0}
                                                                                onChange={(e) => handleItemChange(item.tempId, 'MntHT', parseFloat(e.target.value) || 0)}
                                                                                className="input-modern w-full text-sm text-right font-bold text-slate-700"
                                                                                step="0.001"
                                                                            />
                                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">TND</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="group">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Montant TVA (19%)</label>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="number" min="0"
                                                                                value={item.MntTVA || 0}
                                                                                onChange={(e) => handleItemChange(item.tempId, 'MntTVA', parseFloat(e.target.value) || 0)}
                                                                                className="input-modern w-full text-sm text-right font-bold text-amber-600"
                                                                                step="0.001"
                                                                            />
                                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">TND</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="group">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Montant FODEC</label>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="number" min="0"
                                                                                value={item.MntFodec || 0}
                                                                                onChange={(e) => handleItemChange(item.tempId, 'MntFodec', parseFloat(e.target.value) || 0)}
                                                                                className="input-modern w-full text-sm text-right font-bold text-emerald-600"
                                                                                step="0.001"
                                                                            />
                                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">TND</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="group">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Frais / Transport</label>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="number" min="0"
                                                                                value={item.MntFrais || 0}
                                                                                onChange={(e) => handleItemChange(item.tempId, 'MntFrais', parseFloat(e.target.value) || 0)}
                                                                                className="input-modern w-full text-sm text-right font-bold text-slate-700"
                                                                                step="0.001"
                                                                            />
                                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">TND</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Section: Delivery & Import */}
                                                            <div>
                                                                <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
                                                                    Livraison & Suivi
                                                                </h4>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                                    <div className="group">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">N° Document Livraison</label>
                                                                        <input
                                                                            type="text"
                                                                            value={item.NumBL || ''}
                                                                            onChange={(e) => handleItemChange(item.tempId, 'NumBL', e.target.value)}
                                                                            className="input-modern w-full text-sm font-mono"
                                                                            maxLength="30"
                                                                            placeholder="BL-2024-001"
                                                                        />
                                                                    </div>
                                                                    <div className="group">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Date Livraison</label>
                                                                        <input
                                                                            type="datetime-local"
                                                                            value={item.DateBL ? new Date(item.DateBL).toISOString().slice(0, 16) : ''}
                                                                            onChange={(e) => handleItemChange(item.tempId, 'DateBL', e.target.value)}
                                                                            className="input-modern w-full text-sm"
                                                                        />
                                                                    </div>
                                                                    <div className="group">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">N° Import</label>
                                                                        <input
                                                                            type="text"
                                                                            value={item.NumImport || ''}
                                                                            onChange={(e) => handleItemChange(item.tempId, 'NumImport', e.target.value)}
                                                                            className="input-modern w-full text-sm font-mono"
                                                                            maxLength="50"
                                                                            placeholder="IMP-2024-001"
                                                                        />
                                                                    </div>
                                                                    <div className="group">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Date Import</label>
                                                                        <input
                                                                            type="datetime-local"
                                                                            value={item.DatImport ? new Date(item.DatImport).toISOString().slice(0, 16) : ''}
                                                                            onChange={(e) => handleItemChange(item.tempId, 'DatImport', e.target.value)}
                                                                            className="input-modern w-full text-sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right: Totals & Submit */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="card-luxury p-0 overflow-hidden sticky top-8">
                        <div className="px-8 py-6 border-b border-slate-100/50 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="icon-shape icon-shape-sm bg-gradient-blue shadow-glow-blue scale-90">
                                    <CalculatorIcon className="h-5 w-5 text-white" />
                                </div>
                                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-sans">Résumé Financier</h2>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100 border-dashed">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base HT</span>
                                    <span className="text-sm font-bold text-slate-700">{(formData.TotHT || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })} <span className="text-[10px]">TND</span></span>
                                </div>
                                <div className="group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 inline-block px-1">Remise Totale</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <CurrencyDollarIcon className="h-4 w-4 text-rose-400" />
                                        </div>
                                        <input
                                            type="number" min="0"
                                            name="TotRem"
                                            value={formData.TotRem}
                                            onChange={handleChange}
                                            className="input-modern pl-11 text-right font-black text-rose-600 border-rose-100 bg-rose-50/20 focus:ring-rose-200 shadow-sm"
                                            placeholder="0.000"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center px-4">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TVA Consolidée</span>
                                    <span className="text-sm font-bold text-slate-600">{(formData.TotTva || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })} TND</span>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-100 flex flex-col items-center gap-2">
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Net à Payer (TTC)</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-slate-800 tracking-tighter">
                                        {(formData.TotTTC || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })}
                                    </span>
                                    <span className="text-sm font-black text-slate-400 uppercase">TND</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-5 bg-gradient-blue text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-glow-blue hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {saving ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <CheckIcon className="h-5 w-5 stroke-[3]" />
                                        Confirmer & Enregistrer
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default DevisForm;
