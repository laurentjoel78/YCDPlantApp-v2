const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Advisory extends Model {
    static associate(models) {
      // define associations here
      Advisory.belongsTo(models.User, {
        as: 'farmer',
        foreignKey: 'farmer_id'
      });
      Advisory.belongsTo(models.User, {
        as: 'expert',
        foreignKey: 'expert_id'
      });
    }
  }

  Advisory.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  farmer_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  expert_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  farm_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'farms',
      key: 'id'
    }
  },
  crop_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'crops',
      key: 'id'
    }
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('open', 'in-progress', 'resolved', 'closed'),
    defaultValue: 'open'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
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
  modelName: 'Advisory',
  tableName: 'Advisories',
  timestamps: true,
  underscored: true
  });

  return Advisory;
};