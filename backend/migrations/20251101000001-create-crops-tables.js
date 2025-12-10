'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Create Crops table
        await queryInterface.createTable('crops', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            name: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true
            },
            scientific_name: {
                type: Sequelize.STRING(100)
            },
            description: {
                type: Sequelize.TEXT
            },
            category: {
                type: Sequelize.STRING(50),
                allowNull: false
            },
            growth_duration: {
                type: Sequelize.INTEGER,
                comment: 'Growth duration in days'
            },
            optimal_temperature: {
                type: Sequelize.JSON,
                comment: 'Temperature range in Celsius { min, max, optimal }'
            },
            water_requirements: {
                type: Sequelize.JSON,
                comment: 'Water needs in mm per growth stage'
            },
            soil_requirements: {
                type: Sequelize.JSON,
                comment: 'Soil type and pH requirements'
            },
            planting_depth: {
                type: Sequelize.DECIMAL(5, 2),
                comment: 'Planting depth in centimeters'
            },
            row_spacing: {
                type: Sequelize.DECIMAL(5, 2),
                comment: 'Row spacing in centimeters'
            },
            plant_spacing: {
                type: Sequelize.DECIMAL(5, 2),
                comment: 'Plant spacing in centimeters'
            },
            planting_seasons: {
                type: Sequelize.JSON,
                comment: 'Array of months suitable for planting'
            },
            common_diseases: {
                type: Sequelize.JSON,
                comment: 'Array of common diseases'
            },
            common_pests: {
                type: Sequelize.JSON,
                comment: 'Array of common pests'
            },
            nutritional_value: {
                type: Sequelize.JSON,
                comment: 'Nutritional information per 100g'
            },
            storage_guidelines: {
                type: Sequelize.TEXT
            },
            market_value: {
                type: Sequelize.DECIMAL(10, 2),
                comment: 'Average market value per kg in local currency'
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

        // Create FarmCrops table
        await queryInterface.createTable('farm_crops', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            farm_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Farms', // Use strict model name from previous migration
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            crop_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'crops',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            area: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                comment: 'Area in hectares'
            },
            planting_date: {
                type: Sequelize.DATE,
                allowNull: false
            },
            expected_harvest_date: {
                type: Sequelize.DATE,
                allowNull: false
            },
            status: {
                type: Sequelize.STRING(50), // ENUM('planning', 'planted', 'growing', 'harvesting', 'completed')
                defaultValue: 'planning'
            },
            yield_estimate: {
                type: Sequelize.DECIMAL(10, 2),
                comment: 'Estimated yield in metric tons'
            },
            actual_yield: {
                type: Sequelize.DECIMAL(10, 2),
                comment: 'Actual yield in metric tons'
            },
            notes: {
                type: Sequelize.TEXT
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
            }
        });

        // Create MarketCrops table
        // Note: Model says tableName: 'MarketCrops', we respect that or normalize?
        // Given 'Farms', 'Markets', 'Products' in earlier migrations, PascalCase seems the chaotic standard here.
        // BUT Crop.js says tableName 'crops'.
        // MarketCrop.js says tableName 'MarketCrops'.
        // We will use 'MarketCrops' to match the model source.
        await queryInterface.createTable('MarketCrops', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            market_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Markets',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            crop_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'crops', // references the 'crops' table created above
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            typical_price_per_kg: {
                type: Sequelize.DECIMAL(10, 2),
                comment: 'Typical price in local currency (XAF) per kg'
            },
            demand_level: {
                type: Sequelize.STRING(20),
                defaultValue: 'medium',
                comment: 'How much this market demands this crop (low/medium/high)'
            },
            notes: {
                type: Sequelize.TEXT,
                comment: 'Any specific requirements or notes for this crop at this market'
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

        // Add unique constraint for MarketCrops
        await queryInterface.addConstraint('MarketCrops', {
            fields: ['market_id', 'crop_id'],
            type: 'unique',
            name: 'unique_market_crop'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('MarketCrops');
        await queryInterface.dropTable('farm_crops');
        await queryInterface.dropTable('crops');
    }
};
