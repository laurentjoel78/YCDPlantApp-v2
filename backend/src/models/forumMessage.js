const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ForumMessage extends Model {
        static associate(models) {
            ForumMessage.belongsTo(models.ForumTopic, {
                foreignKey: 'forumId',
                as: 'forum'
            });
            ForumMessage.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'sender'
            });
            ForumMessage.belongsTo(ForumMessage, {
                foreignKey: 'replyToId',
                as: 'replyTo'
            });
            ForumMessage.hasMany(ForumMessage, {
                foreignKey: 'replyToId',
                as: 'replies'
            });
        }
    }

    ForumMessage.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        forumId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'forum_id',
            references: {
                model: 'forum_topics',
                key: 'id'
            }
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'user_id',
            references: {
                model: 'users',
                key: 'id'
            }
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        messageType: {
            type: DataTypes.ENUM('text', 'image', 'system'),
            defaultValue: 'text',
            field: 'message_type'
        },
        replyToId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'reply_to_id',
            references: {
                model: 'forum_messages',
                key: 'id'
            }
        }
    }, {
        sequelize,
        modelName: 'ForumMessage',
        tableName: 'forum_messages',
        underscored: true,
        paranoid: true,
        timestamps: true
    });

    return ForumMessage;
};
