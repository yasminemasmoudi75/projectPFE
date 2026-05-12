const { User, sequelize } = require('./src/models');
const authController = require('./src/controllers/authController');

async function testLogin() {
  try {
    // Mock req and res
    const req = {
      body: {
        EmailPro: 'test@example.com', // Replace with a real email if known, or just any to see if it reaches the DB
        Password: 'password'
      }
    };
    const res = {
      status: function(s) { this.statusCode = s; return this; },
      json: function(j) { this.body = j; return this; },
      cookie: function() { return this; }
    };
    const next = (err) => { throw err; };

    console.log('Testing login...');
    await authController.login(req, res, next);
    console.log('Response:', res.statusCode, res.body);
  } catch (error) {
    console.error('Captured Error:', error);
  } finally {
    await sequelize.close();
  }
}

testLogin();
