'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class LanguagePreference extends Model {
    static associate(models) {
      // Associate with User model
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  LanguagePreference.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    primaryLanguage: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'en'
    },
    voiceLanguage: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'en'
    },
    uiLanguage: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'en'
    },
    enableVoiceCommands: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    enableTextToSpeech: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    preferredVoiceGender: {
      type: DataTypes.ENUM('male', 'female'),
      allowNull: true
    },
    offlineLanguagePacks: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: []
    }
  }, {
    sequelize,
    timestamps: true,
    tableName: 'language_preferences'
  });

  return LanguagePreference;
};