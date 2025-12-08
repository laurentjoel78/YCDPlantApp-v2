require('dotenv').config();
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;

console.log('=== Comprehensive Gemini API Test ===\n');
console.log('API Key:', apiKey ? `${apiKey.substring(0, 15)}...${apiKey.slice(-5)}` : 'NOT FOUND');

// Test 1: List available models
function listModels() {
    return new Promise((resolve, reject) => {
        console.log('\n--- Test 1: Listing Available Models ---');

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models?key=${apiKey}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('Status:', res.statusCode);
                if (res.statusCode === 200) {
                    const parsed = JSON.parse(data);
                    console.log('Available models:', parsed.models?.map(m => m.name).join(', ') || 'None');
                } else {
                    console.log('Error:', data);
                }
                resolve();
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Test 2: Try generating content with different endpoints
function testGenerate(modelName, apiVersion) {
    return new Promise((resolve) => {
        console.log(`\n--- Testing: ${modelName} (${apiVersion}) ---`);

        const path = `/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`;

        const postData = JSON.stringify({
            contents: [{
                parts: [{ text: "Say hello" }]
            }]
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: path,
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
                if (res.statusCode === 200) {
                    const parsed = JSON.parse(data);
                    const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    console.log('✅ SUCCESS!');
                    console.log('Response:', text?.substring(0, 100) || data.substring(0, 100));
                } else {
                    console.log('❌ Status:', res.statusCode);
                    console.log('Error:', data.substring(0, 200));
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.log('❌ Request failed:', e.message);
            resolve();
        });

        req.write(postData);
        req.end();
    });
}

async function runTests() {
    await listModels();

    const tests = [
        ['gemini-pro', 'v1beta'],
        ['gemini-1.0-pro', 'v1beta'],
        ['gemini-pro', 'v1'],
        ['gemini-1.5-flash', 'v1beta'],
    ];

    for (const [model, version] of tests) {
        await testGenerate(model, version);
        await new Promise(r => setTimeout(r, 1000)); // Wait 1s between tests
    }

    console.log('\n=== Tests Complete ===');
}

runTests().catch(console.error);
