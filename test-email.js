const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { verifyAuthEmailTransport } = require('./src/utils/emailService');

async function test() {
  console.log('🧪 Testing Email Transport...');
  const result = await verifyAuthEmailTransport();
  console.log('Result:', result);
  process.exit(result.ok ? 0 : 1);
}

test();
