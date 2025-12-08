'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class WeatherData extends Model {
    static associate(models) {
      // Define associations
      this.belongsTo(models.Farm, {
        foreignKey: 'farm_id',
        as: 'farm'
      });
    }
  }

  WeatherData.init({
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
    temperature: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    humidity: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    precipitation: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    wind_speed: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    wind_direction: {
      type: DataTypes.STRING,
      allowNull: false
    },
    weather_condition: {
      type: DataTypes.STRING,
      allowNull: false
    },
    forecast: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    recorded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'WeatherData',
    tableName: 'weather_data',
    timestamps: true,
    indexes: [
      {
        fields: ['farm_id']
      },
      {
        fields: ['recorded_at']
      }
    ]
  });

  return WeatherData;
};