const axios = require('axios');
require('dotenv').config();

async function testGeminiRest() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

        console.log('Testing Gemini REST API...');

        const response = await axios.post(url, {
            contents: [{
                parts: [{
                    text: "Hello, are you working?"
                }]
            }]
        });

        console.log('\n✅ Success! Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testGeminiRest();
