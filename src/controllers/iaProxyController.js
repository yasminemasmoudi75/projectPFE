const { getForecast } = require('../services/iaProxyService');
const { Tiers, Reclamation, Message, DevisMaster, FavMaster, User, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.forecast = async (req, res) => {
  try {
    const data = await getForecast();
    return res.json({ status: 'success', data });
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

    // 2. ANALYSE DES RÉCLAMATIONS
    const claims = await Reclamation.findAll({ where: { CodTiers: codTiers } });
    if (claims.length > 0) {
      hasInteraction = true;

      const resolved   = claims.filter(c => ['résolu', 'fermé'].includes(c.Statut?.toLowerCase())).length;
      const inProgress = claims.filter(c => c.Statut?.toLowerCase() === 'en cours').length;
      const open       = claims.filter(c => c.Statut?.toLowerCase() === 'ouvert').length;

      // Pénalités : Ouvert = pleine pénalité, En cours = demi pénalité, Résolu = bonus
      let impact = 0;
      impact -= open       * 1.5;  // -1.5 par ticket non traité
      impact -= inProgress * 0.7;  // -0.7 par ticket en cours de traitement
      impact += resolved   * 0.3;  // +0.3 par ticket résolu (bonne réactivité)

      // Sentiment des réclamations ouvertes uniquement
      const openClaims = claims.filter(c => !['résolu', 'fermé'].includes(c.Statut?.toLowerCase()));
      let sentimentSum = 0;
      openClaims.forEach(c => sentimentSum += calculateSentimentScore((c.Objet || '') + ' ' + (c.Description || '')));
      if (sentimentSum < 0) impact -= Math.abs(sentimentSum) * 0.15;

      impact = Math.max(-5, Math.min(1.5, impact)); // Clamp entre -5 et +1.5
      score += impact;

      details.push({
        factor: 'Support & SAV',
        impact: parseFloat(impact.toFixed(1)),
        desc: `${open} ouvert(s), ${inProgress} en cours, ${resolved} résolu(s).`
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
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ status: 'error', message: 'Le prompt est requis.' });
  }

  const systemPrompt = `Tu es un assistant de rédaction email professionnel intégré dans un CRM (Nexus CRM) pour une entreprise tunisienne.
Tu aides les commerciaux et admins à rédiger des emails professionnels en français adaptés au contexte commercial.
Réponds UNIQUEMENT avec ce format JSON (sans markdown) :
{"objet":"<sujet email court>","corps":"<contenu complet de l'email>"}`;

  const axiosLib = require('axios');

  // --- Groq (principal) ---
  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (GROQ_KEY) {
    try {
      const groqRes = await axiosLib.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5,
          max_tokens: 1024,
          response_format: { type: 'json_object' }
        },
        {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
          timeout: 15000
        }
      );
      const parsed = JSON.parse(groqRes.data?.choices?.[0]?.message?.content || '{}');
      if (parsed.objet && parsed.corps) {
        return res.json({ status: 'success', data: { objet: parsed.objet, corps: parsed.corps } });
      }
    } catch (groqErr) {
      console.error('[GROQ GENERATE ERROR]:', groqErr.message);
    }
  }

  // --- Fallback mock ---
  console.warn('[GENERATE EMAIL] Fallback mock utilisé');
  let objet = "Suite à notre échange";
  let corps = "Bonjour,\n\nJe vous contacte suite à notre dernier échange.\n\nCordialement,";
  const p = prompt.toLowerCase();
  if (p.includes('relance') || p.includes('facture') || p.includes('impayé')) {
    objet = "Relance : Facture en attente de paiement";
    corps = "Bonjour,\n\nSauf erreur de notre part, nous n'avons pas encore reçu le règlement de notre dernière facture.\n\nPourriez-vous vérifier l'état de ce paiement ?\n\nCordialement,\nL'équipe Commerciale";
  } else if (p.includes('rdv') || p.includes('rendez-vous') || p.includes('rendezvous')) {
    objet = "Confirmation de rendez-vous";
    corps = "Bonjour,\n\nJe me permets de vous contacter afin de convenir d'un rendez-vous à votre convenance pour discuter de notre collaboration.\n\nDans l'attente de votre retour,\n\nCordialement,\nL'équipe Commerciale";
  } else if (p.includes('devis') || p.includes('proposition')) {
    objet = "Votre proposition commerciale";
    corps = "Bonjour,\n\nSuite à notre récente discussion, veuillez trouver ci-joint notre devis détaillé.\n\nNous restons disponibles pour tout ajustement.\n\nBien cordialement,\nL'équipe Commerciale";
  }
  return res.json({ status: 'success', data: { objet, corps } });
};

