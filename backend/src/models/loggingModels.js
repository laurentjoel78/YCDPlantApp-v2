'use strict';

const { Model, DataTypes } = require('sequelize');

const initModels = (sequelize) => {
  class AuditLog extends Model {
    static associate(models) {
      // Define associations
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  class UserActivityLog extends Model {
    static associate(models) {
      // Define associations
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  class SystemLog extends Model {
    static associate(models) {
      // Define associations if needed
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
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    userRole: {
      type: DataTypes.STRING,
      allowNull: false
    },
    actionType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tableAffected: {
      type: DataTypes.STRING,
      allowNull: true
    },
    recordId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    oldValues: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    newValues: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'low'
    }
  }, {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['actionType']
      },
      {
        fields: ['tableAffected']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  UserActivityLog.init({
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
    activityType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    deviceInfo: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    location: {
      type: DataTypes.GEOMETRY('POINT'),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('success', 'failure', 'warning'),
      defaultValue: 'success'
    }
  }, {
    sequelize,
    modelName: 'UserActivityLog',
    tableName: 'user_activity_logs',
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['activityType']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  SystemLog.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    logLevel: {
      type: DataTypes.ENUM('debug', 'info', 'warn', 'error', 'critical'),
      defaultValue: 'info'
    },
    module: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    errorDetails: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    requestId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    performanceMetrics: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'SystemLog',
    tableName: 'system_logs',
    indexes: [
      {
        fields: ['logLevel']
      },
      {
        fields: ['module']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  const models = {
    AuditLog,
    UserActivityLog,
    SystemLog
  };

  return models;
};

module.exports = initModels;