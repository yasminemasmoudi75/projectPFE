const { QueryTypes } = require('sequelize');
const { sequelize, Notification, User } = require('../models');

const getActiveAdminIds = async () => {
  const admins = await sequelize.query(`
      SELECT DISTINCT ui.USER_ID
      FROM UCS_USERINFO ui
      WHERE (ui.PROF_ID IN (1, 10, 2) OR ui.USER_IS_ADMIN = '1' OR ui.USER_ID = 14)
      AND ui.USER_ACTIVE = '1'
    `, { type: QueryTypes.SELECT });

  return (admins || [])
    .map((admin) => Number(admin.USER_ID))
    .filter((userId) => Number.isInteger(userId) && userId > 0);
};

const createNotifications = async (recipients, title, content, type = 'INFO') => {
  const recipientIds = [...new Set((recipients || [])
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0))];

  if (recipientIds.length === 0) {
    return [];
  }

  const notifications = [];
  for (const recipientId of recipientIds) {
    try {
      const notification = await Notification.create({
        RecipientID: recipientId,
        Title: title,
        Message: content,
        Type: type,
        CreatedAt: sequelize.fn('GETDATE'),
        IsRead: false
      });
      notifications.push(notification);
    } catch (insertErr) {
      console.error(`❌ [NOTIFY] ÉCHEC création pour UserID ${recipientId}:`, insertErr.message);
    }
  }

  return notifications;
};

const resolveCommercialRecipientIds = async (objectif, commercialUserId = null) => {
  const recipients = new Set();

  if (commercialUserId !== null && commercialUserId !== undefined && commercialUserId !== '') {
    const parsed = Number(commercialUserId);
    if (Number.isInteger(parsed) && parsed > 0) {
      recipients.add(parsed);
    }
  }

  const commercialGuid = String(objectif?.IdCont || '').trim();
  if (commercialGuid) {
    const user = await User.findOne({ where: { GUID: commercialGuid } });
    if (user?.UserID) {
      recipients.add(Number(user.UserID));
    }
  }

  return [...recipients];
};

/**
 * Notifie tous les administrateurs actifs via une notification système dédiée
 */
const notifyAdmins = async (subject, content) => {
  try {
    console.log('🔍 [NOTIFY] Recherche des administrateurs pour notification système...');
    const adminIds = await getActiveAdminIds();

    console.log(`📣 [NOTIFY] ${adminIds.length} administrateur(s) potentiel(s) trouvé(s):`, adminIds);

    if (!adminIds || adminIds.length === 0) {
      console.warn('⚠️ [NOTIFY] Aucun administrateur actif trouvé.');
      return;
    }

    await createNotifications(adminIds, subject, content, 'USER_REGISTER');
    console.log('🏁 [NOTIFY] Processus terminé.');
  } catch (error) {
    console.error('❌ Erreur lors de la notification des administrateurs:', error.message);
  }
};

const notifyObjectifAchieved = async ({ objectif, commercialUserId = null }) => {
  try {
    const adminIds = await getActiveAdminIds();
    const commercialIds = await resolveCommercialRecipientIds(objectif, commercialUserId);
    const recipientIds = [...new Set([...adminIds, ...commercialIds])];

    const typePeriode = String(objectif?.TypePeriode || '').toLowerCase();
    const periodeLabel = typePeriode === 'hebdomadaire'
      ? `semaine ${objectif?.Semaine || objectif?.Numsem || ''}`.trim()
      : `mois ${objectif?.Mois || ''}/${objectif?.Annee || ''}`.trim();

    const title = 'Objectif atteint';
    const message = `Objectif ${objectif?.TypeObjectif || 'commercial'} du ${periodeLabel} atteint !`;

    await createNotifications(recipientIds, title, message, 'SUCCESS');
  } catch (error) {
    console.error('❌ Erreur notification objectif atteint:', error.message);
  }
};

const notifyDocumentCreated = async (type, numero, tiers, createdByUserId) => {
  try {
    const adminIds = await getActiveAdminIds();
    const recipientIds = [...new Set([...adminIds])];
    
    // Si le créateur n'est pas un admin, on l'ajoute aussi à la liste (optionnel, selon besoin)
    if (createdByUserId) {
        recipientIds.push(Number(createdByUserId));
    }

    const typeLabels = {
      'DEV': 'Devis',
      'BCV': 'Bon de Commande',
      'FAV': 'Facture'
    };
    const label = typeLabels[type] || type;

    const title = `Nouveau ${label}`;
    const message = `${label} n°${numero} créé pour le client ${tiers?.Raisoc || tiers?.CodTiers}.`;

    await createNotifications(recipientIds, title, message, 'INFO');
  } catch (error) {
    console.error(`❌ Erreur notification création ${type}:`, error.message);
  }
};

module.exports = { notifyAdmins, notifyObjectifAchieved, createNotifications, notifyDocumentCreated };
