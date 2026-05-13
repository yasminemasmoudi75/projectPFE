import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import axios from '../../app/axios';
import { formatDate, formatCurrency } from '../../utils/format';

const toDateOnly = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DocumentReglementHistoryModal = ({
  isOpen,
  onClose,
  documentId,
  documentType,
  documentLabel,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!isOpen || !documentId || !documentType) {
      setHistory([]);
      setError('');
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get(`/reglements/document/${encodeURIComponent(documentType)}/${encodeURIComponent(documentId)}`);
        const rows = response?.data?.data || response?.data || [];
        setHistory(Array.isArray(rows) ? rows : []);
      } catch (err) {
        setHistory([]);
        setError(err?.response?.data?.message || 'Impossible de charger l\'historique des règlements');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, documentId, documentType]);

  if (!isOpen) return null;

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
              className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                  <div>
                    <h2 className="text-xl font-bold text-white">Historique des règlements</h2>
                    <p className="text-xs text-blue-100">
                      {documentType} - {documentLabel || documentId}
                    </p>
                  </div>
                </div>
                <button onClick={onClose} className="text-white/80 hover:text-white transition">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {loading ? (
                  <div className="py-10 text-center text-slate-500">Chargement...</div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
                ) : history.length === 0 ? (
                  <div className="py-10 text-center text-slate-500">Aucun règlement lié à ce document.</div>
                ) : (
                  history.map((reglement) => (
                    <div key={reglement.id} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-800">Règlement {reglement.id}</p>
                          <p className="text-xs text-slate-500">
                            Date: {formatDate(toDateOnly(reglement.date))} | Client: {reglement.client || reglement.codTiers}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-800">Total: {formatCurrency(reglement.totalAmount)}</p>
                          <p className="text-xs text-emerald-700">Payé: {formatCurrency(reglement.paidAmount)}</p>
                          <p className="text-xs text-orange-700">Restant: {formatCurrency(reglement.remainingAmount)}</p>
                        </div>
                      </div>

                      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 mb-2">Tranches liées au document</h3>
                          <div className="overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-50 text-slate-700">
                                <tr>
                                  <th className="px-2 py-2 text-left">Date</th>
                                  <th className="px-2 py-2 text-right">Montant réglé</th>
                                  <th className="px-2 py-2 text-right">Solde ligne</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(reglement.tranches || []).map((tranche) => (
                                  <tr key={tranche.id} className="border-t border-slate-100">
                                    <td className="px-2 py-2">{formatDate(toDateOnly(tranche.date))}</td>
                                    <td className="px-2 py-2 text-right font-semibold">{formatCurrency(tranche.montantRegle)}</td>
                                    <td className="px-2 py-2 text-right">{formatCurrency(tranche.solde)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-slate-800 mb-2">Paiements du règlement</h3>
                          <div className="overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-50 text-slate-700">
                                <tr>
                                  <th className="px-2 py-2 text-left">Date</th>
                                  <th className="px-2 py-2 text-left">Mode</th>
                                  <th className="px-2 py-2 text-right">Montant</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(reglement.payments || []).map((payment) => (
                                  <tr key={payment.id} className="border-t border-slate-100">
                                    <td className="px-2 py-2">{formatDate(toDateOnly(payment.date))}</td>
                                    <td className="px-2 py-2">{payment.mode || '-'}</td>
                                    <td className="px-2 py-2 text-right font-semibold">{formatCurrency(payment.credit || payment.montant)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DocumentReglementHistoryModal;
