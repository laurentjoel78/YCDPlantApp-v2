/**
 * Seed script to populate the Markets table with real markets in Cameroon
 * Run with: node src/scripts/seedCameroonMarkets.js
 */

const { sequelize, Market, Crop, MarketCrop } = require('../models');

// Sample markets across major agricultural regions in Cameroon
const cameroonMarkets = [
    // Yaoundé Region
    {
        name: "Marché Central de Yaoundé",
        description: "Main central market in Yaoundé, accepts all types of agricultural products",
        location_lat: 3.8667,
        location_lng: 11.5167,
        address: "Avenue Kennedy, Yaoundé",
        city: "Yaoundé",
        region: "Centre",
        market_type: "Traditional Market",
        operating_hours: {
            monday: "06:00-18:00",
            tuesday: "06:00-18:00",
            wednesday: "06:00-18:00",
            thursday: "06:00-18:00",
            friday: "06:00-18:00",
            saturday: "06:00-18:00",
            sunday: "06:00-14:00"
        },
        market_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        contact_phone: "+237 222 23 45 67",
        verified: true,
        data_source: "manual"
    },
    {
        name: "Marché Mokolo",
        description: "Large traditional market known for fresh produce",
        location_lat: 3.8833,
        location_lng: 11.5000,
        address: "Quartier Mokolo, Yaoundé",
        city: "Yaoundé",
        region: "Centre",
        market_type: "Traditional Market",
        operating_hours: {
            monday: "05:00-19:00",
            tuesday: "05:00-19:00",
            wednesday: "05:00-19:00",
            thursday: "05:00-19:00",
            friday: "05:00-19:00",
            saturday: "05:00-19:00",
            sunday: "05:00-15:00"
        },
        market_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        verified: true,
        data_source: "manual"
    },

    // Douala Region
    {
        name: "Marché Central de Douala",
        description: "Main market in Douala, largest commercial city",
        location_lat: 4.0511,
        location_lng: 9.7679,
        address: "Rue Joffre, Douala",
        city: "Douala",
        region: "Littoral",
        market_type: "Traditional Market",
        operating_hours: {
            monday: "06:00-18:00",
            tuesday: "06:00-18:00",
            wednesday: "06:00-18:00",
            thursday: "06:00-18:00",
            friday: "06:00-18:00",
            saturday: "06:00-18:00",
            sunday: "Closed"
        },
        market_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        contact_phone: "+237 233 42 15 78",
        verified: true,
        data_source: "manual"
    },
    {
        name: "Marché de New Bell",
        description: "Popular market for agricultural products in Douala",
        location_lat: 4.0608,
        location_lng: 9.7489,
        address: "New Bell, Douala",
        city: "Douala",
        region: "Littoral",
        market_type: "Traditional Market",
        market_days: ["Monday", "Wednesday", "Friday", "Saturday"],
        verified: true,
        data_source: "manual"
    },

    // Bafoussam Region (West - Major agricultural area)
    {
        name: "Marché A de Bafoussam",
        description: "Main agricultural market in the West region",
        location_lat: 5.4781,
        location_lng: 10.4178,
        address: "Centre-ville, Bafoussam",
        city: "Bafoussam",
        region: "Ouest",
        market_type: "Traditional Market",
        operating_hours: {
            monday: "06:00-17:00",
            tuesday: "06:00-17:00",
            wednesday: "06:00-17:00",
            thursday: "06:00-17:00",
            friday: "06:00-17:00",
            saturday: "06:00-17:00",
            sunday: "Closed"
        },
        market_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        verified: true,
        data_source: "manual"
    },

    // Bamenda Region (Northwest)
    {
        name: "Bamenda Main Market",
        description: "Central market serving the Northwest region",
        location_lat: 5.9631,
        location_lng: 10.1591,
        address: "Commercial Avenue, Bamenda",
        city: "Bamenda",
        region: "Nord-Ouest",
        market_type: "Traditional Market",
        market_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        verified: true,
        data_source: "manual"
    },

    // Garoua Region (North)
    {
        name: "Marché de Garoua",
        description: "Main market in the North region",
        location_lat: 9.3014,
        location_lng: 13.3964,
        address: "Centre-ville, Garoua",
        city: "Garoua",
        region: "Nord",
        market_type: "Traditional Market",
        market_days: ["Monday", "Wednesday", "Friday", "Saturday"],
        verified: true,
        data_source: "manual"
    },

    // Ngaoundéré Region
    {
        name: "Marché Central de Ngaoundéré",
        description: "Central market in Adamawa region",
        location_lat: 7.3167,
        location_lng: 13.5833,
        address: "Centre-ville, Ngaoundéré",
        city: "Ngaoundéré",
        region: "Adamaoua",
        market_type: "Traditional Market",
        market_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        verified: true,
        data_source: "manual"
    },

    // Buea Region (Southwest)
    {
        name: "Buea Town Market",
        description: "Main market serving the Southwest region",
        location_lat: 4.1560,
        location_lng: 9.2324,
        address: "Buea Town, Southwest Region",
        city: "Buea",
        region: "Sud-Ouest",
        market_type: "Traditional Market",
        market_days: ["Monday", "Wednesday", "Friday", "Saturday"],
        verified: true,
        data_source: "manual"
    },

    // Bertoua Region (East)
    {
        name: "Marché Central de Bertoua",
        description: "Main market in the East region",
        location_lat: 4.5775,
        location_lng: 13.6836,
        address: "Centre-ville, Bertoua",
        city: "Bertoua",
        region: "Est",
        market_type: "Traditional Market",
        market_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        verified: true,
        data_source: "manual"
    }
];