exports.reformulateEmail = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ status: 'error', message: 'Le texte est requis.' });
  }

  const localReformulate = (raw) => {
    let out = raw.trim();
    out = out.charAt(0).toUpperCase() + out.slice(1);
    if (!/[.!?]$/.test(out)) out += '.';
    const lower = out.toLowerCase();
    const hasGreeting = lower.includes('bonjour') || lower.includes('madame') || lower.includes('monsieur') || lower.includes('cher');
    const hasClosing = lower.includes('cordialement') || lower.includes('sincèrement') || lower.includes('bien à vous') || lower.includes('salutations');
    if (!hasGreeting && !hasClosing) {
      out = `Bonjour,\n\n${out}\n\nCordialement.`;
    } else if (hasGreeting && !hasClosing) {
      out = `${out}\n\nCordialement.`;
    }
    return out;
  };

  const axiosLib = require('axios');
  const systemPrompt = `Tu es un assistant correcteur orthographique et reformulateur professionnel pour un CRM d'entreprise tunisienne.
L'utilisateur te fournit un texte brut ou un brouillon d'email.
Corrige les fautes d'orthographe et de grammaire, améliore la formulation pour la rendre professionnelle, garde le sens original.
Ne fournis aucune explication, retourne uniquement le texte corrigé.`;

  // --- 1. Groq (principal — gratuit sans carte bancaire) ---
  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (GROQ_KEY) {
    try {
      const groqRes = await axiosLib.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          temperature: 0.3,
          max_tokens: 1024
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GROQ_KEY}`
          },
          timeout: 15000
        }
      );
      const corrected = groqRes.data?.choices?.[0]?.message?.content?.trim();
      if (corrected) {
        return res.json({ status: 'success', data: { corrected, source: 'ai' } });
      }
    } catch (groqErr) {
      console.error('[GROQ REFORMULATE ERROR]:', groqErr.message);
    }
  }

  // --- 2. Fallback : Pollinations (sans clé) ---
  const payload = {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ],
    model: 'openai',
    seed: Math.floor(Math.random() * 1000000)
  };

  const tryPollinations = () => axiosLib.post(
    'https://text.pollinations.ai/',
    payload,
    { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
  );

  const extractText = (data) => {
    if (typeof data === 'string') return data;
    if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
    if (data?.text) return data.text;
    if (data?.content) return data.content;
    return null;
  };

  try {
    let response;
    try {
      response = await tryPollinations();
    } catch (firstErr) {
      if (firstErr.response?.status === 429) {
        await new Promise((r) => setTimeout(r, 2000));
        response = await tryPollinations();
      } else {
        throw firstErr;
      }
    }

    const raw = extractText(response.data);
    if (!raw) throw new Error('Empty response from Pollinations');

    const corrected = raw.replace(/^["*`]+|["*`]+$/g, '').trim() || localReformulate(text);
    return res.json({ status: 'success', data: { corrected, source: 'ai' } });

  } catch (error) {
    console.error('[AI REFORMULATE ERROR]:', error.message);
    return res.json({
      status: 'success',
      data: { corrected: localReformulate(text), source: 'local' }
    });
  }
};

