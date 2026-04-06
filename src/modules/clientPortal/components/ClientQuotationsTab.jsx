import { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../../utils/format';
import axios from '../../../app/axios';
import toast from 'react-hot-toast';
import usePermission from '../../../hooks/usePermission';
import { MODULE_CODES } from '../../../utils/constants';

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', bounce: 0, duration: 0.4 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

const STATUS = {
  'En attente': { icon: ClockIcon, color: 'text-amber-600', bg: 'bg-amber-50', label: '⏳' },
  'Validée': { icon: CheckCircleIcon, color: 'text-blue-600', bg: 'bg-blue-50', label: '✓' },
  'Acceptée': { icon: CheckCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', label: '✓' },
  'Convertie': { icon: CheckCircleIcon, color: 'text-purple-600', bg: 'bg-purple-50', label: '→' },
  'Rejetée': { icon: XMarkIcon, color: 'text-red-600', bg: 'bg-red-50', label: '✗' },
};

const ClientQuotationsTab = () => {
  const { allPermissions, loading: permissionsLoading } = usePermission();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  const canReadQuotations = allPermissions.some(
    (p) => Number(p.moduleCode) === Number(MODULE_CODES.DEVIS) && p.isActive === true
  );

  useEffect(() => {
    if (permissionsLoading) return;
    if (!canReadQuotations) {
      setQuotations([]);
      setLoading(false);
      return;
    }
    fetchQuotations();
  }, [permissionsLoading, canReadQuotations]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/devis/my-quotations');
      setQuotations(response?.data || []);
    } catch (error) {
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (id) => {
    try {
      const response = await axios.get(`/devis/${id}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `devis-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const filteredQuotations = quotations.filter((q) => {
    if (statusFilter === 'all') return true;
    return q.statut === statusFilter;
  });

  if (selectedQuotation) {
    const q = quotations.find((qt) => qt.id === selectedQuotation);
    return <QuotationDetail quotation={q} onBack={() => setSelectedQuotation(null)} />;
  }

  return (
    <div className='space-y-6'>
      {/* Status Filter */}
      <div className='flex gap-2 flex-wrap'>
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            statusFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Tous ({filteredQuotations.length})
        </button>
        {Object.entries(STATUS).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {config.label} {status}
          </button>
        ))}
      </div>

      {/* Data Table */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredQuotations.length === 0 ? (
        <div className='text-center py-12'>
          <DocumentTextIcon className='w-16 h-16 mx-auto text-gray-300 mb-4' />
          <p className='text-gray-600 text-lg'>Aucun devis trouvé</p>
        </div>
      ) : (
        <AnimatePresence mode='popLayout'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-gray-200 bg-gray-50'>
                  <th className='text-left px-4 py-3 font-semibold text-slate-900'>
                    N° Devis
                  </th>
                  <th className='text-left px-4 py-3 font-semibold text-slate-900'>
                    Date
                  </th>
                  <th className='text-left px-4 py-3 font-semibold text-slate-900'>
                    Statut
                  </th>
                  <th className='text-right px-4 py-3 font-semibold text-slate-900'>
                    Montant
                  </th>
                  <th className='text-left px-4 py-3 font-semibold text-slate-900'>
                    Validité
                  </th>
                  <th className='text-center px-4 py-3 font-semibold text-slate-900'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map((q) => {
                  const statusConfig = STATUS[q.statut] || STATUS['En attente'];
                  const daysLeft = Math.ceil(
                    (new Date(q.dateValidite) - new Date()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <motion.tr
                      key={q.id}
                      variants={rowVariants}
                      initial='hidden'
                      animate='visible'
                      exit='exit'
                      className='border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer'
                      onClick={() => setSelectedQuotation(q.id)}
                    >
                      <td className='px-4 py-3 font-semibold text-slate-900'>
                        {q.numero}
                      </td>
                      <td className='px-4 py-3 text-slate-600'>
                        {formatDate(q.date)}
                      </td>
                      <td className='px-4 py-3'>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.color}`}
                        >
                          {statusConfig.label} {q.statut}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-right font-semibold text-slate-900'>
                        {formatCurrency(q.montant)}
                      </td>
                      <td className='px-4 py-3 text-sm text-slate-600'>
                        {daysLeft > 0 ? (
                          <span className='text-emerald-600 font-medium'>
                            {daysLeft} j
                          </span>
                        ) : (
                          <span className='text-red-600 font-medium'>Expiré</span>
                        )}
                      </td>
                      <td className='px-4 py-3 text-center' onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDownloadPDF(q.id)}
                          className='p-2 hover:bg-blue-100 rounded-lg transition-all inline-flex items-center'
                          title='Télécharger PDF'
                        >
                          <ArrowDownTrayIcon className='w-5 h-5 text-blue-600' />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};

// Quotation Detail Component
const QuotationDetail = ({ quotation, onBack }) => {
  if (!quotation) return null;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <button
        onClick={onBack}
        className='flex items-center gap-2 text-blue-600 mb-6 hover:text-blue-700'
      >
        ← Retour
      </button>

      <div className='bg-white rounded-lg border border-gray-200 p-6 space-y-6'>
        <div className='flex items-start justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-slate-900'>Devis {quotation.numero}</h1>
            <p className='text-slate-600'>Date: {formatDate(quotation.date)}</p>
          </div>
          <span className='text-3xl font-bold text-blue-600'>
            {formatCurrency(quotation.montant)}
          </span>
        </div>

        <table className='w-full border-collapse'>
          <thead>
            <tr className='border-b-2 border-gray-300'>
              <th className='text-left py-2 px-4'>Produit</th>
              <th className='text-center py-2 px-4'>Quantité</th>
              <th className='text-right py-2 px-4'>P.U.</th>
              <th className='text-right py-2 px-4'>Montant</th>
            </tr>
          </thead>
          <tbody>
            {quotation.lignes?.map((ligne, idx) => (
              <tr key={idx} className='border-b border-gray-200'>
                <td className='py-2 px-4'>{ligne.produit}</td>
                <td className='text-center py-2 px-4'>{ligne.quantite}</td>
                <td className='text-right py-2 px-4'>{formatCurrency(ligne.prixUnitaire)}</td>
                <td className='text-right py-2 px-4 font-semibold'>
                  {formatCurrency(ligne.montant)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default ClientQuotationsTab;
