import React, { useState, useEffect } from 'react';
import axios from '../../app/axios';
import useAuth from '../../hooks/useAuth';

const MouvementsPage = () => {
  const { user } = useAuth();
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateDebut: '',
    dateFin: '',
    docType: '',
    action: '',
    codTiers: '',
    libTiers: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1
  });

  // Charger les mouvements
  useEffect(() => {
    fetchMouvements();
  }, [filters, pagination.page]);

  const fetchMouvements = async () => {
    try {
      setLoading(true);
      
      // Construire les paramètres de recherche
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);
      
      if (filters.docType) params.append('docType', filters.docType);
      if (filters.codTiers) params.append('codTiers', filters.codTiers);

      // N'envoyer les dates que si l'utilisateur filtre réellement par date
      if (filters.dateDebut) {
        params.append('dateDebut', filters.dateDebut);
      }
      if (filters.dateFin) {
        params.append('dateFin', filters.dateFin);
      }
      
      // Ajouter timestamp pour forcer le navigateur à ne pas utiliser le cache
      params.append('_t', Date.now());

      const response = await axios.get(`/mouvements?${params.toString()}`);
      
      console.log('📊 Response.data:', response.data);
      
      let mouvementsData = [];
      let paginationData = { total: 0, page: 1, limit: 50, totalPages: 1 };
      
      // Gérer deux formats de réponse
      if (Array.isArray(response.data)) {
        // Format: array directement
        mouvementsData = response.data || [];
        console.log('✅ Format: Array directement, length:', mouvementsData.length);
      } else if (response.data?.status === 'success') {
        // Format: {status, pagination, data}
        mouvementsData = response.data.data || [];
        paginationData = {
          total: response.data.pagination?.total || 0,
          page: response.data.pagination?.page || 1,
          limit: response.data.pagination?.limit || 50,
          totalPages: response.data.pagination?.totalPages || 1
        };
        console.log('✅ Format: Object avec status, length:', mouvementsData.length);
      }
      
      console.log('📋 Mouvements avant filtrage:', mouvementsData.length);
      
      // Appliquer les filtres côté client
      if (filters.action) {
        const flagValue = parseInt(filters.action);
        mouvementsData = mouvementsData.filter(m => m.Flags === flagValue);
        console.log('🔍 Après filtrage action:', mouvementsData.length);
      }
      
      if (filters.libTiers) {
        mouvementsData = mouvementsData.filter(m => 
          m.LibTiers && m.LibTiers.toLowerCase().includes(filters.libTiers.toLowerCase())
        );
        console.log('🔍 Après filtrage libTiers:', mouvementsData.length);
      }
      
      console.log('✅ Final affichage:', mouvementsData.length, 'mouvements');
      setMouvements(mouvementsData);
      setPagination(prev => ({
        ...prev,
        ...paginationData
      }));
    } catch (error) {
      console.error('❌ Erreur lors du chargement des mouvements:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleReset = () => {
    setFilters({
      dateDebut: '',
      dateFin: '',
      docType: '',
      action: '',
      codTiers: '',
      libTiers: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getActionLabel = (flags) => {
    const flagValue = parseInt(flags);
    if (flagValue === 0) return 'Création';
    if (flagValue === 1) return 'Transformation';
    return 'Autre';
  };

  const getDocumentTypeColor = (docType) => {
    const colors = {
      'DEV': 'bg-blue-100 text-blue-800',
      'BCV': 'bg-purple-100 text-purple-800',
      'BLV': 'bg-green-100 text-green-800',
      'FAV': 'bg-orange-100 text-orange-800'
    };
    return colors[docType] || 'bg-gray-100 text-gray-800';
  };

  const getActionColor = (flags) => {
    const flagValue = parseInt(flags);
    if (flagValue === 0) return 'bg-green-100 text-green-800';
    if (flagValue === 1) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mouvements des Documents</h1>
          <p className="text-gray-600 mt-2">Suivi complet de toutes les créations et transformations de documents</p>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtres</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date début */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date début
              </label>
              <input
                type="date"
                value={filters.dateDebut}
                onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date fin
              </label>
              <input
                type="date"
                value={filters.dateFin}
                onChange={(e) => handleFilterChange('dateFin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type de document */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de document
              </label>
              <select
                value={filters.docType}
                onChange={(e) => handleFilterChange('docType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les types</option>
                <option value="DEV">Devis (DEV)</option>
                <option value="BCV">Bon de Commande (BCV)</option>
                <option value="BLV">Bon de Livraison (BLV)</option>
                <option value="FAV">Facture (FAV)</option>
              </select>
            </div>

            {/* Action */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les actions</option>
                <option value="0">Création</option>
                <option value="1">Transformation</option>
              </select>
            </div>

            {/* Code client */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code client
              </label>
              <input
                type="text"
                placeholder="Ex: FR411006"
                value={filters.codTiers}
                onChange={(e) => handleFilterChange('codTiers', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Nom société/client */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom société/client
              </label>
              <input
                type="text"
                placeholder="Ex: TRABELSI"
                value={filters.libTiers}
                onChange={(e) => handleFilterChange('libTiers', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
            >
              Réinitialiser filtres
            </button>
            <button
              onClick={fetchMouvements}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              disabled={loading}
            >
              {loading ? 'Chargement...' : 'Appliquer filtres'}
            </button>
          </div>
        </div>

        {/* Tableau des mouvements */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Chargement des mouvements...
            </div>
          ) : mouvements.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Aucun mouvement trouvé avec ces critères
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date/Heure</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type Doc</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">N° Document</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Client</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Montant TTC</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">TVA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mouvements.map((mouvement, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {mouvement.MDate ? new Date(mouvement.MDate).toLocaleString('fr-FR') : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDocumentTypeColor(mouvement.Document)}`}>
                            {mouvement.Document}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {mouvement.NF}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div className="font-medium">{mouvement.LibTiers || '-'}</div>
                          <div className="text-xs text-gray-500">{mouvement.CodTiers || '-'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(mouvement.Flags)}`}>
                            {getActionLabel(mouvement.Flags)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                          {mouvement.TotTTC ? mouvement.TotTTC.toFixed(3) : '0.000'} DT
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {mouvement.TotTva ? `${mouvement.TotTva.toFixed(3)} DT` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Affichage {((pagination.page - 1) * pagination.limit) + 1} à {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} mouvements
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max={pagination.totalPages}
                      value={pagination.page}
                      onChange={(e) => setPagination(prev => ({ ...prev, page: Math.max(1, parseInt(e.target.value) || 1) }))}
                      className="w-12 px-2 py-2 border border-gray-300 rounded-md text-sm text-center"
                    />
                    <span className="text-sm text-gray-600">/ {pagination.totalPages}</span>
                  </div>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MouvementsPage;