// ── Détection d'intention par mots-clés (robuste, pas de regex complexe) ───
function detectChatIntent(message) {
  const m = message.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // supprimer accents
    .trim();

  const hasWord = (...words) => words.some(w => m.includes(w));

  const isCreate  = hasWord('creer', 'créer', 'nouveau', 'nouvelle', 'ajouter', 'ajoute',
    'faire', 'ouvrir', 'crée', 'cree', 'new', 'add', 'create');
  const isDevis   = hasWord('devis');
  const isClient  = hasWord('client', 'tiers', 'societe', 'société');
  const isClaim   = hasWord('reclamation', 'reclamations', 'sav', 'ticket');
  const isActivite = hasWord('activite', 'activites', 'rdv', 'rendez-vous', 'rendez vous');
  const isProjet  = hasWord('projet', 'projets');
  const isObjectif = hasWord('objectif', 'objectifs');
  const isFacture = hasWord('facture', 'factures', 'fav');
  const isBcv     = hasWord('bon de commande', 'bcv', 'commande');

  const isUnpaid  = hasWord('impaye', 'impayee', 'impayees', 'non paye', 'non payee',
    'pas paye', 'pas payee', 'non regle', 'pas regle', 'reste a payer', 'a regler');
  const isPending = hasWord('attente', 'non converti', 'pas converti', 'ouvert', 'en cours', 'brouillon');

  // ── Intents de CRÉATION (navigation directe) ───────────────────────────
  if (isCreate && isDevis)    return { type: 'navigate', path: '/devis/new',     label: 'Créer un devis',      reply: "Je vous emmène vers la création d'un nouveau **devis** !" };
  if (isCreate && isClient)   return { type: 'navigate', path: '/clients/new',   label: 'Ajouter un client',   reply: "Je vous emmène vers l'ajout d'un nouveau **client** !" };
  if (isCreate && isClaim)    return { type: 'navigate', path: '/claims/new',    label: 'Ouvrir une réclamation', reply: "Je vous emmène vers la création d'une **réclamation** !" };
  if (isCreate && isActivite) return { type: 'navigate', path: '/activites/new', label: 'Créer une activité',  reply: "Je vous emmène vers la création d'une **activité** !" };
  if (isCreate && isProjet)   return { type: 'navigate', path: '/projets/new',   label: 'Créer un projet',     reply: "Je vous emmène vers la création d'un nouveau **projet** !" };
  if (isCreate && isObjectif) return { type: 'navigate', path: '/objectifs/new', label: 'Créer un objectif',   reply: "Je vous emmène vers la création d'un **objectif** !" };
  if (isCreate && isBcv)      return { type: 'navigate', path: '/bcv/new',       label: 'Créer un bon de commande', reply: "Je vous emmène vers la création d'un **bon de commande** !" };

  // ── Intents de NAVIGATION (liste / page) ───────────────────────────────
  if (!isCreate && isDevis && hasWord('liste', 'voir les', 'page', 'aller', 'ouvrir', 'acceder'))
    return { type: 'navigate', path: '/devis', label: 'Aller aux devis', reply: "Je vous emmène vers la liste des **devis** !" };
  if (!isCreate && isClient && hasWord('liste', 'voir les', 'page', 'aller', 'acceder'))
    return { type: 'navigate', path: '/clients', label: 'Aller aux clients', reply: "Je vous emmène vers la liste des **clients** !" };
  if (!isCreate && isClaim && hasWord('liste', 'voir les', 'page', 'aller', 'acceder'))
    return { type: 'navigate', path: '/claims', label: 'Aller aux réclamations', reply: "Je vous emmène vers la liste des **réclamations** !" };

  // ── Intents BDD (données réelles) ──────────────────────────────────────
  const clientMatch = m.match(/(?:\bde\b|\bdu\b|\bpour\b|\bd[e']\s)([a-z0-9\s\-_\.]+)$/);
  const client = clientMatch ? clientMatch[1].replace(/\s+$/, '') : null;

  if (isUnpaid && isFacture && client) return { type: 'unpaid_invoices_client', client };
  if (isUnpaid && (isFacture || !isDevis)) return { type: 'unpaid_invoices' };
  if (isDevis && client && !isPending && !isUnpaid) return { type: 'devis_client', client };
  if (isDevis && isPending) return { type: 'pending_devis' };
  if (isDevis && hasWord('liste', 'montre', 'affiche', 'donne', 'voir', 'tout', 'dernier', 'recent', 'show'))
    return { type: 'list_devis' };

  return null;
}

// ── Accès navigation par rôle ────────────────────────────────────────────────
const NAV_ACCESS = {
  // path → rôles autorisés (null = tous)
  '/devis/new':      ['admin', 'commercial', 'agent'],
  '/clients/new':    ['admin', 'commercial', 'agent'],
  '/claims/new':     ['admin', 'commercial', 'agent', 'technicien'],
  '/activites/new':  ['admin', 'commercial', 'agent'],
  '/projets/new':    ['admin', 'commercial', 'agent'],
  '/objectifs/new':  ['admin', 'commercial'],
  '/bcv/new':        ['admin', 'commercial', 'agent'],
  '/devis':          ['admin', 'commercial', 'agent'],
  '/clients':        ['admin', 'commercial', 'agent'],
  '/claims':         ['admin', 'commercial', 'agent', 'technicien'],
};

function canNavigate(path, user) {
  const { normalizeRole } = require('../utils/userAccess');
  const allowed = NAV_ACCESS[path];
  if (!allowed) return true; // pas de restriction définie
  const role = normalizeRole(user?.UserRole || '');
  return allowed.includes(role);
}

// ── Exécution de l'intention via le service sécurisé ────────────────────────
async function executeChatIntent(intent, user) {
  const chatbotData = require('../services/chatbotDataService');
  const { normalizeRole } = require('../utils/userAccess');

  // ── Navigation directe ───────────────────────────────────────────────────
  if (intent.type === 'navigate') {
    if (!canNavigate(intent.path, user)) {
      const role = normalizeRole(user?.UserRole || '');
      return {
        reply: `⛔ Désolé, votre rôle (**${user?.UserRole || role}**) ne vous permet pas d'accéder à cette page.`,
      };
    }
    return {
      reply: intent.reply,
      action: { type: 'navigate', path: intent.path, label: intent.label },
    };
  }

  // ── Requêtes BDD : toutes passent par chatbotDataService (rôle filtré) ───
  if (intent.type === 'list_devis')             return chatbotData.getRecentDevis(user);
  if (intent.type === 'pending_devis')          return chatbotData.getPendingDevis(user);
  if (intent.type === 'devis_client')           return chatbotData.getDevisByClient(user, intent.client);
  if (intent.type === 'unpaid_invoices')        return chatbotData.getUnpaidInvoices(user);
  if (intent.type === 'unpaid_invoices_client') return chatbotData.getUnpaidInvoices(user, intent.client);

  return null;
}

exports.chat = async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ status: 'error', message: 'Message requis.' });
  }

  const user = req.user;

  // ── 1. Détection d'intention BDD (prioritaire sur le LLM) ──────────────
  try {
    const intent = detectChatIntent(message);
    if (intent) {
      const result = await executeChatIntent(intent, user);
      if (result) {
        return res.json({ status: 'success', data: result });
      }
    }
  } catch (intentErr) {
    console.error('[CHAT INTENT ERROR]:', intentErr.message, intentErr.stack);
    return res.json({
      status: 'success',
      data: { reply: `⚠️ Erreur lors de la recherche : ${intentErr.message}` },
    });
  }

  // ── 2. LLM Groq pour les questions générales ───────────────────────────
  const { normalizeRole: normRole } = require('../utils/userAccess');
  const userRole = normRole(user?.UserRole || '');
  const userName = user?.FullName || user?.LoginName || '';

  const roleContext = {
    admin:      'Tu parles à un administrateur. Il a accès à toutes les données.',
    commercial: 'Tu parles à un commercial. Il gère ses propres clients, devis et factures.',
    agent:      'Tu parles à un(e) agent(e)/secrétaire. Il/elle gère les opérations administratives.',
    technicien: 'Tu parles à un technicien SAV. Son domaine est les réclamations et interventions techniques.',
    client:     'Tu parles à un client externe. Il peut consulter ses propres factures et devis.',
  }[userRole] || 'Tu parles à un utilisateur du CRM.';

  const systemPrompt = `Tu es NexusAI, l'assistant intelligent du CRM Nexus pour une entreprise tunisienne de distribution B2B.
Tu réponds en français, de manière concise et professionnelle.
${roleContext}${userName ? ` L'utilisateur s'appelle ${userName}.` : ''}
Tu aides avec : devis, clients, réclamations, objectifs de vente, planning, et conseils CRM.
Si tu ne sais pas quelque chose de spécifique aux données de l'entreprise, propose une suggestion utile.`;

  const axiosLib = require('axios');
  const GROQ_KEY = process.env.GROQ_API_KEY;

  if (GROQ_KEY) {
    try {
      const groqRes = await axiosLib.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.6,
          max_tokens: 512
        },
        {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
          timeout: 15000
        }
      );
      const reply = groqRes.data?.choices?.[0]?.message?.content?.trim();
      if (reply) {
        return res.json({ status: 'success', data: { reply } });
      }
    } catch (err) {
      console.error('[GROQ CHAT ERROR]:', err.message);
    }
  }

  // ── 3. Fallback local ──────────────────────────────────────────────────
  const m = message.toLowerCase();
  let reply = "Je suis NexusAI, votre assistant CRM. Posez-moi une question sur vos ventes, clients ou activités.";
  if (m.includes('devis')) reply = "Pour gérer vos devis, rendez-vous dans le module **Devis**. Vous pouvez créer, modifier et transformer un devis en bon de commande (BCV) en un clic.";
  else if (m.includes('client') || m.includes('relance')) reply = "Pour relancer un client, consultez le module **Clients** et vérifiez les devis en attente ou les factures impayées dans **Règlements**.";
  else if (m.includes('réclamation') || m.includes('sav')) reply = "Les réclamations sont gérées dans le module **SAV**. Un technicien peut être affecté directement depuis la fiche réclamation.";
  else if (m.includes('objectif')) reply = "Vos objectifs de vente (CA, visites, contacts) sont suivis dans le module **Objectifs** avec des barres de progression en temps réel.";
  else if (m.includes('stock')) reply = "La gestion du stock est disponible dans le module **Produits**. Les alertes stock critique apparaissent sur le tableau de bord admin.";

  return res.json({ status: 'success', data: { reply } });
};
