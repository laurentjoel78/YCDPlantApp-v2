const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function testDiseaseDetection() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.error('GROQ_API_KEY not found');
        return;
    }

    const groq = new Groq({ apiKey });

    // Use one of the user's uploaded images (Noisy field image)
    // Note: I will use the path provided in the user metadata context
    // "C:/Users/laure/.gemini/antigravity/brain/535d24bb-8c59-4852-ab65-7a6832d1d1bf/uploaded_image_2_1766390313756.jpg" is the field image
    // However, I need to make sure I can access it. I'll assume I can read from the artifact directory or copy it if needed.
    // For the script to run locally on the user's machine, I need to point to a file that exists. 
    // Since I cannot guarantee the artifact path is accessible to the node process directly if permissions differ (unlikely but possible), 
    // I will try to use the absolute path.

    const imagePath = "C:/Users/laure/.gemini/antigravity/brain/535d24bb-8c59-4852-ab65-7a6832d1d1bf/uploaded_image_2_1766390313756.jpg";

    console.log(`Reading image from: ${imagePath}`);

    try {
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const imageUrl = `data:image/jpeg;base64,${base64Image}`;

        const prompt = `You are an expert agricultural pathologist specializing in crop diseases in Africa, particularly Cameroon.

IMAGE ANALYSIS GUIDELINES:
1. BACKGROUND NOISE: The image might be taken in a busy field or courtyard. Ignore weeds, tools, or distant trees.
2. MULTIPLE PLANTS: If there are many plants (like a clearing or garden), focus on the plant that is most prominent or appears to have symptoms.
3. DISTANCE: For wide shots of fields, identify general crop health or patterns of yellowing/wilting.

Analyze this plant image and provide your assessment in JSON format:

{
  "disease": "Disease name, 'Healthy', or 'Check another plant'",
  "confidence": 0.0-1.0,
  "description": "Short description of symptoms. Mention if multiple crops are visible.",
  "treatment": "Specific treatment steps for farmers in Cameroon",
  "severity": "mild|moderate|severe|na",
  "prevention": "Prevention tips for the whole plot"
}

Common diseases to check for:
- Plantain/Banana: Black Sigatoka, Fusarium Wilt
- Cassava: Mosaic Virus, Bacterial Blight
- Tomato: Blight, Leaf Curl
- Cocoa: Black Pod
- Maize: Streak Virus

Return ONLY valid JSON.`;

        console.log('Sending request to Groq (meta-llama/llama-4-scout-17b-16e-instruct)...');

        const completion = await groq.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: imageUrl } }
                    ]
                }
            ],
            temperature: 0.2,
            max_tokens: 1000
        });

        const responseText = completion.choices[0]?.message?.content || '';
        console.log('\n--- AI RESPONSE ---');
        console.log(responseText);
        console.log('-------------------\n');

    } catch (error) {
        console.error('Test Failed:', error.message);
        if (error.error) console.error(error.error);
    }
}

testDiseaseDetection();
