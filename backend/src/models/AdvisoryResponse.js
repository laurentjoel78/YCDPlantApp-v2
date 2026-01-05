const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class AdvisoryResponse extends Model {
    static associate(models) {
      // define associations here
      AdvisoryResponse.belongsTo(models.Advisory, {
        foreignKey: 'advisory_id'
      });
      AdvisoryResponse.belongsTo(models.User, {
        foreignKey: 'user_id'
      });
    }
  }

  AdvisoryResponse.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  advisory_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'advisories',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  attachments: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'AdvisoryResponse',
  tableName: 'advisory_responses',
  timestamps: true,
  underscored: true
  });

  return AdvisoryResponse;
};