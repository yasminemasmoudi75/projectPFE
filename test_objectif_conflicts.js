#!/usr/bin/env node
/**
 * Test des conflits d'objectifs commerciaux
 * 
 * Usage:
 *   node test_objectif_conflicts.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3066';

// Couleurs pour le terminal
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
};

async function testConflicts() {
    try {
        log.info('='.repeat(80));
        log.info('Test de Validation des Conflits d\'Objectifs');
        log.info('='.repeat(80));

        // Configuration de test (à adapter selon vos données)
        const testCommercialId = 5; // ID d'un commercial existant
        const testMonth = 5; // Mai 2026
        const testYear = 2026;

        log.info(`\nCommercial testé: ID ${testCommercialId}`);
        log.info(`Période: ${testMonth}/${testYear}\n`);

        // === TEST 1: Créer un objectif Mensuel ===
        log.info('TEST 1: Créer un objectif Mensuel');
        log.info('-'.repeat(80));
        
        const monthlyPayload = {
            ID_Utilisateur: testCommercialId,
            TypePeriode: 'Mensuel',
            Mois: testMonth,
            Annee: testYear,
            MontantCible: 10000,
            TypeObjectif: 'Chiffre d\'affaires',
            Libelle_Indicateur: 'Test Mensuel'
        };

        try {
            const monthlyRes = await axios.post(`${API_BASE}/objectifs`, monthlyPayload);
            const monthlyObjectif = monthlyRes.data.data;
            log.success(`Objectif Mensuel créé: ID ${monthlyObjectif.ID_Objectif}`);
            
            // === TEST 2: Essayer de créer un Hebdomadaire en conflit ===
            log.info('\nTEST 2: Créer un Hebdomadaire en CONFLIT avec le Mensuel');
            log.info('-'.repeat(80));
            
            const weeklyPayload = {
                ID_Utilisateur: testCommercialId,
                TypePeriode: 'Hebdomadaire',
                Numsem: 18,
                DateDebut: `${testYear}-05-01`, // Dans le même mois
                DateFin: `${testYear}-05-07`,
                MontantCible: 5000,
                TypeObjectif: 'Chiffre d\'affaires',
                Libelle_Indicateur: 'Test Hebdomadaire'
            };

            try {
                const weeklyRes = await axios.post(`${API_BASE}/objectifs`, weeklyPayload);
                log.error('⚠️  Le Hebdomadaire a été créé! Devrait être bloqué!');
            } catch (err) {
                if (err.response?.status === 409) {
                    log.success('Conflit détecté comme prévu (HTTP 409)');
                    log.info(`Message: ${err.response?.data?.message}`);
                } else {
                    log.error(`Erreur inattendue: ${err.response?.status} - ${err.response?.data?.message}`);
                }
            }

            // === TEST 3: Créer un Hebdomadaire dans un mois différent (devrait fonctionner) ===
            log.info('\nTEST 3: Créer un Hebdomadaire dans un mois DIFFÉRENT');
            log.info('-'.repeat(80));
            
            const otherWeeklyPayload = {
                ID_Utilisateur: testCommercialId,
                TypePeriode: 'Hebdomadaire',
                Numsem: 22,
                DateDebut: '2026-06-01', // Mois différent (juin)
                DateFin: '2026-06-07',
                MontantCible: 5000,
                TypeObjectif: 'Chiffre d\'affaires',
                Libelle_Indicateur: 'Test Juin'
            };

            try {
                const weeklyRes = await axios.post(`${API_BASE}/objectifs`, otherWeeklyPayload);
                log.success(`Objectif Hebdomadaire créé (juin): ID ${weeklyRes.data.data.ID_Objectif}`);
            } catch (err) {
                log.error(`Erreur inattendue: ${err.response?.data?.message}`);
            }

        } catch (err) {
            if (err.response?.status === 409) {
                log.warn('Le Mensuel a déjà un conflit existant');
                log.info(`Message: ${err.response?.data?.message}`);
            } else {
                log.error(`Erreur création Mensuel: ${err.response?.data?.message}`);
            }
        }

        log.info('\n' + '='.repeat(80));
        log.info('Test terminé');
        log.info('='.repeat(80));

    } catch (err) {
        log.error(`Erreur générale: ${err.message}`);
        process.exit(1);
    }
}

// Vérifier que le serveur est accessible
console.log('\n🔍 Vérification de la connexion au serveur...\n');
axios.get(`${API_BASE}/objectifs`)
    .then(() => {
        log.success(`Serveur accessible sur ${API_BASE}\n`);
        testConflicts();
    })
    .catch((err) => {
        log.error(`Impossible de se connecter au serveur: ${err.message}`);
        log.info(`Assurez-vous que le serveur backend est en cours d'exécution sur ${API_BASE}`);
        process.exit(1);
    });
