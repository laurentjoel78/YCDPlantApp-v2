require('dotenv').config();
const weatherService = require('../services/weatherService');

// Mock logger
const logger = {
    debug: (msg, meta) => console.log(`[DEBUG] ${msg}`, meta || ''),
    info: (msg, meta) => console.log(`[INFO] ${msg}`, meta || ''),
    warn: (msg, meta) => console.log(`[WARN] ${msg}`, meta || ''),
    error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta || '')
};

async function testWeather() {
    console.log('Testing Weather API with key:', process.env.OPENWEATHER_API_KEY);

    // Coordinates for Douala, Cameroon
    const lat = 4.0511;
    const lon = 9.7679;

    try {
        console.log(`Fetching weather for Lat: ${lat}, Lon: ${lon}...`);
        const data = await weatherService.fetchWeatherData(lat, lon, logger);

        console.log('\n✅ Weather Data Retrieved Successfully!');
        console.log('Current Temp:', data.current.temp, '°C');
        console.log('Weather:', data.current.weather[0].description);

        if (data.alerts && data.alerts.length > 0) {
            console.log('Alerts:', data.alerts.length);
        } else {
            console.log('No active weather alerts.');
        }

    } catch (error) {
        console.error('\n❌ Weather Test Failed:', error.message);
        if (error.response) {
            console.error('API Response Status:', error.response.status);
            console.error('API Response Data:', error.response.data);
        }
    }
}

testWeather();
