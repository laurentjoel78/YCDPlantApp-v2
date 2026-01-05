'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class LanguagePack extends Model {
    static associate(models) {
      // Add associations here if needed
    }
  }

  LanguagePack.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    language: {
      type: DataTypes.STRING,
      allowNull: false
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false
    },
    translations: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Key-value pairs of translations'
    },
    audioFiles: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Mapping of text keys to audio file URLs'
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Size in bytes'
    },
    requiredStorage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Required storage space in bytes'
    },
    downloadUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    checksum: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'MD5 checksum for verification'
    },
    releaseNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    timestamps: true,
    underscored: true,
    tableName: 'language_packs',
    indexes: [
      {
        fields: ['language', 'version'],
        unique: true
      }
    ]
  });

  return LanguagePack;
};