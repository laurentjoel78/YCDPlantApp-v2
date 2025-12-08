require('dotenv').config();
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;

console.log('Testing v1 endpoint (instead of v1beta)...\n');

const postData = JSON.stringify({
    contents: [{
        parts: [{ text: "Say hello in one word" }]
    }]
});

const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1/models/gemini-pro:generateContent?key=${apiKey}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log('✅ SUCCESS!');
            console.log('Response:', text);
        } else {
            console.log('❌ Error:');
            console.log(data);
        }
    });
});

req.on('error', (e) => console.error('Request error:', e.message));
req.write(postData);
req.end();
