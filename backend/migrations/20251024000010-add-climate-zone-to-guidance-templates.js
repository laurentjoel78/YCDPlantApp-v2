/**
 * Add climate_zone column to GuidanceTemplates in a safe, idempotent way.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Use raw SQL with IF NOT EXISTS so this is safe to re-run
      await queryInterface.sequelize.query(
        'ALTER TABLE "GuidanceTemplates" ADD COLUMN IF NOT EXISTS climate_zone VARCHAR(100);'
      );
  },

  down: async (queryInterface, Sequelize) => {
    // Drop column if exists
      await queryInterface.sequelize.query(
        'ALTER TABLE "GuidanceTemplates" DROP COLUMN IF EXISTS climate_zone;'
      );
  }
};
