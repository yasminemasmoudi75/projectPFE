const { sequelize } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function apply() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'add_user_profile_columns.sql'), 'utf8');
    console.log('🚀 Applying SQL script...');
    
    // Split script by GO or execute as block if simple
    // Sequelize handles multiple statements if allowed by driver, but better to be safe
    await sequelize.query(sql);
    
    console.log('✅ SQL script applied successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error applying SQL script:', err);
    process.exit(1);
  }
}

apply();
