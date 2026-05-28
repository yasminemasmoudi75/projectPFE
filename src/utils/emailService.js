const nodemailer = require('nodemailer');
const { logAction } = require('./logger');

const AUTH_EMAIL_USER = process.env.AUTH_EMAIL_USER || process.env.EMAIL_USER;
const AUTH_EMAIL_PASS = process.env.AUTH_EMAIL_PASS || process.env.EMAIL_PASS;
const AUTH_EMAIL_FROM = process.env.AUTH_EMAIL_FROM || process.env.EMAIL_FROM || AUTH_EMAIL_USER || 'no-reply@nexus.local';

// nodemailer v8 a supprimé les shortcuts `service: 'gmail'`.
// On doit spécifier host/port/secure explicitement.
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,          // STARTTLS sur 587
  auth: {
    user: AUTH_EMAIL_USER,
    pass: AUTH_EMAIL_PASS  // App Password Google (16 chars, 2FA requis)
  },
  tls: {
    rejectUnauthorized: false
  }
});

const normalizeEmail = (email) => String(email || '').trim();

const buildDocumentDetailsLink = (docType, docId) => {
  const pathMap = {
    'DEVIS': 'devis',
    'BCV': 'bcv',
    'BLV': 'blv',
    'FAV': 'fav'
  };

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const docPath = pathMap[String(docType || '').toUpperCase()] || 'dashboard';

  return `${frontendUrl}/${docPath}/${docId}`;
};

const verifyAuthEmailTransport = async () => {
  if (!AUTH_EMAIL_USER || !AUTH_EMAIL_PASS) {
    console.error('❌ [SMTP] Variables EMAIL_USER / EMAIL_PASS manquantes dans .env');
    return { ok: false, reason: 'EMAIL_USER/EMAIL_PASS manquants dans .env' };
  }

  try {
    await transporter.verify();
    console.log(`✅ [SMTP] Connexion Gmail OK — compte : ${AUTH_EMAIL_USER}`);
    return { ok: true, reason: 'Connexion SMTP valide' };
  } catch (error) {
    console.error('❌ [SMTP] Échec de vérification Gmail :', error.message);
    if (error.responseCode === 535) {
      console.error('   → Authentification rejetée : vérifiez que la 2FA est activée sur le compte Gmail');
      console.error('   → et que EMAIL_PASS est un App Password Google valide (16 chars sans espaces)');
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('   → Connexion réseau impossible vers smtp.gmail.com:587');
    }
    return {
      ok: false,
      reason: error?.message || 'Erreur SMTP inconnue',
      code: error?.code,
      responseCode: error?.responseCode
    };
  }
};

/**
 * Envoie les identifiants de connexion à un nouveau client
 * @param {string} email - Email du client
 * @param {string} fullName - Nom complet du client
 * @param {string} password - Mot de passe en clair (juste pour l'email initial)
 */
const sendClientCredentials = async (email, fullName, password) => {
  const mailOptions = {
    from: `"Nexus CRM" <${AUTH_EMAIL_FROM}>`,
    to: email,
    subject: 'Bienvenue sur Nexus CRM - Vos identifiants de connexion',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0062AF;">Bienvenue sur Nexus CRM !</h2>
        <p>Bonjour ${fullName},</p>
        <p>Nous avons le plaisir de vous informer que vous avez été ajouté en tant que client dans notre système.</p>
        <p>Voici vos identifiants de connexion pour accéder à votre espace :</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; border-left: 5px solid #0062AF;">
          <strong>Email :</strong> ${email}<br>
          <strong>Mot de passe temporaire :</strong> ${password}
        </div>
        <p style="margin-top: 20px;">
          <strong>Important :</strong> Pour des raisons de sécurité, il vous sera demandé de modifier ce mot de passe lors de votre première connexion.
        </p>
        <p>Cordialement,<br>L'équipe Nexus CRM</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 [AUTH-MAIL] Email envoyé: %s', info.messageId);
    await logAction(0, 'EMAIL_SENT', 'Auth', email, `Credentials sent to ${fullName}`);
    return true;
  } catch (error) {
    console.error('❌ [AUTH-MAIL] Erreur lors de l\'envoi de l\'email:', error);
    await logAction(0, 'EMAIL_ERROR', 'Auth', email, `Failed to send credentials: ${error.message}`);
    return false;
  }
};

/**
 * Envoie une notification de document (Devis, BC, Facture) au client
 * @param {string} email - Email du client
 * @param {string} fullName - Nom du client
 * @param {object} doc - Détails du document (type, numero, montant, id)
 */
const sendDocumentNotification = async (email, fullName, doc) => {
  const recipientEmail = normalizeEmail(email);
  if (!recipientEmail) {
    console.log('ℹ️ [DOC-MAIL] Notification ignorée: aucun email client disponible');
    return true;
  }

  const typeMap = {
    'DEVIS': 'un nouveau Devis',
    'BCV': 'un nouveau Bon de Commande',
    'BLV': 'un nouveau Bon de Livraison',
    'FAV': 'une nouvelle Facture'
  };

  const docType = String(doc?.type || '').toUpperCase();
  const docLabel = typeMap[docType] || 'un nouveau document';
  const directLink = buildDocumentDetailsLink(docType, doc?.id);

  const mailOptions = {
    from: `"Nexus CRM" <${AUTH_EMAIL_FROM}>`,
    to: recipientEmail,
    subject: `Nouveau document disponible : ${doc.numero}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #0062AF, #004a85); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Nouveau document disponible</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Bonjour <strong>${fullName}</strong>,</p>
          <p style="font-size: 16px; margin-bottom: 25px;">Nous avons le plaisir de vous informer que <strong>${docLabel}</strong> vient d'être généré pour vous dans notre système.</p>
          
          <div style="background-color: #f8faff; padding: 25px; border-radius: 12px; border-left: 6px solid #0062AF; margin-bottom: 30px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #666; font-size: 14px;">Référence :</td>
                <td style="padding: 5px 0; font-weight: 700; color: #333;">${doc.numero}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #666; font-size: 14px;">Type :</td>
                <td style="padding: 5px 0; font-weight: 700; color: #333;">${docType}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #666; font-size: 14px;">Montant :</td>
                <td style="padding: 5px 0; font-weight: 700; color: #0062AF; font-size: 18px;">${doc.montant} TND</td>
              </tr>
            </table>
          </div>
          
          <p style="font-size: 15px; color: #555; margin-bottom: 30px;">
            Vous pouvez consulter les détails du document en cliquant sur le bouton ci-dessous :
          </p>
          
          <div style="text-align: center;">
            <a href="${directLink}" style="background-color: #0062AF; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block; box-shadow: 0 4px 15px rgba(0, 98, 175, 0.3);">
              Voir les détails
            </a>
          </div>
        </div>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
          <p style="font-size: 12px; color: #888; margin: 0;">&copy; ${new Date().getFullYear()} Nexus CRM. Tous droits réservés.</p>
          <p style="font-size: 12px; color: #888; margin: 5px 0 0 0;">Ceci est un message automatique, merci de ne pas y répondre.</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 [DOC-MAIL] Email envoyé: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ [DOC-MAIL] Erreur lors de l\'envoi de l\'email:', error);
    return false;
  }
};

module.exports = {
  sendClientCredentials,
  sendDocumentNotification,
  verifyAuthEmailTransport
};
