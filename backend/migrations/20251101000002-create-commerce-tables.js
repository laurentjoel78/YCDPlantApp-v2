'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Create Orders table
        await queryInterface.createTable('orders', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            buyer_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users', // strict reference to Users table
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            seller_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            total_amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM(
                    'pending',
                    'processing',
                    'shipped',
                    'delivered',
                    'cancelled'
                ),
                defaultValue: 'pending'
            },
            payment_status: {
                type: Sequelize.ENUM(
                    'pending',
                    'paid',
                    'failed',
                    'refunded'
                ),
                defaultValue: 'pending'
            },
            shipping_address: {
                type: Sequelize.JSONB,
                allowNull: false
            },
            tracking_number: {
                type: Sequelize.STRING,
                allowNull: true
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            // Fields from 001-create-cart-tables.js enhancement (adding them directly here for cleanness)
            delivery_address: {
                type: Sequelize.JSONB
            },
            payment_reference: {
                type: Sequelize.STRING(255)
            },
            paid_at: {
                type: Sequelize.DATE
            },
            metadata: {
                type: Sequelize.JSONB
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Create EscrowAccounts table
        await queryInterface.createTable('escrow_accounts', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            order_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'orders',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            buyer_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            seller_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            funding_transaction_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'Transactions', // from 2025...02 migration
                    key: 'id'
                }
            },
            release_transaction_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'Transactions',
                    key: 'id'
                }
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            currency: {
                type: Sequelize.STRING(3),
                defaultValue: 'XAF',
                allowNull: false
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: 'awaiting_deposit',
                allowNull: false
            },
            release_conditions: {
                type: Sequelize.JSONB,
                allowNull: false
            },
            commission_rate: {
                type: Sequelize.DECIMAL(4, 2),
                allowNull: false,
                defaultValue: 2.50
            },
            commission_amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0
            },
            dispute_reason: {
                type: Sequelize.STRING,
                allowNull: true
            },
            disputed_by: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            dispute_resolution: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            admin_notes: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            released_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            expires_at: {
                type: Sequelize.DATE,
                allowNull: false
            },
            last_status_change: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            metadata: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            deleted_at: {
                type: Sequelize.DATE
            }
        });

        // Create PriceHistory table
        await queryInterface.createTable('price_histories', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            product_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'MarketProducts', // from 2025...02 (Watch out: MarketProducts vs products)
                    // Model says references 'market_products', so let's stick to the tableName string
                    // wait, PriceHistory.js says references 'market_products'.
                    // Migration 002 created 'MarketProducts' (PascalCase).
                    // Postgres will likely treat "MarketProducts" (quoted) distinct from "market_products" (unquoted).
                    // If 002 used queryInterface.createTable('MarketProducts'), it created "MarketProducts".
                    // We must reference "MarketProducts".
                    model: 'MarketProducts',
                    key: 'id'
                }
            },
            price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            recorded_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            source: {
                type: Sequelize.ENUM('market-update', 'user-report', 'system'),
                defaultValue: 'market-update'
            },
            reporter_id: {
                type: Sequelize.UUID,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            verified: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            notes: {
                type: Sequelize.TEXT
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('price_histories');
        await queryInterface.dropTable('escrow_accounts');
        await queryInterface.dropTable('orders');
    }
};
