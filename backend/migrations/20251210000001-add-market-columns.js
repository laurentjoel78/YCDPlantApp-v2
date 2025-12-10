'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Add missing columns to Markets table for model compatibility
        const tableInfo = await queryInterface.describeTable('Markets');

        // Add location_lat if missing
        if (!tableInfo.location_lat) {
            await queryInterface.addColumn('Markets', 'location_lat', {
                type: Sequelize.DECIMAL(10, 8),
                allowNull: true
            });
        }

        // Add location_lng if missing
        if (!tableInfo.location_lng) {
            await queryInterface.addColumn('Markets', 'location_lng', {
                type: Sequelize.DECIMAL(11, 8),
                allowNull: true
            });
        }

        // Add other missing columns
        if (!tableInfo.address) {
            await queryInterface.addColumn('Markets', 'address', {
                type: Sequelize.STRING,
                allowNull: true
            });
        }

        if (!tableInfo.city) {
            await queryInterface.addColumn('Markets', 'city', {
                type: Sequelize.STRING,
                allowNull: true
            });
        }

        if (!tableInfo.region) {
            await queryInterface.addColumn('Markets', 'region', {
                type: Sequelize.STRING,
                allowNull: true
            });
        }

        if (!tableInfo.country) {
            await queryInterface.addColumn('Markets', 'country', {
                type: Sequelize.STRING,
                defaultValue: 'Cameroon'
            });
        }

        if (!tableInfo.market_type) {
            await queryInterface.addColumn('Markets', 'market_type', {
                type: Sequelize.STRING,
                allowNull: true
            });
        }

        if (!tableInfo.operating_hours) {
            await queryInterface.addColumn('Markets', 'operating_hours', {
                type: Sequelize.JSON,
                allowNull: true
            });
        }

        if (!tableInfo.market_days) {
            await queryInterface.addColumn('Markets', 'market_days', {
                type: Sequelize.JSON,
                allowNull: true
            });
        }

        if (!tableInfo.contact_phone) {
            await queryInterface.addColumn('Markets', 'contact_phone', {
                type: Sequelize.STRING,
                allowNull: true
            });
        }

        if (!tableInfo.contact_email) {
            await queryInterface.addColumn('Markets', 'contact_email', {
                type: Sequelize.STRING,
                allowNull: true
            });
        }

        if (!tableInfo.website) {
            await queryInterface.addColumn('Markets', 'website', {
                type: Sequelize.STRING,
                allowNull: true
            });
        }

        if (!tableInfo.average_rating) {
            await queryInterface.addColumn('Markets', 'average_rating', {
                type: Sequelize.DECIMAL(3, 2),
                defaultValue: 0
            });
        }

        if (!tableInfo.total_reviews) {
            await queryInterface.addColumn('Markets', 'total_reviews', {
                type: Sequelize.INTEGER,
                defaultValue: 0
            });
        }

        if (!tableInfo.is_active) {
            await queryInterface.addColumn('Markets', 'is_active', {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            });
        }

        if (!tableInfo.verified) {
            await queryInterface.addColumn('Markets', 'verified', {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            });
        }

        if (!tableInfo.osm_id) {
            await queryInterface.addColumn('Markets', 'osm_id', {
                type: Sequelize.STRING,
                allowNull: true
            });
        }

        if (!tableInfo.data_source) {
            await queryInterface.addColumn('Markets', 'data_source', {
                type: Sequelize.STRING,
                allowNull: true
            });
        }

        if (!tableInfo.additional_info) {
            await queryInterface.addColumn('Markets', 'additional_info', {
                type: Sequelize.JSON,
                allowNull: true
            });
        }
    },

    down: async (queryInterface, Sequelize) => {
        // No-op - keep the columns
    }
};
