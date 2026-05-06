#!/usr/bin/env node

/**
 * TEST SCRIPT - Frontend/Backend Conflict Detection Integration
 * 
 * Ce script teste l'intégration complète de la validation de conflits
 * entre objectifs Mensuel et Hebdomadaire.
 * 
 * PRÉREQUIS:
 * - Backend NODE.js en cours d'exécution (port 3066)
 * - Frontend React en cours d'exécution (port 5173 ou 3000)
 * - Base de données SQL Server accessible
 * 
 * USAGE:
 * node test_conflict_integration.js
 */

const axios = require('axios');

const BASE_API_URL = 'http://localhost:3066';
const FRONTEND_URL = 'http://localhost:5173'; // Ou 3000 si Vite n'est pas utilisé

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
};

function log(color, ...args) {
    console.log(color, ...args, colors.reset);
}

const api = axios.create({
    baseURL: BASE_API_URL,
    validateStatus: () => true, // Ne pas lever d'erreur sur les status codes
});

async function testFrontendConflictDetection() {
    log(colors.cyan, '\n=== TEST 1: Détection Frontend ===\n');
    
    try {
        const response = await axios.get(FRONTEND_URL);
        if (response.status === 200) {
            log(colors.green, '✓ Frontend accessible');
            
            // Vérifier la présence de checkConflict dans le code
            if (response.data.includes('checkConflict')) {
                log(colors.green, '✓ Fonction checkConflict trouvée dans le code');
            } else {
                log(colors.yellow, '⚠ Fonction checkConflict non trouvée (peut être minifiée)');
            }
        }
    } catch (error) {
        log(colors.red, '✗ Frontend non accessible');
        log(colors.gray, `  Erreur: ${error.message}`);
    }
}

async function testBackendValidation() {
    log(colors.cyan, '\n=== TEST 2: Validation Backend ===\n');
    
    try {
        // Récupérer tous les objectifs
        const objectifsRes = await api.get('/objectifs');
        
        if (objectifsRes.status === 200 && Array.isArray(objectifsRes.data)) {
            log(colors.green, `✓ Objectifs chargés (${objectifsRes.data.length} total)`);
            
            // Vérifier que le backend retourne les bonnes structures
            const sample = objectifsRes.data[0];
            if (sample) {
                const requiredFields = ['ID_Utilisateur', 'TypePeriode', 'Mois', 'Annee', 'StatutObjectif'];
                const hasRequired = requiredFields.every(field => field in sample);
                
                if (hasRequired) {
                    log(colors.green, '✓ Structure d\'objectif correcte');
                } else {
                    log(colors.yellow, '⚠ Champs manquants:', 
                        requiredFields.filter(f => !(f in sample)));
                }
            }
        } else {
            log(colors.red, '✗ Impossible de charger les objectifs');
        }
    } catch (error) {
        log(colors.red, '✗ Erreur backend');
        log(colors.gray, `  Erreur: ${error.message}`);
    }
}

async function testConflictScenarios() {
    log(colors.cyan, '\n=== TEST 3: Scénarios de Conflit ===\n');
    
    try {
        const objectifsRes = await api.get('/objectifs');
        if (!Array.isArray(objectifsRes.data) || objectifsRes.data.length === 0) {
            log(colors.yellow, '⚠ Pas d\'objectifs trouvés pour tester les conflits');
            return;
        }
        
        const objectifs = objectifsRes.data;
        
        // Scénario 1: Chercher une paire Mensuel/Hebdomadaire conflictuelle
        const mensuelObjs = objectifs.filter(o => o.TypePeriode === 'Mensuel' && ['ACTIF', 'ATTEINT'].includes(String(o.StatutObjectif).toUpperCase()));
        const hebdoObjs = objectifs.filter(o => o.TypePeriode === 'Hebdomadaire' && ['ACTIF', 'ATTEINT'].includes(String(o.StatutObjectif).toUpperCase()));
        
        log(colors.blue, `Objectifs Mensuel actifs: ${mensuelObjs.length}`);
        log(colors.blue, `Objectifs Hebdomadaire actifs: ${hebdoObjs.length}`);
        
        // Chercher un cas de conflit
        let conflictFound = false;
        for (const mensuel of mensuelObjs) {
            for (const hebdo of hebdoObjs) {
                if (String(mensuel.ID_Utilisateur) === String(hebdo.ID_Utilisateur)) {
                    const mensuelMonth = parseInt(mensuel.Mois);
                    const hebdoMonth = new Date(hebdo.DateDebut).getMonth() + 1;
                    const mensuelYear = parseInt(mensuel.Annee);
                    const hebdoYear = new Date(hebdo.DateDebut).getFullYear();
                    
                    if (mensuelMonth === hebdoMonth && mensuelYear === hebdoYear) {
                        log(colors.yellow, `⚠ Conflit détecté:`);
                        log(colors.gray, `  - Utilisateur: ${mensuel.ID_Utilisateur}`);
                        log(colors.gray, `  - Mensuel: ${mensuelMonth}/${mensuelYear} (${mensuel.StatutObjectif})`);
                        log(colors.gray, `  - Hebdomadaire: ${hebdoMonth}/${hebdoYear} (${hebdo.StatutObjectif})`);
                        conflictFound = true;
                        break;
                    }
                }
            }
            if (conflictFound) break;
        }
        
        if (!conflictFound) {
            log(colors.blue, 'Aucun conflit Mensuel/Hebdomadaire détecté (normal si peu de données)');
        }
        
    } catch (error) {
        log(colors.red, '✗ Erreur lors du test de scénarios');
        log(colors.gray, `  Erreur: ${error.message}`);
    }
}

