import { useState, useEffect } from 'react';
import {
  ShoppingCartIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  DocumentTextIcon,
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
  'Confirmée': { icon: CheckCircleIcon, color: 'text-blue-600', bg: 'bg-blue-50', label: '✓' },
  'Expédiée': { icon: TruckIcon, color: 'text-purple-600', bg: 'bg-purple-50', label: '🚚' },
  'Livrée': { icon: CheckCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', label: '✓' },
  'Annulée': { icon: ClockIcon, color: 'text-red-600', bg: 'bg-red-50', label: '✗' },
};

const ClientOrdersTab = () => {
  const { allPermissions, loading: permissionsLoading } = usePermission();
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('orders');
  const [statusFilter, setStatusFilter] = useState('all');

  const canReadOrders = allPermissions.some(
    (p) => Number(p.moduleCode) === Number(MODULE_CODES.COMMANDES) && p.isActive === true
  );
  const canReadDeliveries = allPermissions.some(
    (p) => Number(p.moduleCode) === Number(MODULE_CODES.LIVRAISONS) && p.isActive === true
  );

  useEffect(() => {
    if (permissionsLoading) return;
    fetchData();
  }, [permissionsLoading, canReadOrders, canReadDeliveries]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, deliveriesRes] = await Promise.all([
        canReadOrders ? axios.get('/bcv/my-orders') : Promise.resolve({ data: [] }),
        canReadDeliveries ? axios.get('/blv/my-deliveries') : Promise.resolve({ data: [] }),
      ]);
      setOrders(ordersRes?.data || []);
      setDeliveries(deliveriesRes?.data || []);
    } catch (error) {
      setOrders([]);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (id, type) => {
    try {
      const endpoint = type === 'order' ? `/bcv/${id}/pdf` : `/blv/${id}/pdf`;
      const response = await axios.get(endpoint, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const currentData = selectedTab === 'orders' ? orders : deliveries;

  const filteredData = currentData.filter((item) => {
    if (statusFilter === 'all') return true;
    return item.statut === statusFilter;
  });

  return (
    <div className='space-y-6'>
      {/* Tabs */}
      <div className='flex gap-4 border-b border-gray-200'>
        <button
          onClick={() => {
            setSelectedTab('orders');
            setStatusFilter('all');
          }}
          className={`px-4 py-2 font-medium transition-all border-b-2 ${
            selectedTab === 'orders'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className='flex items-center gap-2'>
            <DocumentTextIcon className='w-5 h-5' />
            Bons de Commande ({orders.length})
          </div>
        </button>
        <button
          onClick={() => {
            setSelectedTab('deliveries');
            setStatusFilter('all');
          }}
          className={`px-4 py-2 font-medium transition-all border-b-2 ${
            selectedTab === 'deliveries'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className='flex items-center gap-2'>
            <TruckIcon className='w-5 h-5' />
            Livraisons ({deliveries.length})
          </div>
        </button>
      </div>

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
          Tous ({filteredData.length})
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
      ) : filteredData.length === 0 ? (
        <div className='text-center py-12'>
          <ShoppingCartIcon className='w-16 h-16 mx-auto text-gray-300 mb-4' />
          <p className='text-gray-600 text-lg'>
            {selectedTab === 'orders'
              ? 'Aucun bon de commande'
              : 'Aucune livraison'}
          </p>
        </div>
      ) : (
        <AnimatePresence mode='popLayout'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-gray-200 bg-gray-50'>
                  <th className='text-left px-4 py-3 font-semibold text-slate-900'>
                    {selectedTab === 'orders' ? 'N° Commande' : 'N° Livraison'}
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
                  <th className='text-center px-4 py-3 font-semibold text-slate-900'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, idx) => {
                  const statusConfig = STATUS[item.statut] || STATUS['En attente'];

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
                          {statusConfig.label} {item.statut}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-right font-semibold text-slate-900'>
                        {formatCurrency(item.montant)}
                      </td>
                      <td className='px-4 py-3 text-center'>
                        <button
                          onClick={() => handleDownloadPDF(item.id, selectedTab === 'orders' ? 'order' : 'delivery')}
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

export default ClientOrdersTab;
