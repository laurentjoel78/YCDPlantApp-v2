const { Market } = require('../models');

async function checkMarkets() {
    const markets = await Market.findAll({
        attributes: ['name', 'location_lat', 'location_lng', 'city'],
        order: [['city', 'ASC']]
    });

    console.log(`\nTotal markets in database: ${markets.length}\n`);

    markets.forEach(m => {
        console.log(`${m.name}`);
        console.log(`  Location: (${m.location_lat}, ${m.location_lng})`);
        console.log(`  City: ${m.city}\n`);
    });

    process.exit(0);
}

checkMarkets();
