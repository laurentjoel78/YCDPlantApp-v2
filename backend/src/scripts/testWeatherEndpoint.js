const axios = require('axios');

async function testWeatherEndpoint() {
    console.log('Testing Weather API Endpoint (http://localhost:3000/api/weather/current)...\n');

    // User's coordinates (Mountain View)
    const lat = 37.4219983;
    const lon = -122.084;

    try {
        const response = await axios.get('http://localhost:3000/api/weather/current', {
            params: { lat, lng: lon }
        });

        console.log('SUCCESS');
        console.log('Status:', response.status);
        console.log('Temp:', response.data.data.current.temp);

    } catch (error) {
        console.log('FAILED: ' + error.message);
        if (error.response) {
            console.log('STATUS: ' + error.response.status);
            console.log('DATA: ' + JSON.stringify(error.response.data));
        }
    }
}

testWeatherEndpoint();
