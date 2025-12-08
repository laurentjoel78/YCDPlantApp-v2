require('dotenv').config();
const axios = require('axios');

async function testStandardEndpoint() {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    console.log('Testing Standard OpenWeatherMap Endpoint (2.5/weather)...');

    const lat = 4.0511;
    const lon = 9.7679;

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        console.log('Requesting:', url.replace(apiKey, 'HIDDEN_KEY'));

        const response = await axios.get(url);

        console.log('\n✅ Standard Endpoint Success!');
        console.log('Status:', response.status);
        console.log('Temp:', response.data.main.temp);
        console.log('Weather:', response.data.weather[0].description);

    } catch (error) {
        console.error('\n❌ Standard Endpoint Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testStandardEndpoint();
