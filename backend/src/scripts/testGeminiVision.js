const diseaseDetectionService = require('../services/diseaseDetectionService');

async function testGeminiConnection() {
    console.log('Testing Gemini Vision API Connection...\n');

    // Check if API key is loaded
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key loaded:', apiKey ? `Yes (${apiKey.substring(0, 10)}...)` : 'NO ❌');

    if (!apiKey) {
        console.log('\n❌ PROBLEM: GEMINI_API_KEY not found in environment');
        console.log('Please ensure GEMINI_API_KEY is set in backend/.env file');
        return;
    }

    // Create a simple mock image buffer for testing
    const mockBuffer = Buffer.from('mock image data for testing');
    const mockLogger = {
        info: (msg, data) => console.log('ℹ️ ', msg, data || ''),
        debug: (msg, data) => console.log('🔍', msg, data || ''),
        warn: (msg, data) => console.warn('⚠️ ', msg, data || ''),
        error: (msg, data) => console.error('❌', msg, data || '')
    };

    try {
        console.log('\nCalling Gemini Vision API...\n');
        const result = await diseaseDetectionService.detectDisease(mockBuffer, mockLogger);

        console.log('\n✅ SUCCESS! Gemini API Response:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Disease:', result.disease);
        console.log('Confidence:', (result.confidence * 100).toFixed(1) + '%');
        console.log('\nDescription:');
        console.log(result.description);
        console.log('\nTreatment:');
        console.log(result.treatment);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error('Full error:', error);
    }
}

// Load .env before running
require('dotenv').config();
testGeminiConnection();
