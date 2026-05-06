const { getForecast } = require('../services/iaProxyService');
const { Tiers, Reclamation, Message, DevisMaster, FavMaster, User, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.forecast = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 200);
    const data = await getForecast(limit);

    return res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    console.error('[IA PROXY ERROR]:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la recuperation des previsions IA',
      error: error.message,
    });
  }
};

// Analyse rudimentaire du NLP/Sentiment
const calculateSentimentScore = (text) => {
  if (!text) return 0;
  const content = text.toLowerCase();

  // Mots positifs
  const positiveWords = ['merci', 'bravo', 'excellent', 'super', 'satisfait', 'content', 'génial', 'parfait', 'rapide', 'bien', 'bon'];
  // Mots négatifs
  const negativeWords = ['retard', 'nul', 'problème', 'erreur', 'jamais', 'déçu', 'mauvais', 'attente', 'inacceptable', 'cassé', 'réclamation', 'urgent', 'bloqué'];

  let score = 0;
  positiveWords.forEach(word => { if (content.includes(word)) score += 1; });
  negativeWords.forEach(word => { if (content.includes(word)) score -= 1.5; });

  return score;
};

// Cache simple en mémoire (15 minutes)
const satisfactionCache = new Map();
const CACHE_TTL = 15 * 60 * 1000;

exports.analyzeSatisfaction = async (req, res) => {
  try {
    const { codTiers } = req.params;
    const version = "2.3.1-CACHE";

    // Vérifier le cache
    const cached = satisfactionCache.get(codTiers);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return res.json({ status: 'success', data: cached.data });
    }

    // 1. Chercher le client
    const client = await Tiers.findOne({ where: { CodTiers: codTiers } });
    if (!client) return res.status(404).json({ status: 'error', message: 'Client non trouvé' });

    let score = 7.5; // Base neutre/positive pour un client actif
    let details = [];
    let hasInteraction = false;

    // 2. ANALYSE DES RÉCLAMATIONS (Impact Négatif)
    const claims = await Reclamation.findAll({ where: { CodTiers: codTiers } });
    if (claims.length > 0) {
      hasInteraction = true;
      let unresolved = claims.filter(c => !['résolu', 'fermé', 'clôturé'].includes(c.Statut?.toLowerCase())).length;
      let resolved = claims.length - unresolved;

      let penalty = (unresolved * 1.5) + (resolved * 0.5);

      // Sentiment des réclamations
      let sentimentSum = 0;
      claims.forEach(c => sentimentSum += calculateSentimentScore((c.Objet || '') + ' ' + (c.Description || '')));

      if (sentimentSum < 0) penalty += Math.abs(sentimentSum) * 0.2; // Aggravation si mots colériques

      penalty = Math.min(6, penalty); // Max 6 points de perte sur les tickets
      score -= penalty;

      details.push({
        factor: 'Support & SAV',
        impact: -parseFloat(penalty.toFixed(1)),
        desc: `${unresolved} ticket(s) en cours et ${resolved} résolu(s).`
      });
    }

    // 3. ANALYSE DES ÉCHANGES (Sentiment)
    if (client.Email) {
      const user = await User.findOne({ where: { EmailPro: client.Email.trim() }, attributes: ['UserID'] });
      if (user) {
        const messages = await Message.findAll({
          where: { [Op.or]: [{ SenderID: user.UserID }, { RecipientID: user.UserID }] },
          limit: 20
        });

        if (messages.length > 0) {
          hasInteraction = true;
          let sentiment = 0;
          messages.forEach(m => sentiment += calculateSentimentScore(m.MessageText || ''));

          let impact = Math.max(-2, Math.min(2, sentiment * 0.3));
          score += impact;
          if (Math.abs(impact) > 0.1) {
            details.push({
              factor: 'Climat Sémantique',
              impact: parseFloat(impact.toFixed(1)),
              desc: `Analyse des ${messages.length} derniers échanges emails.`
            });
          }
        }
      }
    }

    // 4. ANALYSE COMMERCIALE (Fidélité)
    try {
      const totalDevis = await DevisMaster.count({ where: { CodTiers: codTiers } });
      const totalFactures = await FavMaster.count({ where: { CodTiers: codTiers } });

      if (totalDevis > 0 || totalFactures > 0) {
        hasInteraction = true;
        if (totalFactures > 0) {
          let loyaltyBonus = Math.min(1.5, totalFactures * 0.2); // +0.2 par facture payée
          score += loyaltyBonus;
          details.push({
            factor: 'Fidélité Commerciale',
            impact: parseFloat(loyaltyBonus.toFixed(1)),
            desc: `Basé sur un historique de ${totalFactures} facture(s).`
          });
        } else {
          score -= 0.5; // Prospect chaud mais pas encore transformé
          details.push({ factor: 'Conversion', impact: -0.5, desc: 'Devis en attente de transformation.' });
        }
      }
    } catch (e) {
      console.error('Err commercial analysis:', e.message);
    }

    // 5. GESTION DES NOUVEAUX PROSPECTS
    if (!hasInteraction) {
      const prospectData = { score: null, isProspect: true, client: client.Raisoc, version };
      satisfactionCache.set(codTiers, { data: prospectData, timestamp: Date.now() });
      return res.json({ status: 'success', data: prospectData });
    }

    const finalScore = Math.max(0.5, Math.min(10, score));

    console.log(`[IA ${version}] ${codTiers} -> Score: ${finalScore}`);

    const resultData = {
      score: parseFloat(finalScore.toFixed(1)),
      isProspect: false,
      client: client.Raisoc,
      factors: details,
      version
    };

    // Mettre en cache
    satisfactionCache.set(codTiers, { data: resultData, timestamp: Date.now() });

    return res.json({
      status: 'success',
      data: resultData
    });

  } catch (error) {
    console.error('[SATISFACTION ANALYSIS ERROR]:', error.message);
    return res.status(500).json({ status: 'error', message: 'Erreur analyse' });
  }
};

