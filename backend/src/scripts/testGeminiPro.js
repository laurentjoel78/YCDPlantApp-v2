require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiDirect() {
    console.log('Testing Gemini API with gemini-pro...\n');

    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key present:', !!apiKey);
    console.log('API Key starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'N/A');

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        console.log('\nSending test message...');
        const result = await model.generateContent('Say "Hello, I am working!" in one sentence.');
        const response = await result.response;
        const text = response.text();

        console.log('\n✅ SUCCESS!');
        console.log('Response:', text);

    } catch (error) {
        console.log('\n❌ ERROR:');
        console.log('Message:', error.message);
        console.log('\nFull error:', JSON.stringify(error, null, 2));
    }
}

testGeminiDirect();
