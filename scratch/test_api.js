const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://localhost:3066/api/projets?limit=10', {
        headers: {
            'Authorization': 'Bearer YOUR_TOKEN_HERE' // I don't have a token
        }
    });
    console.log(res.data);
  } catch (err) {
    if (err.response) {
      console.log('Status:', err.response.status);
      console.log('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.log('Error:', err.message);
    }
  }
}

test();
