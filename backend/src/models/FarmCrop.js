const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class FarmCrop extends Model {
    static associate(models) {
      FarmCrop.belongsTo(models.Farm, {
        foreignKey: 'farm_id',
        as: 'farm'
      });
      FarmCrop.belongsTo(models.Crop, {
        foreignKey: 'crop_id',
        as: 'crop'
      });
    }
  }

  FarmCrop.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    farm_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'farms',
        key: 'id'
      }
    },
    crop_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'crops',
        key: 'id'
      }
    },
    area: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Area in hectares'
    },
    planting_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    expected_harvest_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('planning', 'planted', 'growing', 'harvesting', 'completed'),
      defaultValue: 'planning'
    },
    yield_estimate: {
      type: DataTypes.DECIMAL(10, 2),
      comment: 'Estimated yield in metric tons'
    },
    actual_yield: {
      type: DataTypes.DECIMAL(10, 2),
      comment: 'Actual yield in metric tons'
    },
    notes: {
      type: DataTypes.TEXT
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'FarmCrop',
    tableName: 'farm_crops',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return FarmCrop;
};