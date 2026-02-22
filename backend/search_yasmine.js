const { Product } = require('./src/models');
const { Op } = require('sequelize');

(async () => {
    try {
        const products = await Product.findAll({
            where: {
                LibArt: {
                    [Op.like]: '%yasmine%'
                }
            }
        });
        console.log('--- SEARCH RESULTS FOR "yasmine" ---');
        console.log(JSON.stringify(products, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
