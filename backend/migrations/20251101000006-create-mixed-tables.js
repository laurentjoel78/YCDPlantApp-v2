'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Note: FarmGuidelines and GuidanceTemplates are already created in 20251021000002-create-guidelines-tables.js

        // Create MarketReviews table
        await queryInterface.createTable('MarketReviews', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            market_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Markets',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            rating: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            comment: {
                type: Sequelize.TEXT
            },
            price_fairness: {
                type: Sequelize.INTEGER,
                comment: 'Rating for price fairness'
            },
            accessibility: {
                type: Sequelize.INTEGER,
                comment: 'Rating for how easy it is to access'
            },
            payment_speed: {
                type: Sequelize.INTEGER,
                comment: 'How quickly farmers get paid'
            },
            verified_purchase: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                comment: 'Whether this review is from a verified transaction'
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
        await queryInterface.dropTable('MarketReviews');
    }
};
