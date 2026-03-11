try {
    console.log('1. Loading sequelize...');
    const { sequelize } = require('./src/config/database');

    console.log('2. Loading models individually...');
    require('./src/models/User');
    require('./src/models/Message');
    require('./src/models/Projet');
    require('./src/models/Activite');
    require('./src/models/Objectif');
    require('./src/models/Tiers');
    require('./src/models/Product');
    require('./src/models/Category');
    require('./src/models/Collection');
    require('./src/models/DevisMaster');
    require('./src/models/DevisDetail');
    require('./src/models/BcvMaster');
    require('./src/models/BcvDetail');
    require('./src/models/Reclamation');
    require('./src/models/TabDI');
    require('./src/models/TabBT');

    console.log('3. Loading index.js (associations)...');
    require('./src/models/index');

    console.log('✅ All models and associations loaded successfully!');
} catch (err) {
    console.error('❌ Failed at step:', err.message);
    console.error(err.stack);
}
