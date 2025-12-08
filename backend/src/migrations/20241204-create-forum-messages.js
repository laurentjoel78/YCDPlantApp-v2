'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('forum_messages', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            forum_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'forum_topics',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            content: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            message_type: {
                type: Sequelize.ENUM('text', 'image', 'system'),
                defaultValue: 'text'
            },
            reply_to_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'forum_messages',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
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
                type: Sequelize.DATE,
                allowNull: true
            }
        });

        // Add indexes
        await queryInterface.addIndex('forum_messages', ['forum_id']);
        await queryInterface.addIndex('forum_messages', ['user_id']);
        await queryInterface.addIndex('forum_messages', ['created_at']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('forum_messages');
    }
};
