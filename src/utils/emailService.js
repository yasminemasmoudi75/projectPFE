const nodemailer = require('nodemailer');

// Configuration du transporteur d'email
// Note: En développement, vous pouvez utiliser un service comme Mailtrap
// En production, utilisez Gmail API, SendGrid, Amazon SES, etc.
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Envoie les identifiants de connexion à un nouveau client
 * @param {string} email - Email du client
 * @param {string} fullName - Nom complet du client
 * @param {string} password - Mot de passe en clair (juste pour l'email initial)
 */
exports.sendClientCredentials = async (email, fullName, password) => {
  const mailOptions = {
    from: `"Nexus CRM" <${process.env.EMAIL_FROM || 'crmnexus11@gmail.com'}>`,
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
    console.log('📧 Email envoyé: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    return false;
  }
};
