'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Create ForumTopics table
        await queryInterface.createTable('forum_topics', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            category: {
                type: Sequelize.STRING,
                allowNull: false
            },
            location: {
                type: Sequelize.JSONB,
                allowNull: true,
                comment: 'Region or city for location-based forums'
            },
            tags: {
                type: Sequelize.ARRAY(Sequelize.STRING),
                defaultValue: []
            },
            status: {
                type: Sequelize.ENUM('active', 'locked', 'hidden'),
                defaultValue: 'active'
            },
            views: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            last_post_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            pinned_until: {
                type: Sequelize.DATE,
                allowNull: true
            },
            locked_reason: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            locked_by_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            created_by_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
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

        // Create ForumPosts table
        await queryInterface.createTable('forum_posts', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            author_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onDelete: 'CASCADE' // per model
            },
            topic_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'forum_topics',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            parent_id: {
                type: Sequelize.UUID,
                allowNull: true,
                // references itself, so we reference 'forum_posts' which is being created.
                // Sequelize allows self-ref if table is defined. 
                // Best practice: add constraint after table creation or rely on deferred checking?
                // Postgres enforces strict order. We can add constraint after.
                // Or assume it works if we don't strict check immediately?
                // Actually best is to just reference 'forum_posts'.
                references: {
                    model: 'forum_posts',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            content: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('active', 'hidden', 'flagged', 'deleted'),
                defaultValue: 'active'
            },
            type: {
                type: Sequelize.ENUM('text', 'image', 'mixed'),
                defaultValue: 'text'
            },
            attachments: {
                type: Sequelize.JSONB,
                allowNull: true,
                comment: 'Array of attachment metadata (images, etc.)'
            },
            votes: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            is_answer: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            edited_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            edited_by: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            reply_count: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            last_reply_at: {
                type: Sequelize.DATE,
                allowNull: true
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

        // Create ForumMembers table
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
                    model: 'Users',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            forum_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'forum_topics',
                    key: 'id'
                },
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
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            last_read_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Last time the user read messages in this forum'
            },
            notifications_enabled: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                comment: 'Whether the user wants notifications for this forum'
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

        // Add unique constraint for ForumMembers
        await queryInterface.addConstraint('forum_members', {
            fields: ['user_id', 'forum_id'],
            type: 'unique',
            name: 'unique_user_forum_membership' // Explicit name from model
        });

        // Create ForumMessages table
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
                }
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
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
                }
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

        // Create ForumModeration table
        await queryInterface.createTable('forum_moderations', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            moderator_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onDelete: 'RESTRICT'
            },
            type: {
                type: Sequelize.ENUM(
                    'flag',
                    'warning',
                    'hide',
                    'delete',
                    'lock',
                    'unlock',
                    'restore'
                ),
                allowNull: false
            },
            reason: {
                type: Sequelize.STRING,
                allowNull: false
            },
            details: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            topic_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'forum_topics',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            post_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'forum_posts',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            action: {
                type: Sequelize.JSONB,
                allowNull: false,
                comment: 'Details of the moderation action taken'
            },
            previous_state: {
                type: Sequelize.JSONB,
                allowNull: true,
                comment: 'State before moderation action'
            },
            expires_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            resolved_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            resolved_by_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'Users',
                    key: 'id'
                }
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
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('forum_moderations');
        await queryInterface.dropTable('forum_messages');
        await queryInterface.dropTable('forum_members');
        await queryInterface.dropTable('forum_posts');
        await queryInterface.dropTable('forum_topics');
    }
};
