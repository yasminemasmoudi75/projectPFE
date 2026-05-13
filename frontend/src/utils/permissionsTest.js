/**
 * 🧪 GUIDE COMPLET DE TEST DES PERMISSIONS
 * ═════════════════════════════════════════════════════════════════
 * 
 * Ce fichier contient des exemples complets pour TESTER
 * chaque fonction de permission et chaque rôle.
 */

import {
  hasPermission,
  canView,
  canCreate,
  canEdit,
  canDelete,
  canValidate,
  canExport,
  getModulePermissions,
  hasRole,
  isAdmin,
  filterMenuByPermissions,
} from './permissions';
import { MODULE_CODES, ACTION_TYPES, USER_ROLES } from './constants';

// ═══════════════════════════════════════════════════════════════
// 1️⃣ DONNÉES DE TEST - UTILISATEURS SIMULÉS
// ═══════════════════════════════════════════════════════════════

const testUsers = {
  // Admin: Tous les droits
  admin: {
    UserID: 1,
    UserRole: 'Admin',
    EmailPro: 'admin@company.com',
    FullName: 'Admin Manager',
  },

  // Commercial: Peut créer/modifier, pas supprimer
  commercial: {
    UserID: 2,
    UserRole: 'Commercial',
    EmailPro: 'commercial@company.com',
    FullName: 'Jean Commercial',
  },

  // Technicien: Peut modifier seulement
  technicien: {
    UserID: 3,
    UserRole: 'Technicien',
    EmailPro: 'tech@company.com',
    FullName: 'Marc Technicien',
  },

  // Client: Accès lecture + création limitée
  client: {
    UserID: 4,
    UserRole: 'Client',
    EmailPro: 'client@company.com',
    FullName: 'Pierre Client',
  },

  // Agent: Similaire Commercial
  agent: {
    UserID: 5,
    UserRole: 'Agent',
    EmailPro: 'agent@company.com',
    FullName: 'Sophie Agent',
  },
};

// ═══════════════════════════════════════════════════════════════
// 2️⃣ TEST 1: VÉRIFIER LE RÔLE D'UN UTILISATEUR
// ═══════════════════════════════════════════════════════════════
export const test_hasRole = () => {
  console.log('🔍 TEST: hasRole() - Vérifier le rôle d\'un utilisateur\n');

  // ✅ Cas POSITIF: L'utilisateur est Admin
  console.log(
    '✓ Admin a le rôle "Admin":',
    hasRole(testUsers.admin, 'Admin') // true
  );

  // ✅ Cas POSITIF: Vérifier avec tableau de rôles
  console.log(
    '✓ Commercial est dans [Commercial, Agent]:',
    hasRole(testUsers.commercial, ['Commercial', 'Agent']) // true
  );

  // ❌ Cas NÉGATIF: L'utilisateur n'a pas le rôle
  console.log(
    '✗ Client n\'a pas le rôle "Admin":',
    hasRole(testUsers.client, 'Admin') // false
  );

  // ❌ Cas NÉGATIF: Rôle pas dans le tableau
  console.log(
    '✗ Technicien n\'est pas dans [Client, Commercial]:',
    hasRole(testUsers.technicien, ['Client', 'Commercial']) // false
  );
};

// ═══════════════════════════════════════════════════════════════
// 3️⃣ TEST 2: VÉRIFIER SI UTILISATEUR EST ADMIN
// ═══════════════════════════════════════════════════════════════
export const test_isAdmin = () => {
  console.log('\n🔐 TEST: isAdmin() - Vérifier si l\'utilisateur est admin\n');

  console.log('✓ Admin est admin:', isAdmin(testUsers.admin)); // true
  console.log('✗ Commercial n\'est pas admin:', isAdmin(testUsers.commercial)); // false
  console.log('✗ Technicien n\'est pas admin:', isAdmin(testUsers.technicien)); // false
  console.log('✗ Client n\'est pas admin:', isAdmin(testUsers.client)); // false
};

