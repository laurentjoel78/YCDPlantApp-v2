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
    logging: false
});

async function runMigrations() {
    try {
        await sequelize.authenticate();
        console.log('Connected to Neon database');

        const queryInterface = sequelize.getQueryInterface();

        // Ensure SequelizeMeta exists
        try {
            await queryInterface.createTable('SequelizeMeta', {
                name: {
                    type: Sequelize.STRING,
                    primaryKey: true,
                    allowNull: false
                }
            });
            console.log('Created SequelizeMeta table');
        } catch (e) {
            if (e.message && e.message.includes('already exists')) {
                console.log('SequelizeMeta already exists');
            } else {
                throw e;
            }
        }

        // Get executed migrations
        const [executed] = await sequelize.query('SELECT name FROM "SequelizeMeta"');
        const executedNames = new Set(executed.map(r => r.name));
        console.log('Already executed:', executedNames.size, 'migrations');

        const migrationsDir = path.join(__dirname, 'migrations');
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.js')).sort();

        console.log('Found', files.length, 'migration files');

        for (const file of files) {
            if (executedNames.has(file)) {
                console.log('SKIP:', file);
                continue;
            }

            console.log('RUN:', file);
            try {
                const migration = require(path.join(migrationsDir, file));
                await migration.up(queryInterface, Sequelize);

                await sequelize.query(
                    'INSERT INTO "SequelizeMeta" (name) VALUES ($1)',
                    { bind: [file], type: Sequelize.QueryTypes.INSERT }
                );
                console.log('OK:', file);
            } catch (err) {
                console.error('FAIL:', file);
                console.error('Error:', err.message);
                if (err.parent) {
                    console.error('SQL Error:', err.parent.message);
                }
                process.exit(1);
            }
        }

        console.log('All migrations completed successfully!');

        // Verify tables
        const [tables] = await sequelize.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
        );
        console.log('Created', tables.length, 'tables:');
        tables.forEach(t => console.log(' -', t.table_name));

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error.message);
        if (error.parent) {
            console.error('SQL Error:', error.parent.message);
        }
        process.exit(1);
    }
}

runMigrations();
