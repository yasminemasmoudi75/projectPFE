const axios = require('axios');

const IA_SERVICE_URL = process.env.IA_SERVICE_URL || 'http://127.0.0.1:8001';

const getForecast = async (limit = 200) => {
  const response = await axios.get(`${IA_SERVICE_URL}/forecast`, {
    params: { limit },
    timeout: 15000,
  });

  return response?.data?.data || [];
};

module.exports = {
  getForecast,
};
