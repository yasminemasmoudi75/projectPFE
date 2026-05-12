const { User, sequelize } = require('../src/models');
const userController = require('../src/controllers/userController');

async function testGetAllUsers() {
  try {
    const req = {
      query: {},
      user: { UserID: 14, UserRole: 'Admin' } // Mock an admin user
    };
    const res = {
      status: function(s) { this.statusCode = s; return this; },
      json: function(j) { this.body = j; return this; }
    };
    const next = (err) => { throw err; };

    console.log('Testing getAllUsers...');
    await userController.getAllUsers(req, res, next);
    console.log('Response:', res.statusCode, JSON.stringify(res.body, null, 2).substring(0, 500));
  } catch (error) {
    console.error('Captured Error:', error);
  } finally {
    await sequelize.close();
  }
}

testGetAllUsers();
