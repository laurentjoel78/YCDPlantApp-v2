const { Model, DataTypes, Sequelize } = require('sequelize');

/**
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 */
module.exports = (sequelize) => {
  class ForumPost extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ForumPost.belongsTo(models.User, {
        foreignKey: 'authorId',
        as: 'author',
        onDelete: 'CASCADE'
      });
      ForumPost.belongsTo(models.ForumTopic, {
        foreignKey: 'topicId',
        as: 'topic',
        onDelete: 'CASCADE'
      });
      ForumPost.belongsTo(models.ForumPost, {
        foreignKey: 'parentId',
        as: 'parent',
        onDelete: 'CASCADE'
      });
      ForumPost.hasMany(models.ForumPost, {
        foreignKey: 'parentId',
        as: 'replies',
        onDelete: 'CASCADE'
      });
      ForumPost.hasMany(models.ForumModeration, {
        foreignKey: 'postId',
        as: 'moderationLogs',
        onDelete: 'CASCADE'
      });
    }
  }

  ForumPost.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    topicId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'forum_topics',
        key: 'id'
      }
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'forum_posts',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'hidden', 'flagged', 'deleted'),
      defaultValue: 'active'
    },
    type: {
      type: DataTypes.ENUM('text', 'image', 'mixed'),
      defaultValue: 'text'
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Array of attachment metadata (images, etc.)'
    },
    votes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isAnswer: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    editedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    editedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    replyCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastReplyAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'ForumPost',
    tableName: 'forum_posts',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['author_id']
      },
      {
        fields: ['topic_id']
      },
      {
        fields: ['parent_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['votes']
      }
    ]
  });

  return ForumPost;
};