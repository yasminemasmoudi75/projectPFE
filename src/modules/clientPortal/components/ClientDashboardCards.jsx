import { motion } from 'framer-motion';
import {
  LifebuoyIcon,
  ShoppingCartIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

const ClientDashboardCards = ({ stats, loading }) => {
  const cards = [
    {
      title: 'Mes Réclamations',
      value: stats.totalClaims,
      subtitle: `${stats.openClaims} en cours`,
      icon: LifebuoyIcon,
      color: 'from-blue-600 to-blue-400',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-900',
    },
    {
      title: 'Mes Commandes',
      value: stats.totalOrders,
      subtitle: 'Bons de commande actifs',
      icon: ShoppingCartIcon,
      color: 'from-purple-600 to-purple-400',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-900',
    },
    {
      title: 'Paiements en Attente',
      value: stats.pendingPayments,
      subtitle: 'À régulariser',
      icon: BanknotesIcon,
      color: 'from-amber-600 to-amber-400',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-900',
    },
    {
      title: 'Taux de Réclamation',
      value: '0%',
      subtitle: 'Aucune sans suite',
      icon: CheckCircleIcon,
      color: 'from-emerald-600 to-emerald-400',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-900',
    },
  ];

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={idx}
            variants={itemVariants}
            className={`rounded-lg p-6 border border-gray-200 overflow-hidden relative group`}
          >
            {/* Gradient Background */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5 group-hover:opacity-10 transition-opacity`}
            />

            {/* Content */}
            <div className='relative z-10'>
              <div className='flex items-start justify-between mb-4'>
                <div className={`p-3 rounded-lg ${card.bgLight}`}>
                  <Icon className={`w-6 h-6 text-${card.color.split('-')[1]}-600`} />
                </div>
              </div>

              <h3 className='text-gray-600 text-sm font-medium mb-1'>
                {card.title}
              </h3>

              <div className='flex items-baseline gap-2 mb-2'>
                <span className={`text-4xl font-bold ${card.textColor}`}>
                  {loading ? '-' : card.value}
                </span>
              </div>

              <p className='text-sm text-gray-500'>{card.subtitle}</p>
            </div>
          </motion.div>
        );
      })}

      {/* Quick Stats */}
      <motion.div
        variants={itemVariants}
        className='md:col-span-2 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-lg p-6 border border-gray-200'
      >
        <h3 className='text-lg font-bold text-slate-900 mb-4 flex items-center gap-2'>
          <ArrowTrendingUpIcon className='w-5 h-5 text-blue-600' />
          Activité Récente
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center'>
              <CheckCircleIcon className='w-5 h-5 text-emerald-600' />
            </div>
            <div>
              <p className='text-sm text-gray-600'>Réclamations résolues</p>
              <p className='font-bold text-lg text-emerald-600'>100%</p>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
              <ClockIcon className='w-5 h-5 text-blue-600' />
            </div>
            <div>
              <p className='text-sm text-gray-600'>Délai moyen (jours)</p>
              <p className='font-bold text-lg text-blue-600'>2-3 jours</p>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center'>
              <ExclamationCircleIcon className='w-5 h-5 text-purple-600' />
            </div>
            <div>
              <p className='text-sm text-gray-600'>Tickets sans réponse</p>
              <p className='font-bold text-lg text-purple-600'>0</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Help Box */}
      <motion.div
        variants={itemVariants}
        className='md:col-span-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white'
      >
        <h3 className='text-lg font-bold mb-2'>💡 Besoin d'aide ?</h3>
        <p className='text-blue-100 text-sm mb-4'>
          Créez une réclamation pour signaler un problème ou consultez vos commandes précédentes.
        </p>
        <div className='flex gap-3 flex-wrap'>
          <button className='px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-all'>
            Documentation
          </button>
          <button className='px-4 py-2 border-2 border-white text-white rounded-lg font-medium hover:bg-blue-600 transition-all'>
            Contacter le support
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ClientDashboardCards;
