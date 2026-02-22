const { Product } = require('./src/models');

(async () => {
    try {
        const id = 'F5CB200B-F7BC-4396-AB7A-DC5DEE15FCA7'; // ID for yasmine
        const result = await Product.update(
            { urlimg: '/uploads/products/prod-1771721769920-22776815.png' },
            { where: { IDArt: id } }
        );
        console.log('Update result:', result);
        const updated = await Product.findByPk(id);
        console.log('Updated product urlimg:', updated.urlimg);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
