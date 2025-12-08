const { Model, DataTypes, Sequelize } = require('sequelize');

/**
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 */
module.exports = (sequelize) => {
  class Consultation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define associations here
      Consultation.belongsTo(models.User, {
        foreignKey: 'farmerId',
        as: 'farmer',
        onDelete: 'CASCADE'
      });
      Consultation.belongsTo(models.User, {
        foreignKey: 'expertId',
        as: 'expert',
        onDelete: 'CASCADE'
      });
      Consultation.belongsTo(models.Farm, {
        foreignKey: 'farmId',
        as: 'farm',
        onDelete: 'CASCADE'
      });
      Consultation.belongsTo(models.Crop, {
        foreignKey: 'cropId',
        as: 'crop',
        onDelete: 'CASCADE'
      });
      Consultation.hasMany(models.CommissionTransaction, {
        foreignKey: 'consultationId',
        as: 'commissionTransactions',
        onDelete: 'CASCADE'
      });
      Consultation.hasMany(models.ExpertReview, {
        foreignKey: 'consultationId',
        as: 'reviews',
        onDelete: 'CASCADE'
      });
    }
  }

  Consultation.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    farmerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    expertId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    farmId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'farms',
        key: 'id'
      }
    },
    cropId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'crops',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'accepted',
        'in_progress',
        'completed',
        'cancelled',
        'disputed'
      ),
      allowNull: false,
      defaultValue: 'pending'
    },
    consultationType: {
      type: DataTypes.ENUM('remote', 'on_site'),
      allowNull: false
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Duration in minutes'
    },
    problemDescription: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Array of attachment URLs'
    },
    location: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Location details for on-site consultations'
    },
    expertNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    recommendations: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    followUpDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Rate per hour'
    },
    totalCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    commissionRate: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 0.20
    },
    commissionAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'refunded'),
      allowNull: false,
      defaultValue: 'pending'
    },
    refundReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    disputeReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    resolution: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cancelledBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    extraNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Consultation',
    tableName: 'consultations',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['farmer_id']
      },
      {
        fields: ['expert_id']
      },
      {
        fields: ['farm_id']
      },
      {
        fields: ['crop_id']
      },
      {
        fields: ['payment_status']
      },
      {
        fields: ['scheduled_date']
      }
    ]
  });

  return Consultation;
};