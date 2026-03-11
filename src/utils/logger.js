const fs = require('fs');
const path = require('path');

/**
 * Système de logs d'audit centralisé
 * Permet de tracer les actions sensibles pour la sécurité et la conformité.
 */

// Chemin du fichier de logs (dans un dossier 'logs' à la racine du backend)
const logDirectory = path.join(__dirname, '../../logs');
const logFilePath = path.join(logDirectory, 'audit.log');

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}

/**
 * Enregistre une action utilisateur
 * @param {number} userId - ID de l'utilisateur qui fait l'action
 * @param {string} action - Type d'action (CREATE, READ, UPDATE, DELETE, LOGIN, ETC)
 * @param {string} entity - Entité concernée (Tiers, User, Devis...)
 * @param {string|number} entityId - ID de l'entité concernée
 * @param {string} details - Détails supplémentaires (facultatif)
 */
const logAction = async (userId, action, entity, entityId, details = '') => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] USER:${userId} | ACTION:${action} | ENTITY:${entity} ID:${entityId} | DETAILS:${details}\n`;

    // 1. Console (pour le dev)
    console.log(`📝 [AUDIT] ${logEntry.trim()}`);

    // 2. Fichier (pour la persistance simple)
    // Dans un vrai projet, on écrirait dans une table 'AuditLogs' en base de données
    try {
        await fs.promises.appendFile(logFilePath, logEntry);
    } catch (err) {
        console.error('❌ Erreur écriture log:', err);
    }
};

module.exports = { logAction };
