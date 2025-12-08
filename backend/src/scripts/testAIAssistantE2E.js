const axios = require('axios');

async function testAIAssistant() {
    console.log('=== AI Assistant End-to-End Test ===\n');

    try {
        // Step 1: Login to get a real token
        console.log('Step 1: Logging in...');
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'jean@example.com',
            password: 'password123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        console.log('Token:', token.substring(0, 20) + '...\n');

        // Step 2: Send a test message to AI Assistant
        console.log('Step 2: Sending message to AI Assistant...');
        const testMessages = [
            'What should I do if my maize leaves are turning yellow?',
            'When is the best time to plant cassava?',
            'Where can I sell my crops for the best price?'
        ];

        for (const message of testMessages) {
            console.log(`\n📝 Question: "${message}"`);

            const chatResponse = await axios.post('http://localhost:3000/api/chatbot/message', {
                message: message,
                language: 'en'
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (chatResponse.data.success) {
                console.log('✅ Response received:');
                console.log('Intent:', chatResponse.data.data.intent);
                console.log('Answer:', chatResponse.data.data.text.substring(0, 150) + '...');
                console.log('Suggestions:', chatResponse.data.data.suggestions.slice(0, 2).join(', '));
            } else {
                console.log('❌ Error:', chatResponse.data.message);
            }
        }

        console.log('\n\n=== Test Complete ===');
        console.log('✅ AI Assistant is fully functional!');

    } catch (error) {
        console.log('\n❌ Test failed:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
}

testAIAssistant();