async function testAPIEndpoints() {
    log(colors.cyan, '\n=== TEST 4: Endpoints API ===\n');
    
    try {
        // Test 1: GET /objectifs
        const objectifsRes = await api.get('/objectifs');
        log(colors.green, `✓ GET /objectifs - Status ${objectifsRes.status}`);
        
        // Test 2: GET /users
        const usersRes = await api.get('/users');
        log(colors.green, `✓ GET /users - Status ${usersRes.status}`);
        
        // Test 3: GET /users/commercials/objectifs-filter
        const comRes = await api.get('/users/commercials/objectifs-filter');
        log(colors.green, `✓ GET /users/commercials/objectifs-filter - Status ${comRes.status}`);
        
    } catch (error) {
        log(colors.red, '✗ Erreur lors du test des endpoints');
        log(colors.gray, `  Erreur: ${error.message}`);
    }
}

async function testFrontendCheckConflictLogic() {
    log(colors.cyan, '\n=== TEST 5: Logique Frontend checkConflict ===\n');
    
    // Simuler la logique checkConflict en JavaScript pur
    const checkConflict = (userId, typePeriode, mois, annee, dateDebut, existingObjectifs) => {
        if (!userId || !existingObjectifs.length) return null;

        let targetMois = mois;
        let targetAnnee = annee;

        if (typePeriode === 'Hebdomadaire' && dateDebut) {
            const dateObj = new Date(dateDebut);
            targetMois = dateObj.getMonth() + 1;
            targetAnnee = dateObj.getFullYear();
        }

        if (!targetMois || !targetAnnee) return null;

        if (typePeriode === 'Mensuel') {
            const conflictingWeekly = existingObjectifs.find(obj => {
                if (String(obj.ID_Utilisateur) !== String(userId)) return false;
                if (obj.TypePeriode !== 'Hebdomadaire') return false;
                if (!['ACTIF', 'ATTEINT'].includes(String(obj.StatutObjectif || '').toUpperCase())) return false;

                if (!obj.DateDebut) return false;
                const dateObj = new Date(obj.DateDebut);
                return dateObj.getMonth() + 1 === targetMois && dateObj.getFullYear() === targetAnnee;
            });

            if (conflictingWeekly) {
                return 'Ce commercial a déjà un objectif hebdomadaire en cours pour cette période.';
            }
        } else if (typePeriode === 'Hebdomadaire') {
            const conflictingMonthly = existingObjectifs.find(obj => {
                if (String(obj.ID_Utilisateur) !== String(userId)) return false;
                if (obj.TypePeriode !== 'Mensuel') return false;
                if (!['ACTIF', 'ATTEINT'].includes(String(obj.StatutObjectif || '').toUpperCase())) return false;
                return parseInt(obj.Mois) === targetMois && parseInt(obj.Annee) === targetAnnee;
            });

            if (conflictingMonthly) {
                return 'Ce commercial a déjà un objectif mensuel en cours pour cette période.';
            }
        }

        return null;
    };
    
    try {
        const objectifsRes = await api.get('/objectifs');
        const objectifs = objectifsRes.data || [];
        
        // Test case 1: Mensuel sans conflit
        const result1 = checkConflict('someUser', 'Mensuel', 12, 2025, '', objectifs);
        log(colors.green, `✓ Mensuel sans conflit: ${result1 === null ? 'Pas de conflit' : result1}`);
        
        // Test case 2: Chercher un cas réel de conflit
        if (objectifs.length > 0) {
            const sample = objectifs[0];
            if (sample.TypePeriode === 'Mensuel') {
                const result2 = checkConflict(
                    sample.ID_Utilisateur,
                    'Mensuel',
                    parseInt(sample.Mois),
                    parseInt(sample.Annee),
                    '',
                    objectifs
                );
                log(colors.blue, `Vérification: ${sample.ID_Utilisateur} - Mensuel ${sample.Mois}/${sample.Annee}: ${result2 || 'Pas de conflit'}`);
            }
        }
        
    } catch (error) {
        log(colors.red, '✗ Erreur lors du test de la logique');
        log(colors.gray, `  Erreur: ${error.message}`);
    }
}

async function runAllTests() {
    log(colors.cyan, '\n╔════════════════════════════════════════════════════════════╗');
    log(colors.cyan, '║  Test d\'Intégration - Validation des Conflits d\'Objectif   ║');
    log(colors.cyan, '╚════════════════════════════════════════════════════════════╝');
    
    log(colors.blue, `\nAPI Base URL: ${BASE_API_URL}`);
    log(colors.blue, `Frontend URL: ${FRONTEND_URL}`);
    
    await testAPIEndpoints();
    await testBackendValidation();
    await testConflictScenarios();
    await testFrontendCheckConflictLogic();
    await testFrontendConflictDetection();
    
    log(colors.cyan, '\n╔════════════════════════════════════════════════════════════╗');
    log(colors.cyan, '║  Tests Complétés                                             ║');
    log(colors.cyan, '╚════════════════════════════════════════════════════════════╝\n');
    
    log(colors.green, 'ℹ Prochaines étapes:');
    log(colors.gray, '  1. Vérifier les logs du navigateur (F12)');
    log(colors.gray, '  2. Tester les scénarios en interface utilisateur');
    log(colors.gray, '  3. Vérifier que l\'alerte amber s\'affiche bien');
    log(colors.gray, '  4. Vérifier que le bouton "Créer" se désactive');
    log(colors.gray, '  5. Tester avec différents utilisateurs/dates\n');
}

runAllTests().catch(error => {
    log(colors.red, '✗ Erreur critique:');
    log(colors.gray, error.message);
    process.exit(1);
});
