/**
 * Test script to verify market discovery service is working
 * Run with: node src/scripts/testMarketDiscovery.js
 */

const marketDiscoveryService = require('../services/marketDiscoveryService');

async function testMarketDiscovery() {
    try {
        console.log('Testing market discovery service...\n');

        // Test coordinates: Yaoundé, Cameroon
        const testLat = 3.8667;
        const testLng = 11.5167;
        const radiusKm = 50;
        const cropFilter = ['Maize', 'Cassava']; // Test with crop filtering

        console.log(`Searching for markets near (${testLat}, ${testLng})`);
        console.log(`Radius: ${radiusKm}km`);
        console.log(`Crop filter: ${cropFilter.join(', ')}\n`);

        const markets = await marketDiscoveryService.findNearbyMarkets(
            testLat,
            testLng,
            radiusKm,
            cropFilter
        );

        console.log(`\n✅ Found ${markets.length} markets:\n`);

        markets.forEach((market, index) => {
            console.log(`${index + 1}. ${market.name}`);
            console.log(`   Distance: ${market.distance_km} km`);
            console.log(`   Location: (${market.location_lat}, ${market.location_lng})`);
            console.log(`   Source: ${market.source}`);
            console.log(`   Verified: ${market.verified ? 'Yes' : 'No'}`);
            if (market.accepts_crops && market.accepts_crops.length > 0) {
                console.log(`   Accepts: ${market.accepts_crops.join(', ')}`);
            }
            console.log('');
        });

        console.log('✅ Market discovery service is working correctly!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error testing market discovery:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run the test
testMarketDiscovery();
