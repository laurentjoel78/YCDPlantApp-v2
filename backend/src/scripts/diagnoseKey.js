const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function diagnose() {
    const key = process.env.GEMINI_API_KEY;
    console.log(`Key being used: ${key ? key.substring(0, 5) + '...' + key.substring(key.length - 4) : 'None'}`);

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    try {
        console.log('Attempting to generate content...');
        const result = await model.generateContent('Test');
        const response = await result.response;
        console.log('✅ Success! Key is working.');
        console.log('Response:', response.text());
    } catch (error) {
        console.log('❌ Error Details:');
        console.log('Message:', error.message);

        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Status Text:', error.response.statusText);
        }

        // Try to parse if it's a Google API error structure
        if (error.message.includes('[')) {
            // Often the error message contains the full JSON
            console.log('Raw Error:', error.message);
        }
    }
}

diagnose();
