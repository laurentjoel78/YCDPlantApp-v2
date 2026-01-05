'use strict';

const { Model, DataTypes } = require('sequelize');

const initModels = (sequelize) => {
  // NOTE: AuditLog is defined in auditLog.js - not duplicated here

  class UserActivityLog extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }

  class SystemLog extends Model {
    static associate(models) {
      // Define associations if needed
    }
  }

  UserActivityLog.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'user_id'
    },
    activity_type: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'activity_type'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    device_info: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'device_info'
    },
    location: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'success'
    }
  }, {
    sequelize,
    modelName: 'UserActivityLog',
    tableName: 'user_activity_logs',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  SystemLog.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    log_level: {
      type: DataTypes.STRING,
      defaultValue: 'info',
      field: 'log_level'
    },
    module: {
      type: DataTypes.STRING,
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    error_details: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'error_details'
    },
    request_id: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'request_id'
    },
    performance_metrics: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'performance_metrics'
    }
  }, {
    sequelize,
    modelName: 'SystemLog',
    tableName: 'SystemLogs',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  const models = {
    UserActivityLog,
    SystemLog
  };

  return models;
};

module.exports = initModels;
