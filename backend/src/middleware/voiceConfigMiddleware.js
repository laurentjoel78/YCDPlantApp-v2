const voiceConfig = require('../config/voiceConfig');
const { AppError } = require('./errorHandling');
const fs = require('fs').promises;
const path = require('path');

exports.checkVoiceConfig = async (req, res, next) => {
    try {
        // Ensure upload directories exist
        await fs.mkdir(voiceConfig.upload.tempDir, { recursive: true });
        await fs.mkdir(voiceConfig.upload.storageDir, { recursive: true });

        // Check if feature is enabled based on request path
        const path = req.path.toLowerCase();
        
        if (path.includes('transcribe') && !voiceConfig.features.transcription) {
            throw new AppError('Speech-to-text service is not configured', 503);
        }
        
        if (path.includes('translate') && !voiceConfig.features.translation) {
            throw new AppError('Translation service is not configured', 503);
        }

        next();
    } catch (error) {
        next(error);
    }
};

exports.validateLanguage = (req, res, next) => {
    const language = req.body.language || req.query.language;
    
    if (!language) {
        return next(new AppError('Language code is required', 400));
    }

    const supportedLanguage = voiceConfig.supportedLanguages.find(l => l.code === language);
    
    if (!supportedLanguage) {
        return next(new AppError(`Language ${language} is not supported`, 400));
    }

    // Check if the requested feature is supported for this language
    const isTranscription = req.path.toLowerCase().includes('transcribe');
    const isTranslation = req.path.toLowerCase().includes('translate');

    if (isTranscription && !supportedLanguage.supported.speech) {
        return next(new AppError(`Speech recognition is not supported for ${language}`, 400));
    }

    if (isTranslation && !supportedLanguage.supported.translation) {
        return next(new AppError(`Translation is not supported for ${language}`, 400));
    }

    next();
};