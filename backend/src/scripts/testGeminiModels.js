const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);

        // Note: The Node.js SDK doesn't have a direct listModels method on the client instance in some versions
        // But let's try to just use 'gemini-pro' which is the standard
        console.log('Testing standard models...');

        const models = ['gemini-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'];

        for (const modelName of models) {
            console.log(`\nTesting model: ${modelName}`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hi");
                const response = await result.response;
                console.log(`✅ ${modelName} works!`);
            } catch (e) {
                console.log(`❌ ${modelName} failed: ${e.message}`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

listModels();