// Crop-Market relationships with typical prices (in XAF per kg)
const marketCropData = {
    "Marché Central de Yaoundé": {
        "Maize": { price: 250, demand: "high" },
        "Cassava": { price: 150, demand: "high" },
        "Plantain": { price: 300, demand: "high" },
        "Cocoa": { price: 1500, demand: "medium" },
        "Coffee": { price: 2000, demand: "medium" },
        "Tomato": { price: 400, demand: "high" }
    },
    "Marché Mokolo": {
        "Maize": { price: 240, demand: "high" },
        "Cassava": { price: 140, demand: "high" },
        "Plantain": { price: 280, demand: "high" },
        "Tomato": { price: 380, demand: "high" },
        "Pepper": { price: 800, demand: "medium" }
    },
    "Marché Central de Douala": {
        "Maize": { price: 260, demand: "high" },
        "Cassava": { price: 160, demand: "high" },
        "Plantain": { price: 320, demand: "high" },
        "Cocoa": { price: 1600, demand: "high" },
        "Coffee": { price: 2100, demand: "medium" }
    },
    "Marché A de Bafoussam": {
        "Maize": { price: 230, demand: "high" },
        "Coffee": { price: 1900, demand: "high" },
        "Beans": { price: 600, demand: "high" },
        "Potato": { price: 350, demand: "high" }
    },
    "Bamenda Main Market": {
        "Maize": { price: 240, demand: "high" },
        "Beans": { price: 580, demand: "high" },
        "Potato": { price: 340, demand: "high" },
        "Cabbage": { price: 200, demand: "medium" }
    }
};

async function seedMarkets() {
    try {
        console.log('Starting market seeding...');

        // Sync database (create tables if they don't exist)
        await sequelize.sync();

        // Clear existing markets (optional - comment out if you want to keep existing data)
        // await Market.destroy({ where: {}, truncate: true });

        // Create markets
        const createdMarkets = [];
        for (const marketData of cameroonMarkets) {
            const market = await Market.create(marketData);
            createdMarkets.push(market);
            console.log(`✓ Created market: ${market.name}`);
        }

        // Link markets with crops and prices
        console.log('\nLinking markets with crops...');
        for (const [marketName, crops] of Object.entries(marketCropData)) {
            const market = createdMarkets.find(m => m.name === marketName);
            if (!market) continue;

            for (const [cropName, data] of Object.entries(crops)) {
                const crop = await Crop.findOne({ where: { name: cropName } });
                if (!crop) {
                    console.log(`  ⚠ Crop not found: ${cropName}`);
                    continue;
                }

                await MarketCrop.create({
                    market_id: market.id,
                    crop_id: crop.id,
                    typical_price_per_kg: data.price,
                    demand_level: data.demand
                });
                console.log(`  ✓ Linked ${market.name} with ${cropName} (${data.price} XAF/kg)`);
            }
        }

        console.log(`\n✅ Successfully seeded ${createdMarkets.length} markets!`);
        console.log('Markets are now available for discovery.');

    } catch (error) {
        console.error('Error seeding markets:', error);
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Run the seeding
if (require.main === module) {
    seedMarkets()
        .then(() => {
            console.log('\n🎉 Market seeding completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Market seeding failed:', error);
            process.exit(1);
        });
}

module.exports = seedMarkets;
