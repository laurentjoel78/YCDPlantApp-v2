'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Check if column exists first to be safe (optional but good practice)
        try {
            await queryInterface.addColumn('orders', 'payment_reference', {
                type: Sequelize.STRING,
                allowNull: true
            });
            console.log('✅ Added payment_reference column');
        } catch (e) {
            console.log('⚠️ Column might already exist or error:', e.message);
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Note: payment_reference may have been created by 20251101000002-create-commerce-tables
        // Only remove if it was NOT part of the original table definition
        await queryInterface.removeColumn('orders', 'payment_reference').catch(() => {});
    }
};
