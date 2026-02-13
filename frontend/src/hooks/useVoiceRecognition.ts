import { useState, useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { api } from '../services/api';

export type VoiceLanguage = 'en' | 'fr' | 'en-US' | 'fr-FR';

// Custom recording options optimized for Groq Whisper compatibility
// Android: M4A/AAC at standard rates (converted to 16kHz WAV server-side via ffmpeg)
// iOS: WAV with LINEAR PCM (universally supported, sent directly)
const WHISPER_RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: 2,  // MPEG_4 (Audio.AndroidOutputFormat.MPEG_4) 
    audioEncoder: 3,  // AAC (Audio.AndroidAudioEncoder.AAC)
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.wav',
    outputFormat: 6, // LINEARPCM
    audioQuality: 127, // MAX
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

interface VoiceRecognitionState {
  isRecording: boolean;
  isProcessing: boolean;
  transcription: string | null;
  error: string | null;
  recordingDuration: number;
}

export const useVoiceRecognition = () => {
  const [state, setState] = useState<VoiceRecognitionState>({
    isRecording: false,
    isProcessing: false,
    transcription: null,
    error: null,
    recordingDuration: 0,
  });
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Microphone permission is required for voice input. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  const startRecording = async (language: VoiceLanguage = 'en-US') => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Use custom recording options optimized for Groq Whisper
      // Falls back to HIGH_QUALITY if OGG/OPUS not supported (older Android)
      let recording: Audio.Recording;
      try {
        const result = await Audio.Recording.createAsync(WHISPER_RECORDING_OPTIONS);
        recording = result.recording;
      } catch (formatError) {
        console.warn('OGG/OPUS recording not supported, falling back to HIGH_QUALITY:', formatError);
        const result = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recording = result.recording;
      }
      
      recordingRef.current = recording;
      
      setState(prev => ({
        ...prev,
        isRecording: true,
        error: null,
        transcription: null,
        recordingDuration: 0,
      }));

      durationIntervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          recordingDuration: prev.recordingDuration + 1,
        }));
      }, 1000);

    } catch (error: any) {
      console.error('Failed to start recording:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to start recording. Please try again.',
        isRecording: false,
      }));
    }
  };

  const stopRecording = async (language: VoiceLanguage = 'en-US'): Promise<string | null> => {
    try {
      if (!recordingRef.current) {
        return null;
      }

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      setState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: true,
      }));

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error('No recording URI available');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const transcription = await sendAudioForTranscription(uri, language);
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        transcription,
      }));

      return transcription;

    } catch (error: any) {
      console.error('Failed to stop recording:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to process recording',
        isRecording: false,
        isProcessing: false,
      }));
      return null;
    }
  };

  const cancelRecording = async () => {
    try {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }

      setState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
        recordingDuration: 0,
      }));
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const clearTranscription = () => {
    setState(prev => ({ ...prev, transcription: null }));
  };

  return {
    isRecording: state.isRecording,
    isProcessing: state.isProcessing,
    transcription: state.transcription,
    error: state.error,
    recordingDuration: state.recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    clearError,
    clearTranscription,
  };
};

// Helper function to send audio to backend as multipart file upload
// (base64 encoding was corrupting audio data - OGG CRC errors, M4A missing moov atom)
async function sendAudioForTranscription(
  uri: string,
  language: VoiceLanguage
): Promise<string> {
  try {
    // Normalize language code (fr-FR -> fr, en-US -> en)
    const langCode = language.split('-')[0];

    // Detect mimeType from file extension
    const ext = uri.split('.').pop()?.toLowerCase() || 'm4a';
    const mimeMap: Record<string, string> = {
      'amr': 'audio/amr',
      'wav': 'audio/wav',
      'm4a': 'audio/m4a',
      'mp4': 'audio/mp4',
      'webm': 'audio/webm',
      'ogg': 'audio/ogg',
      'mp3': 'audio/mpeg',
    };
    const mimeType = mimeMap[ext] || 'audio/m4a';

    // Get file info for logging
    const fileInfo = await FileSystem.getInfoAsync(uri);
    console.log('Sending audio file for transcription:', {
      uri,
      fileSize: (fileInfo as any).size,
      language: langCode,
      mimeType,
      ext,
    });

    // Send as multipart FormData (raw binary - no base64 encoding corruption)
    const formData = new FormData();
    formData.append('audio', {
      uri: uri,
      type: mimeType,
      name: `recording.${ext}`,
    } as any);
    formData.append('language', langCode);

    const response = await api.voice.transcribeFile(formData);

    if (response.data?.text) {
      return response.data.text;
    }
    
    throw new Error('No transcription received');
  } catch (error: any) {
    console.error('Transcription API error:', error);
    
    const status = error.response?.status || error.status;
    const detail = error.response?.data?.message || error.message || 'Unknown error';
    console.error('Transcription failed - status:', status, 'detail:', detail);
    
    if (status === 503 || error.message?.includes('network')) {
      throw new Error('Voice service temporarily unavailable. Please type your message instead.');
    }
    if (status === 413) {
      throw new Error('Audio recording too long. Please try a shorter recording.');
    }
    
    throw new Error(`Could not transcribe audio: ${detail}`);
  }
}
