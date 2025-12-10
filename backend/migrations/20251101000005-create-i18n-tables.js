'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Create LanguagePacks table
        await queryInterface.createTable('language_packs', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            language: {
                type: Sequelize.STRING,
                allowNull: false
            },
            version: {
                type: Sequelize.STRING,
                allowNull: false
            },
            translations: {
                type: Sequelize.JSONB,
                allowNull: false,
                comment: 'Key-value pairs of translations'
            },
            audio_files: {
                type: Sequelize.JSONB,
                allowNull: false,
                comment: 'Mapping of text keys to audio file URLs'
            },
            size: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: 'Size in bytes'
            },
            required_storage: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: 'Required storage space in bytes'
            },
            download_url: {
                type: Sequelize.STRING,
                allowNull: false
            },
            checksum: {
                type: Sequelize.STRING,
                allowNull: false,
                comment: 'MD5 checksum for verification'
            },
            release_notes: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Create Translations table
        await queryInterface.createTable('translations', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            key: {
                type: Sequelize.STRING,
                allowNull: false
            },
            locale: {
                type: Sequelize.STRING(5),
                allowNull: false
            },
            value: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            context: {
                type: Sequelize.STRING,
                allowNull: true
            },
            metadata: {
                type: Sequelize.JSONB,
                defaultValue: {}
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Create VoiceCommands table
        await queryInterface.createTable('voice_commands', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            language_pack_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'language_packs',
                    key: 'id'
                }
            },
            audio_file_url: {
                type: Sequelize.STRING,
                allowNull: false
            },
            transcription: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            translated_text: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            command_type: {
                type: Sequelize.STRING,
                allowNull: false
            },
            intent: {
                type: Sequelize.STRING,
                allowNull: false
            },
            parameters: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            execution_status: {
                type: Sequelize.STRING,
                defaultValue: 'pending'
            },
            execution_result: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            error_details: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            confidence_score: {
                type: Sequelize.FLOAT,
                allowNull: false
            },
            processing_time: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            device_info: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            noise_level: {
                type: Sequelize.FLOAT,
                allowNull: true
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            deleted_at: {
                type: Sequelize.DATE
            }
        });

        // Create LanguagePreferences table
        await queryInterface.createTable('language_preferences', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            primary_language: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: 'en'
            },
            voice_language: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: 'en'
            },
            ui_language: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: 'en'
            },
            enable_voice_commands: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            enable_text_to_speech: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            preferred_voice_gender: {
                type: Sequelize.ENUM('male', 'female'),
                allowNull: true
            },
            offline_language_packs: {
                type: Sequelize.ARRAY(Sequelize.STRING),
                allowNull: false,
                defaultValue: []
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Create AuditLogs table
        await queryInterface.createTable('audit_logs', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            user_role: {
                type: Sequelize.STRING,
                allowNull: false
            },
            action_type: {
                type: Sequelize.STRING,
                allowNull: false
            },
            action_description: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            ip_address: {
                type: Sequelize.STRING,
                allowNull: true
            },
            user_agent: {
                type: Sequelize.STRING,
                allowNull: true
            },
            device_info: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            location: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            metadata: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            table_name: {
                type: Sequelize.STRING,
                allowNull: true
            },
            record_id: {
                type: Sequelize.UUID,
                allowNull: true
            },
            old_values: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            new_values: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            status: {
                type: Sequelize.STRING,
                allowNull: true
            },
            session_id: {
                type: Sequelize.STRING,
                allowNull: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Create PerformanceLogs table
        await queryInterface.createTable('performance_logs', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            route: {
                type: Sequelize.STRING,
                allowNull: false
            },
            method: {
                type: Sequelize.STRING(10),
                allowNull: false
            },
            response_time: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            status_code: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            request_id: {
                type: Sequelize.UUID,
                allowNull: true
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            ip_address: {
                type: Sequelize.STRING,
                allowNull: true
            },
            request_body_size: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            response_body_size: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            query_count: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            query_time: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            memory_usage: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            cpu_usage: {
                type: Sequelize.FLOAT,
                allowNull: true
            },
            cache_hits: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            cache_misses: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            external_service_calls: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            timestamp: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('performance_logs');
        await queryInterface.dropTable('audit_logs');
        await queryInterface.dropTable('language_preferences');
        await queryInterface.dropTable('voice_commands');
        await queryInterface.dropTable('translations');
        await queryInterface.dropTable('language_packs');
    }
};
