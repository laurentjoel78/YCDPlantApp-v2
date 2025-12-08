'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class AuditLog extends Model {
    static associate(models) {
      // define associations here
      AuditLog.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  AuditLog.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  userRole: {
    type: DataTypes.STRING,
    allowNull: false
  },
  actionType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  actionDescription: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deviceInfo: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  location: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  tableName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  recordId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  oldValues: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  newValues: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true
  }
  }, {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['actionType']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  return AuditLog;
};