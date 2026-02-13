'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Check if table already exists
        try {
            const tableExists = await queryInterface.sequelize.query(
                `SELECT to_regclass('public.order_items') AS exists`,
                { type: Sequelize.QueryTypes.SELECT }
            );

            if (tableExists[0]?.exists) {
                console.log('  ⏭️  order_items table already exists');
                return;
            }
        } catch (e) {
            // Continue with creation
        }

        await queryInterface.createTable('order_items', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
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
            product_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Products',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            quantity: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1
            },
            price_at_purchase: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });
        console.log('  ✅ Created order_items table');

        // Add indexes for performance
        try {
            await queryInterface.addIndex('order_items', ['order_id']);
            await queryInterface.addIndex('order_items', ['product_id']);
            console.log('  ✅ Added indexes on order_items');
        } catch (e) {
            console.log('  ⏭️  Indexes on order_items may already exist');
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('order_items').catch(() => {});
    }
};
