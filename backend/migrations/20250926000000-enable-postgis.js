'use strict';

// PostGIS is not available on Neon free tier
// This migration is a no-op
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Neon does not support PostGIS on free tier
    // Location data will use JSONB format instead
    console.log('Skipping PostGIS extension (not available on Neon)');
  },

  down: async (queryInterface, Sequelize) => {
    // No-op
  }
};