const { DataTypes } = require('sequelize');
const { sequelize } = require('./src/config/database');

// Define model directly here to avoid any index.js pollution
const Product = sequelize.define('ProductTEST', {
    IDArt: { type: DataTypes.UUID, primaryKey: true, field: 'IDArt' },
    CodArt: { type: DataTypes.STRING, field: 'CodArt' },
    LibArt: { type: DataTypes.STRING, field: 'LibArt' }
}, {
    tableName: 'TabStock',
    timestamps: false
});

async function test() {
    try {
        const p = await Product.findOne();
        console.log('✅ Minimal Product query OK');
        process.exit(0);
    } catch (err) {
        console.error('❌ Minimal query FAILED:', err);
        process.exit(1);
    }
}

test();
