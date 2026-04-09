const schedule = require('node-schedule');
const gmailService = require('../services/gmailService');
const { GmailOAuthTokens } = require('../models');

/**
 * ═══════════════════════════════════════════════════════════════════════
 * CRON JOB: Synchronisation Gmail → Base de données (OAuth 2.0 multi-user)
 * Runs every 5 minutes
 * ═══════════════════════════════════════════════════════════════════════
 */

let syncJob = null;

/**
 * Démarrer le cron job
 */
const startGmailSyncJob = () => {
  try {
    // Exécuter toutes les 5 minutes
    syncJob = schedule.scheduleJob('*/5 * * * *', async () => {
      try {
        console.log('\n🔄 ════════════════════════════════════════════════════════════');
        console.log(`📧 Sync Gmail automatique - ${new Date().toLocaleString()}`);
        console.log('🔄 ════════════════════════════════════════════════════════════\n');

        // Récupérer tous les utilisateurs avec OAuth autorisé et actif
        const authorizedUsers = await GmailOAuthTokens.findAll({
          where: { IsActive: 1 }
        });

        if (authorizedUsers.length === 0) {
          console.log('ℹ️ Aucun utilisateur autorisé pour Gmail. Cron job pause.');
          return { totalSynced: 0, totalFailed: 0 };
        }

        console.log(`🔄 Syncing pour ${authorizedUsers.length} utilisateur(s) autorisé(s)`);

        let totalSynced = 0;
        let totalFailed = 0;

        // Itérer sur chaque utilisateur autorisé
        for (const userToken of authorizedUsers) {
          try {
            console.log(`\n🔄 Syncing UserID: ${userToken.UserID} (${userToken.GmailEmail})`);
            const result = await gmailService.syncEmailsFromGmail(userToken.UserID);
            totalSynced += result.synced;
            totalFailed += result.failed;
          } catch (error) {
            console.error(`❌ Erreur pour UserID ${userToken.UserID}:`, error.message);
            totalFailed++;
          }
        }

        console.log(`\n✅ Synchronisation complétée: ${totalSynced} email(s) au total`);
        if (totalFailed > 0) {
          console.log(`⚠️ ${totalFailed} erreur(s) total`);
        }

      } catch (error) {
        console.error('❌ Erreur lors de la synchronisation Gmail:', error.message);
      }
    });

    console.log('✅ Gmail Sync Cron Job démarré (toutes les 5 minutes, multi-user OAuth)');
    return syncJob;
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du Cron Job:', error.message);
    throw error;
  }
};

/**
 * Arrêter le cron job
 */
const stopGmailSyncJob = () => {
  if (syncJob) {
    syncJob.cancel();
    console.log('⛔ Gmail Sync Cron Job arrêté');
    return true;
  }
  return false;
};

/**
 * Obtenir le statut du cron job
 */
const getGmailSyncJobStatus = () => {
  return {
    running: syncJob !== null,
    nextExecution: syncJob ? syncJob.nextInvocation() : null
  };
};

/**
 * Exécuter manuellement la synchronisation (pour testing)
 */
const runGmailSyncManually = async (userId = null) => {
  try {
    if (userId) {
      // Sync pour un utilisateur spécifique
      console.log(`🔄 Synchronisation Gmail manuelle pour UserID: ${userId}`);
      const result = await gmailService.syncEmailsFromGmail(userId);
      return result;
    } else {
      // Sync pour tous les utilisateurs autorisés
      console.log('🔄 Synchronisation Gmail manuelle pour tous les utilisateurs...');
      const authorizedUsers = await GmailOAuthTokens.findAll({
        where: { IsActive: 1 }
      });

      if (authorizedUsers.length === 0) {
        console.log('ℹ️ Aucun utilisateur autorisé');
        return { totalSynced: 0, totalFailed: 0 };
      }

      let totalSynced = 0;
      let totalFailed = 0;

      for (const userToken of authorizedUsers) {
        try {
          const result = await gmailService.syncEmailsFromGmail(userToken.UserID);
          totalSynced += result.synced;
          totalFailed += result.failed;
        } catch (error) {
          console.error(`❌ Erreur pour UserID ${userToken.UserID}:`, error.message);
          totalFailed++;
        }
      }

      return { totalSynced, totalFailed };
    }
  } catch (error) {
    console.error('❌ Erreur lors de la sync manuelle:', error.message);
    throw error;
  }
};

module.exports = {
  startGmailSyncJob,
  stopGmailSyncJob,
  getGmailSyncJobStatus,
  runGmailSyncManually
};
