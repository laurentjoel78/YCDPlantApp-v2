const axios = require('axios');

async function quickTest() {
    console.log('Testing AI Assistant with fallback system...\n');

    // Using a simpler approach - just test the endpoint directly
    try {
        const response = await axios.post('http://localhost:3000/api/chatbot/message', {
            message: 'My maize has yellow leaves, what should I do?',
            language: 'en'
        }, {
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImlhdCI6MTYzMDAwMDAwMH0.test',
                'Content-Type': 'application/json'
            },
            validateStatus: () => true // Accept any status
        });

        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log('Error:', error.message);
        if (error.response) {
            console.log('Response:', error.response.data);
        }
    }
}

quickTest();
