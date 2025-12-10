import { useState } from 'react';
import { Alert } from 'react-native';

// Stub implementation - voice recognition temporarily disabled
// TODO: Re-enable when @react-native-voice/voice is updated for AndroidX compatibility

export const useVoiceRecognition = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [results, setResults] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const startRecording = async () => {
        Alert.alert(
            'Voice Recognition',
            'Voice recognition is coming soon! This feature will be available in a future update.',
            [{ text: 'OK' }]
        );
        // Simulate a brief recording state for UX
        setIsRecording(true);
        setError(null);
        setResults([]);

        setTimeout(() => {
            setIsRecording(false);
            setResults(['Voice recognition coming soon']);
        }, 1000);
    };

    const stopRecording = async () => {
        setIsRecording(false);
    };

    return {
        isRecording,
        results,
        error,
        startRecording,
        stopRecording,
    };
};
