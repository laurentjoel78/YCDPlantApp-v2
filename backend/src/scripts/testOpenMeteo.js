const axios = require('axios');

async function testOpenMeteo() {
    console.log('Testing Open-Meteo API (Fallback)...');

    // User's coordinates (Mountain View)
    const lat = 37.4219983;
    const lon = -122.084;

    const url = 'https://api.open-meteo.com/v1/forecast';
    const params = {
        latitude: lat,
        longitude: lon,
        hourly: 'temperature_2m,precipitation,precipitation_probability,windspeed_10m,winddirection_10m,relativehumidity_2m',
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_hours',
        current_weather: true,
        timezone: 'UTC'
    };

    try {
        console.log(`Requesting: ${url}`);
        console.log('Params:', JSON.stringify(params, null, 2));

        const response = await axios.get(url, { params, timeout: 10000 });

        console.log('\n✅ Open-Meteo Success!');
        console.log('Status:', response.status);
        console.log('Current Weather:', response.data.current_weather);

    } catch (error) {
        console.error('\n❌ Open-Meteo Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testOpenMeteo();
