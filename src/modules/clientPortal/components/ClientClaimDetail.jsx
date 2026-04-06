import { useState, useEffect } from 'react';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
  ExclamationCircleIcon,
  UserCircleIcon,
  CalendarIcon,
  ClockIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import LoadingSpinner from '../../../components/feedback/LoadingSpinner';
import { formatDate } from '../../../utils/format';
import axios from '../../../app/axios';
import toast from 'react-hot-toast';

const ClientClaimDetail = ({ claimId, onBack, onUpdate }) => {
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interventions, setInterventions] = useState([]);
  const [addingIntervention, setAddingIntervention] = useState(false);
  const [interventionText, setInterventionText] = useState('');

  useEffect(() => {
    fetchClaim();
  }, [claimId]);

  const fetchClaim = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/reclamations/${claimId}`);
      const rec = response?.data || null;
      setClaim(
        rec
          ? {
              id: rec.ID,
              objet: rec.Objet,
              description: rec.Description,
              priorite: rec.Priorite,
              statut: rec.Statut,
              dateCreation: rec.DateOuverture,
              technicienAssigne: rec.NomTechnicien,
            }
          : null
      );
      setInterventions(Array.isArray(rec?.interventions) ? rec.interventions : []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIntervention = async (e) => {
    e.preventDefault();
    if (!interventionText.trim()) {
      toast.error('Veuillez entrer une intervention');
      return;
    }

    try {
      setAddingIntervention(true);
      await axios.post(`/reclamations/${claimId}/interventions`, {
        description: interventionText,
      });
      setInterventionText('');
      setAddingIntervention(false);
      fetchClaim();
      toast.success('Intervention ajoutée');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!claim) return <div className='text-center py-8'>Réclamation non trouvée</div>;

  const STATUS = {
    Ouvert: { icon: ExclamationCircleIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    'En cours': { icon: WrenchScrewdriverIcon, color: 'text-amber-600', bg: 'bg-amber-50' },
    Résolu: { icon: CheckCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  };

  const statusConfig = STATUS[claim.statut] || STATUS.Ouvert;
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <button
        onClick={onBack}
        className='flex items-center gap-2 text-blue-600 mb-6 hover:text-blue-700'
      >
        <ArrowLeftIcon className='w-5 h-5' />
        Retour aux réclamations
      </button>

      <div className='grid gap-6'>
        {/* Header */}
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex items-start justify-between mb-4'>
            <div>
              <h1 className='text-3xl font-bold text-slate-900'>{claim.objet}</h1>
              <p className='text-slate-600 mt-2'>{claim.description}</p>
            </div>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${statusConfig.bg}`}
            >
              <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
              <span className={`font-semibold ${statusConfig.color}`}>
                {claim.statut}
              </span>
            </div>
          </div>

          {/* Info Grid */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200'>
            <div>
              <p className='text-sm text-slate-600'>Priorité</p>
              <p className='text-lg font-semibold text-slate-900'>
                {claim.priorite}
              </p>
            </div>
            <div>
              <p className='text-sm text-slate-600 flex items-center gap-1'>
                <CalendarIcon className='w-4 h-4' /> Date création
              </p>
              <p className='text-lg font-semibold text-slate-900'>
                {formatDate(claim.dateCreation)}
              </p>
            </div>
            {claim.technicienAssigne && (
              <div>
                <p className='text-sm text-slate-600 flex items-center gap-1'>
                  <UserCircleIcon className='w-4 h-4' /> Technicien
                </p>
                <p className='text-lg font-semibold text-slate-900'>
                  {claim.technicienAssigne}
                </p>
              </div>
            )}
            {claim.dateResolution && (
              <div>
                <p className='text-sm text-slate-600'>Résolu le</p>
                <p className='text-lg font-semibold text-slate-900'>
                  {formatDate(claim.dateResolution)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Interventions */}
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <h2 className='text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2'>
            <BoltIcon className='w-6 h-6' />
            Interventions ({interventions.length})
          </h2>

          {interventions.length === 0 ? (
            <p className='text-center py-8 text-slate-600'>
              Aucune intervention pour cette réclamation
            </p>
          ) : (
            <div className='space-y-4 mb-6'>
              {interventions.map((intervention, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='bg-slate-50 rounded-lg p-4 border border-slate-200'
                >
                  <div className='flex items-start justify-between mb-2'>
                    <div className='flex items-center gap-2'>
                      <UserCircleIcon className='w-5 h-5 text-blue-600' />
                      <span className='font-semibold text-slate-900'>
                        {intervention.technicien || 'Système'}
                      </span>
                    </div>
                    <span className='text-sm text-slate-600 flex items-center gap-1'>
                      <ClockIcon className='w-4 h-4' />
                      {formatDate(intervention.dateIntervention)}
                    </span>
                  </div>
                  <p className='text-slate-700'>{intervention.description}</p>
                </motion.div>
              ))}
            </div>
          )}

          {claim.statut !== 'Résolu' && (
            <form onSubmit={handleAddIntervention} className='pt-6 border-t border-gray-200'>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                Ajouter un commentaire
              </label>
              <textarea
                value={interventionText}
                onChange={(e) => setInterventionText(e.target.value)}
                placeholder='Décrivez votre intervention ou votre question...'
                rows={3}
                className='w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none'
              />
              <button
                type='submit'
                disabled={addingIntervention}
                className='mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-all'
              >
                {addingIntervention ? 'Envoi...' : 'Envoyer'}
              </button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ClientClaimDetail;
