const { BlvMaster, FavMaster, sequelize } = require('./src/models');
const fs = require('fs');

const checkDb = async () => {
    try {
        const blvs = await BlvMaster.findAll({ order: [['DatUser', 'DESC']], limit: 2 });
        const favs = await FavMaster.findAll({ order: [['DatUser', 'DESC']], limit: 2 });

        let out = '✅ Top BLV:\n';
        blvs.forEach(b => out += `- Guid: ${b.Guid}, Nf: ${b.Nf}, DatUser: ${b.DatUser}, Type: ${typeof b.Guid}\n`);

        out += '\n✅ Top FAV:\n';
        favs.forEach(f => out += `- Guid: ${f.Guid}, Nf: ${f.Nf}, DatUser: ${f.DatUser}, Type: ${typeof f.Guid}\n`);

        fs.writeFileSync('top2.txt', out, 'utf8');
        console.log('Done!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sequelize.close();
    }
};

checkDb();
