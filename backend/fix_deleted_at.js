require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: console.log
});

async function fixDeletedAtColumn() {
    try {
        console.log('Fixing deletedAt column in wallets table...');

        // Rename deleted_at to deletedAt
        await sequelize.query('ALTER TABLE wallets RENAME COLUMN deleted_at TO "deletedAt"');

        console.log('✅ Column renamed to deletedAt successfully!');

    } catch (error) {
        if (error.message.includes('does not exist')) {
            console.log('Column deleted_at does not exist, adding deletedAt...');
            await sequelize.query('ALTER TABLE wallets ADD COLUMN "deletedAt" TIMESTAMP');
            console.log('✅ deletedAt column added successfully!');
        } else {
            console.error('Error:', error.message);
        }
    } finally {
        await sequelize.close();
    }
}

fixDeletedAtColumn();