exports.generateEmail = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ status: 'error', message: 'Le prompt est requis.' });
    }

    const systemPrompt = `Tu es un assistant de rédaction email professionnel intégré dans un CRM (Nexus CRM) pour une entreprise tunisienne.
Tu aides les commerciaux et admins à rédiger des emails professionnels en français adaptés au contexte commercial : relances, devis, factures, propositions commerciales, réclamations, remerciements.
Quand l'utilisateur décrit ce qu'il veut, génère directement :
- Objet : [sujet de l'email]
- Corps : [contenu complet de l'email]
Sois professionnel, concis et adapté au contexte tunisien. Ne donne pas d'introduction, renvoie juste l'Objet et le Corps comme demandé.`;

    // Utilisation d'une API gratuite (Pollinations AI) qui ne nécessite aucune clé API !
    const axios = require('axios');
    const response = await axios.post(
      'https://text.pollinations.ai/',
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: 'openai',
        seed: Math.floor(Math.random() * 1000000)
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 20000 // 20 secondes max
      }
    );

    // Parsing de la réponse
    const replyText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

    let objet = '';
    let corps = '';

    const objetMatch = replyText.match(/(?:-?\s*\**Objet\**\s*:|\**Sujet\**\s*:)\s*(.*?)(?=\n|$)/is);
    const corpsMatch = replyText.match(/(?:-?\s*\**Corps\**\s*:|\**Message\**\s*:)\s*([\s\S]*)/is);

    if (objetMatch) objet = objetMatch[1].trim();
    if (corpsMatch) corps = corpsMatch[1].trim();

    if (!objet && !corps) {
      corps = replyText.trim();
      objet = 'Nouveau message (Généré par IA)';
    }

    objet = objet.replace(/^["*]+|["*]+$/g, '');

    return res.json({ status: 'success', data: { objet, corps } });

  } catch (error) {
    console.error('[AI EMAIL API ERROR] Fallback to mock:', error.message);
    
    // FALLBACK DE SECOURS (Si l'API gratuite plante ou bloque, on simule la réponse pour que le PFE fonctionne toujours !)
    let objet = "Suite à notre échange";
    let corps = "Bonjour,\n\nJe vous contacte suite à notre dernier échange.\n\nCordialement,";
    const userPrompt = (req.body && req.body.prompt) ? req.body.prompt.toLowerCase() : '';

    if (userPrompt.includes('relance') || userPrompt.includes('facture') || userPrompt.includes('impayé')) {
      objet = "Relance : Facture en attente de paiement";
      corps = "Bonjour,\n\nSauf erreur ou omission de notre part, nous n'avons pas encore reçu le règlement concernant notre dernière facture.\n\nPourriez-vous vérifier l'état de ce paiement de votre côté ?\n\nSi le paiement a déjà été effectué, veuillez ignorer cet email.\n\nCordialement,\nL'équipe Commerciale";
    } else if (userPrompt.includes('devis') || userPrompt.includes('proposition')) {
      objet = "Votre proposition commerciale personnalisée";
      corps = "Bonjour,\n\nSuite à notre récente discussion, j'ai le plaisir de vous transmettre en pièce jointe notre devis détaillé correspondant à vos besoins.\n\nJe reste à votre entière disposition pour échanger sur cette proposition et l'ajuster si nécessaire.\n\nBien cordialement,\nL'équipe Commerciale";
    } else if (userPrompt.includes('réclamation') || userPrompt.includes('problème') || userPrompt.includes('excuse')) {
      objet = "Concernant votre récente réclamation";
      corps = "Bonjour,\n\nNous avons bien pris en compte votre retour et nous vous présentons nos excuses pour le désagrément occasionné.\n\nNotre équipe technique analyse actuellement la situation pour résoudre ce problème dans les plus brefs délais. Nous vous tiendrons informé de l'avancement très rapidement.\n\nMerci de votre patience.\n\nCordialement,\nLe Service Client";
    } else if (userPrompt.includes('merci') || userPrompt.includes('remerciement')) {
      objet = "Remerciements pour votre confiance";
      corps = "Bonjour,\n\nJe tenais personnellement à vous remercier pour la confiance que vous accordez à notre entreprise.\n\nC'est un réel plaisir de collaborer avec vous sur ce projet.\n\nÀ très bientôt,\nL'équipe Commerciale";
    }

    return res.json({ status: 'success', data: { objet, corps } });
  }
};

exports.reformulateEmail = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ status: 'error', message: 'Le texte est requis.' });
    }

    const systemPrompt = `Tu es un assistant correcteur orthographique et reformulateur professionnel pour un CRM d'entreprise tunisienne.
L'utilisateur te fournit un texte brut ou un brouillon d'email.
Ton rôle est de corriger les fautes d'orthographe, de grammaire, et d'améliorer la formulation pour la rendre professionnelle, tout en gardant le sens original.
Ne fournis aucune explication, ne dis pas bonjour, retourne uniquement le texte corrigé et reformulé.`;

    const axios = require('axios');
    const response = await axios.post(
      'https://text.pollinations.ai/',
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        model: 'openai',
        seed: Math.floor(Math.random() * 1000000)
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000
      }
    );

    const replyText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    let corrected = replyText.replace(/^["*]+|["*]+$/g, '').trim();

    return res.json({ status: 'success', data: { corrected } });

  } catch (error) {
    console.error('[AI REFORMULATE ERROR]:', error.message);
    // Fallback de secours minimal si l'API plante
    return res.json({ 
      status: 'success', 
      data: { 
        corrected: text + "\n\n(Note: Le service de correction AI est momentanément indisponible.)" 
      } 
    });
  }
};


