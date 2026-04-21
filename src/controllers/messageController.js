const { Message, sequelize } = require('../models');
const { Op } = require('sequelize');
const gmailService = require('../services/gmailService');
const { User } = require('../models');

/**
 * ═══════════════════════════════════════════════════════════════════════
 * MESSAGE CONTROLLER - Gmail Integration Complete
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Format une date JavaScript pour SQL Server (sans timezone)
 * SQL Server déteste le format ISO avec timezone (+00:00)
 */
function formatDateForSQL(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Récupérer tous les messages reçus et envoyés (Inbox)
 * GET /api/messages/inbox?page=1&limit=20
 */
exports.getInbox = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    console.log(`📨 Fetch inbox pour UserID: ${req.user.UserID}, page ${page}`);

    // Récupérer les messages envoyés ET reçus
    const { count, rows } = await Message.findAndCountAll({
      attributes: { exclude: ['MessageData'] },
      where: {
        [Op.or]: [
          { RecipientID: req.user.UserID },      // Messages reçus
          { SenderID: req.user.UserID }          // Messages envoyés
        ]
      },
      order: [['SendingDate', 'DESC']],
      limit,
      offset,
      include: [
        { 
          association: 'sender', 
          attributes: ['UserID', 'USER_NAME', 'EmailPro'],
          required: false
        },
        { 
          association: 'recipient', 
          attributes: ['UserID', 'USER_NAME', 'EmailPro'],
          required: false
        }
      ]
    });

    console.log(`✅ ${rows.length} messages récupérés`);

    res.status(200).json({
      status: 'success',
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error(`❌ Erreur getInbox:`, error.message);
    next(error);
  }
};

/**
 * Récupérer un message par ID
 * GET /api/messages/:id
 */
exports.getMessageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await Message.findByPk(id, {
      attributes: { exclude: ['MessageData'] },
      include: [
        { association: 'sender', attributes: ['UserID', 'USER_NAME', 'EmailPro'] },
        { association: 'recipient', attributes: ['UserID', 'USER_NAME', 'EmailPro'] }
      ]
    });

    if (!message) {
      return res.status(404).json({ status: 'error', message: 'Message non trouvé' });
    }

    res.status(200).json({ status: 'success', data: message });
  } catch (error) {
    next(error);
  }
};

/**
 * Envoyer un message via Gmail
 * POST /api/messages/send
 * Body: { recipientID, recipientEmail, subject, messageText, priority }
 */
