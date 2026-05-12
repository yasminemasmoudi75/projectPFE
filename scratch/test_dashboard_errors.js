const { sequelize } = require('../src/config/database');

async function testEndpoints() {
  // Test 1: goal-predictions - check what dashboardStatController does
  try {
    const ctrl = require('../src/controllers/dashboardStatController');
    const req = { user: { UserID: 14, UserRole: 'Admin', GUID: null } };
    const res = {
      status: function(s) { this.statusCode = s; return this; },
      json: function(j) { this.body = j; return this; }
    };
    const next = (err) => { console.error('❌ goal-predictions ERROR:', err.message); };
    await ctrl.getGoalPredictions(req, res, next);
    console.log('✅ goal-predictions:', res.statusCode);
  } catch (e) {
    console.error('❌ goal-predictions CRASH:', e.message);
  }

  // Test 2: objectifs
  try {
    const ctrl = require('../src/controllers/objectifController');
    const req = { user: { UserID: 14, UserRole: 'Admin', GUID: null }, query: {}, permissions: {} };
    const res = {
      status: function(s) { this.statusCode = s; return this; },
      json: function(j) { this.body = j; return this; }
    };
    const next = (err) => { console.error('❌ objectifs ERROR:', err.message); };
    await ctrl.getAllObjectifs(req, res, next);
    console.log('✅ objectifs:', res.statusCode);
  } catch (e) {
    console.error('❌ objectifs CRASH:', e.message);
  }

  // Test 3: tiers
  try {
    const ctrl = require('../src/controllers/tiersController');
    const req = { user: { UserID: 14, UserRole: 'Admin', GUID: null }, query: {} };
    const res = {
      status: function(s) { this.statusCode = s; return this; },
      json: function(j) { this.body = j; return this; }
    };
    const next = (err) => { console.error('❌ tiers ERROR:', err.message); };
    await ctrl.getAllTiers(req, res, next);
    console.log('✅ tiers:', res.statusCode);
  } catch (e) {
    console.error('❌ tiers CRASH:', e.message);
  }

  await sequelize.close();
}

testEndpoints();
