/**
 * ChatbotDataService — couche d'accès aux données du chatbot
 *
 * Règles RBAC :
 *  Admin       → voit tout (aucun filtre)
 *  Commercial  → seulement ses propres documents (CodRepres = UserID)
 *  Client      → seulement ses propres données (CodTiers)
 *  Technicien  → accès refusé aux devis/factures (son périmètre = SAV)
 *  Agent       → selon FiltreRepres dans TabAWProfileAccess :
 *                  0 → voit tout  |  1 → filtre par CodRepres (sa région)
 */

const { DevisMaster, FavMaster, sequelize } = require('../models');
const { Op, QueryTypes } = require('sequelize');
const { normalizeRole } = require('../utils/userAccess');

const MAX_ROWS = 50;

// ── Helpers formatage ────────────────────────────────────────────────────────
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '-');
const fmtMnt  = (v) => `${(Number(v) || 0).toFixed(2)} DT`;
const remaining = (r) =>
  Math.max(0, (Number(r.TotTTC) || 0) - (Number(r.MntCredit) || 0));

// ── FiltreRepres pour les agents (module devis = 4) ──────────────────────────
async function isFiltreRepresEnabled() {
  try {
    const rows = await sequelize.query(
      `SELECT TOP 1 FiltreRepres
       FROM TabAWProfileAccess
       WHERE LOWER(ProfileUser) IN ('agent') AND CodMod = 4`,
      { type: QueryTypes.SELECT }
    );
    const val = rows[0]?.FiltreRepres;
    return val === 1 || val === '1' || val === true;
  } catch {
    return false; // en cas d'erreur → pas de restriction
  }
}

// ── Contexte d'accès par rôle ────────────────────────────────────────────────
/**
 * Retourne { filter: {...}, denied: false } ou { denied: true, msg: '...' }
 * entity = 'devis' | 'facture'
 */
async function buildAccessContext(user, entity = 'devis') {
  if (!user) return { denied: true, msg: '⚠️ Utilisateur non authentifié.' };

  const role   = normalizeRole(user.UserRole);
  const userId = String(user.UserID || '').trim();

  // ── Admin : voit tout ────────────────────────────────────────────────────
  if (role === 'admin') return { filter: {}, denied: false };

  // ── Commercial : ses propres documents (CodRepres = UserID) ─────────────
  if (role === 'commercial') {
    if (!userId)
      return { denied: true, msg: '⚠️ Identifiant commercial introuvable.' };
    return { filter: { CodRepres: userId }, denied: false };
  }

  // ── Client : ses propres données (CodTiers) ──────────────────────────────
  if (role === 'client') {
    const codTiers =
      (typeof user.getDataValue === 'function' ? user.getDataValue('CodTiers') : null) ||
      user.CodTiers;
    if (!codTiers)
      return {
        denied: true,
        msg: '⚠️ Votre compte client n\'est pas encore lié à un dossier. Contactez votre commercial.',
      };
    // Les clients ne voient que leurs propres devis/factures
    return { filter: { CodTiers: codTiers }, denied: false };
  }

  // ── Technicien : périmètre = SAV uniquement ──────────────────────────────
  if (role === 'technicien') {
    return {
      denied: true,
      msg: '⚠️ En tant que technicien, vous n\'avez pas accès aux devis et factures. Consultez le module **SAV** pour vos réclamations.',
    };
  }

  // ── Agent/Secrétaire : selon FiltreRepres ────────────────────────────────
  if (role === 'agent') {
    const filtreEnabled = await isFiltreRepresEnabled();
    if (!filtreEnabled) {
      // FiltreRepres = 0 → l'agent voit tous les commerciaux et tous les clients
      return { filter: {}, denied: false };
    }
    // FiltreRepres = 1 → l'agent voit seulement sa région (CodRepres = UserID)
    if (!userId)
      return { denied: true, msg: '⚠️ Identifiant agent introuvable.' };
    return { filter: { CodRepres: userId }, denied: false };
  }

  // ── Rôle inconnu ─────────────────────────────────────────────────────────
  return { denied: true, msg: '⚠️ Votre rôle ne permet pas l\'accès à ces données.' };
}

// ── Méthodes exportées ────────────────────────────────────────────────────────

