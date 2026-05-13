/**
 * 🔐 HOOK REACT: Filtrage Automatique des Données par Rôle
 * 
 * Filtre automatiquement les données affichées selon:
 * - ADMIN: Toutes les données
 * - COMMERCIAL/AGENT: Ses propres données (filtrées par CodRepres)
 * - CLIENT: Ses propres documents (filtrés par CodTiers)
 * - TECHNICIEN: Données SAV/Support
 * 
 * Usage:
 * const { filteredData, isFiltered } = useAutoAccessControl(allData);
 */

import { useMemo } from 'react';
import { useAuth } from './useAuth';

/**
 * Normaliser le rôle
 */
const normalizeRole = (role) => (role || '').toString().trim().toLowerCase();

/**
 * ✅ HOOK: Appliquer contrôle d'accès automatiquement aux données frontend
 * 
 * @param {Array} data - Données originales
 * @param {Object} options - Options de filtrage
 * @returns {Object} { filteredData, isFiltered, role, appliedFilter }
 */
export const useAutoAccessControl = (data = [], options = {}) => {
  const { user } = useAuth();
  const { 
    representantField = 'CodRepres',
    clientField = 'CodTiers',
    userEmailField = 'CUser'
  } = options;
  
  const userRole = normalizeRole(user?.UserRole);
  const codRepres = user?.CodRepres || user?.codRepres;
  const codTiers = user?.CodTiers || user?.codTiers;
  const userEmail = (user?.EmailPro || '').toLowerCase();
  
  // Filtrer les données selon le rôle
  const filteredData = useMemo(() => {
    // ✅ ADMIN: Voir toutes les données
    if (userRole === 'admin') {
      return data;
    }
    
    if (!Array.isArray(data)) {
      return [];
    }
    
    // ⭐ COMMERCIAL/AGENT: Filtre par CodRepres (FiltreRepres)
    if (['commercial', 'agent'].includes(userRole)) {
      return data.filter(item => {
        const itemRepres = (item?.[representantField] || '').toLowerCase();
        const itemRepres2 = (item?.codRepres || '').toLowerCase();
        
        return (
          itemRepres === (codRepres || '').toLowerCase() ||
          itemRepres2 === (codRepres || '').toLowerCase() ||
          // Check aussi dans relations imbriquées
          (item?.client?.[representantField] || '').toLowerCase() === (codRepres || '').toLowerCase()
        );
      });
    }
    
    // ⭐ CLIENT: Filtre par CodTiers (ses documents)
    if (userRole === 'client') {
      return data.filter(item => {
        const itemTiers = (item?.[clientField] || '').toLowerCase();
        const itemTiers2 = (item?.codTiers || '').toLowerCase();
        const itemEmail = (item?.[userEmailField] || '').toLowerCase();
        
        return (
          itemTiers === (codTiers || '').toLowerCase() ||
          itemTiers2 === (codTiers || '').toLowerCase() ||
          itemEmail === userEmail ||
          // Check aussi dans relations imbriquées
          (item?.client?.CodTiers || '').toLowerCase() === (codTiers || '').toLowerCase()
        );
      });
    }
    
    // ⭐ TECHNICIEN: Voir tous les SAV/Support
    if (userRole === 'technicien') {
      // Technicien voit tout (pas de filtre)
      // À personnaliser selon logique métier
      return data;
    }
    
    // Default: Aucun filtre
    return data;
  }, [data, userRole, codRepres, codTiers, userEmail, representantField, clientField, userEmailField]);
  
  return {
    filteredData,
    isFiltered: userRole !== 'admin',
    role: userRole,
    appliedFilter: {
      admin: 'Aucun filtre',
      commercial: `Filtre: CodRepres = ${codRepres}`,
      agent: `Filtre: CodRepres = ${codRepres}`,
      client: `Filtre: CodTiers = ${codTiers}`,
      technicien: 'Pas de filtre (voir tout)',
    }[userRole]
  };
};

/**
 * ✅ HOOK: Builder de filtre pour API calls
 * 
 * Construit automatiquement les params de filtre pour les requêtes API
 * 
 * @returns {Object} Query params à ajouter aux requêtes
 */
export const useAccessControlFilter = () => {
  const { user } = useAuth();
  
  const userRole = normalizeRole(user?.UserRole);
  const codRepres = user?.CodRepres || user?.codRepres;
  const codTiers = user?.CodTiers || user?.codTiers;
  
  return useMemo(() => {
    // ✅ ADMIN: Pas de filtre
    if (userRole === 'admin') {
      return {};
    }
    
    // ⭐ COMMERCIAL/AGENT: Ajouter codRepres
    if (['commercial', 'agent'].includes(userRole)) {
      return { codRepres };
    }
    
    // ⭐ CLIENT: Ajouter codTiers
    if (userRole === 'client') {
      return { codTiers };
    }
    
    // TECHNICIEN: Pas de filtre spécifique
    return {};
  }, [userRole, codRepres, codTiers]);
};

/**
 * 📝 EXEMPLE D'UTILISATION DANS UN COMPOSANT
 * 
 * function ListeDevis() {
 *   const { user } = useAuth();
 *   const [allDevis, setAllDevis] = useState([]);
 *   const { filteredData, isFiltered, appliedFilter } = useAutoAccessControl(allDevis);
 *   
 *   // Afficher le filtre appliqué si applicable
 *   {isFiltered && (
 *     <div className="alert">
 *       Filtre appliqué: {appliedFilter}
 *     </div>
 *   )}
 *   
 *   // Afficher les données filtrées
 *   {filteredData.map(devis => (
 *     <DevisCard key={devis.id} devis={devis} />
 *   ))}
 * }
 */

/**
 * 📝 EXEMPLE: Appel API avec filtre automatique
 * 
 * function ListeClients() {
 *   const filterParams = useAccessControlFilter();
 *   const [clients, setClients] = useState([]);
 *   
 *   useEffect(() => {
 *     // Les params de filtre sont automatiquement ajoutés
 *     axios.get('/api/clients', { params: filterParams })
 *       .then(res => setClients(res.data))
 *       .catch(err => console.error(err));
 *   }, [filterParams]);
 *   
 *   return (
 *     <div>
 *       {clients.map(client => (
 *         <ClientCard key={client.id} client={client} />
 *       ))}
 *     </div>
 *   );
 * }
 */

export default useAutoAccessControl;
