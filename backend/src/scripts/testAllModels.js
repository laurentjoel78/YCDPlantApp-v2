require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const modelsToTry = [
    'gemini-pro',
    'gemini-1.0-pro',
    'models/gemini-pro',
    'models/gemini-1.0-pro'
];

async function testModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Testing different Gemini model names...\n');

    for (const modelName of modelsToTry) {
        console.log(`\nTrying: ${modelName}`);
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContent('Say hello');
            const response = await result.response;
            const text = response.text();

            console.log(`✅ SUCCESS with ${modelName}!`);
            console.log('Response:', text.substring(0, 100));
            break; // Stop on first success

        } catch (error) {
            console.log(`❌ Failed: ${error.message.substring(0, 80)}...`);
        }
    }
}

testModels();
