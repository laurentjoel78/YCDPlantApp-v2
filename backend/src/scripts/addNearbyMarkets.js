/**
 * Add markets specifically near the northern Adamaoua farm location
 * Farm coordinates: (7.33°, 12.35°)
 * Run with: node src/scripts/addNearbyMarkets.js
 */

const { Market } = require('../models');

// Markets positioned strategically near (7.33°, 12.35°)
const nearbyMarkets = [
    {
        name: "Marché de Tignère",
        description: "Regional market in Adamaoua, serving local farmers",
        location_lat: 7.3667,
        location_lng: 12.6500,
        address: "Tignère, Adamaoua",
        city: "Tignère",
        region: "Adamaoua",
        market_type: "Traditional Market",
        market_days: ["Monday", "Wednesday", "Friday"],
        verified: true,
        data_source: "manual"
    },
    {
        name: "Marché de Banyo",
        description: "Market serving northern Adamaoua region",
        location_lat: 6.7500,
        location_lng: 11.8167,
        address: "Banyo, Adamaoua",
        city: "Banyo",
        region: "Adamaoua",
        market_type: "Traditional Market",
        market_days: ["Tuesday", "Thursday", "Saturday"],
        verified: true,
        data_source: "manual"
    },
    {
        name: "Marché de Kontcha",
        description: "Local market in eastern Adamaoua",
        location_lat: 7.9667,
        location_lng: 12.2333,
        address: "Kontcha, Adamaoua",
        city: "Kontcha",
        region: "Adamaoua",
        market_type: "Traditional Market",
        market_days: ["Monday", "Thursday", "Saturday"],
        verified: true,
        data_source: "manual"
    }
];

async function addMarkets() {
    try {
        console.log('Adding markets near farm location (7.33°, 12.35°)...\n');

        let added = 0;
        for (const marketData of nearbyMarkets) {
            const existing = await Market.findOne({ where: { name: marketData.name } });

            if (existing) {
                console.log(`⏭  Skipped: ${marketData.name} (already exists)`);
                continue;
            }

            const market = await Market.create(marketData);

            // Calculate approximate distance from farm (7.33, 12.35)
            const farmLat = 7.33;
            const farmLng = 12.35;
            const dist = Math.sqrt(
                Math.pow((market.location_lat - farmLat) * 111, 2) +
                Math.pow((market.location_lng - farmLng) * 111 * Math.cos(farmLat * Math.PI / 180), 2)
            );

            console.log(`✓ Added: ${market.name}`);
            console.log(`  Location: (${market.location_lat}, ${market.location_lng})`);
            console.log(`  Distance from farm: ~${dist.toFixed(1)} km\n`);
            added++;
        }

        console.log(`✅ Added ${added} new markets near farm location`);
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addMarkets();
