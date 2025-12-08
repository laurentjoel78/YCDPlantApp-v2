const weatherService = require('../services/weatherService');

async function testFallback() {
    console.log('Testing Weather Service Fallback...');

    // Force an invalid API key to trigger the 401 error
    weatherService.apiKey = 'INVALID_KEY';

    const coords = { lat: 7.32994235, lng: 12.34778959 }; // User's coordinates from log

    try {
        const result = await weatherService.getWeatherForCoords(coords);
        console.log('Result:', result);

        if (result.tempMax !== 30 || result.recentRain !== 0) {
            // If it returns defaults (30, 0), it might be failing to fetch Open-Meteo OR Open-Meteo returned those exact values.
            // But Open-Meteo usually returns real data.
            // Let's check if the service logged the fallback.
            console.log('✅ Fallback returned data (or defaults if that is the actual weather).');
        } else {
            console.log('⚠️ Returned defaults. This might mean fallback failed or weather is exactly 30°C/0 rain.');
        }

        // Let's try to call fetchFromOpenMeteo directly to see what it returns for these coords
        console.log('\nDirect Open-Meteo Check:');
        const omData = await weatherService.fetchFromOpenMeteo(coords.lat, coords.lng);
        console.log('Open-Meteo Temp Max:', omData.daily[0].temp.max);
        console.log('Open-Meteo Rain:', omData.current.rain['1h']);

    } catch (error) {
        console.error('❌ Test Failed:', error);
    }
}

testFallback();
