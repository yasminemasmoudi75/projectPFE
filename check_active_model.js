const { Objectif, User } = require('./src/models');

(async () => {
    try {
        const result = await Objectif.findAll({
            limit: 1,
            include: [{ model: User, as: 'utilisateur', attributes: ['UserID'] }]
        });
        console.log('--- DB CHECK ---');
        console.log('Success, found:', result.length);
        if (result.length > 0) {
            console.log('Model instance keys:', Object.keys(result[0].dataValues));
        }
    } catch (err) {
        console.error('--- DB CHECK FAILED ---');
        console.error(err.message);
    }
})();
