const { BlvMaster, BcvMaster, sequelize } = require('./src/models');
const { Op } = require('sequelize');
const fs = require('fs');

const diagnose = async () => {
    let out = '';
    try {
        // Check total BLV count
        const totalBlv = await BlvMaster.count();
        out += `Total TabBlvm records: ${totalBlv}\n\n`;

        // Check BCV bTransf values
        const bcvStats = await BcvMaster.findAll({
            attributes: ['bTransf'],
            group: ['bTransf'],
            raw: true
        });
        out += `BCV bTransf distribution: ${JSON.stringify(bcvStats)}\n\n`;

        // Test the exact getAllBlv query
        const { count, rows } = await BlvMaster.findAndCountAll({
            where: {},
            order: [['DatUser', 'DESC']],
            limit: 5,
            offset: 0,
        });
        out += `getAllBlv returns ${count} total, first 5:\n`;
        rows.forEach(r => {
            out += `  Nf:${r.Nf} Guid:${r.Guid?.substring(0, 8)} bTransf:${r.bTransf} Valid:${r.Valid}\n`;
        });

        // Test getAllBcv with the new bTransf:false filter
        const { Op: OpX } = require('sequelize');
        const { count: bcvCount, rows: bcvRows } = await BcvMaster.findAndCountAll({
            where: { bTransf: false },
            order: [['DatUser', 'DESC']],
            limit: 5,
            offset: 0
        });
        out += `\nBCV bTransf=false: ${bcvCount} records\n`;

        const bcvNullCount = await BcvMaster.count({ where: { bTransf: null } });
        out += `BCV bTransf=null: ${bcvNullCount} records\n`;

        const bcvTrueCount = await BcvMaster.count({ where: { bTransf: true } });
        out += `BCV bTransf=true: ${bcvTrueCount} records\n`;

    } catch (err) {
        out += `Error: ${err.message}\n`;
    } finally {
        fs.writeFileSync('diagnose.txt', out, 'utf8');
        console.log('Done. See diagnose.txt');
        await sequelize.close();
    }
};

diagnose();
