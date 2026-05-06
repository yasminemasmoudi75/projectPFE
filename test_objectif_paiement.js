#!/usr/bin/env node

/**
 * Test Script: Synchronisation Paiement → Objectif Commercial
 * 
 * Démontre le flux complet:
 * 1. Création objectif
 * 2. Création facture
 * 3. Enregistrement paiement
 * 4. Vérification archivage automatique
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3066/api';

// Couleurs pour terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`\n${colors.cyan}▶️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
};

// Test Case 1: Montant atteint
async function testMontantAtteint() {
  log.step('TEST 1: Paiement qui atteint le montant cible');
  
  try {
    // Créer objectif
    log.info('Création d\'un objectif (cible 5000 DT)');
    const objectifRes = await axios.post(`${API_BASE}/objectifs`, {
      MontantCible: 5000,
      DateDebut: '2026-05-01',
      DateFin: '2026-12-31',
      ID_Utilisateur: 1,
      Mois: 5,
      Annee: 2026,
      TypePeriode: 'Mensuel'
    });
    
    const objectifId = objectifRes.data.data.ID_Objectif;
    log.success(`Objectif créé: ${objectifId}`);
    log.info(`Initial: MontantRealise=0, Statut=ACTIF`);
    
    // Enregistrer paiement (montant entier)
    log.info('Enregistrement paiement 5000 DT');
    const paiementRes = await axios.post(`${API_BASE}/reglements`, {
      codTiers: 'TEST001',
      libTiers: 'Client Test',
      datReg: '2026-05-04',
      payments: [
        {
          montant: 5000,
          modReg: 'CHEQUE',
          echeance: '2026-05-10'
        }
      ],
      selectedPieces: [
        {
          id: 'test-facture-1',
          type: 'FA',
          allocatedAmount: 5000
        }
      ]
    });
    
    log.success('Paiement enregistré');
    
    // Vérifier objectif
    log.info('Vérification objectif après paiement');
    const checkRes = await axios.get(`${API_BASE}/objectifs/${objectifId}`);
    const objectif = checkRes.data.data;
    
    log.success(`Montant réalisé: ${objectif.Montant_Realise_Actuel} DT`);
    log.success(`Statut: ${objectif.StatutObjectif}`);
    log.success(`DateArchivage: ${objectif.DateArchivage ? '✅ REMPLIE' : '❌ Vide'}`);
    
    if (objectif.StatutObjectif === 'ARCHIVÉ') {
      log.success('✅ TEST 1 PASSÉ: Objectif archivé après paiement!');
    } else {
      log.error('❌ TEST 1 ÉCHOUÉ: Objectif devrait être ARCHIVÉ');
    }
    
  } catch (err) {
    log.error(`Erreur TEST 1: ${err.response?.data?.message || err.message}`);
  }
}

// Test Case 2: Date fin dépassée
async function testDateFinDepassee() {
  log.step('TEST 2: Archivage automatique par date fin dépassée');
  
  try {
    // Créer objectif avec date fin au passé
    log.info('Création d\'un objectif avec date fin dépassée');
    const objectifRes = await axios.post(`${API_BASE}/objectifs`, {
      MontantCible: 10000,
      DateDebut: '2026-03-01',
      DateFin: '2026-03-31', // Date passée!
      ID_Utilisateur: 1,
      Mois: 3,
      Annee: 2026,
      TypePeriode: 'Mensuel'
    });
    
    const objectifId = objectifRes.data.data.ID_Objectif;
    log.success(`Objectif créé avec DateFin=2026-03-31 (passée)`);
    
    // Paiement qui devrait archiver par date fin
    log.info('Enregistrement paiement (date fin dépassée)');
    const paiementRes = await axios.post(`${API_BASE}/reglements`, {
      codTiers: 'TEST002',
      libTiers: 'Client Test 2',
      datReg: '2026-05-04',
      payments: [
        {
          montant: 3000,
          modReg: 'VIREMENT',
          echeance: '2026-05-10'
        }
      ],
      selectedPieces: [
        {
          id: 'test-facture-2',
          type: 'FA',
          allocatedAmount: 3000
        }
      ]
    });
    
    log.success('Paiement enregistré');
    
    // Vérifier
    const checkRes = await axios.get(`${API_BASE}/objectifs/${objectifId}`);
    const objectif = checkRes.data.data;
    
    log.success(`Montant réalisé: ${objectif.Montant_Realise_Actuel} DT (30%)`);
    log.success(`Statut: ${objectif.StatutObjectif}`);
    
    if (objectif.StatutObjectif === 'ARCHIVÉ') {
      log.success('✅ TEST 2 PASSÉ: Objectif archivé par date fin dépassée!');
    } else {
      log.warn('❌ TEST 2 ÉCHOUÉ: Objectif devrait être ARCHIVÉ (date fin dépassée)');
    }
    
  } catch (err) {
    log.error(`Erreur TEST 2: ${err.response?.data?.message || err.message}`);
  }
}

// Test Case 3: Paiement partiel
async function testPaiementPartiel() {
  log.step('TEST 3: Paiement partiel (montant pas encore atteint)');
  
  try {
    log.info('Création d\'un objectif (cible 10000 DT)');
    const objectifRes = await axios.post(`${API_BASE}/objectifs`, {
      MontantCible: 10000,
      DateDebut: '2026-05-01',
      DateFin: '2026-12-31',
      ID_Utilisateur: 1,
      Mois: 5,
      Annee: 2026,
      TypePeriode: 'Mensuel'
    });
    
    const objectifId = objectifRes.data.data.ID_Objectif;
    log.success(`Objectif créé`);
    
    log.info('Paiement partiel: 3000 DT sur 10000 DT');
    await axios.post(`${API_BASE}/reglements`, {
      codTiers: 'TEST003',
      libTiers: 'Client Test 3',
      datReg: '2026-05-04',
      payments: [
        {
          montant: 3000,
          modReg: 'CHEQUE',
          echeance: '2026-05-10'
        }
      ],
      selectedPieces: [
        {
          id: 'test-facture-3',
          type: 'FA',
          allocatedAmount: 3000
        }
      ]
    });
    
    const checkRes = await axios.get(`${API_BASE}/objectifs/${objectifId}`);
    const objectif = checkRes.data.data;
    
    log.success(`Montant réalisé: ${objectif.Montant_Realise_Actuel} / 10000 DT (30%)`);
    log.success(`Statut: ${objectif.StatutObjectif}`);
    
    if (objectif.StatutObjectif === 'ACTIF' && objectif.DateArchivage === null) {
      log.success('✅ TEST 3 PASSÉ: Objectif reste ACTIF (pas encore atteint)');
    } else {
      log.error('❌ TEST 3 ÉCHOUÉ: Objectif devrait rester ACTIF');
    }
    
  } catch (err) {
    log.error(`Erreur TEST 3: ${err.response?.data?.message || err.message}`);
  }
}

// Test Case 4: Pas d'objectif
async function testPasObjectif() {
  log.step('TEST 4: Paiement sans objectif actif (orphelin)');
  
  try {
    log.info('Enregistrement paiement pour commercial sans objectif');
    const paiementRes = await axios.post(`${API_BASE}/reglements`, {
      codTiers: 'TEST004',
      libTiers: 'Client sans objectif',
      datReg: '2026-05-04',
      payments: [
        {
          montant: 2000,
          modReg: 'ESPECE',
          echeance: '2026-05-10'
        }
      ],
      selectedPieces: [
        {
          id: 'test-facture-4',
          type: 'FA',
          allocatedAmount: 2000
        }
      ]
    });
    
    if (paiementRes.status === 201) {
      log.success('✅ TEST 4 PASSÉ: Paiement enregistré comme ORPHELIN');
      log.info('Montant: 2000 DT, ID_Objectif: NULL');
    }
    
  } catch (err) {
    log.error(`Erreur TEST 4: ${err.response?.data?.message || err.message}`);
  }
}

// Main
async function runAllTests() {
  console.log(`\n${colors.cyan}════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  Tests Synchronisation Paiement → Objectif Commercial${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════${colors.reset}\n`);
  
  try {
    // Vérifier connexion
    await axios.get(`${API_BASE}/objectifs`);
    log.success('Connexion API établie');
    
    // Lancer tests
    await testMontantAtteint();
    await testDateFinDepassee();
    await testPaiementPartiel();
    await testPasObjectif();
    
    console.log(`\n${colors.cyan}════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}Tests terminés!${colors.reset}`);
    console.log(`${colors.cyan}════════════════════════════════════════════════════════${colors.reset}\n`);
    
  } catch (err) {
    log.error(`Impossible de se connecter à l'API: ${err.message}`);
    log.warn('Assurez-vous que le backend est en cours d\'exécution sur port 3066');
  }
}

// Lancer les tests
runAllTests().catch(console.error);
