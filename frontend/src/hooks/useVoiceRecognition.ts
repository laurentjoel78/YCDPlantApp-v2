import { useState, useEffect } from 'react';
import Voice, { 
    SpeechResultsEvent,
    SpeechErrorEvent,
} from '@react-native-voice/voice';

export const useVoiceRecognition = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [results, setResults] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const onSpeechResults = (e: SpeechResultsEvent) => {
            setResults(e.value ?? []);
        };

        const onSpeechError = (e: SpeechErrorEvent) => {
            setError(e.error?.message ?? 'Erreur inconnue');
            setIsRecording(false);
        };

        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechError = onSpeechError;

        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, []);

    const startRecording = async () => {
        try {
            setError(null);
            setResults([]);
            await Voice.start('fr-FR'); // French language
            setIsRecording(true);
        } catch (e) {
            setError('Erreur lors du démarrage de l\'enregistrement');
            console.error(e);
        }
    };

    const stopRecording = async () => {
        try {
            await Voice.stop();
            setIsRecording(false);
        } catch (e) {
            setError('Erreur lors de l\'arrêt de l\'enregistrement');
            console.error(e);
        }
    };

    return {
        isRecording,
        results,
        error,
        startRecording,
        stopRecording,
    };
};