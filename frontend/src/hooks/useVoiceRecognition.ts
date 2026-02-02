import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { api } from '../services/api';

export type VoiceLanguage = 'en-US' | 'fr-FR';

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

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
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

// Helper function to send audio to backend
async function sendAudioForTranscription(
  uri: string,
  language: VoiceLanguage
): Promise<string> {
  try {
    const base64Audio = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64' as const,
    });

    const response = await api.voice.transcribe({
      audioBase64: base64Audio,
      language,
      mimeType: 'audio/m4a',
    });

    if (response.data?.text) {
      return response.data.text;
    }
    
    throw new Error('No transcription received');
  } catch (error: any) {
    console.error('Transcription API error:', error);
    
    if (error.response?.status === 503 || error.message?.includes('network')) {
      throw new Error('Voice service temporarily unavailable. Please type your message instead.');
    }
    
    throw new Error('Could not transcribe audio. Please try again or type your message.');
  }
}
