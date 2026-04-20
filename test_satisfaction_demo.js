const { Tiers, Reclamation, Message, DevisMaster, FavMaster, sequelize } = require('./src/models');
const { Op } = require('sequelize');

const calculateSentimentScore = (text) => {
  if (!text) return 0;
  const content = text.toLowerCase();
  const positiveWords = ['merci', 'bravo', 'excellent', 'super', 'satisfait', 'content', 'génial', 'parfait', 'rapide', 'bien', 'bon'];
  const negativeWords = ['retard', 'nul', 'problème', 'erreur', 'jamais', 'déçu', 'mauvais', 'attente', 'inacceptable', 'cassé', 'réclamation', 'urgent', 'bloqué'];

  let score = 0;
  positiveWords.forEach(word => { if (content.includes(word)) score += 1; });
  negativeWords.forEach(word => { if (content.includes(word)) score -= 1.5; });
  return score;
};

async function testAll() {
  try {
    const clients = await Tiers.findAll({ limit: 12 });
    console.log('\n======================================================');
    console.log('   📊 TEST DE SATISFACTION (IA) - ECHANTILLON        ');
    console.log('======================================================\n');
    
    for (const client of clients) {
      const codTiers = client.CodTiers;
      let baseNPS = 10;
      let details = [];
      let hasInteraction = false;

      const claims = await Reclamation.findAll({ where: { CodTiers: codTiers } });
      let claimsPenalty = 0;
      
      if (claims.length > 0) {
        hasInteraction = true;
        for (const claim of claims) {
          claimsPenalty += 1;
          if (claim.Statut?.toLowerCase() !== 'résolu' && claim.Statut?.toLowerCase() !== 'fermé') {
            claimsPenalty += 1;
          }
          const sentiment = calculateSentimentScore(claim.Objet + ' ' + (claim.Description || ''));
          claimsPenalty -= sentiment;
        }
        baseNPS -= claimsPenalty;
        details.push({ factor: 'Reclamations', impact: -claimsPenalty });
      }

      let totalDevis = await DevisMaster.count({ where: { CodTiers: codTiers } });
      let totalFactures = await FavMaster.count({ where: { CodTiers: codTiers } });

      if (totalDevis > 0 || totalFactures > 0) {
         hasInteraction = true;
         let conversionScore = (totalFactures >= totalDevis && totalFactures > 0) ? 1.0 : (totalDevis > 0 ? totalFactures / totalDevis : 0);
         let commercialImpact = 0;
         if (totalFactures > 0) {
             if (claims.length === 0) commercialImpact = 0.5 + (conversionScore * 0.5);
             details.push({ factor: 'Achat', impact: commercialImpact, devis: totalDevis, factures: totalFactures });
         } else if (totalDevis > 0) {
             commercialImpact = -0.5;
             details.push({ factor: 'Achat', impact: commercialImpact, devis: totalDevis, factures: totalFactures });
         }
         baseNPS += commercialImpact;
      }

      if (!hasInteraction) {
        console.log(`👤 Client: ${client.Raisoc || codTiers}`);
        console.log(`   ➡️ Satisfaction : N/A (Nouveau Prospect)`);
        console.log('------------------------------------------------------');
      } else {
        const finalNPS = Math.max(0, Math.min(10, baseNPS));
        console.log(`👤 Client: ${client.Raisoc || codTiers}`);
        console.log(`   ➡️ Satisfaction : ${finalNPS.toFixed(1)} / 10`);
        console.log(`   📝 Facteurs pris en compte :`, JSON.stringify(details));
        console.log('------------------------------------------------------');
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
testAll();
