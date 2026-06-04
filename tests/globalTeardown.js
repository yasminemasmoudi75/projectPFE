const fs = require('fs');
const path = require('path');

module.exports = async () => {
  const tokenFile = path.join(__dirname, '../.test-auth.json');
  if (fs.existsSync(tokenFile)) fs.unlinkSync(tokenFile);
};
