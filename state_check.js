const { BcvMaster, BlvMaster, FavMaster, sequelize } = require('./src/models');
const fs = require('fs');

const check = async () => {
    let out = '';
    try {
        const bcvTransferred = await BcvMaster.count({ where: { bTransf: true } });
        const bcvNotTransferred = await BcvMaster.count({ where: { bTransf: false } });
        const totalBlv = await BlvMaster.count();
        const totalFav = await FavMaster.count();

        out += `=== ÉTAT DE LA BASE ===\n`;
        out += `BCV transférés (bTransf=true): ${bcvTransferred}\n`;
        out += `BCV non transférés (bTransf=false): ${bcvNotTransferred}\n`;
        out += `Total BL (TabBlvm): ${totalBlv}\n`;
        out += `Total FA (TabFavm): ${totalFav}\n`;

        // Voir les BCVs récemment transférés
        const recent = await BcvMaster.findAll({
            where: { bTransf: true },
            order: [['DatUser', 'DESC']],
            limit: 5,
            attributes: ['Guid', 'Nf', 'LibTiers', 'DatUser', 'bTransf'],
            raw: true
        });
        out += `\nBCVs marqués transférés:\n`;
        recent.forEach(r => {
            out += `  Nf:${r.Nf} Client:${r.LibTiers || 'N/A'} Date:${r.DatUser}\n`;
        });

    } catch (err) {
        out += `Error: ${err.message}\n`;
    } finally {
        fs.writeFileSync('state_check.txt', out, 'utf8');
        console.log('Done. See state_check.txt');
        await sequelize.close();
    }
};
check();
