const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

async function testDiseaseDetection() {
    console.log('Testing Disease Detection System...\n');

    try {
        // Use a sample test image - you can replace this with an actual plant image path
        const testImagePath = path.join(__dirname, 'test_plant.jpg');

        // Check if test image exists
        if (!fs.existsSync(testImagePath)) {
            console.log('⚠️  No test image found at:', testImagePath);
            console.log('Please add a plant image named "test_plant.jpg" to the scripts folder');
            console.log('\nTesting with mock buffer instead...\n');

            // Test the service directly with a small buffer
            const diseaseDetectionService = require('../services/diseaseDetectionService');
            const mockBuffer = Buffer.from('mock image data');
            const mockLogger = {
                info: console.log,
                debug: console.log,
                warn: console.warn,
                error: console.error
            };

            console.log('Calling disease detection service...');
            const result = await diseaseDetectionService.detectDisease(mockBuffer, mockLogger);

            console.log('\n✅ Service Response:');
            console.log('Disease:', result.disease);
            console.log('Confidence:', result.confidence);
            console.log('Description:', result.description.substring(0, 100) + '...');
            console.log('Treatment:', result.treatment.substring(0, 100) + '...');

            return;
        }

        //If we have a real image, test via HTTP endpoint
        const formData = new FormData();
        formData.append('image', fs.createReadStream(testImagePath));

        const response = await axios.post(
            'http://localhost:3000/api/disease-detection/analyze',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                }
            }
        );

        console.log('✅ Disease Detection Results:');
        console.log('Disease:', response.data.disease);
        console.log('Confidence:', response.data.confidence);
        console.log('Description:', response.data.description);
        console.log('\nTreatment:');
        console.log(response.data.treatment);

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

testDiseaseDetection();
