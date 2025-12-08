'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class PerformanceLog extends Model {
    static associate(models) {
      // No direct associations needed for performance logs
    }
  }

  PerformanceLog.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    route: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'API route or endpoint'
    },
    method: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: 'HTTP method'
    },
    response_time: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Response time in milliseconds'
    },
    status_code: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'HTTP status code'
    },
    request_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Unique identifier for the request'
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who made the request'
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    request_body_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Size of request body in bytes'
    },
    response_body_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Size of response body in bytes'
    },
    query_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of database queries'
    },
    query_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Total database query time in milliseconds'
    },
    memory_usage: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Memory usage in bytes'
    },
    cpu_usage: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'CPU usage percentage'
    },
    cache_hits: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of cache hits'
    },
    cache_misses: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of cache misses'
    },
    external_service_calls: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Details of external service calls made'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'PerformanceLog',
    tableName: 'performance_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['route', 'method']
      },
      {
        fields: ['response_time']
      },
      {
        fields: ['status_code']
      },
      {
        fields: ['request_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['timestamp']
      }
    ],
    comment: 'Logs performance metrics for API requests'
  });

  return PerformanceLog;
};