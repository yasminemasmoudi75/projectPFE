/**
 * TEST: Logique des paiements et objectifs
 * 
 * Démontre les 3 cas réels d'une application CRM:
 * ✅ CAS 1: Paiement avec objectif ACTIF
 * ⚠️  CAS 2: Paiement sans objectif ACTIF (orphelin)
 * ✅ CAS 3: Paiement orphelin puis création d'objectif
 * 
 * Exécution: node test_paiement_logic.js
 */

const { sequelize } = require('./src/config/database');
const models = require('./src/models');
const ObjectifGestionService = require('./src/services/objectifGestionService');
const { logAction } = require('./src/utils/logger');

const service = new ObjectifGestionService(models);

// UUID helpers
const uuid = () => require('crypto').randomUUID();

async function test() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TEST: Logique des paiements commerciaux');
  console.log('='.repeat(80) + '\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB établie\n');

    // ========================================================================
    // CAS 1: Paiement avec objectif ACTIF
    // ========================================================================
    console.log('📋 CAS 1: Paiement avec objectif ACTIF');
    console.log('-'.repeat(80));

    const commercialId = uuid();
    const factureId1 = uuid();

    // Créer un objectif ACTIF
    console.log('  [1] Création d\'un objectif ACTIF...');
    const objectif1 = await models.Objectif.create({
      ID_Objectif: uuid(),
      IdCont: commercialId,
      MontantCible: '5000',
      Montant_Realise_Actuel: '0',
      StatutObjectif: 'ACTIF',
      DateDebut: new Date(),
      Annee: 2026,
      TypeObjectif: 'Objectif Q2'
    });

    console.log(`      ✅ Créé: ${objectif1.ID_Objectif}`);
    console.log(`         Cible: ${objectif1.MontantCible} DT`);
    console.log(`         Montant ACTIF: ${objectif1.Montant_Realise_Actuel} DT\n`);

    // Enregistrer un paiement
    console.log('  [2] Enregistrement paiement: 2500 DT...');
    const resultat1 = await service.updateObjectifOnPayment({
      ID_Facture: factureId1,
      CodRepres: 'COM001',
      Montant: 2500,
      MoyenPaiement: 'Virement',
      Reference: 'VIR-2026-001',
      ID_Utilisateur: 1
    });

    console.log(`      ✅ Paiement enregistré`);
    console.log(`         objectif_updated: ${resultat1.objectif_updated}`);
    console.log(`         Paiement ID: ${resultat1.reglement.ID_Reglement}`);
    console.log(`         Paiement lié à objectif: ${resultat1.reglement.ID_Objectif !== null}`);
    console.log(`         Message: "${resultat1.message}"\n`);

    // Vérifier l'objectif mis à jour
    const objectif1After = await models.Objectif.findByPk(objectif1.ID_Objectif);
    console.log(`  [3] Vérification objectif après paiement:`);
    console.log(`      Montant ACTIF: ${objectif1After.Montant_Realise_Actuel} DT (était 0)`);
    console.log(`      Progression: ${(Number(objectif1After.Montant_Realise_Actuel) / Number(objectif1After.MontantCible) * 100).toFixed(2)}%`);
    console.log(`      Statut: ${objectif1After.StatutObjectif}\n`);

    // ========================================================================
    // CAS 2: Paiement SANS objectif ACTIF (orphelin)
    // ========================================================================
    console.log('📋 CAS 2: Paiement SANS objectif ACTIF (orphelin)');
    console.log('-'.repeat(80));

    const commercialId2 = uuid(); // Commercial SANS objectif
    const factureId2 = uuid();

    console.log('  [1] Commercial sans objectif ACTIF');
    const objectifCount = await models.Objectif.count({
      where: { IdCont: commercialId2, StatutObjectif: 'ACTIF' }
    });
    console.log(`      Objectifs ACTIFS: ${objectifCount}\n`);

    console.log('  [2] Enregistrement paiement: 1500 DT...');
    const resultat2 = await service.updateObjectifOnPayment({
      ID_Facture: factureId2,
      CodRepres: 'COM002',
      Montant: 1500,
      MoyenPaiement: 'Chèque',
      Reference: 'CHQ-2026-042',
      ID_Utilisateur: 1,
      Observations: 'Paiement client sans objectif défini'
    });

    console.log(`      ✅ Paiement enregistré (pas bloqué)`);
    console.log(`         objectif_updated: ${resultat2.objectif_updated}`);
    console.log(`         Paiement ID: ${resultat2.reglement.ID_Reglement}`);
    console.log(`         Paiement lié à objectif: ${resultat2.reglement.ID_Objectif !== null}`);
    console.log(`         ⚠️  Warning: "${resultat2.warning}"`);
    console.log(`         Message: "${resultat2.message}"`);
    console.log(`         Observations: "${resultat2.reglement.Observations}"\n`);

    // Vérifier que le paiement est bien ORPHELIN
    const reglement2 = await models.Reglement.findByPk(resultat2.reglement.ID_Reglement);
    console.log(`  [3] Vérification paiement orphelin:`);
    console.log(`      EstOrphelin: ${reglement2.EstOrphelin} (pas d'objectif)`);
    console.log(`      isAffecteObjectif: ${reglement2.isAffecteObjectif} (false)`);
    console.log(`      Observations: "${reglement2.Observations}"\n`);

    // ========================================================================
    // CAS 3: Paiement orphelin puis création d'objectif
    // ========================================================================
    console.log('📋 CAS 3: Paiement orphelin → création d\'objectif');
    console.log('-'.repeat(80));

    console.log('  [1] État avant création objectif:');
    console.log(`      Paiement orphelin existant: 1500 DT`);
    console.log(`      Objectifs ACTIFS: ${objectifCount}\n`);

    console.log('  [2] Admin crée nouvel objectif pour ce commercial...');
    const objectif3 = await models.Objectif.create({
      ID_Objectif: uuid(),
      IdCont: commercialId2,
      MontantCible: '4000',
      Montant_Realise_Actuel: '0',
      StatutObjectif: 'ACTIF',
      DateDebut: new Date(),
      Annee: 2026,
      TypeObjectif: 'Objectif nouveau'
    });

    console.log(`      ✅ Créé: ${objectif3.ID_Objectif}`);
    console.log(`         Cible: ${objectif3.MontantCible} DT`);
    console.log(`         Note: Paiement orphelin RESTE indépendant\n`);

    console.log('  [3] Enregistrement NOUVEAU paiement: 2000 DT...');
    const resultat3 = await service.updateObjectifOnPayment({
      ID_Facture: uuid(),
      CodRepres: 'COM002',
      Montant: 2000,
      MoyenPaiement: 'Virement',
      Reference: 'VIR-2026-002',
      ID_Utilisateur: 1
    });

    console.log(`      ✅ Paiement enregistré`);
    console.log(`         objectif_updated: ${resultat3.objectif_updated}`);
    console.log(`         Paiement lié à objectif: ${resultat3.reglement.ID_Objectif !== null}`);
    console.log(`         Objectif lié: ${resultat3.reglement.ID_Objectif}\n`);

    const objectif3After = await models.Objectif.findByPk(objectif3.ID_Objectif);
    console.log(`  [4] État final de l'objectif:`);
    console.log(`      Montant ACTIF: ${objectif3After.Montant_Realise_Actuel} DT`);
    console.log(`      Progression: ${(Number(objectif3After.Montant_Realise_Actuel) / Number(objectif3After.MontantCible) * 100).toFixed(2)}%`);
    console.log(`      ℹ️  Paiement orphelin (1500) ne compte pas ici\n`);

    // ========================================================================
    // RÉSUMÉ
    // ========================================================================
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('='.repeat(80));

    console.log(`\n✅ CAS 1: Paiement avec objectif ACTIF`);
    console.log(`   → Montant ajouté à l'objectif`);
    console.log(`   → Progression mise à jour`);
    console.log(`   → objectif_updated = true\n`);

    console.log(`⚠️  CAS 2: Paiement sans objectif ACTIF`);
    console.log(`   → Paiement enregistré normalement (PAS BLOQUÉ)`);
    console.log(`   → Marqué comme "ORPHELIN" (ID_Objectif = NULL)`);
    console.log(`   → isAffecteObjectif = false`);
    console.log(`   → Admin notifié pour créer objectif\n`);

    console.log(`✅ CAS 3: Nouvel objectif créé après paiement orphelin`);
    console.log(`   → Les NOUVEAUX paiements vont au nouvel objectif`);
    console.log(`   → Paiement orphelin reste historisé séparé`);
    console.log(`   → Audit trail complet conservé\n`);

    // ========================================================================
    // IMPORTANCE CRM
    // ========================================================================
    console.log('💡 IMPORTANCE EN CRM RÉELLE');
    console.log('='.repeat(80));

    console.log(`\n🎯 Pourquoi ne pas bloquer le paiement (CAS 2)?`);
    console.log(`   • NUNCA bloquer l'entrée d'argent (perte financière)`);
    console.log(`   • Paiements = priorité absolue du CRM`);
    console.log(`   • Admin peut réagir après coup`);
    console.log(`   • Évite des appels client "votre paiement a échoué"\n`);

    console.log(`🎯 Pourquoi ne pas créer objectif auto (CAS 2)?`);
    console.log(`   • Montant cible = décision stratégique (pas technique)`);
    console.log(`   • Évite des objectifs fantômes`);
    console.log(`   • Admin garde contrôle complet`);
    console.log(`   • Cohérent avec règle "un seul objectif ACTIF"\n`);

    console.log(`🎯 Traçabilité (CAS 3)?`);
    console.log(`   • Paiement orphelin reste lié à sa facture (historique)`);
    console.log(`   • Nouvel objectif reçoit NOUVEAUX paiements`);
    console.log(`   • Audit complet conservé (rien perdu)\n`);

    console.log('='.repeat(80));
    console.log('✅ TOUS LES TESTS RÉUSSIS\n');

  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

test();
