const { Product } = require('./src/models');

(async () => {
    try {
        const products = await Product.findAll({
            order: [['IDArt', 'DESC']],
            limit: 5
        });
        console.log('--- LATEST 5 PRODUCTS ---');
        console.log(JSON.stringify(products, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
