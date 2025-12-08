'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('forum_members', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
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
            role: {
                type: Sequelize.ENUM('member', 'moderator', 'admin'),
                defaultValue: 'member',
                allowNull: false
            },
            joined_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            last_read_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            notifications_enabled: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            },
            deleted_at: {
                type: Sequelize.DATE,
                allowNull: true
            }
        });

        // Add unique constraint
        await queryInterface.addConstraint('forum_members', {
            fields: ['user_id', 'forum_id'],
            type: 'unique',
            name: 'unique_user_forum_membership'
        });

        // Add indexes
        await queryInterface.addIndex('forum_members', ['user_id']);
        await queryInterface.addIndex('forum_members', ['forum_id']);
        await queryInterface.addIndex('forum_members', ['role']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('forum_members');
    }
};
