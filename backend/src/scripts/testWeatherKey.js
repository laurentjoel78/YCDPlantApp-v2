const axios = require('axios');

const apiKey = '52186007f64b473584f123657252711';
const lat = 7.32994235;
const lon = 12.34778959;

async function testEndpoints() {
    console.log('Testing OpenWeather API Key...');

    // Test 1: One Call 3.0 (Current implementation)
    try {
        console.log('\n--- Testing One Call 3.0 ---');
        await axios.get(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}`);
        console.log('✅ One Call 3.0: SUCCESS');
    } catch (error) {
        console.log(`❌ One Call 3.0: FAILED (${error.response ? error.response.status : error.message})`);
        if (error.response && error.response.status === 401) {
            console.log('   (Likely requires "One Call by Call" subscription)');
        }
    }

    // Test 2: Current Weather 2.5 (Standard Free)
    try {
        console.log('\n--- Testing Current Weather 2.5 ---');
        await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`);
        console.log('✅ Current Weather 2.5: SUCCESS');
    } catch (error) {
        console.log(`❌ Current Weather 2.5: FAILED (${error.response ? error.response.status : error.message})`);
    }
}

testEndpoints();
