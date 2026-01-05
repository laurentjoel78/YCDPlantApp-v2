'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Translation extends Model {
    static associate(models) {
      // Add associations if needed in the future
    }
  }

  Translation.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false
    },
    locale: {
      type: DataTypes.STRING(5),
      allowNull: false
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    context: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Translation',
    tableName: 'translations',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['key', 'locale'],
        unique: true
      },
      {
        fields: ['context']
      }
    ]
  });

  return Translation;
};