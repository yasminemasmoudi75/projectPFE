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

const notifyDocumentCreated = async (type, numero, tiers, createdByUserId, docExtra = {}) => {
  try {
    const typeLabels = {
      'DEV': 'Devis',
      'BCV': 'Bon de Commande',
      'FAV': 'Facture',
      'BLV': 'Bon de Livraison'
    };
    const label = typeLabels[type] || type;
    const libTiers = tiers?.Raisoc || tiers?.CodTiers || '';
    const totalTTC = docExtra.totalTTC ?? null;

    // 1. Notifier les admins (texte simple)
    const adminIds = await getActiveAdminIds();
    if (adminIds.length > 0) {
      const adminTitle = `Nouveau ${label}`;
      const adminMessage = `${label} n°${numero} créé pour le client ${libTiers}.`;
      await createNotifications(adminIds, adminTitle, adminMessage, 'INFO');
    }

    // 2. Notifier le client lié à ce Tiers (par son email)
    const clientEmail = tiers?.Email || tiers?.email;
    if (clientEmail) {
      const clientUser = await User.findOne({ where: { EmailPro: clientEmail } });
      if (clientUser?.UserID) {
        const clientTitle = `Nouveau ${label} créé pour vous`;
        const clientPayload = JSON.stringify({
          docType: type,
          numero,
          libTiers,
          totalTTC
        });
        await createNotifications([clientUser.UserID], clientTitle, clientPayload, 'DOC_CREATED');
        console.log(`🔔 [NOTIFY] Client UserID ${clientUser.UserID} notifié pour ${type} n°${numero}`);
      }
    }
  } catch (error) {
    console.error(`❌ Erreur notification création ${type}:`, error.message);
  }
};

/**
 * Envoie une demande de transformation aux admins.
 * Le message contient un JSON exploitable pour l'approbation.
 */
const notifyTransformRequest = async ({ sourceType, sourceNf, sourceGuid, targetType, codTiers, libTiers, totalTTC, requestedByUserId, requestedByName }) => {
  try {
    const adminIds = await getActiveAdminIds();
    if (!adminIds.length) return;

    const targetLabel = targetType === 'FAC' ? 'Facture' : 'Bon de Livraison';
    const sourceLabel = sourceType === 'DEV' ? 'Devis' : 'Bon de Commande';

    const title = `Demande de transformation ${sourceLabel} → ${targetLabel}`;
    const message = JSON.stringify({
      _type: 'TRANSFORM_REQUEST',
      sourceType,
      sourceNf,
      sourceGuid,
      targetType,
      codTiers,
      libTiers,
      totalTTC,
      requestedByUserId,
      requestedByName
    });

    await createNotifications(adminIds, title, message, 'TRANSFORM_REQUEST');
  } catch (err) {
    console.error('❌ [NOTIFY] notifyTransformRequest:', err.message);
  }
};

/**
 * Notifie le commercial que sa demande de transformation a été traitée.
 */
const notifyTransformDecision = async ({ recipientId, sourceType, sourceNf, targetType, decision, docGuid }) => {
  try {
    const targetLabel = targetType === 'FAC' ? 'Facture' : targetType === 'BL' ? 'Bon de Livraison' : 'BCV';
    const sourceLabel = sourceType === 'DEV' ? 'Devis' : 'Bon de Commande';
    const approved = decision === 'APPROVED';

    const title = approved
      ? `Transformation approuvée — ${sourceLabel} n°${sourceNf}`
      : `Transformation refusée — ${sourceLabel} n°${sourceNf}`;

    let msg, type;
    if (approved && docGuid) {
      msg = JSON.stringify({ _type: 'TRANSFORM_DECISION', approved: true, docGuid, targetType, sourceType, sourceNf });
      type = 'TRANSFORM_DECISION';
    } else {
      msg = approved
        ? `Votre demande de transformation du ${sourceLabel} n°${sourceNf} vers ${targetLabel} a été approuvée et effectuée.`
        : `Votre demande de transformation du ${sourceLabel} n°${sourceNf} vers ${targetLabel} a été refusée par l'administrateur.`;
      type = approved ? 'SUCCESS' : 'WARNING';
    }

    await createNotifications([recipientId], title, msg, type);
  } catch (err) {
    console.error('❌ [NOTIFY] notifyTransformDecision:', err.message);
  }
};

module.exports = { notifyAdmins, notifyObjectifAchieved, createNotifications, notifyDocumentCreated, notifyTransformRequest, notifyTransformDecision, getActiveAdminIds };
