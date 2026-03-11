try {
    const { sequelize } = require('./src/config/database');
    console.log('1. Loading User...');
    const User = require('./src/models/User');
    console.log('2. Loading Message...');
    const Message = require('./src/models/Message');
    console.log('✅ Success!');
} catch (err) {
    console.error('❌ Failed:', err.message);
    console.error(err.stack);
}
