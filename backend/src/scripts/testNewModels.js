require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testNewModel() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Testing gemini-2.0-flash-exp model...\n');

    try {
        const genAI = new GoogleGenerativeAI(apiKey);

        // Try the experimental models
        const modelsToTry = [
            'gemini-2.0-flash-exp',
            'gemini-exp-1206',
            'gemini-2.0-flash-thinking-exp-1219'
        ];

        for (const modelName of modelsToTry) {
            console.log(`\nTrying: ${modelName}`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent('Say hello');
                const response = await result.response;
                const text = response.text();

                console.log(`✅ SUCCESS with ${modelName}!`);
                console.log('Response:', text);
                break;
            } catch (error) {
                console.log(`❌ ${modelName} failed:`, error.message.substring(0, 80));
            }
        }

    } catch (error) {
        console.log('Error:', error.message);
    }
}

testNewModel();
