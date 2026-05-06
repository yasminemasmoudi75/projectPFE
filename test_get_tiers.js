const { getAllTiers } = require('./src/controllers/tiersController');
const { sequelize } = require('./src/config/database');

// Mock req, res, next
const req = {
    query: { sort: 'recent', limit: '10' },
    user: { UserID: 1, UserRole: 'Admin' }
};
const res = {
    status: (code) => ({
        json: (data) => console.log('Response:', code, JSON.stringify(data, null, 2))
    }),
    json: (data) => console.log('Response:', 200, JSON.stringify(data, null, 2))
};
const next = (err) => {
    console.error('Error passed to next():', err);
    process.exit(1);
};

async function test() {
    try {
        console.log('Testing getAllTiers...');
        await getAllTiers(req, res, next);
        console.log('Success!');
        process.exit(0);
    } catch (e) {
        console.error('Caught error:', e);
        process.exit(1);
    }
}

test();
