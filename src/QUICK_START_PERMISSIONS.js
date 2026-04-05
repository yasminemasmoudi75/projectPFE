#!/usr/bin/env node

/**
 * 🚀 QUICK START: PERMISSIONS EN 5 MINUTES
 * ═════════════════════════════════════════════════════════════════
 * 
 * Ce fichier vous montre comment démarrer IMMÉDIATEMENT
 * avec les permissions dans vos composants.
 */

// ═══════════════════════════════════════════════════════════════
// ÉTAPE 1: IMPORTER LE HOOK
// ═══════════════════════════════════════════════════════════════

import { usePermission } from '../hooks/usePermission';
import { MODULE_CODES } from '../utils/constants';

// ═══════════════════════════════════════════════════════════════
// ÉTAPE 2: UTILISER LE HOOK DANS VOTRE COMPOSANT
// ═══════════════════════════════════════════════════════════════

/**
 * ✅ EXEMPLE 1: Afficher/Masquer un bouton
 * CODE COMPLET: 3 lignes
 */
export const SimpleButtonExample = () => {
  const { canCreate } = usePermission(MODULE_CODES.CLIENTS);

  return canCreate && <button>➕ Créer</button>;
};

/**
 * ✅ EXEMPLE 2: 3 boutons selon les permissions
 * CODE COMPLET: 8 lignes
 */
export const MultipleButtonsExample = () => {
  const { canCreate, canEdit, canDelete } = usePermission(MODULE_CODES.CLIENTS);

  return (
    <div className="flex gap-2">
      {canCreate && <button>➕ Créer</button>}
      {canEdit && <button>✏️ Éditer</button>}
      {canDelete && <button>🗑️ Supprimer</button>}
    </div>
  );
};

/**
 * ✅ EXEMPLE 3: Protéger une page entière
 * CODE COMPLET: 9 lignes
 */
export const ProtectedPageExample = () => {
  const { canView } = usePermission(MODULE_CODES.CLIENTS);

  if (!canView) {
    return <div className="alert alert-error">Accès refusé</div>;
  }

  return <div>Contenu protégé visible</div>;
};

/**
 * ✅ EXEMPLE 4: Griser un bouton selon les permissions
 * CODE COMPLET: 10 lignes
 */
export const DisabledButtonExample = () => {
  const { canEdit } = usePermission(MODULE_CODES.CLIENTS);

  return (
    <button
      disabled={!canEdit}
      className={canEdit ? 'btn btn-primary' : 'btn btn-gray opacity-50'}
    >
      ✏️ Modifier
    </button>
  );
};

/**
 * ✅ EXEMPLE 5: Plusieurs modules avec permissions
 * CODE COMPLET: 18 lignes
 */
