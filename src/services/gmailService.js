const { getGmailClientForUser } = require('./gmailAuthService');
const { Message, User, GmailOAuthTokens, sequelize } = require('../models');

const formatDateForSql = (date) => {
  if (!date || Number.isNaN(new Date(date).getTime())) {
    return null;
  }

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Service Gmail pour envoyer/recevoir et synchroniser les emails
 * Adapté pour OAuth 2.0 (par utilisateur)
 */

/**
 * Envoyer un email via Gmail API (OAuth 2.0)
 */
const sendEmail = async (userId, to, subject, messageText, attachment = null, cc = null, bcc = null) => {
  try {
    console.log(`📤 Envoi email à: ${to} par UserID: ${userId}`);

    // Obtenir le client Gmail pour cet utilisateur
    const gmail = await getGmailClientForUser(userId);

    // Récupérer l'email de l'utilisateur depuis la BD
    const user = await User.findByPk(userId);
    const fromEmail = user?.EmailPro || user?.LoginName || 'crmnexus11@gmail.com';
    console.log(`📧 Email FROM: ${fromEmail}`);

    const boundary = `boundary_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    // Créer le message email
    const emailLines = [
      `From: ${fromEmail}`,
      `To: ${to}`,
      subject ? `Subject: ${subject}` : 'Subject: Message from Nexus CRM',
      'MIME-Version: 1.0',
    ];

    if (cc) {
      emailLines.push(`Cc: ${cc}`);
    }

    if (bcc) {
      emailLines.push(`Bcc: ${bcc}`);
    }

    if (attachment && attachment.buffer && attachment.buffer.length) {
      emailLines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
      emailLines.push('');
      emailLines.push(`--${boundary}`);
      emailLines.push('Content-Type: text/plain; charset="UTF-8"');
      emailLines.push('Content-Transfer-Encoding: 7bit');
      emailLines.push('');
      emailLines.push(messageText);
      emailLines.push('');
      emailLines.push(`--${boundary}`);
      emailLines.push(`Content-Type: ${attachment.mimetype || 'application/octet-stream'}; name="${attachment.originalname || 'piece-jointe'}"`);
      emailLines.push('Content-Transfer-Encoding: base64');
      emailLines.push(`Content-Disposition: attachment; filename="${attachment.originalname || 'piece-jointe'}"`);
      emailLines.push('');
      const attachmentBase64 = attachment.buffer.toString('base64').match(/.{1,76}/g)?.join('\r\n') || '';
      emailLines.push(attachmentBase64);
      emailLines.push(`--${boundary}--`);
    } else {
      emailLines.push('Content-Type: text/plain; charset="UTF-8"');
      emailLines.push('');
      emailLines.push(messageText);
    }

    const email = emailLines.join('\r\n');

    // Encoder en Base64
    const encodedMessage = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    console.log(`✅ Email envoyé avec succès! ID: ${response.data.id}`);
    return {
      success: true,
      messageId: response.data.id,
      to,
      subject
    };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error.message);
    throw error;
  }
};

const parseEmailAddress = (value = '') => {
  const match = String(value).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].toLowerCase() : null;
};

const findInternalUserByEmail = async (email) => {
  if (!email) {
    return null;
  }

  return User.findOne({
    where: {
      EmailPro: email,
    },
  });
};

const getMessageBodyFromPayload = (payload) => {
  if (!payload) {
    return '';
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    const textPart = payload.parts.find((part) => part.mimeType === 'text/plain' && part.body?.data);
    if (textPart?.body?.data) {
      return Buffer.from(textPart.body.data, 'base64').toString('utf-8');
    }

    const htmlPart = payload.parts.find((part) => part.mimeType === 'text/html' && part.body?.data);
    if (htmlPart?.body?.data) {
      return Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
    }
  }

  if (payload.body && payload.body.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }

  return '';
};

const fetchMessagesByQuery = async (gmail, query, maxResults = 100) => {
  const collected = [];
  let pageToken = null;

  do {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults,
      pageToken: pageToken || undefined,
      includeSpamTrash: false,
    });

    const messages = response.data.messages || [];
    collected.push(...messages.map((message) => message.id));
    pageToken = response.data.nextPageToken || null;
  } while (pageToken);

  return [...new Set(collected)];
};

const fetchIncrementalEmails = async (userId, userEmail, currentHistoryId, lastHistoryId) => {
  try {
    const gmail = await getGmailClientForUser(userId);

    if (!lastHistoryId) {
      console.log(`ℹ️ Pas de LastHistoryId pour UserID: ${userId}. Bootstrap initial sur 30 jours.`);
      const bootstrapMessageIds = await fetchMessagesByQuery(gmail, 'newer_than:30d in:anywhere');
      return {
        gmail,
        bootstrapMessageIds,
        historyMessages: [],
      };
    }

    let historyMessages = [];
    let pageToken = null;

    do {
      const historyResponse = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: lastHistoryId,
        historyTypes: ['messageAdded'],
        pageToken: pageToken || undefined,
      });

      const history = historyResponse.data.history || [];
      for (const item of history) {
        if (item.messagesAdded && Array.isArray(item.messagesAdded)) {
          for (const added of item.messagesAdded) {
            if (added.message?.id) {
              historyMessages.push(added.message.id);
            }
          }
        }
      }

      pageToken = historyResponse.data.nextPageToken || null;
    } while (pageToken);

    return {
      gmail,
      bootstrapMessageIds: [],
      historyMessages: [...new Set(historyMessages)],
    };
  } catch (error) {
    const statusCode = Number(error?.code || error?.response?.status || error?.statusCode);

    if (statusCode === 404) {
      console.warn(`⚠️ Cursor Gmail invalide pour UserID: ${userId}, fallback bootstrap 30 jours.`);
      const gmail = await getGmailClientForUser(userId);
      const bootstrapMessageIds = await fetchMessagesByQuery(gmail, 'newer_than:30d in:anywhere');
      return {
        gmail,
        bootstrapMessageIds,
        historyMessages: [],
      };
    }

    console.error('❌ Erreur lors de la récupération incrémentale Gmail:', error.message);
    throw error;
  }
};

/**
 * Récupérer les emails Gmail nouveaux depuis le dernier curseur pour un utilisateur
 */
const syncEmailsFromGmail = async (userId) => {
  try {
    console.log(`🔄 Synchronisation Gmail → BD pour UserID: ${userId}`);

    const tokenRecord = await GmailOAuthTokens.findOne({
      where: { UserID: userId, IsActive: 1 },
    });

    if (!tokenRecord) {
      throw new Error(`Aucun token Gmail actif pour UserID: ${userId}`);
    }

    const user = await User.findByPk(userId);
    const gmailEmail = tokenRecord.GmailEmail || user?.EmailPro || null;

    const gmail = await getGmailClientForUser(userId);
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const currentHistoryId = profile.data.historyId ? String(profile.data.historyId) : null;
    const currentGmailEmail = profile.data.emailAddress || gmailEmail;

    const lastHistoryId = tokenRecord.LastHistoryId ? String(tokenRecord.LastHistoryId) : null;

    const { bootstrapMessageIds, historyMessages } = await fetchIncrementalEmails(
      userId,
      currentGmailEmail,
      currentHistoryId,
      lastHistoryId
    );

    const messageIds = [...bootstrapMessageIds, ...historyMessages];

    if (messageIds.length === 0) {
      await tokenRecord.update({
        GmailEmail: currentGmailEmail,
        LastHistoryId: currentHistoryId || tokenRecord.LastHistoryId,
        LastSyncAt: new Date(),
        UpdatedAt: new Date(),
      });

      console.log('ℹ️ Aucun nouvel email à synchroniser');
      return { synced: 0, failed: 0, skipped: 0 };
    }

    console.log(`📬 ${messageIds.length} message(s) Gmail détecté(s) pour synchro`);

    let synced = 0;
    let failed = 0;
    let skipped = 0;

    for (const gmailMessageId of messageIds) {
      try {
        const existing = await Message.findOne({
          where: { GmailMessageID: gmailMessageId },
        });

        if (existing) {
          skipped++;
          continue;
        }

        const messageDetail = await gmail.users.messages.get({
          userId: 'me',
          id: gmailMessageId,
          format: 'full'
        });

        const headers = messageDetail.data.payload.headers;
        const from = headers.find((h) => h.name === 'From')?.value || 'Unknown';
        const to = headers.find((h) => h.name === 'To')?.value || 'Unknown';
        const subject = headers.find((h) => h.name === 'Subject')?.value || '(No Subject)';
        const date = headers.find((h) => h.name === 'Date')?.value || new Date().toISOString();

        const fromEmail = parseEmailAddress(from);
        const toEmail = parseEmailAddress(to);
        const isOutgoing = !!currentGmailEmail && fromEmail === currentGmailEmail.toLowerCase();

        const body = getMessageBodyFromPayload(messageDetail.data.payload);
        const isUnread = Array.isArray(messageDetail.data.labelIds)
          ? messageDetail.data.labelIds.includes('UNREAD')
          : false;
        const sendingDateSql = formatDateForSql(new Date(date));

        let senderID = null;
        let recipientID = null;

        if (isOutgoing) {
          senderID = userId;
          if (toEmail) {
            const recipientUser = await findInternalUserByEmail(toEmail);
            recipientID = recipientUser?.UserID || null;
          }
        } else {
          recipientID = userId;
          if (fromEmail) {
            const senderUser = await findInternalUserByEmail(fromEmail);
            senderID = senderUser?.UserID || null;
          }
        }

        await Message.create({
          SenderID: senderID,
          RecipientID: recipientID,
          Subject: subject,
          MessageText: body,
          MessageUnicodeText: body,
          SendingDate: sendingDateSql || sequelize.literal('GETDATE()'),
          Delivered: true,
          StatusRead: !isUnread,
          GmailMessageID: gmailMessageId,
          SyncedWithGmail: true,
        });

        synced++;
      } catch (err) {
        console.error(`❌ Erreur lors de la sync du message ${gmailMessageId}:`, err.message);
        failed++;
      }
    }

    await tokenRecord.update({
      GmailEmail: currentGmailEmail,
      LastHistoryId: currentHistoryId || tokenRecord.LastHistoryId,
      LastSyncAt: new Date(),
      UpdatedAt: new Date(),
    });

    console.log(`✅ Synchronisation complétée: ${synced} synced, ${skipped} skipped, ${failed} failed`);
    return { synced, skipped, failed };
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des emails:', error.message);
    throw error;
  }
};

/**
 * Marquer un email comme lu dans Gmail
 */
const markEmailAsRead = async (userId, gmailMessageId) => {
  try {
    const gmail = await getGmailClientForUser(userId);
    
    await gmail.users.messages.modify({
      userId: 'me',
      id: gmailMessageId,
      requestBody: {
        removeLabelIds: ['UNREAD']
      }
    });

    console.log(`✅ Email ${gmailMessageId} marqué comme lu`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors du marquage comme lu:', error.message);
    throw error;
  }
};

/**
 * Archive un email dans Gmail
 */
const archiveEmail = async (userId, gmailMessageId) => {
  try {
    const gmail = await getGmailClientForUser(userId);
    
    await gmail.users.messages.modify({
      userId: 'me',
      id: gmailMessageId,
      requestBody: {
        removeLabelIds: ['INBOX']
      }
    });

    console.log(`✅ Email ${gmailMessageId} archivé`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'archivage:', error.message);
    throw error;
  }
};

module.exports = {
  sendEmail,
  syncEmailsFromGmail,
  markEmailAsRead,
  archiveEmail
};
