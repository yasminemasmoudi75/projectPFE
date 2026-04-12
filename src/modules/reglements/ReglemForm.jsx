import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from '../../app/axios';

const ReglemForm = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        codTiers: '',
        libTiers: '',
        mntReg: '',
        datReg: new Date().toISOString().split('T')[0],
        modReg: 'ESPECE',
        numPiece: '',
        banque: '',
        detail: '',
    });
    const [clients, setClients] = useState([]);
    const [clientSearch, setClientSearch] = useState('');
    const [paymentModes, setPaymentModes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loadingClients, setLoadingClients] = useState(false);
    const [loadingModes, setLoadingModes] = useState(false);

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

    // Fetch clients on modal open
    useEffect(() => {
        if (isOpen) {
            fetchClients();
            fetchPaymentModes();
            setClientSearch('');
            setSuccess('');
            setError('');
        }
    }, [isOpen]);

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

    const fetchClients = async () => {
        try {
            setLoadingClients(true);
            setError('');
            
            // Essayer plusieurs endpoints possibles
            let response;
            try {
                response = await axios.get('/tiers?limit=10000&sort=recent');
            } catch (err) {
                if (err.response?.status === 404) {
                    console.log('Endpoint /tiers not found, trying /clients...');
                    response = await axios.get('/clients?limit=10000&sort=recent');
                } else {
                    throw err;
                }
            }

            const payload = response?.data ?? response;
            const list = payload?.data ?? payload;
            
            if (Array.isArray(list)) {
                setClients(list);
                console.log(`✅ ${list.length} clients chargés`);
            } else {
                console.warn('Format de réponse inattendu:', payload);
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const nextValue = name === 'mntReg' ? value.replace(',', '.') : value;
        setFormData(prev => ({
            ...prev,
            [name]: nextValue
        }));
        setError('');
    };

    const handleClientChange = (e) => {
        const codTiers = e.target.value;
        const client = clients.find((c) => String(c.CodTiers || c.id || '').trim() === String(codTiers || '').trim());
        setFormData(prev => ({
            ...prev,
            codTiers,
            libTiers: client?.LibelleComplet || client?.Nom || client?.LibTiers || client?.Raisoc || codTiers
        }));
        if (client) {
            setClientSearch(getClientLabel(client));
        }
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const amount = Number.parseFloat(String(formData.mntReg || '').replace(',', '.'));
        
        // Validation
        if (!formData.codTiers.trim()) {
            setError('Sélectionnez un client');
            return;
        }
        if (!Number.isFinite(amount) || amount <= 0) {
            setError('Entrez un montant valide');
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

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const response = await axios.post('/reglements', {
                codTiers: formData.codTiers,
                libTiers: formData.libTiers,
                mntReg: amount,
                datReg: formData.datReg,
                payments: [
                    {
                        modReg: formData.modReg,
                        montant: amount,
                        echeance: formData.datReg,
                        numPiece: formData.numPiece || null,
                        banque: formData.banque || null,
                        detail: formData.detail || null,
                    }
                ]
            });

            if (response.data?.data) {
                // Show success message
                console.log('✅ Réglement créé avec succès:', response.data.message);
                setSuccess('✅ Réglement créé avec succès');

                // Reset form
                setFormData({
                    codTiers: '',
                    libTiers: '',
                    mntReg: '',
                    datReg: new Date().toISOString().split('T')[0],
                    modReg: 'ESPECE',
                    numPiece: '',
                    banque: '',
                    detail: '',
                });

                // Call success callback
                if (onSuccess) {
                    onSuccess(response.data.data);
                }

                // Close modal after 1.5 seconds
                setTimeout(() => {
                    setSuccess('');
                    onClose();
                }, 1500);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Erreur lors de la création';
            setError(errorMsg);
            console.error('Create reglement error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">Créer un Réglement</h2>
                                <button
                                    onClick={onClose}
                                    className="text-white/80 hover:text-white transition"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {/* Client Select */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Client {clients.length === 0 && !loadingClients && <span className="text-orange-600">(ou code)</span>}
                                    </label>
                                    {clients.length > 0 ? (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={clientSearch}
                                                onChange={(e) => setClientSearch(e.target.value)}
                                                disabled={loading}
                                                placeholder="Rechercher client (code, nom, email, tél)..."
                                                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            />
                                            <select
                                                name="codTiers"
                                                value={formData.codTiers}
                                                onChange={handleClientChange}
                                                disabled={loading}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="">Sélectionnez un client...</option>
                                                {filteredClients.map(client => {
                                                    const clientName = getClientLabel(client);
                                                    return (
                                                        <option key={client.CodTiers || client.id} value={client.CodTiers || client.id}>
                                                            {`${client.CodTiers || client.id} - ${clientName}`}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            {clientSearch.trim() && filteredClients.length === 0 && (
                                                <p className="text-xs text-amber-600">Aucun client trouvé pour cette recherche.</p>
                                            )}
                                        </div>
                                    ) : loadingClients ? (
                                        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 flex items-center gap-2">
                                            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                            Chargement des clients...
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            name="codTiers"
                                            value={formData.codTiers}
                                            onChange={(e) => {
                                                const {value} = e.target;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    codTiers: value,
                                                    libTiers: value
                                                }));
                                                setError('');
                                            }}
                                            disabled={loading}
                                            placeholder="Entrez le code client (ex: CLIENT001)"
                                            className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed bg-orange-50"
                                        />
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Date Input */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Date Réglement
                                        </label>
                                        <input
                                            type="date"
                                            name="datReg"
                                            value={formData.datReg}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Modalité de règlement */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Modalité de Règlement
                                        </label>
                                        <select
                                            name="modReg"
                                            value={formData.modReg}
                                            onChange={handleInputChange}
                                            disabled={loading || loadingModes}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        >
                                            {paymentModes.length > 0 ? (
                                                paymentModes.map((mode) => (
                                                    <option key={mode.IDReg} value={mode.label}>
                                                        {mode.label}
                                                    </option>
                                                ))
                                            ) : (
                                                <>
                                                    <option value="ESPECE">ESPECE</option>
                                                    <option value="CHEQUE">CHEQUE</option>
                                                    <option value="VIREMENT">VIREMENT</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </div>

                                {(requiresReference || requiresBank) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Numéro de pièce {requiresReference ? '*' : ''}
                                            </label>
                                            <input
                                                type="text"
                                                name="numPiece"
                                                value={formData.numPiece}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                                placeholder="Ex: CHQ-001245"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Banque {requiresBank ? '*' : ''}
                                            </label>
                                            <input
                                                type="text"
                                                name="banque"
                                                value={formData.banque}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                                placeholder="Ex: BIAT"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Détail (optionnel)
                                    </label>
                                    <input
                                        type="text"
                                        name="detail"
                                        value={formData.detail}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                        placeholder="Note complémentaire..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                </div>

                                {/* Amount Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Montant Total
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="mntReg"
                                            value={formData.mntReg}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        />
                                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                            DH
                                        </span>
                                    </div>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                {/* Success Message */}
                                {success && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm font-medium"
                                    >
                                        {success}
                                    </motion.div>
                                )}

                                {/* Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Annuler
                                    </button>
                                    <motion.button
                                        type="submit"
                                        disabled={loading}
                                        whileHover={{ scale: loading ? 1 : 1.02 }}
                                        whileTap={{ scale: loading ? 1 : 0.98 }}
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition disabled:cursor-not-allowed disabled:opacity-70 font-medium"
                                    >
                                        {loading ? 'Création...' : 'Créer'}
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
