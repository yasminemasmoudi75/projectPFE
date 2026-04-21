const nodemailer = require('nodemailer');

const AUTH_EMAIL_SERVICE = process.env.AUTH_EMAIL_SERVICE || process.env.EMAIL_SERVICE || 'gmail';
const AUTH_EMAIL_USER = process.env.AUTH_EMAIL_USER || process.env.EMAIL_USER;
const AUTH_EMAIL_PASS = process.env.AUTH_EMAIL_PASS || process.env.EMAIL_PASS;
const AUTH_EMAIL_FROM = process.env.AUTH_EMAIL_FROM || process.env.EMAIL_FROM || AUTH_EMAIL_USER || 'no-reply@nexus.local';

// Transport dédié aux emails d'authentification client.
// Il est volontairement séparé du module Gmail OAuth (messagerie interne/sync).
const transporter = nodemailer.createTransport({
  service: AUTH_EMAIL_SERVICE,
  auth: {
    user: AUTH_EMAIL_USER,
    pass: AUTH_EMAIL_PASS
  }
});

const verifyAuthEmailTransport = async () => {
  if (!AUTH_EMAIL_USER || !AUTH_EMAIL_PASS) {
    return {
      ok: false,
      reason: 'AUTH_EMAIL_USER/AUTH_EMAIL_PASS manquants'
    };
  }

  try {
    await transporter.verify();
    return {
      ok: true,
      reason: 'Connexion SMTP valide'
    };
  } catch (error) {
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
    return true;
  } catch (error) {
    console.error('❌ [AUTH-MAIL] Erreur lors de l\'envoi de l\'email:', error);
    return false;
  }
};

module.exports = {
  sendClientCredentials,
  verifyAuthEmailTransport
};
