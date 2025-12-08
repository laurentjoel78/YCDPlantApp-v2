const chatbotService = require('../services/chatbotService');
const { User, Farm, Crop, FarmCrop } = require('../models');
const { v4: uuidv4 } = require('uuid');

async function verifyContext() {
    console.log('Starting Chatbot Context Verification...');

    try {
        // 1. Create a dummy user and farm with specific details
        const userId = uuidv4();
        const farmId = uuidv4();
        const cropId = uuidv4();

        // Mock data - we won't actually save to DB to avoid pollution, 
        // but we need to mock the DB calls in chatbotService.
        // Since we can't easily mock require('../models') from here without a library,
        // we will try to rely on the actual DB if possible, or mock the service method.

        // Actually, let's just mock the _getFarmContext method of the service instance
        // to ensure the PROMPT generation works as expected. 
        // Testing the DB retrieval is separate.

        const originalGetContext = chatbotService._getFarmContext;

        chatbotService._getFarmContext = async (fid) => {
            console.log(`[Mock] Fetching context for farm ${fid}`);
            return `
FARMER'S FARM INFORMATION:
- Farm Name: Test Farm Alpha
- Location: Douala, Cameroon
- Size: 5 hectares
- Soil Type: Volcanic
- Current Crops: Cocoa, Cassava
- Weather: Rainy, 25°C
`;
        };

        const message = "What fertilizer should I use for my crops?";
        console.log(`\nUser Message: "${message}"`);

        const response = await chatbotService.processMessage(userId, message, farmId);

        console.log('\nAI Response:');
        console.log(response.text);

        // Check for keywords
        const lowerText = response.text.toLowerCase();
        const hasCocoa = lowerText.includes('cocoa');
        const hasCassava = lowerText.includes('cassava');

        if (hasCocoa || hasCassava) {
            console.log('\n✅ SUCCESS: AI mentioned the user\'s crops!');
        } else {
            console.log('\n⚠️ WARNING: AI did not explicitly mention the crops. Check the response relevance.');
        }

        // Restore method
        chatbotService._getFarmContext = originalGetContext;

    } catch (error) {
        console.error('❌ Verification Failed:', error);
    }
}

verifyContext();