// ═══════════════════════════════════════════════════════════════
// 4️⃣ TEST 3: CAN VIEW - CONSULTER UN MODULE
// ═══════════════════════════════════════════════════════════════
export const test_canView = () => {
  console.log('\n👁️ TEST: canView() - Consulter un module\n');

  console.log('--- Admin ---');
  console.log('✓ Admin peut voir CLIENTS:', canView(testUsers.admin, MODULE_CODES.CLIENTS)); // true
  console.log('✓ Admin peut voir STOCK:', canView(testUsers.admin, MODULE_CODES.STOCK)); // true

  console.log('\n--- Commercial ---');
  console.log('✓ Commercial peut voir CLIENTS:', canView(testUsers.commercial, MODULE_CODES.CLIENTS)); // true
  console.log('✓ Commercial peut voir DEVIS:', canView(testUsers.commercial, MODULE_CODES.DEVIS)); // true
  console.log('✗ Commercial ne peut pas voir SETTINGS:', canView(testUsers.commercial, MODULE_CODES.SETTINGS)); // false

  console.log('\n--- Technicien ---');
  console.log('✓ Technicien peut voir ACTIVITES:', canView(testUsers.technicien, MODULE_CODES.ACTIVITES)); // true
  console.log('✓ Technicien peut voir SAV:', canView(testUsers.technicien, MODULE_CODES.SAV)); // true
  console.log('✗ Technicien ne peut pas voir DEVIS:', canView(testUsers.technicien, MODULE_CODES.DEVIS)); // false

  console.log('\n--- Client ---');
  console.log('✓ Client peut voir DEVIS:', canView(testUsers.client, MODULE_CODES.DEVIS)); // true
  console.log('✓ Client peut voir SAV:', canView(testUsers.client, MODULE_CODES.SAV)); // true
  console.log('✗ Client ne peut pas voir STOCK:', canView(testUsers.client, MODULE_CODES.STOCK)); // false
};

// ═══════════════════════════════════════════════════════════════
// 5️⃣ TEST 4: CAN CREATE - CRÉER DANS UN MODULE
// ═══════════════════════════════════════════════════════════════
export const test_canCreate = () => {
  console.log('\n➕ TEST: canCreate() - Créer dans un module\n');

  console.log('--- Admin ---');
  console.log('✓ Admin peut CREATE CLIENTS:', canCreate(testUsers.admin, MODULE_CODES.CLIENTS)); // true
  console.log('✓ Admin peut CREATE DEVIS:', canCreate(testUsers.admin, MODULE_CODES.DEVIS)); // true

  console.log('\n--- Commercial ---');
  console.log('✓ Commercial peut CREATE CLIENTS:', canCreate(testUsers.commercial, MODULE_CODES.CLIENTS)); // true
  console.log('✓ Commercial peut CREATE DEVIS:', canCreate(testUsers.commercial, MODULE_CODES.DEVIS)); // true

  console.log('\n--- Technicien ---');
  console.log('✗ Technicien ne peut pas CREATE CLIENTS:', canCreate(testUsers.technicien, MODULE_CODES.CLIENTS)); // false
  console.log('✗ Technicien ne peut pas CREATE DEVIS:', canCreate(testUsers.technicien, MODULE_CODES.DEVIS)); // false

  console.log('\n--- Client ---');
  console.log('✓ Client peut CREATE DEVIS:', canCreate(testUsers.client, MODULE_CODES.DEVIS)); // true (peut créer une réclamation)
  console.log('✗ Client ne peut pas CREATE CLIENTS:', canCreate(testUsers.client, MODULE_CODES.CLIENTS)); // false

  console.log('\n--- Agent ---');
  console.log('✓ Agent peut CREATE CLIENTS:', canCreate(testUsers.agent, MODULE_CODES.CLIENTS)); // true
  console.log('✓ Agent peut CREATE DEVIS:', canCreate(testUsers.agent, MODULE_CODES.DEVIS)); // true
};

// ═══════════════════════════════════════════════════════════════
// 6️⃣ TEST 5: CAN EDIT - MODIFIER DANS UN MODULE  ⭐ IMPORTANT
// ═══════════════════════════════════════════════════════════════
export const test_canEdit = () => {
  console.log('\n✏️ TEST: canEdit() - Modifier dans un module\n');

  console.log('--- Admin ---');
  console.log('✓ Admin peut EDIT CLIENTS:', canEdit(testUsers.admin, MODULE_CODES.CLIENTS)); // true
  console.log('✓ Admin peut EDIT DEVIS:', canEdit(testUsers.admin, MODULE_CODES.DEVIS)); // true
  console.log('✓ Admin peut EDIT STOCK:', canEdit(testUsers.admin, MODULE_CODES.STOCK)); // true

  console.log('\n--- Commercial ---');
  console.log('✓ Commercial peut EDIT CLIENTS:', canEdit(testUsers.commercial, MODULE_CODES.CLIENTS)); // true
  console.log('✓ Commercial peut EDIT DEVIS:', canEdit(testUsers.commercial, MODULE_CODES.DEVIS)); // true
  console.log('✗ Commercial ne peut pas EDIT STOCK:', canEdit(testUsers.commercial, MODULE_CODES.STOCK)); // false

  console.log('\n--- Technicien ---');
  console.log('✓ Technicien peut EDIT ACTIVITES:', canEdit(testUsers.technicien, MODULE_CODES.ACTIVITES)); // true
  console.log('✗ Technicien ne peut pas EDIT DEVIS:', canEdit(testUsers.technicien, MODULE_CODES.DEVIS)); // false

  console.log('\n--- Client ---');
  console.log('✗ Client ne peut pas EDIT DEVIS:', canEdit(testUsers.client, MODULE_CODES.DEVIS)); // false
  console.log('✗ Client ne peut pas EDIT CLIENTS:', canEdit(testUsers.client, MODULE_CODES.CLIENTS)); // false

  console.log('\n--- Agent ---');
  console.log('✓ Agent peut EDIT CLIENTS:', canEdit(testUsers.agent, MODULE_CODES.CLIENTS)); // true
  console.log('✓ Agent peut EDIT DEVIS:', canEdit(testUsers.agent, MODULE_CODES.DEVIS)); // true
};

