'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class SystemLog extends Model {
    static associate(models) {
      // No associations needed for system logs
    }
  }

  SystemLog.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    level: {
      type: DataTypes.ENUM('info', 'warn', 'error', 'debug'),
      allowNull: false,
      defaultValue: 'info'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    stackTrace: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    environment: {
      type: DataTypes.STRING,
      allowNull: false
    },
    serverInstance: {
      type: DataTypes.STRING,
      allowNull: true
    },
    processId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    requestId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'SystemLog',
    tableName: 'SystemLogs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['level']
      },
      {
        fields: ['category']
      },
      {
        fields: ['timestamp']
      },
      {
        fields: ['requestId']
      }
    ]
  });

  return SystemLog;
};