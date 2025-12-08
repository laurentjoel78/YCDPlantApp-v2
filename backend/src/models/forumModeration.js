const { Model, DataTypes, Sequelize } = require('sequelize');

/**
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 */
module.exports = (sequelize) => {
  class ForumModeration extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ForumModeration.belongsTo(models.User, {
        foreignKey: 'moderatorId',
        as: 'moderator',
        onDelete: 'RESTRICT'
      });
      ForumModeration.belongsTo(models.ForumTopic, {
        foreignKey: 'topicId',
        as: 'topic',
        onDelete: 'CASCADE'
      });
      ForumModeration.belongsTo(models.ForumPost, {
        foreignKey: 'postId',
        as: 'post',
        onDelete: 'CASCADE'
      });
    }
  }

  ForumModeration.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    moderatorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM(
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
      type: DataTypes.STRING,
      allowNull: false
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    topicId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'forum_topics',
        key: 'id'
      }
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'forum_posts',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Details of the moderation action taken'
    },
    previousState: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'State before moderation action'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resolvedById: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'ForumModeration',
    tableName: 'forum_moderations',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['moderator_id']
      },
      {
        fields: ['topic_id']
      },
      {
        fields: ['post_id']
      },
      {
        fields: ['type']
      }
    ]
  });

  return ForumModeration;
};