const { User } = require('./src/models');

async function testLogin() {
    try {
        const username = 'anis';
        const password = '00161';
        const user = await User.findOne({ where: { EmailPro: username } });

        console.log('--- Char Code Check ---');
        const dbPwd = user.Password;
        console.log(`DB: ${JSON.stringify(dbPwd)}`);
        for (let i = 0; i < dbPwd.length; i++) {
            console.log(`DB[${i}]: ${dbPwd.charCodeAt(i)} ('${dbPwd[i]}')`);
        }

        console.log('--- Input Check ---');
        for (let i = 0; i < password.length; i++) {
            console.log(`IN[${i}]: ${password.charCodeAt(i)} ('${password[i]}')`);
        }

        console.log('Direct comparison:', dbPwd === password);
        console.log('Trimmed comparison:', dbPwd.trim() === password);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testLogin();
