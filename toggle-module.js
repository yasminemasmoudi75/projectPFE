const { sequelize } = require('./src/models');

/**
 * Script pour tester les permissions
 * Usage: node toggle-module.js <codMod> [0|1]
 * 
 * Exemples:
 *   node toggle-module.js 4      // Toggle Module Devis
 *   node toggle-module.js 4 0    // Disable Module Devis
 *   node toggle-module.js 4 1    // Enable Module Devis
 *   node toggle-module.js 30     // Toggle Module Client
 */

const args = process.argv.slice(2);
const codMod = parseInt(args[0]);
const newActif = args[1] ? parseInt(args[1]) : null;

if (!codMod || isNaN(codMod)) {
  console.log('\n❌ Usage: node toggle-module.js <codMod> [0|1]');
  console.log('   codMod: Module code to modify');
  console.log('   0/1: Optional - Set to 0 (disable) or 1 (enable). If omitted, toggle current state\n');
  console.log('Module codes:');
  console.log('   3 = Module Projets');
  console.log('   4 = Module Devis');
  console.log('   5 = Module Commande');
  console.log('   6 = Module Livraison');
  console.log('   7 = Module Facture');
  console.log('   30 = Module Client');
  console.log('   31 = Module Reglement');
  console.log('   40 = Module Tournée');
  console.log('   41 = Module Chargement');
  console.log('   42 = Module Objectif');
  console.log('   43 = Module Recap');
  console.log('   44 = Module Relevé');
  console.log('   45 = Module Visite');
  console.log('   46 = Stock');
  console.log('   47 = soldeClient');
  console.log('   52 = Maps\n');
  process.exit(1);
}

(async () => {
  try {
    // Get current state
    const current = await sequelize.query(
      'SELECT CodMod, LibMod, Actif FROM TabAWProfileAccess WHERE ProfileUser=\'Admin\' AND CodMod=:codMod',
      { 
        replacements: { codMod },
        type: sequelize.QueryTypes.SELECT 
      }
    );

    if (!current || current.length === 0) {
      console.log(`\n❌ Module ${codMod} not found for Admin\n`);
      process.exit(1);
    }

    const module = current[0];
    const currentActif = module.Actif ? 1 : 0;
    const targetActif = newActif !== null ? newActif : (currentActif === 0 ? 1 : 0);

    if (currentActif === targetActif) {
      console.log(`\n⚠️  Module ${codMod} (${module.LibMod}) is already ${targetActif === 1 ? 'ENABLED' : 'DISABLED'}\n`);
      process.exit(0);
    }

    console.log(`\n🔧 Modifying Module ${codMod} (${module.LibMod})...`);
    console.log(`   Current Actif: ${currentActif}  →  New Actif: ${targetActif}\n`);

    // Update
    await sequelize.query(
      'UPDATE TabAWProfileAccess SET Actif=:actif WHERE ProfileUser=\'Admin\' AND CodMod=:codMod',
      { 
        replacements: { codMod, actif: targetActif },
        type: sequelize.QueryTypes.UPDATE 
      }
    );

    console.log(`✅ ${targetActif === 1 ? 'ENABLED' : 'DISABLED'} Module ${codMod} (${module.LibMod})\n`);

    // Show all Admin modules
    const result = await sequelize.query(
      'SELECT CodMod, LibMod, Actif FROM TabAWProfileAccess WHERE ProfileUser=\'Admin\' ORDER BY CodMod',
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('📊 All Admin modules now:');
    result.forEach(r => {
      const status = r.Actif ? '✅' : '❌';
      console.log(`   ${status} CodMod: ${String(r.CodMod).padEnd(3)} - ${r.LibMod}`);
    });
    console.log('');

    process.exit(0);
  } catch(err) {
    console.error('\n❌ Error:', err.message, '\n');
    process.exit(1);
  }
})();
