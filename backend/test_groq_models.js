const Groq = require('groq-sdk');
require('dotenv').config();

async function listModels() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.error('GROQ_API_KEY not found');
        return;
    }

    const groq = new Groq({ apiKey });

    try {
        const models = await groq.models.list();
        const modelIds = models.data.map(m => m.id).join('\n');
        require('fs').writeFileSync('models_output.txt', modelIds);
        console.log('Models written to models_output.txt');
    } catch (error) {
        // If list fails, try a direct completion with the model we want to use to see the specific error
        console.error('Error listing models:', error.message);

        console.log('\nTesting direct completion with llama-3.2-11b-vision-preview...');
        try {
            const completion = await groq.chat.completions.create({
                model: "llama-3.2-11b-vision-preview",
                messages: [{ role: "user", content: "Hello" }]
            });
            console.log('Test success:', completion.choices[0].message.content);
        } catch (e) {
            console.error('Test failed:', e.message);
        }
    }
}

listModels();
