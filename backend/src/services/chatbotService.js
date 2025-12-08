const Groq = require('groq-sdk');
const { Farm, Crop, FarmCrop, Advisory } = require('../models');
const weatherService = require('./weatherService');

class ChatbotService {
  constructor() {
    // Initialize Groq AI
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn('GROQ_API_KEY not found in environment variables');
    }
    this.groq = new Groq({ apiKey });
  }

  async processMessage(userId, message, farmId, language = 'en') {
    try {
      console.log(`Processing message for user ${userId}, farm ${farmId}`);

      // Get farm context if farmId provided
      let context = '';
      if (farmId) {
        context = await this._getFarmContext(farmId);
      }

      // Build system prompt with context
      const systemPrompt = this._buildSystemPrompt(context, language);

      // Generate response with Groq
      const response = await this._generateResponse(systemPrompt, message);

      return response;
    } catch (error) {
      console.error('Chatbot processing failed:', error);
      throw new Error(`Chatbot processing failed: ${error.message}`);
    }
  }

  async _getFarmContext(farmId) {
    try {
      // Get farm with crops
      const farm = await Farm.findByPk(farmId, {
        include: [
          {
            model: FarmCrop,
            as: 'crops',
            include: [{ model: Crop, as: 'crop' }]
          }
        ]
      });

      if (!farm) {
        return '';
      }

      // Get recent advisories
      const advisories = await Advisory.findAll({
        where: { farm_id: farmId },
        order: [['created_at', 'DESC']],
        limit: 5,
        include: [{ model: Crop }]
      });

      // Get weather data
      let weather = null;
      if (farm.location_lat && farm.location_lng) {
        try {
          weather = await weatherService.getWeatherForCoords(
            farm.location_lat,
            farm.location_lng
          );
        } catch (err) {
          console.warn('Failed to fetch weather:', err.message);
        }
      }

      // Build context string
      const crops = farm.crops?.map(fc => fc.crop?.name).filter(Boolean) || [];
      const context = `
FARMER'S FARM INFORMATION:
- Farm Name: ${farm.name || 'Not specified'}
- Location: ${farm.region || 'Cameroon'} ${farm.location_lat && farm.location_lng ? `(${farm.location_lat}, ${farm.location_lng})` : ''}
- Size: ${farm.size_hectares || farm.size || 'Not specified'} hectares
- Soil Type: ${farm.soil_type || 'Not specified'}
- Farming Type: ${farm.farming_type || 'Not specified'}
- Irrigation: ${farm.irrigation_system || 'Not specified'}
- Current Crops: ${crops.length > 0 ? crops.join(', ') : 'None planted yet'}

${weather ? `CURRENT WEATHER CONDITIONS:
- Temperature: ${weather.temp || weather.tempMax || 'N/A'}°C
- Recent Rainfall: ${weather.recentRain || weather.recentRainMm || 0}mm
- Conditions: ${weather.description || 'N/A'}
` : ''}
${advisories.length > 0 ? `RECENT FARM ADVISORIES:
${advisories.map(a => `- ${a.title}: ${a.detail?.substring(0, 100) || ''}`).join('\n')}
` : ''}`;

      return context;
    } catch (error) {
      console.error('Error getting farm context:', error);
      return '';
    }
  }

  _buildSystemPrompt(farmContext, language) {
    const basePrompt = `You are an expert agricultural assistant for farmers in Cameroon. 
You provide practical, actionable advice about:
- Crop diseases and pest management
- Fertilizer and soil management
- Planting and harvesting timing
- Weather-based farming decisions
- Market information and pricing
- Irrigation and water management
- Crop rotation and best practices

IMPORTANT GUIDELINES:
1. Keep responses clear, concise, and practical
2. Focus on solutions available in Cameroon
3. Consider local climate and conditions
4. Use simple language farmers can understand
5. Provide specific, actionable steps
6. Be encouraging and supportive

${farmContext ? `\n${farmContext}\n` : ''}

Respond in ${language === 'fr' ? 'French' : 'English'}.`;

    return basePrompt;
  }

  async _generateResponse(systemPrompt, userMessage) {
    try {
      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 500
      });

      const text = chatCompletion.choices[0]?.message?.content || '';

      // Generate suggested follow-up questions
      const suggestions = this._generateSuggestions(userMessage, text);

      return {
        text: text,
        suggestions: suggestions,
        intent: this._detectIntent(userMessage)
      };
    } catch (error) {
      console.error('Failed to generate response:', error.message);

      // Robust Fallback
      const intent = this._detectIntent(userMessage);
      let fallbackText = "I'm having trouble connecting to the AI service right now. ";

      switch (intent) {
        case 'disease_inquiry':
          fallbackText += "For crop diseases, please ensure you check the leaves for discoloration. If you see yellowing, it might be a nutrient deficiency or viral infection. Consider consulting a local expert.";
          break;
        case 'market_inquiry':
          fallbackText += "Market prices vary by region. In general, prices are higher during the dry season. Check the 'Markets' tab for the latest prices near you.";
          break;
        case 'weather_inquiry':
          fallbackText += "Weather patterns are changing. It's best to check the 'Weather' tab for the most accurate 7-day forecast for your farm location.";
          break;
        case 'fertilizer_inquiry':
          fallbackText += "For fertilizer, NPK 20-10-10 is commonly used for maize in Cameroon. Apply it 2 weeks after planting. For cassava, rich organic compost is often sufficient.";
          break;
        default:
          fallbackText += "However, I can still help you navigate the app. You can check the 'Advisories' tab for personalized tips for your farm.";
      }

      return {
        text: fallbackText,
        suggestions: this._generateSuggestions(userMessage, fallbackText),
        intent: intent
      };
    }
  }

  _detectIntent(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('disease') || lowerMessage.includes('sick') || lowerMessage.includes('yellow') || lowerMessage.includes('dying')) {
      return 'disease_inquiry';
    }
    if (lowerMessage.includes('price') || lowerMessage.includes('market') || lowerMessage.includes('sell')) {
      return 'market_inquiry';
    }
    if (lowerMessage.includes('weather') || lowerMessage.includes('rain') || lowerMessage.includes('water')) {
      return 'weather_inquiry';
    }
    if (lowerMessage.includes('fertilizer') || lowerMessage.includes('npk') || lowerMessage.includes('soil')) {
      return 'fertilizer_inquiry';
    }
    if (lowerMessage.includes('plant') || lowerMessage.includes('harvest') || lowerMessage.includes('when')) {
      return 'timing_inquiry';
    }

    return 'general_inquiry';
  }

  _generateSuggestions(userMessage, aiResponse) {
    const intent = this._detectIntent(userMessage);

    const suggestionMap = {
      'disease_inquiry': [
        "How to prevent this disease?",
        "What treatment should I use?",
        "Is this disease spreading?",
        "Can I still harvest my crop?"
      ],
      'market_inquiry': [
        "Where can I sell nearby?",
        "Best time to sell?",
        "How to get better prices?",
        "Market demand for my crops"
      ],
      'weather_inquiry': [
        "Should I water today?",
        "When will it rain?",
        "Protect crops from heat?",
        "Drainage for heavy rain?"
      ],
      'fertilizer_inquiry': [
        "How much fertilizer to use?",
        "When to apply fertilizer?",
        "Organic alternatives?",
        "Improve soil naturally?"
      ],
      'timing_inquiry': [
        "Best planting season?",
        "When to harvest?",
        "Crop rotation advice?",
        "What to plant next?"
      ],
      'general_inquiry': [
        "Check my crops",
        "Weather forecast",
        "Market prices",
        "Farming tips"
      ]
    };

    return suggestionMap[intent] || suggestionMap['general_inquiry'];
  }
}

module.exports = new ChatbotService();