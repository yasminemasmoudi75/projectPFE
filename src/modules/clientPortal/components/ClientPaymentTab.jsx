import { useState, useEffect } from 'react';
import {
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
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

const STATUS_PAYMENT = {
  'Payée': { icon: CheckCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', label: '✓ Payée' },
  'Partiellement payée': { icon: ClockIcon, color: 'text-amber-600', bg: 'bg-amber-50', label: '⏳ Partielle' },
  'En attente': { icon: ExclamationCircleIcon, color: 'text-red-600', bg: 'bg-red-50', label: '⚠️ En attente' },
};

const ClientPaymentTab = () => {
  const { allPermissions, loading: permissionsLoading } = usePermission();
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('payments');
  const [statusFilter, setStatusFilter] = useState('all');
  const [summary, setSummary] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    totalDelivered: 0,
  });

  const canReadInvoices = allPermissions.some(
    (p) => Number(p.moduleCode) === Number(MODULE_CODES.FACTURES) && p.isActive === true
  );

  useEffect(() => {
    if (permissionsLoading) return;
    if (!canReadInvoices) {
      setPayments([]);
      setInvoices([]);
      setSummary({ total: 0, paid: 0, pending: 0, totalDelivered: 0 });
      setLoading(false);
      return;
    }
    fetchData();
  }, [permissionsLoading, canReadInvoices]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const invoicesRes = await axios.get('/fav/my-invoices');
      const invoicesData = invoicesRes?.data || [];
      const paymentsData = invoicesData
        .filter((i) => Number(i.montantPaye || 0) > 0)
        .map((i) => ({
          ...i,
          montant: Number(i.montantPaye || 0),
          statut: Number(i.montantRestant || 0) > 0 ? 'Partiellement payée' : 'Payée',
        }));

      setPayments(paymentsData);
      setInvoices(invoicesData);

      // Calculate summary
      const totalPaid = paymentsData
        .filter((p) => p.statut === 'Payée')
        .reduce((sum, p) => sum + (p.montant || 0), 0);

      const totalPending = invoicesData
        .reduce((sum, i) => sum + (i.montantRestant || 0), 0);

      setSummary({
        total: invoicesData.reduce((sum, i) => sum + (i.montant || 0), 0),
        paid: totalPaid,
        pending: totalPending,
        totalDelivered: invoicesData.length,
      });
    } catch (error) {
      setPayments([]);
      setInvoices([]);
      setSummary({ total: 0, paid: 0, pending: 0, totalDelivered: 0 });
    } finally {
      setLoading(false);
    }
  };

  const currentData = selectedTab === 'payments' ? payments : invoices;

  const filteredData = currentData.filter((item) => {
    if (statusFilter === 'all') return true;
    return item.statut === statusFilter;
  });

  return (
    <div className='space-y-6'>
      {/* Summary Cards */}
      {!loading && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div className='bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200'>
            <p className='text-blue-700 text-sm font-medium'>Total facturé</p>
            <p className='text-2xl font-bold text-blue-900 mt-1'>
              {formatCurrency(summary.total)}
            </p>
          </div>
          <div className='bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200'>
            <p className='text-emerald-700 text-sm font-medium'>Montant payé</p>
            <p className='text-2xl font-bold text-emerald-900 mt-1'>
              {formatCurrency(summary.paid)}
            </p>
          </div>
          <div className='bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200'>
            <p className='text-amber-700 text-sm font-medium'>Montant en attente</p>
            <p className='text-2xl font-bold text-amber-900 mt-1'>
              {formatCurrency(summary.pending)}
            </p>
          </div>
          <div className='bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200'>
            <p className='text-purple-700 text-sm font-medium'>Factures livrées</p>
            <p className='text-2xl font-bold text-purple-900 mt-1'>
              {summary.totalDelivered}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className='flex gap-4 border-b border-gray-200'>
        <button
          onClick={() => {
            setSelectedTab('payments');
            setStatusFilter('all');
          }}
          className={`px-4 py-2 font-medium transition-all border-b-2 ${
            selectedTab === 'payments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className='flex items-center gap-2'>
            <BanknotesIcon className='w-5 h-5' />
            Paiements ({payments.length})
          </div>
        </button>
        <button
          onClick={() => {
            setSelectedTab('invoices');
            setStatusFilter('all');
          }}
          className={`px-4 py-2 font-medium transition-all border-b-2 ${
            selectedTab === 'invoices'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className='flex items-center gap-2'>
            <ArrowDownLeftIcon className='w-5 h-5' />
            Factures ({invoices.length})
          </div>
        </button>
      </div>

      {/* Status Filter */}
      {selectedTab === 'payments' && (
        <div className='flex gap-2 flex-wrap'>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Tous ({filteredData.length})
          </button>
          {Object.entries(STATUS_PAYMENT).map(([status, config]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      )}

      {/* Data Table */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredData.length === 0 ? (
        <div className='text-center py-12'>
          <BanknotesIcon className='w-16 h-16 mx-auto text-gray-300 mb-4' />
          <p className='text-gray-600 text-lg'>
            {selectedTab === 'payments'
              ? 'Aucun paiement trouvé'
              : 'Aucune facture trouvée'}
          </p>
        </div>
      ) : (
        <AnimatePresence mode='popLayout'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-gray-200 bg-gray-50'>
                  <th className='text-left px-4 py-3 font-semibold text-slate-900'>
                    {selectedTab === 'payments' ? 'N° Paiement' : 'N° Facture'}
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
                  {selectedTab === 'invoices' && (
                    <th className='text-right px-4 py-3 font-semibold text-slate-900'>
                      Restant
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => {
                  const statusConfig =
                    STATUS_PAYMENT[item.statut] || STATUS_PAYMENT['En attente'];

                  return (
                    <motion.tr
                      key={item.id}
                      variants={rowVariants}
                      initial='hidden'
                      animate='visible'
                      exit='exit'
                      className='border-b border-gray-200 hover:bg-gray-50 transition-colors'
                    >
                      <td className='px-4 py-3 font-semibold text-slate-900'>
                        {item.numero}
                      </td>
                      <td className='px-4 py-3 text-slate-600'>
                        {formatDate(item.date)}
                      </td>
                      <td className='px-4 py-3'>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.color}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-right font-semibold text-slate-900'>
                        {formatCurrency(item.montant)}
                      </td>
                      {selectedTab === 'invoices' && (
                        <td className='px-4 py-3 text-right font-semibold'>
                          <span
                            className={
                              item.montantRestant > 0
                                ? 'text-red-600'
                                : 'text-emerald-600'
                            }
                          >
                            {formatCurrency(item.montantRestant)}
                          </span>
                        </td>
                      )}
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

export default ClientPaymentTab;
