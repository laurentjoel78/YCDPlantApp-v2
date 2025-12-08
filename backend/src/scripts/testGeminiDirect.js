// Load environment first
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiDirectly() {
    console.log('='.repeat(50));
    console.log('TESTING GEMINI VISION API CONNECTION');
    console.log('='.repeat(50));

    // Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('\n1. API Key Check:');
    console.log('   Status:', apiKey ? '✅ FOUND' : '❌ NOT FOUND');
    if (apiKey) {
        console.log('   Key:', apiKey.substring(0, 15) + '...' + apiKey.substring(apiKey.length - 4));
    }

    if (!apiKey) {
        console.log('\n❌ ERROR: GEMINI_API_KEY not found in .env file');
        console.log('   Please add: GEMINI_API_KEY=your_key_here');
        return;
    }

    try {
        console.log('\n2. Initializing Gemini AI...');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log('   ✅ Gemini AI initialized');

        console.log('\n3. Sending test prompt to Gemini...');
        const testPrompt = 'Respond with just the word "SUCCESS" if you receive this message.';

        const result = await model.generateContent(testPrompt);
        const response = await result.response;
        const text = response.text();

        console.log('   ✅ Gemini responded!');
        console.log('   Response:', text.trim());

        console.log('\n4. Testing Vision capability with mock image...');
        const mockImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

        const visionResult = await model.generateContent([
            'Describe what you see in this image in one word.',
            {
                inlineData: {
                    mimeType: 'image/png',
                    data: mockImageBase64
                }
            }
        ]);

        const visionResponse = await visionResult.response;
        const visionText = visionResponse.text();

        console.log('   ✅ Vision API working!');
        console.log('   Response:', visionText.trim());

        console.log('\n' + '='.repeat(50));
        console.log('✅ ALL TESTS PASSED - Gemini Vision is ready!');
        console.log('='.repeat(50));

    } catch (error) {
        console.log('\n' + '='.repeat(50));
        console.log('❌ TEST FAILED');
        console.log('='.repeat(50));
        console.error('\nError:', error.message);
        if (error.response) {
            console.error('Response:', error.response);
        }
    }
}

testGeminiDirectly();
