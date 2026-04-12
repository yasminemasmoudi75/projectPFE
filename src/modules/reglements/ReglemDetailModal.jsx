import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import axios from '../../app/axios';
import { formatDate, formatCurrency } from '../../utils/format';

const ReglemDetailModal = ({ isOpen, onClose, reglementId }) => {
    const [reglement, setReglement] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const toDateOnly = (value) => {
        if (!value) return '';
        const raw = typeof value === 'string' ? value : new Date(value).toISOString();
        return raw.slice(0, 10);
    };

    const fetchReglemDetail = useCallback(async () => {
        if (!reglementId) {
            console.warn('⚠️ No reglementId provided');
            return;
        }

        try {
            setLoading(true);
            setError('');
            console.log(`🔍 Fetching reglement detail for ID: ${reglementId}`);
            const response = await axios.get(`/reglements/${reglementId}`);
            console.log('✅ Full response:', response);
            console.log('✅ Response data:', response.data);
            
            // Handle both response formats
            const data = response.data?.data || response.data;
            console.log('✅ Extracted data:', data);
            
            if (data && data.id) {
                console.log('✅ Setting reglement state:', data);
                setReglement(data);
            } else {
                console.warn('⚠️ Invalid data structure');
                setError('Structure de données invalide reçue du serveur');
            }
        } catch (err) {
            console.error('❌ Error fetching reglement details:', err);
            console.error('❌ Error response:', err.response?.data);
            const errorMsg = err.response?.data?.message || err.message || 'Erreur lors du chargement des détails';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [reglementId]);

    useEffect(() => {
        if (isOpen && reglementId) {
            console.log(`✅ Modal opened, fetching reglement ${reglementId}`);
            fetchReglemDetail();
        } else {
            console.log(`⏹️ Modal closed or no reglementId`);
            setReglement(null);
            setError('');
        }
    }, [isOpen, reglementId, fetchReglemDetail]);

    if (!isOpen) return null;

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
                            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <DocumentTextIcon className="w-6 h-6 text-white" />
                                    <h2 className="text-xl font-bold text-white">Détails du Réglement</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-white/80 hover:text-white transition"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            {loading ? (
                                <div className="p-6 text-center">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 animate-spin">
                                        <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600"></div>
                                    </div>
                                    <p className="mt-4 text-gray-600">Chargement...</p>
                                </div>
                            ) : error ? (
                                <div className="p-6">
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                        {error}
                                    </div>
                                </div>
                            ) : reglement ? (
                                <div className="p-6 space-y-6">
                                    {/* Master Information */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Date du Réglement</label>
                                            <p className="text-lg font-bold text-gray-900">{formatDate(toDateOnly(reglement.date))}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">ID Réglement</label>
                                            <p className="text-sm font-mono text-gray-600">{reglement.id}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Client (Code)</label>
                                            <p className="text-lg font-bold text-gray-900">{reglement.codTiers || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Nom Client</label>
                                            <p className="text-lg font-bold text-gray-900">{reglement.client || 'N/A'}</p>
                                        </div>
                                    </div>

                                    {/* Financial Summary */}
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 font-medium">Montant Total</span>
                                            <span className="text-xl font-bold text-gray-900">{formatCurrency(reglement.totalAmount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 font-medium">Montant Payé</span>
                                            <span className="text-xl font-bold text-emerald-600">{formatCurrency(reglement.paidAmount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 font-medium">Montant Restant</span>
                                            <span className="text-xl font-bold text-orange-600">{formatCurrency(reglement.remainingAmount)}</span>
                                        </div>
                                        <div className="pt-2 border-t border-blue-200 flex justify-between items-center">
                                            <span className="text-gray-700 font-medium">Statut</span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                reglement.isPayed 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                {reglement.isPayed ? '✅ Payé' : '⏳ Non Payé'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Payment Details */}
                                    {reglement.details && reglement.details.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-3">Détails des Paiements</h3>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-gray-600">
                                                    <thead className="bg-gray-100">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Mode</th>
                                                            <th className="px-4 py-2 text-right font-semibold text-gray-700">Montant</th>
                                                            <th className="px-4 py-2 text-right font-semibold text-gray-700">Crédit</th>
                                                            <th className="px-4 py-2 text-center font-semibold text-gray-700">Date Valeur</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {reglement.details.map((detail) => (
                                                            <tr key={detail.ID} className="hover:bg-gray-50">
                                                                <td className="px-4 py-2">{detail.ModReg || 'ESPECE'}</td>
                                                                <td className="px-4 py-2 text-right font-medium">{formatCurrency(detail.Montant)}</td>
                                                                <td className="px-4 py-2 text-right font-bold text-emerald-600">{formatCurrency(detail.MntCredit)}</td>
                                                                <td className="px-4 py-2 text-center">{formatDate(toDateOnly(detail.DatValeur))}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Linked Documents */}
                                    {reglement.pieces && reglement.pieces.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-3">Pièces Jointes</h3>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-gray-600">
                                                    <thead className="bg-gray-100">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Numéro</th>
                                                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Type</th>
                                                            <th className="px-4 py-2 text-right font-semibold text-gray-700">Montant</th>
                                                            <th className="px-4 py-2 text-right font-semibold text-gray-700">Solde</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {reglement.pieces.map((piece) => (
                                                            <tr key={piece.ID} className="hover:bg-gray-50">
                                                                <td className="px-4 py-2 font-medium">{piece.NumPiece}</td>
                                                                <td className="px-4 py-2">
                                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                                                                        {piece.TypPiece}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-2 text-right font-medium">{formatCurrency(piece.MntPiece)}</td>
                                                                <td className="px-4 py-2 text-right font-medium">{formatCurrency(piece.Solde)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Creation Info */}
                                    <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
                                        <p>Créé par: <span className="font-semibold">{reglement.createdBy}</span></p>
                                        <p>Date création: <span className="font-semibold">{formatDate(toDateOnly(reglement.createdDate))}</span></p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 text-center text-gray-500">
                                    Aucune donnée disponible
                                </div>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ReglemDetailModal;
