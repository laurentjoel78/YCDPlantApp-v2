const logger = require('../config/logger');
const natural = require('natural');
const imageController = require('../controllers/imageController');
const diseaseDetectionService = require('../services/diseaseDetectionService');

class ChatbotHandler {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.classifier = new natural.BayesClassifier();

    // Train the classifier with image-related queries
    this.trainClassifier();
  }

  trainClassifier() {
    // Image analysis related queries
    this.classifier.addDocument('check my plant', 'image_analysis');
    this.classifier.addDocument('analyze plant', 'image_analysis');
    this.classifier.addDocument('what disease is this', 'image_analysis');
    this.classifier.addDocument('identify disease', 'image_analysis');
    this.classifier.addDocument('plant problem', 'image_analysis');
    this.classifier.addDocument('sick plant', 'image_analysis');

    // Camera related queries
    this.classifier.addDocument('take picture', 'camera');
    this.classifier.addDocument('use camera', 'camera');
    this.classifier.addDocument('capture photo', 'camera');
    this.classifier.addDocument('snap picture', 'camera');

    // Train the classifier
    this.classifier.train();
  }

  async handleMessage(message, attachments = null) {
    try {
      // Classify the message
      const classification = this.classifier.classify(message.toLowerCase());

      // If there's an image attachment, process it regardless of message
      if (attachments && attachments.image) {
        return this.handleImageAnalysis(attachments.image);
      }

      switch (classification) {
        case 'image_analysis':
          return {
            type: 'request',
            content: {
              message: 'Please provide an image of your plant for analysis. You can either:',
              options: [
                {
                  type: 'upload',
                  label: 'Upload an image',
                  accept: 'image/*'
                },
                {
                  type: 'camera',
                  label: 'Take a picture now'
                }
              ]
            }
          };

        case 'camera':
          return {
            type: 'camera_request',
            content: {
              message: 'Sure! Please take a clear picture of your plant.',
              camera: {
                facing: 'environment', // Use back camera
                flash: 'auto'
              }
            }
          };

        default:
          // Handle other types of queries...
          return {
            type: 'text',
            content: 'I can help you analyze plant diseases. Just send me a picture or ask me to take one!'
          };
      }
    } catch (error) {
      logger.error('Chatbot error:', error);
      return {
        type: 'error',
        content: 'Sorry, I encountered an error processing your request.'
      };
    }
  }

  async handleImageAnalysis(image) {
    try {
      // Process the image and get disease detection results
      const result = await imageController.processChatbotImage({ body: { image } });

      // Format chatbot response
      return {
        type: 'analysis_result',
        content: {
          message: this.formatDetectionResponse(result.data),
          details: result.data.detection,
          recommendations: result.data.content.recommendations,
          image: result.data.content.image
        }
      };
    } catch (error) {
      logger.error('Image analysis error:', error);
      return {
        type: 'error',
        content: 'Sorry, I had trouble analyzing that image. Please make sure it\'s a clear picture of the plant.'
      };
    }
  }

  formatDetectionResponse(result) {
    const { detection } = result.content;
    
    if (detection.confidence < 0.5) {
      return "I'm not quite sure about this one. Could you please take another picture with better lighting and focus?";
    }

    return `I've detected ${detection.disease} with ${Math.round(detection.confidence * 100)}% confidence. Here are my recommendations for treatment:`;
  }
}

module.exports = new ChatbotHandler();