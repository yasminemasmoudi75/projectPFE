import { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { useLocation } from 'react-router-dom';
import {
  LifebuoyIcon,
  ShoppingCartIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ChartBarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import useAuth from '../../hooks/useAuth';
import usePermission from '../../hooks/usePermission';
import axios from '../../app/axios';
import { MODULE_CODES } from '../../utils/constants';

// Components
import ClientClaimsTab from './components/ClientClaimsTab';
import ClientOrdersTab from './components/ClientOrdersTab';
import ClientPaymentTab from './components/ClientPaymentTab';
import ClientQuotationsTab from './components/ClientQuotationsTab';
import ClientDashboardCards from './components/ClientDashboardCards';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

const ClientPortalDashboard = () => {
  const { user } = useAuth();
  const { allPermissions, loading: permissionsLoading } = usePermission();
  const location = useLocation();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [stats, setStats] = useState({
    totalClaims: 0,
    openClaims: 0,
    pendingPayments: 0,
    totalOrders: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (permissionsLoading) return;

      const hasModuleAccess = (moduleCode) =>
        allPermissions.some(
          (p) => Number(p.moduleCode) === Number(moduleCode) && p.isActive === true
        );

      const canReadClaims = hasModuleAccess(MODULE_CODES.REGLEMENT);
      const canReadOrders = hasModuleAccess(MODULE_CODES.COMMANDES);
      const canReadInvoices = hasModuleAccess(MODULE_CODES.FACTURES);

      try {
        setLoadingStats(true);
        const [claimsRes, ordersRes, invoicesRes] = await Promise.all([
          canReadClaims ? axios.get('/reclamations/my-claims') : Promise.resolve({ data: [] }),
          canReadOrders ? axios.get('/bcv/my-orders') : Promise.resolve({ data: [] }),
          canReadInvoices ? axios.get('/fav/my-invoices') : Promise.resolve({ data: [] }),
        ]);

        const claims = claimsRes?.data || [];
        const orders = ordersRes?.data || [];
        const invoices = invoicesRes?.data || [];
        const pendingPayments = invoices.reduce(
          (sum, invoice) => sum + Number(invoice?.montantRestant || 0),
          0
        );

        setStats({
          totalClaims: claims.length || 0,
          openClaims: claims.filter((c) => c.statut !== 'Résolu').length || 0,
          pendingPayments,
          totalOrders: orders.length || 0,
        });
      } catch (error) {
        setStats({ totalClaims: 0, openClaims: 0, pendingPayments: 0, totalOrders: 0 });
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [allPermissions, permissionsLoading]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = (params.get('tab') || '').toLowerCase();
    const tabToIndex = {
      dashboard: 0,
      claims: 1,
      orders: 2,
      quotations: 3,
      payments: 4,
    };

    if (Object.prototype.hasOwnProperty.call(tabToIndex, tab)) {
      setSelectedIndex(tabToIndex[tab]);
    }
  }, [location.search]);

  const tabs = [
    {
      name: 'Tableau de bord',
      icon: ChartBarIcon,
      component: () => (
        <ClientDashboardCards stats={stats} loading={loadingStats} />
      ),
    },
    {
      name: 'Mes réclamations',
      icon: LifebuoyIcon,
      component: ClientClaimsTab,
    },
    {
      name: 'Mes commandes',
      icon: ShoppingCartIcon,
      component: ClientOrdersTab,
    },
    {
      name: 'Mes devis',
      icon: DocumentTextIcon,
      component: ClientQuotationsTab,
    },
    {
      name: 'Paiements',
      icon: BanknotesIcon,
      component: ClientPaymentTab,
    },
  ];

  return (
    <motion.div
      className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 py-8'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <motion.div variants={itemVariants} className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-4xl font-bold text-slate-900 flex items-center gap-2'>
                <SparklesIcon className='w-10 h-10 text-blue-600' />
                Portail Client
              </h1>
              <p className='text-slate-600 mt-2'>
                Bienvenue {user?.nom} {user?.prenom}, gérez vos réclamations,
                commandes et paiements
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants}>
          <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
            <div className='bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden'>
              <Tab.List className='flex overflow-x-auto border-b border-slate-200 bg-slate-50'>
                {tabs.map(({ name, icon: Icon }, idx) => (
                  <Tab
                    key={idx}
                    className={({ selected }) =>
                      `flex-1 min-w-max px-6 py-4 text-sm font-medium transition-all
                      ${
                        selected
                          ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`
                    }
                  >
                    <div className='flex items-center gap-2'>
                      <Icon className='w-5 h-5' />
                      {name}
                    </div>
                  </Tab>
                ))}
              </Tab.List>

              <Tab.Panels className='p-6'>
                {tabs.map(({ component: Component }, idx) => (
                  <Tab.Panel key={idx} className='outline-none'>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Component />
                    </motion.div>
                  </Tab.Panel>
                ))}
              </Tab.Panels>
            </div>
          </Tab.Group>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ClientPortalDashboard;
