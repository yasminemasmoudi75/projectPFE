const { User, sequelize } = require('./src/models');
const bcrypt = require('bcryptjs');
const { allocateNextUserId, ensureUserHasUserId } = require('./src/utils/userId');
const { upsertAdminAccess, resolveUserAccess } = require('./src/utils/userAccess');

async function createAdmin() {
    let transaction;

    try {
        const email = 'nexus@pfe.com';
        const password = 'Admin@123';
        transaction = await sequelize.transaction();

        // Hash password just in case, though the system supports both now.
        // The previous authController modification allows plain text, but hashing is safer if we ever switch back.
        // Let's store it as plain text first to match how ERP might do it, or hashed. 
        // Wait, the authController checks both. Let's hash it since this is our app creating it.
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if user already exists
        let existingUser = await User.findOne({ where: { EmailPro: email }, transaction });
        if (existingUser) {
            console.log('Utilisateur existe déjà. Mise à jour du mot de passe...');
            existingUser.Password = hashedPassword;
            existingUser.FullName = 'Admin Nexus';
            await existingUser.save({ transaction });
            await ensureUserHasUserId(User, existingUser, { transaction });
            existingUser = await User.findOne({ where: { EmailPro: email }, transaction });
            console.log('✅ Utilisateur admin mis à jour avec succès.');
        } else {
            console.log('Création du nouvel utilisateur admin...');
            const nextUserId = await allocateNextUserId({ transaction });
            existingUser = await User.create({
                UserID: nextUserId,
                LoginName: email,      // Mapped to USER_NAME in DB
                EmailPro: email,       // Also mapped to USER_NAME in DB (Virtual/Alias)
                Password: hashedPassword,
                FullName: 'Admin Nexus',
                IsActive: true
            }, { transaction });
            console.log('✅ Utilisateur admin créé avec succès.');
        }

        await upsertAdminAccess(existingUser.UserID, { transaction });
        const access = await resolveUserAccess(existingUser.UserID, 'Admin', { transaction });
        await transaction.commit();

        console.log(`✅ Accès administrateur synchronisé. Rôle actuel: ${access.role}`);
        process.exit(0);
    } catch (err) {
        if (transaction) {
            await transaction.rollback();
        }
        console.error('❌ Erreur lors de la création:', err);
        process.exit(1);
    }
}

createAdmin();
