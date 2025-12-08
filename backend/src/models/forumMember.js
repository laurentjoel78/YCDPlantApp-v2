const { Model, DataTypes } = require('sequelize');

/**
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 */
module.exports = (sequelize) => {
    class ForumMember extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // A forum member belongs to a user
            ForumMember.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user',
                onDelete: 'CASCADE'
            });

            // A forum member belongs to a forum topic
            ForumMember.belongsTo(models.ForumTopic, {
                foreignKey: 'forumId',
                as: 'forum',
                onDelete: 'CASCADE'
            });
        }
    }

    ForumMember.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        forumId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'forum_topics',
                key: 'id'
            }
        },
        role: {
            type: DataTypes.ENUM('member', 'moderator', 'admin'),
            defaultValue: 'member',
            allowNull: false
        },
        joinedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        lastReadAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Last time the user read messages in this forum'
        },
        notificationsEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Whether the user wants notifications for this forum'
        }
    }, {
        sequelize,
        modelName: 'ForumMember',
        tableName: 'forum_members',
        underscored: true,
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'forum_id'],
                name: 'unique_user_forum_membership'
            },
            {
                fields: ['user_id']
            },
            {
                fields: ['forum_id']
            },
            {
                fields: ['role']
            }
        ]
    });

    return ForumMember;
};
