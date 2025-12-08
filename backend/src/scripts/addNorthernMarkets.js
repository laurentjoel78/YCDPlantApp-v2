/**
 * Add additional market near Garoua/Ngaoundéré region
 * Run with: node src/scripts/addNorthernMarkets.js
 */

const { Market } = require('../models');

const northernMarkets = [
    {
        name: "Marché de Meiganga",
        description: "Regional market serving the Adamaoua region",
        location_lat: 6.5167,
        location_lng: 14.3000,
        address: "Meiganga, Adamaoua",
        city: "Meiganga",
        region: "Adamaoua",
        market_type: "Traditional Market",
        market_days: ["Monday", "Wednesday", "Friday", "Saturday"],
        verified: true,
        data_source: "manual"
    },
    {
        name: "Marché de Tibati",
        description: "Market serving northern Adamaoua",
        location_lat: 6.4667,
        location_lng: 12.6333,
        address: "Tibati, Adamaoua",
        city: "Tibati",
        region: "Adamaoua",
        market_type: "Traditional Market",
        market_days: ["Tuesday", "Thursday", "Saturday"],
        verified: true,
        data_source: "manual"
    },
    // Update Ngaoundéré coordinates to be more accurate
    {
        name: "Marché Central de Ngaoundéré (Updated)",
        description: "Central market in Adamawa region - updated location",
        location_lat: 7.3167,
        location_lng: 13.5833,
        address: "Centre-ville, Ngaoundéré",
        city: "Ngaoundéré",
        region: "Adamaoua",
        market_type: "Traditional Market",
        market_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        verified: true,
        data_source: "manual"
    }
];

async function addMarkets() {
    try {
        console.log('Adding northern region markets...\n');

        let added = 0;
        for (const marketData of northernMarkets) {
            const existing = await Market.findOne({ where: { name: marketData.name } });

            if (existing) {
                console.log(`⏭  Skipped: ${marketData.name} (already exists)`);
                continue;
            }

            const market = await Market.create(marketData);
            console.log(`✓ Added: ${market.name} at (${market.location_lat}, ${market.location_lng})`);
            added++;
        }

        console.log(`\n✅ Added ${added} new markets`);
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addMarkets();
