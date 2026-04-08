const { getForecast } = require('../services/iaProxyService');

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
