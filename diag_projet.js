try {
    const { sequelize } = require('./src/config/database');
    console.log('1. Loading User/Message...');
    require('./src/models/User');
    require('./src/models/Message');
    console.log('2. Loading Projet...');
    const Projet = require('./src/models/Projet');
    console.log('✅ Success!');
} catch (err) {
    console.error('❌ Failed:', err.message);
    console.error(err.stack);
}
