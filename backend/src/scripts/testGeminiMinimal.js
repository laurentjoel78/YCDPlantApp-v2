// Load environment first
require('dotenv').config();

async function testGeminiMinimal() {
    console.log('Minimal Gemini Test\n');

    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key:', apiKey ? 'Found' : 'Missing');

    if (!apiKey) {
        console.log('ERROR: No API key');
        return;
    }

    try {
        // Try importing the SDK
        console.log('\n1. Importing SDK...');
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        console.log('   ✅ Import successful');

        // Try initializing
        console.log('\n2. Initializing...');
        const genAI = new GoogleGenerativeAI(apiKey);
        console.log('   ✅ Init successful');
        console.log('   Type:', typeof genAI);
        console.log('   Keys:', Object.keys(genAI).join(', '));

        // Try getting model
        console.log('\n3. Getting model...');
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log('   ✅ Model retrieved');
        console.log('   Type:', typeof model);
        console.log('   Keys:', Object.keys(model).join(', '));

        // Try simple generation
        console.log('\n4. Testing generation...');
        const result = await model.generateContent('Say hello');
        console.log('   ✅ Generation started');

        const response = await result.response;
        console.log('   ✅ Response received');

        const text = response.text();
        console.log('   Response:', text);

        console.log('\n✅ ALL TESTS PASSED!');

    } catch (error) {
        console.log('\n❌ ERROR AT:', error.stack ? error.stack.split('\n')[0] : 'Unknown');
        console.log('\nFull Error:');
        console.error(error);
    }
}

testGeminiMinimal();
