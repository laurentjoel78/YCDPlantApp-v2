const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class FarmGuideline extends Model {
    static associate(models) {
      FarmGuideline.belongsTo(models.Farm, {
        foreignKey: 'farm_id',
        as: 'farm'
      });
      FarmGuideline.belongsTo(models.GuidanceTemplate, {
        foreignKey: 'template_id',
        as: 'template'
      });
    }
  }

  FarmGuideline.init({
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
    template_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'GuidanceTemplates',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active'
    },
    modified_content: {
      type: DataTypes.TEXT
    },
    expert_notes: {
      type: DataTypes.TEXT
    }
  }, {
    sequelize,
    modelName: 'FarmGuideline',
    tableName: 'FarmGuidelines',
    timestamps: true,
    underscored: true
  });

  return FarmGuideline;
};