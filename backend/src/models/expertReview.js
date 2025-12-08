const { Model, DataTypes, Sequelize } = require('sequelize');

/**
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 */
module.exports = (sequelize) => {
  class ExpertReview extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ExpertReview.belongsTo(models.Expert, {
        foreignKey: 'expertId',
        as: 'expert',
        onDelete: 'CASCADE'
      });
      ExpertReview.belongsTo(models.User, {
        foreignKey: 'farmerId',
        as: 'farmer',
        onDelete: 'CASCADE'
      });
      ExpertReview.belongsTo(models.Consultation, {
        foreignKey: 'consultationId',
        as: 'consultation',
        onDelete: 'CASCADE'
      });
    }
  }

  ExpertReview.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    expertId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'experts',
        key: 'id'
      }
    },
    farmerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    consultationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'consultations',
        key: 'id'
      }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    consultationType: {
      type: DataTypes.ENUM('remote', 'on_site'),
      allowNull: false
    },
    consultationDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    helpfulCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'ExpertReview',
    tableName: 'expert_reviews',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['expert_id']
      },
      {
        fields: ['farmer_id']
      },
      {
        fields: ['consultation_id']
      },
      {
        fields: ['rating']
      }
    ]
  });

  return ExpertReview;
};