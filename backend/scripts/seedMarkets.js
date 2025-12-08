const { Market } = require('../src/models');

async function seedMarkets() {
    try {
        const count = await Market.count();
        console.log(`Current market count: ${count}`);

        if (count > 0) {
            console.log('Markets already exist. Skipping seed.');
            return;
        }

        const markets = [
            {
                name: 'Muea Market',
                description: 'Major food market in Buea, known for fresh vegetables and plantains.',
                address: 'Muea, Buea, South West Region',
                location_lat: 4.1667,
                location_lng: 9.2833,
                operating_hours: {
                    monday: { open: '06:00', close: '18:00' },
                    thursday: { open: '06:00', close: '18:00' } // Market days
                },
                market_days: ['monday', 'thursday'],
                specialties: ['Plantain', 'Vegetables', 'Cocoyams'],
                facilities: { parking: true, storage: true }
            },
            {
                name: 'Bamenda Main Market',
                description: 'Central market in Bamenda, hub for potatoes and vegetables.',
                address: 'Commercial Avenue, Bamenda, North West Region',
                location_lat: 5.9631,
                location_lng: 10.1591,
                operating_hours: {
                    monday: { open: '07:00', close: '19:00' },
                    tuesday: { open: '07:00', close: '19:00' },
                    wednesday: { open: '07:00', close: '19:00' },
                    thursday: { open: '07:00', close: '19:00' },
                    friday: { open: '07:00', close: '19:00' },
                    saturday: { open: '07:00', close: '19:00' }
                },
                market_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
                specialties: ['Potatoes', 'Carrots', 'Beans', 'Maize'],
                facilities: { parking: true, cold_storage: true }
            },
            {
                name: 'Mfoundi Market',
                description: 'One of the largest markets in Yaounde.',
                address: 'Yaounde, Centre Region',
                location_lat: 3.8667,
                location_lng: 11.5167,
                operating_hours: {
                    monday: { open: '06:00', close: '18:00' },
                    tuesday: { open: '06:00', close: '18:00' },
                    wednesday: { open: '06:00', close: '18:00' },
                    thursday: { open: '06:00', close: '18:00' },
                    friday: { open: '06:00', close: '18:00' },
                    saturday: { open: '06:00', close: '18:00' }
                },
                market_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
                specialties: ['Cassava', 'Fruits', 'Vegetables'],
                facilities: { parking: true, loading_zone: true }
            },
            {
                name: 'Limbe New Market',
                description: 'Coastal market known for fish and palm oil.',
                address: 'Limbe, South West Region',
                location_lat: 4.0244,
                location_lng: 9.2033,
                operating_hours: {
                    monday: { open: '07:00', close: '18:00' },
                    tuesday: { open: '07:00', close: '18:00' },
                    wednesday: { open: '07:00', close: '18:00' },
                    thursday: { open: '07:00', close: '18:00' },
                    friday: { open: '07:00', close: '18:00' },
                    saturday: { open: '07:00', close: '18:00' }
                },
                market_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
                specialties: ['Fish', 'Palm Oil', 'Cocoa'],
                facilities: { parking: true }
            },
            {
                name: 'Foumbot Market',
                description: 'Major agricultural hub in the West Region.',
                address: 'Foumbot, West Region',
                location_lat: 5.5000,
                location_lng: 10.6333,
                operating_hours: {
                    saturday: { open: '05:00', close: '18:00' }
                },
                market_days: ['saturday'],
                specialties: ['Tomatoes', 'Vegetables', 'Maize'],
                facilities: { parking: true, storage: true, loading_zone: true }
            }
        ];

        await Market.bulkCreate(markets);
        console.log(`Successfully seeded ${markets.length} markets.`);
    } catch (error) {
        console.error('Error seeding markets:', error);
    }
}

// Execute if run directly
if (require.main === module) {
    // Simple mock of sequelize connection for standalone script
    // In a real app, you'd import the initialized sequelize instance
    // But here we rely on models/index.js to initialize it
    seedMarkets().then(() => {
        console.log('Done');
        process.exit(0);
    });
}

module.exports = seedMarkets;
