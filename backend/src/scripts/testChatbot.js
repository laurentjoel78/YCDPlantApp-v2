/**
 * Test script for Chatbot API with Gemini
 * Run with: node src/scripts/testChatbot.js <userId> <farmId>
 */

const ChatbotService = require('../services/chatbotService');
const { User, Farm } = require('../models');

async function testChatbot() {
    try {
        console.log('Testing Chatbot with Gemini...\n');

        // Use provided IDs or find defaults
        let userId = process.argv[2];
        let farmId = process.argv[3];

        if (!userId) {
            const user = await User.findOne();
            if (user) {
                userId = user.id;
                console.log(`Using found user: ${user.email} (${userId})`);
            } else {
                console.error('No users found in database');
                process.exit(1);
            }
        }

        if (!farmId) {
            const farm = await Farm.findOne({ where: { user_id: userId } });
            if (farm) {
                farmId = farm.id;
                console.log(`Using found farm: ${farm.name} (${farmId})`);
            } else {
                console.log('No farm found for user, testing without farm context');
            }
        }

        // Test message
        const message = "What crops should I plant in my region right now?";
        console.log(`\nSending message: "${message}"\n`);

        const response = await ChatbotService.processMessage(
            userId,
            message,
            farmId,
            'en'
        );

        console.log('\n✅ Chatbot Response:');
        console.log('-------------------');
        console.log(response.text);
        console.log('-------------------');

        if (response.suggestions && response.suggestions.length > 0) {
            console.log('\nSuggested Actions:');
            response.suggestions.forEach(s => console.log(`- ${s}`));
        }

        console.log(`\nIntent detected: ${response.intent}`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Chatbot test failed:', error);
        process.exit(1);
    }
}

testChatbot();
