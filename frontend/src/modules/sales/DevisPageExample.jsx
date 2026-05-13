import { useState, useEffect } from 'react';
import usePermission from '../../hooks/usePermission';
import { MODULE_CODES } from '../../utils/constants';
import axios from '../../app/axios';

/**
 * Exemple de composant Devis avec permissions correctement gérées
 * 
 * Démontre les 2 niveaux de permissions:
 * 1. isModuleActive: Module visible dans sidebar?
 * 2. canCreate/canEdit/canDelete: Boutons visibles?
 */
export const DevisPageExample = () => {
  const { 
    isModuleActive,    // ✅ Module visible?
    canCreate,         // ✅ Bouton Créer visible?
    canEdit,           // ✅ Bouton Éditer visible?
    canDelete,         // ✅ Bouton Supprimer visible?
    loading,           // ✅ En cours de chargement?
    user               // ✅ Info utilisateur
  } = usePermission(MODULE_CODES.DEVIS);

  const [devis, setDevis] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ========================================================================
  // ✅ NIVEAU 1: Vérifier que le module est actif
  // ========================================================================
  if (!loading && !isModuleActive) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded">
        <h2 className="text-xl font-bold text-red-600">❌ Accès Refusé</h2>
        <p className="text-red-600">
          Vous n'avez pas accès à ce module. Contactez votre administrateur.
        </p>
      </div>
    );
  }

  // Charger les devis
  useEffect(() => {
    const loadDevis = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/devis');
        setDevis(response.data?.data || []);
      } catch (err) {
        setError('Erreur lors du chargement des devis');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isModuleActive) {
      loadDevis();
    }
  }, [isModuleActive]);

  return (
    <div className="p-6">
      {/* En-tête avec bouton */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Devis</h1>
          <p className="text-gray-500 text-sm">
            Connecté comme: <span className="font-bold">{user?.FullName}</span> 
            ({user?.UserRole})
          </p>
        </div>
        
        {/* ========================================================================
            ✅ NIVEAU 2: Bouton Créer visible SEULEMENT si canCreate=1
            ======================================================================== */}
        {canCreate ? (
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition">
            ➕ Nouveau Devis
          </button>
        ) : (
          <div className="text-gray-400 px-4 py-2 bg-gray-100 rounded">
            📌 Création désactivée pour votre rôle
          </div>
        )}
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* En cours de chargement */}
      {isLoading && (
        <div className="text-center py-8">
          <p>⏳ Chargement des devis...</p>
        </div>
      )}

      {/* Tableau des devis */}
      {!isLoading && devis.length > 0 && (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-3 text-left">ID</th>
              <th className="border p-3 text-left">Client</th>
              <th className="border p-3 text-left">Montant</th>
              <th className="border p-3 text-left">Date</th>
              <th className="border p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {devis.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="border p-3">{d.id}</td>
                <td className="border p-3">{d.client}</td>
                <td className="border p-3 font-bold">{d.montant}€</td>
                <td className="border p-3">{new Date(d.date).toLocaleDateString()}</td>
                <td className="border p-3">
                  <div className="flex gap-2 justify-center">
                    {/* ================================================
                        ✅ Bouton ÉDITER visible SEULEMENT si canEdit=1
                        ================================================ */}
                    {canEdit ? (
                      <button className="text-yellow-500 hover:text-yellow-700 transition">
                        ✏️ Éditer
                      </button>
                    ) : (
                      <span className="text-gray-300 cursor-not-allowed">✏️</span>
                    )}

                    {/* ================================================
                        ✅ Bouton SUPPRIMER visible SEULEMENT si canDelete=1
                        ================================================ */}
                    {canDelete ? (
                      <button className="text-red-500 hover:text-red-700 transition">
                        🗑️ Supprimer
                      </button>
                    ) : (
                      <span className="text-gray-300 cursor-not-allowed">🗑️</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pas de devis */}
      {!isLoading && devis.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded">
          <p className="text-gray-500">Aucun devis trouvé</p>
        </div>
      )}

      {/* Tableau de permissions (pour debug) */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded">
        <h3 className="font-bold mb-2">📊 Permissions Actuelles</h3>
        <ul className="text-sm space-y-1">
          <li>• Module visible: {isModuleActive ? '✅ OUI' : '❌ NON'}</li>
          <li>• Peut créer: {canCreate ? '✅ OUI' : '❌ NON'}</li>
          <li>• Peut éditer: {canEdit ? '✅ OUI' : '❌ NON'}</li>
          <li>• Peut supprimer: {canDelete ? '✅ OUI' : '❌ NON'}</li>
        </ul>
      </div>
    </div>
  );
};

export default DevisPageExample;
