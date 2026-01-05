'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class VoiceRecording extends Model {
        static associate(models) {
            this.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user'
            });
        }
    }

    VoiceRecording.init({
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
            },
            comment: 'User who created the recording'
        },
        recordingPath: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Path to the audio file'
        },
        language: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'en-US',
            comment: 'Language code of the recording'
        },
        duration: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: 'Duration of the recording in seconds'
        },
        processingStatus: {
            type: DataTypes.STRING,
            defaultValue: 'processing',
            validate: {
                isIn: [['processing', 'completed', 'failed']]
            },
            comment: 'Status of transcription/processing'
        },
        transcription: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Transcribed text'
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: 'Additional metadata or error details'
        }
    }, {
        sequelize,
        modelName: 'VoiceRecording',
        tableName: 'VoiceRecordings',
        timestamps: true,
        underscored: true,
        paranoid: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['processingStatus']
            }
        ]
    });

    return VoiceRecording;
};
