const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ensure uuid_generate_v4() is available
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // Create GuidanceTemplates table
    await queryInterface.createTable('GuidanceTemplates', {
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
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create FarmGuidelines table
    await queryInterface.createTable('FarmGuidelines', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      farm_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Farms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      template_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'GuidanceTemplates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add initial guidance templates
    await queryInterface.bulkInsert('GuidanceTemplates', [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        title: 'Soil Management for Volcanic Soils',
        type: 'soil',
        soil_type: 'Volcanic (Western Highlands)',
        content: `Volcanic soils in Western Highlands are naturally fertile but require specific management:
- Monitor soil pH regularly as volcanic soils can become acidic
- Add organic matter annually to improve structure
- Implement erosion control on slopes
- Practice crop rotation to maintain fertility`,
        recommendations: JSON.stringify([
          { input: 'Soil pH meter', importance: 'high' },
          { input: 'Organic compost', importance: 'high' },
          { input: 'Cover crops', importance: 'medium' }
        ]),
        priority: 'high',
        conditions: JSON.stringify({
          soil_type: ['Volcanic (Western Highlands)'],
          rainfall_mm: { min: 1500 }
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        title: 'Water Management for Sandy-Clay Soils',
        type: 'watering',
        soil_type: 'Sandy-Clay (Northern)',
        content: `Sandy-clay soils require careful water management:
- Water more frequently but in smaller amounts
- Monitor soil moisture at 15-20cm depth
- Use mulch to reduce evaporation
- Consider drip irrigation for efficiency`,
        recommendations: JSON.stringify([
          { input: 'Soil moisture sensor', importance: 'high' },
          { input: 'Organic mulch', importance: 'high' },
          { input: 'Drip irrigation system', importance: 'medium' }
        ]),
        priority: 'medium',
        conditions: JSON.stringify({
          soil_type: ['Sandy-Clay (Northern)'],
          temperature_c: { max: 35 }
        }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('FarmGuidelines');
    await queryInterface.dropTable('GuidanceTemplates');
  }
};