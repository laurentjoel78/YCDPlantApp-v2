const axios = require('axios');

async function testEndpoint() {
    try {
        console.log('Testing Chatbot Endpoint at http://localhost:3000/api/chatbot/message...');
        const response = await axios.post('http://localhost:3000/api/chatbot/message', {
            message: 'Hello'
        }, {
            headers: {
                'Authorization': 'Bearer YOUR_TEST_TOKEN',
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Success! Status:', response.status);
        console.log('Response:', response.data);
    } catch (error) {
        console.log('❌ Error Details:');
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
            console.log('Headers:', error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            console.log('No response received. Is the server running?');
            console.log('Error request:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.log('Error Message:', error.message);
        }
    }
}

testEndpoint();