export const MultipleModulesExample = () => {
  const clientsPerm = usePermission(MODULE_CODES.CLIENTS);
  const devisPerm = usePermission(MODULE_CODES.DEVIS);
  const stockPerm = usePermission(MODULE_CODES.STOCK);

  return (
    <div className="grid grid-cols-3 gap-4">
      {clientsPerm.canView && <div>Clients</div>}
      {devisPerm.canView && <div>Devis</div>}
      {stockPerm.canView && <div>Stock</div>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ÉTAPE 3: TESTER LES PERMISSIONS
// ═══════════════════════════════════════════════════════════════

/**
 * 🧪 Test 1: Console
 * 
 * Ouvrir: F12
 * Copier-coller dans la console:
 * 
 * import { runAllTests } from './src/utils/permissionsTest.js';
 * runAllTests();
 * 
 * Résultat: Voir tous les tests ✓
 */

/**
 * 🧪 Test 2: Navigateur
 * 
 * 1. Ajouter <TestComponent /> dans votre page
 * 2. Login comme Admin → Sur tous les boutons
 * 3. Login comme Commercial → Seulement Créer et Éditer
 * 4. Login comme Technicien → Aucun bouton
 */

/**
 * 🧪 Test 3: Changer le rôle
 * 
 * Dans la console dev (F12):
 * 
 * localStorage.setItem('user', JSON.stringify({
 *   UserID: 1,
 *   UserRole: 'Admin',
 *   EmailPro: 'admin@test.com'
 * }));
 * 
 * location.reload();
 */

// ═══════════════════════════════════════════════════════════════
// TABLEAU RAPIDE: QUI PEUT FAIRE QUOI?
// ═══════════════════════════════════════════════════════════════

/**
 * ADMIN (Tout le monde)
 * ├─ VIEW: ✓ (tous les modules)
 * ├─ CREATE: ✓
 * ├─ EDIT: ✓
 * ├─ DELETE: ✓
 * ├─ VALIDATE: ✓
 * └─ EXPORT: ✓
 * 
 * COMMERCIAL (Ventes et projets)
 * ├─ VIEW: ✓ (CLIENTS, DEVIS, PROJETS, ACTIVITES, SAV, MESSAGES)
 * ├─ CREATE: ✓
 * ├─ EDIT: ✓
 * ├─ DELETE: ✗
 * ├─ VALIDATE: ✗
 * └─ EXPORT: ✗
 * 
 * TECHNICIEN (Support et stock)
 * ├─ VIEW: ✓ (ACTIVITES, SAV, STOCK, MESSAGES)
 * ├─ CREATE: ✗
 * ├─ EDIT: ✓
 * ├─ DELETE: ✗
 * ├─ VALIDATE: ✗
 * └─ EXPORT: ✗
 * 
 * CLIENT (Accès client)
 * ├─ VIEW: ✓ (DEVIS, SAV, MESSAGES, DASHBOARD)
 * ├─ CREATE: ✓ (pour soumettre réclamations)
 * ├─ EDIT: ✗
 * ├─ DELETE: ✗
 * ├─ VALIDATE: ✗
 * └─ EXPORT: ✗
 */

// ═══════════════════════════════════════════════════════════════
// COPIER-COLLER: TEMPLATE DE COMPOSANT
// ═══════════════════════════════════════════════════════════════

/**
 * 📋 Template complet pour C&P dans votre composant
 */

export const ComponentTemplate = () => {
  // 1. Import usePermission et MODULE_CODES
  // ✓ Fait au-dessus

  // 2. Appeler le hook
  const { 
    canView,      // Voir le module
    canCreate,    // Créer un nouveau
    canEdit,      // Éditer un existant
    canDelete,    // Supprimer
    canValidate,  // Valider
    canExport,    // Exporter
    user,         // L'utilisateur actuel
    isAdmin       // Est-ce un admin?
  } = usePermission(MODULE_CODES.CLIENTS);

  // 3. Vérifier l'accès
  if (!canView) {
    return <div>Accès refusé</div>;
  }

  // 4. Afficher les UI conditionnels
  return (
    <div>
      <h1>Composant avec permissions</h1>

      {/* Afficher selon les permissions */}
      {canCreate && <button>Créer</button>}
      {canEdit && <button>Éditer</button>}
      {canDelete && <button>Supprimer</button>}
      {canExport && <button>Exporter</button>}

      {/* Afficher le rôle de l'utilisateur */}
      <p>Rôle: {user?.UserRole}</p>
      {isAdmin() && <p>Admin: Oui</p>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MODULES DISPONIBLES
// ═══════════════════════════════════════════════════════════════

/**
 * Tous les MODULE_CODES disponibles:
 * 
 * MODULE_CODES.DASHBOARD      (1)
 * MODULE_CODES.CLIENTS        (10)
 * MODULE_CODES.CONTACTS       (11)
 * MODULE_CODES.DEVIS          (20)
 * MODULE_CODES.COMMANDES      (21)
 * MODULE_CODES.FACTURES       (22)
 * MODULE_CODES.PROJETS        (30)
 * MODULE_CODES.ACTIVITES      (31)
 * MODULE_CODES.OBJECTIFS      (32)
 * MODULE_CODES.STOCK          (40)
 * MODULE_CODES.SAV            (50)
 * MODULE_CODES.MESSAGES       (60)
 * MODULE_CODES.IA             (70)
 * MODULE_CODES.USERS          (80)
 * MODULE_CODES.SETTINGS       (90)
 */

// ═══════════════════════════════════════════════════════════════
// COMMANDES RAPIDES
// ═══════════════════════════════════════════════════════════════

const QUICK_COMMANDS = `
🚀 START TESTING:

1. Test dans la console:
   import { runAllTests } from './src/utils/permissionsTest.js';
   runAllTests();

2. Test un utilisateur spécifique:
   import { canCreate } from './src/utils/permissions.js';
   import { testUsers } from './src/utils/permissionsTest.js';
   import { MODULE_CODES } from './src/utils/constants.js';
   console.log(canCreate(testUsers.commercial, MODULE_CODES.CLIENTS)); // true

3. Changer le localStorage:
   localStorage.setItem('user', JSON.stringify({
     UserID: 1, 
     UserRole: 'Admin', 
     EmailPro: 'admin@test.com'
   }));
   location.reload();

4. Voir les permissions actuelles:
   import { usePermission } from './hooks/usePermission';
   const perms = usePermission(10); // MODULE_CODES.CLIENTS = 10
   console.log(perms);
`;

console.log(QUICK_COMMANDS);

// ═══════════════════════════════════════════════════════════════
// CHECKLIST RAPIDE
// ═══════════════════════════════════════════════════════════════

const CHECKLIST = `
✅ AVANT DE DÉPLOYER:

- [ ] J'ai ajouté usePermission dans mes composants
- [ ] J'affiche les boutons avec {canCreate && <button>...}
- [ ] J'affiche le message "Accès refusé" si !canView
- [ ] J'ai testé avec Admin → Tous les boutons
- [ ] J'ai testé avec Commercial → Boutons limités
- [ ] J'ai testé avec Technicien → Jamais ces données
- [ ] J'ai testé avec Client → Accès très limité
- [ ] Le backend vérifie aussi les permissions (middleware)
- [ ] Les messages d'erreur sont clairs
- [ ] La personne peut contacter un admin si besoin d'accès
`;

console.log(CHECKLIST);

// ═══════════════════════════════════════════════════════════════
// 📁 FICHIERS À UTILISER
// ═══════════════════════════════════════════════════════════════

const FILES = `
📁 FICHIERS CRÉÉS:

1. permissionsTest.js (Testing)
   → Données de test + 11 fonctions de test
   → Utilisation: runAllTests()

2. permissionsExamples.jsx (Exemples)
   → 8 exemples d'utilisation réels
   → Copy-paste directement dans vos composants

3. PERMISSIONS_TEST_GUIDE.md (Guide)
   → Guide complet avec matrices de test
   → Cas d'utilisation réels

4. ClientReglements_WITH_PERMISSIONS.jsx (Composant)
   → Exemple complet intégré
   → Voir comment c'est fait dans un vrai composant

5. PERMISSIONS_IMPLEMENTATION_GUIDE.md (Résumé)
   → Vue d'ensemble du système
   → Checklist de déploiement

6. QUICK_START.js (Ce fichier!)
   → Démarrage rapide en 5 minutes
`;

console.log(FILES);

// ═══════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════

export default {
  SimpleButtonExample,
  MultipleButtonsExample,
  ProtectedPageExample,
  DisabledButtonExample,
  MultipleModulesExample,
  ComponentTemplate,
};
