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

