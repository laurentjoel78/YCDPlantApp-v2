require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: console.log
});

async function addMissingColumns() {
    try {
        console.log('Adding missing columns to database tables...\n');

        // Add expert_id to wallets table
        try {
            await sequelize.query('ALTER TABLE wallets ADD COLUMN expert_id UUID REFERENCES users(id) ON DELETE SET NULL');
            console.log('✅ Added expert_id to wallets');
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log('⏩ expert_id already exists in wallets');
            } else {
                console.log('⚠️ wallets.expert_id:', e.message);
            }
        }

        // Create index on expert_id
        try {
            await sequelize.query('CREATE INDEX idx_wallets_expert_id ON wallets(expert_id)');
            console.log('✅ Created index on wallets.expert_id');
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log('⏩ Index already exists');
            }
        }

        console.log('\n✅ All missing columns added!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

addMissingColumns();
