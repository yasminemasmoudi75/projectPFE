/**
 * VÉRIFICATION RAPIDE: Imports et logique de base
 * 
 * Vérifie:
 * - Les imports se chargent sans erreur
 * - Les VIRTUAL fields sont accessibles
 * - La logique est syntaxiquement correcte
 * 
 * Exécution: node test_syntax_check.js
 */

console.log('🔍 Vérification des imports et syntaxe...\n');

try {
  console.log('1️⃣ Chargement du modèle Reglement...');
  const Reglement = require('./src/models/Reglement');
  console.log('   ✅ Reglement chargé\n');

  console.log('2️⃣ Vérification des VIRTUAL fields...');
  const fields = ['EstOrphelin', 'isAffecteObjectif', 'Statut_FR', 'Montant_Formaté'];
  fields.forEach(field => {
    if (Reglement.rawAttributes[field]) {
      console.log(`   ✅ ${field}`);
    } else {
      console.log(`   ⚠️  ${field} manquant`);
    }
  });
  console.log();

  console.log('3️⃣ Chargement du service ObjectifGestionService...');
  const ObjectifGestionService = require('./src/services/objectifGestionService');
  console.log('   ✅ ObjectifGestionService chargé\n');

  console.log('4️⃣ Vérification des méthodes...');
  const methods = ['updateObjectifOnPayment', 'createObjectif', 'closeObjectifByAdmin'];
  const instance = ObjectifGestionService.prototype;
  methods.forEach(method => {
    if (typeof instance[method] === 'function') {
      console.log(`   ✅ ${method}()`);
    } else {
      console.log(`   ❌ ${method}() manquant`);
    }
  });
  console.log();

  console.log('5️⃣ Chargement du contrôleur...');
  const ObjectifGestionController = require('./src/controllers/objectifGestionController');
  console.log('   ✅ ObjectifGestionController chargé\n');

  console.log('6️⃣ Vérification des endpoints...');
  const endpoints = [
    'enregistrerPaiement',
    'creerObjectif',
    'fermerObjectifByAdmin',
    'obtenirHistoriqueObjectifs'
  ];
  const ctrlInstance = ObjectifGestionController.prototype;
  endpoints.forEach(endpoint => {
    if (typeof ctrlInstance[endpoint] === 'function') {
      console.log(`   ✅ ${endpoint}()`);
    } else {
      console.log(`   ❌ ${endpoint}() manquant`);
    }
  });
  console.log();

  console.log('7️⃣ Vérification du logger...');
  const { logAction } = require('./src/utils/logger');
  if (typeof logAction === 'function') {
    console.log('   ✅ logAction() disponible\n');
  }

  console.log('='.repeat(60));
  console.log('✅ TOUS LES IMPORTS RÉUSSIS');
  console.log('='.repeat(60));
  console.log('\nℹ️  Pour un test complet avec DB: node test_paiement_logic.js\n');

} catch (error) {
  console.error('❌ ERREUR:', error.message);
  console.error(error.stack);
  process.exit(1);
}
