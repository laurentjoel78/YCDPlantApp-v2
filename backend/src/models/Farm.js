const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Farm extends Model {
    static associate(models) {
      // Define associations
      Farm.belongsTo(models.User, {
        foreignKey: 'farmer_id',
        as: 'farmer'
      });
      Farm.hasMany(models.FarmCrop, {
        foreignKey: 'farm_id',
        as: 'crops'
      });
      Farm.hasMany(models.FarmGuideline, {
        foreignKey: 'farm_id',
        as: 'guidelines'
      });
    }
  }

  Farm.init({
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    location_lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false
    },
    location_lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    size: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Farm size in hectares'
    },
    // New explicit column for hectare-based size (kept for clarity and migration compatibility)
    size_hectares: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Farm size in hectares (explicit column)'
    },
    soil_type: {
      type: DataTypes.STRING(50)
    },
    water_source: {
      type: DataTypes.STRING(50)
    },
    farming_type: {
      type: DataTypes.ENUM('conventional', 'organic', 'mixed'),
      defaultValue: 'conventional'
    },
    irrigation_system: {
      type: DataTypes.STRING(50)
    },
    certification: {
      type: DataTypes.STRING(100)
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Farm',
    tableName: 'farms',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Farm;
};