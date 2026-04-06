import { useState, useEffect } from 'react';
import {
  PlusIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon,
  EyeIcon,
  LifebuoyIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../../components/feedback/LoadingSpinner';
import { formatDate } from '../../../utils/format';
import axios from '../../../app/axios';
import ClientClaimDetail from './ClientClaimDetail';
import ClientClaimForm from './ClientClaimForm';

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', bounce: 0, duration: 0.4 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

const PRIORITY = {
  Urgente: { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500', label: '🔴 Urgente' },
  Haute: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500', label: '🟠 Haute' },
  Normale: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500', label: '🔵 Normale' },
  Basse: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-500', label: '⚪ Basse' },
};

const STATUS = {
  Ouvert: { icon: ExclamationCircleIcon, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Ouvert' },
  'En cours': { icon: WrenchScrewdriverIcon, color: 'text-amber-600', bg: 'bg-amber-50', label: 'En cours' },
  Résolu: { icon: CheckCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Résolu' },
};

const ClientClaimsTab = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMyClaims();
  }, []);

  const fetchMyClaims = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/reclamations/my-claims');
      const list = Array.isArray(response?.data) ? response.data : [];
      const normalized = list.map((item) => ({
        id: item.ID,
        numTicket: item.NumTicket,
        objet: item.Objet,
        description: item.Description,
        priorite: item.Priorite,
        statut: item.Statut,
        dateCreation: item.DateOuverture,
        technicienAssigne: item.NomTechnicien,
        interventions: item.interventions || [],
      }));
      setClaims(normalized);
    } catch (error) {
      setClaims([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredClaims = claims.filter((claim) => {
    const matchStatus = statusFilter === 'all' || claim.statut === statusFilter;
    const query = searchTerm.trim().toLowerCase();
    const matchSearch =
      !query ||
      claim.objet?.toLowerCase().includes(query) ||
      claim.description?.toLowerCase().includes(query);
    return matchStatus && matchSearch;
  });

  const stats = filteredClaims.reduce(
    (acc, claim) => {
      const status = String(claim.statut || '').toLowerCase();
      if (status === 'résolu' || status === 'resolu') acc.resolved += 1;
      if (status === 'en cours') acc.inProgress += 1;
      if (status === 'ouvert') acc.open += 1;
      return acc;
    },
    { open: 0, inProgress: 0, resolved: 0 }
  );

  if (showForm) {
    return (
      <ClientClaimForm
        onSuccess={() => {
          setShowForm(false);
          fetchMyClaims();
        }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  if (selectedClaim) {
    return (
      <ClientClaimDetail
        claimId={selectedClaim}
        onBack={() => setSelectedClaim(null)}
        onUpdate={fetchMyClaims}
      />
    );
  }

  return (
    <div className='space-y-6'>
      <div className='rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <h2 className='text-3xl font-black text-slate-900'>Gestion des Réclamations</h2>
            <p className='mt-1 text-sm font-medium text-slate-600'>
              Vue client: vous voyez uniquement vos réclamations.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <button
              onClick={fetchMyClaims}
              className='inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50'
            >
              <ArrowPathIcon className='h-4 w-4' />
              Actualiser
            </button>
            <button
              onClick={() => setShowForm(true)}
              className='inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700'
            >
              <PlusIcon className='h-4 w-4' />
              Nouvelle réclamation
            </button>
          </div>
        </div>

        <div className='mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3'>
          <div className='rounded-xl border border-blue-100 bg-blue-50 p-4'>
            <p className='text-xs font-semibold uppercase tracking-wide text-blue-700'>Ouvertes</p>
            <p className='mt-1 text-2xl font-black text-blue-900'>{stats.open}</p>
          </div>
          <div className='rounded-xl border border-amber-100 bg-amber-50 p-4'>
            <p className='text-xs font-semibold uppercase tracking-wide text-amber-700'>En cours</p>
            <p className='mt-1 text-2xl font-black text-amber-900'>{stats.inProgress}</p>
          </div>
          <div className='rounded-xl border border-emerald-100 bg-emerald-50 p-4'>
            <p className='text-xs font-semibold uppercase tracking-wide text-emerald-700'>Résolues</p>
            <p className='mt-1 text-2xl font-black text-emerald-900'>{stats.resolved}</p>
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row'>
        <input
          type='text'
          placeholder='Rechercher par objet ou description...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none'
        />
        <div className='flex gap-2'>
          {['all', 'Ouvert', 'En cours', 'Résolu'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {status === 'all' ? `Tous (${claims.length})` : status}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredClaims.length === 0 ? (
        <div className='text-center py-12'>
          <LifebuoyIcon className='w-16 h-16 mx-auto text-gray-300 mb-4' />
          <p className='text-gray-600 text-lg'>Aucune réclamation trouvée</p>
        </div>
      ) : (
        <AnimatePresence mode='popLayout'>
          <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='overflow-x-auto'>
              <table className='w-full min-w-[820px]'>
                <thead className='bg-slate-50'>
                  <tr className='text-left text-xs font-bold uppercase tracking-wide text-slate-600'>
                    <th className='px-4 py-3'>Ticket</th>
                    <th className='px-4 py-3'>Objet</th>
                    <th className='px-4 py-3'>Priorité</th>
                    <th className='px-4 py-3'>Statut</th>
                    <th className='px-4 py-3'>Date</th>
                    <th className='px-4 py-3 text-right'>Action</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
            {filteredClaims.map((claim) => {
              const statusConfig = STATUS[claim.statut] || STATUS.Ouvert;
              const priorityConfig = PRIORITY[claim.priorite] || PRIORITY.Normale;
              const StatusIcon = statusConfig.icon;

              return (
                <motion.tr
                  key={claim.id}
                  variants={rowVariants}
                  initial='hidden'
                  animate='visible'
                  exit='exit'
                  className='hover:bg-slate-50/80'
                >
                    <td className='px-4 py-3 text-sm font-semibold text-slate-900'>
                      {claim.numTicket || `REC-${claim.id}`}
                    </td>
                    <td className='px-4 py-3'>
                      <p className='text-sm font-semibold text-slate-900'>{claim.objet}</p>
                      <p className='mt-1 line-clamp-1 text-xs text-slate-500'>{claim.description}</p>
                    </td>
                    <td className='px-4 py-3'>
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${priorityConfig.bg} ${priorityConfig.text}`}>
                        {claim.priorite || 'Normale'}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${statusConfig.bg} ${statusConfig.color}`}>
                        <StatusIcon className='h-3.5 w-3.5' />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-sm text-slate-600'>{formatDate(claim.dateCreation)}</td>
                    <td className='px-4 py-3 text-right'>
                      <button
                        onClick={() => setSelectedClaim(claim.id)}
                        className='inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100'
                        title='Voir les détails'
                      >
                        <EyeIcon className='h-4 w-4' />
                        Voir
                      </button>
                    </td>
                </motion.tr>
              );
            })}
                </tbody>
              </table>
            </div>
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default ClientClaimsTab;
