const { sequelize } = require('./src/models');

async function migrate() {
    const transaction = await sequelize.transaction();
    try {
        console.log('--- Starting Migration: TiersGouvernorat ---');

        // 1. Create table
        await sequelize.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tiersGouvernorat')
            BEGIN
                CREATE TABLE tiersGouvernorat (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    libelle NVARCHAR(50) NOT NULL
                );
            END
        `, { transaction });
        console.log('✅ Table tiersGouvernorat created.');

        // 2. Insert data (Using a check to avoid duplicates if script re-runs)
        const governorates = [
            'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa',
            'Jendouba', 'Kairouan', 'Kasserine', 'Kébili', 'Le Kef', 'Mahdia',
            'Manouba', 'Médenine', 'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid',
            'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan'
        ];

        for (const lib of governorates) {
            await sequelize.query(`
                IF NOT EXISTS (SELECT * FROM tiersGouvernorat WHERE libelle = :lib)
                BEGIN
                    INSERT INTO tiersGouvernorat (libelle) VALUES (:lib);
                END
            `, { replacements: { lib }, transaction });
        }
        console.log('✅ Governorates inserted.');

        // 3. Rename old column and add new one
        // Check if gouvernorat_old already exists to avoid errors on retry
        const [columns] = await sequelize.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TabTiers' AND COLUMN_NAME = 'gouvernorat_old'
        `, { transaction });

        if (columns.length === 0) {
            await sequelize.query(`EXEC sp_rename 'TabTiers.gouvernorat', 'gouvernorat_old', 'COLUMN'`, { transaction });
            console.log('✅ Renamed gouvernorat to gouvernorat_old.');

            await sequelize.query(`ALTER TABLE TabTiers ADD gouvernorat INT`, { transaction });
            console.log('✅ Added new gouvernorat INT column.');

            // 4. Migration of data
            await sequelize.query(`
                UPDATE T
                SET T.gouvernorat = G.id
                FROM TabTiers T
                INNER JOIN tiersGouvernorat G ON T.gouvernorat_old = G.libelle
            `, { transaction });
            console.log('✅ Data migrated from old column to new column.');

            // 5. Add FK
            await sequelize.query(`
                ALTER TABLE TabTiers 
                ADD CONSTRAINT FK_TabTiers_tiersGouvernorat 
                FOREIGN KEY (gouvernorat) REFERENCES tiersGouvernorat(id)
            `, { transaction });
            console.log('✅ Foreign Key constraint added.');
        } else {
            console.log('ℹ️ Migration already performed or column gouvernorat_old exists.');
        }

        await transaction.commit();
        console.log('--- Migration Completed Successfully ---');
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('❌ Migration Failed:', error.message);
        process.exit(1);
    }
}

migrate();
