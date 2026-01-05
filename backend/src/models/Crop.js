const { Model, DataTypes, Sequelize } = require('sequelize');

/**
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 */
module.exports = (sequelize) => {
  class Crop extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Crop.hasMany(models.FarmCrop, {
        foreignKey: 'crop_id',
        as: 'farmCrops',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      // Add any additional associations here
    }
  }

  Crop.init({
    // Define model attributes
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    scientific_name: {
      type: DataTypes.STRING(100)
    },
    description: {
      type: DataTypes.TEXT
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    growth_duration: {
      type: DataTypes.INTEGER,
      comment: 'Growth duration in days'
    },
    optimal_temperature: {
      type: DataTypes.JSON,
      comment: 'Temperature range in Celsius { min, max, optimal }'
    },
    water_requirements: {
      type: DataTypes.JSON,
      comment: 'Water needs in mm per growth stage'
    },
    soil_requirements: {
      type: DataTypes.JSON,
      comment: 'Soil type and pH requirements'
    },
    planting_depth: {
      type: DataTypes.DECIMAL(5, 2),
      comment: 'Planting depth in centimeters'
    },
    row_spacing: {
      type: DataTypes.DECIMAL(5, 2),
      comment: 'Row spacing in centimeters'
    },
    plant_spacing: {
      type: DataTypes.DECIMAL(5, 2),
      comment: 'Plant spacing in centimeters'
    },
    planting_seasons: {
      type: DataTypes.JSON,
      comment: 'Array of months suitable for planting'
    },
    common_diseases: {
      type: DataTypes.JSON,
      comment: 'Array of common diseases'
    },
    common_pests: {
      type: DataTypes.JSON,
      comment: 'Array of common pests'
    },
    nutritional_value: {
      type: DataTypes.JSON,
      comment: 'Nutritional information per 100g'
    },
    storage_guidelines: {
      type: DataTypes.TEXT
    },
    market_value: {
      type: DataTypes.DECIMAL(10, 2),
      comment: 'Average market value per kg in local currency'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Crop',
    tableName: 'crops',
    underscored: true,
    timestamps: true,
    paranoid: true,
    // Add model options here
    indexes: [
      {
        unique: true,
        fields: ['name']
      }
    ]
  });

  return Crop;
};