const axios = require('axios');

const IA_SERVICE_URL = process.env.IA_SERVICE_URL || 'http://127.0.0.1:5000';

// 24 gouvernorats tunisiens — noms canoniques attendus par le modèle ML
const REGIONS_TN = [
  'ARIANA', 'BEJA', 'BEN_AROUS', 'BIZERTE', 'GABES',
  'GAFSA', 'JENDOUBA', 'KAIROUAN', 'KASSERINE', 'KEBILI',
  'LE_KEF', 'MAHDIA', 'MANOUBA', 'MEDENINE', 'MONASTIR',
  'NABEUL', 'SFAX', 'SIDI_BOUZID', 'SILIANA', 'SOUSSE',
  'TATAOUINE', 'TOZEUR', 'TUNIS', 'ZAGHOUAN',
];

/**
 * Appelle l'API Flask ML (/api/batch-predict) pour les 24 régions.
 * Retourne un tableau de résultats contenant pour chaque région :
 *   region, prediction, recommandation, confiance,
 *   probabilite_hausse, probabilite_baisse,
 *   variation_estimee, variation_label,
 *   region_data (population, indice_achat, nb_hopitaux, nb_laboratoires)
 */
const getForecast = async () => {
  const now = new Date();
  const trimestre = Math.ceil((now.getMonth() + 1) / 3);
  const year = now.getFullYear();

  const response = await axios.post(
    `${IA_SERVICE_URL}/api/batch-predict`,
    { regions: REGIONS_TN, trimestre, year },
    { timeout: 30000 }
  );

  return response?.data?.results || [];
};

module.exports = { getForecast };
