
require('dotenv').config();
const emailService = require('./src/utils/emailService');

async function test() {
  console.log('🔍 Testing Email Transport...');
  const result = await emailService.verifyAuthEmailTransport();
  console.log('Result:', result);
  
  if (result.ok) {
    console.log('✅ SMTP connection is valid!');
  } else {
    console.log('❌ SMTP connection failed:', result.reason);
    if (result.code) console.log('Error Code:', result.code);
    if (result.responseCode) console.log('Response Code:', result.responseCode);
  }
}

test();
