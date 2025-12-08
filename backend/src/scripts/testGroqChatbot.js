require('dotenv').config();
const ChatbotService = require('../services/chatbotService');

async function test() {
    console.log('=== Testing Groq-Powered AI Assistant ===\n');

    const testMessages = [
        'My maize leaves are turning yellow, what should I do?',
        'When is the best time to plant cassava in Cameroon?',
        'How do I get better prices for my crops at the market?'
    ];

    for (const message of testMessages) {
        console.log(`\n📝 Question: "${message}"`);
        console.log('---'.repeat(15));

        try {
            const response = await ChatbotService.processMessage(
                'test-user-123',
                message,
                null, // No farm ID for this test
                'en'
            );

            console.log('✅ Response received!');
            console.log('Intent:', response.intent);
            console.log('\n💬 Answer:', response.text);
            console.log('\n💡 Suggestions:', response.suggestions.slice(0, 3).join(', '));

        } catch (error) {
            console.log('❌ Error:', error.message);
        }

        console.log('\n');
    }

    console.log('=== Test Complete ===');
}

test();
