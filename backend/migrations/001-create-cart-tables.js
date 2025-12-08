const { sequelize } = require('../models');

/**
 * Migration to create cart and cart_items tables
 * Run with: node migrations/001-create-cart-tables.js
 */

async function createCartTables() {
    console.log('Starting migration: Create cart tables...');

    try {
        // Create carts table
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
        console.log('✓ Created carts table');

        // Create indexes for carts
        await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
    `);
        await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_carts_status ON carts(status);
    `);
        console.log('✓ Created carts indexes');

        // Create cart_items table
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
        price_at_add DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
        console.log('✓ Created cart_items table');

        // Create indexes for cart_items
        await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
    `);
        await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
    `);
        console.log('✓ Created cart_items indexes');

        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

async function enhanceOrdersTable() {
    console.log('\nEnhancing orders table...');

    try {
        // Add new columns to orders table if they don't exist
        await sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='orders' AND column_name='delivery_address') THEN
          ALTER TABLE orders ADD COLUMN delivery_address JSONB;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='orders' AND column_name='payment_reference') THEN
          ALTER TABLE orders ADD COLUMN payment_reference VARCHAR(255);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='orders' AND column_name='paid_at') THEN
          ALTER TABLE orders ADD COLUMN paid_at TIMESTAMP;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='orders' AND column_name='metadata') THEN
          ALTER TABLE orders ADD COLUMN metadata JSONB;
        END IF;
      END $$;
    `);
        console.log('✓ Enhanced orders table');
    } catch (error) {
        console.error('❌ Orders table enhancement failed:', error);
        throw error;
    }
}

async function enhanceConsultationsTable() {
    console.log('\nEnhancing consultations table for ratings...');

    try {
        // Add columns if they don't exist
        await sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='consultations' AND column_name='rated_at') THEN
          ALTER TABLE consultations ADD COLUMN rated_at TIMESTAMP;
        END IF;
      END $$;
    `);
        console.log('✓ Enhanced consultations table');
    } catch (error) {
        console.error('❌ Consultations table enhancement failed:', error);
        throw error;
    }
}

// Run migrations
async function runMigrations() {
    try {
        await createCartTables();
        await enhanceOrdersTable();
        await enhanceConsultationsTable();

        console.log('\n🎉 All migrations completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n💥 Migration failed:', error);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    runMigrations();
}

module.exports = { createCartTables, enhanceOrdersTable, enhanceConsultationsTable };
