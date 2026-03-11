const { User } = require('./src/models');
require('dotenv').config();

(async () => {
    try {
        const users = await User.findAll({ limit: 5 });
        console.log('--- USERS ---');
        users.forEach(u => {
            console.log(`ID: ${u.UserID}, Login: ${u.LoginName}, Role: ${u.UserRole}`);
        });
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
})();
