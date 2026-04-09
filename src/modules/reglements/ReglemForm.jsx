import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from '../../app/axios';

const ReglemForm = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        codTiers: '',
        libTiers: '',
        mntReg: '',
        datReg: new Date().toISOString().split('T')[0],
    });
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [loadingClients, setLoadingClients] = useState(false);

    // Fetch clients on modal open
    useEffect(() => {
        if (isOpen) {
            fetchClients();
        }
    }, [isOpen]);

    const fetchClients = async () => {
        try {
            setLoadingClients(true);
            setError('');
            
            // Essayer plusieurs endpoints possibles
            let response;
            try {
                response = await axios.get('/tiers');
            } catch (err) {
                if (err.response?.status === 404) {
                    console.log('Endpoint /tiers not found, trying /clients...');
                    response = await axios.get('/clients');
                } else {
                    throw err;
                }
            }
            
            if (response.data?.data && Array.isArray(response.data.data)) {
                setClients(response.data.data);
                console.log(`✅ ${response.data.data.length} clients chargés`);
            } else if (Array.isArray(response.data)) {
                setClients(response.data);
                console.log(`✅ ${response.data.length} clients chargés`);
            } else {
                console.warn('Format de réponse inattendu:', response.data);
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
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleClientChange = (e) => {
        const codTiers = e.target.value;
        const client = clients.find(c => c.CodTiers === codTiers);
        setFormData(prev => ({
            ...prev,
            codTiers,
            libTiers: client?.LibelleComplet || client?.Nom || codTiers
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.codTiers.trim()) {
            setError('Sélectionnez un client');
            return;
        }
        if (!formData.mntReg || parseFloat(formData.mntReg) <= 0) {
            setError('Entrez un montant valide');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const response = await axios.post('/reglements', {
                codTiers: formData.codTiers,
                libTiers: formData.libTiers,
                mntReg: parseFloat(formData.mntReg),
                datReg: formData.datReg
            });

            if (response.data?.data) {
                // Reset form
                setFormData({
                    codTiers: '',
                    libTiers: '',
                    mntReg: '',
                    datReg: new Date().toISOString().split('T')[0],
                });

                // Call success callback
                if (onSuccess) {
                    onSuccess(response.data.data);
                }

                // Close modal
                onClose();
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
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
                    >
                        <div className="bg-white rounded-xl shadow-2xl w-96 overflow-hidden">
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
                                        <select
                                            name="codTiers"
                                            value={formData.codTiers}
                                            onChange={handleClientChange}
                                            disabled={loading}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Sélectionnez un client...</option>
                                            {clients.map(client => {
                                                const clientName = client.LibelleComplet || client.Nom || client.LibTiers || client.CodTiers || client.id;
                                                return (
                                                    <option key={client.CodTiers || client.id} value={client.CodTiers || client.id}>
                                                        {`${client.CodTiers || client.id} - ${clientName}`}
                                                    </option>
                                                );
                                            })}
                                        </select>
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
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ReglemForm;
