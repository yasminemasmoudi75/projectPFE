const { 
  DevisDetail, DevisMaster, 
  BcvDetail, BcvMaster, 
  FavDetail, FavMaster, 
  Product, User, Objectif,
  Reclamation, Message, Tiers,
  sequelize 
} = require('../models');
const { Op } = require('sequelize');

/**
 * Statistiques sur le rendement des produits (Top produits par CA et Quantité)
 */
exports.getProductYield = async (req, res) => {
  try {
    // On agrège les ventes depuis les factures (FavDetail) car ce sont les ventes réelles
    const yieldData = await FavDetail.findAll({
      attributes: [
        'CodArt',
        'LibArt',
        [sequelize.fn('SUM', sequelize.col('Qt')), 'totalQty'],
        [sequelize.fn('SUM', sequelize.col('MntHT')), 'totalHT'],
      ],
      group: ['CodArt', 'LibArt'],
      order: [[sequelize.fn('SUM', sequelize.col('Qt')), 'DESC']],
      limit: 10
    });

    return res.json({
      status: 'success',
      data: yieldData
    });
  } catch (error) {
    console.error('[getProductYield Error]:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Estimations d'atteinte d'objectifs pour les commerciaux
 * Calcule la probabilité d'atteindre l'objectif basé sur le rythme actuel
 */
exports.getGoalPredictions = async (req, res) => {
  try {
    const objectifs = await Objectif.findAll({
      where: { StatutObjectif: 'ACTIF' },
      include: [{ model: User, as: 'utilisateur', attributes: ['FullName', 'UserID'] }]
    });

    const predictions = objectifs.map(obj => {
      const target = Number(obj.MontantCible) || 0;
      const actual = Number(obj.Montant_Realise_Actuel) || 0;
      
      if (target === 0) return null;

      // Calcul du temps écoulé
      const start = new Date(obj.DateDebut || obj.DateCreation);
      const end = new Date(obj.DateFin);
      const now = new Date();
      
      const totalDuration = end - start;
      const elapsedDuration = now - start;
      
      const timeRatio = Math.max(0.01, Math.min(1, elapsedDuration / totalDuration));
      const achievementRatio = actual / target;
      
      // Estimation linéaire
      const projectedFinal = actual / timeRatio;
      const willReach = projectedFinal >= target;
      const probability = Math.min(100, Math.round((achievementRatio / timeRatio) * 100));

      // Recommandation de produits
      const gap = Math.max(0, target - actual);

      return {
        id: obj.ID_Objectif,
        commercial: obj.utilisateur?.FullName || 'Inconnu',
        target,
        actual,
        probability,
        willReach,
        gap,
        daysRemaining: Math.max(0, Math.round((end - now) / (1000 * 60 * 60 * 24)))
      };
    }).filter(Boolean);

    return res.json({
      status: 'success',
      data: predictions
    });
  } catch (error) {
    console.error('[getGoalPredictions Error]:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Recommandations personnalisées par commercial
 * Quels produits vendre pour combler le gap de l'objectif
 */
exports.getCommercialRecommendations = async (req, res) => {
  try {
    const { commercialId } = req.params;
    
    // 1. Trouver l'utilisateur pour avoir son GUID (IdCont dans Objectif)
    const user = await User.findOne({ where: { UserID: commercialId } });
    
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Utilisateur non trouvé' });
    }

    const obj = await Objectif.findOne({
      where: { IdCont: user.GUID, StatutObjectif: 'ACTIF' }
    });

    if (!obj) {
      return res.json({ status: 'success', message: 'Aucun objectif actif trouvé', data: [] });
    }

    const gap = Math.max(0, Number(obj.MontantCible) - Number(obj.Montant_Realise_Actuel));
    
    // 2. Trouver les produits populaires avec du stock
    // On simule une intelligence : produits les plus vendus globalement qui sont en stock
    const topProducts = await FavDetail.findAll({
      attributes: [
        'CodArt', 'LibArt',
        [sequelize.fn('SUM', sequelize.col('Qt')), 'totalQty'],
        [sequelize.fn('AVG', sequelize.col('PuHT')), 'avgPrice']
      ],
      group: ['CodArt', 'LibArt'],
      order: [[sequelize.fn('SUM', sequelize.col('Qt')), 'DESC']],
      limit: 5
    });

    const recommendations = topProducts.map(p => {
      const price = Number(p.getDataValue('avgPrice')) || 100;
      const qtyNeeded = Math.ceil(gap / price);
      return {
        CodArt: p.CodArt,
        LibArt: p.LibArt,
        avgPrice: price,
        qtyToSell: qtyNeeded,
        potentialCA: qtyNeeded * price
      };
    });

    return res.json({
      status: 'success',
      gap,
      recommendations
    });
  } catch (error) {
    console.error('[getCommercialRecommendations Error]:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Statistiques de satisfaction globale
 */
exports.getGlobalSatisfaction = async (req, res) => {
  try {
    const [totalClaims, resolvedClaims, inProgressClaims, openClaims] = await Promise.all([
      Reclamation.count(),
      Reclamation.count({ where: { Statut: { [Op.in]: ['Résolu', 'Fermé'] } } }),
      Reclamation.count({ where: { Statut: 'En cours' } }),
      Reclamation.count({ where: { Statut: 'Ouvert' } }),
    ]);

    let score;
    if (totalClaims === 0) {
      score = 8.5; // Pas de réclamations = bonne baseline
    } else {
      // Résolu = 1 point, En cours = 0.5 point (pris en charge), Ouvert = 0
      const weighted = ((resolvedClaims + inProgressClaims * 0.5) / totalClaims) * 10;
      score = Math.min(10, Math.max(1, weighted));
    }

    const resolutionRate = totalClaims > 0
      ? Math.round((resolvedClaims / totalClaims) * 100)
      : 100;

    const label = score >= 8 ? 'Excellente'
                : score >= 6 ? 'Bonne'
                : score >= 4 ? 'Moyenne'
                : 'Critique';

    return res.json({
      status: 'success',
      data: {
        score: parseFloat(score.toFixed(1)),
        totalClaims,
        resolvedClaims,
        inProgressClaims,
        openClaims,
        resolutionRate,
        label
      }
    });
  } catch (error) {
    console.error('[getGlobalSatisfaction Error]:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
