const { Objectif } = require('./src/models');

async function testObjectif() {
    try {
        console.log('Testing Objectif model...');
        const result = await Objectif.findOne();
        console.log('Query result:', result ? 'Found data' : 'Table empty but query successful');
        process.exit(0);
    } catch (err) {
        console.error('Test failed:', err.message);
        process.exit(1);
    }
}

testObjectif();
