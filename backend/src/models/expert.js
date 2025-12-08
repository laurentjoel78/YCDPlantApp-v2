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
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE'
      });
      Expert.belongsTo(models.User, {
        foreignKey: 'createdByAdminId',
        as: 'createdByAdmin',
        onDelete: 'RESTRICT'
      });
      Expert.belongsTo(models.User, {
        foreignKey: 'approvedByAdminId',
        as: 'approvedByAdmin',
        onDelete: 'SET NULL'
      });
      Expert.hasMany(models.AuditLog, {
        foreignKey: 'expertId',
        as: 'auditLogs',
        onDelete: 'CASCADE'
      });
      Expert.hasMany(models.ExpertReview, {
        foreignKey: 'expertId',
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
    userId: {
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
    hourlyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    commissionRate: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 0.20 // 20% commission
    },
    totalEarnings: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: true
    },
    totalConsultations: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    completionRate: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    avgResponseTime: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      comment: 'Average response time in hours'
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    location: {
      type: DataTypes.JSONB,
      allowNull: false
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
    approvalStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    verificationDocuments: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    createdByAdminId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approvedByAdminId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    profileVisible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    lastActive: {
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
          userId: expert.createdByAdminId,
          userRole: 'admin',
          actionType: 'EXPERT_CREATED',
          actionDescription: 'New expert profile created',
          tableName: 'experts',
          recordId: expert.id,
          newValues: expert.toJSON()
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
            userId: options.userId || expert.createdByAdminId,
            userRole: 'admin',
            actionType: 'EXPERT_UPDATED',
            actionDescription: 'Expert profile updated',
            tableName: 'experts',
            recordId: expert.id,
            oldValues,
            newValues
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