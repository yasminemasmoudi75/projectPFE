const { User, sequelize } = require('./src/models');

async function findUser() {
    try {
        await sequelize.authenticate();
        const user = await User.findOne();
        if (user) {
           console.log('Valid UserID:', user.UserID);
        } else {
           console.log('No users found');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}
findUser();
