import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from '../../app/axios';
import { formatCurrency, formatDate } from '../../utils/format';

const getLocalDateInputValue = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const defaultFormState = () => ({
    codTiers: '',
    libTiers: '',
    datReg: getLocalDateInputValue(),
    existingReglementId: '',
    modReg: 'ESPECE',
    numPiece: '',
    banque: '',
    detail: '',
});

const toNumber = (value) => {
    const parsed = Number.parseFloat(String(value ?? '').replace(',', '.'));
    return Number.isFinite(parsed) ? Math.round(parsed * 1000) / 1000 : 0;
};

const toDateOnlyLocal = (value) => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getDocKey = (doc) => `${doc.type}:${doc.id}`;

const ReglemForm = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState(defaultFormState);
    const [clients, setClients] = useState([]);
    const [clientSearch, setClientSearch] = useState('');
    const [paymentModes, setPaymentModes] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [selectedAllocations, setSelectedAllocations] = useState({});
    const [docFilters, setDocFilters] = useState({
        search: '',
        type: '',
        dateFrom: '',
        dateTo: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loadingClients, setLoadingClients] = useState(false);
    const [loadingModes, setLoadingModes] = useState(false);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [existingReglements, setExistingReglements] = useState([]);
    const [loadingExistingReglements, setLoadingExistingReglements] = useState(false);
    const [banques, setBanques] = useState([]);
    const [loadingBanques, setLoadingBanques] = useState(false);
    const [addingBanque, setAddingBanque] = useState(false);
    const [otherBanque, setOtherBanque] = useState('');
    const [otherBanqueAdresse, setOtherBanqueAdresse] = useState('');
    const [otherBanquePhoto, setOtherBanquePhoto] = useState(null);
    const otherBanquePhotoInputRef = useRef(null);

    const normalizedModReg = String(formData.modReg || '').toUpperCase();
    const requiresReference = ['CHEQUE', 'VIREMENT', 'TRAITE', 'EFFET'].includes(normalizedModReg);
    const requiresBank = ['CHEQUE', 'VIREMENT', 'TRAITE', 'EFFET'].includes(normalizedModReg);

    const getClientLabel = (client) => {
        return client.LibelleComplet || client.Nom || client.LibTiers || client.Raisoc || client.CodTiers || client.id;
    };

    const filteredClients = useMemo(() => {
        const term = String(clientSearch || '').trim().toLowerCase();
        if (!term) return clients;

        return clients.filter((client) => {
            const code = String(client.CodTiers || client.id || '').toLowerCase();
            const label = String(getClientLabel(client) || '').toLowerCase();
            const email = String(client.Email || '').toLowerCase();
            const tel = String(client.Tel || '').toLowerCase();

            return code.includes(term) || label.includes(term) || email.includes(term) || tel.includes(term);
        });
    }, [clients, clientSearch]);

    const filteredDocuments = useMemo(() => {
        const search = String(docFilters.search || '').trim().toLowerCase();
        const from = String(docFilters.dateFrom || '').trim();
        const to = String(docFilters.dateTo || '').trim();
        const selectedReglementId = String(formData.existingReglementId || '').trim();

        return documents.filter((doc) => {
            if (docFilters.type && doc.type !== docFilters.type) return false;

            const openedReglementId = String(doc.openReglementId || '').trim();
            if (selectedReglementId) {
                if (openedReglementId !== selectedReglementId) return false;
            } else if (openedReglementId) {
                return false;
            }

            if (search) {
                const inText = `${doc.num || ''} ${doc.type || ''}`.toLowerCase();
                if (!inText.includes(search)) return false;
            }

            const dateOnly = String(doc.date || '').slice(0, 10);
            if (from && dateOnly && dateOnly < from) return false;
            if (to && dateOnly && dateOnly > to) return false;

            return true;
        });
    }, [documents, docFilters, formData.existingReglementId]);

    const selectedPieces = useMemo(() => {
        return documents
            .filter((doc) => Object.prototype.hasOwnProperty.call(selectedAllocations, getDocKey(doc)))
            .map((doc) => ({
                ...doc,
                allocatedAmount: toNumber(selectedAllocations[getDocKey(doc)]),
            }))
            .filter((doc) => doc.allocatedAmount > 0);
    }, [documents, selectedAllocations]);

    const totalAllocated = useMemo(() => {
        return selectedPieces.reduce((sum, piece) => sum + toNumber(piece.allocatedAmount), 0);
    }, [selectedPieces]);

    const partialCount = useMemo(() => {
        return selectedPieces.filter((piece) => piece.allocatedAmount < (piece.remaining - 0.01)).length;
    }, [selectedPieces]);

    const selectedExistingReglement = useMemo(() => {
        const id = String(formData.existingReglementId || '').trim();
        if (!id) return null;
        return existingReglements.find((reg) => String(reg.id || '').trim() === id) || null;
    }, [existingReglements, formData.existingReglementId]);

    useEffect(() => {
        if (!isOpen) return;
        fetchClients();
        fetchPaymentModes();
        fetchBanques();
        setClientSearch('');
        setSuccess('');
        setError('');
        setSelectedAllocations({});
        setDocuments([]);
        setExistingReglements([]);
        setOtherBanque('');
        setOtherBanqueAdresse('');
        setOtherBanquePhoto(null);
        if (otherBanquePhotoInputRef.current) {
            otherBanquePhotoInputRef.current.value = '';
        }
        setDocFilters({ search: '', type: '', dateFrom: '', dateTo: '' });
        setFormData(defaultFormState());
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !formData.codTiers) return;
        fetchUnpaidDocuments(formData.codTiers, docFilters.dateFrom, docFilters.dateTo);
        fetchClientOpenReglements(formData.codTiers);
    }, [isOpen, formData.codTiers, docFilters.dateFrom, docFilters.dateTo]);

    const fetchClientOpenReglements = async (codTiers) => {
        if (!codTiers) {
            setExistingReglements([]);
            return;
        }

        try {
            setLoadingExistingReglements(true);
            const response = await axios.get(`/reglements/client/${encodeURIComponent(codTiers)}/open`);
            const payload = response?.data?.data || response?.data || [];
            setExistingReglements(Array.isArray(payload) ? payload : []);
        } catch (err) {
            setExistingReglements([]);
            console.error('Error loading open reglements:', err);
        } finally {
            setLoadingExistingReglements(false);
        }
    };

    const fetchPaymentModes = async () => {
        try {
            setLoadingModes(true);
            const response = await axios.get('/reglements/paymodes');
            const payload = response?.data?.data || response?.data || [];
            const modes = Array.isArray(payload) ? payload : [];
            setPaymentModes(modes);

            if (modes.length > 0 && !modes.some((m) => String(m.label || '').toUpperCase() === 'ESPECE')) {
                setFormData((prev) => ({
                    ...prev,
                    modReg: modes[0]?.label || prev.modReg,
                }));
            }
        } catch (err) {
            console.error('Error fetching payment modes:', err);
            setPaymentModes([]);
        } finally {
            setLoadingModes(false);
        }
    };

    const fetchBanques = async () => {
        try {
            setLoadingBanques(true);
            const response = await axios.get('/banques');
            const payload = response?.data?.data || response?.data || [];
            setBanques(Array.isArray(payload) ? payload : []);
        } catch (err) {
            console.error('Error fetching banques:', err);
            setBanques([]);
        } finally {
            setLoadingBanques(false);
        }
    };

    const handleAddOtherBanque = async () => {
        const banqueName = String(otherBanque || '').trim();
        if (!banqueName) return;

        try {
            setAddingBanque(true);
            const payload = new FormData();
            payload.append('banque', banqueName);

            const adresse = String(otherBanqueAdresse || '').trim();
            if (adresse) {
                payload.append('adresse', adresse);
            }

            if (otherBanquePhoto) {
                payload.append('photo', otherBanquePhoto);
            }

            const response = await axios.post('/banques', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const added = response?.data?.data || null;

            if (added?.id) {
                setBanques((prev) => {
                    if (prev.some((b) => String(b.id) === String(added.id))) return prev;
                    return [...prev, added].sort((a, b) => String(a.banque || '').localeCompare(String(b.banque || ''), 'fr', { sensitivity: 'base' }));
                });
                setFormData((prev) => ({ ...prev, banque: added.banque || banqueName }));
                setOtherBanque('');
                setOtherBanqueAdresse('');
                setOtherBanquePhoto(null);
                if (otherBanquePhotoInputRef.current) {
                    otherBanquePhotoInputRef.current.value = '';
                }
                setError('');
                return;
            }

            setFormData((prev) => ({ ...prev, banque: banqueName }));
            setOtherBanque('');
            setOtherBanqueAdresse('');
            setOtherBanquePhoto(null);
            if (otherBanquePhotoInputRef.current) {
                otherBanquePhotoInputRef.current.value = '';
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Impossible d\'ajouter la banque');
        } finally {
            setAddingBanque(false);
        }
    };

    const fetchClients = async () => {
        try {
            setLoadingClients(true);
            setError('');
            let response;
            try {
                response = await axios.get('/tiers?limit=10000&sort=recent');
            } catch (err) {
                if (err.response?.status === 404) {
                    response = await axios.get('/clients?limit=10000&sort=recent');
                } else {
                    throw err;
                }
            }

            const payload = response?.data ?? response;
            const list = payload?.data ?? payload;

            if (Array.isArray(list)) {
                setClients(list);
            } else {
                setError('Format de données invalide du serveur');
            }
        } catch (err) {
            console.error('Error fetching clients:', err.message);
            setError('Clients non disponibles. Entrez le code client manuellement.');
            setClients([]);
        } finally {
            setLoadingClients(false);
        }
    };

    const fetchUnpaidDocuments = async (codTiers, dateFrom, dateTo) => {
        if (!codTiers) return;
        try {
            setLoadingDocs(true);
            setError('');
            const params = new URLSearchParams();
            if (dateFrom) params.set('dateFrom', dateFrom);
            if (dateTo) params.set('dateTo', dateTo);
            const query = params.toString();
            const response = await axios.get(`/reglements/unpaid/${encodeURIComponent(codTiers)}${query ? `?${query}` : ''}`);
            const payload = response?.data?.data || response?.data || [];
            const docs = Array.isArray(payload) ? payload.map((doc) => {
                const debit = toNumber(doc.debit);
                const credit = toNumber(doc.credit);
                const remaining = toNumber(doc.remaining > 0 ? doc.remaining : (debit - credit));
                return {
                    ...doc,
                    debit,
                    credit,
                    remaining: Math.max(0, remaining),
                    openReglementId: doc.openReglementId || null,
                    openReglementDate: doc.openReglementDate || null,
                    openReglementRemaining: toNumber(doc.openReglementRemaining || 0),
                };
            }).filter((doc) => doc.remaining > 0) : [];

            setDocuments(docs);
            setSelectedAllocations((prev) => {
                const next = {};
                docs.forEach((doc) => {
                    const key = getDocKey(doc);
                    if (Object.prototype.hasOwnProperty.call(prev, key)) {
                        next[key] = Math.min(toNumber(prev[key]), doc.remaining);
                    }
                });
                return next;
            });
        } catch (err) {
            console.error('Error fetching unpaid docs:', err);
            setDocuments([]);
            setSelectedAllocations({});
            setError(err.response?.data?.message || 'Impossible de charger les pièces impayées');
        } finally {
            setLoadingDocs(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleClientChange = (e) => {
        const codTiers = e.target.value;
        const client = clients.find((c) => String(c.CodTiers || c.id || '').trim() === String(codTiers || '').trim());
        setFormData((prev) => ({
            ...prev,
            codTiers,
            libTiers: client?.LibelleComplet || client?.Nom || client?.LibTiers || client?.Raisoc || codTiers,
            existingReglementId: '',
        }));
        setSelectedAllocations({});
        setDocuments([]);
        setDocFilters((prev) => ({ ...prev, search: '', type: '' }));
        if (client) {
            setClientSearch(getClientLabel(client));
        }
        setError('');
    };

    const togglePieceSelection = (doc, checked) => {
        const key = getDocKey(doc);
        setSelectedAllocations((prev) => {
            const next = { ...prev };
            if (checked) {
                next[key] = doc.remaining;
            } else {
                delete next[key];
            }
            return next;
        });
    };

    const handleAllocationChange = (doc, value) => {
        const key = getDocKey(doc);
        const amount = Math.max(0, Math.min(toNumber(value), doc.remaining));
        setSelectedAllocations((prev) => ({
            ...prev,
            [key]: amount,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.codTiers.trim()) {
            setError('Sélectionnez un client');
            return;
        }

        if (selectedPieces.length === 0) {
            setError('Sélectionnez au moins une pièce à régler');
            return;
        }

        if (totalAllocated <= 0) {
            setError('Le montant total alloué doit être supérieur à zéro');
            return;
        }

        if (requiresReference && !formData.numPiece.trim()) {
            setError('Le numéro de pièce est obligatoire pour cette modalité');
            return;
        }
        if (requiresBank && !formData.banque.trim()) {
            setError('La banque est obligatoire pour cette modalité');
            return;
        }

        const hasExistingReglement = String(formData.existingReglementId || '').trim().length > 0;
        const invalidOpenLink = selectedPieces.find((piece) => {
            const openId = String(piece.openReglementId || '').trim();
            if (!hasExistingReglement) return Boolean(openId);
            return openId && openId !== String(formData.existingReglementId || '').trim();
        });

        if (invalidOpenLink) {
            setError('Une ou plusieurs pièces sont liées à un autre règlement en cours.');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const payload = {
                codTiers: formData.codTiers,
                libTiers: formData.libTiers,
                mntReg: totalAllocated,
                datReg: formData.datReg,
                existingReglementId: formData.existingReglementId || null,
                selectedPieces: selectedPieces.map((piece) => ({
                    id: piece.id,
                    type: piece.type,
                    allocatedAmount: piece.allocatedAmount,
                })),
                payments: [
                    {
                        modReg: formData.modReg,
                        montant: totalAllocated,
                        echeance: formData.datReg,
                        numPiece: formData.numPiece || null,
                        banque: formData.banque || null,
                        detail: formData.detail || null,
                    }
                ]
            };

            if (!hasExistingReglement) {
                payload.mntRegTarget = toNumber(selectedPieces.reduce((sum, piece) => sum + toNumber(piece.remaining), 0));
            }

            const response = await axios.post('/reglements', payload);
            const createdReglement = response?.data?.data || response?.data;

            if (createdReglement && createdReglement.id) {
                setSuccess('Règlement créé avec succès');
                try {
                    if (onSuccess) onSuccess(createdReglement);
                } catch (callbackErr) {
                    console.error('onSuccess callback error:', callbackErr);
                }
                onClose();
            } else {
                setError('Réponse serveur invalide après création');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Erreur lors de la création';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                    />

                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">Créer un Règlement</h2>
                                <button onClick={onClose} className="text-white/80 hover:text-white transition">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[82vh]">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                                        {clients.length > 0 ? (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={clientSearch}
                                                    onChange={(e) => setClientSearch(e.target.value)}
                                                    disabled={loading}
                                                    placeholder="Rechercher client..."
                                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <select
                                                    name="codTiers"
                                                    value={formData.codTiers}
                                                    onChange={handleClientChange}
                                                    disabled={loading}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Sélectionnez un client...</option>
                                                    {filteredClients.map((client) => (
                                                        <option key={client.CodTiers || client.id} value={client.CodTiers || client.id}>
                                                            {(client.CodTiers || client.id)} - {getClientLabel(client)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : loadingClients ? (
                                            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">Chargement des clients...</div>
                                        ) : (
                                            <input
                                                type="text"
                                                name="codTiers"
                                                value={formData.codTiers}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, codTiers: e.target.value, libTiers: e.target.value }))}
                                                disabled={loading}
                                                placeholder="Code client"
                                                className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            />
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Date règlement</label>
                                            <input
                                                type="date"
                                                name="datReg"
                                                value={formData.datReg}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Modalité</label>
                                            <select
                                                name="modReg"
                                                value={formData.modReg}
                                                onChange={handleInputChange}
                                                disabled={loading || loadingModes}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {paymentModes.length > 0 ? paymentModes.map((mode) => (
                                                    <option key={mode.IDReg} value={mode.label}>{mode.label}</option>
                                                )) : (
                                                    <>
                                                        <option value="ESPECE">ESPECE</option>
                                                        <option value="CHEQUE">CHEQUE</option>
                                                        <option value="VIREMENT">VIREMENT</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {formData.codTiers && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Règlement existant (tranche)</label>
                                        <select
                                            name="existingReglementId"
                                            value={formData.existingReglementId}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, existingReglementId: value }));
                                                setSelectedAllocations({});
                                                setError('');
                                            }}
                                            disabled={loading || loadingExistingReglements}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Nouveau règlement (pièces non liées)</option>
                                            {existingReglements.map((reg) => (
                                                <option key={reg.id} value={reg.id}>
                                                    {reg.id} | Restant {formatCurrency(reg.remainingAmount)} | {formatDate(toDateOnlyLocal(reg.date))}
                                                </option>
                                            ))}
                                        </select>
                                        {selectedExistingReglement && (
                                            <p className="text-xs text-blue-700 mt-2">
                                                Tranche sur règlement {selectedExistingReglement.id} - restant {formatCurrency(selectedExistingReglement.remainingAmount)}
                                            </p>
                                        )}
                                        {!selectedExistingReglement && formData.codTiers && (
                                            <p className="text-xs text-slate-500 mt-2">
                                                En mode nouveau règlement, seules les pièces non liées à un règlement en cours sont proposées.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {(requiresReference || requiresBank) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Numéro pièce {requiresReference ? '*' : ''}</label>
                                            <input
                                                type="text"
                                                name="numPiece"
                                                value={formData.numPiece}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Banque {requiresBank ? '*' : ''}</label>
                                            <select
                                                name="banque"
                                                value={formData.banque}
                                                onChange={handleInputChange}
                                                disabled={loading || loadingBanques}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Sélectionner une banque...</option>
                                                {formData.banque && !banques.some((b) => String(b.banque || '').trim() === String(formData.banque || '').trim()) && (
                                                    <option value={formData.banque}>{formData.banque}</option>
                                                )}
                                                {banques.map((banque) => (
                                                    <option key={banque.id || banque.banque} value={banque.banque}>{banque.banque}</option>
                                                ))}
                                            </select>
                                            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                                                <input
                                                    type="text"
                                                    value={otherBanque}
                                                    onChange={(e) => setOtherBanque(e.target.value)}
                                                    placeholder="Autre banque..."
                                                    disabled={loading || addingBanque}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <input
                                                    type="text"
                                                    value={otherBanqueAdresse}
                                                    onChange={(e) => setOtherBanqueAdresse(e.target.value)}
                                                    placeholder="Adresse..."
                                                    disabled={loading || addingBanque}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    ref={otherBanquePhotoInputRef}
                                                    onChange={(e) => setOtherBanquePhoto(e.target.files?.[0] || null)}
                                                    disabled={loading || addingBanque}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
                                                />
                                            </div>
                                            <div className="mt-2 flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleAddOtherBanque}
                                                    disabled={loading || addingBanque || !String(otherBanque || '').trim()}
                                                    className="px-3 py-2 bg-slate-100 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                                                >
                                                    {addingBanque ? '...' : 'Ajouter'}
                                                </button>
                                                {otherBanquePhoto && (
                                                    <span className="text-xs text-slate-500">Photo: {otherBanquePhoto.name}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Détail (optionnel)</label>
                                    <input
                                        type="text"
                                        name="detail"
                                        value={formData.detail}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                                    <div className="flex flex-col md:flex-row md:items-end gap-3">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Recherche pièce</label>
                                            <input
                                                type="text"
                                                value={docFilters.search}
                                                onChange={(e) => setDocFilters((prev) => ({ ...prev, search: e.target.value }))}
                                                placeholder="Numéro ou type"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                            <select
                                                value={docFilters.type}
                                                onChange={(e) => setDocFilters((prev) => ({ ...prev, type: e.target.value }))}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Tous</option>
                                                <option value="FA">Factures</option>
                                                <option value="BL">Bons de livraison</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
                                            <input
                                                type="date"
                                                value={docFilters.dateFrom}
                                                onChange={(e) => setDocFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                                            <input
                                                type="date"
                                                value={docFilters.dateTo}
                                                onChange={(e) => setDocFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 text-slate-700">
                                                <tr>
                                                    <th className="px-3 py-2 text-left">Choix</th>
                                                    <th className="px-3 py-2 text-left">Pièce</th>
                                                    <th className="px-3 py-2 text-left">Date</th>
                                                    <th className="px-3 py-2 text-right">Montant</th>
                                                    <th className="px-3 py-2 text-right">Déjà payé</th>
                                                    <th className="px-3 py-2 text-right">Reste</th>
                                                    <th className="px-3 py-2 text-right">Montant alloué</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loadingDocs ? (
                                                    <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-500">Chargement des pièces...</td></tr>
                                                ) : filteredDocuments.length === 0 ? (
                                                    <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-500">Aucune pièce impayée trouvée</td></tr>
                                                ) : filteredDocuments.map((doc) => {
                                                    const key = getDocKey(doc);
                                                    const selected = Object.prototype.hasOwnProperty.call(selectedAllocations, key);
                                                    return (
                                                        <tr key={key} className="border-t border-slate-100">
                                                            <td className="px-3 py-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selected}
                                                                    onChange={(e) => togglePieceSelection(doc, e.target.checked)}
                                                                    disabled={loading}
                                                                />
                                                            </td>
                                                            <td className="px-3 py-2 font-medium text-slate-800">{doc.type} - {doc.num}</td>
                                                            <td className="px-3 py-2 text-slate-600">{formatDate(toDateOnlyLocal(doc.date))}</td>
                                                            <td className="px-3 py-2 text-right">{formatCurrency(doc.debit)}</td>
                                                            <td className="px-3 py-2 text-right text-emerald-700">{formatCurrency(doc.credit)}</td>
                                                            <td className="px-3 py-2 text-right font-semibold text-orange-700">{formatCurrency(doc.remaining)}</td>
                                                            <td className="px-3 py-2 text-right">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.001"
                                                                    max={doc.remaining}
                                                                    value={selected ? selectedAllocations[key] : ''}
                                                                    onChange={(e) => handleAllocationChange(doc, e.target.value)}
                                                                    onFocus={() => !selected && togglePieceSelection(doc, true)}
                                                                    disabled={loading || !selected}
                                                                    className="w-28 px-2 py-1 border border-slate-300 rounded-lg text-right"
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-xs text-slate-500">Pièces sélectionnées</p>
                                        <p className="text-lg font-bold text-slate-900">{selectedPieces.length}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-xs text-slate-500">Pièces partielles</p>
                                        <p className="text-lg font-bold text-slate-900">{partialCount}</p>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-3">
                                        <p className="text-xs text-blue-700">Montant du règlement</p>
                                        <p className="text-xl font-extrabold text-blue-700">{formatCurrency(totalAllocated)}</p>
                                    </div>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                {success && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm"
                                    >
                                        {success}
                                    </motion.div>
                                )}

                                <div className="flex gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                                    >
                                        Annuler
                                    </button>
                                    <motion.button
                                        type="submit"
                                        disabled={loading || selectedPieces.length === 0 || totalAllocated <= 0}
                                        whileHover={{ scale: loading ? 1 : 1.02 }}
                                        whileTap={{ scale: loading ? 1 : 0.98 }}
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-70 font-medium"
                                    >
                                        {loading ? 'Création...' : 'Créer le règlement'}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ReglemForm;
