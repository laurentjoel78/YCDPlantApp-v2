// Simple test version
console.log('[1] Script starting...');

require('dotenv').config();
console.log('[2] Dotenv loaded');

const db = require('../src/models');
console.log('[3] Models loaded');

const logger = require('../config/logger');
console.log('[4] Logger loaded');

const main = async () => {
  try {
    console.log('[5] In main function');
    
    await db.sequelize.authenticate();
    console.log('[6] DB authenticated');
    logger.info('✓ Database connected');
    
    const count = await db.Market.count();
    console.log('[7] Current market count:', count);
    logger.info(`Current market count: ${count}`);
    
    // Test creating one market
    const testMarket = await db.Market.create({
      name: 'Buea Test Market',
      description: 'Test market for seeding',
      city: 'Buea',
      region: 'South West',
      country: 'Cameroon',
      location_lat: 4.15,
      location_lng: 9.25,
      market_type: 'Traditional Market',
      is_active: true,
      verified: true,
      data_source: 'manual'
    });
    
    console.log('[8] Test market created:', testMarket.id);
    logger.info('✓ Test market created successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('[ERROR]:', error.message);
    logger.error('Error:', error);
    process.exit(1);
  }
};

console.log('[9] About to call main()');
main();
console.log('[10] main() called');
