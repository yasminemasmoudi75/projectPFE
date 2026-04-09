const { getGmailClientForUser } = require('./gmailAuthService');
const { Message, User } = require('../models');

/**
 * Service Gmail pour envoyer/recevoir et synchroniser les emails
 * Adapté pour OAuth 2.0 (par utilisateur)
 */

/**
 * Envoyer un email via Gmail API (OAuth 2.0)
 */
const sendEmail = async (userId, to, subject, messageText, cc = null, bcc = null) => {
  try {
    console.log(`📤 Envoi email à: ${to} par UserID: ${userId}`);

    // Obtenir le client Gmail pour cet utilisateur
    const gmail = await getGmailClientForUser(userId);

    // Récupérer l'email de l'utilisateur depuis la BD
    const user = await User.findByPk(userId);
    const fromEmail = user?.EmailPro || user?.LoginName || 'crmnexus11@gmail.com';
    console.log(`📧 Email FROM: ${fromEmail}`);

    // Créer le message email
    const emailLines = [
      `From: ${fromEmail}`,
      `To: ${to}`,
      subject ? `Subject: ${subject}` : 'Subject: Message from Nexus CRM',
      cc ? `Cc: ${cc}` : '',
      bcc ? `Bcc: ${bcc}` : '',
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
      '',
      messageText
    ];

    const email = emailLines
      .filter(line => line !== '')
      .join('\r\n')
      .trim();

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

/**
 * Récupérer les emails non lus depuis Gmail pour un utilisateur
 */
const fetchUnreadEmails = async (userId, maxResults = 10) => {
  try {
    console.log(`🔄 Récupération des emails non lus pour UserID: ${userId}`);

    const gmail = await getGmailClientForUser(userId);

    // Chercher les emails non lus
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults: maxResults
    });

    if (!listResponse.data.messages || listResponse.data.messages.length === 0) {
      console.log('ℹ️ Aucun email non lu trouvé');
      return [];
    }

    console.log(`📬 ${listResponse.data.messages.length} email(s) non lu(s) trouvé(s)`);

    // Récupérer les détails de chaque email
    const emails = [];
    for (const message of listResponse.data.messages) {
      try {
        const messageDetail = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });

        const headers = messageDetail.data.payload.headers;
        const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
        const to = headers.find(h => h.name === 'To')?.value || 'Unknown';
        const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
        const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString();

        // Extraire le contenu
        let body = '';
        if (messageDetail.data.payload.parts) {
          const textPart = messageDetail.data.payload.parts.find(p => p.mimeType === 'text/plain');
          if (textPart && textPart.body.data) {
            body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
          }
        } else if (messageDetail.data.payload.body && messageDetail.data.payload.body.data) {
          body = Buffer.from(messageDetail.data.payload.body.data, 'base64').toString('utf-8');
        }

        emails.push({
          gmailMessageId: message.id,
          from,
          to,
          subject,
          messageText: body,
          sendingDate: new Date(date),
          statusRead: false
        });

      } catch (err) {
        console.error(`⚠️ Erreur lors de la récupération du message ${message.id}:`, err.message);
      }
    }

    console.log(`✅ ${emails.length} email(s) récupéré(s) avec succès`);
    return emails;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des emails:', error.message);
    throw error;
  }
};

/**
 * Synchroniser les emails Gmail → Base de données pour un utilisateur
 */
const syncEmailsFromGmail = async (userId) => {
  try {
    console.log(`🔄 Synchronisation Gmail → BD pour UserID: ${userId}`);

    // Récupérer les emails non lus
    const emails = await fetchUnreadEmails(userId, 20);

    if (emails.length === 0) {
      console.log('ℹ️ Aucun nouvel email à synchroniser');
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;

    for (const email of emails) {
      try {
        // Vérifier si l'email existe déjà dans la DB
        const existing = await Message.findOne({
          where: { GmailMessageID: email.gmailMessageId }
        });

        if (existing) {
          console.log(`⚠️ Email ${email.gmailMessageId} existe déjà`);
          continue;
        }

        // Créer le message dans la DB
        await Message.create({
          Subject: email.subject,
          MessageText: email.messageText,
          SendingDate: email.sendingDate,
          StatusRead: email.statusRead,
          GmailMessageID: email.gmailMessageId,
          SyncedWithGmail: 1,
          RecipientID: userId  // L'utilisateur qui reçoit
        });

        console.log(`✅ Email synchronisé: "${email.subject}"`);
        synced++;
      } catch (err) {
        console.error(`❌ Erreur lors de la sync de l'email:`, err.message);
        failed++;
      }
    }

    console.log(`✅ Synchronisation complétée: ${synced} synced, ${failed} failed`);
    return { synced, failed };
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error.message);
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
  fetchUnreadEmails,
  syncEmailsFromGmail,
  markEmailAsRead,
  archiveEmail
};
