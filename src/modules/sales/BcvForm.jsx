import { useState, useEffect, useRef } from 'react';
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
    ChevronDownIcon,
    XMarkIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { updateBcv, createBcv, fetchBcv, fetchBcvById, clearCurrentBcv } from './bcvSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import axiosInstance from '../../app/axios';
import { useLookupTables } from '../../hooks/useLookupTables';
import { motion, AnimatePresence } from 'framer-motion';

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

const normalizeSearchText = (value = '') => {
    return String(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
};

const BcvForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isEdit = Boolean(id);
    const { currentBcv, loading: loadingSlice } = useSelector((state) => state.bcv);
    
    // Charger les tables de lookup (Classe, Gouvernorat, Catégorie)
    const { tiersClasses, tiersGouvernorats, tiersCategories, loading: lookupsLoading } = useLookupTables();

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [productOptions, setProductOptions] = useState([]);
    const [productLookup, setProductLookup] = useState({});
    const [clients, setClients] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingClients, setLoadingClients] = useState(true);
    const [expandedItems, setExpandedItems] = useState({});
    const [activeProductRowId, setActiveProductRowId] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [clientSearch, setClientSearch] = useState('');
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const clientDropdownRef = useRef(null);
    const [projects, setProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState('');

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
        Prfx: 'BC',
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

    // Cin is stored separately - it's a Tiers field, not part of BcvMaster
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
                const limit = 1000;
                let page = 1;
                let hasNext = true;
                const collected = [];

                while (hasNext && page <= 500) {
                    const response = await axiosInstance.get('/tiers', {
                        params: {
                            limit,
                            page
                        }
                    });

                    const payload = response?.data ? response.data : response;
                    const rows = Array.isArray(payload)
                        ? payload
                        : (Array.isArray(payload?.data) ? payload.data : []);

                    collected.push(...rows);

                    if (payload?.pagination && typeof payload.pagination.hasNext === 'boolean') {
                        hasNext = payload.pagination.hasNext;
                    } else {
                        hasNext = rows.length === limit;
                    }

                    page += 1;
                }

                const uniqueByCode = new Map();
                collected.forEach((client) => {
                    if (!client?.CodTiers) return;
                    uniqueByCode.set(client.CodTiers, client);
                });

                setClients(Array.from(uniqueByCode.values()));
            } catch (error) {
                console.error('Error fetching clients:', error);
                toast.error('Erreur lors du chargement des clients');
            } finally {
                setLoadingClients(false);
            }
        };
        fetchClients();
    }, []);

    // Close client dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target)) {
                setShowClientDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isEdit && id) {
            dispatch(fetchBcvById(id));
        } else {
            dispatch(clearCurrentBcv());
            setLoading(false);
        }
    }, [id, isEdit, dispatch]);

    useEffect(() => {
        if (isEdit && currentBcv) {
            const { details, client, ...master } = currentBcv;

            const tierClasseId = client?.Classe;
            const tierGouvernoratId = client?.Gouvernorat ?? client?.gouvernorat;
            const tierCategorieId = client?.Categorie;

            const classeLabel = tiersClasses.find(c => String(c.id) === String(tierClasseId))?.libelle || '';
            const gouvernoratLabel = tiersGouvernorats.find(g => String(g.id) === String(tierGouvernoratId))?.libelle || '';
            const categorieLabel = tiersCategories.find(c => String(c.id) === String(tierCategorieId))?.libelle || '';

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
                IsConverted: master.IsConverted || false,
                Classe: master.Classe || classeLabel,
                Categorie: master.Categorie || categorieLabel,
                Ville: master.Ville || client?.Ville || gouvernoratLabel,
                MapsRegion: master.MapsRegion || client?.MapsRegion || ''
            });

            setClientSearch(master.LibTiers || client?.Raisoc || '');
            setClientCin(client?.Cin || '');

            if (details && details.length > 0) {
                setItems(details.map(d => ({ ...d, tempId: d.NoDetail || Math.random() })));
            }
            setLoading(false);
        }
    }, [currentBcv, isEdit, tiersClasses, tiersGouvernorats, tiersCategories]);

    useEffect(() => {
        const codTiers = String(formData.CodTiers || '').trim();
        const storedProjectId = String(formData.CodProject || '').trim();

        if (!codTiers) {
            setProjects([]);
            setSelectedProjectId('');
            return;
        }

        const fetchProjects = async () => {
            try {
                setLoadingProjects(true);
                const response = await axiosInstance.get(`/projets/client/${encodeURIComponent(codTiers)}`);
                const payload = response?.data?.data || response?.data || [];
                const list = Array.isArray(payload) ? payload : [];
                setProjects(list);

                if (storedProjectId && list.some((project) => String(project.ID_Projet) === storedProjectId)) {
                    setSelectedProjectId(storedProjectId);
                } else {
                    setSelectedProjectId('');
                }
            } catch (error) {
                console.error('Error fetching client projects:', error);
                setProjects([]);
                setSelectedProjectId('');
            } finally {
                setLoadingProjects(false);
            }
        };

        fetchProjects();
    }, [formData.CodTiers, formData.CodProject]);

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
            setSelectedProjectId('');
            setFormData(prev => ({
                ...prev,
                CodTiers: selectedClient.CodTiers,
                LibTiers: selectedClient.Raisoc || '',   // Tiers uses Raisoc, BcvMaster stores it as LibTiers
                Adresse: selectedClient.Adresse || '',
                Ville: selectedClient.Ville || '',
            }));
            // Cin belongs to Tiers model, not BcvMaster - keep separate
            setClientCin(selectedClient.Cin || '');
            setClientSearch(selectedClient.Raisoc || selectedClient.CodTiers || '');
            setShowClientDropdown(false);
        }
    };

    const filteredClients = clients.filter(client => {
        if (!clientSearch) return true;
        const search = normalizeSearchText(clientSearch);
        return (
            (client.Raisoc && normalizeSearchText(client.Raisoc).includes(search)) ||
            (client.CodTiers && normalizeSearchText(client.CodTiers).includes(search)) ||
            (client.Email && normalizeSearchText(client.Email).includes(search))
        );
    });

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
                ProjectId: selectedProjectId || null,
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
                await dispatch(updateBcv({ id, payload })).unwrap();
                toast.success('Bcv mis à jour');
            } else {
                await dispatch(createBcv(payload)).unwrap();
                toast.success('Bcv créé avec succès');
            }

            // Force list refresh before redirect so updated lookup labels appear immediately.
            await dispatch(fetchBcv({ page: 1, limit: 1000 })).unwrap();
            navigate('/bcv');
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
                        onClick={() => navigate('/bcv')}
                        className="h-11 w-11 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 rounded-xl transition-all shadow-soft flex items-center justify-center font-bold"
                    >
                        <ArrowLeftIcon className="h-5 w-5 stroke-[2.5]" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="badge badge-primary">
                                <DocumentTextIcon className="h-3 w-3 mr-1" />
                                Ventes & Commandes
                            </span>
                        </div>
                        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                            {isEdit ? `Modification BC N°${formData.Nf}` : 'Nouveau Bon de Commande'}
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
                        form="Bcv-form"
                        type="submit"
                        disabled={saving}
                        className="btn-soft-primary flex items-center gap-2 px-8"
                    >
                        {saving ? (
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <CheckIcon className="h-4 w-4 stroke-[3]" />
                        )}
                        {isEdit ? 'Mettre à jour' : 'Finaliser la Commande'}
                    </button>
                </div>
            </div>

            <form id="Bcv-form" onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 font-sans">
                <div className="space-y-8">

                    {/* Step 1: Client Info */}
                    <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                    <motion.div 
                        key="step1"
                        initial={{ opacity: 0, y: 30, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.95 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-8"
                    >
                    {/* Client Info Card */}
                    <div className="card-luxury p-0 overflow-hidden border-none shadow-soft-xl bg-white/60">
                        <div className="px-8 py-6 border-b border-blue-50 bg-gradient-to-r from-white via-blue-50/20 to-white flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                    <UserGroupIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none mb-1.5">Informations Client</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                        <span className="h-1 w-1 rounded-full bg-blue-400"></span> Étape 01 : Identification
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Référentiel Tiers</span>
                                {formData.CodTiers && <span className="text-[9px] font-mono text-slate-400">#{formData.CodTiers}</span>}
                            </div>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Client Selector with Search */}
                            <div className="group md:col-span-2 relative" ref={clientDropdownRef}>
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Rechercher un Client</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <UserGroupIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={clientSearch}
                                        onChange={(e) => {
                                            setClientSearch(e.target.value);
                                            setShowClientDropdown(true);
                                            if (formData.CodTiers && !clients.some(c => c.Raisoc === e.target.value || c.CodTiers === e.target.value)) {
                                                setFormData(prev => ({ ...prev, CodTiers: '', LibTiers: '' }));
                                            }
                                        }}
                                        onFocus={() => setShowClientDropdown(true)}
                                        placeholder="Tapez pour rechercher un client..."
                                        className="input-modern pl-11 pr-10 w-full text-slate-700 bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        autoComplete="off"
                                    />
                                    {clientSearch && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setClientSearch('');
                                                setFormData(prev => ({ ...prev, CodTiers: '', LibTiers: '' }));
                                                setShowClientDropdown(false);
                                            }}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        >
                                            <XMarkIcon className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                                        </button>
                                    )}
                                </div>

                                {showClientDropdown && filteredClients.length > 0 && (
                                    <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                                        {filteredClients.map(client => (
                                            <button
                                                key={client.CodTiers}
                                                type="button"
                                                onClick={() => handleClientSelect(client.CodTiers)}
                                                className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 ${formData.CodTiers === client.CodTiers ? 'bg-blue-50' : ''}`}
                                            >
                                                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                                    <UserGroupIcon className="h-4 w-4 text-slate-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 truncate">{client.Raisoc || 'Sans nom'}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono">{client.CodTiers}</p>
                                                </div>
                                                {formData.CodTiers === client.CodTiers && (
                                                    <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {showClientDropdown && clientSearch && filteredClients.length === 0 && (
                                    <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl p-4">
                                        <p className="text-sm text-slate-500 text-center">Aucun client trouvé pour "{clientSearch}"</p>
                                    </div>
                                )}

                                {formData.CodTiers && !showClientDropdown && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                                        <CheckCircleIcon className="h-4 w-4" />
                                        <span>Client sélectionné: <strong>{formData.LibTiers}</strong></span>
                                    </div>
                                )}
                            </div>

                            {formData.CodTiers && (
                                <div className="md:col-span-2">
                                    <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Projet associé (optionnel)</label>
                                    <select
                                        value={selectedProjectId}
                                        onChange={(e) => setSelectedProjectId(e.target.value)}
                                        className="input-modern"
                                        disabled={loadingProjects}
                                    >
                                        <option value="">Sans projet lié</option>
                                        {projects.map((project) => (
                                            <option key={project.ID_Projet} value={project.ID_Projet}>
                                                {project.Nom_Projet || project.Code_Pro || project.ID_Projet}
                                                {project.CodDev ? ` | Devis ${project.CodDev}` : ''}
                                                {project.CodBc ? ` | BC ${project.CodBc}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-2 text-xs text-slate-500">
                                        {loadingProjects
                                            ? 'Chargement des projets du client...'
                                            : 'Ce lien est facultatif. Il sera enregistré dans TabProjet uniquement à la création ou la modification du BC.'}
                                    </p>
                                </div>
                            )}

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
                                        <MapPinIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <select
                                        name="Ville"
                                        value={formData.Ville || ''}
                                        onChange={handleChange}
                                        className="input-modern pl-11 text-slate-700 bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">-- Sélectionner --</option>
                                        {tiersGouvernorats.map(gov => (
                                            <option key={gov.id} value={gov.libelle}>
                                                {gov.libelle}
                                            </option>
                                        ))}
                                    </select>
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
                                        {tiersClasses.map(classe => (
                                            <option key={classe.id} value={classe.libelle}>
                                                {classe.libelle}
                                            </option>
                                        ))}
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
                                        {tiersCategories.map(cat => (
                                            <option key={cat.id} value={cat.libelle}>
                                                {cat.libelle}
                                            </option>
                                        ))}
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
                    {/* Next Button for Step 1 */}
                    <div className="flex justify-end pt-6">
                        <button type="button" onClick={() => setCurrentStep(2)} className="group py-4 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 active:scale-95 transition-all">
                            Suivant : Configuration <ArrowLeftIcon className="h-4 w-4 rotate-180 stroke-[3] group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    </motion.div>
                    )}
                    </AnimatePresence>

                    {/* Step 2: Paramètres */}
                    <AnimatePresence mode="wait">
                    {currentStep === 2 && (
                    <motion.div 
                        key="step2"
                        initial={{ opacity: 0, y: 30, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.95 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-8"
                    >
                    {/* Master Configuration Card */}
                    <div className="card-luxury p-0 overflow-hidden border-none shadow-soft-xl bg-white/60">
                        <div className="px-8 py-6 border-b border-blue-50 bg-gradient-to-r from-white via-blue-50/20 to-white flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                    <DocumentTextIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest leading-none mb-1.5">Configuration Globale</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                        <span className="h-1 w-1 rounded-full bg-indigo-400"></span> Étape 02 : Paramètres Master
                                    </p>
                                </div>
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
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Devise de la transaction</label>
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
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Code Bcve</label>
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
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Type de Bcv</label>
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
                                    placeholder="Notes internes sur ce Bcv..."
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
                    {/* Navigation Buttons for Step 2 */}
                    <div className="flex justify-between pt-6">
                        <button type="button" onClick={() => setCurrentStep(1)} className="py-4 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 bg-white text-slate-600 border-2 border-slate-100 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95">
                            <ArrowLeftIcon className="h-4 w-4 stroke-[3]" /> Retour au Client
                        </button>
                        <button type="button" onClick={() => setCurrentStep(3)} className="group py-4 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 active:scale-95 transition-all">
                            Continuer : Articles <ArrowLeftIcon className="h-4 w-4 rotate-180 stroke-[3] group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    </motion.div>
                    )}
                    </AnimatePresence>

                    {/* Step 3: Simplified Articles Management */}
                    <AnimatePresence mode="wait">
                    {currentStep === 3 && (
                    <motion.div 
                        key="step3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            {/* Simple Header */}
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Articles & Détails</h2>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                                >
                                    <PlusIcon className="h-4 w-4 stroke-[3]" /> Ajouter un article
                                </button>
                            </div>

                            {/* Minimalist List */}
                            <div className="divide-y divide-slate-100">
                                {items.length === 0 && (
                                    <div className="text-center py-12 text-slate-400 text-xs italic">
                                        Aucun article ajouté. Utilisez le bouton ci-dessus pour commencer.
                                    </div>
                                )}
                                {items.map((item, index) => (
                                    <div key={item.tempId} className="p-4 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                            {/* Index & Search */}
                                            <div className="flex items-center gap-3 flex-1 w-full">
                                                <span className="text-[10px] font-bold text-slate-300 w-4">{index + 1}</span>
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        value={item.productSearch ?? (item.LibArt ? getProductSearchLabel(item) : '')}
                                                        onFocus={() => setActiveProductRowId(item.tempId)}
                                                        onChange={(e) => handleProductSearchChange(item.tempId, e.target.value)}
                                                        placeholder="Rechercher article..."
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-400 transition-all"
                                                    />
                                                </div>
                                                <select
                                                    value={item.IDArt || ''}
                                                    onChange={(e) => handleProductSelect(item.tempId, e.target.value)}
                                                    className="w-48 bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs font-semibold text-slate-600 focus:border-blue-400"
                                                >
                                                    <option value="">
                                                        {loadingProducts && activeProductRowId === item.tempId ? 'Chargement...' : '-- Sélectionner --'}
                                                    </option>
                                                    {item.IDArt && <option value={item.IDArt}>{item.CodArt} - {item.LibArt}</option>}
                                                    {productOptions.map(p => (
                                                        <option key={p.IDArt} value={p.IDArt}>{p.CodArt} - {getProductName(p)}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Price & Qty Row */}
                                            <div className="flex items-center gap-3 w-full md:w-auto">
                                                <div className="flex flex-col items-center">
                                                    <label className="text-[8px] font-bold text-slate-400 uppercase mb-1">Qté</label>
                                                    <input type="number" min="0" value={item.Qt || 0} onChange={(e) => handleItemChange(item.tempId, 'Qt', parseFloat(e.target.value) || 0)}
                                                        className="w-16 text-center border border-slate-200 rounded-lg py-1.5 text-xs font-bold text-blue-600" />
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <label className="text-[8px] font-bold text-slate-400 uppercase mb-1">P.U HT</label>
                                                    <input type="number" min="0" value={item.PuHT || 0} onChange={(e) => handleItemChange(item.tempId, 'PuHT', parseFloat(e.target.value) || 0)}
                                                        className="w-24 text-right border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700" />
                                                </div>
                                                <div className="flex flex-col items-end min-w-[80px]">
                                                    <label className="text-[8px] font-bold text-slate-400 uppercase mb-1">Total HT</label>
                                                    <span className="text-xs font-black text-slate-700">{(item.MntHT || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
                                                </div>
                                                <div className="flex gap-1 ml-2">
                                                    <button type="button" onClick={() => toggleItemExpanded(item.tempId)} className={`p-2 rounded-lg ${expandedItems[item.tempId] ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}>
                                                        <ChevronDownIcon className={`h-4 w-4 transition-transform ${expandedItems[item.tempId] ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    <button type="button" onClick={() => removeItem(item.tempId)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg">
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Simplified Expandable */}
                                        <AnimatePresence>
                                            {expandedItems[item.tempId] && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-slate-50/30 rounded-lg mt-3">
                                                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div>
                                                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">TVA (%)</label>
                                                            <input type="number" value={item.Tva || 19} onChange={(e) => handleItemChange(item.tempId, 'Tva', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs font-semibold" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Remise (%)</label>
                                                            <input type="number" value={item.Remise || 0} onChange={(e) => handleItemChange(item.tempId, 'Remise', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs font-semibold" />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Observation</label>
                                                            <input type="text" value={item.Observation || ''} onChange={(e) => handleItemChange(item.tempId, 'Observation', e.target.value)} className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs font-semibold" maxLength="255" />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>

                            {/* Clean Totals Row */}
                            {items.length > 0 && (
                                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{items.length} Article(s)</span>
                                    <div className="flex gap-8">
                                        <div className="text-right">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">Total HT</p>
                                            <p className="text-sm font-black text-slate-600">{(formData.TotHT || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-bold text-blue-500 uppercase">Net TTC</p>
                                            <p className="text-sm font-black text-blue-600">{(formData.TotTTC || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between pt-4">
                            <button type="button" onClick={() => setCurrentStep(2)} className="py-3 px-8 rounded-xl font-bold uppercase text-[10px] bg-white text-slate-500 border border-slate-200 hover:bg-slate-50">
                                Précédent
                            </button>
                            <button type="button" onClick={() => setCurrentStep(4)} className="py-3 px-10 rounded-xl font-bold uppercase text-[10px] bg-blue-600 text-white shadow-md hover:bg-blue-700">
                                Valider la Commande
                            </button>
                        </div>
                    </motion.div>
                    )}
                    </AnimatePresence>

                    {/* Step 4: Final Validation */}
                    <AnimatePresence mode="wait">
                    {currentStep === 4 && (
                    <motion.div 
                        key="step4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="max-w-xl mx-auto space-y-6"
                    >
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm p-8 space-y-8">
                            <div className="text-center space-y-2">
                                <h2 className="text-lg font-black text-slate-800">Résumé Final</h2>
                                <p className="text-xs text-slate-400 font-medium">Vérifiez les montants avant de confirmer</p>
                            </div>

                            <div className="space-y-4 divide-y divide-slate-100">
                                <div className="flex justify-between py-2">
                                    <span className="text-xs font-medium text-slate-500">Total Hors Taxe</span>
                                    <span className="text-xs font-bold text-slate-800">{(formData.TotHT || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })} TND</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-xs font-medium text-slate-500">Total TVA</span>
                                    <span className="text-xs font-bold text-slate-800">{(formData.TotTva || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })} TND</span>
                                </div>
                                <div className="flex justify-between py-4">
                                    <span className="text-sm font-black text-slate-900">NET À PAYER</span>
                                    <span className="text-xl font-black text-blue-600">{(formData.TotTTC || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })} TND</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {saving ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>Confirmer l'enregistrement</>
                                )}
                            </button>
                            <button type="button" onClick={() => setCurrentStep(3)} className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">
                                Retour aux articles
                            </button>
                        </div>
                    </motion.div>
                    )}
                    </AnimatePresence>
                </div>
            </form>
        </div>
    );
};

export default BcvForm;