/**
 * Envoyer un message (LOCAL + optionnellement via Gmail)
 * POST /api/messages/send
 * 
 * Body: { 
 *   recipientID: number,          // ID utilisateur destinataire
 *   recipientEmail: string,        // Email destinataire
 *   subject: string,               // Sujet du message
 *   messageText: string,           // Corps du message
 *   priority: number (optional)    // Priorité: 1=normal, 2=haut, 3=urgent
 * }
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { recipientID, recipientEmail, subject, messageText, priority = 1 } = req.body;
    const attachment = req.file || null;

    // ═════ VALIDATION ═════
    if (!recipientEmail || !subject || !messageText) {
      return res.status(400).json({
        status: 'error',
        message: 'recipientEmail, subject et messageText sont obligatoires'
      });
    }

    console.log(`📧 ════════════════════════════════════════════════════════════`);
    console.log(`📧 Message envoyé par: ${req.user.EmailPro || req.user.LoginName} (UserID: ${req.user.UserID})`);
    console.log(`📧 Destinataire: ${recipientEmail}`);
    console.log(`📧 Subject: ${subject}`);
    console.log(`📧 ════════════════════════════════════════════════════════════`);

    // ═════ STEP 0: LOOKUP RECIPIENT ID FROM EMAIL ═════
    let finalRecipientID = recipientID;
    if (!finalRecipientID) {
      try {
        const recipientUser = await User.findOne({
          where: {
            EmailPro: recipientEmail  // ✅ The correct field name
          }
        });
        if (recipientUser) {
          finalRecipientID = recipientUser.UserID;
          console.log(`✅ RecipientID trouvé: ${finalRecipientID} pour email: ${recipientEmail}`);
        } else {
          console.warn(`⚠️ Utilisateur non trouvé pour email: ${recipientEmail}`);
        }
      } catch (lookupError) {
        console.warn(`⚠️ Erreur lors lookup recipient: ${lookupError.message}`);
      }
    }

    // ═════ STEP 1: CRÉER LE MESSAGE EN BD LOCAL ═════
    let message;
    try {
      // Essayer de créer avec toutes les colonnes (y compris les nouvelles)
      // Utiliser sequelize.literal() pour GETDATE() qui évite les problèmes de format
      message = await Message.create({
        SenderID: req.user.UserID,
        RecipientID: finalRecipientID || null,
        MessageText: messageText,
        Subject: subject,
        SendingDate: sequelize.literal('GETDATE()'),  // ✅ Laisser SQL Server générer la date
        Delivered: false,
        StatusRead: false,
        Priority: priority,
        SyncedWithGmail: false,
        ...(attachment && {
          MessageData: attachment.buffer,
          MessageDataSize: attachment.size,
          FileName: attachment.originalname,
          FileMimeType: attachment.mimetype
        })
      });

      console.log(`✅ Message créé en BD (ID: ${message.ID})`);
    } catch (createError) {
      // Si erreur (colonnes manquantes), créer sans elles
      console.warn(`⚠️ Erreur colonnes avancées: ${createError.message}`);
      
      message = await Message.create({
        SenderID: req.user.UserID,
        RecipientID: finalRecipientID || null,
        MessageText: messageText,
        SendingDate: sequelize.literal('GETDATE()'),  // ✅ Laisser SQL Server générer la date
        Delivered: false,
        ...(attachment && {
          MessageData: attachment.buffer,
          MessageDataSize: attachment.size,
          FileName: attachment.originalname,
          FileMimeType: attachment.mimetype
        })
      });

      console.log(`✅ Message créé en BD (colonnes basiques, ID: ${message.ID})`);
    }

    // ═════ STEP 2: ESSAYER GMAIL (optionnel) ═════
    let gmailSynced = false;
    try {
      const gmailResult = await gmailService.sendEmail(
        req.user.UserID,
        recipientEmail,
        subject,
        messageText,
        attachment
      );

      // Mettre à jour le message avec l'ID Gmail
      try {
        await message.update({
          GmailMessageID: gmailResult.messageId,
          SyncedWithGmail: true
        });
        gmailSynced = true;
        console.log(`✅ Message synced avec Gmail (ID: ${gmailResult.messageId})`);
      } catch (updateError) {
        console.warn(`⚠️ Erreur lors mise à jour Gmail fields: ${updateError.message}`);
        // Pas grave, le message est toujours créé localement
      }
    } catch (gmailError) {
      // Gmail non disponible ou utilisateur pas autorisé
      console.warn(`⚠️ Gmail non disponible: ${gmailError.message}`);
      console.warn(`⏩ Continuant sans Gmail sync...`);
    }

    // ═════ STEP 3: RETOURNER SUCCÈS ═════
    // Recharger le message avec les associations (sender/recipient) pour match getInbox structure
    const fullMessage = await Message.findByPk(message.ID, {
      include: [
        { 
          association: 'sender', 
          attributes: ['UserID', 'USER_NAME', 'EmailPro'],
          required: false
        },
        { 
          association: 'recipient', 
          attributes: ['UserID', 'USER_NAME', 'EmailPro'],
          required: false
        }
      ]
    });

    res.status(201).json({
      status: 'success',
      message: gmailSynced 
        ? 'Message envoyé (local + Gmail)' 
        : 'Message créé (local)',
      data: fullMessage
    });

  } catch (error) {
    console.error(`❌ Erreur sendMessage:`, error.message);
    next(error);
  }
};

/**
 * Télécharger la pièce jointe d'un message
 * GET /api/messages/:id/attachment
 */
