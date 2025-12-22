const Groq = require('groq-sdk');
const path = require('path');
const fs = require('fs').promises;

class DiseaseDetectionService {
  constructor() {
    // Initialize Groq AI (already working for chatbot)
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn('GROQ_API_KEY not found in environment variables');
    }
    this.groq = new Groq({ apiKey });

    // Load disease database
    this.diseasesPath = path.join(__dirname, '../../ml/data/diseases.json');
    this.diseases = null;
  }

  async loadDiseases() {
    if (!this.diseases) {
      try {
        const data = await fs.readFile(this.diseasesPath, 'utf8');
        this.diseases = JSON.parse(data);
      } catch (error) {
        console.warn('Disease database not found, using fallback knowledge');
        this.diseases = this._getFallbackDiseases();
      }
    }
    return this.diseases;
  }

  async detectDisease(imageBuffer, logger) {
    try {
      logger.info('Starting AI-based disease detection with Groq');

      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');
      const imageUrl = `data:image/jpeg;base64,${base64Image}`;

      // Groq LLaVA/Llama3 vision model
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

      logger.debug('Calling Groq Vision API');

      const completion = await this.groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct", // Verified working model
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        temperature: 0.2, // Lower temperature for more consistent JSON
        max_tokens: 1000
      });

      const responseText = completion.choices[0]?.message?.content || '';
      logger.debug('Groq API response received', { responseLength: responseText.length });

      // Parse JSON response
      let detectionResult;
      try {
        // More robust JSON extraction (handles markdown blocks)
        const jsonBlock = responseText.includes('```json')
          ? responseText.split('```json')[1].split('```')[0]
          : responseText.includes('```')
            ? responseText.split('```')[1].split('```')[0]
            : responseText;

        const jsonMatch = jsonBlock.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          detectionResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        logger.warn('Failed to parse response as JSON, trying direct cleanup');
        try {
          const cleanText = responseText.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
          detectionResult = JSON.parse(cleanText);
        } catch (e) {
          detectionResult = this._parseFallback(responseText, logger);
        }
      }

      // Enrich with database information
      const diseases = await this.loadDiseases();
      const enrichedResult = this._enrichResult(detectionResult, diseases, logger);

      logger.info('Disease detection completed', {
        disease: enrichedResult.disease,
        confidence: enrichedResult.confidence
      });

      return enrichedResult;

    } catch (error) {
      logger.error('Disease detection failed', {
        error: error.message,
        stack: error.stack
      });

      // Graceful fallback
      return {
        disease: 'Detection Failed',
        confidence: 0,
        description: 'Unable to analyze the image. Please ensure the image is clear and shows the plant.',
        treatment: 'Try taking another photo with better lighting focused on affected areas.',
        severity: 'unknown',
        prevention: 'Maintain good plant hygiene and regular monitoring.'
      };
    }
  }

  _parseFallback(text, logger) {
    logger.debug('Using fallback text parsing');
    return {
      disease: 'Analysis Complete',
      confidence: 0.7,
      description: text.substring(0, 200) + '...',
      treatment: 'Please consult a local agricultural extension officer.',
      severity: 'moderate',
      prevention: 'Regular monitoring and good agricultural practices'
    };
  }

  _enrichResult(result, diseases, logger) {
    if (diseases && result.disease && result.disease !== 'Healthy' && result.disease !== 'Unknown') {
      const diseaseKey = Object.keys(diseases).find(key =>
        diseases[key].name.toLowerCase().includes(result.disease.toLowerCase()) ||
        result.disease.toLowerCase().includes(diseases[key].name.toLowerCase())
      );

      if (diseaseKey) {
        const dbDisease = diseases[diseaseKey];
        logger.debug('Enriching with database info', { diseaseKey });

        return {
          ...result,
          description: result.description || dbDisease.description,
          treatment: result.treatment || dbDisease.treatment,
          prevention: result.prevention || dbDisease.prevention,
          recommendations: dbDisease.recommendations || []
        };
      }
    }
    return result;
  }

  _getFallbackDiseases() {
    return {
      'cocoa_black_pod': {
        name: 'Cocoa Black Pod Disease',
        description: 'Fungal disease causing black spots on cocoa pods',
        treatment: 'Remove infected pods, apply copper fungicide, improve drainage',
        prevention: 'Regular pruning, proper spacing, timely harvesting'
      },
      'cassava_mosaic': {
        name: 'Cassava Mosaic Virus',
        description: 'Viral disease with yellow/white patches on leaves',
        treatment: 'Remove infected plants, use virus-free planting material',
        prevention: 'Plant resistant varieties, control whitefly vectors'
      },
      'maize_streak': {
        name: 'Maize Streak Virus',
        description: 'Pale streaks along leaf veins',
        treatment: 'Remove infected plants, plant resistant varieties',
        prevention: 'Early planting, resistant varieties, control leafhoppers'
      }
    };
  }

  // Compatibility methods
  async getCachedResult(detectionId, logger) {
    logger.debug('Cache not implemented for AI detection');
    return null;
  }

  async cleanCache(maxAge, logger) {
    logger.debug('Cache cleanup not needed');
    return { filesRemoved: 0, spaceFreed: 0 };
  }
}

module.exports = new DiseaseDetectionService();