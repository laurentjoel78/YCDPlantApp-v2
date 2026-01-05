const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class GuidanceTemplate extends Model {
    static associate(models) {
      GuidanceTemplate.hasMany(models.FarmGuideline, {
        foreignKey: 'template_id',
        as: 'farmGuidelines'
      });
    }
  }

  GuidanceTemplate.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('soil', 'watering', 'pest', 'fertilizer', 'seasonal', 'market'),
      allowNull: false
    },
    soil_type: {
      type: DataTypes.STRING(50)
    },
    farming_type: {
      type: DataTypes.STRING(50)
    },
    climate_zone: {
      type: DataTypes.STRING(100)
    },
    region: {
      type: DataTypes.STRING(100)
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    recommendations: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    priority: {
      type: DataTypes.STRING(20),
      defaultValue: 'medium'
    },
    conditions: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'GuidanceTemplate',
    tableName: 'GuidanceTemplates',
    timestamps: true,
    underscored: true
  });

  return GuidanceTemplate;
};