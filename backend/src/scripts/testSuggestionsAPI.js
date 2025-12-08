/**
 * Test script to verify suggestions API returns markets
 * Run with: node src/scripts/testSuggestionsAPI.js <farmId>
 */

const { generateSuggestionsForFarm } = require('../services/suggestionService');

async function testSuggestionsAPI() {
    try {
        // Get farm ID from command line or use a default test ID
        const farmId = process.argv[2];

        if (!farmId) {
            console.error('❌ Please provide a farm ID as argument');
            console.log('Usage: node src/scripts/testSuggestionsAPI.js <farmId>');
            process.exit(1);
        }

        console.log(`Testing suggestions API for farm: ${farmId}\n`);

        const suggestions = await generateSuggestionsForFarm(farmId);

        if (suggestions.error) {
            console.error('❌ Error:', suggestions.error);
            process.exit(1);
        }

        console.log('✅ Suggestions generated successfully!\n');
        console.log('Farm ID:', suggestions.farm_id);
        console.log('Farm Location:', suggestions.farm_location);
        console.log('Advisories:', suggestions.advisories?.length || 0);
        console.log('Markets:', suggestions.markets?.length || 0);

        if (suggestions.markets && suggestions.markets.length > 0) {
            console.log('\n📍 Markets found:');
            suggestions.markets.forEach((market, index) => {
                console.log(`${index + 1}. ${market.name} - ${market.distance_km}km away`);
            });
        } else {
            console.log('\n⚠️  No markets found!');
            console.log('This could mean:');
            console.log('- Farm has no valid coordinates');
            console.log('- No markets within 50km radius');
            console.log('- Market discovery service failed');
        }

        console.log('\n✅ Test completed!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error testing suggestions API:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run the test
testSuggestionsAPI();
