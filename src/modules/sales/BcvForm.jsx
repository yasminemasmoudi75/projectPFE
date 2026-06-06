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
    const [remisePct, setRemisePct] = useState(0);
    const [clientSearch, setClientSearch] = useState('');
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const clientDropdownRef = useRef(null);
    const [projects, setProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [commercials, setCommercials] = useState([]);
    const [loadingCommercials, setLoadingCommercials] = useState(false);
    const { user, isAdmin, isCommercial, isAgent, isClient } = useAuth();

    const toggleItemExpanded = (tempId) => {
        setExpandedItems(prev => ({
            ...prev,
            [tempId]: !prev[tempId]
        }));
    };

    const loadProductsList = async () => {
        try {
            const response = await axiosInstance.get('/products', {
                params: {
                    limit: 5000,
                    page: 1
                }
            });

            console.log('📡 Raw API Response:', response);

            const payload = response?.data ?? response;
            let list = Array.isArray(payload) ? payload : payload?.data;
            if (!Array.isArray(list)) list = [];

            if (list.length === 0) {
                toast.error('Aucun produit trouvé.');
                setProductOptions([]);
                setProductLookup({});
                return;
            }

            const normalizedProducts = list
                .filter(p => p && (p.IDArt || p.Guid))
                .map(normalizeProduct);

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
            setProductOptions([]);
            setProductLookup({});
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

        // Addresses - Livraison uniquement
        Adresse: '',
        Ville: '',
        // NOTE: LibTiersA, AdresseA, VilleA, CinA retirés - uniquement pour Facture

        // Client Details - Info base uniquement
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

        // Driver
        CodChauff: '',
        DesChauff: '',

        // Traçabilité - Lien vers Devis source
        SourceDevisGuid: '',
        SourceDevisNf: '',

        // NOTE: Advance Payment (avanceforf) retiré - uniquement pour Facture

        // Legacy/Metadata
        IsConverted: false,
        MntDebit: 0,
        MntCredit: 0,
        // NOTE: Rest, NFav, MntAv retirés - uniquement pour Facture
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
            Remise: 0,
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

    const [productDropdownOpen, setProductDropdownOpen] = useState({});
    const productDropdownRefs = useRef({});
    const activeProductSearch = items.find(item => item.tempId === activeProductRowId)?.productSearch?.trim() || '';

    const getFilteredProducts = (searchText) => {
        const q = normalizeSearchText(searchText || '');
        const all = productOptions.length > 0 ? productOptions : Object.values(productLookup);
        if (!q) return all.slice(0, 80);
        return all.filter(p =>
            normalizeSearchText(p.CodArt || '').includes(q) ||
            normalizeSearchText(getProductName(p)).includes(q)
        ).slice(0, 60);
    };

    useEffect(() => {
        if (!activeProductRowId) {
            setLoadingProducts(false);
            return;
        }

        // Si la recherche est vide, afficher tous les produits
        if (!activeProductSearch || activeProductSearch.length < 2) {
            setProductOptions(Object.values(productLookup));
            setLoadingProducts(false);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setLoadingProducts(true);
            try {
                const response = await axiosInstance.get('/products', {
                    params: { search: activeProductSearch, limit: 100, page: 1 }
                });
                const payload = response?.data ?? response;
                let list = Array.isArray(payload) ? payload : payload?.data;
                if (!Array.isArray(list)) list = [];
                const normalizedProducts = list.map(normalizeProduct);
                setProductOptions(normalizedProducts);
                setProductLookup((prev) => {
                    const nextLookup = { ...prev };
                    normalizedProducts.forEach((product) => {
                        nextLookup[String(product.IDArt)] = product;
                    });
                    return nextLookup;
                });
            } catch (error) {
                toast.error('Erreur recherche produits: ' + (error.response?.data?.message || error.message));
                setProductOptions([]);
            } finally {
                setLoadingProducts(false);
            }
        }, 350);

        return () => clearTimeout(timeoutId);
    }, [activeProductRowId, activeProductSearch, productLookup]);

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

    // Initialiser le commercial pour les nouveaux BCV
    useEffect(() => {
        if (!isEdit && !formData.CodRepres && user) {
            if (isCommercial || isAdmin || isAgent) {
                setFormData(prev => ({
                    ...prev,
                    CodRepres: String(user.id || user.UserID || ''),
                    DesRepres: user.FullName || user.LoginName || ''
                }));
            }
        }
    }, [isEdit, isCommercial, isAdmin, isAgent, user, formData.CodRepres]);

    // Auto-sélectionner le client connecté quand le rôle est Client
    useEffect(() => {
        if (!isEdit && isClient && clients.length > 0 && !formData.CodTiers) {
            handleClientSelect(clients[0].CodTiers);
        }
    }, [isClient, clients, isEdit]);

    // Fetch clients from database
    useEffect(() => {
        const fetchClients = async () => {
            try {
                // Client role: fetch only own tiers via /tiers/me (no permission required)
                if (isClient) {
                    const res = await axiosInstance.get('/tiers/me');
                    const row = res?.data?.data || res?.data;
                    if (row?.CodTiers) setClients([row]);
                    return;
                }

                const limit = 1000;
                let page = 1;
                let hasNext = true;
                const collected = [];

                while (hasNext && page <= 500) {
                    const response = await axiosInstance.get('/tiers', {
                        params: {
                            limit,
                            page,
                            selectedCommercial: 'all',
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
    }, [isClient]);

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

    // Close product dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            setProductDropdownOpen(prev => {
                if (!Object.values(prev).some(Boolean)) return prev;
                const next = { ...prev };
                let changed = false;
                Object.keys(next).forEach(tempId => {
                    const ref = productDropdownRefs.current[tempId];
                    if (next[tempId] && ref && !ref.contains(e.target)) {
                        next[tempId] = false;
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });
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

    // Remise % → TotRem
    useEffect(() => {
        const pct = parseFloat(remisePct) || 0;
        const base = items.reduce((sum, item) => {
            const qt = toNonNegativeNumber(item.Qt, 0);
            const puHT = toNonNegativeNumber(item.PuHT, 0);
            return sum + qt * puHT;
        }, 0);
        const rem = Math.round((pct / 100) * base * 1000) / 1000;
        setFormData(prev => ({ ...prev, TotRem: rem }));
    }, [remisePct, items]);

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
        const newTempId = Date.now();
        setItems([...items, {
            tempId: newTempId,
            CodArt: '',
            LibArt: '',
            ExLibArt: '',
            Qt: 1,
            PuHT: 0,
            PuTTC: 0,
            Tva: 19,
            Remise: 0,
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
        // Affiche la liste complète des produits pour la nouvelle ligne
        setActiveProductRowId(newTempId);
        setProductOptions(prev => prev.length > 0 ? prev : Object.values(productLookup));
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
        // Si la recherche est vide, afficher tous les produits
        if (!value || value.length < 2) {
            setProductOptions(Object.values(productLookup));
        }
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
                    PuTTC: Number.isFinite(selectedProduct.PuTTC) ? selectedProduct.PuTTC : 0,
                    PvPub: Number.isFinite(selectedProduct.PvPub) ? selectedProduct.PvPub : 0,
                    Tva: Number.isFinite(selectedTva) ? selectedTva : 19
                } : item
            ));
            setActiveProductRowId(null);
            setProductOptions([]);
        }
    };
    // Recalcul automatique des montants par ligne (HT, TVA)
    const itemsDeps = items.map(i => [i.Qt, i.PuHT, i.Tva, i.Remise].join(',')).join('|');
    useEffect(() => {
        setItems(prevItems => prevItems.map(item => {
            const qt = toNonNegativeNumber(item.Qt, 0);
            const puHT = toNonNegativeNumber(item.PuHT, 0);
            const tva = toNonNegativeNumber(item.Tva, 0);
            const remise = toNonNegativeNumber(item.Remise, 0);
            const montantHT = qt * puHT * (1 - remise / 100);
            const montantTVA = montantHT * (tva / 100);
            
            if (item.MntHT === montantHT && item.MntTVA === montantTVA) {
                return item;
            }

            return {
                ...item,
                MntHT: montantHT,
                MntTVA: montantTVA
            };
        }));
    }, [itemsDeps]);

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
            // Cin belongs to Tiers model, not BcvMaster - keep separate
            setClientCin(selectedClient.Cin || '');
            setClientSearch(selectedClient.Raisoc || selectedClient.CodTiers || '');
            setShowClientDropdown(false);

            // Si c'est un admin/agent et qu'aucun commercial n'est sélectionné, hériter du commercial du tiers
            if ((isAdmin || isAgent) && !formData.CodRepres && selectedClient.codRepresTiers) {
                setFormData(prev => ({
                    ...prev,
                    CodRepres: selectedClient.codRepresTiers,
                    DesRepres: selectedClient.desRepresTiers || '' 
                }));
            }
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

        // Empêcher la création si le client n'est pas sélectionné
        if (!formData.CodTiers) {
            toast.error('Veuillez sélectionner un client avant de finaliser le bon de commande');
            return;
        }

        const articlesValides = items.filter(i => i.CodArt);
        if (articlesValides.length === 0) {
            toast.error('Veuillez sélectionner au moins un article avant de créer le bon de commande');
            setCurrentStep(3);
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
                // NOTE: Timbre retiré - uniquement pour Facture
                Cours: toNonNegativeNumber(formData.Cours, 1),
                // NOTE: avanceforf, Rest, MntAv retirés - uniquement pour Facture
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


    /* Visual step index: internal steps 1->3->4 map to display 1->2->3 */
    const displayStep = currentStep === 1 ? 1 : currentStep === 3 ? 2 : 3;

    const fmt = (n) => (n || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3 });

    const articlesTableJsx = (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-[#0062AF] via-sky-400 to-teal-400" />

            {/* ── Header ── */}
            <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#e0f0ff] flex items-center justify-center flex-shrink-0">
                        <DocumentTextIcon className="h-5 w-5 text-[#0062AF]" />
                    </div>
                    <h2 className="text-base font-bold text-slate-800">Articles</h2>
                    {items.length > 0 && (
                        <span className="h-6 min-w-[24px] px-2 rounded-full bg-[#e0f0ff] text-[#0062AF] text-xs font-bold flex items-center justify-center">
                            {items.length}
                        </span>
                    )}
                </div>
                <button type="button" onClick={addItem}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#0062AF] hover:bg-[#004a85] rounded-xl shadow-sm shadow-blue-500/20 transition-all active:scale-95">
                    <PlusIcon className="h-4 w-4 stroke-[2.5]" /> Ajouter un article
                </button>
            </div>

            {/* ── Lignes articles ── */}
            <div className="divide-y divide-slate-100">
                {items.length === 0 && (
                    <div className="py-24 flex flex-col items-center justify-center gap-4">
                        <div className="h-20 w-20 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                            <DocumentTextIcon className="h-10 w-10 text-slate-300" />
                        </div>
                        <div className="text-center">
                            <p className="text-base font-semibold text-slate-500 mb-1">Aucun article ajouté</p>
                            <p className="text-sm text-slate-400">Cliquez sur <strong className="text-[#0062AF] cursor-pointer" onClick={addItem}>+ Ajouter un article</strong> pour commencer</p>
                        </div>
                    </div>
                )}

                {items.map((item, index) => (
                    <div key={item.tempId} className="relative">
                        {/* Accent gauche quand produit sélectionné */}
                        {item.CodArt && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#0062AF] to-sky-400 rounded-r" />}

                        <div className={`px-7 py-7 transition-colors ${item.CodArt ? 'bg-white' : 'bg-slate-50/30'}`}>

                            {/* ── Row header ── */}
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className={`h-7 w-7 rounded-full text-xs font-black flex items-center justify-center flex-shrink-0 transition-all ${item.CodArt ? 'bg-[#0062AF] text-white shadow-sm shadow-blue-500/30' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                        {index + 1}
                                    </span>
                                    {item.CodArt ? (
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-[10px] font-mono font-bold text-[#0062AF] bg-[#e0f0ff] px-2 py-0.5 rounded-md flex-shrink-0">{item.CodArt}</span>
                                            <span className="text-sm font-semibold text-slate-800 truncate">{item.LibArt}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-400 font-medium">Sélectionnez un article</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                    <button type="button" onClick={() => toggleItemExpanded(item.tempId)}
                                        className={`h-8 px-2.5 flex items-center gap-1 rounded-lg text-xs font-semibold transition-all ${expandedItems[item.tempId] ? 'bg-[#e0f0ff] text-[#0062AF]' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>
                                        <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${expandedItems[item.tempId] ? 'rotate-180' : ''}`} />
                                    </button>
                                    <button type="button" onClick={() => removeItem(item.tempId)}
                                        className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-400 transition-all">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* ── Recherche produit ── */}
                            <div className="relative mb-5" ref={el => productDropdownRefs.current[item.tempId] = el}>
                                <div className="relative">
                                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={item.productSearch ?? (item.CodArt ? `${item.CodArt} — ${item.LibArt}` : '')}
                                        onFocus={() => {
                                            setActiveProductRowId(item.tempId);
                                            setProductDropdownOpen(prev => ({ ...prev, [item.tempId]: true }));
                                            if (!item.CodArt) setProductOptions(Object.values(productLookup));
                                        }}
                                        onChange={(e) => {
                                            handleProductSearchChange(item.tempId, e.target.value);
                                            setProductDropdownOpen(prev => ({ ...prev, [item.tempId]: true }));
                                        }}
                                        onPaste={(e) => { setTimeout(() => setProductDropdownOpen(prev => ({ ...prev, [item.tempId]: true })), 10); }}
                                        placeholder="Rechercher par nom ou code produit…"
                                        className={`w-full pl-12 pr-10 py-5 text-base font-medium rounded-2xl border-2 transition-all focus:outline-none focus:ring-4 ${
                                            item.CodArt
                                                ? 'border-[#0062AF]/30 bg-[#f0f7ff] text-[#0062AF] focus:border-[#0062AF]/60 focus:ring-[#0062AF]/10'
                                                : 'border-slate-200 bg-white text-slate-700 placeholder-slate-400 focus:border-[#0062AF]/50 focus:ring-[#0062AF]/8'
                                        }`}
                                    />
                                    {item.CodArt && (
                                        <button type="button"
                                            onClick={() => {
                                                setItems(prev => prev.map(i => i.tempId === item.tempId ? { ...i, CodArt: '', LibArt: '', IDArt: null, productSearch: '', PuHT: 0, PuTTC: 0, Tva: 19 } : i));
                                                setProductDropdownOpen(prev => ({ ...prev, [item.tempId]: false }));
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-500 transition-all">
                                            <XMarkIcon className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>

                                {/* Dropdown */}
                                {productDropdownOpen[item.tempId] && (
                                    <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden" style={{ maxHeight: '260px', overflowY: 'auto' }}>
                                        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 sticky top-0">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {getFilteredProducts(item.productSearch).length} résultat{getFilteredProducts(item.productSearch).length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        {getFilteredProducts(item.productSearch).length === 0 ? (
                                            <div className="px-4 py-10 text-sm text-slate-400 text-center">Aucun produit trouvé</div>
                                        ) : (
                                            getFilteredProducts(item.productSearch).map(p => (
                                                <button key={p.IDArt} type="button"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        handleProductSelect(item.tempId, p.IDArt);
                                                        setProductDropdownOpen(prev => ({ ...prev, [item.tempId]: false }));
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-[#f0f7ff] active:bg-[#e0f0ff] transition-colors border-b border-slate-50 last:border-0 flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex-shrink-0">{p.CodArt}</span>
                                                        <span className="text-sm font-medium text-slate-700 truncate">{getProductName(p)}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-[#0062AF] flex-shrink-0 tabular-nums">
                                                        {(p.PrixVente || p.PuHT || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
                                                    </span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ── Qté · PU HT · TVA · Total ── */}
                            <div className="grid grid-cols-4 gap-4">

                                {/* Quantité */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Quantité</label>
                                    <div className="flex h-12 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <button type="button"
                                            onClick={() => handleItemChange(item.tempId, 'Qt', Math.max(1, (parseFloat(item.Qt) || 1) - 1))}
                                            className="w-10 flex items-center justify-center text-slate-400 hover:text-[#0062AF] hover:bg-[#f0f7ff] transition-colors font-bold text-xl border-r border-slate-200 flex-shrink-0">
                                            −
                                        </button>
                                        <input type="number" min="1"
                                            value={item.Qt}
                                            onFocus={e => e.target.select()}
                                            onChange={(e) => handleItemChange(item.tempId, 'Qt', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                                            onBlur={(e) => handleItemChange(item.tempId, 'Qt', Math.max(1, parseFloat(e.target.value) || 1))}
                                            className="flex-1 h-full text-center text-base font-black text-[#0062AF] focus:outline-none bg-transparent min-w-0"
                                        />
                                        <button type="button"
                                            onClick={() => handleItemChange(item.tempId, 'Qt', (parseFloat(item.Qt) || 0) + 1)}
                                            className="w-10 flex items-center justify-center text-slate-400 hover:text-[#0062AF] hover:bg-[#f0f7ff] transition-colors font-bold text-xl border-l border-slate-200 flex-shrink-0">
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* PU HT */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Prix unitaire HT</label>
                                    <div className="relative h-12">
                                        <input type="number" min="0" step="0.001"
                                            value={item.PuHT || 0}
                                            onFocus={e => e.target.select()}
                                            onChange={(e) => handleItemChange(item.tempId, 'PuHT', parseFloat(e.target.value) || 0)}
                                            className="w-full h-full text-right pl-4 pr-12 bg-white border border-slate-200 rounded-xl text-base font-semibold text-slate-800 focus:border-[#0062AF]/50 focus:ring-2 focus:ring-[#0062AF]/8 focus:outline-none transition-all shadow-sm" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium pointer-events-none">TND</span>
                                    </div>
                                </div>

                                {/* TVA — pill buttons */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">TVA</label>
                                    <div className="flex h-12 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        {[19, 7, 0].map((t, ti) => (
                                            <button key={t} type="button"
                                                onClick={() => handleItemChange(item.tempId, 'Tva', t)}
                                                className={`flex-1 text-sm font-bold transition-all ${ti > 0 ? 'border-l border-slate-200' : ''} ${
                                                    (item.Tva ?? 19) === t
                                                        ? 'bg-[#0062AF] text-white shadow-inner'
                                                        : 'text-slate-500 hover:bg-[#f0f7ff] hover:text-[#0062AF]'
                                                }`}>
                                                {t}%
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Total HT */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total HT</label>
                                    <div className="h-12 flex items-center justify-end px-4 bg-[#f0f7ff] border border-[#0062AF]/20 rounded-xl shadow-sm gap-1.5">
                                        <span className="text-base font-black text-[#0062AF] tabular-nums">{fmt(item.MntHT)}</span>
                                        <span className="text-xs text-[#0062AF]/50 font-semibold">TND</span>
                                    </div>
                                </div>
                            </div>

                            {/* ── Options avancées ── */}
                            <AnimatePresence>
                                {expandedItems[item.tempId] && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Remise (%)</label>
                                                <input type="number" value={item.Remise || 0}
                                                    onFocus={e => e.target.select()}
                                                    onChange={(e) => handleItemChange(item.tempId, 'Remise', parseFloat(e.target.value) || 0)}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-[#0062AF]/50 focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Observation</label>
                                                <input type="text" value={item.Observation || ''}
                                                    onChange={(e) => handleItemChange(item.tempId, 'Observation', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-[#0062AF]/50 focus:outline-none" maxLength="255" />
                                            </div>
                                            <div className="col-span-2 flex gap-6 text-xs text-slate-400 pt-1">
                                                <span>TVA : <strong className="text-slate-600 tabular-nums">{fmt(item.MntTVA)}</strong> TND</span>
                                                <span>TTC/u : <strong className="text-[#0062AF] tabular-nums">{fmt(item.PuTTC)}</strong> TND</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Footer totaux ── */}
            {items.length > 0 && (
                <div className="px-7 py-5 bg-slate-50/60 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400 font-medium">{items.length} article{items.length > 1 ? 's' : ''}</span>
                        <div className="flex items-center gap-8">
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Base HT</p>
                                <p className="text-base font-bold text-slate-700 tabular-nums">{fmt(formData.TotHT)} <span className="text-xs text-slate-400">TND</span></p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">TVA</p>
                                <p className="text-base font-bold text-slate-600 tabular-nums">{fmt(formData.TotTva)} <span className="text-xs text-slate-400">TND</span></p>
                            </div>
                            <div className="text-right pl-8 border-l-2 border-[#0062AF]/20">
                                <p className="text-[10px] font-bold text-[#0062AF] uppercase tracking-widest mb-0.5">Net TTC</p>
                                <p className="text-2xl font-black text-[#0062AF] tabular-nums leading-tight">{fmt(formData.TotTTC)} <span className="text-sm font-bold text-[#0062AF]/60">TND</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/70 pb-20">

            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/bcv')}
                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all group"
                        >
                            <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="h-8 w-8 bg-[#0062AF] rounded-xl flex items-center justify-center flex-shrink-0">
                            <DocumentTextIcon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-base font-bold text-slate-800">
                                    {isEdit ? `BC N${String.fromCharCode(176)} ${formData.Nf || '—'}` : 'Nouveau Bon de Commande'}
                                </h1>
                                {isEdit && formData.Valid && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                                        {' '}Valide
                                    </span>
                                )}
                                {isEdit && formData.bTransf && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                        Transforme
                                    </span>
                                )}
                                {isEdit && formData.bLivr && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
                                        Livre
                                    </span>
                                )}
                                {!isEdit && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                        Étape {displayStep}/3
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {formData.LibTiers && (
                                    <p className="text-xs font-medium text-slate-600 truncate max-w-[300px]">{formData.LibTiers}</p>
                                )}
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
                                <p className="text-base font-black text-blue-600">{fmt(formData.TotTTC)} <span className="text-xs font-bold text-blue-400">TND</span></p>
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
                                form="Bcv-form"
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0062AF] hover:bg-[#004a85] rounded-xl shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50 active:scale-95"
                            >
                                {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckIcon className="h-4 w-4" />}
                                {isEdit ? 'Sauvegarder' : 'Finaliser'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Step progress bar — new BCV only */}
                {!isEdit && (
                    <div className="max-w-6xl mx-auto px-6 pb-3.5">
                        <div className="flex items-center">
                            {[
                                { n: 1, label: 'Client', step: 1 },
                                { n: 2, label: 'Articles', step: 3 },
                                { n: 3, label: 'Confirmation', step: 4 },
                            ].map((s, i, arr) => {
                                const done = displayStep > s.n;
                                const active = displayStep === s.n;
                                return (
                                    <React.Fragment key={s.n}>
                                        <button
                                            type="button"
                                            onClick={() => done && setCurrentStep(s.step)}
                                            className={`flex items-center gap-2.5 transition-all ${done ? 'cursor-pointer' : 'cursor-default'}`}
                                        >
                                            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all shadow-sm ${
                                                active ? 'bg-[#0062AF] text-white shadow-blue-500/30' :
                                                done  ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                                                        'bg-slate-100 text-slate-400'
                                            }`}>
                                                {done ? <CheckIcon className="h-3.5 w-3.5 stroke-[2.5]" /> : s.n}
                                            </div>
                                            <span className={`text-xs font-semibold transition-all ${
                                                active ? 'text-[#0062AF]' :
                                                done   ? 'text-emerald-600' :
                                                         'text-slate-400'
                                            }`}>{s.label}</span>
                                        </button>
                                        {i < arr.length - 1 && (
                                            <div className={`flex-1 h-px mx-4 rounded-full transition-all duration-500 ${displayStep > s.n ? 'bg-emerald-400' : 'bg-slate-200'}`} />
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
                <form id="Bcv-form" onSubmit={handleSubmit} className="max-w-6xl mx-auto px-6 pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                        {/* Left column */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Client card */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="h-0.5 bg-gradient-to-r from-[#0062AF] via-sky-400 to-teal-400" />
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                    <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <BuildingOfficeIcon className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-semibold text-slate-700">Client</h2>
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
                                                    <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">{formData.Classe}</span>
                                                )}
                                                {formData.Tel && (
                                                    <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">{formData.Tel}</span>
                                                )}
                                                {formData.Responsable && (
                                                    <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
                                                        <UserIcon className="h-3 w-3 text-slate-400" />{formData.Responsable}
                                                    </span>
                                                )}
                                            </div>
                                            {formData.Adresse && (
                                                <p className="text-xs text-slate-400 mt-1.5">{formData.Adresse}</p>
                                            )}
                                            {formData.LibTiersA && (
                                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                    <MapPinIcon className="h-3 w-3 text-amber-400" />
                                                    Facturation: {formData.LibTiersA}
                                                </p>
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
                            {articlesTableJsx}

                            {/* Remarks */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                    <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                        <SparklesIcon className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-semibold text-slate-700">Remarques</h2>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <textarea
                                        name="Remarq"
                                        value={formData.Remarq || ''}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Ajouter une remarque ou note..."
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right sidebar */}
                        <div className="lg:col-span-1">
                            <div className="lg:sticky lg:top-24 space-y-4">

                                {/* Financial summary */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                                        <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                            <CalculatorIcon className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-semibold text-slate-700">Récapitulatif</h2>
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
                                        <div className="border-t border-dashed border-blue-100 pt-3">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Net TTC</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-black text-blue-600">{fmt(formData.TotTTC)}</span>
                                                    <span className="ml-1 text-sm font-bold text-blue-400">TND</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-5 pb-5">
                                        <button type="submit" form="Bcv-form" disabled={saving}
                                            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-[#0062AF] hover:bg-[#004a85] rounded-xl shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50 active:scale-95">
                                            {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckIcon className="h-4 w-4" />}
                                            Sauvegarder les modifications
                                        </button>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                                        <TagIcon className="h-4 w-4 text-slate-400" />
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dates</h3>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date du bon</label>
                                            <input
                                                type="date"
                                                name="DatUser"
                                                value={formData.DatUser ? String(formData.DatUser).split('T')[0] : ''}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date de livraison</label>
                                            <input
                                                type="date"
                                                name="DatLiv"
                                                value={formData.DatLiv ? String(formData.DatLiv).split('T')[0] : ''}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Commercial */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
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
                                                        <option value="">-- Selectionner --</option>
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

            /* NEW BCV — step-by-step form */
            <form id="Bcv-form" onSubmit={handleSubmit} className="max-w-6xl mx-auto px-6 pt-6 space-y-6">

                {/* STEP 1 — Client */}
                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

                                {/* ── Colonne gauche : recherche client (2/3) ── */}
                                <div className="lg:col-span-2 space-y-4">
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="h-0.5 bg-gradient-to-r from-[#0062AF] via-sky-400 to-teal-400 rounded-t-2xl" />
                                        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                            <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                                <UserGroupIcon className="h-4 w-4 text-blue-500" />
                                            </div>
                                            <h2 className="text-sm font-semibold text-slate-700">Client</h2>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            {isClient ? (
                                                /* Client connecté : champ verrouillé, sélection automatique */
                                                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                        <UserIcon className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        {loadingClients || !formData.CodTiers ? (
                                                            <div className="h-4 w-40 bg-blue-100 rounded animate-pulse" />
                                                        ) : (
                                                            <>
                                                                <p className="text-sm font-bold text-blue-800">{formData.LibTiers}</p>
                                                                <p className="text-[10px] font-mono text-blue-500">{formData.CodTiers}</p>
                                                            </>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                                                        Sélectionné automatiquement
                                                    </span>
                                                </div>
                                            ) : (
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
                                            )}

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
                                                            {formData.Classe && <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">{formData.Classe}</span>}
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
                                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Projet associé</label>
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
                                                                {project.CodBc ? ` | BC ${project.CodBc}` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {loadingProjects && <p className="text-[11px] text-blue-500 mt-1 animate-pulse">Chargement des projets...</p>}
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Raison sociale facturation</label>
                                                <input
                                                    type="text"
                                                    name="LibTiersA"
                                                    value={formData.LibTiersA || ''}
                                                    onChange={handleChange}
                                                    placeholder="Si différente du client principal"
                                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Navigation */}
                                    <div className="flex justify-end">
                                        <button type="button" onClick={() => { if (!formData.CodTiers) { toast.error('Veuillez sélectionner un client'); return; } setCurrentStep(3); }}
                                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#0062AF] hover:bg-[#004a85] rounded-xl shadow-sm shadow-blue-500/20 transition-all active:scale-95">
                                            Continuer <ArrowLeftIcon className="h-4 w-4 rotate-180" />
                                        </button>
                                    </div>
                                </div>

                                {/* ── Colonne droite : commercial (1/3) ── */}
                                <div className="lg:sticky lg:top-24 space-y-4">
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                                            <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                                <UserIcon className="h-4 w-4 text-indigo-500" />
                                            </div>
                                            <h2 className="text-sm font-semibold text-slate-700">Commercial</h2>
                                        </div>
                                        <div className="p-5">
                                            {isAdmin || isAgent ? (
                                                <div>
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
                                                            <option value="">— Sélectionner —</option>
                                                            {commercials.map(comm => (
                                                                <option key={comm.value || comm.userId} value={comm.value || comm.userId}>{comm.label || comm.fullName}</option>
                                                            ))}
                                                        </select>
                                                        {loadingCommercials && <p className="text-[11px] text-violet-500 mt-1 animate-pulse">Chargement...</p>}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                                                    <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                                                        <UserIcon className="h-4 w-4 text-violet-600" />
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-700">{formData.DesRepres || '—'}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tip card */}
                                    <div className="rounded-2xl bg-[#e0f0ff]/60 border border-[#0062AF]/15 p-4">
                                        <p className="text-[11px] font-bold text-[#0062AF] uppercase tracking-wider mb-1.5">Étape 1 / 3</p>
                                        <p className="text-xs text-slate-600 leading-relaxed">Sélectionnez le client destinataire de ce bon de commande, puis cliquez sur <strong>Continuer</strong> pour ajouter les articles.</p>
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* STEP 2 — Articles */}
                <AnimatePresence mode="wait">
                    {currentStep === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }} className="space-y-4">

                            {articlesTableJsx}

                            <div className="flex justify-between pt-1">
                                <button type="button" onClick={() => setCurrentStep(1)}
                                    className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-all">
                                    <ArrowLeftIcon className="h-4 w-4" /> Retour
                                </button>
                                <button type="button" onClick={() => setCurrentStep(4)}
                                    className="flex items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-[#0062AF] hover:bg-[#004a85] rounded-xl shadow-sm shadow-blue-500/20 transition-all active:scale-95">
                                    Confirmer <ArrowLeftIcon className="h-4 w-4 rotate-180" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* STEP 3 — Recap & Confirmation */}
                <AnimatePresence mode="wait">
                    {currentStep === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }} className="space-y-5">

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

                                {/* ── Left — table articles style facture ── */}
                                <div className="lg:col-span-2">
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="h-0.5 bg-gradient-to-r from-[#0062AF] via-sky-400 to-teal-400" />

                                        {/* Header card */}
                                        <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-xl bg-[#e0f0ff] flex items-center justify-center flex-shrink-0">
                                                    <DocumentTextIcon className="h-5 w-5 text-[#0062AF]" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-slate-800">Détail des articles</h3>
                                                    <p className="text-xs text-slate-400">{items.filter(i => i.CodArt).length} article{items.filter(i => i.CodArt).length !== 1 ? 's' : ''} sélectionné{items.filter(i => i.CodArt).length !== 1 ? 's' : ''}</p>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => setCurrentStep(3)}
                                                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0062AF] bg-[#e0f0ff] hover:bg-[#d0e8ff] rounded-xl transition-all">
                                                Modifier les articles
                                            </button>
                                        </div>

                                        {/* Table header */}
                                        <div className="grid grid-cols-[auto_1fr_80px_100px_70px_110px] gap-0 px-7 py-3 bg-slate-50/60 border-b border-slate-100">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-8">#</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Désignation</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Qté</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">PU HT</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">TVA</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Total HT</span>
                                        </div>

                                        {/* Rows */}
                                        <div className="divide-y divide-slate-50">
                                            {items.map((item, idx) => (
                                                <div key={item.tempId}
                                                    className="grid grid-cols-[auto_1fr_80px_100px_70px_110px] gap-0 px-7 py-5 items-center hover:bg-slate-50/50 transition-colors">
                                                    {/* # */}
                                                    <span className={`w-8 h-7 w-7 rounded-full text-xs font-black flex items-center justify-center flex-shrink-0 ${item.CodArt ? 'bg-[#0062AF] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                        {idx + 1}
                                                    </span>
                                                    {/* Désignation */}
                                                    <div className="min-w-0 pr-4">
                                                        {item.CodArt ? (
                                                            <>
                                                                <p className="text-sm font-semibold text-slate-800 truncate">{item.LibArt}</p>
                                                                <span className="text-[10px] font-mono text-[#0062AF] bg-[#e0f0ff] px-1.5 py-0.5 rounded-md mt-1 inline-block">{item.CodArt}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-sm text-slate-400 italic">Aucun article sélectionné</span>
                                                        )}
                                                    </div>
                                                    {/* Qté */}
                                                    <div className="text-center">
                                                        <span className="text-sm font-bold text-slate-700 tabular-nums">{item.Qt}</span>
                                                    </div>
                                                    {/* PU HT */}
                                                    <div className="text-right">
                                                        <span className="text-sm font-semibold text-slate-700 tabular-nums">{fmt(item.PuHT)}</span>
                                                        <span className="text-[10px] text-slate-400 ml-1">TND</span>
                                                    </div>
                                                    {/* TVA */}
                                                    <div className="text-center">
                                                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                                                            {item.Tva ?? 19}%
                                                        </span>
                                                    </div>
                                                    {/* Total HT */}
                                                    <div className="text-right">
                                                        <span className="text-sm font-black text-[#0062AF] tabular-nums">{fmt(item.MntHT)}</span>
                                                        <span className="text-[10px] text-[#0062AF]/60 ml-1">TND</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Footer sous-total */}
                                        <div className="px-7 py-4 bg-slate-50/60 border-t border-slate-200 flex justify-end">
                                            <div className="flex items-center gap-8">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Base HT</p>
                                                    <p className="text-base font-bold text-slate-700 tabular-nums">{fmt(formData.TotHT)} <span className="text-xs text-slate-400">TND</span></p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">TVA totale</p>
                                                    <p className="text-base font-bold text-slate-600 tabular-nums">{fmt(formData.TotTva)} <span className="text-xs text-slate-400">TND</span></p>
                                                </div>
                                                <div className="text-right pl-8 border-l-2 border-[#0062AF]/20">
                                                    <p className="text-[10px] font-bold text-[#0062AF] uppercase tracking-widest mb-0.5">Net TTC</p>
                                                    <p className="text-2xl font-black text-[#0062AF] tabular-nums">{fmt(formData.TotTTC)} <span className="text-sm font-bold text-[#0062AF]/60">TND</span></p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Right — récapitulatif + CTA ── */}
                                <div className="lg:sticky lg:top-24">
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="h-0.5 bg-gradient-to-r from-[#0062AF] via-sky-400 to-teal-400" />

                                        <div className="px-6 py-5 border-b border-slate-100">
                                            <div className="flex items-center gap-2.5">
                                                <CalculatorIcon className="h-5 w-5 text-[#0062AF]" />
                                                <h3 className="text-sm font-bold text-slate-700">Récapitulatif</h3>
                                            </div>
                                        </div>

                                        <div className="px-6 py-5 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-500">Base HT</span>
                                                <span className="text-sm font-semibold text-slate-700 tabular-nums">{fmt(formData.TotHT)} TND</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-500">TVA</span>
                                                <span className="text-sm font-semibold text-slate-600 tabular-nums">{fmt(formData.TotTva)} TND</span>
                                            </div>

                                            {/* Remise % */}
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-500">Remise</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="relative w-20">
                                                        <input
                                                            type="number" min="0" max="100" step="0.1"
                                                            value={remisePct}
                                                            onChange={e => setRemisePct(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                                                            onFocus={e => e.target.select()}
                                                            onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()}
                                                            className="w-full text-right pr-6 pl-2 py-1.5 border border-rose-200 rounded-xl text-sm font-bold text-rose-600 focus:border-rose-400 focus:outline-none bg-rose-50/50"
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-rose-400 pointer-events-none font-bold">%</span>
                                                    </div>
                                                    {Number(formData.TotRem) > 0 && (
                                                        <span className="text-xs text-rose-500 tabular-nums font-semibold whitespace-nowrap">− {fmt(formData.TotRem)} TND</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Net TTC */}
                                            <div className="pt-4 border-t border-dashed border-[#0062AF]/20">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-sm font-bold text-[#0062AF] uppercase tracking-wide">Net TTC</p>
                                                    <div className="text-right">
                                                        <span className="text-3xl font-black text-[#0062AF] tabular-nums">{fmt(formData.TotTTC)}</span>
                                                        <span className="ml-1 text-sm font-bold text-[#0062AF]/60">TND</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="px-6 pb-6 space-y-3">
                                            <button type="submit" disabled={saving}
                                                className="w-full flex items-center justify-center gap-2 py-4 text-sm font-bold text-white bg-[#0062AF] hover:bg-[#004a85] rounded-xl shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50 active:scale-95">
                                                {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckIcon className="h-4 w-4 stroke-[2.5]" />}
                                                Créer le bon de commande
                                            </button>
                                            <button type="button" onClick={() => setCurrentStep(3)}
                                                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-slate-500 hover:text-[#0062AF] border border-slate-200 rounded-xl hover:border-[#0062AF]/30 transition-all bg-white">
                                                <ArrowLeftIcon className="h-4 w-4" /> Modifier les articles
                                            </button>
                                        </div>
                                    </div>
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

export default BcvForm;
