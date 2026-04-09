import { useState } from 'react';
import axios from '../../app/axios';
import { formatCurrency } from '../../utils/format';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ReglemPaymentModal = ({ reglement, isOpen, onClose, onSuccess }) => {
  const [mntCredit, setMntCredit] = useState(reglement?.paidAmount || 0);
  const [payed, setPayed] = useState(reglement?.isPayed || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('💳 Submitting payment:', { mntCredit, payed });

      const response = await axios.put(`/reglements/${reglement.id}`, {
        mntCredit: parseFloat(mntCredit),
        payed: payed,
      });

      console.log('✅ Payment recorded:', response.data);
      
      if (onSuccess) {
        onSuccess(response.data.data);
      }
      
      // Close modal
      onClose();
    } catch (err) {
      console.error('❌ Error recording payment:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement du paiement');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !reglement) return null;

  const calculatedRemaining = reglement.totalAmount - mntCredit;
  const calculatedPercentage = reglement.totalAmount > 0 ? Math.round((mntCredit / reglement.totalAmount) * 100) : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-white">Enregistrer Paiement</h2>
              <p className="text-blue-100 text-sm mt-1">
                Réglement <span className="font-bold">#{reglement.id}</span>
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </motion.button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium"
              >
                {error}
              </motion.div>
            )}

            {/* Info Cards */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Montant Total</p>
                <p className="text-2xl font-extrabold text-slate-900">
                  {formatCurrency(reglement.totalAmount)}
                </p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Montant Actuellement Payé</p>
                <p className="text-2xl font-extrabold text-emerald-700">
                  {formatCurrency(reglement.paidAmount)}
                </p>
              </div>
            </div>

            {/* Input: Montant Reçu */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                💰 Montant Total Reçu (cumulatif)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={reglement.totalAmount}
                value={mntCredit}
                onChange={(e) => setMntCredit(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg font-semibold"
                placeholder="0.00"
              />
              <p className="text-xs text-slate-500 mt-2">
                Somme totale des versements reçus
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-bold text-slate-700">Progression</span>
                <span className="text-sm font-bold text-blue-600">{calculatedPercentage}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${calculatedPercentage}%` }}
                  transition={{ duration: 0.5, type: "spring" }}
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                ></motion.div>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Payé: <span className="font-bold text-emerald-600">{formatCurrency(mntCredit)}</span></span>
                <span>Restant: <span className="font-bold text-orange-600">{formatCurrency(Math.max(0, calculatedRemaining))}</span></span>
              </div>
            </div>

            {/* Checkbox */}
            <label className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer">
              <input
                type="checkbox"
                checked={payed}
                onChange={(e) => setPayed(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-blue-400 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-600 cursor-pointer"
              />
              <span className="text-sm font-bold text-slate-800">
                Marquer comme entièrement payé
              </span>
            </label>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Annuler
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="inline-block"
                    >
                      ⏳
                    </motion.span>
                    Enregistrement...
                  </>
                ) : (
                  <>💳 Enregistrer</>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReglemPaymentModal;
