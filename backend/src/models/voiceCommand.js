'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class VoiceCommand extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      this.belongsTo(models.LanguagePack, {
        foreignKey: 'language_pack_id',
        as: 'languagePack'
      });
    }
  }

  VoiceCommand.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who issued the voice command'
    },
    language_pack_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'language_packs',
        key: 'id'
      },
      comment: 'Language pack used for processing'
    },
    audio_file_url: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'URL to the recorded voice command audio file'
    },
    transcription: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Text transcription of the voice command'
    },
    translated_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Translated text if command was in a different language'
    },
    command_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['navigation', 'search', 'transaction', 'advisory', 'market', 'weather', 'profile', 'help', 'other']]
      },
      comment: 'Type of voice command'
    },
    intent: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Identified intent of the command'
    },
    parameters: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Extracted parameters from the command'
    },
    execution_status: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'processing', 'completed', 'failed']]
      },
      comment: 'Status of command execution'
    },
    execution_result: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Result of command execution'
    },
    error_details: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Details of any errors during processing'
    },
    confidence_score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 1
      },
      comment: 'Confidence score of voice recognition'
    },
    processing_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Time taken to process the command in milliseconds'
    },
    device_info: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Information about the device used'
    },
    noise_level: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Background noise level during recording'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'VoiceCommand',
    tableName: 'voice_commands',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['language_pack_id']
      },
      {
        fields: ['command_type']
      },
      {
        fields: ['intent']
      },
      {
        fields: ['execution_status']
      },
      {
        fields: ['created_at']
      }
    ],
    hooks: {
      afterCreate: async (voiceCommand, options) => {
        // Log voice command creation
        await sequelize.models.AuditLog.create({
          userId: voiceCommand.user_id,
          userRole: 'user',
          actionType: 'VOICE_COMMAND_CREATED',
          actionDescription: `New voice command recorded: ${voiceCommand.intent}`,
          tableName: 'voice_commands',
          recordId: voiceCommand.id,
          newValues: voiceCommand.toJSON()
        }, { transaction: options.transaction });
      }
    }
  });

  return VoiceCommand;
};