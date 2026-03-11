const { sequelize } = require('./src/config/database');
console.log('Sequelize:', typeof sequelize);
try {
    const Devis = require('./src/models/DevisMaster');
    console.log('Devis loaded successfully');
} catch (err) {
    console.error('Error loading Devis:', err.message);
    console.error(err.stack);
}
