'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class AuditLog extends Model {
    static associate(models) {
      AuditLog.belongsTo(models.User, {
        foreignKey: 'user_id',
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
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'user_id'
    },
    user_role: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'user_role'
    },
    action_type: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'action_type'
    },
    action_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'action_description'
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'ip_address'
    },
    user_agent: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'user_agent'
    },
    device_info: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'device_info'
    },
    location: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    table_name: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'table_name'
    },
    record_id: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'record_id'
    },
    old_values: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'old_values'
    },
    new_values: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'new_values'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true
    },
    session_id: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'session_id'
    }
  }, {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['action_type']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  return AuditLog;
};
