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
      allowNull: true
    },
    user_role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'system'
    },
    action_type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'unknown'
    },
    action_description: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'No description'
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    user_agent: {
      type: DataTypes.STRING,
      allowNull: true
    },
    device_info: {
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
    table_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    record_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    old_values: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    new_values: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true
    },
    session_id: {
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