// ═══════════════════════════════════════════════════════════════
// 7️⃣ TEST 6: CAN DELETE - SUPPRIMER
// ═══════════════════════════════════════════════════════════════
export const test_canDelete = () => {
  console.log('\n🗑️ TEST: canDelete() - Supprimer dans un module\n');

  console.log('--- Admin ---');
  console.log('✓ Admin peut DELETE CLIENTS:', canDelete(testUsers.admin, MODULE_CODES.CLIENTS)); // true
  console.log('✓ Admin peut DELETE DEVIS:', canDelete(testUsers.admin, MODULE_CODES.DEVIS)); // true

  console.log('\n--- Commercial ---');
  console.log('✗ Commercial ne peut pas DELETE CLIENTS:', canDelete(testUsers.commercial, MODULE_CODES.CLIENTS)); // false
  console.log('✗ Commercial ne peut pas DELETE DEVIS:', canDelete(testUsers.commercial, MODULE_CODES.DEVIS)); // false

  console.log('\n--- Technicien ---');
  console.log('✗ Technicien ne peut pas DELETE ACTIVITES:', canDelete(testUsers.technicien, MODULE_CODES.ACTIVITES)); // false

  console.log('\n--- Client ---');
  console.log('✗ Client ne peut pas DELETE DEVIS:', canDelete(testUsers.client, MODULE_CODES.DEVIS)); // false

  console.log('\n--- Agent ---');
  console.log('✗ Agent ne peut pas DELETE CLIENTS:', canDelete(testUsers.agent, MODULE_CODES.CLIENTS)); // false
};

// ═══════════════════════════════════════════════════════════════
// 8️⃣ TEST 7: CAN VALIDATE - VALIDER
// ═══════════════════════════════════════════════════════════════
export const test_canValidate = () => {
  console.log('\n✅ TEST: canValidate() - Valider\n');

  console.log('--- Admin ---');
  console.log('✓ Admin peut VALIDATE DEVIS:', canValidate(testUsers.admin, MODULE_CODES.DEVIS)); // true

  console.log('\n--- Commercial ---');
  console.log('✗ Commercial ne peut pas VALIDATE DEVIS:', canValidate(testUsers.commercial, MODULE_CODES.DEVIS)); // false

  console.log('\n--- Technicien ---');
  console.log('✗ Technicien ne peut pas VALIDATE ACTIVITES:', canValidate(testUsers.technicien, MODULE_CODES.ACTIVITES)); // false
};

// ═══════════════════════════════════════════════════════════════
// 9️⃣ TEST 8: CAN EXPORT - EXPORTER
// ═══════════════════════════════════════════════════════════════
export const test_canExport = () => {
  console.log('\n📤 TEST: canExport() - Exporter\n');

  console.log('--- Admin ---');
  console.log('✓ Admin peut EXPORT CLIENTS:', canExport(testUsers.admin, MODULE_CODES.CLIENTS)); // true

  console.log('\n--- Commercial ---');
  console.log('✗ Commercial ne peut pas EXPORT CLIENTS:', canExport(testUsers.commercial, MODULE_CODES.CLIENTS)); // false

  console.log('\n--- Client ---');
  console.log('✗ Client ne peut pas EXPORT DEVIS:', canExport(testUsers.client, MODULE_CODES.DEVIS)); // false
};

// ═══════════════════════════════════════════════════════════════
// 🔟 TEST 9: GET MODULE PERMISSIONS - TOUTES LES PERMS D'UN MODULE
// ═══════════════════════════════════════════════════════════════
export const test_getModulePermissions = () => {
  console.log('\n📋 TEST: getModulePermissions() - Toutes les permissions d\'un module\n');

  console.log('--- Permissions Admin pour DEVIS ---');
  console.log(getModulePermissions(testUsers.admin, MODULE_CODES.DEVIS));
  /* Output:
  {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canValidate: true,
    canExport: true,
  }
  */

  console.log('\n--- Permissions Commercial pour DEVIS ---');
  console.log(getModulePermissions(testUsers.commercial, MODULE_CODES.DEVIS));
  /* Output:
  {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canValidate: false,
    canExport: false,
  }
  */

  console.log('\n--- Permissions Technicien pour ACTIVITES ---');
  console.log(getModulePermissions(testUsers.technicien, MODULE_CODES.ACTIVITES));
  /* Output:
  {
    canView: true,
    canCreate: false,
    canEdit: true,
    canDelete: false,
    canValidate: false,
    canExport: false,
  }
  */

  console.log('\n--- Permissions Client pour DEVIS ---');
  console.log(getModulePermissions(testUsers.client, MODULE_CODES.DEVIS));
  /* Output:
  {
    canView: true,
    canCreate: true,
    canEdit: false,
    canDelete: false,
    canValidate: false,
    canExport: false,
  }
  */
};

