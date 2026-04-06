import { useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import LoadingSpinner from '../../../components/feedback/LoadingSpinner';
import { formatDate } from '../../../utils/format';
import axios from '../../../app/axios';
import toast from 'react-hot-toast';

const PRIORITY_OPTIONS = [
  { value: 'Basse', label: '⚪ Basse' },
  { value: 'Normale', label: '🔵 Normale' },
  { value: 'Haute', label: '🟠 Haute' },
  { value: 'Urgente', label: '🔴 Urgente' },
];

const ClientClaimForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    objet: '',
    description: '',
    priorite: 'Normale',
    categorie: 'Autre',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.objet.trim() || !formData.description.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      await axios.post('/reclamations', formData);
      toast.success('Réclamation créée avec succès!');
      onSuccess();
    } catch (error) {
      toast.error('Erreur lors de la création de la réclamation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className='max-w-2xl'
    >
      <button
        onClick={onCancel}
        className='flex items-center gap-2 text-blue-600 mb-6 hover:text-blue-700'
      >
        <ArrowLeftIcon className='w-5 h-5' />
        Retour
      </button>

      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <h2 className='text-2xl font-bold text-slate-900 mb-6'>
          Créer une nouvelle réclamation
        </h2>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Objet */}
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>
              Objet *
            </label>
            <input
              type='text'
              name='objet'
              value={formData.objet}
              onChange={handleChange}
              placeholder='Ex: Produit défectif, Délai de livraison...'
              className='w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none'
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>
              Description détaillée *
            </label>
            <textarea
              name='description'
              value={formData.description}
              onChange={handleChange}
              placeholder='Décrivez le problème en détail...'
              rows={6}
              className='w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none'
              required
            />
          </div>

          {/* Grid 2 colonnes */}
          <div className='grid grid-cols-2 gap-4'>
            {/* Priorité */}
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                Priorité
              </label>
              <select
                name='priorite'
                value={formData.priorite}
                onChange={handleChange}
                className='w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none'
              >
                {PRIORITY_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Catégorie */}
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                Catégorie
              </label>
              <select
                name='categorie'
                value={formData.categorie}
                onChange={handleChange}
                className='w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none'
              >
                <option value='Autre'>Autre</option>
                <option value='Qualité'>Qualité du produit</option>
                <option value='Livraison'>Problème de livraison</option>
                <option value='Facture'>Problème de facturation</option>
                <option value='Support'>Support technique</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className='flex gap-3 pt-4'>
            <button
              type='button'
              onClick={onCancel}
              className='flex-1 px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all'
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type='submit'
              className='flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-all'
              disabled={loading}
            >
              {loading ? 'Création...' : 'Créer la réclamation'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default ClientClaimForm;
