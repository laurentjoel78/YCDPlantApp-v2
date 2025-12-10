const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: false
});

async function check() {
    // List all tables
    const [tables] = await sequelize.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
    );
    console.log('Total tables:', tables.length);
    for (const t of tables) {
        console.log(' -', t.tablename);
    }

    // Check SequelizeMeta
    try {
        const [meta] = await sequelize.query('SELECT * FROM "SequelizeMeta"');
        console.log('\nMigrations run:', meta.length);
        for (const m of meta) {
            console.log(' -', m.name);
        }
    } catch (e) {
        console.log('SequelizeMeta error:', e.message);
    }

    await sequelize.close();
}

check().catch(e => console.error('Error:', e.message));