exports.getRecentDevis = async (user, limit = 10) => {
  const ctx = await buildAccessContext(user, 'devis');
  if (ctx.denied) return { reply: ctx.msg };

  const rows = await DevisMaster.findAll({
    where: ctx.filter,
    limit: Math.min(limit, MAX_ROWS),
    order: [['Nf', 'DESC']],
    attributes: ['Nf', 'LibTiers', 'TotTTC', 'DatUser', 'bTransf', 'Valid'],
  });
  if (!rows.length) return { reply: 'Aucun devis trouvé.' };

  return {
    reply: `Voici les **${rows.length} derniers devis** :`,
    tableData: rows.map((r) => ({
      'N° Devis':  r.Nf,
      'Client':    r.LibTiers || '-',
      'Total TTC': fmtMnt(r.TotTTC),
      'Date':      fmtDate(r.DatUser),
      'Statut':    r.bTransf ? 'Converti' : r.Valid ? 'Validé' : 'Brouillon',
    })),
    action: { type: 'navigate', path: '/devis', label: 'Voir tous les devis' },
  };
};

exports.getPendingDevis = async (user, limit = 10) => {
  const ctx = await buildAccessContext(user, 'devis');
  if (ctx.denied) return { reply: ctx.msg };

  const rows = await DevisMaster.findAll({
    where: { ...ctx.filter, bTransf: false },
    limit: Math.min(limit, MAX_ROWS),
    order: [['Nf', 'DESC']],
    attributes: ['Nf', 'LibTiers', 'TotTTC', 'DatUser', 'Valid'],
  });
  if (!rows.length) return { reply: 'Aucun devis en attente.' };

  return {
    reply: `**${rows.length} devis en attente** (non convertis) :`,
    tableData: rows.map((r) => ({
      'N° Devis':  r.Nf,
      'Client':    r.LibTiers || '-',
      'Total TTC': fmtMnt(r.TotTTC),
      'Date':      fmtDate(r.DatUser),
      'Statut':    r.Valid ? 'Validé' : 'Brouillon',
    })),
    action: { type: 'navigate', path: '/devis', label: 'Ouvrir les devis' },
  };
};

exports.getDevisByClient = async (user, clientName, limit = 10) => {
  const ctx = await buildAccessContext(user, 'devis');
  if (ctx.denied) return { reply: ctx.msg };

  const rows = await DevisMaster.findAll({
    where: { ...ctx.filter, LibTiers: { [Op.like]: `%${clientName}%` } },
    limit: Math.min(limit, MAX_ROWS),
    order: [['Nf', 'DESC']],
    attributes: ['Nf', 'LibTiers', 'TotTTC', 'DatUser', 'bTransf', 'Valid'],
  });
  if (!rows.length)
    return { reply: `Aucun devis trouvé pour **${clientName}**.` };

  return {
    reply: `**${rows.length} devis** pour **${rows[0].LibTiers}** :`,
    tableData: rows.map((r) => ({
      'N° Devis':  r.Nf,
      'Client':    r.LibTiers || '-',
      'Total TTC': fmtMnt(r.TotTTC),
      'Date':      fmtDate(r.DatUser),
      'Statut':    r.bTransf ? 'Converti' : r.Valid ? 'Validé' : 'Brouillon',
    })),
    action: { type: 'navigate', path: '/devis', label: 'Voir les devis' },
  };
};

exports.getUnpaidInvoices = async (user, clientName = null, limit = 10) => {
  const ctx = await buildAccessContext(user, 'facture');
  if (ctx.denied) return { reply: ctx.msg };

  const clientWhere = clientName
    ? { LibTiers: { [Op.like]: `%${clientName}%` } }
    : {};

  const rows = await FavMaster.findAll({
    where: {
      ...ctx.filter,
      ...clientWhere,
      [Op.and]: [sequelize.literal('TotTTC > ISNULL(MntCredit, 0) AND TotTTC > 0')],
    },
    limit: Math.min(limit, MAX_ROWS),
    order: [['TotTTC', 'DESC']],
    // Champs sensibles exclus (SignatureData, ClientSignatureData, etc.)
    attributes: ['Nf', 'LibTiers', 'TotTTC', 'MntCredit', 'DatUser'],
  });

  if (!rows.length) {
    const suffix = clientName ? ` pour **${clientName}**` : '';
    return { reply: `Aucune facture impayée${suffix}.` };
  }

  const total  = rows.reduce((s, r) => s + remaining(r), 0);
  const suffix = clientName ? ` pour **${rows[0].LibTiers}**` : '';

  return {
    reply: `**${rows.length} facture(s) impayée(s)**${suffix} — Reste total : **${fmtMnt(total)}**`,
    tableData: rows.map((r) => ({
      'N° Facture':    r.Nf,
      'Client':        r.LibTiers || '-',
      'Total TTC':     fmtMnt(r.TotTTC),
      'Reste à payer': fmtMnt(remaining(r)),
      'Date':          fmtDate(r.DatUser),
    })),
    action: { type: 'navigate', path: '/fav', label: 'Voir les factures' },
  };
};
