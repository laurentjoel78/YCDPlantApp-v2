// Load environment first
require('dotenv').config();

const diseaseDetectionService = require('../services/diseaseDetectionService');

async function testGroqVision() {
    console.log('='.repeat(50));
    console.log('TESTING GROQ VISION API');
    console.log('='.repeat(50));

    const apiKey = process.env.GROQ_API_KEY;
    console.log('\nAPI Key:', apiKey ? '✅ FOUND' : '❌ NOT FOUND');

    if (!apiKey) {
        console.log('ERROR: GROQ_API_KEY not in .env');
        return;
    }

    const mockBuffer = Buffer.from('mock image data');
    const mockLogger = {
        info: (msg, data) => console.log('ℹ️ ', msg),
        debug: (msg, data) => console.log('🔍', msg),
        warn: (msg, data) => console.warn('⚠️ ', msg),
        error: (msg, data) => console.error('❌', msg)
    };

    try {
        console.log('\nCalling Groq Vision API...\n');
        const result = await diseaseDetectionService.detectDisease(mockBuffer, mockLogger);

        console.log('\n' + '='.repeat(50));
        console.log('✅ SUCCESS! Disease Detection Results:');
        console.log('='.repeat(50));
        console.log('Disease:', result.disease);
        console.log('Confidence:', (result.confidence * 100).toFixed(1) + '%');
        console.log('\nDescription:');
        console.log(result.description);
        console.log('\nTreatment:');
        console.log(result.treatment);
        console.log('='.repeat(50));

    } catch (error) {
        console.log('\n❌ TEST FAILED:', error.message);
        console.error(error.stack);
    }
}

testGroqVision();
