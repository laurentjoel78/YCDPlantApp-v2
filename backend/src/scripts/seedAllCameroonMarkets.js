/**
 * Comprehensive Cameroon Markets Seed Script
 * Contains major markets from all 10 regions of Cameroon for database fallback
 */

const { Market, sequelize } = require('../models');

// All major markets in Cameroon organized by region
const cameroonMarkets = [
    // ==========================================
    // CENTRE REGION (Yaoundé)
    // ==========================================
    {
        name: 'Marché Central de Yaoundé',
        description: 'The largest and most famous market in Yaoundé, offering everything from food to electronics',
        address: 'Centre-ville, Yaoundé, Centre Region',
        location_lat: 3.8667,
        location_lng: 11.5167,
        market_type: 'Traditional Market',
        market_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        specialties: ['vegetables', 'fruits', 'grains', 'meat', 'fish'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché Mokolo',
        description: 'Major wholesale and retail market in Yaoundé known for agricultural products',
        address: 'Mokolo, Yaoundé, Centre Region',
        location_lat: 3.8833,
        location_lng: 11.5000,
        market_type: 'Traditional Market',
        market_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        specialties: ['vegetables', 'fruits', 'plantains', 'cassava'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché Mfoundi',
        description: 'Large agricultural market near Mfoundi river',
        address: 'Mfoundi, Yaoundé, Centre Region',
        location_lat: 3.8500,
        location_lng: 11.5333,
        market_type: 'Traditional Market',
        market_days: ['Tuesday', 'Thursday', 'Saturday'],
        specialties: ['vegetables', 'fruits', 'cocoa', 'coffee'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché Nkol-Eton',
        description: 'Market specializing in food products and livestock',
        address: 'Nkol-Eton, Yaoundé, Centre Region',
        location_lat: 3.8950,
        location_lng: 11.5200,
        market_type: 'Traditional Market',
        market_days: ['Wednesday', 'Saturday'],
        specialties: ['livestock', 'meat', 'vegetables'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché Essos',
        description: 'Neighborhood market in Essos district',
        address: 'Essos, Yaoundé, Centre Region',
        location_lat: 3.8700,
        location_lng: 11.5400,
        market_type: 'Traditional Market',
        market_days: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
        specialties: ['vegetables', 'fruits', 'fish'],
        is_active: true,
        verified: true
    },

    // ==========================================
    // LITTORAL REGION (Douala)
    // ==========================================
    {
        name: 'Marché Central de Douala',
        description: 'The main commercial hub of Douala, largest market in Cameroon',
        address: 'Akwa, Douala, Littoral Region',
        location_lat: 4.0500,
        location_lng: 9.7000,
        market_type: 'Traditional Market',
        market_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        specialties: ['fish', 'seafood', 'vegetables', 'fruits', 'grains'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché Sandaga',
        description: 'Historic market in Douala known for fresh produce',
        address: 'Sandaga, Douala, Littoral Region',
        location_lat: 4.0400,
        location_lng: 9.7100,
        market_type: 'Traditional Market',
        market_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        specialties: ['fish', 'vegetables', 'spices'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché New-Deido',
        description: 'Large market in New-Deido neighborhood',
        address: 'New-Deido, Douala, Littoral Region',
        location_lat: 4.0600,
        location_lng: 9.7200,
        market_type: 'Traditional Market',
        market_days: ['Tuesday', 'Thursday', 'Saturday'],
        specialties: ['plantains', 'cassava', 'vegetables'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché Mboppi',
        description: 'Popular market near Mboppi Hospital',
        address: 'Mboppi, Douala, Littoral Region',
        location_lat: 4.0333,
        location_lng: 9.6833,
        market_type: 'Traditional Market',
        market_days: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
        specialties: ['fruits', 'vegetables', 'grains'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché Nkoulouloun',
        description: 'Wholesale market for agricultural products',
        address: 'Nkoulouloun, Douala, Littoral Region',
        location_lat: 4.0200,
        location_lng: 9.7300,
        market_type: 'Wholesale Market',
        market_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        specialties: ['vegetables', 'fruits', 'grains', 'wholesale'],
        is_active: true,
        verified: true
    },

    // ==========================================
    // WEST REGION (Bafoussam)
    // ==========================================
    {
        name: 'Marché A de Bafoussam',
        description: 'Main market of Bafoussam, regional agricultural hub',
        address: 'Centre-ville, Bafoussam, West Region',
        location_lat: 5.4667,
        location_lng: 10.4167,
        market_type: 'Traditional Market',
        market_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        specialties: ['vegetables', 'potatoes', 'beans', 'coffee'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché B de Bafoussam',
        description: 'Secondary market focusing on fresh produce',
        address: 'Bafoussam, West Region',
        location_lat: 5.4700,
        location_lng: 10.4200,
        market_type: 'Traditional Market',
        market_days: ['Wednesday', 'Saturday'],
        specialties: ['vegetables', 'fruits', 'livestock'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché de Dschang',
        description: 'Important agricultural market in Dschang',
        address: 'Dschang, West Region',
        location_lat: 5.4500,
        location_lng: 10.0667,
        market_type: 'Traditional Market',
        market_days: ['Monday', 'Thursday', 'Saturday'],
        specialties: ['vegetables', 'coffee', 'fruits'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché de Foumban',
        description: 'Historic market in the Bamoun capital',
        address: 'Foumban, West Region',
        location_lat: 5.7333,
        location_lng: 10.9167,
        market_type: 'Traditional Market',
        market_days: ['Wednesday', 'Saturday'],
        specialties: ['crafts', 'vegetables', 'grains'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché de Mbouda',
        description: 'Agricultural market serving Mbouda area',
        address: 'Mbouda, West Region',
        location_lat: 5.6167,
        location_lng: 10.2500,
        market_type: 'Traditional Market',
        market_days: ['Tuesday', 'Friday'],
        specialties: ['vegetables', 'potatoes', 'beans'],
        is_active: true,
        verified: true
    },

    // ==========================================
    // NORTHWEST REGION (Bamenda)
    // ==========================================
    {
        name: 'Marché Commercial Avenue Bamenda',
        description: 'Main commercial market in Bamenda city center',
        address: 'Commercial Avenue, Bamenda, Northwest Region',
        location_lat: 5.9500,
        location_lng: 10.1500,
        market_type: 'Traditional Market',
        market_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        specialties: ['vegetables', 'coffee', 'beans', 'corn'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché de Nkwen',
        description: 'Large market in Nkwen, Bamenda',
        address: 'Nkwen, Bamenda, Northwest Region',
        location_lat: 5.9700,
        location_lng: 10.1700,
        market_type: 'Traditional Market',
        market_days: ['Wednesday', 'Saturday'],
        specialties: ['vegetables', 'fruits', 'livestock'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché de Wum',
        description: 'Regional market in Wum subdivision',
        address: 'Wum, Northwest Region',
        location_lat: 6.3833,
        location_lng: 10.0667,
        market_type: 'Traditional Market',
        market_days: ['Tuesday', 'Friday'],
        specialties: ['vegetables', 'livestock', 'grains'],
        is_active: true,
        verified: true
    },

    // ==========================================
    // SOUTHWEST REGION (Buea/Limbe)
    // ==========================================
    {
        name: 'Marché Central de Buea',
        description: 'Main market in Buea, the regional capital',
        address: 'Buea Town, Southwest Region',
        location_lat: 4.1500,
        location_lng: 9.2333,
        market_type: 'Traditional Market',
        market_days: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
        specialties: ['vegetables', 'plantains', 'cocoyams'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché de Limbe',
        description: 'Coastal market known for fish and seafood',
        address: 'Limbe, Southwest Region',
        location_lat: 4.0167,
        location_lng: 9.2167,
        market_type: 'Traditional Market',
        market_days: ['Tuesday', 'Thursday', 'Saturday'],
        specialties: ['fish', 'seafood', 'fruits', 'vegetables'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché de Kumba',
        description: 'Major agricultural trading hub in Kumba',
        address: 'Kumba, Southwest Region',
        location_lat: 4.6333,
        location_lng: 9.4500,
        market_type: 'Traditional Market',
        market_days: ['Monday', 'Thursday', 'Saturday'],
        specialties: ['cocoa', 'palm oil', 'plantains', 'vegetables'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché de Mamfe',
        description: 'Border market town with Nigeria',
        address: 'Mamfe, Southwest Region',
        location_lat: 5.7500,
        location_lng: 9.3167,
        market_type: 'Traditional Market',
        market_days: ['Wednesday', 'Saturday'],
        specialties: ['cocoa', 'vegetables', 'fruits'],
        is_active: true,
        verified: true
    },

    // ==========================================
    // NORTH REGION (Garoua)
    // ==========================================
    {
        name: 'Marché Central de Garoua',
        description: 'Largest market in the North Region',
        address: 'Centre-ville, Garoua, North Region',
        location_lat: 9.3000,
        location_lng: 13.4000,
        market_type: 'Traditional Market',
        market_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        specialties: ['cotton', 'onions', 'millet', 'livestock'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché de Bétail Garoua',
        description: 'Major livestock market in Garoua',
        address: 'Garoua, North Region',
        location_lat: 9.2900,
        location_lng: 13.3900,
        market_type: 'Livestock Market',
        market_days: ['Wednesday', 'Sunday'],
        specialties: ['cattle', 'goats', 'sheep', 'livestock'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché de Guider',
        description: 'Important agricultural market in Guider',
        address: 'Guider, North Region',
        location_lat: 9.9333,
        location_lng: 13.9500,
        market_type: 'Traditional Market',
        market_days: ['Tuesday', 'Friday'],
        specialties: ['onions', 'millet', 'beans'],
        is_active: true,
        verified: true
    },

    // ==========================================
    // FAR NORTH REGION (Maroua)
    // ==========================================
    {
        name: 'Marché Central de Maroua',
        description: 'Main market of the Far North capital',
        address: 'Centre-ville, Maroua, Far North Region',
        location_lat: 10.5833,
        location_lng: 14.3167,
        market_type: 'Traditional Market',
        market_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        specialties: ['millet', 'sorghum', 'onions', 'groundnuts'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché de Kousseri',
        description: 'Border market near Chad',
        address: 'Kousseri, Far North Region',
        location_lat: 12.0767,
        location_lng: 15.0300,
        market_type: 'Traditional Market',
        market_days: ['Wednesday', 'Saturday'],
        specialties: ['fish', 'grains', 'livestock'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché de Mokolo (Far North)',
        description: 'Important trading center in Mokolo',
        address: 'Mokolo, Far North Region',
        location_lat: 10.7333,
        location_lng: 13.8000,
        market_type: 'Traditional Market',
        market_days: ['Tuesday', 'Friday'],
        specialties: ['onions', 'groundnuts', 'livestock'],
        is_active: true,
        verified: true
    },

    // ==========================================
    // ADAMAWA REGION (Ngaoundéré)
    // ==========================================
    {
        name: 'Marché Central de Ngaoundéré',
        description: 'Main market and railway hub of Adamawa',
        address: 'Centre-ville, Ngaoundéré, Adamawa Region',
        location_lat: 7.3167,
        location_lng: 13.5833,
        market_type: 'Traditional Market',
        market_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        specialties: ['cattle', 'potatoes', 'beans', 'maize'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché de Bétail Ngaoundéré',
        description: 'Major cattle market in the Adamawa highlands',
        address: 'Ngaoundéré, Adamawa Region',
        location_lat: 7.3100,
        location_lng: 13.5700,
        market_type: 'Livestock Market',
        market_days: ['Wednesday', 'Sunday'],
        specialties: ['cattle', 'livestock', 'meat'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché de Meiganga',
        description: 'Agricultural market in Meiganga',
        address: 'Meiganga, Adamawa Region',
        location_lat: 6.5167,
        location_lng: 14.3000,
        market_type: 'Traditional Market',
        market_days: ['Tuesday', 'Friday'],
        specialties: ['cassava', 'vegetables', 'groundnuts'],
        is_active: true,
        verified: true
    },

    // ==========================================
    // EAST REGION (Bertoua)
    // ==========================================
    {
        name: 'Marché Central de Bertoua',
        description: 'Main market of the East Region capital',
        address: 'Centre-ville, Bertoua, East Region',
        location_lat: 4.5833,
        location_lng: 13.6833,
        market_type: 'Traditional Market',
        market_days: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
        specialties: ['cassava', 'plantains', 'cocoa', 'forest products'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché de Yokadouma',
        description: 'Forest zone market near CAR border',
        address: 'Yokadouma, East Region',
        location_lat: 3.5167,
        location_lng: 15.0500,
        market_type: 'Traditional Market',
        market_days: ['Tuesday', 'Saturday'],
        specialties: ['forest products', 'cassava', 'bushmeat'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché de Batouri',
        description: 'Agricultural market in Batouri',
        address: 'Batouri, East Region',
        location_lat: 4.4333,
        location_lng: 14.3667,
        market_type: 'Traditional Market',
        market_days: ['Wednesday', 'Saturday'],
        specialties: ['cassava', 'vegetables', 'gold'],
        is_active: true,
        verified: true
    },

    // ==========================================
    // SOUTH REGION (Ebolowa)
    // ==========================================
    {
        name: 'Marché Central d\'Ebolowa',
        description: 'Main market of the South Region capital',
        address: 'Centre-ville, Ebolowa, South Region',
        location_lat: 2.9000,
        location_lng: 11.1500,
        market_type: 'Traditional Market',
        market_days: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
        specialties: ['cocoa', 'plantains', 'palm oil', 'cassava'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché de Kribi',
        description: 'Coastal market known for seafood',
        address: 'Kribi, South Region',
        location_lat: 2.9500,
        location_lng: 9.9167,
        market_type: 'Traditional Market',
        market_days: ['Tuesday', 'Thursday', 'Saturday'],
        specialties: ['fish', 'seafood', 'fruits', 'vegetables'],
        is_active: true,
        verified: true
    },
    {
        name: 'Marché de Sangmélima',
        description: 'Agricultural market in Sangmélima',
        address: 'Sangmélima, South Region',
        location_lat: 2.9333,
        location_lng: 11.9833,
        market_type: 'Traditional Market',
        market_days: ['Wednesday', 'Saturday'],
        specialties: ['cocoa', 'cassava', 'plantains'],
        is_active: true,
        verified: true
    }
];

async function seedCameroonMarkets() {
    console.log('Starting comprehensive Cameroon markets seeding...');
    console.log(`Total markets to seed: ${cameroonMarkets.length}`);

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const marketData of cameroonMarkets) {
        try {
            // Check if market already exists by name and location
            const [market, wasCreated] = await Market.findOrCreate({
                where: {
                    name: marketData.name,
                    location_lat: marketData.location_lat,
                    location_lng: marketData.location_lng
                },
                defaults: marketData
            });

            if (wasCreated) {
                console.log(`✅ Created: ${marketData.name}`);
                created++;
            } else {
                // Update existing market with new data
                await market.update(marketData);
                console.log(`🔄 Updated: ${marketData.name}`);
                updated++;
            }
        } catch (error) {
            console.error(`❌ Error with ${marketData.name}:`, error.message);
            errors++;
        }
    }

    console.log('\n========================================');
    console.log('Seeding Complete!');
    console.log(`✅ Created: ${created}`);
    console.log(`🔄 Updated: ${updated}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total: ${cameroonMarkets.length}`);
    console.log('========================================\n');

    return { created, updated, errors };
}

// Run if called directly
if (require.main === module) {
    seedCameroonMarkets()
        .then(() => {
            console.log('Seeding completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Seeding failed:', error);
            process.exit(1);
        });
}

module.exports = { seedCameroonMarkets, cameroonMarkets };
