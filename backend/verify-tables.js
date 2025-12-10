const { Sequelize } = require('sequelize');

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

async function verifyTables() {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
        );
        console.log('✅ Connection Successful');
        console.log(`📊 Found ${results.length} tables:`);
        results.forEach(r => console.log(` - ${r.table_name}`));

        if (results.length > 30) {
            console.log('✅ MIGRATION SUCCESSFUL! (Expected ~40 tables)');
        } else {
            console.log('⚠️  MIGRATION INCOMPLETE?');
        }
    } catch (error) {
        console.error('❌ Verification Failed:', error);
    } finally {
        await sequelize.close();
    }
}

verifyTables();
