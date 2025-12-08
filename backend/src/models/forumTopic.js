const { Model, DataTypes, Sequelize } = require('sequelize');

/**
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 */
module.exports = (sequelize) => {
  class ForumTopic extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ForumTopic.belongsTo(models.User, {
        foreignKey: 'createdById',
        as: 'creator',
        onDelete: 'CASCADE'
      });
      ForumTopic.hasMany(models.ForumPost, {
        foreignKey: 'topicId',
        as: 'posts',
        onDelete: 'CASCADE'
      });
      ForumTopic.hasMany(models.ForumModeration, {
        foreignKey: 'topicId',
        as: 'moderationLogs',
        onDelete: 'CASCADE'
      });
    }
  }

  ForumTopic.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    location: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Region or city for location-based forums'
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('active', 'locked', 'hidden'),
      defaultValue: 'active'
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastPostAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    pinnedUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lockedReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lockedById: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    createdById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'ForumTopic',
    tableName: 'forum_topics',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['category']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_by_id']
      },
      {
        fields: ['last_post_at']
      }
    ]
  });

  return ForumTopic;
};