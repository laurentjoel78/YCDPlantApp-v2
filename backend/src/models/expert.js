'use strict';

const { Model, DataTypes, Sequelize } = require('sequelize');

/**
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 */
module.exports = (sequelize) => {
  class Expert extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Expert.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'CASCADE'
      });
      Expert.belongsTo(models.User, {
        foreignKey: 'created_by_admin_id',
        as: 'createdByAdmin',
        onDelete: 'RESTRICT'
      });
      Expert.belongsTo(models.User, {
        foreignKey: 'approved_by_admin_id',
        as: 'approvedByAdmin',
        onDelete: 'SET NULL'
      });
      Expert.hasMany(models.ExpertReview, {
        foreignKey: 'expert_id',
        as: 'reviews',
        onDelete: 'CASCADE'
      });
    }
  }

  Expert.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    specializations: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false
    },
    certifications: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    experience: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Years of experience'
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    languages: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: ['French', 'English']
    },
    hourly_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    commission_rate: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 0.20 // 20% commission
    },
    total_earnings: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: true
    },
    total_consultations: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    completion_rate: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    avg_response_time: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      comment: 'Average response time in hours'
    },
    profile_image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    location: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    availability: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        available: true,
        schedule: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' }
        }
      }
    },
    approval_status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    verification_documents: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    created_by_admin_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approved_by_admin_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    profile_visible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    last_active: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Expert',
    tableName: 'experts',
    underscored: true,
    timestamps: true,
    paranoid: true,
    hooks: {
      afterCreate: async (expert, options) => {
        await sequelize.models.AuditLog.create({
          user_id: expert.created_by_admin_id,
          user_role: 'admin',
          action_type: 'EXPERT_CREATED',
          action_description: 'New expert profile created',
          table_name: 'experts',
          record_id: expert.id,
          new_values: expert.toJSON()
        });
      },
      afterUpdate: async (expert, options) => {
        if (expert.changed()) {
          const changes = expert.changed();
          const oldValues = {};
          const newValues = {};
          
          changes.forEach(field => {
            oldValues[field] = expert.previous(field);
            newValues[field] = expert.get(field);
          });

          await sequelize.models.AuditLog.create({
            user_id: options.userId || expert.created_by_admin_id,
            user_role: 'admin',
            action_type: 'EXPERT_UPDATED',
            action_description: 'Expert profile updated',
            table_name: 'experts',
            record_id: expert.id,
            old_values: oldValues,
            new_values: newValues
          });
        }
      }
    },
    indexes: [
      {
        fields: ['approval_status']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['rating']
      }
    ]
  });

  return Expert;
};