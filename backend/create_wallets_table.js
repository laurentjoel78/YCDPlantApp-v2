require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: console.log
});

async function createWalletsTable() {
    try {
        console.log('Creating wallets table...');

        // Check if table exists
        const [results] = await sequelize.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'wallets'
            );
        `);

        if (results[0].exists) {
            console.log('✅ wallets table already exists');
            return;
        }

        // Create the wallets table
        await sequelize.query(`
            CREATE TABLE wallets (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
                currency VARCHAR(3) NOT NULL DEFAULT 'XAF',
                wallet_type VARCHAR(50) NOT NULL,
                daily_transaction_limit DECIMAL(10, 2) NOT NULL DEFAULT 1000000.00,
                single_transaction_limit DECIMAL(10, 2) NOT NULL DEFAULT 500000.00,
                pending_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
                total_received DECIMAL(10, 2) NOT NULL DEFAULT 0,
                total_spent DECIMAL(10, 2) NOT NULL DEFAULT 0,
                last_transaction_date TIMESTAMP,
                verification_level VARCHAR(50) NOT NULL DEFAULT 'basic',
                verification_documents JSONB,
                wallet_settings JSONB DEFAULT '{"notifications":{"low_balance":true,"transaction_alerts":true},"security":{"require_2fa":false,"allow_mobile_money":true,"allow_bank_transfer":true}}',
                security_pin VARCHAR(255),
                status VARCHAR(50) NOT NULL DEFAULT 'active',
                suspension_reason VARCHAR(255),
                last_balance_update TIMESTAMP NOT NULL DEFAULT NOW(),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                deleted_at TIMESTAMP
            );
        `);

        // Create indexes
        await sequelize.query(`CREATE INDEX idx_wallets_user_id ON wallets(user_id);`);
        await sequelize.query(`CREATE INDEX idx_wallets_wallet_type ON wallets(wallet_type);`);
        await sequelize.query(`CREATE INDEX idx_wallets_status ON wallets(status);`);

        console.log('✅ wallets table created successfully!');

    } catch (error) {
        console.error('Error creating wallets table:', error);
    } finally {
        await sequelize.close();
    }
}

createWalletsTable();
