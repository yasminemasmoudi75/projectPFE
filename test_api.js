const axios = require('axios');

async function testApi() {
  try {
    console.log('Testing /api/users...');
    const res1 = await axios.get('http://localhost:3066/api/users');
    console.log('Users Response:', res1.status);
  } catch (error) {
    console.error('Users Error:', error.response?.status, error.response?.data);
  }

  try {
    console.log('Testing /api/objectifs...');
    const res2 = await axios.get('http://localhost:3066/api/objectifs');
    console.log('Objectifs Response:', res2.status);
  } catch (error) {
    console.error('Objectifs Error:', error.response?.status, error.response?.data);
  }
}

testApi();
