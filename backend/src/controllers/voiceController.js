const voiceService = require('../services/voiceService');
const { AppError } = require('../middleware/errorHandling');
const loggingService = require('../services/loggingService');

exports.uploadVoiceRecording = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No audio file provided', 400);
    }

    const { language } = req.body;
    if (!language) {
      throw new AppError('Language is required', 400);
    }

    const recording = await voiceService.processVoiceRecording(
      req.file,
      req.user.id,
      language
    );

    await loggingService.logUserActivity({
      userId: req.user.id,
      activityType: 'voice_upload',
      description: 'Uploaded voice recording',
      metadata: {
        recordingId: recording.id,
        language
      }
    });

    res.status(201).json({
      status: 'success',
      data: recording
    });
  } catch (error) {
    next(error);
  }
};

exports.getVoiceRecording = async (req, res, next) => {
  try {
    const recording = await voiceService.getVoiceRecording(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      status: 'success',
      data: recording
    });
  } catch (error) {
    next(error);
  }
};

exports.listVoiceRecordings = async (req, res, next) => {
  try {
    const { status, language } = req.query;
    const recordings = await voiceService.listVoiceRecordings(req.user.id, {
      status,
      language
    });

    res.status(200).json({
      status: 'success',
      data: recordings
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteVoiceRecording = async (req, res, next) => {
  try {
    await voiceService.deleteVoiceRecording(req.params.id, req.user.id);

    await loggingService.logUserActivity({
      userId: req.user.id,
      activityType: 'voice_delete',
      description: 'Deleted voice recording',
      metadata: {
        recordingId: req.params.id
      }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

exports.translateText = async (req, res, next) => {
  try {
    const { text, targetLanguage } = req.body;

    if (!text || !targetLanguage) {
      throw new AppError('Text and target language are required', 400);
    }

    const translation = await voiceService.translateText(text, targetLanguage);

    await loggingService.logUserActivity({
      userId: req.user.id,
      activityType: 'text_translation',
      description: 'Translated text',
      metadata: {
        targetLanguage,
        textLength: text.length
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        translation
      }
    });
  } catch (error) {
    next(error);
  }
};