// ════════════════════════════════════════════════════════════════
// 🏃 TEST 10: HAS PERMISSION - VÉRIFIE UNE ACTION SPÉCIFIQUE
// ════════════════════════════════════════════════════════════════
export const test_hasPermission = () => {
  console.log('\n🔑 TEST: hasPermission() - Vérifie une action spécifique\n');

  console.log(
    '✓ Admin peut "Créer" dans DEVIS:',
    hasPermission(testUsers.admin, MODULE_CODES.DEVIS, ACTION_TYPES.CREATE)
  ); // true

  console.log(
    '✓ Commercial peut "Modifier" dans CLIENTS:',
    hasPermission(testUsers.commercial, MODULE_CODES.CLIENTS, ACTION_TYPES.EDIT)
  ); // true

  console.log(
    '✗ Commercial ne peut pas "Supprimer" dans DEVIS:',
    hasPermission(testUsers.commercial, MODULE_CODES.DEVIS, ACTION_TYPES.DELETE)
  ); // false

  console.log(
    '✗ Client ne peut pas "Modifier" dans DEVIS:',
    hasPermission(testUsers.client, MODULE_CODES.DEVIS, ACTION_TYPES.EDIT)
  ); // false

  console.log(
    '✓ Technicien peut "Modifier" dans ACTIVITES:',
    hasPermission(testUsers.technicien, MODULE_CODES.ACTIVITES, ACTION_TYPES.EDIT)
  ); // true
};

// ════════════════════════════════════════════════════════════════
// 🗂️ TEST 11: FILTER MENU BY PERMISSIONS
// ════════════════════════════════════════════════════════════════
export const test_filterMenuByPermissions = () => {
  console.log('\n🎯 TEST: filterMenuByPermissions() - Filtrer menu selon permissions\n');

  const menuItems = [
    { label: 'Dashboard', moduleCode: MODULE_CODES.DASHBOARD },
    { label: 'Clients', moduleCode: MODULE_CODES.CLIENTS },
    { label: 'Stocks', moduleCode: MODULE_CODES.STOCK },
    { label: 'Settings', moduleCode: MODULE_CODES.SETTINGS },
    { label: 'Help', moduleCode: null }, // Toujours visible
  ];

  console.log('--- Menu filtré pour Commercial ---');
  const commercialMenu = filterMenuByPermissions(menuItems, testUsers.commercial);
  console.log(commercialMenu.map((m) => m.label));
  // Output: ['Dashboard', 'Clients', 'Help']

  console.log('\n--- Menu filtré pour Technicien ---');
  const technicienMenu = filterMenuByPermissions(menuItems, testUsers.technicien);
  console.log(technicienMenu.map((m) => m.label));
  // Output: ['Dashboard', 'Help']

  console.log('\n--- Menu filtré pour Admin ---');
  const adminMenu = filterMenuByPermissions(menuItems, testUsers.admin);
  console.log(adminMenu.map((m) => m.label));
  // Output: ['Dashboard', 'Clients', 'Stocks', 'Settings', 'Help']
};

// ════════════════════════════════════════════════════════════════
// 🧪 EXÉCUTER TOUS LES TESTS
// ════════════════════════════════════════════════════════════════
export const runAllTests = () => {
  console.clear();
  console.log('🚀 DÉMARRAGE DE TOUS LES TESTS DE PERMISSIONS\n');
  console.log('═'.repeat(60) + '\n');

  test_hasRole();
  test_isAdmin();
  test_canView();
  test_canCreate();
  test_canEdit();
  test_canDelete();
  test_canValidate();
  test_canExport();
  test_getModulePermissions();
  test_hasPermission();
  test_filterMenuByPermissions();

  console.log('\n' + '═'.repeat(60));
  console.log('✅ TOUS LES TESTS TERMINÉS!\n');
};

export default {
  runAllTests,
  testUsers,
  test_hasRole,
  test_isAdmin,
  test_canView,
  test_canCreate,
  test_canEdit,
  test_canDelete,
  test_canValidate,
  test_canExport,
  test_getModulePermissions,
  test_hasPermission,
  test_filterMenuByPermissions,
};