exports.downloadAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await Message.findByPk(id, {
      attributes: ['ID', 'MessageData', 'MessageDataSize', 'FileName', 'FileMimeType']
    });

    if (!message) {
      return res.status(404).json({ status: 'error', message: 'Message non trouvé' });
    }

    if (!message.MessageData || !message.MessageDataSize) {
      return res.status(404).json({ status: 'error', message: 'Aucune pièce jointe disponible pour ce message' });
    }

    const attachmentBuffer = Buffer.isBuffer(message.MessageData)
      ? message.MessageData
      : Buffer.from(message.MessageData);

    const mimeType = message.FileMimeType || 'application/octet-stream';
    const fileName = message.FileName || `message-${id}-piece-jointe`;

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', attachmentBuffer.length);

    return res.send(attachmentBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Marquer un message comme lu
 * PATCH /api/messages/:id/mark-read
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`📖 Marquer message ${id} comme lu`);

    const message = await Message.findByPk(id);
    if (!message) {
      return res.status(404).json({ status: 'error', message: 'Message non trouvé' });
    }

    // Marquer comme lu en BD
    try {
      await message.update({ StatusRead: 1 });
    } catch (markError) {
      // Si colonnes n'existent pas, utiliser les colonnes basiques
      console.warn(`⚠️ Erreur StatusRead: ${markError.message}`);
      // Continuer quand même
    }

    // Essayer marquer comme lu dans Gmail
    if (message.GmailMessageID) {
      try {
        await gmailService.markEmailAsRead(req.user.UserID, message.GmailMessageID);
        console.log(`✅ Message marqué comme lu (Gmail + Local)`);
      } catch (gmailErr) {
        console.warn(`⚠️ Erreur Gmail mark-read: ${gmailErr.message}`);
      }
    } else {
      console.log(`✅ Message marqué comme lu (Local)`);
    }

    res.json({
      status: 'success',
      message: 'Message marqué comme lu',
      data: { ID: id, IsRead: true }
    });
  } catch (error) {
    console.error(`❌ Erreur markAsRead:`, error.message);
    next(error);
  }
};

/**
 * Marquer un message comme non lu
 * PATCH /api/messages/:id/mark-unread
 */
exports.markAsUnread = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`📬 Marquer message ${id} comme non lu`);

    const message = await Message.findByPk(id);
    if (!message) {
      return res.status(404).json({ status: 'error', message: 'Message non trouvé' });
    }

    // Marquer comme non lu
    try {
      await message.update({ StatusRead: 0 });
    } catch (markError) {
      console.warn(`⚠️ Erreur StatusRead: ${markError.message}`);
    }

    console.log(`✅ Message marqué comme non lu`);

    res.json({
      status: 'success',
      message: 'Message marqué comme non lu',
      data: { ID: id, IsRead: false }
    });
  } catch (error) {
    console.error(`❌ Erreur markAsUnread:`, error.message);
    next(error);
  }
};

/**
 * Supprimer un message
 * DELETE /api/messages/:id
 */
exports.deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await Message.findByPk(id);
    if (!message) {
      return res.status(404).json({ status: 'error', message: 'Message non trouvé' });
    }

    // Archiver dans Gmail
    if (message.GmailMessageID) {
      try {
        const userId = message.RecipientID || req.user.UserID;
        await gmailService.archiveEmail(userId, message.GmailMessageID);
      } catch (gmailErr) {
        console.warn('⚠️ Erreur lors de l\'archivage Gmail:', gmailErr.message);
      }
    }

    // Supprimer de la DB
    await message.destroy();

    res.json({
      status: 'success',
      message: 'Message supprimé'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Synchroniser les emails Gmail → Base de données
 * POST /api/messages/sync-gmail
 */
exports.syncGmailMessages = async (req, res, next) => {
  try {
    console.log('🔄 Sync Gmail demandé manuellement par UserID:', req.user.UserID);

    const result = await gmailService.syncEmailsFromGmail(req.user.UserID);

    res.json({
      status: 'success',
      message: 'Synchronisation complétée',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer les statistiques
 * GET /api/messages/stats
 */
exports.getStats = async (req, res, next) => {
  try {
    const totalMessages = await Message.count();
    const unreadMessages = await Message.count({
      where: { StatusRead: 0 }
    });
    const sentMessages = await Message.count({
      where: { SenderID: req.user.UserID }
    });
    const receivedMessages = await Message.count({
      where: { RecipientID: req.user.UserID }
    });

    res.json({
      status: 'success',
      data: {
        totalMessages,
        unreadMessages,
        sentMessages,
        receivedMessages
      }
    });
  } catch (error) {
    next(error);
  }
};

