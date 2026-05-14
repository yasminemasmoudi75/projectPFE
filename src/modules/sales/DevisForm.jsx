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
import { updateDevis, createDevis, fetchDevis, fetchDevisById, clearCurrentDevis } from './devisSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import axiosInstance from '../../app/axios';
import { useLookupTables } from '../../hooks/useLookupTables';
import useAuth from '../../hooks/useAuth';
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
    'Frais', 'MntTotDev', 'Cours', 'MntDebit', 'MntCredit', 'CodCateg'
    // NOTE: Timbre, avanceforf, Rest, MntAv retirés - uniquement pour Facture
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

const calculateDetailAmounts = (item = {}) => {
    const qt = toNonNegativeNumber(item.Qt, 0);
    const puHT = toNonNegativeNumber(item.PuHT, 0);
    const remisePercent = toNonNegativeNumber(item.Remise, 0);
    const tva = toNonNegativeNumber(item.Tva, 0);

    const brutHT = qt * puHT;
    const mntRem = brutHT * (remisePercent / 100);
    const mntHT = Math.max(0, brutHT - mntRem);
    const mntTVA = mntHT * (tva / 100);

    return {
        ...item,
        MntRem: mntRem,
        MntTVA: mntTVA,
        MntHT: mntHT,
        MntFodec: toNonNegativeNumber(item.MntFodec, 0),
        MntFrais: toNonNegativeNumber(item.MntFrais, 0),
        PuTTC: puHT + (puHT * (tva / 100))
    };
};

const createDetailItem = (overrides = {}) => calculateDetailAmounts({
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
    productSearch: '',
    ...overrides
});

const DevisForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isEdit = Boolean(id);
    const { currentDevis, loading: loadingSlice, error: devisError } = useSelector((state) => state.devis);

    // Charger les tables de lookup (Classe, Gouvernorat, Catégorie)
    const { tiersClasses, tiersGouvernorats, tiersCategories, loading: lookupsLoading } = useLookupTables();

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [allProductOptions, setAllProductOptions] = useState([]);
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

    const [commercials, setCommercials] = useState([]);
    const [loadingCommercials, setLoadingCommercials] = useState(false);
    const { user, isAdmin, isCommercial, isAgent } = useAuth();

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

            console.log('📡 Raw API Response:', response);

            const payload = response?.data ?? response;
            console.log('📦 Payload structure:', {
                hasData: !!payload?.data,
                hasPagination: !!payload?.pagination,
                payloadType: Array.isArray(payload) ? 'Array' : typeof payload,
                payloadKeys: Array.isArray(payload) ? 'N/A' : Object.keys(payload || {})
            });

            let list = Array.isArray(payload) ? payload : payload?.data;

            console.log('✅ Extracted list:', {
                isArray: Array.isArray(list),
                length: Array.isArray(list) ? list.length : 'N/A',
                firstItem: Array.isArray(list) && list.length > 0 ? {
                    IDArt: list[0].IDArt,
                    CodArt: list[0].CodArt,
                    LibArt: list[0].LibArt
                } : 'N/A'
            });

            if (!Array.isArray(list)) {
                console.warn('⚠️ Response data is not an array:', payload);
                list = [];
            }

            if (list.length === 0) {
                console.warn('⚠️ No products returned from API');
                toast.error('⚠️ Aucun produit trouvé. Vérifiez: 1) Articles en base (TabStock), 2) Permissions utilisateur, 3) Filtres');
                // ✅ Réinitialiser explicitement pour éviter le cache d'une recherche précédente
                setAllProductOptions([]);
                setProductOptions([]);
                setProductLookup({});
                return;
            }

            const normalizedProducts = list
                .filter(p => p && (p.IDArt || p.Guid)) // Only include valid products
                .map(normalizeProduct);

            console.log(`✅ Successfully normalized ${normalizedProducts.length} products`);
            if (list.length !== normalizedProducts.length) {
                console.warn(`⚠️ ${list.length - normalizedProducts.length} products were filtered out (missing IDArt/Guid)`);
            }

            setAllProductOptions(normalizedProducts);
            setProductOptions(normalizedProducts);
            setProductLookup((prev) => {
                const nextLookup = { ...prev };
                normalizedProducts.forEach((product) => {
                    nextLookup[String(product.IDArt)] = product;
                });
                return nextLookup;
            });
        } catch (error) {
            console.error('❌ ERROR loading products:', error);
            console.error('   Status:', error.response?.status);
            console.error('   Error Data:', error.response?.data);
            console.error('   Error Message:', error.message);
            
            // ✅ Afficher l'erreur détaillée à l'utilisateur
            let errorMsg = 'Erreur lors du chargement des produits';
            if (error.response?.status === 403) {
                errorMsg = '🔒 Permissions insuffisantes pour accéder aux articles';
            } else if (error.response?.status === 401) {
                errorMsg = '🔑 Session expirée - reconnexion requise';
            } else if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            } else if (error.message) {
                errorMsg = error.message;
            }
            
            toast.error('❌ ' + errorMsg);
            
            // ✅ Réinitialiser explicitement
            setAllProductOptions([]);
            setProductOptions([]);
            setProductLookup({});
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

        // Addresses - Adresse livraison uniquement
        Adresse: '',
        Ville: '',
        // NOTE: LibTiersA, AdresseA, VilleA, CinA retirés - uniquement pour Facture

        // Client Details - Info de base uniquement
        Cin: '',
        // NOTE: AssujTiers retiré - uniquement pour Facture

        // Financial - Grand Totals
        TotHT: 0,
        TotTva: 0,
        TotFodec: 0,
        TotRem: 0,
        TotTTC: 0,

        // Financial - Details
        Frais: 0,
        MntTotDev: 0,
        // NOTE: Timbre retiré - uniquement pour Facture

        // Documentation
        NatReg: '',
        NbrLett: '',

        // NOTE: Printing (NImpA, NImpB, DatImp) retiré - uniquement pour Facture

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
        Responsable: '',
        Tel: '',

        // Legacy/Metadata
        IsConverted: false,
        MntDebit: 0,
        MntCredit: 0,
        // NOTE: Rest, NFav, MntAv retirés - uniquement pour Facture
        CodCateg: 0
    });

    // Cin is stored separately - it's a Tiers field, not part of DevisMaster
    const [clientCin, setClientCin] = useState('');

    const [items, setItems] = useState([
        createDetailItem()
    ]);

    const activeProductSearch = items.find(item => item.tempId === activeProductRowId)?.productSearch?.trim() || '';

    useEffect(() => {
        if (!activeProductRowId) {
            setLoadingProducts(false);
            return;
        }

        if (activeProductSearch.length < 2) {
            setProductOptions(allProductOptions);
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
    }, [activeProductRowId, activeProductSearch, allProductOptions]);

    // Fetch initial products on mount
    useEffect(() => {
        loadProductsList();

        // Charger les commerciaux si Admin ou Agent
        const fetchCommercials = async () => {
            if (isAdmin || isAgent) {
                try {
                    setLoadingCommercials(true);
                    const response = await axiosInstance.get('/users/commercials/devis-filter');
                    const data = response?.data?.data || response?.data || [];
                    let list = Array.isArray(data) ? [...data] : [];
                    
                    // Si l'utilisateur est admin ou agent et n'est pas dans la liste, on l'ajoute
                    if (user && (isAdmin || isAgent)) {
                        const myId = String(user.id || user.UserID || '');
                        if (!list.some(c => String(c.value || c.userId) === myId)) {
                            list.unshift({
                                value: myId,
                                userId: myId,
                                label: `${user.FullName || user.LoginName} (Moi)`,
                                fullName: `${user.FullName || user.LoginName} (Moi)`
                            });
                        }
                    }
                    setCommercials(list);
                } catch (error) {
                    console.error('Error fetching commercials:', error);
                    toast.error('Erreur lors du chargement des commerciaux');
                } finally {
                    setLoadingCommercials(false);
                }
            }
        };
        fetchCommercials();
    }, [isAdmin, isAgent]);

    // Initialiser le commercial pour les nouveaux devis
    useEffect(() => {
        if (!isEdit && !formData.CodRepres) {
            if (isCommercial && user) {
                setFormData(prev => ({
                    ...prev,
                    CodRepres: String(user.id || user.UserID || ''),
                    DesRepres: user.FullName || user.LoginName || ''
                }));
            }
        }
    }, [isEdit, isCommercial, user, formData.CodRepres]);

    // Fetch clients from database
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const response = await axiosInstance.get('/tiers', {
                    params: {
                        page: 1,
                        limit: 10000,
                        sort: 'recent'
                    }
                });
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
        if (isEdit && !loadingSlice && !currentDevis) {
            setLoading(false);
        }
    }, [isEdit, loadingSlice, currentDevis]);

    useEffect(() => {
        if (isEdit && currentDevis) {
            const { details, tiers, ...master } = currentDevis;

            const tierClasseId = tiers?.Classe;
            const tierGouvernoratId = tiers?.Gouvernorat ?? tiers?.gouvernorat;
            const tierCategorieId = tiers?.Categorie;

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
                Ville: master.Ville || tiers?.Ville || gouvernoratLabel,
                MapsRegion: master.MapsRegion || tiers?.MapsRegion || ''
            });

            if (details && details.length > 0) {
                setItems(details.map(d => calculateDetailAmounts({ ...d, tempId: d.NoDetail || Math.random() })));
            }
            setLoading(false);
        }
    }, [currentDevis, isEdit, tiersClasses, tiersGouvernorats, tiersCategories]);

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
        const subTotal = items.reduce((sum, item) => sum + toNonNegativeNumber(item.MntHT, 0), 0);
        const totalTva = items.reduce((sum, item) => sum + toNonNegativeNumber(item.MntTVA, 0), 0);

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
        setItems((prev) => [...prev, createDetailItem()]);
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

        setItems((prev) => prev.map((item) => (
            item.tempId === tempId
                ? calculateDetailAmounts({ ...item, [field]: normalizedValue })
                : item
        )));
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

            setItems((prev) => prev.map((item) => (
                item.tempId === tempId ? calculateDetailAmounts({
                    ...item,
                    IDArt: selectedProduct.IDArt,
                    CodArt: selectedProduct.CodArt,
                    LibArt: getProductName(selectedProduct),
                    productSearch: getProductSearchLabel(selectedProduct),
                    PuHT: Number.isFinite(selectedPrice) ? selectedPrice : 0,
                    Tva: Number.isFinite(selectedTva) ? selectedTva : 19
                }) : item
            )));
            setActiveProductRowId(null);
            setProductOptions(allProductOptions);
        }
    };

    const handleClientSelect = (clientCode) => {
        const selectedClient = clients.find(c => c.CodTiers === clientCode);
        if (selectedClient) {
            setSelectedProjectId('');
            setFormData(prev => ({
                ...prev,
                CodTiers: selectedClient.CodTiers,
                LibTiers: selectedClient.Raisoc || '',
                Adresse: selectedClient.Adresse || '',
                Ville: selectedClient.Ville || '',
                Classe: selectedClient.Classe || '',
                Fonction: selectedClient.Fonction || '',
                Categorie: selectedClient.Categorie || '',
                Domaine: selectedClient.Domaine || '',
                Responsable: selectedClient.Responsable || '',
                Tel: selectedClient.Tel || selectedClient.Gsm || '',
            }));
            // Cin belongs to Tiers model, not DevisMaster - keep separate
            setClientCin(selectedClient.Cin || '');
            setClientSearch(selectedClient.Raisoc || selectedClient.CodTiers || '');
            setShowClientDropdown(false);

            // Si c'est un admin et qu'aucun commercial n'est sélectionné, hériter du commercial du tiers
            if (isAdmin && !formData.CodRepres && selectedClient.codRepresTiers) {
                setFormData(prev => ({
                    ...prev,
                    CodRepres: selectedClient.codRepresTiers,
                    DesRepres: selectedClient.desRepresTiers || '' // On espère que ce champ existe dans l'objet tiers
                }));
            }
        }
    };

    // Filter clients based on search
    const filteredClients = clients.filter(client => {
        if (!clientSearch) return true;
        const search = clientSearch.toLowerCase();
        return (
            (client.Raisoc && client.Raisoc.toLowerCase().includes(search)) ||
            (client.CodTiers && client.CodTiers.toLowerCase().includes(search)) ||
            (client.Email && client.Email.toLowerCase().includes(search))
        );
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Empêcher la création si le client n'est pas sélectionné
        if (!formData.CodTiers) {
            toast.error('Veuillez sélectionner un client avant de finaliser le devis');
            return;
        }

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
                // NOTE: Timbre, avanceforf, Rest, MntAv retirés - uniquement pour Facture
                Cours: toNonNegativeNumber(formData.Cours, 1),
                MntDebit: toNonNegativeNumber(formData.MntDebit, 0),
                MntCredit: toNonNegativeNumber(formData.MntCredit, 0),
                CodCateg: Math.trunc(toNonNegativeNumber(formData.CodCateg, 0)),
                Nf: parseInt(formData.Nf) || null,
                // Properly serialize date fields
                DatUser: serializeDate(formData.DatUser),
                MDate: serializeDate(formData.MDate),
                DatLiv: serializeDate(formData.DatLiv),
                DatCreateUser: serializeDate(formData.DatCreateUser),
                // NOTE: DatImp retiré - uniquement pour Facture
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

            // Force list refresh before redirect so latest values appear immediately.
            await dispatch(fetchDevis({ page: 1, limit: 1000 })).unwrap();
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

    if (isEdit && !currentDevis) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50 flex items-center justify-center">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 max-w-md w-full text-center space-y-4">
                    <div className="h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto">
                        <DocumentTextIcon className="h-7 w-7 text-rose-400" />
                    </div>
                    <h2 className="text-base font-bold text-slate-800">Devis introuvable</h2>
                    <p className="text-sm text-slate-400">
                        Ce devis n'existe pas ou vous n'avez pas les droits pour y accéder.
                    </p>
                    {devisError && (
                        <p className="text-[11px] text-rose-400 bg-rose-50 px-3 py-2 rounded-lg font-mono">{devisError}</p>
                    )}
                    <button
                        onClick={() => navigate('/devis')}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-slate-700 hover:bg-slate-800 rounded-xl mx-auto transition-all"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Retour à la liste
                    </button>
                </div>
            </div>
        );
    }

    /* Visual step index: internal steps 1->3->4 map to display 1->2->3 */
    const displayStep = currentStep === 1 ? 1 : currentStep === 3 ? 2 : 3;

    const fmt = (n) => (n || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3 });

    /* Shared articles table used in both edit and new-devis modes */
    const ArticlesTable = () => (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 to-teal-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200/50">
                        <DocumentTextIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-800">Articles du devis</h2>
                        <p className="text-[11px] text-slate-500">{items.length} article{items.length > 1 ? 's' : ''}</p>
                    </div>
                </div>
                <button type="button" onClick={addItem}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all">
                    <PlusIcon className="h-4 w-4" /> Ajouter
                </button>
            </div>

            <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-2.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Article</div>
                <div className="col-span-2 text-center">Qté</div>
                <div className="col-span-2 text-right">P.U HT</div>
                <div className="col-span-2 text-right">Total HT</div>
                <div className="col-span-1"></div>
            </div>

            <div className="divide-y divide-slate-100">
                {items.length === 0 && (
                    <div className="py-16 text-center">
                        <DocumentTextIcon className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm text-slate-400">Aucun article. Cliquez sur Ajouter.</p>
                    </div>
                )}
                {items.map((item, index) => (
                    <div key={item.tempId} className="hover:bg-slate-50/40 transition-colors">
                        <div className="px-6 py-3 grid grid-cols-12 gap-3 items-center">
                            <div className="col-span-1">
                                <span className="text-[11px] font-bold text-slate-300">{index + 1}</span>
                            </div>
                            <div className="col-span-4 space-y-1.5">
                                <input
                                    type="text"
                                    value={item.productSearch ?? (item.LibArt ? getProductSearchLabel(item) : '')}
                                    onFocus={() => setActiveProductRowId(item.tempId)}
                                    onChange={(e) => handleProductSearchChange(item.tempId, e.target.value)}
                                    placeholder="Rechercher..."
                                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:border-blue-400 focus:outline-none transition-all"
                                />
                                <select
                                    value={item.IDArt || ''}
                                    onChange={(e) => handleProductSelect(item.tempId, e.target.value)}
                                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:border-blue-400 focus:outline-none"
                                >
                                    <option value="">{loadingProducts && activeProductRowId === item.tempId ? 'Chargement...' : '-- Selectionner --'}</option>
                                    {item.IDArt && <option value={item.IDArt}>{item.CodArt} {item.LibArt}</option>}
                                    {productOptions.map(p => <option key={p.IDArt} value={p.IDArt}>{p.CodArt} {getProductName(p)}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <input type="number" min="0" value={item.Qt || 0}
                                    onChange={(e) => handleItemChange(item.tempId, 'Qt', parseFloat(e.target.value) || 0)}
                                    className="w-full text-center px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-bold text-blue-600 focus:border-blue-400 focus:outline-none" />
                            </div>
                            <div className="col-span-2">
                                <input type="number" min="0" value={item.PuHT || 0}
                                    onChange={(e) => handleItemChange(item.tempId, 'PuHT', parseFloat(e.target.value) || 0)}
                                    className="w-full text-right px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:border-blue-400 focus:outline-none" />
                            </div>
                            <div className="col-span-2 text-right">
                                <span className="text-sm font-bold text-slate-700">{fmt(item.MntHT)}</span>
                                <span className="block text-[10px] text-slate-400">TND</span>
                            </div>
                            <div className="col-span-1 flex items-center justify-end gap-1">
                                <button type="button" onClick={() => toggleItemExpanded(item.tempId)}
                                    className={`p-1.5 rounded-lg transition-colors ${expandedItems[item.tempId] ? 'bg-blue-100 text-blue-600' : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500'}`}>
                                    <ChevronDownIcon className={`h-4 w-4 transition-transform ${expandedItems[item.tempId] ? 'rotate-180' : ''}`} />
                                </button>
                                <button type="button" onClick={() => removeItem(item.tempId)}
                                    className="p-1.5 rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedItems[item.tempId] && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="px-6 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/60">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">TVA (%)</label>
                                            <input type="number" value={item.Tva || 19} onChange={(e) => handleItemChange(item.tempId, 'Tva', parseFloat(e.target.value) || 0)}
                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Remise (%)</label>
                                            <input type="number" value={item.Remise || 0} onChange={(e) => handleItemChange(item.tempId, 'Remise', parseFloat(e.target.value) || 0)}
                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Observation</label>
                                            <input type="text" value={item.Observation || ''} onChange={(e) => handleItemChange(item.tempId, 'Observation', e.target.value)}
                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none" maxLength="255" />
                                        </div>
                                        <div className="text-[11px] text-slate-400 col-span-2 md:col-span-4 flex gap-4 pt-1">
                                            <span>Remise : <strong>{fmt(item.MntRem)}</strong> TND</span>
                                            <span>TVA : <strong>{fmt(item.MntTVA)}</strong> TND</span>
                                            <span>TTC : <strong className="text-blue-600">{fmt(item.PuTTC)}</strong> TND/u</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {items.length > 0 && (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <span className="text-xs text-slate-400 font-medium">{items.length} article{items.length > 1 ? 's' : ''}</span>
                    <div className="flex gap-6">
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Total HT</p>
                            <p className="text-base font-bold text-slate-700">{fmt(formData.TotHT)} <span className="text-[10px] text-slate-400">TND</span></p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">TVA</p>
                            <p className="text-base font-bold text-slate-600">{fmt(formData.TotTva)} <span className="text-[10px] text-slate-400">TND</span></p>
                        </div>
                        <div className="text-right pl-4 border-l border-slate-200">
                            <p className="text-[10px] font-bold text-blue-500 uppercase">Net TTC</p>
                            <p className="text-xl font-black text-blue-600">{fmt(formData.TotTTC)} <span className="text-xs text-blue-400">TND</span></p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 pb-16">

            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/devis')}
                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all group"
                        >
                            <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200/60 flex-shrink-0">
                            <DocumentTextIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-base font-bold text-slate-800">
                                    {isEdit ? `Devis N° ${formData.Nf || '—'}` : 'Nouveau Devis'}
                                </h1>
                                {isEdit && formData.Valid && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                                        {' '}Validé
                                    </span>
                                )}
                                {isEdit && formData.bTransf && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                        Transformé
                                    </span>
                                )}
                                {!isEdit && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        {'Étape'} {displayStep}/3
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-slate-400">
                                    {formData.LibTiers || 'Sélectionnez un client pour commencer'}
                                </p>
                                {isEdit && formData.DatUser && (
                                    <>
                                        <span className="text-slate-200 text-xs">·</span>
                                        <p className="text-[10px] text-slate-400">
                                            {new Date(formData.DatUser).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isEdit && (
                            <div className="hidden sm:block text-right border-r border-slate-100 pr-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net TTC</p>
                                <p className="text-base font-black text-indigo-600">{fmt(formData.TotTTC)} <span className="text-xs font-bold text-indigo-400">TND</span></p>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all group"
                        >
                            <ArrowPathIcon className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                        </button>
                        {(isEdit || currentStep === 4) && (
                            <button
                                form="devis-form"
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200/50 transition-all disabled:opacity-60"
                            >
                                {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckIcon className="h-4 w-4" />}
                                {isEdit ? 'Sauvegarder' : 'Finaliser'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Step progress bar — new devis only */}
                {!isEdit && (
                    <div className="max-w-6xl mx-auto px-6 pb-3">
                        <div className="flex items-center gap-0">
                            {[
                                { n: 1, label: 'Client', icon: UserGroupIcon, step: 1 },
                                { n: 2, label: 'Articles', icon: DocumentTextIcon, step: 3 },
                                { n: 3, label: 'Confirmation', icon: CalculatorIcon, step: 4 },
                            ].map((s, i, arr) => {
                                const done = displayStep > s.n;
                                const active = displayStep === s.n;
                                return (
                                    <React.Fragment key={s.n}>
                                        <button
                                            type="button"
                                            onClick={() => done && setCurrentStep(s.step)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${active ? 'text-indigo-700 bg-indigo-50' : done ? 'text-emerald-600 cursor-pointer hover:bg-emerald-50' : 'text-slate-400 cursor-default'}`}
                                        >
                                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${active ? 'bg-indigo-600 border-indigo-600 text-white' : done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-slate-400'}`}>
                                                {done ? <CheckIcon className="h-3 w-3" /> : s.n}
                                            </div>
                                            {s.label}
                                        </button>
                                        {i < arr.length - 1 && (
                                            <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${displayStep > s.n ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* EDIT MODE — two-column continuous layout */}
            {isEdit ? (
                <form id="devis-form" onSubmit={handleSubmit} className="max-w-6xl mx-auto px-6 pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                        {/* Left column — main content */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Client info — read-only card */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/30 flex items-center gap-3">
                                    <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200/50">
                                        <BuildingOfficeIcon className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-800">Client</h2>
                                        <p className="text-[11px] text-slate-500">Informations du tiers</p>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-bold text-slate-800">{formData.LibTiers || '—'}</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {formData.CodTiers && (
                                                    <span className="text-[11px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">{formData.CodTiers}</span>
                                                )}
                                                {formData.Ville && (
                                                    <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
                                                        <MapPinIcon className="h-3 w-3 text-slate-400" />{formData.Ville}
                                                    </span>
                                                )}
                                                {formData.Classe && (
                                                    <span className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">{formData.Classe}</span>
                                                )}
                                                {formData.Tel && (
                                                    <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">{formData.Tel}</span>
                                                )}
                                            </div>
                                            {formData.Adresse && (
                                                <p className="text-xs text-slate-400 mt-1.5">{formData.Adresse}</p>
                                            )}
                                        </div>
                                        {selectedProjectId && projects.length > 0 && (
                                            <div className="flex-shrink-0">
                                                <span className="text-[11px] text-violet-600 bg-violet-50 px-2.5 py-1 rounded-xl border border-violet-200 font-medium">
                                                    {projects.find(p => String(p.ID_Projet) === selectedProjectId)?.Nom_Projet || `Projet #${selectedProjectId}`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Articles */}
                            <ArticlesTable />

                            {/* Remarks */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50/60 to-yellow-50/20 flex items-center gap-3">
                                    <div className="h-9 w-9 bg-amber-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-200/50">
                                        <SparklesIcon className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-800">Remarques</h2>
                                        <p className="text-[11px] text-slate-500">Notes internes sur ce devis</p>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <textarea
                                        name="Remarq"
                                        value={formData.Remarq || ''}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Ajouter une remarque ou note sur ce devis..."
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 focus:outline-none transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right sidebar */}
                        <div className="lg:col-span-1">
                            <div className="lg:sticky lg:top-24 space-y-4">

                                {/* Financial summary */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 to-blue-50/30 flex items-center gap-3">
                                        <div className="h-8 w-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200/50">
                                            <CalculatorIcon className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold text-slate-800">Récapitulatif</h2>
                                            <p className="text-[11px] text-slate-500">Totaux financiers</p>
                                        </div>
                                    </div>
                                    <div className="p-5 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-500">Base HT</span>
                                            <span className="text-sm font-semibold text-slate-700">{fmt(formData.TotHT)} TND</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-500">TVA</span>
                                            <span className="text-sm font-semibold text-slate-700">{fmt(formData.TotTva)} TND</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-500">Remise globale</span>
                                            <div className="w-28">
                                                <input
                                                    type="number" min="0"
                                                    name="TotRem"
                                                    value={formData.TotRem || 0}
                                                    onChange={handleChange}
                                                    className="w-full text-right px-3 py-1 border border-slate-200 rounded-lg text-sm font-semibold text-rose-600 focus:border-rose-300 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="border-t border-dashed border-indigo-100 pt-3">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Net TTC</p>
                                                    <p className="text-[11px] text-slate-400">Toutes taxes comprises</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-black text-indigo-600">{fmt(formData.TotTTC)}</span>
                                                    <span className="ml-1 text-sm font-bold text-indigo-400">TND</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-5 pb-5">
                                        <button type="submit" form="devis-form" disabled={saving}
                                            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200/50 transition-all disabled:opacity-60">
                                            {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckIcon className="h-4 w-4" />}
                                            Sauvegarder les modifications
                                        </button>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
                                        <TagIcon className="h-4 w-4 text-slate-400" />
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dates</h3>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date du devis</label>
                                            <input
                                                type="date"
                                                name="DatUser"
                                                value={formData.DatUser ? String(formData.DatUser).split('T')[0] : ''}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date de livraison</label>
                                            <input
                                                type="date"
                                                name="DatLiv"
                                                value={formData.DatLiv ? String(formData.DatLiv).split('T')[0] : ''}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Commercial */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-violet-50/60 to-purple-50/20 flex items-center gap-2">
                                        <UserIcon className="h-4 w-4 text-violet-500" />
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Commercial</h3>
                                    </div>
                                    <div className="p-5">
                                        {isAdmin || isAgent ? (
                                            <div>
                                                <div className="relative">
                                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                    <select
                                                        name="CodRepres"
                                                        value={formData.CodRepres || ''}
                                                        onChange={(e) => {
                                                            const selectedComm = commercials.find(c => String(c.value || c.userId) === e.target.value);
                                                            setFormData(prev => ({ ...prev, CodRepres: e.target.value, DesRepres: selectedComm ? selectedComm.label || selectedComm.fullName : '' }));
                                                        }}
                                                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:outline-none transition-all"
                                                        disabled={loadingCommercials}
                                                    >
                                                        <option value="">-- Sélectionner --</option>
                                                        {commercials.map(comm => (
                                                            <option key={comm.value || comm.userId} value={comm.value || comm.userId}>{comm.label || comm.fullName}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {loadingCommercials && <p className="text-[11px] text-violet-500 mt-1 animate-pulse">Chargement...</p>}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                                                    <UserIcon className="h-4 w-4 text-violet-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700">{formData.DesRepres || '—'}</p>
                                                    <p className="text-[10px] text-slate-400">Commercial assigné</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </form>
            ) : (

            /* NEW DEVIS — step-by-step form */
            <form id="devis-form" onSubmit={handleSubmit} className="max-w-5xl mx-auto px-6 pt-6 space-y-6">

                {/* STEP 1 — Client */}
                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }} className="space-y-4">

                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/30 flex items-center gap-3">
                                    <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200/50">
                                        <UserGroupIcon className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-800">Sélection du client</h2>
                                        <p className="text-[11px] text-slate-500">Recherchez et sélectionnez un client</p>
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div className="relative" ref={clientDropdownRef}>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Rechercher un client *</label>
                                        <div className="relative">
                                            <UserGroupIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                                                placeholder={loadingClients ? 'Chargement des clients...' : 'Nom, code ou email du client...'}
                                                className={`w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-100 ${formData.CodTiers ? 'border-emerald-300 bg-emerald-50/30 text-emerald-800 focus:border-emerald-400' : 'border-slate-200 bg-white text-slate-700 focus:border-blue-400'}`}
                                                autoComplete="off"
                                            />
                                            {clientSearch && (
                                                <button type="button" onClick={() => { setClientSearch(''); setFormData(prev => ({ ...prev, CodTiers: '', LibTiers: '' })); setShowClientDropdown(false); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <XMarkIcon className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                                                </button>
                                            )}
                                        </div>

                                        {showClientDropdown && filteredClients.length > 0 && (
                                            <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                                                {filteredClients.slice(0, 50).map(client => (
                                                    <button key={client.CodTiers} type="button" onClick={() => handleClientSelect(client.CodTiers)}
                                                        className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0 ${formData.CodTiers === client.CodTiers ? 'bg-blue-50' : ''}`}>
                                                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                            <BuildingOfficeIcon className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-slate-800 truncate">{client.Raisoc || 'Sans nom'}</p>
                                                            <p className="text-[10px] text-slate-400 font-mono">{client.CodTiers}{client.Ville ? ` · ${client.Ville}` : ''}</p>
                                                        </div>
                                                        {formData.CodTiers === client.CodTiers && <CheckCircleIcon className="h-4 w-4 text-emerald-500 flex-shrink-0" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {showClientDropdown && clientSearch && filteredClients.length === 0 && (
                                            <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-center">
                                                <p className="text-sm text-slate-400">Aucun client trouvé pour « {clientSearch} »</p>
                                            </div>
                                        )}
                                    </div>

                                    {formData.CodTiers && (
                                        <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                <BuildingOfficeIcon className="h-5 w-5 text-emerald-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-emerald-800">{formData.LibTiers}</p>
                                                <div className="flex flex-wrap gap-2 mt-1.5">
                                                    {formData.CodTiers && <span className="text-[10px] font-mono bg-white text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">{formData.CodTiers}</span>}
                                                    {formData.Ville && <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1"><MapPinIcon className="h-3 w-3" />{formData.Ville}</span>}
                                                    {formData.Classe && <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">{formData.Classe}</span>}
                                                    {formData.Tel && <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">{formData.Tel}</span>}
                                                    {clientCin && <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">{clientCin}</span>}
                                                </div>
                                                {formData.Adresse && <p className="text-[11px] text-slate-400 mt-1">{formData.Adresse}</p>}
                                            </div>
                                            <CheckCircleIcon className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                                        </div>
                                    )}

                                    {formData.CodTiers && (
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Projet associé <span className="normal-case font-normal text-slate-400">(optionnel)</span></label>
                                            <select
                                                value={selectedProjectId}
                                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                                disabled={loadingProjects}
                                            >
                                                <option value="">Sans projet lié</option>
                                                {projects.map((project) => (
                                                    <option key={project.ID_Projet} value={project.ID_Projet}>
                                                        {project.Nom_Projet || project.Code_Pro || project.ID_Projet}
                                                        {project.CodDev ? ` | Devis ${project.CodDev}` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            {loadingProjects && <p className="text-[11px] text-blue-500 mt-1 animate-pulse">Chargement des projets...</p>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Commercial */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-50/60 to-purple-50/30 flex items-center gap-3">
                                    <div className="h-9 w-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-200/50">
                                        <UserIcon className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-800">Commercial assigné</h2>
                                        <p className="text-[11px] text-slate-500">Représentant commercial du devis</p>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {isAdmin || isAgent ? (
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Choisir un commercial</label>
                                            <div className="relative">
                                                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <select
                                                    name="CodRepres"
                                                    value={formData.CodRepres || ''}
                                                    onChange={(e) => {
                                                        const selectedComm = commercials.find(c => String(c.value || c.userId) === e.target.value);
                                                        setFormData(prev => ({ ...prev, CodRepres: e.target.value, DesRepres: selectedComm ? selectedComm.label || selectedComm.fullName : '' }));
                                                    }}
                                                    className="w-full pl-10 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:outline-none transition-all"
                                                    disabled={loadingCommercials}
                                                >
                                                    <option value="">-- Sélectionner un commercial --</option>
                                                    {commercials.map(comm => (
                                                        <option key={comm.value || comm.userId} value={comm.value || comm.userId}>{comm.label || comm.fullName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {loadingCommercials && <p className="text-[11px] text-violet-500 mt-1 animate-pulse">Chargement...</p>}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                                            <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                                                <UserIcon className="h-4 w-4 text-violet-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700">{formData.DesRepres || '—'}</p>
                                                <p className="text-[10px] text-slate-400">Commercial assigné</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Navigation */}
                            <div className="flex justify-end pt-2">
                                <button type="button" onClick={() => { if (!formData.CodTiers) { toast.error('Veuillez sélectionner un client'); return; } setCurrentStep(3); }}
                                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-200/50 transition-all">
                                    Articles
                                    <ArrowLeftIcon className="h-4 w-4 rotate-180" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* STEP 2 — Articles */}
                <AnimatePresence mode="wait">
                    {currentStep === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }} className="space-y-4">

                            {formData.CodTiers && (
                                <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <BuildingOfficeIcon className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">{formData.LibTiers}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">{formData.CodTiers}{formData.Ville ? ` · ${formData.Ville}` : ''}</p>
                                    </div>
                                    <button type="button" onClick={() => setCurrentStep(1)} className="text-[10px] text-blue-600 hover:underline font-semibold">Modifier</button>
                                </div>
                            )}

                            <ArticlesTable />

                            <div className="flex justify-between pt-2">
                                <button type="button" onClick={() => setCurrentStep(1)}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                                    <ArrowLeftIcon className="h-4 w-4" /> Client
                                </button>
                                <button type="button" onClick={() => setCurrentStep(4)}
                                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-200/50 transition-all">
                                    Confirmer <ArrowLeftIcon className="h-4 w-4 rotate-180" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* STEP 3 — Recap & Confirmation */}
                <AnimatePresence mode="wait">
                    {currentStep === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }} className="max-w-lg mx-auto space-y-4">

                            <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-5 border-b border-emerald-100 bg-gradient-to-r from-emerald-50/80 to-teal-50/40 flex items-center gap-3">
                                    <div className="h-9 w-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200/50">
                                        <CalculatorIcon className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-800">Récapitulatif financier</h2>
                                        <p className="text-[11px] text-slate-500">Vérification finale avant enregistrement</p>
                                    </div>
                                </div>

                                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                                    <div>
                                        <p className="text-xs text-slate-400">Client</p>
                                        <p className="text-sm font-bold text-slate-800">{formData.LibTiers || '—'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">Articles</p>
                                        <p className="text-sm font-bold text-slate-800">{items.length}</p>
                                    </div>
                                </div>

                                <div className="px-6 py-5 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Base HT</span>
                                        <span className="font-semibold text-slate-700">{fmt(formData.TotHT)} TND</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">TVA</span>
                                        <span className="font-semibold text-slate-700">{fmt(formData.TotTva)} TND</span>
                                    </div>
                                    {formData.TotRem > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-rose-500">Remise globale</span>
                                            <span className="font-semibold text-rose-600">- {fmt(formData.TotRem)} TND</span>
                                        </div>
                                    )}
                                    <div className="border-t border-dashed border-emerald-100 pt-3 flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Net TTC</p>
                                            <p className="text-[11px] text-slate-400">Toutes taxes comprises</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-emerald-600">{fmt(formData.TotTTC)}</span>
                                            <span className="ml-1 text-sm font-bold text-emerald-400">TND</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 pb-6 space-y-3">
                                    <button type="submit" disabled={saving}
                                        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-200/50 transition-all disabled:opacity-60">
                                        {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckIcon className="h-4 w-4" />}
                                        Créer le devis
                                    </button>
                                    <button type="button" onClick={() => setCurrentStep(3)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-all">
                                        <ArrowLeftIcon className="h-4 w-4" /> Modifier les articles
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </form>
            )}
        </div>
    );
};

export default DevisForm;
