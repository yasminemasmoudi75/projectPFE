/**
 * Composant Professionnel: Tableau Devis Dynamique avec Permissions
 * Affiche/Masque les boutons selon les droits de l'utilisateur
 */

import React, { useEffect, useState } from 'react';
import usePermissions from '../hooks/usePermissions';
import useAuth from '../hooks/useAuth';
import axios from '../app/axios';
import { 
  PencilIcon, 
  TrashIcon, 
  DocumentArrowDownIcon,
  CheckIcon,
  PlusIcon 
} from '@heroicons/react/24/outline';

const MODULE_DEVIS = 4;

export default function DevisListProfessional() {
  const { user } = useAuth();
  const { 
    canPerformAction, 
    canViewModule, 
    buildFilters,
    loading: permLoading 
  } = usePermissions();
  
  const [devis, setDevis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Vérifier l'accès au module
   */
  useEffect(() => {
    if (!canViewModule(MODULE_DEVIS)) {
      setError('Vous n\'avez pas accès à ce module');
      return;
    }

    loadDevis();
  }, []);

  /**
   * Charger les devis avec filtres appliqués
   */
  const loadDevis = async () => {
    try {
      setLoading(true);
      
      // Construire les filtres selon les permissions
      const filters = buildFilters(MODULE_DEVIS);
      
      const response = await axios.get('/api/devis', { params: filters });
      setDevis(response.data.data || []);
    } catch (err) {
      setError('Erreur chargement devis: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Créer un nouvel devis
   */
  const handleCreate = async () => {
    if (!canPerformAction(MODULE_DEVIS, 'create')) {
      alert('Vous n\'avez pas le droit de créer');
      return;
    }
    
    // Rediriger vers formulaire de création
    window.location.href = '/devis/new';
  };

  /**
   * Éditer un devis
   */
  const handleEdit = async (devisId) => {
    if (!canPerformAction(MODULE_DEVIS, 'edit')) {
      alert('Vous n\'avez pas le droit de modifier');
      return;
    }

    window.location.href = `/devis/${devisId}/edit`;
  };

  /**
   * Supprimer un devis
   */
  const handleDelete = async (devisId) => {
    if (!canPerformAction(MODULE_DEVIS, 'delete')) {
      alert('Vous n\'avez pas le droit de supprimer');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer?')) return;

    try {
      await axios.delete(`/api/devis/${devisId}`);
      alert('Supprimé avec succès');
      loadDevis();
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  /**
   * Valider un devis
   */
  const handleValidate = async (devisId) => {
    if (!canPerformAction(MODULE_DEVIS, 'validate')) {
      alert('Vous n\'avez pas le droit de valider');
      return;
    }

    try {
      await axios.post(`/api/devis/${devisId}/validate`);
      alert('Devis validé');
      loadDevis();
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  /**
   * Exporter en PDF
   */
  const handleExport = async (devisId) => {
    if (!canPerformAction(MODULE_DEVIS, 'export')) {
      alert('Vous n\'avez pas le droit d\'exporter');
      return;
    }

    try {
      window.open(`/api/devis/${devisId}/export`, '_blank');
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  if (permLoading) return <div className="p-4">Chargement permissions...</div>;
  
  if (!canViewModule(MODULE_DEVIS)) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-800">❌ Vous n'avez pas accès à ce module</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header avec bouton Créer */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestion des Devis</h1>
        
        {/* Afficher le bouton "Ajouter" uniquement si autorisé */}
        {canPerformAction(MODULE_DEVIS, 'create') ? (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <PlusIcon className="w-5 h-5" />
            Ajouter Devis
          </button>
        ) : (
          <div className="text-gray-400 text-sm">
            (Vous n'avez pas le droit de créer)
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
          {error}
        </div>
      )}

      {/* Tableau */}
      <div className="overflow-x-auto shadow rounded-lg">
        <table className="w-full bg-white">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">N° Devis</th>
              <th className="px-6 py-3 text-left font-semibold">Client</th>
              <th className="px-6 py-3 text-left font-semibold">Montant</th>
              <th className="px-6 py-3 text-left font-semibold">Statut</th>
              <th className="px-6 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  Chargement...
                </td>
              </tr>
            ) : devis.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  Aucun devis
                </td>
              </tr>
            ) : (
              devis.map(item => (
                <tr key={item.ID} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3">{item.NumDevis}</td>
                  <td className="px-6 py-3">{item.NomClient}</td>
                  <td className="px-6 py-3 font-semibold">{item.Montant} €</td>
                  <td className="px-6 py-3">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      item.Statut === 'Accepté' ? 'bg-green-100 text-green-800' :
                      item.Statut === 'Refusé' ? 'bg-red-100 text-red-800' :
                      item.Statut === 'Validé' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.Statut}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      {/* Bouton Éditer - Visible si autorisé */}
                      {canPerformAction(MODULE_DEVIS, 'edit') && (
                        <button
                          onClick={() => handleEdit(item.ID)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                          title="Modifier"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                      )}

                      {/* Bouton Valider - Visible si autorisé */}
                      {canPerformAction(MODULE_DEVIS, 'validate') && 
                       item.Statut !== 'Validé' && (
                        <button
                          onClick={() => handleValidate(item.ID)}
                          className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                          title="Valider"
                        >
                          <CheckIcon className="w-5 h-5" />
                        </button>
                      )}

                      {/* Bouton PDF - Visible si autorisé */}
                      {canPerformAction(MODULE_DEVIS, 'export') && (
                        <button
                          onClick={() => handleExport(item.ID)}
                          className="text-orange-600 hover:text-orange-800 p-1 rounded hover:bg-orange-50"
                          title="Télécharger PDF"
                        >
                          <DocumentArrowDownIcon className="w-5 h-5" />
                        </button>
                      )}

                      {/* Bouton Supprimer - Visible si autorisé */}
                      {canPerformAction(MODULE_DEVIS, 'delete') && (
                        <button
                          onClick={() => handleDelete(item.ID)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                          title="Supprimer"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info permissions pour debug */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-gray-100 rounded text-xs">
          <p className="font-bold mb-2">Debug - Permissions:</p>
          <p>Voir: {canPerformAction(MODULE_DEVIS, 'view') ? '✅' : '❌'}</p>
          <p>Créer: {canPerformAction(MODULE_DEVIS, 'create') ? '✅' : '❌'}</p>
          <p>Éditer: {canPerformAction(MODULE_DEVIS, 'edit') ? '✅' : '❌'}</p>
          <p>Supprimer: {canPerformAction(MODULE_DEVIS, 'delete') ? '✅' : '❌'}</p>
          <p>Valider: {canPerformAction(MODULE_DEVIS, 'validate') ? '✅' : '❌'}</p>
          <p>Exporter: {canPerformAction(MODULE_DEVIS, 'export') ? '✅' : '❌'}</p>
        </div>
      )}
    </div>
  );
}
